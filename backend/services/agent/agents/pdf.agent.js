import { getModel } from "../config/llmModels.js";
import generatePdf from "../utils/generatePdf.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

export const pdfAgent = async (state) => {
  try {
    const llm = await getModel("pdf");

    const prompt = `
You are an expert document writer.

Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return explanations.
Do NOT wrap the response in code fences.

Structure:

{
  "title": "",
  "subtitle": "",
  "sections": [
    {
      "heading": "",
      "points": []
    }
  ]
}

Requirements:

- Generate 4-8 sections.
- Each section should have 3-6 concise bullet points.
- Keep the content accurate and useful.
- "points" must be an array of strings.

Topic:
${state.prompt}
`;

    const res = await llm.invoke(prompt);

    // Remove accidental markdown code fences
    const rawContent = String(res?.content || "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Convert LLM response into an object
    const pdfData = JSON.parse(rawContent);

    console.log("📄 PDF Agent Result:", pdfData);

    // Generate actual PDF
    const pdfBuffer = await generatePdf(pdfData);

    console.log("✅ PDF generated successfully");

    // Generate unique filename
    const filename = `${Date.now()}-${pdfData.title
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()}.pdf`;

    // Upload PDF to S3
    await uploadToS3(
      filename,
      pdfBuffer,
      "application/pdf"
    );

    console.log("☁️ PDF uploaded to S3:", filename);

    // Generate temporary download URL
    const downloadUrl = await getFromS3(
      filename,
      24 * 60 * 60
    );

    console.log("🔗 PDF Download URL generated");

    return {
      ...state,

      aiResponse: `
### 📄 PDF Generated Successfully

**${pdfData.title}**

[⬇️ Download PDF](${downloadUrl})

> 🕒 **Link expires in 24 hours.**
      `.trim(),

      artifacts: [
        {
          ...pdfData,
           type: "pdf",
          downloadUrl,
        },
      ],

      images: [],
    };
  } catch (error) {
    console.error("❌ PDF Agent Error:", error);

    return {
      ...state,

      aiResponse: `❌ Failed to generate PDF: ${error.message}`,

      artifacts: [],

      images: [],
    };
  }

}
import { getModel } from "../config/llmModels.js";

import generatePdf from "../utils/generatePdf.js";

import { uploadToS3 } from "../utils/uploadToS3.js";

import { getFromS3 } from "../utils/getFromS3.js";

import { deductCredits } from "../utils/deductCredits.js";

import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfAgent = async (state) => {
  try {
    // --------------------------------------------------
    // Check PDF agent rate limit
    // --------------------------------------------------
    await checkAgentLimit(
      state.userId,
      "pdf"
    );

    // --------------------------------------------------
    // Get PDF model
    // --------------------------------------------------
    const llm = getModel("pdf");

    // --------------------------------------------------
    // PDF generation prompt
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Generate document content
    // --------------------------------------------------
    const res = await llm.invoke(prompt);

    // --------------------------------------------------
    // Clean LLM response
    // --------------------------------------------------
    const rawContent = String(
      res?.content || ""
    )
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!rawContent) {
      throw new Error(
        "PDF model returned an empty response."
      );
    }

    // --------------------------------------------------
    // Parse JSON
    // --------------------------------------------------
    let pdfData;

    try {
      pdfData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error(
        "❌ PDF JSON PARSE ERROR:",
        parseError
      );

      console.error(
        "INVALID PDF RESPONSE:",
        rawContent
      );

      throw new Error(
        "The PDF agent returned invalid JSON."
      );
    }

    // --------------------------------------------------
    // Validate PDF structure
    // --------------------------------------------------
    if (
      !pdfData ||
      typeof pdfData !== "object"
    ) {
      throw new Error(
        "Invalid PDF data received from AI."
      );
    }

    if (!pdfData.title) {
      pdfData.title = "NexusAI Document";
    }

    if (!pdfData.subtitle) {
      pdfData.subtitle =
        `Document about ${state.prompt}`;
    }

    if (!Array.isArray(pdfData.sections)) {
      throw new Error(
        "PDF sections must be an array."
      );
    }

    if (pdfData.sections.length === 0) {
      throw new Error(
        "No PDF sections were generated."
      );
    }

    // --------------------------------------------------
    // Normalize sections
    // --------------------------------------------------
    pdfData.sections = pdfData.sections
      .slice(0, 8)
      .map((section, index) => {
        const points = Array.isArray(
          section?.points
        )
          ? section.points
              .map((point) =>
                String(point).trim()
              )
              .filter(Boolean)
              .slice(0, 6)
          : [];

        return {
          heading:
            section?.heading ||
            `Section ${index + 1}`,
          points,
        };
      });

    console.log(
      "📄 PDF DATA:",
      JSON.stringify(
        pdfData,
        null,
        2
      )
    );

    // --------------------------------------------------
    // Generate actual PDF
    // --------------------------------------------------
    const pdfBuffer =
      await generatePdf(pdfData);

    if (!pdfBuffer) {
      throw new Error(
        "PDF generation failed."
      );
    }

    console.log(
      "✅ PDF generated successfully"
    );

    // --------------------------------------------------
    // Generate unique filename
    // --------------------------------------------------
    const safeTitle = String(
      pdfData.title
    )
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    const filename = `${Date.now()}-${
      safeTitle || "nexusai-document"
    }.pdf`;

    // --------------------------------------------------
    // Upload PDF to S3
    // --------------------------------------------------
    await uploadToS3(
      filename,
      pdfBuffer,
      "application/pdf"
    );

    console.log(
      "☁️ PDF uploaded to S3:",
      filename
    );

    // --------------------------------------------------
    // Generate temporary download URL
    // --------------------------------------------------
    const downloadUrl =
      await getFromS3(
        filename,
        24 * 60 * 60
      );

    if (!downloadUrl) {
      throw new Error(
        "Failed to generate PDF download URL."
      );
    }

    console.log(
      "🔗 PDF Download URL generated"
    );

    // --------------------------------------------------
    // Deduct credits ONLY after successful PDF
    // generation + upload
    // --------------------------------------------------
    const creditResult =
      await deductCredits(
        state.userId,
        "pdf"
      );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 PDF CREDITS REMAINING:",
      creditResult.credits
    );

    // --------------------------------------------------
    // Return response + remaining credits
    // --------------------------------------------------
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

      credits: creditResult.credits,
    };
  } catch (error) {
    console.error(
      "❌ PDF Agent Error:",
      error
    );

    // --------------------------------------------------
    // Safely extract provider error message
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while generating the PDF.";

    // --------------------------------------------------
    // Rate limit
    // --------------------------------------------------
    if (error?.status === 429) {
      console.warn(
        "⚠️ PDF RATE LIMIT:",
        errorMessage
      );

      return {
        ...state,

        aiResponse:
          `⚠️ ${errorMessage}`,

        artifacts: [],

        images: [],

        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Other errors
    // --------------------------------------------------
    return {
      ...state,

      aiResponse:
        `❌ Failed to generate PDF: ${errorMessage}`,

      artifacts: [],

      images: [],

      credits: state.credits,
    };
  }
};
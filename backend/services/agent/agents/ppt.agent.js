import { getModel } from "../config/llmModels.js";
import generatePpt from "../utils/generatePpt.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pptAgent = async (state) => {
  try {
    // --------------------------------------------------
    // Get PPT model
    // --------------------------------------------------

    const llm = await getModel("ppt");

    // --------------------------------------------------
    // PPT generation prompt
    // --------------------------------------------------

    const prompt = `
You are a professional presentation designer.

Your task is to create a professional PowerPoint presentation.

Return ONLY valid JSON.

Format:

{
  "title": "",
  "subtitle": "",
  "slides": [
    {
      "title": "",
      "points": [
        "",
        "",
        "",
        ""
      ]
    }
  ]
}

Rules:

- Generate exactly 6 content slides.
- Each slide must contain 4-6 concise bullet points.
- Keep bullet points informative and easy to understand.
- Use professional presentation language.
- Do not use markdown.
- Do not use code blocks.
- Do not include explanations.
- Do not include comments.
- Return ONLY valid JSON.
- Do not add anything before or after the JSON.

Topic:

${state.prompt}
`;

    // --------------------------------------------------
    // Invoke LLM
    // --------------------------------------------------

    const res = await llm.invoke(prompt);

    // --------------------------------------------------
    // Get raw response
    // --------------------------------------------------

    let rawContent = res?.content || "";
    await deductCredits(state.userId,"ppt")

    // LangChain models can sometimes return content as an array
    if (Array.isArray(rawContent)) {
      rawContent = rawContent
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return item?.text || "";
        })
        .join("");
    }

    rawContent = String(rawContent).trim();

    console.log("PPT RAW RESPONSE:");
    console.log(rawContent);

    // --------------------------------------------------
    // Remove markdown code fences if AI adds them
    // --------------------------------------------------

    rawContent = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // --------------------------------------------------
    // Parse JSON
    // --------------------------------------------------

    let data;

    try {
      data = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("PPT JSON PARSE ERROR:", parseError);
      console.error("INVALID PPT RESPONSE:", rawContent);

      return {
        ...state,
        aiResponse:
          "Sorry, I could not generate the presentation because the AI returned an invalid response.",
        artifacts: [],
      };
    }

    // --------------------------------------------------
    // Validate PPT data
    // --------------------------------------------------

    if (!data || typeof data !== "object") {
      throw new Error("Invalid PPT data received from AI.");
    }

    if (!data.title) {
      data.title = "NexusAI Presentation";
    }

    if (!data.subtitle) {
      data.subtitle = `Presentation about ${state.prompt}`;
    }

    if (!Array.isArray(data.slides)) {
      throw new Error("PPT slides must be an array.");
    }

    // --------------------------------------------------
    // Keep maximum 6 content slides
    // --------------------------------------------------

    data.slides = data.slides.slice(0, 6);

    if (data.slides.length === 0) {
      throw new Error("No slides were generated.");
    }

    // --------------------------------------------------
    // Normalize slide data
    // --------------------------------------------------

    data.slides = data.slides.map((slide, index) => {
      let points = [];

      if (Array.isArray(slide?.points)) {
        points = slide.points
          .map((point) => String(point).trim())
          .filter(Boolean)
          .slice(0, 6);
      }

      return {
        title: slide?.title || `Slide ${index + 1}`,
        points,
      };
    });

    console.log("PPT DATA:");
    console.log(JSON.stringify(data, null, 2));

    // --------------------------------------------------
    // Generate PowerPoint
    // --------------------------------------------------

    const ppt = await generatePpt(data);

    if (!ppt) {
      throw new Error("PowerPoint generation failed.");
    }

    // --------------------------------------------------
    // Convert PPT to buffer
    // --------------------------------------------------

    const buffer = await ppt.write({
      outputType: "nodebuffer",
    });

    if (!buffer) {
      throw new Error("Failed to create PowerPoint buffer.");
    }

    console.log("PPT BUFFER CREATED");

    // --------------------------------------------------
    // Upload PPT to S3
    // --------------------------------------------------

    const filename = `ppt-${Date.now()}.pptx`;

    const contentType =
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    const uploadResult = await uploadToS3(
      filename,
      buffer,
      contentType
    );

    console.log("PPT UPLOADED TO S3:");
    console.log(uploadResult);

    // --------------------------------------------------
    // Generate signed download URL
    // --------------------------------------------------

    const downloadUrl = await getFromS3(
      filename,
      24 * 60 * 60
    );

    if (!downloadUrl) {
      throw new Error(
        "Failed to generate PPT download URL."
      );
    }

    console.log("PPT DOWNLOAD URL CREATED");

    // --------------------------------------------------
    // Create PPT artifact
    // --------------------------------------------------

    const pptArtifact = {
      type: "ppt",
      title: data.title,
      subtitle: data.subtitle,
      filename,
      downloadUrl,

      // Important:
      // Send the complete slide data to frontend
      // so Artifact.jsx can render the preview.
      slides: data.slides,
    };

    console.log(
      "PPT ARTIFACT:",
      JSON.stringify(pptArtifact, null, 2)
    );

    // --------------------------------------------------
    // Return response
    // --------------------------------------------------

    return {
      ...state,

      aiResponse: `
# Presentation Generated

**${data.title}**

${data.subtitle || ""}

[Download PPT](${downloadUrl})

*The download link expires in 24 hours.*
`.trim(),

      // Used by Artifact.jsx
      artifacts: [pptArtifact],

      // Keep ppt as well if other parts of your
      // application already use state.ppt.
      ppt: pptArtifact,
    };
  } catch (error) {
    console.error("PPT AGENT ERROR:", error);

    return {
      ...state,

      aiResponse: `
Sorry, I couldn't generate the PowerPoint presentation.

Error: ${error.message}
`.trim(),

      artifacts: [],
    };
  }
};

export default pptAgent;

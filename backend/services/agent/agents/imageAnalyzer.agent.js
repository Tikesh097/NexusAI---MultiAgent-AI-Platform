import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { getModel } from "../config/llmModels.js";
import fs from "fs/promises";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const imageAnalyzer = async (state) => {
  try {
    // --------------------------------------------------
    // Check rate limit
    // --------------------------------------------------
    await checkAgentLimit(
      state.userId,
      "image"
    );

    // --------------------------------------------------
    // Validate uploaded file
    // --------------------------------------------------
    if (!state.file?.path) {
      throw new Error(
        "No image file was provided."
      );
    }

    // --------------------------------------------------
    // Get image analyzer model
    // --------------------------------------------------
    const llm = getModel("imageAnalyzer");

    // --------------------------------------------------
    // Read image
    // --------------------------------------------------
    const imageBuffer = await fs.readFile(
      state.file.path
    );

    const base64Image =
      imageBuffer.toString("base64");

    // --------------------------------------------------
    // Build multimodal messages
    // --------------------------------------------------
    const messages = [
      new SystemMessage(`
You are NexusAI image analyzer Agent.

Rules:
- Analyze only the uploaded image.
- Answer the user's question accurately.
- If text exists in the image, extract it.
- If charts or tables exist, explain them.
- If something is unclear, say so.
- Use Markdown when helpful.
- Do not hallucinate.
`),

      new HumanMessage({
        content: [
          {
            type: "text",
            text:
              state.prompt ||
              "analyze the image",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${state.file.mimetype};base64,${base64Image}`,
            },
          },
        ],
      }),
    ];

    // --------------------------------------------------
    // Generate response
    // --------------------------------------------------
    const response =
      await llm.invoke(messages);

    const aiResponse =
      typeof response?.content === "string"
        ? response.content
        : JSON.stringify(
            response?.content || ""
          );

    // --------------------------------------------------
    // Deduct credits only after successful analysis
    // --------------------------------------------------
    const creditResult =
      await deductCredits(
        state.userId,
        "vision"
      );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 IMAGE ANALYZER CREDITS REMAINING:",
      creditResult.credits
    );

    // --------------------------------------------------
    // Return response + remaining credits
    // --------------------------------------------------
    return {
      ...state,

      aiResponse,

      credits:
        creditResult.credits,
    };
  } catch (error) {
    console.error(
      "❌ ImageAnalyzer Agent Error:",
      error
    );

    // --------------------------------------------------
    // Safely extract error message
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Failed to analyze the image.";

    // --------------------------------------------------
    // Rate limit
    // --------------------------------------------------
    if (error?.status === 429) {
      return {
        ...state,
        aiResponse:
          `⚠️ ${errorMessage}`,
        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Other errors
    // --------------------------------------------------
    return {
      ...state,
      aiResponse:
        `❌ ${errorMessage}`,
      credits: state.credits,
    };
  } finally {
    // --------------------------------------------------
    // Remove uploaded temporary file
    // --------------------------------------------------
    if (state.file?.path) {
      try {
        await fs.unlink(
          state.file.path
        );
      } catch (unlinkError) {
        console.error(
          "Failed to remove uploaded file:",
          unlinkError.message
        );
      }
    }
  }
};
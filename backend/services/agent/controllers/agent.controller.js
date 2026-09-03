import axios from "axios";

import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res) => {
  try {
    const {
      prompt,
      conversationId,
      agent: selectedAgent = "auto",
    } = req.body;

    const file = req.file;
    const userId = req.headers["x-user-id"];
    const trimmedPrompt = prompt?.trim();

    // Validate request
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID is missing.",
      });
    }

    if (!trimmedPrompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required.",
      });
    }

    const chatRequestConfig = {
      headers: {
        "x-user-id": userId,
        "x-internal-service-secret":
          process.env.AGENT_SERVICE_SECRET,
      },
      timeout: 10000,
    };

    // Save the user message permanently
    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "user",
        content: trimmedPrompt,
      },
      chatRequestConfig
    );

    // Run the selected AI graph
    const result = await graph.invoke({
      prompt: trimmedPrompt,
      conversationId,
      agent: selectedAgent,
      userId,
      file,
    });

    // Extract graph result
    const aiResponse =
      typeof result?.aiResponse === "string"
        ? result.aiResponse.trim()
        : "";

    const images = Array.isArray(result?.images)
      ? result.images
      : [];

    const artifacts = Array.isArray(result?.artifacts)
      ? result.artifacts
      : [];

    if (!aiResponse) {
      throw new Error("AI agent returned an empty response.");
    }

    // Do not treat an agent error message as a successful response
    if (aiResponse.startsWith("❌")) {
      throw new Error(
        aiResponse.replace(/^❌\s*/, "") ||
          "AI agent request failed."
      );
    }

    // Update user-specific Redis memory
    await addMessage(
      conversationId,
      userId,
      "user",
      trimmedPrompt
    );

    await addMessage(
      conversationId,
      userId,
      "assistant",
      aiResponse
    );

    // Save the assistant response permanently
    await axios.post(
      `${process.env.CHAT_SERVICE}/save-message`,
      {
        conversationId,
        role: "assistant",
        content: aiResponse,
        images,
        artifacts,
      },
      chatRequestConfig
    );

    console.log("Agent request completed:", {
      conversationId,
      selectedAgent,
      credits: result?.credits,
    });

    return res.status(200).json({
      success: true,
      answer: aiResponse,
      images,
      artifacts,
      credits: result?.credits,
    });
  } catch (error) {
    const status =
      error.response?.status ||
      error.status ||
      500;

    const message =
      error.response?.data?.message ||
      error.message ||
      "Agent error";

    console.error("Agent error:", message);

    return res.status(status).json({
      success: false,
      message,
      answer: "",
      images: [],
      artifacts: [],
    });
  }
};
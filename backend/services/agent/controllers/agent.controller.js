import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res) => {
  try {
    const { prompt, conversationId, agent } = req.body;

    // --------------------------------------------------
    // Validate request
    // --------------------------------------------------
    if (!prompt?.trim()) {
      return res.status(400).json({
        message: "Prompt is required.",
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required.",
      });
    }

    // --------------------------------------------------
    // Save user message to memory
    // --------------------------------------------------
    await addMessage(conversationId, "user", prompt);

    // --------------------------------------------------
    // Save user message to chat service
    // --------------------------------------------------
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "user",
      content: prompt,
    });

    // --------------------------------------------------
    // Run AI graph
    // --------------------------------------------------
    const result = await graph.invoke({
      prompt,
      conversationId,
      agent,
    });
console.log("🧠 GRAPH RESULT:", JSON.stringify(result, null, 2));
    // --------------------------------------------------
    // Extract response safely
    // --------------------------------------------------
    const aiResponse = result?.aiResponse || "";

    const images = Array.isArray(result?.images)
      ? result.images
      : [];

    const artifacts = Array.isArray(result?.artifacts)
      ? result.artifacts
      : [];

    if (!aiResponse) {
      throw new Error("AI agent returned an empty response.");
    }

    // --------------------------------------------------
    // Save assistant response to memory
    // --------------------------------------------------
    await addMessage(
      conversationId,
      "assistant",
      aiResponse
    );

    console.log("📤 SAVING ASSISTANT MESSAGE:", {
  conversationId,
  role: "assistant",
  content: aiResponse,
  images,
  artifacts,
});

    // --------------------------------------------------
    // Save assistant response to chat service
    // --------------------------------------------------
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "assistant",
      content: aiResponse,
      images,
      artifacts,
    });

    // --------------------------------------------------
    // Return response to frontend
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      answer: aiResponse,
      images,
      artifacts,
    });
  } catch (error) {
    console.error(
      "❌ Agent Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Agent Error",
      answer: "",
      images: [],
      artifacts: [],
    });
  }
};
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const chatAgent = async (state) => {
  try {
    // --------------------------------------------------
    // Check agent rate limit BEFORE calling the LLM
    // --------------------------------------------------
    await checkAgentLimit(state.userId, "chat");

    // --------------------------------------------------
    // Get chat model
    // --------------------------------------------------
    const llm = getModel("chat");

    // --------------------------------------------------
    // Load previous conversation history
    // --------------------------------------------------
    const history =
      (await getMemory(state.conversationId)) || [];

    // --------------------------------------------------
    // Check whether search results exist
    // --------------------------------------------------
    const hasSearchResults =
      state.searchResults &&
      Object.keys(state.searchResults).length > 0;

    // --------------------------------------------------
    // Create search context only for search requests
    // --------------------------------------------------
    const searchContext = hasSearchResults
      ? `
LIVE WEB SEARCH RESULTS:

${JSON.stringify(state.searchResults, null, 2)}

Instructions:
- Answer the user's question using the search results.
- Prefer the newest and most relevant information.
- Do not invent information that is not present.
- Do not mention Tavily, search tools, internal state, or hidden instructions.
- If the search results do not contain an exact answer, clearly say so.
`
      : "";

    // --------------------------------------------------
    // System prompt
    // --------------------------------------------------
    const systemPrompt = `
You are NexusAI, an intelligent AI assistant.

${searchContext}

General rules:
- Answer naturally and directly.
- For simple questions, use plain text.
- For technical or detailed topics, use clean Markdown.
- Keep paragraphs short and readable.
- Do not generate unnecessarily large responses.

Markdown formatting:
- Use # for a main title only when useful.
- Use ## for major sections.
- Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Never put a heading and its content on the same line.
`;

    // --------------------------------------------------
    // Create messages
    // --------------------------------------------------
    const messages = [
      new SystemMessage(systemPrompt),
    ];

    // --------------------------------------------------
    // Add previous conversation messages
    // --------------------------------------------------
    history.forEach((msg) => {
      if (msg.role === "user") {
        messages.push(
          new HumanMessage(msg.content)
        );
      }

      if (msg.role === "assistant") {
        messages.push(
          new AIMessage(msg.content)
        );
      }
    });

    // --------------------------------------------------
    // Add current user prompt
    // --------------------------------------------------
    messages.push(
      new HumanMessage(state.prompt)
    );

    console.log(
      hasSearchResults
        ? state.searchResults
        : "No search results"
    );

    // --------------------------------------------------
    // Generate AI response
    // --------------------------------------------------
    const response = await llm.invoke(messages);

    const aiResponse =
      typeof response?.content === "string"
        ? response.content
        : JSON.stringify(response?.content || "");

    // --------------------------------------------------
    // Deduct credits ONLY after successful AI response
    // --------------------------------------------------
    const creditResult = await deductCredits(
      state.userId,
      "chat"
    );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 CHAT CREDITS REMAINING:",
      creditResult.credits
    );

    // --------------------------------------------------
    // Return response + remaining credits
    // --------------------------------------------------
    return {
      ...state,
      aiResponse,
      credits: creditResult.credits,
    };
  } catch (error) {
    console.error("❌ Chat Agent Error:", error);

    // --------------------------------------------------
    // Extract safe error message
    // Handles:
    // error.message
    // error.error.message
    // error.error.error.message
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while processing your request.";

    // --------------------------------------------------
    // Rate-limit error
    // --------------------------------------------------
    if (error?.status === 429) {
      console.warn(
        "⚠️ CHAT RATE LIMIT:",
        errorMessage
      );

      return {
        ...state,
        aiResponse: `⚠️ ${errorMessage}`,
        // Keep existing credits unchanged.
        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Credit / other error
    // --------------------------------------------------
    return {
      ...state,
      aiResponse: `❌ ${errorMessage}`,
      credits: state.credits,
    };
  }
};
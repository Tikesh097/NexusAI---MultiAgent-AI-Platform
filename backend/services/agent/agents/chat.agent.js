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
    // Validate required state values
    if (!state.userId) {
      throw new Error("User ID is required");
    }

    if (!state.conversationId) {
      throw new Error("Conversation ID is required");
    }

    const trimmedPrompt = state.prompt?.trim();

    if (!trimmedPrompt) {
      throw new Error("Prompt is required");
    }

    // Check the agent rate limit before calling the LLM
    await checkAgentLimit(state.userId, "chat");

    // Get the chat model
    const llm = getModel("chat");

    // Load previous conversation history
    const history =
      (await getMemory(
        state.conversationId,
        state.userId
      )) || [];

    // Check whether search results exist
    const hasSearchResults =
      state.searchResults &&
      typeof state.searchResults === "object" &&
      Object.keys(state.searchResults).length > 0;

    // Create search context only for search requests
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

    // System prompt
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

    // Create the LangChain message array
    const messages = [new SystemMessage(systemPrompt)];

    // Add previous conversation messages
    history.forEach((message) => {
      if (!message?.content) {
        return;
      }

      if (message.role === "user") {
        messages.push(
          new HumanMessage(message.content)
        );
      }

      if (message.role === "assistant") {
        messages.push(
          new AIMessage(message.content)
        );
      }
    });

    /*
     * The controller saves the current user message before invoking
     * the graph. On a cache miss, that message may already be present
     * in the history returned by the Chat Service.
     */
    const lastMessage = history.at(-1);

    const currentPromptAlreadyExists =
      lastMessage?.role === "user" &&
      typeof lastMessage?.content === "string" &&
      lastMessage.content.trim() === trimmedPrompt;

    // Add the current prompt only when it is not already in history
    if (!currentPromptAlreadyExists) {
      messages.push(
        new HumanMessage(trimmedPrompt)
      );
    }

    console.log(
      hasSearchResults
        ? state.searchResults
        : "No search results"
    );

    // Generate the AI response
    const response = await llm.invoke(messages);

    const aiResponse =
      typeof response?.content === "string"
        ? response.content.trim()
        : JSON.stringify(response?.content || "");

    if (!aiResponse) {
      throw new Error(
        "The AI model returned an empty response"
      );
    }

    // Deduct credits only after successful generation
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

    // Return response and remaining credits
    return {
      ...state,
      prompt: trimmedPrompt,
      aiResponse,
      credits: creditResult.credits,
    };
  } catch (error) {
    console.error("❌ Chat Agent Error:", error);

    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while processing your request.";

    // Handle rate-limit errors
    if (
      error?.status === 429 ||
      error?.response?.status === 429
    ) {
      console.warn(
        "⚠️ CHAT RATE LIMIT:",
        errorMessage
      );

      return {
        ...state,
        aiResponse: `⚠️ ${errorMessage}`,
        credits: state.credits,
      };
    }

    // Return a controlled agent error
    return {
      ...state,
      aiResponse: `❌ ${errorMessage}`,
      credits: state.credits,
    };
  }
};
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";

export const chatAgent = async (state) => {
  try {
    const llm = await getModel("chat");

    // Load previous conversation history
    const history = (await getMemory(state.conversationId)) || [];

    // Check whether search results exist
    const hasSearchResults =
      state.searchResults && Object.keys(state.searchResults).length > 0;

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

    const messages = [new SystemMessage(systemPrompt)];

    // Add previous conversation messages
    history.forEach((msg) => {
      if (msg.role === "user") {
        messages.push(new HumanMessage(msg.content));
      }

      if (msg.role === "assistant") {
        messages.push(new AIMessage(msg.content));
      }
    });

    // Add current user prompt
    messages.push(new HumanMessage(state.prompt));

    console.log(hasSearchResults ? state.searchResults : "No search results");

  

    // Generate final response
    const response = await llm.invoke(messages);

    const aiResponse =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return {
      ...state,
      aiResponse,
    };
  } catch (error) {
    console.error("Chat Agent Error:", error.message);

    throw error;
  }
};

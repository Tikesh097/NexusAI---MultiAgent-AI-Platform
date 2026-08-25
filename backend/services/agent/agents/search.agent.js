import { checkAgentLimit } from "../config/agentLimit.js";
import { searchTool } from "../config/tavily.js";
import { deductCredits } from "../utils/deductCredits.js";

const isCurrentTimeQuery = (prompt = "") => {
  return /current\s+time|what\s+time\s+is\s+it|time\s+now|time\s+in\s+india|india\s+time|ist\s+time/i.test(
    prompt
  );
};

const getIndiaTime = () => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
};

// Reduce Tavily data before sending it to the Chat Agent
const formatSearchResults = (results = []) => {
  return results.slice(0, 3).map((result) => ({
    title: result.title || "Untitled",
    url: result.url || "",
    content: result.content?.slice(0, 1200) || "",
    score: result.score || 0,
  }));
};

export const searchAgent = async (state) => {
  try {
    // --------------------------------------------------
    // Check search rate limit
    // --------------------------------------------------
    await checkAgentLimit(
      state.userId,
      "search"
    );

    const prompt = state.prompt?.trim() || "";

    console.log("Search agent invoked");
    console.log("Search prompt:", prompt);

    // --------------------------------------------------
    // Prevent empty search request
    // --------------------------------------------------
    if (!prompt) {
      return {
        ...state,
        searchResults: {
          type: "error",
          answer: "Please enter a search query.",
          results: [],
          images: [],
        },
        images: [],
        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Handle live India time without Tavily
    // --------------------------------------------------
    if (isCurrentTimeQuery(prompt)) {
      const currentTime = getIndiaTime();

      console.log(
        "Live India time generated:",
        currentTime
      );

      return {
        ...state,
        searchResults: {
          type: "live-time",
          answer: `The current time in India is ${currentTime} (IST).`,
          currentTime,
          timezone: "India Standard Time (IST)",
          utcOffset: "UTC+05:30",
          results: [],
          images: [],
        },
        images: [],
        // No credit deduction for local time
        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Use Tavily for normal web searches
    // --------------------------------------------------
    const tavilyResponse =
      await searchTool.invoke({
        query: prompt,
      });

    // --------------------------------------------------
    // Keep only top 3 results
    // --------------------------------------------------
    const limitedResults =
      formatSearchResults(
        tavilyResponse?.results || []
      );

    // --------------------------------------------------
    // Keep only first 5 images
    // --------------------------------------------------
    const limitedImages = (
      tavilyResponse?.images || []
    ).slice(0, 5);

    console.log(
      "Tavily results found:",
      limitedResults.length
    );

    // --------------------------------------------------
    // Deduct search credits after successful search
    // --------------------------------------------------
    const creditResult =
      await deductCredits(
        state.userId,
        "search"
      );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 SEARCH CREDITS REMAINING:",
      creditResult.credits
    );

    // --------------------------------------------------
    // Return search results + credits
    // --------------------------------------------------
    return {
      ...state,

      searchResults: {
        type: "web-search",
        query: prompt,
        answer:
          tavilyResponse?.answer || null,
        results: limitedResults,
        images: limitedImages,
      },

      images: limitedImages,

      credits:
        creditResult.credits,
    };
  } catch (error) {
    console.error(
      "❌ Search Agent Error:",
      error
    );

    // --------------------------------------------------
    // Safely extract provider error
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while searching.";

    // --------------------------------------------------
    // Rate limit
    // --------------------------------------------------
    if (error?.status === 429) {
      console.warn(
        "⚠️ SEARCH RATE LIMIT:",
        errorMessage
      );

      return {
        ...state,

        searchResults: {
          type: "error",
          answer: `⚠️ ${errorMessage}`,
          results: [],
          images: [],
        },

        images: [],

        // Preserve existing balance
        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Other errors
    // --------------------------------------------------
    return {
      ...state,

      searchResults: {
        type: "error",
        answer: `❌ ${errorMessage}`,
        results: [],
        images: [],
      },

      images: [],

      credits: state.credits,
    };
  }
};

export default searchAgent;
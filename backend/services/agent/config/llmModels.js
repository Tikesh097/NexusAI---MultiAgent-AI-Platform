import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

const groq = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
});

const gemini = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash",
});

const openrouter = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 8000,
});


export const getModel = (agent) => {
  switch (agent) {
    case "chat":
      return groq;

    case "search":
      return groq;

    case "coding":
      return openrouter;

    case "imageAnalyzer":
      return gemini;

    default:
      return groq;
  }
};
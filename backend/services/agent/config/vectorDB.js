import dotenv from "dotenv";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

dotenv.config();

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
});

export const vectorStore = async (docs, collectionName) => {
  try {
    if (!docs || !Array.isArray(docs) || docs.length === 0) {
      throw new Error("No documents provided for vector store");
    }

    if (!process.env.QDRANT_URL) {
      throw new Error("QDRANT_URL is not configured");
    }

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    return await QdrantVectorStore.fromDocuments(
      docs,
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName,
      }
    );
  } catch (error) {
    console.error("Qdrant Vector Store Error:", error);
    throw error;
  }
};
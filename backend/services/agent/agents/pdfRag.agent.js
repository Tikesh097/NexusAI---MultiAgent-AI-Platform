import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDB.js";
import { getModel } from "../config/llmModels.js";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { checkAgentLimit } from "../config/agentLimit.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pdfRag = async (state) => {
  try {
    // --------------------------------------------------
    // Check PDF agent rate limit
    // --------------------------------------------------
    await checkAgentLimit(
      state.userId,
      "pdf"
    );

    // --------------------------------------------------
    // Validate request
    // --------------------------------------------------
    if (!state.file?.path) {
      throw new Error(
        "PDF file path is missing."
      );
    }

    if (!state.prompt?.trim()) {
      throw new Error(
        "User prompt is missing."
      );
    }

    // --------------------------------------------------
    // Read PDF
    // --------------------------------------------------
    const buffer = fs.readFileSync(
      state.file.path
    );

    const pdf = new PDFParse({
      data: buffer,
    });

    // --------------------------------------------------
    // Extract PDF text
    // --------------------------------------------------
    const result =
      await pdf.getText();

    const text = result?.text || "";

    if (!text.trim()) {
      throw new Error(
        "No readable text could be extracted from PDF."
      );
    }

    // --------------------------------------------------
    // Split PDF into chunks
    // --------------------------------------------------
    const splitter =
      new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

    const docs =
      await splitter.createDocuments([text]);

    if (!docs.length) {
      throw new Error(
        "No text chunks were created from the PDF."
      );
    }

    // --------------------------------------------------
    // Create Qdrant vector store
    // --------------------------------------------------
    const collectionName = `pdf-${Date.now()}`;

    const store = await vectorStore(
      docs,
      collectionName
    );

    // --------------------------------------------------
    // Search relevant chunks
    // --------------------------------------------------
    const relevantDocs =
      await store.similaritySearch(
        state.prompt,
        5
      );

    const context = relevantDocs
      .map(
        (doc) =>
          doc?.pageContent || ""
      )
      .filter(Boolean)
      .join("\n\n");

    if (!context.trim()) {
      throw new Error(
        "No relevant information was found in the uploaded PDF."
      );
    }

    // --------------------------------------------------
    // Get PDF RAG model
    // --------------------------------------------------
    const llm = getModel("pdf-rag");

    // --------------------------------------------------
    // Build messages
    // --------------------------------------------------
    const messages = [
      new SystemMessage(`
You are NexusAI PDF Assistant.

Rules:
- Answer ONLY from the uploaded PDF.
- Never make up information.
- If the answer is not present in the PDF, reply exactly:
"I couldn't find this information in the uploaded PDF."
- Use Markdown formatting.
`),

      new HumanMessage(`
Context from uploaded PDF:

${context}

Question:

${state.prompt}
`),
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

    if (!aiResponse.trim()) {
      throw new Error(
        "PDF RAG returned an empty response."
      );
    }

    // --------------------------------------------------
    // Deduct credits ONLY after successful answer
    // --------------------------------------------------
    const creditResult =
      await deductCredits(
        state.userId,
        "pdf"
      );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 PDF RAG CREDITS REMAINING:",
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
      "❌ PdfRag Agent Error:",
      error
    );

    // --------------------------------------------------
    // Safely extract provider error
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while analyzing the PDF.";

    // --------------------------------------------------
    // Rate-limit error
    // --------------------------------------------------
    if (error?.status === 429) {
      console.warn(
        "⚠️ PDF RAG RATE LIMIT:",
        errorMessage
      );

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
        `❌ Failed to analyze PDF: ${errorMessage}`,
      credits: state.credits,
    };
  } finally {
    // --------------------------------------------------
    // Delete temporary PDF
    // --------------------------------------------------
    if (
      state.file?.path &&
      fs.existsSync(state.file.path)
    ) {
      try {
        fs.unlinkSync(
          state.file.path
        );
      } catch (unlinkError) {
        console.error(
          "Failed to delete temporary PDF:",
          unlinkError.message
        );
      }
    }
  }
};
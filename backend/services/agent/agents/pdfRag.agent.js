import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDB.js";
import { getModel } from "../config/llmModels.js";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

export const pdfRag = async (state) => {
  try {
    if (!state.file?.path) {
      throw new Error("PDF file path is missing");
    }

    if (!state.prompt) {
      throw new Error("User prompt is missing");
    }

    // Read PDF
    const buffer = fs.readFileSync(state.file.path);

    const pdf = new PDFParse({
      data: buffer,
    });

    // Extract PDF text
    const result = await pdf.getText();
    const text = result.text;

    if (!text || !text.trim()) {
      throw new Error("No readable text could be extracted from PDF");
    }

    // Split PDF into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text]);

    // Create Qdrant vector store
    const collectionName = `pdf-${Date.now()}`;

    const store = await vectorStore(
      docs,
      collectionName
    );

    // Search relevant chunks
    const relevantDocs = await store.similaritySearch(
      state.prompt,
      5
    );

    const context = relevantDocs
      .map((doc) => doc.pageContent)
      .join("\n\n");

    // Get LLM
    const llm = await getModel("pdf-rag");

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

    // Generate response
    const response = await llm.invoke(messages);

    return {
      ...state,
      aiResponse: response.content,
    };

  } catch (error) {
    console.error("PDF RAG ERROR:", error);

    return {
      ...state,
      aiResponse: "Failed to Analyze PDF",
    };

  } finally {
    if (
      state.file?.path &&
      fs.existsSync(state.file.path)
    ) {
      try {
        fs.unlinkSync(state.file.path);
      } catch (error) {
        console.error(
          "Failed to delete temporary PDF:",
          error
        );
      }
    }
  }
};
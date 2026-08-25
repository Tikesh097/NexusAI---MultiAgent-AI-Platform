import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

const VALID_INTENTS = [
  "CODE_GENERATION",
  "CODE_REVIEW",
  "CODE_EXPLANATION",
  "DEBUGGING",
  "OPTIMIZATION",
  "CONVERSION",
  "DOCUMENTATION",
];

/**
 * Converts the AI response into a valid JSON object.
 */
const extractJson = (content) => {
  if (!content) {
    throw new Error("The AI returned an empty response.");
  }

  const rawContent = typeof content === "string" ? content : String(content);

  const cleanedContent = rawContent
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const startIndex = cleanedContent.indexOf("{");

  const endIndex = cleanedContent.lastIndexOf("}");

  if (startIndex === -1) {
    console.error("\nAI RESPONSE DOES NOT CONTAIN JSON:\n", rawContent);

    throw new Error("The AI response does not contain a JSON object.");
  }

  if (endIndex === -1 || endIndex < startIndex) {
    console.error("\nAI RESPONSE WAS INCOMPLETE OR TRUNCATED.");

    console.error("\nRESPONSE LENGTH:", rawContent.length);

    console.error("\nLAST 2000 CHARACTERS:\n", rawContent.slice(-2000));

    throw new Error(
      "The AI response was incomplete. The generated project may be too large or the model stopped before finishing the JSON.",
    );
  }

  const jsonString = cleanedContent.slice(startIndex, endIndex + 1);

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("\nINVALID JSON ERROR:", error.message);

    console.error("\nJSON RESPONSE LENGTH:", jsonString.length);

    console.error("\nLAST 2000 CHARACTERS:\n", jsonString.slice(-2000));

    throw new Error(`The AI generated invalid JSON: ${error.message}`);
  }
};

/**
 * Detects the coding intent from the AI response.
 */
const normalizeIntent = (content) => {
  const normalizedContent = String(content || "")
    .trim()
    .toUpperCase();

  const detectedIntent = VALID_INTENTS.find((intent) =>
    normalizedContent.includes(intent),
  );

  return detectedIntent || "CODE_EXPLANATION";
};

/**
 * Checks whether generated project data is valid.
 */
const validateProject = (projectData) => {
  if (!projectData || typeof projectData !== "object") {
    throw new Error("The AI did not return a valid project object.");
  }

  if (!Array.isArray(projectData.files)) {
    throw new Error("The AI response does not contain a valid files array.");
  }

  if (projectData.files.length === 0) {
    throw new Error("The AI generated an empty project.");
  }

  const files = projectData.files
    .filter(
      (file) =>
        file &&
        typeof file.name === "string" &&
        typeof file.content === "string" &&
        file.name.trim() &&
        file.content.trim(),
    )
    .map((file) => ({
      name: file.name.trim(),
      content: file.content,
    }));

  if (files.length === 0) {
    throw new Error("The generated project files have an invalid format.");
  }

  return files;
};

/**
 * Creates the prompt used for project generation.
 */
const createProjectPrompt = (userPrompt) => `
You are NexusAI, an expert full-stack software engineer.

Generate a complete, working, and concise project
based on the user's request.

DEFAULT TECHNOLOGY:

- HTML
- CSS
- JavaScript

Use React, Next.js, Vue, Node.js,
Express, MongoDB, or another technology only when:

1. The user explicitly requests it.
2. The project clearly requires it.

PROJECT REQUIREMENTS:

- Create a responsive UI.
- Support mobile, tablet, and desktop.
- Use a modern and clean design.
- Use semantic HTML.
- Use accessible HTML.
- Use CSS custom properties.
- Use Flexbox and/or CSS Grid.
- Add useful hover effects.
- Add subtle transitions.
- Keep code clean and maintainable.
- Keep file names consistent.
- Keep imports consistent.
- Ensure all files work together.
- Do not use unnecessary dependencies.
- Include all required files.
- Do not leave unfinished features.
- Do not leave TODO comments.
- Do not use placeholder images.
- Use real Unsplash images only when images are needed.

IMPORTANT SIZE RULES:

- Keep the project concise.
- Avoid unnecessarily large CSS.
- Avoid repetitive CSS rules.
- Avoid unnecessarily large JavaScript.
- Use reusable functions.
- Use reusable CSS classes.
- Do not duplicate code.
- Do not generate unnecessary features.
- Keep the total response small enough to complete.
- Prefer clean and compact implementations.

RETURN FORMAT:

Return ONLY one valid JSON object.

Do not return:

- Markdown
- Code fences
- Explanations
- Notes
- Text before the JSON
- Text after the JSON

Use exactly this structure:

{
  "files": [
    {
      "name": "index.html",
      "content": "Complete HTML code"
    },
    {
      "name": "style.css",
      "content": "Complete CSS code"
    },
    {
      "name": "script.js",
      "content": "Complete JavaScript code"
    }
  ]
}

JSON REQUIREMENTS:

- Start directly with {
- End directly with }
- Return JSON that JSON.parse() can parse.
- Use double quotes for all keys.
- Use double quotes for all string values.
- Escape double quotes inside file content.
- Escape backslashes correctly.
- Escape new lines correctly.
- Do not use trailing commas.
- Close every string.
- Close every array.
- Close every object.
- Complete every file.
- Do not truncate the response.

USER REQUEST:

${userPrompt}
`;

/**
 * Generates a project and retries once
 * if the AI returns invalid JSON.
 */
const generateProject = async (codingLlm, userPrompt) => {
  const projectPrompt = createProjectPrompt(userPrompt);

  let codeResponse = await codingLlm.invoke(projectPrompt);

  console.log("\nRAW CODE RESPONSE:\n", codeResponse.content);

  try {
    const projectData = extractJson(codeResponse.content);

    return validateProject(projectData);
  } catch (firstError) {
    console.error("\nFIRST PROJECT GENERATION FAILED:", firstError.message);

    console.log("\nRETRYING PROJECT GENERATION...\n");

    const retryPrompt = `
Your previous project response was invalid,
incomplete, or could not be parsed.

Generate the complete project again.

Follow these rules strictly:

- Return ONLY one valid JSON object.
- Do not use Markdown.
- Do not use code fences.
- Do not add explanations.
- Do not add text before JSON.
- Do not add text after JSON.
- Start with {
- End with }
- Ensure JSON.parse() can parse the response.
- Escape all quotes inside file content.
- Escape all backslashes correctly.
- Escape new lines correctly.
- Close every JSON string.
- Close every JSON array.
- Close every JSON object.
- Complete every generated file.
- Keep the project concise.
- Avoid large or repetitive code.
- Do not stop in the middle of a file.

Original user request:

${userPrompt}
`;

    codeResponse = await codingLlm.invoke(retryPrompt);

    console.log("\nRAW RETRY RESPONSE:\n", codeResponse.content);

    const projectData = extractJson(codeResponse.content);

    return validateProject(projectData);
  }
};

export const codingAgent = async (state) => {
  try {
    const userPrompt = String(state.prompt || "").trim();

    if (!userPrompt) {
      return {
        ...state,

        aiResponse: "Please provide a coding request.",

        artifacts: [],

        images: [],
      };
    }

    const intentLlm = getModel("intent");

    const codingLlm = getModel("coding");

    const intentResponse = await intentLlm.invoke(`
You are an intent classifier
for a coding assistant.

Classify the user's request
into exactly ONE category.

Allowed categories:

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

RULES:

- Return only the category name.
- Do not add explanations.
- Do not use Markdown.
- Do not add punctuation.
- Do not return multiple categories.

USER REQUEST:

${userPrompt}
`);

    const intent = normalizeIntent(intentResponse.content);

    console.log("Detected coding intent:", intent);

    if (intent === "CODE_GENERATION") {
      const files = await generateProject(codingLlm, userPrompt);

      const creditResult = await deductCredits(state.userId, "coding");

      if (!creditResult?.success) {
        throw new Error(creditResult?.message || "Credit deduction failed");
      }

      return {
        ...state,
        aiResponse: "Code generated successfully.",
        artifacts: [
          {
            id: `project-${Date.now()}`,

            type: "Project",

            title:
              userPrompt.length > 100
                ? `${userPrompt.slice(0, 100)}...`
                : userPrompt,

            files,
          },
        ],

        images: [],
        credits: creditResult.credits,
      };
    }

    const response = await codingLlm.invoke(`
You are NexusAI,
an expert Coding Agent.

The user's coding intent is:

${intent}

Answer the user's original request
accurately and clearly.

RULES:

- Return Markdown only.
- Do not generate a downloadable project.
- Do not return JSON.
- Do not use JSON code blocks.
- Explain the answer according to
  the detected intent.
- Include code examples when useful.
- Keep explanations practical.
- Keep explanations easy to understand.
- Do not invent errors.
- Do not invent files.
- Do not invent code that the user
  did not provide.

Use headings only when relevant:

# Overview

## Explanation

## Problems

## Solution

## Improvements

## Best Practices

## Optimized Code

ORIGINAL USER REQUEST:

${userPrompt}
`);

    const creditResult = await deductCredits(state.userId, "coding");

    if (!creditResult?.success) {
      throw new Error(creditResult?.message || "Credit deduction failed");
    }

    return {
      ...state,
      aiResponse:
        response.content?.trim() ||
        "I could not generate a response for this request.",
      artifacts: [],
      images: [],
      credits: creditResult.credits,
    };
  } catch (error) {
    console.error("Coding Agent Error:", error);

    return {
      ...state,

      aiResponse: `Unable to process the coding request: ${error.message}`,

      artifacts: [],

      images: [],
    };
  }
};

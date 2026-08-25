import { checkAgentLimit } from "../config/agentLimit.js";
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
 * Extracts a JSON object from the AI response.
 */
const extractJson = (content) => {
  if (!content) {
    throw new Error("The AI returned an empty response.");
  }

  let rawContent;

  if (typeof content === "string") {
    rawContent = content;
  } else if (Array.isArray(content)) {
    rawContent = content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return item?.text || "";
      })
      .join("");
  } else {
    rawContent = String(content);
  }

  const cleanedContent = rawContent
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const startIndex = cleanedContent.indexOf("{");
  const endIndex = cleanedContent.lastIndexOf("}");

  if (startIndex === -1) {
    console.error(
      "\nAI RESPONSE DOES NOT CONTAIN JSON:\n",
      rawContent
    );

    throw new Error(
      "The AI response does not contain a JSON object."
    );
  }

  if (
    endIndex === -1 ||
    endIndex < startIndex
  ) {
    console.error(
      "\nAI RESPONSE WAS INCOMPLETE OR TRUNCATED."
    );

    console.error(
      "\nRESPONSE LENGTH:",
      rawContent.length
    );

    console.error(
      "\nLAST 2000 CHARACTERS:\n",
      rawContent.slice(-2000)
    );

    throw new Error(
      "The AI response was incomplete. The generated project may be too large or the model stopped before finishing the JSON."
    );
  }

  const jsonString = cleanedContent.slice(
    startIndex,
    endIndex + 1
  );

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(
      "\nINVALID JSON ERROR:",
      error.message
    );

    console.error(
      "\nJSON RESPONSE LENGTH:",
      jsonString.length
    );

    console.error(
      "\nLAST 2000 CHARACTERS:\n",
      jsonString.slice(-2000)
    );

    throw new Error(
      `The AI generated invalid JSON: ${error.message}`
    );
  }
};

/**
 * Detects the coding intent.
 */
const normalizeIntent = (content) => {
  const normalizedContent = String(
    content || ""
  )
    .trim()
    .toUpperCase();

  const detectedIntent = VALID_INTENTS.find(
    (intent) =>
      normalizedContent.includes(intent)
  );

  return (
    detectedIntent ||
    "CODE_EXPLANATION"
  );
};

/**
 * Validates and normalizes generated project files.
 *
 * Supports:
 * {
 *   files: [...]
 * }
 *
 * and common wrappers:
 * {
 *   project: { files: [...] }
 * }
 *
 * {
 *   data: { files: [...] }
 * }
 *
 * {
 *   result: { files: [...] }
 * }
 */
const validateProject = (projectData) => {
  if (
    !projectData ||
    typeof projectData !== "object" ||
    Array.isArray(projectData)
  ) {
    throw new Error(
      "The AI did not return a valid project object."
    );
  }

  let files = projectData.files;

  // Support common AI wrappers
  if (
    !Array.isArray(files) &&
    projectData.project
  ) {
    files = projectData.project.files;
  }

  if (
    !Array.isArray(files) &&
    projectData.data
  ) {
    files = projectData.data.files;
  }

  if (
    !Array.isArray(files) &&
    projectData.result
  ) {
    files = projectData.result.files;
  }

  if (
    !Array.isArray(files) &&
    projectData.output
  ) {
    files = projectData.output.files;
  }

  if (!Array.isArray(files)) {
    console.error(
      "\nPROJECT OBJECT RECEIVED FROM AI:\n",
      JSON.stringify(
        projectData,
        null,
        2
      )
    );

    throw new Error(
      "The AI response does not contain a valid files array."
    );
  }

  if (files.length === 0) {
    throw new Error(
      "The AI generated an empty project."
    );
  }

  const validFiles = files
    .filter(
      (file) =>
        file &&
        typeof file.name === "string" &&
        typeof file.content === "string" &&
        file.name.trim() &&
        file.content.trim()
    )
    .map((file) => ({
      name: file.name.trim(),
      content: file.content,
    }));

  if (validFiles.length === 0) {
    throw new Error(
      "The generated project files have an invalid format."
    );
  }

  return validFiles;
};

/**
 * Creates the project generation prompt.
 */
const createProjectPrompt = (userPrompt) => `
You are NexusAI, an expert full-stack software engineer.

Generate a complete, working, concise project based on the user's request.

DEFAULT TECHNOLOGY:
- HTML
- CSS
- JavaScript

Use React, Next.js, Vue, Node.js, Express, MongoDB,
or another technology only when:
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
- Prefer 3-5 files maximum when possible.
- Keep each file concise.
- Avoid unnecessarily large CSS.
- Avoid repetitive CSS rules.
- Avoid unnecessarily large JavaScript.
- Use reusable functions.
- Use reusable CSS classes.
- Do not duplicate code.
- Do not generate unnecessary features.
- Keep the total response small enough to complete.
- Prefer a working core implementation over excessive features.
- Never truncate a file.

RETURN FORMAT:

Return ONLY ONE valid JSON object.

The ROOT object MUST contain:
"files"

The "files" property MUST be an array.

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
- Root property MUST be "files".
- "files" MUST be an array.
- Every file MUST contain "name" and "content".
- "name" MUST be a string.
- "content" MUST be a string.
- Return valid JSON that JSON.parse() can parse.
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
- Do not return Markdown.
- Do not return code fences.
- Do not return explanations.
- Do not return notes.
- Do not return "project" wrappers.
- Do not return "data" wrappers.
- Do not return "result" wrappers.
- Do not return "output" wrappers.
- Do not add text before the JSON.
- Do not add text after the JSON.

USER REQUEST:

${userPrompt}
`;

/**
 * Generates a project and retries once if necessary.
 */
const generateProject = async (
  codingLlm,
  userPrompt
) => {
  const projectPrompt =
    createProjectPrompt(userPrompt);

  let codeResponse;

  // --------------------------------------------------
  // First generation
  // --------------------------------------------------
  try {
    codeResponse = await codingLlm.invoke(
      projectPrompt
    );
  } catch (error) {
    console.error(
      "❌ Initial project generation failed:",
      error
    );

    throw error;
  }

  console.log(
    "\n========== RAW CODE RESPONSE ==========\n"
  );

  console.log(
    codeResponse?.content
  );

  console.log(
    "\n=======================================\n"
  );

  try {
    const projectData = extractJson(
      codeResponse?.content
    );

    return validateProject(
      projectData
    );
  } catch (firstError) {
    console.error(
      "\nFIRST PROJECT GENERATION FAILED:",
      firstError.message
    );

    console.log(
      "\nRETRYING PROJECT GENERATION...\n"
    );
  }

  // --------------------------------------------------
  // Retry generation
  // --------------------------------------------------
  const retryPrompt = `
You are NexusAI.

Your previous response was invalid.

Generate the project again.

YOU MUST RETURN EXACTLY THIS STRUCTURE:

{
  "files": [
    {
      "name": "index.html",
      "content": "FULL HTML SOURCE CODE"
    },
    {
      "name": "style.css",
      "content": "FULL CSS SOURCE CODE"
    },
    {
      "name": "script.js",
      "content": "FULL JAVASCRIPT SOURCE CODE"
    }
  ]
}

STRICT RULES:

1. The ROOT object MUST contain "files".
2. "files" MUST be an array.
3. Every item inside "files" MUST contain:
   - "name"
   - "content"
4. "name" MUST be a string.
5. "content" MUST be a string.
6. Do NOT return "project".
7. Do NOT return "data".
8. Do NOT return "result".
9. Do NOT return "output".
10. Do NOT return Markdown.
11. Do NOT use code fences.
12. Do NOT add explanations.
13. Do NOT add notes.
14. Do NOT add text before JSON.
15. Do NOT add text after JSON.
16. Return ONLY valid JSON.
17. Complete every file.
18. Do not truncate any file.
19. Keep the project concise.
20. Make all files work together.
21. Do not leave TODO comments.
22. Do not return an empty files array.

USER REQUEST:

${userPrompt}
`;

  codeResponse = await codingLlm.invoke(
    retryPrompt
  );

  console.log(
    "\n========== RAW RETRY RESPONSE ==========\n"
  );

  console.log(
    codeResponse?.content
  );

  console.log(
    "\n========================================\n"
  );

  const projectData =
    extractJson(
      codeResponse?.content
    );

  return validateProject(
    projectData
  );
};

export const codingAgent = async (
  state
) => {
  try {
    // --------------------------------------------------
    // Check coding rate limit
    // --------------------------------------------------
    await checkAgentLimit(
      state.userId,
      "coding"
    );

    // --------------------------------------------------
    // Validate prompt
    // --------------------------------------------------
    const userPrompt = String(
      state.prompt || ""
    ).trim();

    if (!userPrompt) {
      return {
        ...state,
        aiResponse:
          "Please provide a coding request.",
        artifacts: [],
        images: [],
      };
    }

    // --------------------------------------------------
    // Get models
    // --------------------------------------------------
    const intentLlm =
      getModel("intent");

    const codingLlm =
      getModel("coding");

    // --------------------------------------------------
    // Detect coding intent
    // --------------------------------------------------
    const intentResponse =
      await intentLlm.invoke(`
You are an intent classifier for a coding assistant.

Classify the user's request into exactly ONE category.

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

    const intent =
      normalizeIntent(
        intentResponse?.content
      );

    console.log(
      "Detected coding intent:",
      intent
    );

    // --------------------------------------------------
    // CODE GENERATION
    // --------------------------------------------------
    if (
      intent === "CODE_GENERATION"
    ) {
      const files =
        await generateProject(
          codingLlm,
          userPrompt
        );

      // ------------------------------------------------
      // Deduct credits ONLY after successful generation
      // ------------------------------------------------
      const creditResult =
        await deductCredits(
          state.userId,
          "coding"
        );

      if (!creditResult?.success) {
        throw new Error(
          creditResult?.message ||
            "Credit deduction failed"
        );
      }

      console.log(
        "💳 CODING CREDITS REMAINING:",
        creditResult.credits
      );

      return {
        ...state,

        aiResponse:
          "Code generated successfully.",

        artifacts: [
          {
            id:
              `project-${Date.now()}`,

            type:
              "Project",

            title:
              userPrompt.length > 100
                ? `${userPrompt.slice(
                    0,
                    100
                  )}...`
                : userPrompt,

            files,
          },
        ],

        images: [],

        credits:
          creditResult.credits,
      };
    }

    // --------------------------------------------------
    // Other coding intents
    // --------------------------------------------------
    const response =
      await codingLlm.invoke(`
You are NexusAI,
an expert Coding Agent.

The user's coding intent is:

${intent}

Answer the user's original request accurately and clearly.

RULES:
- Return Markdown only.
- Do not generate a downloadable project.
- Do not return JSON.
- Do not use JSON code blocks.
- Explain the answer according to the detected intent.
- Include code examples when useful.
- Keep explanations practical.
- Keep explanations easy to understand.
- Do not invent errors.
- Do not invent files.
- Do not invent code that the user did not provide.

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

    // --------------------------------------------------
    // Deduct credits after successful response
    // --------------------------------------------------
    const creditResult =
      await deductCredits(
        state.userId,
        "coding"
      );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 CODING CREDITS REMAINING:",
      creditResult.credits
    );

    return {
      ...state,

      aiResponse:
        response?.content?.trim() ||
        "I could not generate a response for this request.",

      artifacts: [],

      images: [],

      credits:
        creditResult.credits,
    };
  } catch (error) {
    console.error(
      "❌ Coding Agent Error:",
      error
    );

    // --------------------------------------------------
    // Safely extract provider error message
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while processing the coding request.";

    // --------------------------------------------------
    // Rate limit error
    // --------------------------------------------------
    if (error?.status === 429) {
      console.warn(
        "⚠️ CODING RATE LIMIT:",
        errorMessage
      );

      return {
        ...state,

        aiResponse:
          `⚠️ ${errorMessage}`,

        artifacts: [],

        images: [],

        // Preserve current credits.
        credits: state.credits,
      };
    }

    // --------------------------------------------------
    // Other coding errors
    // --------------------------------------------------
    return {
      ...state,

      aiResponse:
        `❌ Unable to process the coding request: ${errorMessage}`,

      artifacts: [],

      images: [],

      // Preserve existing credits if available.
      credits: state.credits,
    };
  }
};

export default codingAgent;
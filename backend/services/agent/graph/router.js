import { getModel } from "../config/llmModels.js";

export const router = async (state) => {
  // If user explicitly selected an agent, use it directly.
  if (state.agent && state.agent !== "auto") {
    return {
      ...state,
      agent: state.agent,
    };
  }

  const llm = await getModel("router");

  const prompt = `
You are an intelligent AI agent router.

Your job is to determine which agent should handle the user's request.

Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Routing rules:

CHAT:
- General conversation
- Explanations
- Learning questions
- General questions
- Non-current factual questions

SEARCH:
- Current events
- Latest information
- News
- Recent developments
- Internet lookup
- Real-time information
- Time-sensitive information

CODING:
- Generate code
- Debug code
- Fix code
- Build software
- Build websites
- Programming questions
- Architecture
- APIs
- Databases
- Framework questions

PDF:
- Generate a PDF
- Create a PDF
- Make a PDF
- Create a document as PDF
- Generate a report as PDF
- Generate a resume as PDF
- Generate a biography as PDF
- Generate notes as PDF
- Generate an article as PDF
- Convert requested content into a PDF
- Read, analyze, summarize, or answer questions about an uploaded PDF

PPT:
- Generate a PowerPoint
- Create a presentation
- Make slides
- Generate PPT/PPTX
- Create presentation slides
- Read, analyze, summarize, or answer questions about PowerPoint presentations

VISION:
- Generate an image
- Create an image
- Edit an image
- Modify an image
- Create visual designs
- Generate diagrams
- Generate illustrations

IMPORTANT PDF RULES:

If the user says:
- "generate pdf"
- "create pdf"
- "make pdf"
- "pdf on ..."
- "generate a report on ... as pdf"
- "create a document on ... as pdf"

you MUST select:

pdf

For example:

"generate pdf on MS Dhoni"
=> pdf

"create a PDF about Node.js"
=> pdf

"make a report on artificial intelligence as PDF"
=> pdf

Do NOT select chat or coding when the user explicitly asks for a PDF.

IMPORTANT:

Return ONLY ONE word.

The output MUST be exactly one of:

chat
search
coding
pdf
ppt
vision

Do not provide explanations.
Do not use punctuation.
Do not return multiple words.

User Query:
${state.prompt}
`;

  const response = await llm.invoke(prompt);

  // Extract model output safely
  let selectedAgent = String(response?.content || "")
    .trim()
    .toLowerCase();

  // Remove accidental markdown/code formatting
  selectedAgent = selectedAgent
    .replace(/```/g, "")
    .replace(/["']/g, "")
    .trim();

  // Validate router output
  const validAgents = [
    "chat",
    "search",
    "coding",
    "pdf",
    "ppt",
    "vision",
  ];

  if (!validAgents.includes(selectedAgent)) {
    console.warn(
      `⚠️ Router returned invalid agent: "${selectedAgent}". Falling back to chat.`
    );

    selectedAgent = "chat";
  }

  console.log("🧭 ROUTER DECISION:", {
    prompt: state.prompt,
    agent: selectedAgent,
  });

  return {
    ...state,
    agent: selectedAgent,
  };
};

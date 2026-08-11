# NexusAI — Multi-Agent AI Platform

NexusAI is a microservice-based AI platform that routes every user prompt to the right specialized agent — chat, web search, coding, PDF generation, PowerPoint generation, or image generation — through a LangGraph orchestration layer, and serves it through a React chat interface.

> Built with a **gateway + microservices** architecture: an API gateway fronts independent Auth, Chat, and Agent services, backed by MongoDB and Redis, with generated files delivered via AWS S3.

---

## ✨ Features

- **Intelligent agent routing** — an LLM-based router (LangGraph `StateGraph`) reads the user's prompt and dispatches it to the correct specialized agent, or the user can pin a specific agent directly.
- **Six specialized agents**
  - 💬 **Chat** — general conversation, explanations, Q&A
  - 🔎 **Search** — current events and real-time information (Tavily), then summarized by the chat agent
  - 💻 **Coding** — code generation, debugging, and architecture help
  - 📄 **PDF** — generates PDF reports, resumes, articles, and notes on request
  - 📊 **PPT** — generates PowerPoint decks from a prompt
  - 🖼️ **Vision** — prompt-engineers and generates images
- **Multi-LLM backend** — Groq, Google Gemini, and OpenRouter models, selected per agent
- **Generated file delivery via S3** — PDFs, decks, and images are uploaded to AWS S3 and served back as time-limited download links
- **Auth via Firebase** — Firebase Admin-backed authentication with JWT-protected gateway routes
- **Conversation memory** — conversations and messages persisted per user in MongoDB, with Redis for shared/session state
- **Modern chat UI** — React 19 + Redux Toolkit frontend with Markdown rendering, syntax-highlighted code blocks, and an in-browser code editor (Monaco)

---

## 🏗️ Architecture

```
                            ┌─────────────────────┐
                            │   Frontend (Vite)    │
                            │  React + Redux + TW  │
                            └──────────┬───────────┘
                                       │  REST (axios, cookies)
                                       ▼
                            ┌─────────────────────┐
                            │   API Gateway        │
                            │  Express + JWT auth  │
                            │  reverse proxy       │
                            └──────────┬───────────┘
                     ┌─────────────────┼─────────────────┐
                     ▼                 ▼                 ▼
             ┌───────────────┐ ┌───────────────┐ ┌────────────────────┐
             │ Auth Service  │ │ Chat Service  │ │   Agent Service     │
             │ Firebase Auth │ │ Conversations │ │ LangGraph router +  │
             │ MongoDB       │ │ & Messages    │ │ 6 specialized agents│
             │               │ │ MongoDB       │ │ MongoDB · S3 · Redis│
             └───────────────┘ └───────────────┘ └──────────┬──────────┘
                                                              │
                                        ┌─────────────────────┼─────────────────────┐
                                        ▼                     ▼                     ▼
                                  Groq / Gemini /      AWS S3 (files)        Tavily (search)
                                    OpenRouter
```

Requests from the frontend hit the **gateway**, which authenticates the user and reverse-proxies to the appropriate downstream service:

| Route prefix | Proxied to      | Purpose                                   |
| ------------- | ---------------- | ------------------------------------------ |
| `/api/auth`   | Auth Service     | Login / logout                             |
| `/api/chat`   | Chat Service      | Conversations & message history            |
| `/api/agent`  | Agent Service     | Prompt routing & agent execution           |
| `/api/me`     | Gateway (local)  | Current authenticated user                 |

---

## 📁 Project Structure

```
NexusAI/
├── backend/
│   ├── docker-compose.yml       # Redis container
│   ├── gateway/                 # API gateway (auth check + reverse proxy)
│   │   ├── controllers/
│   │   ├── middleware/          # JWT auth middleware
│   │   └── utils/                # header-forwarding proxy helper
│   ├── shared/
│   │   └── redis/               # shared Redis client
│   └── services/
│       ├── auth/                # Firebase-backed authentication service
│       ├── chat/                # Conversation & message persistence
│       └── agent/                # LangGraph orchestration + specialized agents
│           ├── agents/           # chat, search, coding, pdf, ppt, vision agents
│           ├── graph/             # StateGraph definition + router logic
│           ├── config/            # DB, LLM models, memory, S3, Tavily config
│           └── utils/              # PDF/PPT generation, S3 upload/download
└── frontend/
    └── src/
        ├── components/           # Chat UI, sidebar, message list, artifact viewer
        ├── features/               # API calls (conversations, messages, auth)
        ├── redux/                  # Redux Toolkit slices
        └── pages/                   # Route-level pages
```

---

## 🛠️ Tech Stack

**Frontend**
- React 19, Vite, Redux Toolkit, Tailwind CSS
- React Markdown + remark-gfm, React Syntax Highlighter, Monaco Editor
- Firebase (client SDK), Framer Motion (`motion`)

**Backend**
- Node.js, Express 5 (gateway + 3 microservices)
- MongoDB (Mongoose) — auth, chat, and agent data
- Redis (`ioredis`) — shared cache/session layer
- Firebase Admin — server-side auth verification

**AI / Agents**
- LangChain + LangGraph (`@langchain/langgraph`) for agent orchestration
- LLM providers: **Groq**, **Google Gemini**, **OpenRouter**
- Tavily for real-time web search
- `pdfkit` for PDF generation, `pptxgenjs` for PowerPoint generation
- Pollinations for image generation

**Infrastructure**
- AWS S3 — storage for generated PDFs, decks, and images (served via presigned/expiring links)
- Docker (Redis container via `docker-compose`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (or run the provided `docker-compose.yml`)
- Firebase project (for authentication)
- API keys: Groq, Google Gemini, OpenRouter, Tavily, AWS S3

### 1. Clone the repository

```bash
git clone https://github.com/Tikesh097/NexusAI---MultiAgent-AI-Platform.git
cd NexusAI---MultiAgent-AI-Platform
```

### 2. Start Redis

```bash
cd backend
docker-compose up -d
```

### 3. Install dependencies

Each service manages its own dependencies:

```bash
# Gateway
cd backend/gateway && npm install

# Auth service
cd ../services/auth && npm install

# Chat service
cd ../chat && npm install

# Agent service
cd ../agent && npm install

# Frontend
cd ../../../frontend && npm install
```

### 4. Configure environment variables

Create a `.env` file in **each** service directory (`gateway`, `services/auth`, `services/chat`, `services/agent`) with the relevant variables below.

**Gateway** (`backend/gateway/.env`)
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE=http://localhost:5001
CHAT_SERVICE=http://localhost:5002
AGENT_SERVICE=http://localhost:5003
```

**Auth service** (`backend/services/auth/.env`)
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
# Firebase Admin credentials (see firebase.js for the expected shape)
```

**Chat service** (`backend/services/chat/.env`)
```env
PORT=5002
MONGO_URI=your_mongodb_connection_string
```

**Agent service** (`backend/services/agent/.env`)
```env
PORT=5003
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379

# LLM providers
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Search
TAVILY_API_KEY=your_tavily_key

# AWS S3 (generated file storage)
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_KEY_ID=your_secret_key
```

> ⚠️ Never commit real `.env` files — they are already covered by `.gitignore`.

### 5. Run the services

Each service runs independently with `nodemon`:

```bash
# In separate terminals
cd backend/gateway && npm run dev
cd backend/services/auth && npm run dev
cd backend/services/chat && npm run dev
cd backend/services/agent && npm run dev
```

### 6. Run the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`, talking to the gateway at `http://localhost:5000`.

---

## 🧠 How Agent Routing Works

Every prompt sent to `/api/agent/chat` flows through a LangGraph `StateGraph`:

1. **Router node** — if the user hasn't pinned a specific agent, an LLM classifies the prompt into one of `chat`, `search`, `coding`, `pdf`, `ppt`, or `vision` based on explicit routing rules (e.g. "generate a report on X as PDF" → `pdf`).
2. **Agent node** — the selected agent executes:
   - `search` results are handed off to the `chat` agent to be summarized before responding.
   - `pdf` / `ppt` agents generate a file, upload it to S3, and return a time-limited download link.
   - `vision` expands the prompt into a detailed image-generation prompt, generates the image, and returns it via an S3 link.
3. **Response** — the final `aiResponse` is returned to the Chat service and persisted against the conversation.

---

## 📚 Concepts Explored While Building This

This project was built as a deep, hands-on exercise in production-style AI systems. The current codebase in this repo implements the microservices, LangGraph routing, and file-generation agents described above. Beyond that, the build process also involved deliberately exploring the following concepts — some fully wired in, others prototyped or planned as the project evolves:

- **Retrieval-Augmented Generation (RAG)** — grounding LLM responses in uploaded documents rather than model memory alone
- **Qdrant vector database** — storing and querying document embeddings for semantic retrieval
- **PDF RAG agent** — answering questions over uploaded PDFs via retrieval + generation
- **Image-to-text agent** — extracting and reasoning over content from uploaded images
- **Docker containerization** — packaging services as containers for consistent local and cloud environments (currently applied to Redis; extending to all services is on the roadmap)
- **AWS deployment** — cloud hosting strategy for the gateway, services, and S3-backed file storage
- **Rate limiting with Redis** — protecting agent endpoints from abuse using Redis-backed request throttling
- **Billing & credits system (Razorpay)** — metering AI usage per user and integrating a payment gateway for credit top-ups
- **Streaming AI responses** — delivering LLM output token-by-token for a faster perceived response time
- **AI tool calling** — letting LLMs invoke structured tools/functions as part of an agent's reasoning loop

> These points reflect the broader system-design and AI-engineering scope this project was built to practice, not a claim that every item is live in this exact snapshot of the repo. See the Roadmap below for what's planned next.

---

## 🗺️ Roadmap

- [ ] Add automated tests across services
- [ ] Add CI/CD pipeline
- [ ] Add per-agent usage analytics
- [ ] Support additional file export formats
- [ ] Containerize all services (not just Redis) for one-command local setup
- [ ] Add a RAG agent backed by Qdrant for document Q&A
- [ ] Add an image-to-text agent for reasoning over uploaded images
- [ ] Add Redis-backed rate limiting on agent endpoints
- [ ] Add a billing/credits system with Razorpay integration
- [ ] Deploy the full stack to AWS
- [ ] Add streaming AI responses

---

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a PR

---

## 📄 License

No license has been specified for this repository yet. Add a `LICENSE` file to define usage terms.

---

## 👤 Author

**Tikesh097**
[GitHub](https://github.com/Tikesh097) · [Repository](https://github.com/Tikesh097/NexusAI---MultiAgent-AI-Platform)

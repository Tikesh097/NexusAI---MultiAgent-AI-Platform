
# NexusAI — Multi-Agent AI Platform

A microservice-based AI platform that routes every prompt to the right specialized agent — chat, web search, coding, PDF & PPT generation, image generation, PDF Q&A (RAG) and image understanding — through a **LangGraph** orchestration layer, served by a React chat interface.

[![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-orchestration-1C3C3C)](https://www.langchain.com/langgraph)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)


NexusAI is a **gateway + microservices** platform. An Express **API gateway** authenticates every request and reverse-proxies to independent **Auth**, **Chat**, **Agent** and **Billing** services, backed by **MongoDB**, **Redis**, **S3-compatible storage** (AWS S3 or Cloudflare R2) and **Qdrant**. Each user prompt is classified by an LLM-based router and dispatched to a specialized agent; generated files (PDFs, decks, images) are stored and delivered as expiring links.

---

## ✨ Features

- **Intelligent agent routing** — a LangGraph `StateGraph` reads the user prompt and dispatches to the correct specialized agent (or the user can pin one explicitly).
- **Eight specialized agents**
  - 💬 **Chat** — general conversation, explanations, Q&A
  - 🔎 **Search** — current events & real-time info (Tavily), summarized by the chat agent
  - 💻 **Coding** — full project generation (multi-file HTML/CSS/JS artifacts with live preview) plus code review, debugging, optimization, and explanation
  - 📄 **PDF** — generates PDF reports, resumes, articles, and notes
  - 📊 **PPT** — professional slide decks ("Ink & Brass" editorial design) generated on demand
  - 🖼️ **Vision** — prompt-engineers and generates images
  - 📑 **PDF-RAG** — answers questions over uploaded PDFs using Qdrant retrieval + generation
  - 🔍 **Image analyzer** — extracts and reasons over text/charts/tables in uploaded images (multimodal)
- **Multi-LLM backend** — **Groq**, **Google Gemini**, and **OpenRouter**, selected per agent (and overridable via env).
- **Credits & billing** — metered per-agent credit costs, a free plan, and Razorpay-powered plan upgrades.
- **Redis-backed rate limiting** — per-user, per-agent request throttling.
- **Conversation memory** — conversations and messages persisted in MongoDB, with Redis-backed session state and per-conversation message history.
- **Modern chat UI** — React 19 + Redux Toolkit, Markdown rendering, syntax-highlighted code, an in-browser Monaco editor, and a live code preview pane.

---

## 🏗️ Architecture

```
                 ┌───────────────────────────────┐
                 │  Frontend (Vite · React 19)    │
                 │  Redux Toolkit · Tailwind      │
                 └───────────────┬───────────────┘
                                 │  REST (axios · cookie session)
                                 ▼
                 ┌───────────────────────────────┐
                 │        API Gateway            │
                 │  auth middleware · reverse     │
                 │  proxy · /api/me              │
                 └───────┬──────────┬───────────┘
                         │          │
              ┌──────────▼───┐ ┌───▼──────────────┐
              │ Auth Service │ │ Chat Service     │
              │ Firebase Auth│ │ Conversations &  │
              │ users·credits│ │ messages (Mongo) │
              └──────┬───────┘ └──────────────────┘
                     │
              ┌──────▼───────────┐   ┌────────────────┐
              │  Agent Service    │──▶│ Billing Service │
              │ LangGraph router  │   │ Razorpay orders │
              │ + 8 agents        │   │ & verification  │
              └───┬───┬───┬───┬──┘   └────────────────┘
                  │   │   │   │
        ┌─────────┘   │   │   └──────────────┐
        ▼             ▼   ▼                  ▼
  Groq / Gemini /  Tavily  S3 (R2)       Qdrant (PDF-RAG)
  OpenRouter LLMs   (search) (artifacts)   (vector store)

                    ┌───────────────┐
                    │  Redis        │
                    │ sessions · memory · rate limits │
                    └───────────────┘
```

Requests from the frontend hit the **gateway**, which authenticates the user and reverse-proxies to the correct downstream service:

| Route prefix | Proxied to      | Purpose                                   |
| ------------- | ---------------- | ------------------------------------------ |
| `/api/auth`   | Auth Service     | Login / logout                             |
| `/api/chat`   | Chat Service      | Conversations & message history            |
| `/api/agent`  | Agent Service     | Prompt routing & agent execution           |
| `/api/billing`| Billing Service   | Razorpay order creation & verification     |
| `/api/me`     | Gateway (local)  | Current authenticated user (plan + credits) |

---

## 🧠 How Agent Routing Works

Every prompt sent to `/api/agent/chat` flows through a LangGraph `StateGraph`:

1. **Router node** — if the user hasn't pinned a specific agent, an LLM classifies the prompt into one of `chat`, `search`, `coding`, `pdf`, `ppt`, or `vision` based on explicit routing rules (e.g. "generate a report on X as PDF" → `pdf`). An uploaded **PDF** is auto-routed to `pdfRag`; an uploaded **image** to `imageAnalyzer`.
2. **Agent node** — the selected agent executes:
   - `search` results are handed to the **chat** agent to be summarized before the final answer.
   - `pdf` / `ppt` agents generate a file, upload it to S3/R2, and return a time-limited download link.
   - `vision` expands the prompt into a detailed image prompt, generates the image, and returns it through a storage link.
   - `pdfRag` splits the PDF, indexes chunks in Qdrant, retrieves the relevant context, and answers grounded in the document.
   - `coding` either generates a multi-file project (returned as a browsable artifact) or handles review/debug/explain requests.
3. **Credits** — each agent deducts the relevant credits **only after** a successful result and returns the remaining balance.
4. **Response** — the final `aiResponse` (and any images/artifacts) is saved to the Chat service and persisted against the conversation.

---

## 📁 Project Structure

```
NexusAI/
├── backend/
│   ├── .env.example              # All backend env vars, documented
│   ├── docker-compose.yml        # Redis · MongoDB · Qdrant (+ healthchecks)
│   ├── gateway/                  # API gateway (auth check + reverse proxy)
│   │   ├── config/               # local Redis client
│   │   ├── controllers/          # /api/me
│   │   ├── middleware/           # session auth middleware
│   │   └── utils/                # header-forwarding proxy helper
│   └── services/
│       ├── auth/                 # Firebase-backed authentication
│       ├── chat/                 # conversations & message persistence
│       ├── agent/                # LangGraph orchestration + agents
│       │   ├── agents/           # chat, search, coding, pdf, ppt, vision,
│       │   │                     # pdfRag, imageAnalyzer
│       │   ├── graph/            # StateGraph definition + router
│       │   ├── config/           # db, LLM models, memory, S3, Tavily, Qdrant
│       │   └── utils/            # PDF/PPT generation, S3 upload/download
│       └── billing/              # Razorpay orders & payment verification
└── frontend/
    ├── .env.example              # frontend env vars, documented
    └── src/
        ├── components/           # Chat UI, sidebar, artifact viewer, billing
        ├── features/             # API calls (auth, conversations, messages)
        ├── redux/                # Redux Toolkit slices (user, conversation, message)
        └── pages/                # Home / login
```

---

## 🛠️ Tech Stack

**Frontend**
- React 19 · Vite · Redux Toolkit · Tailwind CSS 4
- React Markdown + remark-gfm · PrismLight syntax highlighting · Monaco editor (lazy-loaded)
- Firebase (client) · Framer Motion (`motion`)

**Backend**
- Node.js 20+ · Express 5 (gateway + 4 microservices)
- MongoDB (Mongoose) · Redis (`ioredis`)
- Firebase Admin (server-side auth verification)

**AI / Agents**
- LangChain + LangGraph (`@langchain/langgraph`) orchestration
- LLMs: **Groq** · **Google Gemini** · **OpenRouter**
- Tavily (real-time search) · Qdrant (vector store) · Pollinations (image generation)
- `pdfkit` (PDF) · `pptxgenjs` (PowerPoint)

**Infrastructure**
- S3-compatible storage (AWS S3 or Cloudflare R2) — artifact storage via presigned/expiring links
- Docker — Redis, MongoDB, Qdrant for local dev

---

## 🚀 Getting Started

> **Deploying to production?** Follow the step-by-step non-AWS guide in
> **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** (Vercel + Render + Atlas + Upstash + Qdrant + Cloudflare R2).

### Prerequisites
- Node.js 20+ (Firebase Admin JSON import requires ≥20.10)
- Docker (for Redis / MongoDB / Qdrant)
- Firebase project + service account
- API keys: Groq, Google (Gemini), OpenRouter, Tavily, S3-compatible storage (AWS S3 or Cloudflare R2), Razorpay

### 1. Clone & install

```bash
git clone https://github.com/Tikesh097/NexusAI---MultiAgent-AI-Platform.git
cd NexusAI---MultiAgent-AI-Platform

# Frontend
cd frontend && npm install

# Backend — install each service
cd ../backend/gateway && npm install
cd ../services/auth && npm install
cd ../services/chat && npm install
cd ../services/agent && npm install
cd ../billing && npm install
```

### 2. Start the data layer

```bash
cd backend
cp .env.example .env     # then edit
docker compose up -d     # Redis + MongoDB + Qdrant
```

### 3. Configure environment variables

Copy the templates and fill in your values:

```bash
# Backend
cp backend/.env.example backend/.env
# Frontend
cp frontend/.env.example frontend/.env
```

> ⚠️ Never commit real `.env` files. They are gitignored.

You'll also need your Firebase service account at
`backend/services/auth/serviceAccountKey.json` (also gitignored).

### 4. Run the services (each in its own terminal)

```bash
cd backend/gateway && npm run dev
cd backend/services/auth && npm run dev
cd backend/services/chat && npm run dev
cd backend/services/agent && npm run dev
cd backend/services/billing && npm run dev
```

### 5. Run the frontend

```bash
cd frontend
npm run dev
```

The app runs at `http://localhost:5173` and talks to the gateway at `http://localhost:8000`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Used by | Description |
| --- | --- | --- |
| `PORT` | gateway | Gateway port (default `8000`) |
| `FRONTEND_URL` | gateway | Allowed CORS origin |
| `REDIS_URL` | gateway, agent, auth | Redis connection string |
| `MONGO_URI` | all services | MongoDB connection string |
| `AUTH_SERVICE` / `CHAT_SERVICE` / `AGENT_SERVICE` / `BILLING_SERVICE` | gateway | Internal service URLs |
| `GROQ_API_KEY`, `GROQ_MODEL` | agent | Groq chat/search/router model (default `openai/gpt-oss-120b`) |
| `GOOGLE_API_KEY`, `GEMINI_MODEL` | agent | Gemini (image analysis, embeddings) |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | agent | Coding model (default `deepseek/deepseek-chat`) |
| `TAVILY_API_KEY` | agent | Web search |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_ENDPOINT` | agent | S3 / R2 artifact storage |
| `QDRANT_URL` | agent | Vector DB for PDF-RAG |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | billing | Payment gateway |

### Frontend (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `VITE_SERVER_URL` | Backend gateway base URL (e.g. `http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay checkout key |

---

## 💳 Credits & Plans

| Plan | Price | Credits |
| --- | --- | --- |
| Free | ₹0 | 100 |
| Starter | ₹199 | 500 |
| Pro | ₹499 | 500 |

Agent requests consume credits (chat `1`, search `5`, coding `10`, pdf `10`, ppt `10`, vision `5`). Credits are deducted only after a successful result and are enforced server-side; the UI also shows rate-limit warnings per agent.

---

## 🔌 API Reference (via Gateway)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | — | Firebase token → session cookie |
| `GET` | `/api/auth/logout` | ✓ | Invalidate session |
| `GET` | `/api/me` | ✓ | Current user (plan, credits) |
| `POST` | `/api/chat/create-conversation` | ✓ | Create a conversation |
| `GET` | `/api/chat/get-conversations` | ✓ | List conversations |
| `GET` | `/api/chat/get-message/:id` | ✓ | Message history |
| `POST` | `/api/chat/save-message` | ✓ | Save a message |
| `POST` | `/api/chat/update-conversation` | ✓ | Rename a conversation |
| `POST` | `/api/agent/chat` | ✓ | Run an agent (multipart: prompt, agent, file) |
| `POST` | `/api/billing/create` | ✓ | Create a Razorpay order |
| `POST` | `/api/billing/verify` | ✓ | Verify a Razorpay payment |
| `GET` | `/health` | — | Liveness check (for ALB) |

---

## 🗺️ Roadmap

- [ ] Add automated tests across services (unit + integration)
- [ ] Add CI/CD pipeline (build, lint, test, deploy)
- [ ] Add per-agent usage analytics & dashboards
- [ ] Stream AI responses token-by-token (SSE)
- [ ] Add more file export formats (XLSX, DOCX)
- [ ] Deploy the full stack to a cloud host with one-command setup

---

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a PR

---

## 📄 License

No license has been specified yet. Add a `LICENSE` file to define usage terms.

---

## 👤 Author

**Tikesh097**
[GitHub](https://github.com/Tikesh097) · [Repository](https://github.com/Tikesh097/NexusAI---MultiAgent-AI-Platform)
```

That's the complete, final README. Save it as `README.md` at the repo root. It's committed in the local clone, and included in the `NexusAI-source.zip`. Want me to also drop it into your `files/` folder as a downloadable file so you can grab...it directly. Just let me know and I'll export it as a standalone file for you.

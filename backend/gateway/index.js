import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getCurrentUser } from "./controllers/user.controller.js";
import protect from "./middleware/auth.middleware.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan";

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();

// ===============================
// CORS CONFIGURATION
// ===============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://nexus-ai-multi-agent-ai-platform.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ===============================
// MIDDLEWARE
// ===============================

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "gateway",
  });
});

// ===============================
// API ROUTES
// ===============================

app.use(
  "/api/auth",
  proxy(process.env.AUTH_SERVICE),
);

app.use(
  "/api/chat",
  protect,
  proxyWithHeader(process.env.CHAT_SERVICE),
);

app.use(
  "/api/agent",
  protect,
  proxyWithHeader(process.env.AGENT_SERVICE),
);

app.use(
  "/api/billing",
  protect,
  proxyWithHeader(process.env.BILLING_SERVICE),
);

app.get(
  "/api/me",
  protect,
  getCurrentUser,
);

// ===============================
// START SERVER
// ===============================

app.listen(port, () => {
  console.log(`Gateway is Running on port ${port}`);
  console.log("Allowed CORS origins:", allowedOrigins);
});
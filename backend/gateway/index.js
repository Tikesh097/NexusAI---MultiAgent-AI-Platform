import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import {
  getCurrentUser,
} from "./controllers/user.controller.js";

import protect from "./middleware/auth.middleware.js";

import {
  proxyWithHeader,
} from "./utils/proxyWithHeader.js";

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
      // Allow Postman and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked origin:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,
  })
);

// ===============================
// MIDDLEWARE
// ===============================

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Hello, NexusAI Gateway is working!",
  });
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
    service: "gateway",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// API ROUTES
// ===============================

app.use(
  "/api/auth",
  proxy(process.env.AUTH_SERVICE)
);

app.use(
  "/api/chat",
  protect,
  proxyWithHeader(process.env.CHAT_SERVICE)
);

app.use(
  "/api/agent",
  protect,
  proxyWithHeader(process.env.AGENT_SERVICE)
);

app.use(
  "/api/billing",
  protect,
  proxyWithHeader(process.env.BILLING_SERVICE)
);

app.get(
  "/api/me",
  protect,
  getCurrentUser
);

// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Gateway route not found",
    path: req.originalUrl,
  });
});

// ===============================
// START SERVER
// ===============================

app.listen(port, () => {
  console.log(
    `Gateway is running on port ${port}`
  );

  console.log(
    "Allowed CORS origins:",
    allowedOrigins
  );
});
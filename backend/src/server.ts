import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "@/config/passport";
import { connectMongo } from "@/config/mongo";
import { redis } from "@/config/redis"; // importing initializes the connection

import authRoutes from "@/routes/auth.routes";
import llmRoutes from "@/routes/llm.routes";
import billingRoutes from "@/routes/billing.routes";
import webhookRoutes from "@/routes/webhook.routes";
import contactRoutes from "@/routes/contact.routes";
import analyticsRoutes from "@/routes/Analytics.routes";
import teamRoutes from "@/routes/Team.routes";
import workspaceRoutes from "@/routes/Workspace.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import advancedRoutes from "@/routes/Advanced.routes";
import developerRoutes from "./routes/Developer.routes";
import { debugLogger } from "@/middleware/debugLogger.middleware";
import apiKeyRoutes from "./routes/apiKey.routes";
import widgetRoutes from "@/routes/widget.routes";
import teamChatRoutes from "@/routes/teamChat.routes";
import knowledgeRoutes from "@/routes/knowledge.routes";


const app = express();
const PORT = process.env.PORT || 5000;

// --- Global middleware ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

// Widget routes: open CORS — any business site can embed the widget.



// Stripe webhooks MUST be mounted with a raw body parser, and BEFORE
// express.json() below - Stripe's signature check needs the exact raw
// bytes of the request body, which JSON parsing would otherwise destroy.
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(debugLogger);
// Global rate limiter (per-IP) - a second, tighter limiter is applied on the LLM route itself
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);


app.use("/api/widget", cors(), widgetRoutes);

// Global CORS restriction applied to all remaining routes below
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/llm", llmRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/advanced", advancedRoutes);
app.use( "/api/developer", developerRoutes);
app.use( "/api/api-keys",apiKeyRoutes);
app.use("/api/team-chat", teamChatRoutes);
app.use("/api/knowledge", knowledgeRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", redis: redis.status });
});

// --- Boot sequence ---
async function start() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
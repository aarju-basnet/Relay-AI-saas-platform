import rateLimit from "express-rate-limit";

/**
 * Tight limiter for auth endpoints (login, register, password reset).
 * Prevents credential-stuffing / brute-force bots.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Try again later." },
});

/**
 * LLM endpoint — this is where bots cost you real money (API usage).
 * Keep this the strictest limiter in the app.
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down." },
});

/**
 * Public contact form — classic spam-bot target.
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Try again later." },
});

/**
 * Widget analytics ingestion — open to any embedding site, so it's the
 * most exposed public endpoint. Key by API key instead of IP where possible,
 * since many real users can share an IP (corporate NAT) but bots hitting
 * one org's key repeatedly should still get capped.
 */
export const widgetLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // fall back to IP if no api key resolved yet
    return (req as any).relayApiKeyId || req.ip;
  },
  message: { error: "Rate limit exceeded." },
});

/**
 * Billing/webhook-adjacent write endpoints — moderate limit, these are
 * lower-frequency by nature so tight limits here are safe.
 */
export const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
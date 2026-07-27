# Relay — Backend

A real, working backend showcasing: **Node.js + Express + TypeScript**, **PostgreSQL** (Prisma), **MongoDB** (Mongoose),
**Redis** (caching, rate limiting), **JWT + Google OAuth2** authentication, email verification & password reset
(**Brevo**), **Stripe** billing with a Free/Pro paywall, and **LLM chat** with a free-model fallback chain (**OpenRouter**).

## Why two databases?

- **PostgreSQL** — structured, relational data that needs integrity: users, billing/subscription state, refresh tokens.
- **MongoDB** — flexible/unstructured data: chat conversations, AI message metadata.

This is a deliberate architecture decision, not decoration — be ready to explain it in interviews.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Postgres, Mongo, Redis locally** (easiest via Docker):
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aisaas --name pg postgres:16
   docker run -d -p 27017:27017 --name mongo mongo:7
   docker run -d -p 6379:6379 --name redis redis:7
   ```

3. **Copy env file and fill in secrets**
   ```bash
   cp .env.example .env
   ```
   Every value is explained inline in `.env.example`. Summary of what you need:
   - JWT secrets: `openssl rand -base64 32` (run twice, one for access, one for refresh)
   - Google OAuth credentials (Google Cloud Console)
   - Brevo API key + a verified sender email (for verification/reset emails - free, 300/day)
   - Stripe test-mode secret key, a Pro price ID, and a webhook secret (all free in test mode)
   - OpenRouter API key (free, no card - for the LLM chat)

4. **Run the Prisma migration** (creates Postgres tables)
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Forward Stripe webhooks to your local server** (separate terminal, needs the [Stripe CLI](https://docs.stripe.com/stripe-cli)):
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
   This prints a webhook signing secret starting `whsec_...` - put that in `STRIPE_WEBHOOK_SECRET`.

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5000`, health check at `/health`.

## API Overview

| Route | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Email/password signup, sends verification email |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/refresh` | POST | Rotate access token |
| `/api/auth/logout` | POST | Revoke refresh token |
| `/api/auth/me` | GET | Current user (restores session on page refresh) |
| `/api/auth/google` | GET | Start Google OAuth flow |
| `/api/auth/google/callback` | GET | Google OAuth callback |
| `/api/auth/verify-email` | GET | Confirms email from the link sent on signup |
| `/api/auth/resend-verification` | POST | Re-sends the verification email |
| `/api/auth/forgot-password` | POST | Sends a password reset email |
| `/api/auth/reset-password` | POST | Sets a new password from a reset token |
| `/api/llm/chat` | POST | Send message, get AI reply (rate-limited by plan via Redis) |
| `/api/llm/conversations` | GET | List user's conversations |
| `/api/llm/conversations/:id` | GET | Get one conversation with full history |
| `/api/billing/create-checkout-session` | POST | Starts the Stripe Checkout upgrade flow |
| `/api/billing/create-portal-session` | POST | Opens Stripe's billing portal (manage/cancel) |
| `/api/webhooks/stripe` | POST | Stripe webhook - updates `user.plan` on subscription events |

## What's gated behind Pro

Right now it's one real, working example: Free users get 20 chat messages / 5 minutes, Pro users get 200 / 5 minutes
(`src/routes/llm.routes.ts`). That's intentionally simple - the point is the billing plumbing (Checkout, webhook,
Customer Portal, plan persisted in Postgres) is fully real, not mocked. Add more gated features by checking
`user.plan` anywhere you need to.

## Roadmap (build in this order)

1. ✅ Auth (JWT + Google OAuth + email verification + password reset)
2. ✅ LLM chat with conversation persistence and free-model fallback chain
3. ✅ Stripe billing (Checkout, webhook, Customer Portal, plan-gated rate limit)
4. ✅ React + TS frontend (Relay) - auth pages, dashboard, chat UI, pricing page
5. ⬜ **RAG**: file upload → chunk → embed → store vectors (pgvector or Mongo Atlas Vector Search) → retrieve before calling the LLM
6. ⬜ **Background jobs**: use BullMQ (already installed) + Redis to process embeddings/long LLM calls async
7. ⬜ **Streaming responses**: switch `/api/llm/chat` to Server-Sent Events or WebSocket (socket.io is installed)
8. ⬜ **Multi-tenancy**: teams/orgs with invite flows (the `Organization` model already exists in the schema)
9. ⬜ **Tests + CI**: Jest/Vitest + GitHub Actions
10. ⬜ **Deploy**: Render/Railway/Fly.io for backend, Vercel for frontend, managed Postgres/Mongo/Redis (Neon, Atlas, Upstash)

## What to say in interviews

- "I used Redis for rate limiting (plan-aware - Free vs Pro get different limits) and cache-aside for expensive queries."
- "Postgres holds anything relational - users, billing state - while Mongo holds variable-shape AI conversation data."
- "Refresh tokens are stored server-side and revocable, not just stateless JWTs, so I can actually log a user out or force a re-login after a password reset."
- "Stripe webhooks are mounted with a raw body parser *before* the global JSON middleware, because signature verification needs the exact original bytes - a detail that trips a lot of people up."
- "The LLM route tries a chain of free OpenRouter models in order, falling back automatically if one is down or rate-limited, so the feature stays up even when a single provider doesn't."

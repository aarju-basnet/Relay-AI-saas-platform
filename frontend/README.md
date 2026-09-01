# Relay — Frontend

React + TypeScript + Vite + Tailwind v4. Auth (email/password + Google OAuth), email verification,
password reset, a chat dashboard showing which free AI model answered each message, and a
Stripe-powered Pricing page with a Free/Pro paywall.

## Setup

```bash
npm install
cp .env.example .env   # points VITE_API_URL at your backend, defaults to localhost:5000
npm run dev            # http://localhost:5173
```

Make sure the backend (see `../backend/README.md`) is running alongside this.

## Structure

```
src/
├── main.tsx / App.tsx      routing entrypoint
├── index.css                Tailwind v4 theme (@theme block - no tailwind.config.js)
├── lib/api.ts                typed fetch client, talks to the backend only
├── context/AuthContext.tsx   current user, restores session via /api/auth/me
├── components/                Logo, Sidebar, MessageBubble, ProtectedRoute
└── pages/
    ├── Login.tsx / Register.tsx
    ├── ForgotPassword.tsx / ResetPassword.tsx / VerifyEmail.tsx
    ├── Dashboard.tsx          main chat interface
    └── Pricing.tsx            Free vs Pro, Stripe Checkout
```

## Design system

Tailwind v4's CSS-first `@theme` block in `src/index.css` defines every color/font/radius token
(`--color-copper`, `--color-ink-muted`, etc.) — there's no separate `tailwind.config.js`. Change
the palette by editing that one block; every `bg-copper`, `text-ink-muted`-style utility class
updates automatically.

## Notes

- `npm run build` runs `tsc -b && vite build` — both must pass clean before shipping.
- Never put secret API keys (Stripe secret key, Brevo key, etc.) in this folder's `.env` — only
  the backend should hold those. This frontend only ever talks to your own backend's REST API.

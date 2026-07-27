import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import passport from "@/config/passport";
import { prisma } from "@/config/postgres";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/utils/email";
import { getCurrentMembership } from "@/utils/membership";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

// Access token cookie lives 15 min (matches JWT_ACCESS_EXPIRES_IN default).
// Refresh token cookie lives 90 days - this is what lets someone stay
// logged in "even months later" without re-entering a password, as long
// as they're active at least once every 90 days.
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const isProduction =
    process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/",
  });
}

// Shared shape for every endpoint that returns a user, including whether
// they've completed workspace setup yet (frontend uses this to route
// between onboarding and the dashboard).
async function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  plan: string;
  avatarUrl: string | null;
}) {
  const membership = await getCurrentMembership(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    plan: user.plan,
    avatarUrl: user.avatarUrl,
    workspace: membership
      ? { id: membership.organizationId, name: membership.organizationName, role: membership.role }
      : null,
  };
}

// POST /api/auth/register - creates the personal owner account ONLY.
// No business info yet - workspace creation is a separate step, since one
// person may end up owning more than one business.
router.post("/register", async (req: Request, res: Response) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: { email, passwordHash, name, verificationToken, verificationExpires },
  });

  // Email sending shouldn't block or fail registration - log and move on if it errors
  // (e.g. Brevo credentials not yet configured in .env).
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  const payload = { userId: user.id };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ user: await serializeUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = credentialsSchema.omit({ name: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const payload = { userId: user.id };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  setAuthCookies(res, accessToken, refreshToken);
  res.json({ user: await serializeUser(user) });
});

// POST /api/auth/refresh - rotate access token using refresh token
router.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
   const stored = await prisma.refreshToken.findUnique({
  where: {
    token,
  },
});

if (
  !stored ||
  stored.revoked ||
  stored.expiresAt < new Date()
) {
  return res.status(401).json({
    error: "Refresh token invalid or expired",
  });
}

const decoded =
  verifyRefreshToken(token);

// Revoke the old refresh token
await prisma.refreshToken.update({
  where: {
    token,
  },
  data: {
    revoked: true,
  },
});

// Create brand-new tokens
const newAccessToken =
  signAccessToken({
    userId: decoded.userId,
  });

const newRefreshToken =
  signRefreshToken({
    userId: decoded.userId,
  });

// Save the new refresh token
await prisma.refreshToken.create({
  data: {
    token: newRefreshToken,
    userId: decoded.userId,
    expiresAt: new Date(
      Date.now() +
        90 * 24 * 60 * 60 * 1000
    ),
  },
});

// Send fresh cookies
setAuthCookies(
  res,
  newAccessToken,
  newRefreshToken
);

return res.json({
  success: true,
});
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

// --- Google OAuth ---
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = req.user as any;
    const payload = { userId: user.id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    setAuthCookies(res, accessToken, refreshToken);
    // Frontend checks the user's workspace status on load and routes to
    // onboarding automatically if this is a brand new Google sign-up.
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// GET /api/auth/verify-email?token=... - confirms the user's email address
router.get("/verify-email", async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) return res.status(400).json({ error: "Missing verification token" });

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });
  if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
    return res.status(400).json({ error: "Verification link is invalid or has expired" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationExpires: null },
  });

  res.json({ message: "Email verified" });
});

// POST /api/auth/resend-verification - requires being logged in
router.post("/resend-verification", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.emailVerified) return res.status(400).json({ error: "Email is already verified" });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { verificationToken, verificationExpires } });

  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return res.status(502).json({ error: "Couldn't send email right now, try again shortly" });
  }

  res.json({ message: "Verification email sent" });
});

// POST /api/auth/forgot-password - always returns 200 so we don't leak which emails exist
router.post("/forgot-password", async (req: Request, res: Response) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.passwordHash) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetExpires } });
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
    }
  }

  res.json({ message: "If that email exists, a reset link has been sent" });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  const parsed = z
    .object({ token: z.string(), password: z.string().min(8) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { token, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetExpires || user.resetExpires < new Date()) {
    return res.status(400).json({ error: "Reset link is invalid or has expired" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetExpires: null },
  });

  // Revoke all existing sessions so old devices get logged out after a reset
  await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });

  res.json({ message: "Password updated, please sign in again" });
});

// GET /api/auth/me - returns the current user based on access token cookie
// Lets the frontend restore login state after a page refresh, and tells it
// whether the user still needs to complete workspace onboarding.
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: await serializeUser(user) });
});

export default router;
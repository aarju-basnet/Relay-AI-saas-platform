import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  generateTwoFactorSecret,
  getOtpAuthUrl,
  generateQrCodeDataUrl,
  verifyTwoFactorToken,
  generateBackupCodes,
} from "@/utils/twoFactor";

import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";

const router = Router();

/*
|--------------------------------------------------------------------------
| Change / Set Password
|--------------------------------------------------------------------------
|
| If the user already has a password (local signup, or previously set one
| after Google signup), currentPassword is required and verified.
| If they're Google-only (passwordHash is null), they're SETTING a
| password for the first time - no currentPassword needed.
|
*/

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

router.post(
  "/change-password",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const { currentPassword, newPassword } = parsed.data;
      const userId = req.auth!.userId;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found." });

      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({
            error: "Current password is required.",
          });
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
          return res.status(401).json({ error: "Current password is incorrect." });
        }
      }

      const newHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      // Revoke all other sessions after a password change - standard
      // security practice, forces re-login everywhere except here.
      await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });

      return res.json({
        success: true,
        message: user.passwordHash
          ? "Password changed. You've been logged out of other devices."
          : "Password set successfully. You can now log in with email and password too.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update password." });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Connected Accounts
|--------------------------------------------------------------------------
*/

router.get(
  "/connected-accounts",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
        select: {
          provider: true,
          providerId: true,
          passwordHash: true,
          email: true,
          twoFactorEnabled: true, // add this
        },
      });

      if (!user) return res.status(404).json({ error: "User not found." });

      return res.json({
        google: { connected: !!user.providerId },
        password: { set: !!user.passwordHash },
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled, // add this
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to load account info." });
    }
  }
);


/*
|--------------------------------------------------------------------------
| Active Sessions
|--------------------------------------------------------------------------
*/

router.get(
  "/sessions",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const currentToken = req.cookies?.refreshToken;

      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId: req.auth!.userId,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        sessions: sessions.map((s) => ({
          id: s.id,
          userAgent: s.userAgent,
          ipAddress: s.ipAddress,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          isCurrent: s.token === currentToken,
        })),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to load sessions." });
    }
  }
);

router.delete(
  "/sessions/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const session = await prisma.refreshToken.findFirst({
        where: { id: req.params.id, userId: req.auth!.userId },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }

      await prisma.refreshToken.update({
        where: { id: session.id },
        data: { revoked: true },
      });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to revoke session." });
    }
  }
);

router.post(
  "/sessions/revoke-all",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const currentToken = req.cookies?.refreshToken;

      await prisma.refreshToken.updateMany({
        where: {
          userId: req.auth!.userId,
          revoked: false,
          NOT: { token: currentToken },
        },
        data: { revoked: true },
      });

      return res.json({ success: true, message: "Logged out of all other devices." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to revoke sessions." });
    }
  }
);



// POST /api/security/2fa/setup - generates a secret + QR code, but does NOT
// enable 2FA yet. User must verify a code first (see /2fa/verify) to prove
// they've actually added it to their authenticator app.
router.post(
  "/2fa/setup",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
      });
      if (!user) return res.status(404).json({ error: "User not found." });

      if (user.twoFactorEnabled) {
        return res.status(400).json({ error: "Two-factor authentication is already enabled." });
      }

      const secret = generateTwoFactorSecret();
      const otpAuthUrl = getOtpAuthUrl(user.email, secret);
      const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUrl);

      // Store secret now (unconfirmed) so /2fa/verify can check against it.
      // twoFactorEnabled stays false until verified.
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      });

      return res.json({ qrCodeDataUrl, secret });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to start two-factor setup." });
    }
  }
);

// POST /api/security/2fa/verify - confirms the code from the authenticator
// app matches, then actually turns 2FA on and issues backup codes (shown
// once - store client-side prompt to save them).
const verifyTwoFactorSchema = z.object({
  token: z.string().min(6).max(6),
});

router.post(
  "/2fa/verify",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = verifyTwoFactorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
      });
      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ error: "Two-factor setup has not been started." });
      }

      const isValid = await verifyTwoFactorToken(parsed.data.token, user.twoFactorSecret);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid verification code." });
      }

      const backupCodes = generateBackupCodes();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: backupCodes,
        },
      });

      return res.json({
        success: true,
        message: "Two-factor authentication enabled.",
        backupCodes,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to verify two-factor code." });
    }
  }
);

// POST /api/security/2fa/disable - requires current password to confirm
// identity before turning off 2FA (standard practice, prevents someone
// with a stolen session from silently disabling it).
const disableTwoFactorSchema = z.object({
  password: z.string().min(8),
});

router.post(
  "/2fa/disable",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const parsed = disableTwoFactorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
      });
      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: "Password not set on this account." });
      }

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Incorrect password." });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        },
      });

      return res.json({ success: true, message: "Two-factor authentication disabled." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to disable two-factor authentication." });
    }
  }
);

export default router;
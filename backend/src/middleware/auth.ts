import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "@/utils/jwt";
import { prisma } from "@/config/postgres";

// Named `auth` (not `user`) so it doesn't collide with Passport's own
// global Express.User augmentation on req.user (used only during the
// OAuth callback, before we've issued our own JWT).
export interface AuthRequest extends Request {
  auth?: JwtPayload;
}

// In-memory throttle so we're not writing to the DB on every single
// authenticated request - each user's lastActiveAt only actually gets
// updated at most once per 5 minutes. Fine to live in memory (not Redis)
// since worst case on a restart is one extra early write per user.
const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;
const lastWriteAt = new Map<string, number>();

function markActive(userId: string) {
  const now = Date.now();
  const last = lastWriteAt.get(userId) ?? 0;

  if (now - last < ACTIVITY_THROTTLE_MS) return; // too soon, skip

  lastWriteAt.set(userId, now);

  // Fire and forget - this should never slow down or fail the actual
  // request it's piggybacking on.
  prisma.user
    .update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    })
    .catch((err) => console.error("Failed to update lastActiveAt:", err));
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    req.auth = verifyAccessToken(token);
    markActive(req.auth.userId);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "@/utils/jwt";

// Named `auth` (not `user`) so it doesn't collide with Passport's own
// global Express.User augmentation on req.user (used only during the
// OAuth callback, before we've issued our own JWT).
export interface AuthRequest extends Request {
  auth?: JwtPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import { prisma } from "@/config/postgres";
import { getCachedApiKey, setCachedApiKey } from "@/utils/apiKeyCache"; // ← confirm this path

export interface RelayRequest extends Request {
  relayApiKeyId?: string;
  organization?: {
    id: string;
    plan: "FREE" | "PRO" | "ENTERPRISE";
  };
}

export async function verifyRelayApiKey(
  req: RelayRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.header("X-Relay-Key");

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "Missing Relay API Key.",
      });
    }

    const hashedKey = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const cached = getCachedApiKey(hashedKey);

   if (cached) {
  if (cached.revoked) {
    return res.status(403).json({
      success: false,
      message: "API Key has been revoked.",
    });
  }

  req.relayApiKeyId = cached.id;
  req.organization = {
    id: cached.organizationId,
    plan: cached.plan,
  };
  return next();
}

    const key = await prisma.apiKey.findUnique({
      where: { hashedKey },
      include: { organization: true },
    });

    if (!key) {
      return res.status(401).json({
        success: false,
        message: "Invalid API Key.",
      });
    }

    if (key.revoked) {
      return res.status(403).json({
        success: false,
        message: "API Key has been revoked.",
      });
    }

    if (key.organization.plan === "FREE") {
      return res.status(403).json({
        success: false,
        message: "Analytics requires an active subscription.",
      });
    }

    setCachedApiKey(hashedKey, {
      id: key.id,
      organizationId: key.organization.id,
      plan: key.organization.plan,
      revoked: key.revoked,
    });

    const now = new Date();
    const shouldUpdate =
      !key.lastUsed ||
      now.getTime() - key.lastUsed.getTime() > 5 * 60 * 1000;

    if (shouldUpdate) {
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsed: now },
      });
    }

    req.relayApiKeyId = key.id;
    req.organization = {
      id: key.organization.id,
      plan: key.organization.plan,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify API Key.",
    });
  }
}
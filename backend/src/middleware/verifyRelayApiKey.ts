import { Request, Response, NextFunction } from "express";

import { prisma } from "@/config/postgres";

export interface RelayRequest extends Request {
  organizationId?: string;
}

export async function verifyRelayApiKey(
  req: RelayRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.header("x-relay-api-key");

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "Relay API Key is missing.",
      });
    }

    const key = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        revoked: false,
      },
    });

    if (!key) {
      return res.status(401).json({
        success: false,
        message: "Invalid Relay API Key.",
      });
    }

    req.organizationId = key.organizationId;

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify Relay API Key.",
    });
  }
}
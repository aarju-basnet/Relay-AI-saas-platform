import "express";

declare global {
  namespace Express {
    interface Request {
      organization?: {
        id: string;
        plan: "FREE" | "PRO" | "ENTERPRISE";
      };

      relayApiKeyId?: string;
    }
  }
}

export {};
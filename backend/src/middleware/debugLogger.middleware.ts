import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/postgres";
import { logDebug } from "@/utils/debugLogger";
import { RelayRequest } from "@/middleware/verifyRelayApiKey"; // adjust path if this middleware lives elsewhere

/**
 * Scoped to widget/API-key routes only (mount AFTER verifyRelayApiKey),
 * not applied globally - dashboard traffic isn't what Developer Mode's
 * inspector is for, and logging every internal click would drown out
 * the signal this feature actually exists to surface.
 *
 * Only writes a row if the request's workspace has debugLogs enabled -
 * checked lazily here rather than cached on the API key, since it's a
 * separate on/off toggle from plan-based access and can change anytime.
 */
export async function debugLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const started = Date.now();
  const relayReq = req as RelayRequest;

  res.on("finish", async () => {
    try {
      const organizationId = relayReq.organization?.id;
      if (!organizationId) return; // no resolved workspace, nothing to attribute this to

      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { debugLogs: true },
      });

      if (!org?.debugLogs) return; // toggle is off for this workspace, skip the write entirely

      const duration = Date.now() - started;

      await logDebug({
        level:
          res.statusCode >= 500
            ? "ERROR"
            : res.statusCode >= 400
            ? "WARNING"
            : "INFO",
        action: `${req.method} ${req.path}`,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        message: `${req.method} ${req.originalUrl} completed in ${duration}ms`,
        workspaceId: organizationId,
      });
    } catch (err) {
      console.error("debugLogger error:", err);
    }
  });

  next();
}
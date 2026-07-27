import { Request, Response, NextFunction } from "express";

import { logDebug } from "../utils/debugLogger";

export async function debugLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const started = Date.now();

  res.on("finish", async () => {
    try {
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

        message: `${req.method} ${req.originalUrl} completed in ${duration} ms`,

        userId: (req as any).user?.id,

        workspaceId: (req as any).user?.workspaceId,
      });
    } catch (err) {
      console.error(err);
    }
  });

  next();
}
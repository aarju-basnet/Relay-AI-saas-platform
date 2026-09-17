import { Response } from "express";
import os from "os";

import { AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getMembershipForOrg } from "@/utils/membership";

export async function getSystemStatus(
  req: AuthRequest,
  res: Response
) {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    const memoryUsed = totalMemory - freeMemory;

    const uptimeSeconds = process.uptime();

    res.json({
      status: {
        server: "Online",

        environment:
          process.env.NODE_ENV || "development",

        nodeVersion: process.version,

        platform: process.platform,

        cpuCores: os.cpus().length,

        architecture: process.arch,

        uptime: uptimeSeconds,

        memory: {
          total: totalMemory,
          used: memoryUsed,
          free: freeMemory,
        },
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to load system status.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/developer/logs
|--------------------------------------------------------------------------
|
| Returns paginated widget/API request logs for the current user's
| workspace. Gated behind Developer Mode being enabled on the workspace -
| this is checked here (DB lookup) rather than in route middleware,
| since it needs the resolved membership/organization first.
|
*/
export async function getDeveloperLogs(
  req: AuthRequest,
  res: Response
) {
  try {
    const { organizationId } = req.params;

    const membership = await getMembershipForOrg(req.auth!.userId, organizationId);

    if (!membership) {
      return res.status(403).json({
        error: "You don't have access to this workspace.",
      });
    }

    const workspace = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { developerMode: true },
    });

    if (!workspace?.developerMode) {
      return res.status(403).json({
        error: "Developer Mode is not enabled for this workspace.",
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = 50;

    const [logs, total] = await Promise.all([
      prisma.debugLog.findMany({
        where: { workspaceId: organizationId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.debugLog.count({
        where: { workspaceId: organizationId },
      }),
    ]);

    return res.json({
      logs,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to load logs.",
    });
  }
}
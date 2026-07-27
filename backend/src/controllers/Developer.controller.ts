import { Request, Response } from "express";
import os from "os";

export async function getSystemStatus(
  req: Request,
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
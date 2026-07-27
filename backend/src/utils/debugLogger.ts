import { prisma } from "@/config/postgres";

interface DebugLogInput {
  level: "INFO" | "WARNING" | "ERROR";

  action: string;

  endpoint?: string;

  method?: string;

  statusCode?: number;

  message: string;

  userId?: string;

  workspaceId?: string;
}

export async function logDebug(
  data: DebugLogInput
) {
  try {
    await prisma.debugLog.create({
      data: {
        level: data.level,

        action: data.action,

        endpoint: data.endpoint,

        method: data.method,

        statusCode: data.statusCode,

        message: data.message,

        userId: data.userId,

        workspaceId: data.workspaceId,
      },
    });
  } catch (err) {
    console.error(
      "Debug Logger Error:",
      err
    );
  }
}
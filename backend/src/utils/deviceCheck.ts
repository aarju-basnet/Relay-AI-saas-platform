// backend/src/utils/deviceCheck.ts
import { prisma } from "@/config/postgres";

export async function isNewDevice(userId: string, userAgent: string | null): Promise<boolean> {
  if (!userAgent) return false; // can't fingerprint, don't false-alarm
  const existing = await prisma.refreshToken.findFirst({
    where: { userId, userAgent, revoked: false },
  });
  return !existing;
}
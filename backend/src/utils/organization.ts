import { prisma } from "@/config/postgres";

export async function getMembership(
  userId: string,
  organizationId: string
) {
  return prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
}
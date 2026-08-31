import { prisma } from "@/config/postgres";

export interface CurrentMembership {
  organizationId: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

/**
 * Returns the user's workspace membership. A user can technically belong to
 * more than one workspace (Membership is many-to-many), but Relay doesn't
 * have a workspace switcher UI yet, so every route just uses the first one -
 * this is the one place that assumption lives, so it's easy to change later.
 */
export async function getCurrentMembership(userId: string): Promise<CurrentMembership | null> {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: { select: { id: true, name: true, logoUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) return null;

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationLogoUrl: membership.organization.logoUrl,
    role: membership.role as "OWNER" | "ADMIN" | "MEMBER",
  };
}
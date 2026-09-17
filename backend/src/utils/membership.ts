import { prisma } from "@/config/postgres";

export interface CurrentMembership {
  organizationId: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  analyticsLive: boolean;
  analyticsLiveSeen: boolean;
}

/**
 * Returns the user's membership for a SPECIFIC organization, verifying
 * they actually belong to it. This is the authorization check for every
 * org-scoped route — never trust an organizationId from a request without
 * calling this first.
 */
export async function getMembershipForOrg(
  userId: string,
  organizationId: string
): Promise<CurrentMembership | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          analyticsLive: true,
          analyticsLiveSeen: true,
        },
      },
    },
  });

  if (!membership) return null;

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationLogoUrl: membership.organization.logoUrl,
    role: membership.role as "OWNER" | "ADMIN" | "MEMBER",
    analyticsLive: membership.organization.analyticsLive,
    analyticsLiveSeen: membership.organization.analyticsLiveSeen,
  };
}

/**
 * Returns ALL organizations the user belongs to — for the org
 * picker/switcher UI (list view, "New organization" gating, etc).
 */
export async function getAllMembershipsForUser(userId: string): Promise<CurrentMembership[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          analyticsLive: true,
          analyticsLiveSeen: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    organizationId: m.organizationId,
    organizationName: m.organization.name,
    organizationLogoUrl: m.organization.logoUrl,
    role: m.role as "OWNER" | "ADMIN" | "MEMBER",
    analyticsLive: m.organization.analyticsLive,
    analyticsLiveSeen: m.organization.analyticsLiveSeen,
  }));
}
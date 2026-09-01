import { prisma } from "@/config/postgres";

export async function hasActiveKnowledgeBaseAccess(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, proExpiresAt: true },
  });

  if (!organization) {
    return { allowed: false, reason: "Organization not found." };
  }

  if (organization.plan === "FREE") {
    return {
      allowed: false,
      reason: "Knowledge Base is a Pro feature. Upgrade to unlock it.",
    };
  }

  if (!organization.proExpiresAt || organization.proExpiresAt < new Date()) {
    return {
      allowed: false,
      reason: "Your Pro subscription has expired. Renew to keep using Knowledge Base.",
    };
  }

  return { allowed: true };
}
import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getMembershipForOrg, getAllMembershipsForUser } from "@/utils/membership";

const router = Router();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "workspace";
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

const INDUSTRIES = [
  "Technology",
  "Education",
  "Healthcare",
  "Finance",
  "E-Commerce",
  "Travel",
  "Food",
  "Real Estate",
  "Legal",
  "Marketing",
  "Manufacturing",
  "Government",
  "Other",
] as const;

const COMPANY_SIZES = ["Just Me", "2-10", "11-50", "51-200", "201-500", "500+"] as const;

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  industry: z.enum(INDUSTRIES).optional(),
  companySize: z.enum(COMPANY_SIZES).optional(),
});

const PLAN_ORG_LIMITS: Record<string, number> = {
  FREE: 2,
  PRO: 10,
  ENTERPRISE: Infinity,
};

// POST /api/workspace - Page 2 of onboarding, or "create another workspace"
// once multi-workspace exists. Creates the Organization and a Membership
// linking the current user to it as OWNER, gated by the user's plan limit.
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.auth!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const existingMemberships = await getAllMembershipsForUser(userId);
  const ownedCount = existingMemberships.filter((m) => m.role === "OWNER").length;
  const limit = PLAN_ORG_LIMITS[user.plan] ?? PLAN_ORG_LIMITS.FREE;

  if (ownedCount >= limit) {
    return res.status(403).json({
      error: `Your ${user.plan} plan allows up to ${limit} workspace(s). Upgrade to create more.`,
    });
  }

  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const slug = await uniqueSlug(slugify(parsed.data.name));

  const organization = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      industry: parsed.data.industry,
      companySize: parsed.data.companySize,
      memberships: { create: { userId, role: "OWNER" } },
    },
  });

  res.status(201).json({
    workspace: { id: organization.id, name: organization.name, slug: organization.slug, role: "OWNER" },
  });
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),

  logoUrl: z.string().url().optional().nullable(),

  website: z.string().url().optional().nullable(),

  businessEmail: z.string().email().optional().nullable(),

  industry: z.enum(INDUSTRIES).optional(),

  companySize: z.enum(COMPANY_SIZES).optional(),

  country: z.string().optional(),

  timeZone: z.string().optional(),
});

// GET /api/workspace/:organizationId - that workspace's full settings (Stage 2 fields)
router.get("/:organizationId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });

  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) return res.status(404).json({ error: "Workspace not found" });

  res.json({ workspace: organization });
});

// PATCH /api/workspace/:organizationId - Stage 2 settings (logo, website, business email, etc).
// OWNER or ADMIN only.
router.patch("/:organizationId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return res.status(403).json({ error: "Only owners and admins can edit workspace settings" });
  }

  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: parsed.data,
  });

  res.json({ workspace: organization });
});


router.patch("/:organizationId/analytics-seen", requireAuth, async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params;
  const membership = await getMembershipForOrg(req.auth!.userId, organizationId);
  if (!membership) return res.status(403).json({ error: "You don't have access to this workspace." });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { analyticsLiveSeen: true },
  });

  res.json({ success: true });
});

export default router;
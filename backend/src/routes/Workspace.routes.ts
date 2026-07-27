import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";

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

// POST /api/workspace - Page 2 of onboarding. Creates the Organization and
// a Membership linking the current user to it as OWNER.
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const existing = await getCurrentMembership(req.auth!.userId);
  if (existing) {
    return res.status(400).json({ error: "You already have a workspace. Multi-workspace switching isn't built yet." });
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
      memberships: { create: { userId: req.auth!.userId, role: "OWNER" } },
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

// GET /api/workspace - current workspace's full settings (Stage 2 fields)
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });

  const organization = await prisma.organization.findUnique({ where: { id: membership.organizationId } });
  if (!organization) return res.status(404).json({ error: "Workspace not found" });

  res.json({ workspace: organization });
});

// PATCH /api/workspace - Stage 2 settings (logo, website, business email, etc).
// OWNER or ADMIN only.
router.patch("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const membership = await getCurrentMembership(req.auth!.userId);
  if (!membership) return res.status(400).json({ error: "You're not part of a workspace yet" });
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return res.status(403).json({ error: "Only owners and admins can edit workspace settings" });
  }

  const parsed = updateWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const organization = await prisma.organization.update({
    where: { id: membership.organizationId },
    data: parsed.data,
  });

  res.json({ workspace: organization });
});

export default router;
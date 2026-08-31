import { Router, Response } from "express";
import crypto from "crypto";
import { z } from "zod";

import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { sendTeamInviteEmail } from "@/utils/email";
import { getCurrentMembership } from "@/utils/membership";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

function getSeatCap(plan: string): number {
  switch (plan) {
    case "PRO":
      return 50;
    case "ENTERPRISE":
      return Infinity;
    default:
      return 2;
  }
}

async function getWorkspaceOwnerPlan(
  organizationId: string
): Promise<string> {
  const owner = await prisma.membership.findFirst({
    where: {
      organizationId,
      role: "OWNER",
    },

    include: {
      user: {
        select: {
          plan: true,
        },
      },
    },
  });

  return owner?.user.plan || "FREE";
}

/* -------------------------------------------------------------------------- */
/*                              GET TEAM MEMBERS                              */
/* -------------------------------------------------------------------------- */

router.get(
  "/members",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const membership = await getCurrentMembership(
      req.auth!.userId
    );

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of any workspace.",
      });
    }

    const members = await prisma.membership.findMany({
      where: {
        organizationId: membership.organizationId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
             invitePending: true,
            plan: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    const ownerPlan = await getWorkspaceOwnerPlan(
      membership.organizationId
    );

    const seatCap = getSeatCap(ownerPlan);

    res.json({
      seatCap,

      members: members.map((member) => ({
        id: member.user.id,

        name: member.user.name,

        email: member.user.email,

        avatarUrl: member.user.avatarUrl,

        role: member.role,

        joinedAt: member.createdAt,

          status: member.user.invitePending ? "pending" : "active",
      })),
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                               INVITE MEMBER                                */
/* -------------------------------------------------------------------------- */

const inviteSchema = z.object({
  email: z.string().email(),

  name: z.string().optional(),
});

/* -------------------------------------------------------------------------- */
/*                              INVITE TEAM MEMBER                            */
/* -------------------------------------------------------------------------- */

router.post(
  "/invite",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const requester = await getCurrentMembership(
      req.auth!.userId
    );

    if (!requester) {
      return res.status(400).json({
        error: "You're not part of any workspace.",
      });
    }

    if (
      requester.role !== "OWNER" &&
      requester.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error:
          "Only Owners and Admins can invite members.",
      });
    }

    const parsed = inviteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten(),
      });
    }

    const { email, name } = parsed.data;

    /* ---------------------------------------------------- */
    /* Prevent duplicate Relay accounts                     */
    /* ---------------------------------------------------- */

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error:
          "A Relay account with this email already exists.",
      });
    }

    /* ---------------------------------------------------- */
    /* Check seat limit                                     */
    /* ---------------------------------------------------- */

    const ownerPlan = await getWorkspaceOwnerPlan(
      requester.organizationId
    );

    const seatCap = getSeatCap(ownerPlan);

    const totalMembers =
      await prisma.membership.count({
        where: {
          organizationId: requester.organizationId,
        },
      });

    if (totalMembers >= seatCap) {
      return res.status(402).json({
        error: `Seat limit reached (${seatCap}). Upgrade your workspace to invite more members.`,
      });
    }

    /* ---------------------------------------------------- */
    /* Get workspace                                        */
    /* ---------------------------------------------------- */

    const workspace =
      await prisma.organization.findUnique({
        where: {
          id: requester.organizationId,
        },
      });

    if (!workspace) {
      return res.status(404).json({
        error: "Workspace not found.",
      });
    }

    /* ---------------------------------------------------- */
    /* Create invitation                                    */
    /* ---------------------------------------------------- */

    const inviteToken =
      crypto.randomBytes(32).toString("hex");

    const expires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

   const member = await prisma.user.create({
  data: {
    email,
    name,
    emailVerified: true,
    invitePending: true,
    resetToken: inviteToken,
    resetExpires: expires,
    memberships: {
      create: {
        organizationId: workspace.id,
        role: "MEMBER",
      },
    },
  },
});
    /* ---------------------------------------------------- */
    /* Send invitation email                                */
    /* ---------------------------------------------------- */

    const inviter = await prisma.user.findUnique({
      where: {
        id: req.auth!.userId,
      },
    });

    try {
      await sendTeamInviteEmail(
        email,
        inviter?.name ||
          inviter?.email ||
          "Workspace Admin",
        workspace.name,
        inviteToken
      );
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error:
          "Invitation created, but email could not be sent.",
      });
    }

    res.status(201).json({
      member: {
        id: member.id,

        name: member.name,

        email: member.email,

        role: "MEMBER",

        status: "pending",
      },
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                         UPDATE MEMBER ROLE (OWNER)                         */
/* -------------------------------------------------------------------------- */

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

router.patch(
  "/members/:id/role",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const requester = await getCurrentMembership(
      req.auth!.userId
    );

    if (!requester) {
      return res.status(400).json({
        error: "You're not part of any workspace.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Only Owner can promote or demote members                   */
    /* ---------------------------------------------------------- */

    if (requester.role !== "OWNER") {
      return res.status(403).json({
        error: "Only the workspace owner can change member roles.",
      });
    }

    const parsed = updateRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten(),
      });
    }

    const { role } = parsed.data;

    const targetMembership =
      await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: req.params.id,
            organizationId: requester.organizationId,
          },
        },
      });

    if (!targetMembership) {
      return res.status(404).json({
        error: "Team member not found.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Owner cannot change himself                                */
    /* ---------------------------------------------------------- */

    if (targetMembership.userId === req.auth!.userId) {
      return res.status(400).json({
        error: "You cannot change your own role.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Owner role is protected                                    */
    /* ---------------------------------------------------------- */

    if (targetMembership.role === "OWNER") {
      return res.status(400).json({
        error: "Workspace owner role cannot be changed.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Already same role                                          */
    /* ---------------------------------------------------------- */

    if (targetMembership.role === role) {
      return res.status(400).json({
        error: `User is already ${role}.`,
      });
    }

    const updated = await prisma.membership.update({
      where: {
        id: targetMembership.id,
      },

      data: {
        role,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({
      message: `Role updated to ${role}.`,

      member: {
        id: updated.user.id,

        name: updated.user.name,

        email: updated.user.email,

        avatarUrl: updated.user.avatarUrl,

        role: updated.role,
      },
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                           REMOVE TEAM MEMBER                               */
/* -------------------------------------------------------------------------- */

router.delete(
  "/members/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const requester = await getCurrentMembership(
      req.auth!.userId
    );

    if (!requester) {
      return res.status(400).json({
        error: "You're not part of any workspace.",
      });
    }

    if (
      requester.role !== "OWNER" &&
      requester.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "Only owners and admins can remove members.",
      });
    }

    const targetMembership =
      await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: req.params.id,
            organizationId: requester.organizationId,
          },
        },

        include: {
          user: {
            select: {
              id: true,
              invitePending: true,
              email: true,
              name: true,
            },
          },
        },
      });

    if (!targetMembership) {
      return res.status(404).json({
        error: "Member not found.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Can't remove yourself                                      */
    /* ---------------------------------------------------------- */

    if (targetMembership.user.id === req.auth!.userId) {
      return res.status(400).json({
        error: "You cannot remove yourself.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Owner is protected                                         */
    /* ---------------------------------------------------------- */

    if (targetMembership.role === "OWNER") {
      return res.status(400).json({
        error: "Workspace owner cannot be removed.",
      });
    }

    /* ---------------------------------------------------------- */
    /* Admin permissions                                          */
    /* ---------------------------------------------------------- */

    if (requester.role === "ADMIN") {
      if (targetMembership.role === "ADMIN") {
        return res.status(403).json({
          error: "Admins cannot remove other admins.",
        });
      }

    //  if (targetMembership.role === "OWNER") {
      //  return res.status(403).json({
        //  error: "Admins cannot remove the owner.",
        //});
      //}
    }

    /* ---------------------------------------------------------- */
    /* Pending Invite                                             */
    /* ---------------------------------------------------------- */

   if (targetMembership.user.invitePending) {
  await prisma.user.delete({
    where: { id: targetMembership.user.id },
  });
  return res.json({ message: "Pending invitation deleted." });
}

    /* ---------------------------------------------------------- */
    /* Active Member                                              */
    /* ---------------------------------------------------------- */

    await prisma.membership.delete({
      where: {
        id: targetMembership.id,
      },
    });

    return res.json({
      message: "Member removed successfully.",
    });
  }
);

export default router;
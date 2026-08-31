import { Response } from "express";
import { randomBytes } from "crypto";
import { generateApiKey, hashApiKey, getPrefix } from "@/utils/apiKey";
import { prisma } from "@/config/postgres";
import { AuthRequest } from '@/middleware/auth';
import { getMembership } from "@/utils/organization";
import { canManageApiKeys } from "../utils/permissions";

export async function createApiKey(
  req: AuthRequest,
  res: Response
) {
  try {
    const { organizationId, name } = req.body;

    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const userId = req.auth.userId;

    if (!organizationId || !name) {
      return res.status(400).json({
        success: false,
        message: "Organization and name are required.",
      });
    }

    const membership = await getMembership(
      userId,
      organizationId
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this organization.",
      });
    }

    const organization =
      await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    if (organization.plan === "FREE") {
      return res.status(403).json({
        success: false,
        message:
          "Upgrade this business to Pro before generating an API Key.",
      });
    }

  // UPDATE THIS BLOCK in createApiKey:
//const existingKey = await prisma.apiKey.findFirst({
 // where: {
   // organizationId,
   // revoked: false, // <-- Only block if an ACTIVE key currently exists
 // },
//});

//if (existingKey) {
 // return res.status(400).json({
   // success: false,
   // message: "This business already has an active API Key. Revoke it before generating a new one.",
 // });
//}

    const apiKey = generateApiKey();

    const hashedKey = hashApiKey(apiKey);

    const prefix = getPrefix(apiKey);

    await prisma.apiKey.create({
      data: {
        name,
        prefix,
        hashedKey,
        organizationId,
        createdById: userId,
      },
    });

    return res.status(201).json({
      success: true,
      apiKey,
      message:
        "Copy this API Key now. It will never be shown again.",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create API Key.",
    });
  }
}


export async function getApiKeys(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.auth!.userId;

    const { organizationId } = req.params;

    const membership = await getMembership(
      userId,
      organizationId
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this organization.",
      });
    }

    const keys = await prisma.apiKey.findMany({
      where: {
        organizationId,
        revoked: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        revoked: true,
        createdAt: true,
        lastUsed: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      keys,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to load API keys.",
    });
  }
}

export async function revokeApiKey(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.auth!.userId;

    const { id } = req.params;

    // Find the API key first
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        id,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found.",
      });
    }

    // Check whether the current user belongs
    // to the same organisation.
    const membership = await getMembership(
      userId,
      apiKey.organizationId
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to revoke this API key.",
      });
    }

        if (!canManageApiKeys(membership.role)) {
  return res.status(403).json({
    success: false,
    message:
      "Only owners and admins can revoke API keys.",
  });
}

    await prisma.apiKey.update({
      where: {
        id,
      },
      data: {
        revoked: true,
      },
    });

    return res.json({
      success: true,
      message: "API key revoked successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to revoke API key.",
    });
  }
}
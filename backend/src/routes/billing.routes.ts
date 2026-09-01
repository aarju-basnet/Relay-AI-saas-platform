import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "@/config/postgres";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { getCurrentMembership } from "@/utils/membership";
import {
  buildEsewaFormFields,
  verifyEsewaCallback,
  checkEsewaStatus,
} from "@/utils/esewa";
import { initiateKhaltiPayment, lookupKhaltiPayment } from "@/utils/khalti";

const router = Router();

const CLIENT_URL =
  process.env.CLIENT_URL 

/*
|--------------------------------------------------------------------------
| Create Checkout Session
|--------------------------------------------------------------------------
|
| Instead of creating a real Stripe Checkout Session,
| we redirect the user to our own Demo Checkout page.
|
*/

router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const interval = req.body?.interval === "year" ? "year" : "month";

      const membership = await getCurrentMembership(req.auth!.userId);

      if (!membership) {
        return res.status(400).json({
          error: "You need a workspace before upgrading.",
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: membership.organizationId },
      });

      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      if (organization.plan === "PRO") {
        return res.status(400).json({
          error: "This workspace already has a Pro subscription.",
        });
      }

      return res.json({
        url: `${CLIENT_URL}/demo-checkout?interval=${interval}`,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Unable to create checkout session.",
      });
    }
  }
);

router.post("/create-portal-session", requireAuth, async (req, res) => {
  res.json({ url: `${CLIENT_URL}/demo-billing` });
});

/*
|--------------------------------------------------------------------------
| Complete Demo Payment
|--------------------------------------------------------------------------
|
| This endpoint is called ONLY after the user presses
| "Complete Payment" on the Demo Checkout page.
|
| IMPORTANT: plan lives on BOTH User (personal AI-chat access) and
| Organization (workspace-level features like API keys). Both must be
| updated together, in one transaction, or they can drift out of sync.
|
*/

router.post(
  "/demo-upgrade",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const interval = req.body?.interval === "year" ? "YEARLY" : "MONTHLY";
      const userId = req.auth!.userId;

      const membership = await getCurrentMembership(userId);

      if (!membership) {
        return res.status(400).json({
          error: "You need a workspace before upgrading.",
        });
      }

      const [user, organization] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { plan: "PRO" },
        }),
        prisma.organization.update({
          where: { id: membership.organizationId },
          data: { plan: "PRO" },
        }),
      ]);

      return res.json({
        success: true,
        message: "Payment completed successfully.",
        billing: interval,
        plan: user.plan,
        organizationPlan: organization.plan,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Unable to upgrade account.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Current Billing
|--------------------------------------------------------------------------
*/

router.get(
  "/current",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.auth!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const membership = await getCurrentMembership(userId);

      let organizationPlan: string | null = null;

      if (membership) {
        const organization = await prisma.organization.findUnique({
          where: { id: membership.organizationId },
          select: { plan: true },
        });
        organizationPlan = organization?.plan ?? null;
      }

      return res.json({
        plan: user.plan,
        organizationPlan,
        workspace: membership?.organizationName ?? null,
        role: membership?.role ?? null,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to fetch billing." });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Cancel Subscription
|--------------------------------------------------------------------------
*/

router.post(
  "/cancel",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.auth!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.plan === "FREE") {
        return res.status(400).json({
          error: "You are already on the Free plan.",
        });
      }

      const membership = await getCurrentMembership(userId);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { plan: "FREE" },
        }),
        ...(membership
          ? [
              prisma.organization.update({
                where: { id: membership.organizationId },
                data: { plan: "FREE" },
              }),
            ]
          : []),
      ]);

      return res.json({
        success: true,
        plan: "FREE",
        message: "Subscription cancelled successfully.",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Unable to cancel subscription.",
      });
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                   eSewa                                    */
/* -------------------------------------------------------------------------- */

function getPlanPriceNpr(interval: "month" | "year"): number {
  return interval === "year"
    ? Number(process.env.PRICE_YEARLY_NPR ?? 9999)
    : Number(process.env.PRICE_MONTHLY_NPR ?? 999);
}

async function activateProPlan(
  userId: string,
  organizationId: string,
  interval: "MONTHLY" | "YEARLY"
) {
  const days = interval === "YEARLY" ? 365 : 30;
  const proExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { plan: "PRO" } }),
    prisma.organization.update({
      where: { id: organizationId },
      data: { plan: "PRO", proExpiresAt },
    }),
  ]);
}

router.post(
  "/esewa/initiate",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const interval = req.body?.interval === "year" ? "year" : "month";
      const userId = req.auth!.userId;

      const membership = await getCurrentMembership(userId);
      if (!membership) {
        return res.status(400).json({ error: "You need a workspace first." });
      }

      const amountNpr = getPlanPriceNpr(interval);
      const transactionUuid = crypto.randomUUID();

      await prisma.payment.create({
        data: {
          organizationId: membership.organizationId,
          userId,
          gateway: "ESEWA",
          transactionId: transactionUuid,
          amountNpr,
          interval: interval === "year" ? "YEARLY" : "MONTHLY",
          status: "PENDING",
        },
      });

      const fields = buildEsewaFormFields({
        amountNpr,
        transactionUuid,
        successUrl: `${process.env.BACKEND_URL}/api/billing/esewa/success`,
        failureUrl: `${process.env.BACKEND_URL}/api/billing/esewa/failure`,
      });

      return res.json({
        formUrl: process.env.ESEWA_FORM_URL,
        fields,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to start eSewa payment." });
    }
  }
);

router.get("/esewa/success", async (req: Request, res: Response) => {
  try {
    const raw = req.query.data as string | undefined;
    if (!raw) return res.redirect(`${CLIENT_URL}/billing?payment=failed`);

    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));

    const validSignature = verifyEsewaCallback(decoded);
    if (!validSignature) {
      return res.redirect(`${CLIENT_URL}/billing?payment=failed`);
    }

    const payment = await prisma.payment.findUnique({
      where: { transactionId: decoded.transaction_uuid },
    });

    if (!payment || payment.status === "COMPLETED") {
      return res.redirect(`${CLIENT_URL}/dashboard?upgraded=true`);
    }

    const statusCheck = await checkEsewaStatus(
      decoded.product_code,
      decoded.total_amount,
      decoded.transaction_uuid
    );

    if (statusCheck.status !== "COMPLETE") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return res.redirect(`${CLIENT_URL}/billing?payment=failed`);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED" },
    });

    await activateProPlan(
  payment.userId,
  payment.organizationId,
  payment.interval as "MONTHLY" | "YEARLY"
);
    return res.redirect(`${CLIENT_URL}/dashboard?upgraded=true`);
  } catch (err) {
    console.error(err);
    return res.redirect(`${CLIENT_URL}/billing?payment=failed`);
  }
});

router.get("/esewa/failure", async (_req: Request, res: Response) => {
  return res.redirect(`${CLIENT_URL}/billing?payment=failed`);
});

/* -------------------------------------------------------------------------- */
/*                                  Khalti                                    */
/* -------------------------------------------------------------------------- */

router.post(
  "/khalti/initiate",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const interval = req.body?.interval === "year" ? "year" : "month";
      const userId = req.auth!.userId;

      const membership = await getCurrentMembership(userId);
      if (!membership) {
        return res.status(400).json({ error: "You need a workspace first." });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const amountNpr = getPlanPriceNpr(interval);
      const khaltiRes = await initiateKhaltiPayment({
        amountNpr,
        purchaseOrderId: `relay-${Date.now()}`,
        purchaseOrderName: `Relay Pro (${interval === "year" ? "Yearly" : "Monthly"})`,
        returnUrl: `${process.env.BACKEND_URL ?? "http://localhost:5000"}/api/billing/khalti/callback`,
        websiteUrl: CLIENT_URL ?? "http://localhost:5173",
        customerName: user?.name ?? undefined,
        customerEmail: user?.email ?? undefined,
      });

      await prisma.payment.create({
        data: {
          organizationId: membership.organizationId,
          userId,
          gateway: "KHALTI",
          transactionId: khaltiRes.pidx,
          amountNpr,
          interval: interval === "year" ? "YEARLY" : "MONTHLY",
          status: "PENDING",
        },
      });

      return res.json({ paymentUrl: khaltiRes.payment_url });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to start Khalti payment." });
    }
  }
);

router.get("/khalti/callback", async (req: Request, res: Response) => {
  try {
    const pidx = req.query.pidx as string | undefined;
    if (!pidx) return res.redirect(`${CLIENT_URL}/billing?payment=failed`);

    const payment = await prisma.payment.findUnique({
      where: { transactionId: pidx },
    });

    if (!payment) return res.redirect(`${CLIENT_URL}/billing?payment=failed`);

    if (payment.status === "COMPLETED") {
      return res.redirect(`${CLIENT_URL}/dashboard?upgraded=true`);
    }

    const lookup = await lookupKhaltiPayment(pidx);

    if (lookup.status !== "Completed") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return res.redirect(`${CLIENT_URL}/billing?payment=failed`);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED" },
    });

    await activateProPlan(
  payment.userId,
  payment.organizationId,
  payment.interval as "MONTHLY" | "YEARLY"
);

    return res.redirect(`${CLIENT_URL}/dashboard?upgraded=true`);
  } catch (err) {
    console.error(err);
    return res.redirect(`${CLIENT_URL}/billing?payment=failed`);
  }
});

export default router;
import { Router, Response } from "express";
import { prisma } from "@/config/postgres";
import { requireAuth, AuthRequest } from "@/middleware/auth";

const router = Router();

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

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
      const interval =
        req.body?.interval === "year"
          ? "year"
          : "month";

      const user = await prisma.user.findUnique({
        where: {
          id: req.auth!.userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (user.plan === "PRO") {
        return res.status(400).json({
          error: "You already have a Pro subscription.",
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



router.post(
  "/create-portal-session",
  requireAuth,
  async (req, res) => {
    res.json({
      url: `${CLIENT_URL}/demo-billing`,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Complete Demo Payment
|--------------------------------------------------------------------------
|
| This endpoint is called ONLY after the user presses
| "Complete Payment" on the Demo Checkout page.
|
*/

router.post(
  "/demo-upgrade",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const interval =
        req.body?.interval === "year"
          ? "YEARLY"
          : "MONTHLY";

      const userId = req.auth!.userId;

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          plan: "PRO",
        },
      });

      return res.json({
        success: true,
        message: "Payment completed successfully.",
        billing: interval,
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
      const membership =
        await prisma.membership.findFirst({
          where: {
            userId: req.auth!.userId,
          },
          include: {
            organization: true,
          },
        });

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.auth!.userId,
          },
        });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      return res.json({
        plan: user.plan,
        workspace:
          membership?.organization.name ??
          null,
        role:
          membership?.role ??
          null,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: "Unable to fetch billing.",
      });
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
        where: {
          id: userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (user.plan === "FREE") {
        return res.status(400).json({
          error: "You are already on the Free plan.",
        });
      }

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          plan: "FREE",
        },
      });

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

export default router;
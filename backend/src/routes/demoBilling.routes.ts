import { Router } from "express";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";

const router = Router();

router.post(
  "/create-checkout-session",
  requireAuth,
  async (req: AuthRequest, res) => {
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

    // Instead of Stripe...
    res.json({
      url: `${process.env.CLIENT_URL}/demo-checkout?interval=${interval}`,
    });
  }
);

router.post(
  "/create-portal-session",
  requireAuth,
  async (req: AuthRequest, res) => {
    res.json({
      url: `${process.env.CLIENT_URL}/demo-billing`,
    });
  }
);

export default router;
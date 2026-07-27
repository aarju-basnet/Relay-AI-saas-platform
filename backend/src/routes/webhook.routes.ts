import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "@/config/stripe";
import { prisma } from "@/config/postgres";

const router = Router();

router.post("/stripe", async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({
      error: "Missing Stripe signature or webhook secret",
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err
    );

    return res.status(400).json({
      error: "Invalid signature",
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;

      if (userId && session.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id,
          },
        });
      }

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription =
        event.data.object as Stripe.Subscription;

      const user = await prisma.user.findFirst({
        where: {
          stripeCustomerId:
            subscription.customer as string,
        },
      });

      if (user) {
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: isActive ? "PRO" : "FREE",
          },
        });
      }

      break;
    }

    default:
      break;
  }

  return res.json({
    received: true,
  });
});

export default router;
import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";

const router = Router();

/*
|--------------------------------------------------------------------------
| GET /api/notifications - latest 30 notifications + mute state + unread count
|--------------------------------------------------------------------------
| Dashboard banner and the Notification Settings page both call this.
| Muted state is returned here too so the frontend never has to guess -
| a muted user still HAS notifications, we just tell the client not to
| surface them as a banner.
*/
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [notifications, user] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.auth!.userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.user.findUnique({
        where: { id: req.auth!.userId },
        select: { notificationsMuted: true },
      }),
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({
      notifications,
      muted: user?.notificationsMuted ?? false,
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load notifications." });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/notifications/:id/read - mark a single notification as read
|--------------------------------------------------------------------------
*/
router.post("/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth!.userId },
      data: { read: true },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update notification." });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/notifications/mark-all-read
|--------------------------------------------------------------------------
*/
router.post("/mark-all-read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.userId, read: false },
      data: { read: true },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to mark notifications as read." });
  }
});

/*
|--------------------------------------------------------------------------
| PATCH /api/notifications/mute - toggle whether notifications surface
| as a dashboard banner. The notifications themselves still get created
| and still show in the Notification Settings list either way - mute
| only affects the dashboard banner.
|--------------------------------------------------------------------------
*/
router.patch("/mute", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { muted } = req.body as { muted?: boolean };

    if (typeof muted !== "boolean") {
      return res.status(400).json({ error: "muted must be a boolean." });
    }

    await prisma.user.update({
      where: { id: req.auth!.userId },
      data: { notificationsMuted: muted },
    });

    return res.json({ success: true, muted });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update mute setting." });
  }
});

export default router;
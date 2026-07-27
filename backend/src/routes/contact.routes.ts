import { Router, Request, Response } from "express";
import { z } from "zod";
import { sendContactEmail } from "@/utils/email";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

// POST /api/contact - public homepage contact form
router.post("/", async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, email, message } = parsed.data;

  try {
    await sendContactEmail(name, email, message);
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return res.status(502).json({ error: "Couldn't send that right now, try again shortly" });
  }

  res.json({ message: "Message sent" });
});

export default router;

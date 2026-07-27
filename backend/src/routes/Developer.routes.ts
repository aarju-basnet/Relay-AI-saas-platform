import { Router } from "express";
import {
  getSystemStatus,
} from '../controllers/Developer.controller'
import { requireAuth } from "@/middleware/auth";

const router = Router();

/*
|--------------------------------------------------------------------------
| Developer Routes
|--------------------------------------------------------------------------
|
| Every route requires authentication.
| Later we'll also verify that Developer Mode is enabled.
|
*/

router.get(
  "/system",
  requireAuth,
  getSystemStatus
);

export default router;
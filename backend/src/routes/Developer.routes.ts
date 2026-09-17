import { Router } from "express";
import {
  getSystemStatus,
  getDeveloperLogs,
} from '../controllers/Developer.controller'
import { requireAuth } from "@/middleware/auth";

const router = Router();

/*
|--------------------------------------------------------------------------
| Developer Routes
|--------------------------------------------------------------------------
|
| Every route requires authentication.
| /logs additionally requires Developer Mode to be enabled on the
| workspace - that check happens inside the controller since it needs
| a DB lookup, not just an auth check.
|
*/

router.get(
  "/system",
  requireAuth,
  getSystemStatus
);

router.get(
  "/:organizationId/logs",
  requireAuth,
  getDeveloperLogs
);

export default router;
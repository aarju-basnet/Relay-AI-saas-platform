import { Router } from "express";

import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
} from "@/controllers/apiKey.controller";

import { requireAuth } from '@/middleware/auth'

const router = Router();

/*
POST
/api/api-keys
*/
router.post(
  "/",
  requireAuth,
  createApiKey
);

/*
GET
/api/api-keys/:organizationId
*/
router.get(
  "/:organizationId",
  requireAuth,
  getApiKeys
);

/*
PATCH
/api/api-keys/:id/revoke
*/
router.patch(
  "/:id/revoke",
  requireAuth,
  revokeApiKey
);

export default router;
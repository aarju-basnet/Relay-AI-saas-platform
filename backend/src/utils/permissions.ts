import { Role } from "@prisma/client";

export function canManageApiKeys(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}
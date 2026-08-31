import { randomBytes, createHash } from "crypto";

export function generateApiKey() {
  return "relay_" + randomBytes(32).toString("hex");
}

export function hashApiKey(key: string) {
  return createHash("sha256")
    .update(key)
    .digest("hex");
}

export function getPrefix(key: string) {
  return key.substring(0, 20);
}
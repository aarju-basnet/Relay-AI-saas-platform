interface CachedApiKey {
  id: string;

  organizationId: string;

  plan: "FREE" | "PRO" | "ENTERPRISE";

  revoked: boolean;

  cachedAt: number;
}

const cache = new Map<
  string,
  CachedApiKey
>();

const TTL = 5 * 60 * 1000;

export function getCachedApiKey(
  hashedKey: string
) {
  const item = cache.get(hashedKey);

  if (!item) return null;

  if (
    Date.now() - item.cachedAt >
    TTL
  ) {
    cache.delete(hashedKey);

    return null;
  }

  return item;
}

export function setCachedApiKey(
  hashedKey: string,
  data: Omit<CachedApiKey, "cachedAt">
) {
  cache.set(hashedKey, {
    ...data,
    cachedAt: Date.now(),
  });
}

export function removeCachedApiKey(
  hashedKey: string
) {
  cache.delete(hashedKey);
}
// A lightweight, zero-cost memory cache for serverless functions
const globalCache = (global as any)._serverCache || {};
if (!(global as any)._serverCache) {
  (global as any)._serverCache = globalCache;
}

interface CacheEntry {
  data: any;
  expiry: number;
}

export function getCachedData(key: string): any | null {
  const entry: CacheEntry = globalCache[key];
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

export function setCachedData(key: string, data: any, ttlSeconds: number) {
  globalCache[key] = {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  };
}

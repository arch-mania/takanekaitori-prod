import { createClient } from 'contentful';
import { LRUCache } from 'lru-cache';

// マスターデータ用キャッシュ（10分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const masterCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 10,
});

// 物件データ用キャッシュ（1分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const propertyCache = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60 * 1,
});

// 単一エントリー用キャッシュ（10分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const entryCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 10,
});

// マスターデータのcontent_type
const MASTER_CONTENT_TYPES = ['area', 'region', 'cuisineType', 'restaurantType'];

// 同一キーの同時実行をまとめる（cache stampede対策）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inFlightRequests = new Map<string, Promise<any>>();

const baseClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID as string,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN as string,
});

// content_typeによってキャッシュを選択
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCacheForContentType = (contentType?: string): LRUCache<string, any> | null => {
  if (MASTER_CONTENT_TYPES.includes(contentType || '')) {
    return masterCache;
  }
  if (contentType === 'property') {
    return propertyCache;
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runWithInFlightDedup = async (key: string, fetcher: () => Promise<any>) => {
  const inFlight = inFlightRequests.get(key);
  if (inFlight) {
    return inFlight;
  }

  const promise = fetcher().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
};

export const contentfulClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntries: async (query: any): Promise<any> => {
    const cache = getCacheForContentType(query.content_type);
    const cacheKey = `entries:${JSON.stringify(query)}`;

    if (cache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const result = await runWithInFlightDedup(cacheKey, () => baseClient.getEntries(query));
    if (cache) {
      cache.set(cacheKey, result);
    }
    return result;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntry: async (id: string, query?: any): Promise<any> => {
    const cacheKey = `entry:${id}:${JSON.stringify(query || {})}`;
    const cached = entryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await runWithInFlightDedup(cacheKey, () => baseClient.getEntry(id, query));
    entryCache.set(cacheKey, result);
    return result;
  },
};

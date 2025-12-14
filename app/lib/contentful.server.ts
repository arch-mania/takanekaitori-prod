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

// マスターデータのcontent_type
const MASTER_CONTENT_TYPES = ['area', 'region', 'station', 'restaurantType'];

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

export const contentfulClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntries: async (query: any): Promise<any> => {
    const cache = getCacheForContentType(query.content_type);

    // キャッシュ対象外はそのまま取得
    if (!cache) {
      return baseClient.getEntries(query);
    }

    const cacheKey = `entries:${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await baseClient.getEntries(query);
    cache.set(cacheKey, result);
    return result;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntry: async (id: string, query?: any): Promise<any> => {
    return baseClient.getEntry(id, query);
  },
};

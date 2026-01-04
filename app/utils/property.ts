// ~/utils/property.ts

import { FilterState, Property } from 'types/contentful';

export const NEW_PROPERTY_THRESHOLD = 2 * 24 * 60 * 60 * 1000;

interface ContentfulFields {
  isNew?: boolean;
  registrationDate?: string;
  [key: string]: any;
}

interface ContentfulEntry {
  fields: ContentfulFields;
  sys: {
    id: string;
    [key: string]: any;
  };
}

interface ContentfulResponse {
  items: ContentfulEntry[];
  total: number;
  skip: number;
  limit: number;
}

export const isNewProperty = (property: ContentfulEntry): boolean => {
  if (property.fields.isNew) return true;

  if (property.fields.registrationDate) {
    const registrationDate = new Date(property.fields.registrationDate);
    const now = new Date();
    return now.getTime() - registrationDate.getTime() <= NEW_PROPERTY_THRESHOLD;
  }

  return false;
};

/**
 * Contentfulから全ての物件を取得する（ページネーション対応）
 */
export const fetchAllProperties = async (
  contentfulClient: any,
  query: any
): Promise<ContentfulEntry[]> => {
  const LIMIT = 1000;
  let allItems: ContentfulEntry[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const response = (await contentfulClient.getEntries({
      ...query,
      limit: LIMIT,
      skip: skip,
    })) as ContentfulResponse;

    allItems = [...allItems, ...response.items];
    skip += LIMIT;
    hasMore = allItems.length < response.total;
  }

  return allItems;
};

/**
 * 新着物件の件数を取得する
 */
export const getNewPropertiesCount = async (contentfulClient: any, query: any): Promise<number> => {
  const allProperties = await fetchAllProperties(contentfulClient, query);
  return allProperties.filter(isNewProperty).length;
};

export const filterProperties = (property: Property, filters: FilterState) => {
  if (filters.minRent !== '下限なし' && property.rent < parseInt(filters.minRent)) return false;
  if (filters.maxRent !== '上限なし' && property.rent > parseInt(filters.maxRent)) return false;
  if (filters.minArea !== '下限なし' && property.floorAreaTsubo < parseInt(filters.minArea))
    return false;
  if (filters.maxArea !== '上限なし' && property.floorAreaTsubo > parseInt(filters.maxArea))
    return false;

  const activeStatusFilters = {
    isNew: filters.isNew,
    isSkeleton: filters.isSkeleton,
    isInteriorIncluded: filters.isInteriorIncluded,
  };

  const hasActiveStatusFilters = Object.values(activeStatusFilters).some((value) => value);
  if (hasActiveStatusFilters) {
    const matchesAnyStatus =
      (filters.isNew && property.isNew) ||
      (filters.isSkeleton && property.isSkeleton) ||
      (filters.isInteriorIncluded && property.isInteriorIncluded);

    if (!matchesAnyStatus) return false;
  }

  if (filters.regions.length > 0) {
    const matchesRegion = property.regions.some((region) => filters.regions.includes(region));
    if (!matchesRegion) return false;
  }

  if (filters.cuisineTypes.length > 0) {
    const matchesCuisineType = property.cuisineTypes.some((type) =>
      filters.cuisineTypes.includes(type)
    );
    if (!matchesCuisineType) return false;
  }

  if (
    filters.allowedRestaurantTypes.length > 0 &&
    !property.allowedRestaurantTypes.some((type) => filters.allowedRestaurantTypes.includes(type))
  )
    return false;

  if (Object.values(filters.floors).some((value) => value)) {
    const floors = property.floors || [];
    const matchesAnyFloor =
      (filters.floors.basement && floors.some((floor) => floor.startsWith('B'))) ||
      (filters.floors.first && floors.includes('1')) ||
      (filters.floors.second && floors.includes('2')) ||
      (filters.floors.thirdAndAbove &&
        floors.some((floor) => {
          const floorNum = parseInt(floor);
          return !isNaN(floorNum) && floorNum >= 3;
        })) ||
      (filters.floors.multiFloorWithFirst && floors.includes('1') && floors.length > 1) ||
      (filters.floors.multiFloorWithoutFirst && !floors.includes('1') && floors.length > 1);

    if (!matchesAnyFloor) return false;
  }

  if (filters.keyword) {
    // スペースで分割して複数キーワードに対応（全角・半角スペース両方）
    const keywords = filters.keyword
      .toLowerCase()
      .split(/[\s\u3000]+/)
      .filter((k) => k.length > 0);

    // 全てのキーワードがマッチする必要がある（AND検索）
    const matchesAllKeywords = keywords.every((keyword) => {
      return (
        property.title.toLowerCase().includes(keyword) ||
        property.address.toLowerCase().includes(keyword) ||
        property.cuisineTypes.some((type) => type.toLowerCase().includes(keyword)) ||
        property.regions.some((region) => region.toLowerCase().includes(keyword)) ||
        (property.details
          .find((detail) => detail.label.includes('前業態'))
          ?.value.toLowerCase()
          .includes(keyword) ??
          false)
      );
    });

    if (!matchesAllKeywords) return false;
  }

  if (filters.walkingTime !== '指定なし') {
    if (!property.walkingTimeToStation) return false;
    const time = property.walkingTimeToStation;
    switch (filters.walkingTime) {
      case '1分':
        if (time > 1) return false;
        break;
      case '3分以内':
        if (time > 3) return false;
        break;
      case '5分以内':
        if (time > 5) return false;
        break;
      case '10分以内':
        if (time > 10) return false;
        break;
      case '15分以内':
        if (time > 15) return false;
        break;
    }
  }

  return true;
};

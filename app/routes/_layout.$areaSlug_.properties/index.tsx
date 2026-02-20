import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MetaFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigation, useParams, useSearchParams } from '@remix-run/react';
import { Entry, EntryCollection } from 'contentful';
import ContentsLayout from '~/components/layouts/ContentsLayout';
import { PropertyCard } from '~/components/parts/PropertyCard';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { SearchFilters } from '~/components/parts/SearchFilters';
import { contentfulClient } from '~/lib/contentful.server';
import { guardAgainstBadBots } from '~/lib/bot-guard.server';
import { X } from 'lucide-react';
import { AnimatedNumber } from '~/components/parts/AnimatedNumber';
import { filterProperties, isNewProperty, NEW_PROPERTY_THRESHOLD } from '~/utils/property';
import { FilterState } from 'types/contentful';

const ITEMS_PER_PAGE = 10;
const CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300';
const SORT_OPTIONS = [
  { value: 'newest', label: '新着順' },
  { value: 'rentAsc', label: '賃料安い順' },
  { value: 'areaDesc', label: '面積広い順' },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]['value'];
const DEFAULT_SORT_OPTION: SortOption = 'newest';

const parseSortOption = (value: string | null | undefined): SortOption => {
  if (!value) return DEFAULT_SORT_OPTION;
  return SORT_OPTIONS.find((option) => option.value === value)?.value || DEFAULT_SORT_OPTION;
};

const getSortOrder = (sort: SortOption): string[] => {
  switch (sort) {
    case 'rentAsc':
      return ['fields.rent', '-sys.createdAt'];
    case 'areaDesc':
      return ['-fields.floorAreaTsubo', '-sys.createdAt'];
    case 'newest':
    default:
      return ['-fields.registrationDate', '-sys.createdAt'];
  }
};

interface QueryParams {
  minRent?: string;
  maxRent?: string;
  minArea?: string;
  maxArea?: string;
  isSkeleton?: string;
  isInteriorIncluded?: string;
  isNew?: string;
  basement?: string;
  first?: string;
  second?: string;
  thirdAndAbove?: string;
  multiFloorWithFirst?: string;
  multiFloorWithoutFirst?: string;
  regions?: string;
  cuisineTypes?: string;
  restaurantTypes?: string;
  keyword?: string;
  walkingTime?: string;
  page?: string;
  sort?: SortOption;
}

const filtersToQueryParams = (filters: FilterState, page: number, sort: SortOption): QueryParams => {
  const params: QueryParams = {
    minRent: filters.minRent !== '下限なし' ? filters.minRent : undefined,
    maxRent: filters.maxRent !== '上限なし' ? filters.maxRent : undefined,
    minArea: filters.minArea !== '下限なし' ? filters.minArea : undefined,
    maxArea: filters.maxArea !== '上限なし' ? filters.maxArea : undefined,
    isSkeleton: filters.isSkeleton ? 'true' : undefined,
    isInteriorIncluded: filters.isInteriorIncluded ? 'true' : undefined,
    isNew: filters.isNew ? 'true' : undefined,
    basement: filters.floors.basement ? 'true' : undefined,
    first: filters.floors.first ? 'true' : undefined,
    second: filters.floors.second ? 'true' : undefined,
    thirdAndAbove: filters.floors.thirdAndAbove ? 'true' : undefined,
    multiFloorWithFirst: filters.floors.multiFloorWithFirst ? 'true' : undefined,
    multiFloorWithoutFirst: filters.floors.multiFloorWithoutFirst ? 'true' : undefined,
    regions: filters.regions.length > 0 ? filters.regions.join(',') : undefined,
    cuisineTypes: filters.cuisineTypes.length > 0 ? filters.cuisineTypes.join(',') : undefined,
    restaurantTypes:
      filters.allowedRestaurantTypes.length > 0
        ? filters.allowedRestaurantTypes.join(',')
        : undefined,
    keyword: filters.keyword || undefined,
    walkingTime: filters.walkingTime !== '指定なし' ? filters.walkingTime : undefined,
    page: page > 1 ? page.toString() : undefined,
    sort: sort !== DEFAULT_SORT_OPTION ? sort : undefined,
  };

  Object.keys(params).forEach((key) => {
    if (params[key as keyof QueryParams] === undefined) {
      delete params[key as keyof QueryParams];
    }
  });

  return params;
};

const queryParamsToFilters = (
  searchParams: URLSearchParams,
  initialFilters: { selectedRegion?: { id: string; name: string }; keyword?: string }
): FilterState => {
  const regions = searchParams.get('regions')?.split(',');
  const cuisineTypes = searchParams.get('cuisineTypes')?.split(',');
  const restaurantTypes = searchParams.get('restaurantTypes')?.split(',');

  return {
    minRent: searchParams.get('minRent') || '下限なし',
    maxRent: searchParams.get('maxRent') || '上限なし',
    minArea: searchParams.get('minArea') || '下限なし',
    maxArea: searchParams.get('maxArea') || '上限なし',
    isSkeleton: searchParams.get('isSkeleton') === 'true',
    isInteriorIncluded: searchParams.get('isInteriorIncluded') === 'true',
    isNew: searchParams.get('isNew') === 'true',
    floors: {
      basement: searchParams.get('basement') === 'true',
      first: searchParams.get('first') === 'true',
      second: searchParams.get('second') === 'true',
      thirdAndAbove: searchParams.get('thirdAndAbove') === 'true',
      multiFloorWithFirst: searchParams.get('multiFloorWithFirst') === 'true',
      multiFloorWithoutFirst: searchParams.get('multiFloorWithoutFirst') === 'true',
    },
    regions:
      regions || (initialFilters.selectedRegion?.name ? [initialFilters.selectedRegion.name] : []),
    cuisineTypes: cuisineTypes || [],
    allowedRestaurantTypes: restaurantTypes || [],
    keyword: searchParams.get('keyword') || initialFilters.keyword || '',
    walkingTime: searchParams.get('walkingTime') || '指定なし',
  };
};

const toURLSearchParams = (params: QueryParams): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  return searchParams;
};

const getWalkingTimeMax = (walkingTime: string): number | null => {
  switch (walkingTime) {
    case '1分':
      return 1;
    case '3分以内':
      return 3;
    case '5分以内':
      return 5;
    case '10分以内':
      return 10;
    case '15分以内':
      return 15;
    default:
      return null;
  }
};

const hasActiveFloorFilters = (filters: FilterState): boolean => {
  return Object.values(filters.floors).some(Boolean);
};

async function getAllEntries(query: any): Promise<Entry[]> {
  const limit = 1000;
  let skip = 0;
  let hasMoreItems = true;
  let allItems: Entry[] = [];

  while (hasMoreItems) {
    const response: EntryCollection<any> = await contentfulClient.getEntries({
      ...query,
      limit,
      skip,
    });

    allItems = [...allItems, ...response.items];
    skip += limit;
    hasMoreItems = response.total > skip;
  }

  return allItems;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }

    return pages.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span
            key={`ellipsis-${index}`}
            className="flex size-8 items-center justify-center text-[#C9C9C9]"
          >
            ...
          </span>
        );
      }

      return (
        <button
          key={page}
          onClick={() => onPageChange(page as number)}
          className={`size-8 rounded-[2px] border ${
            currentPage === page
              ? 'border-[#3B5998] text-[#3B5998]'
              : 'border-[#C9C9C9] text-[#333333]'
          }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="size-8 cursor-pointer rounded-sm border border-[#C9C9C9] text-[#333333] hover:bg-gray-100"
      >
        <img src="/left-arrow.svg" alt="" className="mx-auto size-4" />
      </button>
      {renderPageNumbers()}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="size-8 cursor-pointer rounded-sm border border-[#C9C9C9] text-[#333333] hover:bg-gray-100"
      >
        <img src="/right-arrow.svg" alt="" className="mx-auto size-4" />
      </button>
    </div>
  );
};

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      return query.includes('min-width: 1024px') ? !isMobile : isMobile;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getMatches = (query: string): boolean => {
      return window.matchMedia(query).matches;
    };

    setMatches(getMatches(query));

    const handleChange = () => {
      setMatches(getMatches(query));
    };

    const matchMedia = window.matchMedia(query);

    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener('change', handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener('change', handleChange);
      }
    };
  }, [query]);

  return matches;
};

interface Property {
  id: string;
  title: string;
  propertyId: string;
  regions: string[];
  cuisineTypes: string[];
  address: string;
  rent: number;
  floorArea: number;
  floorAreaTsubo: number;
  isNew: boolean;
  isSkeleton: boolean;
  isInteriorIncluded: boolean;
  walkingTimeToStation: number;
  floors: string[];
  exteriorImages: string;
  securityDeposit: string;
  stationName1: string;
  allowedRestaurantTypes: string[];
  details: Array<{ label: string; value: string }>;
  registrationDate: string;
  sortNewestTimestamp: number;
  sortCreatedTimestamp: number;
}

interface CuisineType {
  id: string;
  name: string;
  order?: number;
}

interface Region {
  id: string;
  name: string;
  area: {
    fields: {
      name: string;
    };
  };
}

interface LoaderData {
  properties: Property[];
  cuisineTypes: CuisineType[];
  regions: Region[];
  restaurantTypes: Array<{ id: string; name: string }>;
  areaName: string;
  placeholder: string;
  currentPage: number;
  totalCount: number;
  initialFilters: {
    selectedRegion?: { id: string; name: string };
    keyword?: string;
  };
}

const mapPropertyEntry = (item: any): Property => {
  const newestDateSource = item.fields.registrationDate || item.sys.createdAt;

  return {
    id: item.sys.id,
    title: item.fields.title || '',
    propertyId: item.fields.propertyId || '',
    regions:
      item.fields.regions?.map((region: any) => region?.fields?.name || '').filter(Boolean) || [],
    cuisineTypes:
      item.fields.cuisineType?.map((type: any) => type?.fields?.name || '').filter(Boolean) || [],
    address: item.fields.address || '',
    rent: item.fields.rent || 0,
    floorArea: item.fields.floorArea || 0,
    floorAreaTsubo: item.fields.floorAreaTsubo || 0,
    isNew: isNewProperty(item),
    isSkeleton: item.fields.isSkeleton || false,
    isInteriorIncluded: item.fields.isInteriorIncluded || false,
    walkingTimeToStation: item.fields.walkingTimeToStation || 0,
    floors: item.fields.floors || [],
    exteriorImages: item.fields.exteriorImages?.[0]?.fields?.file?.url || '/propertyImage.png',
    securityDeposit: item.fields.securityDeposit || '-',
    stationName1: item.fields.stationName1 || '',
    allowedRestaurantTypes:
      item.fields.allowedRestaurantTypes
        ?.map((type: any) => type?.fields?.name || '')
        .filter(Boolean) || [],
    details: [
      {
        label: '最寄り駅',
        value: `${item.fields.stationName1}${
          item.fields.walkingTimeToStation ? ` 徒歩${item.fields.walkingTimeToStation}分` : ''
        }`,
      },
      {
        label: '賃料/坪単価',
        value: `${item.fields.rent?.toLocaleString() || 0}万円 / ${
          item.fields.pricePerTsubo?.toLocaleString() || 0
        }万円`,
      },
      {
        label: '面積',
        value: `${item.fields.floorArea || 0}㎡ / ${item.fields.floorAreaTsubo || 0}坪`,
      },
      { label: '所在地', value: item.fields.address || '-' },
      { label: `希望譲渡額\n/前業態`, value: item.fields.interiorTransferFee || '-' },
    ],
    registrationDate: new Date(newestDateSource).toLocaleDateString('ja-JP'),
    sortNewestTimestamp: new Date(newestDateSource).getTime() || 0,
    sortCreatedTimestamp: new Date(item.sys.createdAt).getTime() || 0,
  };
};

const comparePropertiesBySort = (a: Property, b: Property, sort: SortOption): number => {
  switch (sort) {
    case 'rentAsc':
      if (a.rent !== b.rent) {
        return a.rent - b.rent;
      }
      return b.sortCreatedTimestamp - a.sortCreatedTimestamp;
    case 'areaDesc':
      if (a.floorAreaTsubo !== b.floorAreaTsubo) {
        return b.floorAreaTsubo - a.floorAreaTsubo;
      }
      return b.sortCreatedTimestamp - a.sortCreatedTimestamp;
    case 'newest':
    default:
      if (a.sortNewestTimestamp !== b.sortNewestTimestamp) {
        return b.sortNewestTimestamp - a.sortNewestTimestamp;
      }
      return b.sortCreatedTimestamp - a.sortCreatedTimestamp;
  }
};

export const loader: LoaderFunction = async ({ params, request }) => {
  guardAgainstBadBots(request);
  const { areaSlug } = params;
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword') || undefined;
  const regionId = url.searchParams.get('region');
  const sortOption = parseSortOption(url.searchParams.get('sort'));
  const pageParam = Number(url.searchParams.get('page') || '1');
  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  try {
    const expiredDays = 3650;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - expiredDays);
    const thresholdDate = dateThreshold.toISOString();
    const newThresholdDate = new Date(Date.now() - NEW_PROPERTY_THRESHOLD).toISOString();

    const areaEntry = await contentfulClient.getEntries({
      content_type: 'area',
      'fields.slug': areaSlug,
      limit: 1,
    });

    const area = areaEntry.items[0];
    if (!area) {
      throw new Response('Area not found', { status: 404 });
    }

    const areaId = area.sys.id;
    const areaName = area.fields.name;
    const placeholder = area.fields.placeholder || '';

    const [regionsInArea, cuisineTypeEntries, restaurantTypeEntries] = await Promise.all([
      contentfulClient.getEntries({
        content_type: 'region',
        'fields.area.sys.id': areaId,
        order: ['fields.areaSearchOrder'],
      }),
      contentfulClient.getEntries({
        content_type: 'cuisineType',
        order: ['fields.order'],
      }),
      contentfulClient.getEntries({
        content_type: 'restaurantType',
        order: ['fields.order'],
      }),
    ]);

    const selectedRegionEntry =
      regionId && regionsInArea.items.find((region: any) => region.sys.id === regionId);
    const selectedRegion = selectedRegionEntry
      ? {
          id: selectedRegionEntry.sys.id,
          name: selectedRegionEntry.fields.name,
        }
      : undefined;

    const initialFilters = {
      selectedRegion,
      keyword,
    };
    const parsedFilters = queryParamsToFilters(url.searchParams, initialFilters);

    const allRegionIds = regionsInArea.items.map((region: any) => region.sys.id);
    const regionNameToId = new Map(
      regionsInArea.items.map((region: any) => [String(region.fields.name), String(region.sys.id)])
    );
    const cuisineNameToId = new Map(
      cuisineTypeEntries.items.map((item: any) => [String(item.fields.name), String(item.sys.id)])
    );
    const restaurantTypeNameToId = new Map(
      restaurantTypeEntries.items.map((item: any) => [String(item.fields.name), String(item.sys.id)])
    );

    const filteredRegionIds =
      parsedFilters.regions.length > 0
        ? parsedFilters.regions
            .map((name) => regionNameToId.get(name))
            .filter((id): id is string => Boolean(id))
        : allRegionIds;

    if (filteredRegionIds.length === 0) {
      return json<LoaderData>(
        {
          properties: [],
          cuisineTypes: cuisineTypeEntries.items.map((item: any) => ({
            id: item.sys.id,
            name: item.fields.name,
            order: item.fields.order,
          })),
          regions: regionsInArea.items.map((item: any) => ({
            id: item.sys.id,
            name: item.fields.name,
            area: item.fields.area,
          })),
          restaurantTypes: restaurantTypeEntries.items.map((item: any) => ({
            id: item.sys.id,
            name: item.fields.name,
          })),
          areaName,
          placeholder,
          currentPage,
          totalCount: 0,
          initialFilters,
        },
        {
          headers: {
            'Cache-Control': CACHE_CONTROL,
          },
        }
      );
    }

    const basePropertyQuery: any = {
      content_type: 'property',
      'fields.regions.sys.id[in]': filteredRegionIds.join(','),
      'fields.registrationDate[gte]': thresholdDate,
      order: getSortOrder(sortOption),
      include: 2,
    };

    if (parsedFilters.minRent !== '下限なし') {
      basePropertyQuery['fields.rent[gte]'] = Number(parsedFilters.minRent);
    }
    if (parsedFilters.maxRent !== '上限なし') {
      basePropertyQuery['fields.rent[lte]'] = Number(parsedFilters.maxRent);
    }
    if (parsedFilters.minArea !== '下限なし') {
      basePropertyQuery['fields.floorAreaTsubo[gte]'] = Number(parsedFilters.minArea);
    }
    if (parsedFilters.maxArea !== '上限なし') {
      basePropertyQuery['fields.floorAreaTsubo[lte]'] = Number(parsedFilters.maxArea);
    }
    if (parsedFilters.isSkeleton) {
      basePropertyQuery['fields.isSkeleton'] = true;
    }
    if (parsedFilters.isInteriorIncluded) {
      basePropertyQuery['fields.isInteriorIncluded'] = true;
    }

    const walkingTimeMax = getWalkingTimeMax(parsedFilters.walkingTime);
    if (walkingTimeMax !== null) {
      basePropertyQuery['fields.walkingTimeToStation[lte]'] = walkingTimeMax;
    }

    if (parsedFilters.cuisineTypes.length > 0) {
      const cuisineIds = parsedFilters.cuisineTypes
        .map((name) => cuisineNameToId.get(name))
        .filter((id): id is string => Boolean(id));
      if (cuisineIds.length === 0) {
        return json<LoaderData>(
          {
            properties: [],
            cuisineTypes: cuisineTypeEntries.items.map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name,
              order: item.fields.order,
            })),
            regions: regionsInArea.items.map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name,
              area: item.fields.area,
            })),
            restaurantTypes: restaurantTypeEntries.items.map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name,
            })),
            areaName,
            placeholder,
            currentPage,
            totalCount: 0,
            initialFilters,
          },
          {
            headers: {
              'Cache-Control': CACHE_CONTROL,
            },
          }
        );
      }
      basePropertyQuery['fields.cuisineType.sys.id[in]'] = cuisineIds.join(',');
    }

    if (parsedFilters.allowedRestaurantTypes.length > 0) {
      const restaurantTypeIds = parsedFilters.allowedRestaurantTypes
        .map((name) => restaurantTypeNameToId.get(name))
        .filter((id): id is string => Boolean(id));
      if (restaurantTypeIds.length === 0) {
        return json<LoaderData>(
          {
            properties: [],
            cuisineTypes: cuisineTypeEntries.items.map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name,
              order: item.fields.order,
            })),
            regions: regionsInArea.items.map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name,
              area: item.fields.area,
            })),
            restaurantTypes: restaurantTypeEntries.items.map((item: any) => ({
              id: item.sys.id,
              name: item.fields.name,
            })),
            areaName,
            placeholder,
            currentPage,
            totalCount: 0,
            initialFilters,
          },
          {
            headers: {
              'Cache-Control': CACHE_CONTROL,
            },
          }
        );
      }
      basePropertyQuery['fields.allowedRestaurantTypes.sys.id[in]'] = restaurantTypeIds.join(',');
    }

    if (parsedFilters.keyword.trim()) {
      basePropertyQuery.query = parsedFilters.keyword.trim();
    }

    const needsServerPostFilter = parsedFilters.isNew || hasActiveFloorFilters(parsedFilters);

    let properties: Property[] = [];
    let totalCount = 0;

    if (needsServerPostFilter) {
      const allEntries = await getAllEntries(basePropertyQuery);
      const allProperties = allEntries.map(mapPropertyEntry);
      const filteredProperties = allProperties.filter((property) =>
        filterProperties(property as any, parsedFilters)
      );
      const sortedProperties = filteredProperties.sort((a, b) =>
        comparePropertiesBySort(a, b, sortOption)
      );

      totalCount = sortedProperties.length;
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      properties = sortedProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    } else {
      const pagedResponse: EntryCollection<any> = await contentfulClient.getEntries({
        ...basePropertyQuery,
        limit: ITEMS_PER_PAGE,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
      });

      properties = pagedResponse.items.map(mapPropertyEntry);
      totalCount = pagedResponse.total;
    }

    return json<LoaderData>(
      {
        properties,
        cuisineTypes: cuisineTypeEntries.items.map((item: any) => ({
          id: item.sys.id,
          name: item.fields.name,
          order: item.fields.order,
        })),
        regions: regionsInArea.items.map((item: any) => ({
          id: item.sys.id,
          name: item.fields.name,
          area: item.fields.area,
        })),
        restaurantTypes: restaurantTypeEntries.items.map((item: any) => ({
          id: item.sys.id,
          name: item.fields.name,
        })),
        areaName,
        placeholder,
        currentPage,
        totalCount,
        initialFilters,
      },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL,
        },
      }
    );
  } catch (error) {
    console.error('Contentful fetch error:', error);
    throw error;
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const areaName = data?.areaName || '';
  const regionNames =
    data?.regions
      ?.slice(0, 6)
      .map((region: Region) => region.name)
      .join('、') || '';

  const regionText = regionNames ? `（${regionNames}）` : '';

  return [
    {
      title: `${areaName ? `${areaName}${regionText}の` : ''}飲食店物件・居抜き物件一覧 | 居抜きビュッフェ`,
    },
    {
      name: 'description',
      content: `${areaName}${regionText}の飲食店物件・居抜き物件・スケルトン物件などの貸店舗情報を掲載中。${regionNames ? `${regionNames}エリアを中心に、` : ''}立地・賃料・面積・前業態から理想の出店場所を探せます。物件の詳細な条件設定や設備状況の確認も可能。新着物件情報も随時更新中です。`,
    },
    {
      name: 'keywords',
      content: `${areaName},${regionNames ? `${regionNames},` : ''}飲食店物件,居抜き物件,スケルトン物件,貸店舗,飲食店開業,店舗物件,飲食店,居ぬき`,
    },
  ];
};

const PropertyCardSkeleton = () => (
  <div className="rounded-lg border p-4">
    <div className="flex gap-4">
      <Skeleton className="h-[200px] w-[300px]" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CurrentFilters: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const getActiveFilters = () => {
    const conditions: string[] = [];

    if (filters.minRent !== '下限なし' || filters.maxRent !== '上限なし') {
      const rentRange = [];
      if (filters.minRent !== '下限なし') rentRange.push(`${filters.minRent}万円～`);
      if (filters.maxRent !== '上限なし') rentRange.push(`～${filters.maxRent}万円`);
      conditions.push(`賃料：${rentRange.join('')}`);
    }

    if (filters.minArea !== '下限なし' || filters.maxArea !== '上限なし') {
      const areaRange = [];
      if (filters.minArea !== '下限なし') areaRange.push(`${filters.minArea}坪～`);
      if (filters.maxArea !== '上限なし') areaRange.push(`～${filters.maxArea}坪`);
      conditions.push(`面積：${areaRange.join('')}`);
    }

    if (filters.regions.length > 0) {
      conditions.push(`エリア：${filters.regions.join('・')}`);
    }

    if (filters.cuisineTypes.length > 0) {
      conditions.push(`おすすめ業態：${filters.cuisineTypes.join('・')}`);
    }

    if (filters.walkingTime !== '指定なし') {
      conditions.push(`徒歩：${filters.walkingTime}`);
    }

    if (filters.isNew) conditions.push('新着物件');
    if (filters.isSkeleton) conditions.push('スケルトン物件');
    if (filters.isInteriorIncluded) conditions.push('居抜き');

    const floorLabels: { [key: string]: string } = {
      basement: '地下',
      first: '1階',
      second: '2階',
      thirdAndAbove: '3階以上',
      multiFloorWithFirst: '1階含む複数階',
      multiFloorWithoutFirst: '1階含まない複数階',
    };

    const activeFloors = Object.entries(filters.floors)
      .filter(([_, isActive]) => isActive)
      .map(([key, _]) => floorLabels[key])
      .filter(Boolean);

    if (activeFloors.length > 0) {
      conditions.push(`階数：${activeFloors.join('・')}`);
    }

    if (filters.allowedRestaurantTypes.length > 0) {
      conditions.push(`出店可能な飲食店の種類：${filters.allowedRestaurantTypes.join('・')}`);
    }

    if (filters.keyword) {
      conditions.push(`キーワード：${filters.keyword}`);
    }

    return conditions;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 mt-2 border border-[#1ABC9C] p-2 md:px-6 md:py-4">
      <p className="whitespace-pre-wrap text-sm">
        <span className="font-medium">現在の絞り込み条件：</span>
        <span className="ml-1">{activeFilters.join(' / ')}</span>
      </p>
    </div>
  );
};

export default function Search() {
  const { areaSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';
  const { properties, regions, cuisineTypes, restaurantTypes, initialFilters, areaName, placeholder, totalCount, currentPage } =
    useLoaderData<typeof loader>();

  const [filters, setFilters] = useState<FilterState>(() =>
    queryParamsToFilters(searchParams, initialFilters)
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inputValue, setInputValue] = useState(filters.keyword || '');
  const initialRegionName = initialFilters.selectedRegion?.name || '';
  const initialKeyword = initialFilters.keyword || '';
  const searchParamsKey = searchParams.toString();
  const currentSort = useMemo(() => parseSortOption(searchParams.get('sort')), [searchParamsKey]);

  const activeFilters = useMemo(
    () => queryParamsToFilters(searchParams, initialFilters),
    [searchParamsKey, initialRegionName, initialKeyword]
  );

  useEffect(() => {
    const nextFilters = queryParamsToFilters(searchParams, initialFilters);
    setFilters(nextFilters);
    setInputValue(nextFilters.keyword || '');
  }, [searchParamsKey, initialRegionName, initialKeyword]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setIsSearchOpen(false);
    setSearchParams(toURLSearchParams(filtersToQueryParams(filters, 1, currentSort)));
    window.scrollTo({ top: 0 });
  };

  const handlePageChange = (page: number) => {
    setSearchParams(toURLSearchParams(filtersToQueryParams(activeFilters, page, currentSort)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (value: string) => {
    const nextSort = parseSortOption(value);
    setSearchParams(toURLSearchParams(filtersToQueryParams(activeFilters, 1, nextSort)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <ContentsLayout className="m-auto max-w-[950px] pb-[80px] lg:p-0 lg:py-6">
      {!isDesktop && (
        <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <SheetTrigger asChild>
            <div className="my-3 flex justify-end">
              <Button className="w-fit gap-x-1" variant="secondary" size="sm">
                <img src="/search-icon-primary.svg" alt="検索" className="size-5" />
                検索条件を変更
              </Button>
            </div>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            hideDefaultClose={true}
            className="h-[85dvh] overflow-y-scroll rounded-t-[16px]"
          >
            <div className="relative">
              <SheetClose className="fixed right-2 top-20 z-50">
                <Button variant="ghost" size="icon" className="size-8 rounded-full text-white">
                  <X className="size-5 text-white" />
                </Button>
              </SheetClose>
            </div>
            <SearchFilters
              isInitialLoad={false}
              filters={filters}
              regions={regions}
              cuisineTypes={cuisineTypes}
              restaurantTypes={restaurantTypes}
              displayCount={totalCount}
              inputValue={inputValue}
              placeholder={placeholder}
              onInputChange={handleInputChange}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-col lg:flex-row lg:gap-x-5">
        {isDesktop && (
          <div className="relative h-fit w-[222px] border border-[#C9C9C9]">
            <SearchFilters
              isInitialLoad={false}
              filters={filters}
              regions={regions}
              cuisineTypes={cuisineTypes}
              restaurantTypes={restaurantTypes}
              displayCount={totalCount}
              inputValue={inputValue}
              placeholder={placeholder}
              onInputChange={handleInputChange}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>
        )}

        <div className="flex-1">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="text-sm font-medium md:text-base">{areaName}物件一覧</span>
                <AnimatedNumber
                  value={totalCount}
                  className="ml-6 text-xl font-medium md:text-2xl md:font-[32px]"
                />
                <span className="ml-1 text-sm font-medium md:text-base">件</span>
              </div>
              <div className="flex items-center justify-end gap-2 self-end md:self-auto">
                <span className="text-xs text-[#666666]">並び替え</span>
                <Select value={currentSort} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-9 min-w-[140px] text-sm">
                    <SelectValue placeholder="新着順" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CurrentFilters filters={activeFilters} />
            {isLoading
              ? [...Array(5)].map((_, i) => <PropertyCardSkeleton key={i} />)
              : properties.map((property: Property) => (
                  <PropertyCard
                    key={property.id}
                    areaSlug={areaSlug}
                    id={property.id}
                    image={property.exteriorImages}
                    title={property.title}
                    price={`${property.rent.toLocaleString()}円`}
                    address={property.address}
                    size={`${property.floorArea}㎡`}
                    distance={
                      property.walkingTimeToStation
                        ? `徒歩${property.walkingTimeToStation}分`
                        : '徒歩時間未定'
                    }
                    isFavorite={false}
                    isNew={property.isNew}
                    isSkeleton={property.isSkeleton}
                    isInteriorIncluded={property.isInteriorIncluded}
                    variant="detailed"
                    details={property.details}
                    registrationDate={property.registrationDate}
                  />
                ))}
            {!isLoading && totalCount > 0 && totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
            {!isLoading && totalCount === 0 && (
              <div className="mt-8 text-center">
                <p className="text-lg font-medium">該当する物件が見つかりません。</p>
                <p className="mt-2 text-sm text-gray-600">検索条件を変更して再度お試しください。</p>
              </div>
            )}
          </div>

          <div className="h-8" />
        </div>
      </div>
    </ContentsLayout>
  );
}

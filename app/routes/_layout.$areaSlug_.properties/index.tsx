import { useState, useEffect, useCallback } from 'react';
import type { MetaFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigation, useParams, useSearchParams } from '@remix-run/react';
import { Entry, EntryCollection } from 'contentful';
import ContentsLayout from '~/components/layouts/ContentsLayout';
import { PropertyCard } from '~/components/parts/PropertyCard';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { SearchFilters } from '~/components/parts/SearchFilters';
import { contentfulClient } from '~/lib/contentful.server';
import { X } from 'lucide-react';
import { AnimatedNumber } from '~/components/parts/AnimatedNumber';
import { filterProperties, isNewProperty } from '~/utils/property';
import { FilterState } from 'types/contentful';
import { ErrorPage } from '~/components/parts/ErrorPage';

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
  stations?: string;
  restaurantTypes?: string;
  keyword?: string;
  walkingTime?: string;
  page?: string;
}

const filtersToQueryParams = (filters: FilterState, page: number): QueryParams => {
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
    stations: filters.stations.length > 0 ? filters.stations.join(',') : undefined,
    restaurantTypes:
      filters.allowedRestaurantTypes.length > 0
        ? filters.allowedRestaurantTypes.join(',')
        : undefined,
    keyword: filters.keyword || undefined,
    walkingTime: filters.walkingTime !== '指定なし' ? filters.walkingTime : undefined,
    page: page > 1 ? page.toString() : undefined,
  };

  Object.keys(params).forEach((key) => {
    if (params[key as keyof QueryParams] === undefined) {
      delete params[key as keyof QueryParams];
    }
  });

  return params;
};

const queryParamsToFilters = (searchParams: URLSearchParams, initialFilters: any): FilterState => {
  const regions = searchParams.get('regions')?.split(',');
  const stations = searchParams.get('stations')?.split(',');
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
    stations:
      stations ||
      (initialFilters.selectedStation?.name ? [initialFilters.selectedStation.name] : []),
    allowedRestaurantTypes: restaurantTypes || [],
    keyword: searchParams.get('keyword') || initialFilters.keyword || '',
    walkingTime: searchParams.get('walkingTime') || '指定なし',
  };
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
  stations: string[];
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
}

interface Station {
  id: string;
  name: string;
  popularityOrder: number;
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
  stations: Station[];
  regions: Region[];
  restaurantTypes: Array<{ id: string; name: string }>;
  areaName: string;
  initialFilters: {
    selectedStation?: { id: string; name: string };
    selectedRegion?: { id: string; name: string };
    keyword?: string;
  };
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const { areaSlug } = params;
  const url = new URL(request.url);
  const stationId = url.searchParams.get('station');
  const keyword = url.searchParams.get('keyword');
  const regionId = url.searchParams.get('region');

  try {
    const expiredDays = 3650;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - expiredDays);
    const thresholdDate = dateThreshold.toISOString();

    const [areaEntry, stationEntry] = await Promise.all([
      contentfulClient.getEntries({
        content_type: 'area',
        'fields.slug': areaSlug,
        limit: 1,
      }),
      stationId ? contentfulClient.getEntry(stationId) : Promise.resolve(null),
    ]);

    const area = areaEntry.items[0];
    if (!area) {
      throw new Response('Area not found', { status: 404 });
    }

    const areaId = area.sys.id;
    const areaName = area.fields.name;
    const placeholder = area.fields.placeholder || '';

    const regionsInArea = await contentfulClient.getEntries({
      content_type: 'region',
      'fields.area.sys.id': areaId,
      order: ['fields.areaSearchOrder'],
    });

    const regionIds = regionsInArea.items.map((region) => region.sys.id);

    const [propertyEntries, stationsInArea, restaurantTypeEntries] = await Promise.all([
      getAllEntries({
        content_type: 'property',
        'fields.regions.sys.id[in]': regionIds.join(','),
        'fields.registrationDate[gte]': thresholdDate,
        order: ['-sys.createdAt'],
        include: 2,
      }),
      contentfulClient.getEntries({
        content_type: 'station',
        'fields.area.sys.id': areaId,
        order: ['fields.popularityOrder'],
      }),
      contentfulClient.getEntries({
        content_type: 'restaurantType',
        order: ['fields.order'],
      }),
    ]);

    const properties = propertyEntries.map((item: any) => ({
      id: item.sys.id,
      title: item.fields.title || '',
      propertyId: item.fields.propertyId || '',
      regions:
        item.fields.regions?.map((region: any) => region?.fields?.name || '').filter(Boolean) || [],
      stations:
        item.fields.stationsName
          ?.map((station: any) => station?.fields?.name || '')
          .filter(Boolean) || [],
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
          ?.map((type: any) => type.fields?.name || '')
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
      registrationDate: item.fields.registrationDate
        ? new Date(item.fields.registrationDate).toLocaleDateString('ja-JP')
        : new Date(item.sys.createdAt).toLocaleDateString('ja-JP'),
    }));

    const stations = stationsInArea.items.map((item: any) => ({
      id: item.sys.id,
      name: item.fields.name,
      popularityOrder: item.fields.popularityOrder,
    }));

    const regions = regionsInArea.items.map((item: any) => ({
      id: item.sys.id,
      name: item.fields.name,
      area: item.fields.area,
    }));

    const restaurantTypes = restaurantTypeEntries.items.map((item: any) => ({
      id: item.sys.id,
      name: item.fields.name,
    }));

    const selectedStation = stationEntry
      ? {
          id: stationEntry.sys.id,
          name: stationEntry.fields.name,
        }
      : undefined;

    let selectedRegion = undefined;
    if (regionId) {
      const regionEntry = await contentfulClient.getEntry(regionId);
      if (regionEntry) {
        selectedRegion = {
          id: regionEntry.sys.id,
          name: regionEntry.fields.name,
        };
      }
    }

    return json<LoaderData>({
      properties,
      stations,
      regions,
      restaurantTypes,
      areaName,
      placeholder,
      initialFilters: {
        selectedStation,
        selectedRegion,
        keyword,
      },
    });
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
      .map((region) => region.name)
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

    const locations = [...filters.regions, ...filters.stations];
    if (locations.length > 0) {
      conditions.push(`エリア：${locations.join('・')}`);
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
  const { properties, regions, stations, restaurantTypes, initialFilters, areaName, placeholder } =
    useLoaderData<typeof loader>();

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });

  const [filters, setFilters] = useState<FilterState>(() =>
    queryParamsToFilters(searchParams, initialFilters)
  );

  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);
  const [displayCount, setDisplayCount] = useState(properties.length);
  const [inputValue, setInputValue] = useState(filters.keyword || '');

  const ITEMS_PER_PAGE = 10;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleFilterChange = (name: string, value: any) => {
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    calculateDisplayCount(updatedFilters);
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
    setIsSearchOpen(false);
    setSearchParams(filtersToQueryParams(filters, 1));
    window.scrollTo({ top: 0 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams(filtersToQueryParams(filters, page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (properties.length > 0) {
      setIsInitialLoad(false);
      const filtered = properties.filter((property) => filterProperties(property, filters));
      setFilteredProperties(filtered);
      setDisplayCount(filtered.length);
    }
  }, [properties]);

  // フィルターが変更された時の処理
  useEffect(() => {
    const filtered = properties.filter((property) => filterProperties(property, appliedFilters));
    setFilteredProperties(filtered);
    setDisplayCount(filtered.length);
  }, [appliedFilters, properties]);

  // 表示件数の計算
  const calculateDisplayCount = useCallback(
    (currentFilters: FilterState) => {
      const count = properties.filter((property) =>
        filterProperties(property, currentFilters)
      ).length;
      setDisplayCount(count);
    },
    [properties]
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);

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
              isInitialLoad={isInitialLoad}
              filters={filters}
              regions={regions}
              stations={stations}
              restaurantTypes={restaurantTypes}
              displayCount={displayCount}
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
              isInitialLoad={isInitialLoad}
              filters={filters}
              regions={regions}
              stations={stations}
              restaurantTypes={restaurantTypes}
              displayCount={displayCount}
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
            <div>
              <span className="text-sm font-medium md:text-base">{areaName}物件一覧</span>
              <AnimatedNumber
                value={displayCount}
                className="ml-6 text-xl font-medium md:text-2xl md:font-[32px]"
              />
              <span className="ml-1 text-sm font-medium md:text-base">件</span>
            </div>
            <CurrentFilters filters={appliedFilters} />
            {isLoading || isInitialLoad
              ? [...Array(5)].map((_, i) => <PropertyCardSkeleton key={i} />)
              : currentProperties.map((property) => (
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
            {!isLoading && !isInitialLoad && filteredProperties.length > 0 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
            {!isLoading && !isInitialLoad && filteredProperties.length === 0 && (
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

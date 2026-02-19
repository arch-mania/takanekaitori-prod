import type { MetaFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams } from '@remix-run/react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import ContentsLayout from '~/components/layouts/ContentsLayout';
import { PropertyCard } from '~/components/parts/PropertyCard';
import Heading from '~/components/ui/heading';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { contentfulClient } from '~/lib/contentful.server';
import { Property, CuisineType } from 'types/contentful';
import { getNewPropertiesCount, isNewProperty } from '~/utils/property';
import { ErrorPage } from '~/components/parts/ErrorPage';
import { guardAgainstBadBots } from '~/lib/bot-guard.server';

interface LoaderData {
  properties: Property[];
  featuredProperties: Property[];
  cuisineTypes: CuisineType[];
  totalCount: number;
  newCount: number;
  areaName: string;
  searchRegions: {
    id: string;
    name: string;
    order: number;
    area: string;
  }[];
}

export const loader: LoaderFunction = async ({ params, request }) => {
  guardAgainstBadBots(request);
  const { areaSlug } = params;

  try {
    const expiredDays = 3650;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - expiredDays);
    const thresholdDate = dateThreshold.toISOString();

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

    const regionsEntry = await contentfulClient.getEntries({
      content_type: 'region',
      'sys.id[in]': area.fields.regions?.map((r: any) => r.sys.id).join(','),
      include: 2,
    });

    const searchRegions = regionsEntry.items
      .filter((item: any) => item.fields.order && item.fields.area?.sys.id === areaId)
      .sort((a: any, b: any) => a.fields.order - b.fields.order)
      .slice(0, 5)
      .map((item: any) => ({
        id: item.sys.id,
        name: item.fields.name,
        order: item.fields.order,
        area: item.fields.area?.fields?.name || '',
      }));

    const regionIds = regionsEntry.items
      .filter(
        (region: { fields: { area?: { sys: { id: string } } } }) =>
          region.fields.area?.sys.id === areaId
      )
      .map((region: { sys: { id: string } }) => region.sys.id);

    // 新着物件カウント用クエリ（isNewフラグ OR 48時間以内の登録日）
    const newPropertiesQuery = {
      content_type: 'property',
      'fields.regions.sys.id[in]': regionIds.join(','),
      'fields.registrationDate[gte]': thresholdDate,
      select: ['sys.id', 'fields.isNew', 'fields.registrationDate'],
    };

    // 全クエリを並列実行（レスポンス時間短縮）
    const [
      featuredPropertiesEntries,
      propertyEntries,
      cuisineTypeEntries,
      totalCountResponse,
      newCount,
    ] = await Promise.all([
      // 注目物件
      contentfulClient.getEntries({
        content_type: 'property',
        'fields.regions.sys.id[in]': regionIds.join(','),
        'fields.pickupOrder[exists]': true,
        'fields.registrationDate[gte]': thresholdDate,
        order: ['fields.pickupOrder'],
        include: 2,
      }),
      // 新着物件（12件）
      contentfulClient.getEntries({
        content_type: 'property',
        'fields.regions.sys.id[in]': regionIds.join(','),
        'fields.registrationDate[gte]': thresholdDate,
        order: ['-sys.createdAt'],
        limit: 12,
        include: 2,
      }),
      // おすすめ業態
      contentfulClient.getEntries({
        content_type: 'cuisineType',
        order: ['fields.order'],
      }),
      // 総物件数（totalプロパティ使用）
      contentfulClient.getEntries({
        content_type: 'property',
        'fields.regions.sys.id[in]': regionIds.join(','),
        'fields.registrationDate[gte]': thresholdDate,
        select: ['sys.id'],
        limit: 1,
      }),
      // 新着物件数（isNew=true OR 48時間以内）
      getNewPropertiesCount(contentfulClient, newPropertiesQuery),
    ]);

    const totalCount = totalCountResponse.total;

    const mapPropertyData = (item: any) => {
      const fields = item.fields;
      const isPropertyNew = isNewProperty(item);

      return {
        id: item.sys.id,
        title: fields.title || '',
        address: fields.address || '',
        price: fields.rent
          ? `${(fields.rent || 0).toLocaleString()}万円${fields.pricePerTsubo ? ` / ${fields.pricePerTsubo}万円` : ''}`
          : '-',
        size: fields.floorArea
          ? `${fields.floorArea || 0}㎡${fields.floorAreaTsubo ? ` / ${fields.floorAreaTsubo}坪` : ''}`
          : '-',
        distance: `${fields.stationName1}${fields.walkingTimeToStation ? ` 徒歩${fields.walkingTimeToStation}分` : ''}`,
        image: fields.exteriorImages?.[0]?.fields?.file?.url || '/propertyImage.png',
        isNew: isPropertyNew,
        isSkeleton: fields.isSkeleton || false,
        isInteriorIncluded: fields.isInteriorIncluded || false,
        isFavorite: false,
        pickupOrder: fields.pickupOrder || null,
        details: [
          { label: '賃料', value: fields.rent ? `${fields.rent.toLocaleString()}円` : '-' },
          { label: '敷金/保証金', value: fields.securityDeposit || '-' },
          {
            label: '面積',
            value: fields.floorArea
              ? `${fields.floorArea}㎡${fields.floorAreaTsubo ? `（${fields.floorAreaTsubo}坪）` : ''}`
              : '-',
          },
          { label: '住所', value: fields.address || '-' },
          { label: '最寄駅', value: fields.stationName1 || '-' },
        ],
        regions:
          fields.regions?.map((region: any) => ({
            id: region.sys.id,
            name: region.fields.name,
            area: region.fields.area?.fields?.name || '',
          })) || [],
      };
    };

    const properties = propertyEntries.items.map(mapPropertyData);
    const featuredProperties = featuredPropertiesEntries.items.map(mapPropertyData);
    const cuisineTypes = cuisineTypeEntries.items.map((item: any) => ({
      id: item.sys.id,
      name: item.fields.name,
      order: item.fields.order,
    }));

    return json<LoaderData>({
      properties,
      featuredProperties,
      cuisineTypes,
      totalCount,
      newCount,
      areaName: String(areaName || ''),
      placeholder,
      searchRegions,
    });
  } catch (error) {
    console.error('Contentful fetch error:', error);
    if (error instanceof Response) {
      throw error;
    }
    return json<LoaderData>({
      properties: [],
      featuredProperties: [],
      cuisineTypes: [],
      totalCount: 0,
      newCount: 0,
      areaName: '',
      placeholder: '',
      searchRegions: [],
    });
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: '居抜きビュッフェ Presented by 店舗高値買取センター' },
    {
      name: 'description',
      content:
        '関東エリア・関西エリアの居抜き・スケルトン店舗物件1,800件以上を掲載中。渋谷、池袋、横浜など人気エリアの飲食店居抜き物件が充実。初期費用100万円からの出店支援や、撤退時の物件買取にも対応。飲食店の開業から撤退までトータルサポート。まずは無料で物件検索！',
    },
  ];
};

export default function Index() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const {
    properties,
    featuredProperties,
    cuisineTypes,
    totalCount,
    newCount,
    areaName,
    placeholder,
    searchRegions,
  } = useLoaderData<LoaderData>();
  const { areaSlug } = useParams();
  const navigate = useNavigate();

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (searchKeyword) {
      searchParams.append('keyword', searchKeyword);
    }
    navigate(`/${areaSlug}/properties?${searchParams.toString()}`);
  };

  const getGridItemClassName = (index: number): string => {
    const baseClasses = 'size-full';

    switch (index) {
      case 0:
        return `${baseClasses} col-span-6 row-span-8 lg:col-span-1 lg:row-span-2`;
      case 1:
        return `${baseClasses} col-span-6 row-span-8 lg:col-span-1 lg:row-span-1`;
      case 2:
      case 3:
      case 4:
        return `${baseClasses} col-span-4 row-span-5 lg:col-span-1 lg:row-span-1`;
      default:
        return baseClasses;
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-y-2 py-4 lg:py-8">
        <p className="text-center text-base font-bold text-primary lg:text-2xl">
          居抜きもスケルトンも！
          <br />
          ぴったりの飲食店物件が簡単に見つかる！
        </p>
        <div className="flex items-center gap-x-4">
          <div className="flex items-center">
            <span className="text-xs font-normal text-foreground lg:text-sm">掲載物件数</span>
            <span className="ml-1 block text-lg font-bold text-[#1ABC9C] lg:text-[22px]">
              {totalCount.toLocaleString()}
              <small className="ml-[2px] text-xs font-normal text-foreground lg:text-sm">件</small>
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-xs font-normal text-foreground lg:text-sm">新着物件数</span>
            <span className="ml-1 block text-lg font-bold text-[#1ABC9C] lg:text-[22px]">
              {newCount.toLocaleString()}
              <small className="ml-[2px] text-xs font-normal text-foreground lg:text-sm">件</small>
            </span>
          </div>
        </div>
      </div>
      <ContentsLayout className="mx-auto max-w-[950px] space-y-16 pb-20 pt-2">
        <section className="space-y-8 lg:space-y-6">
          <Heading level={2}>物件を探す</Heading>
          <div className="flex flex-col space-y-2 lg:!mt-[18px] lg:flex-row lg:items-center lg:gap-x-5">
            <Label className="lg:w-[220px] lg:p-[10px]">キーワード検索</Label>
            <div className="flex items-center justify-between gap-x-2 lg:w-[calc(100%-240px)]">
              <Input
                className="w-10/12 lg:w-full"
                placeholder={placeholder}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button size="icon" className="lg:hidden" onClick={handleSearch}>
                <img src="/search-icon.svg" alt="検索" className="size-5" />
              </Button>
              <Button size="lg" className="hidden lg:flex lg:gap-x-2" onClick={handleSearch}>
                <img src="/search-icon.svg" alt="検索" className="size-5" />
                検索
              </Button>
            </div>
          </div>
          <div className="flex flex-col space-y-2 lg:!mt-10 lg:flex-row lg:items-start lg:gap-x-5">
            <Label className="lg:w-[220px] lg:p-[10px]">エリアから検索</Label>
            <div className="grid h-[148px] grid-cols-12 grid-rows-12 gap-3 lg:h-[124px] lg:w-[calc(100%-240px)] lg:grid-cols-3 lg:grid-rows-2 lg:gap-x-5">
              {searchRegions.map((region, index) => (
                <Button
                  key={region.id}
                  to={`/${areaSlug}/properties?region=${region.id}`}
                  variant="secondary"
                  className={getGridItemClassName(index)}
                >
                  {region.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col space-y-2 lg:!mt-10 lg:flex-row lg:items-start lg:gap-x-5">
            <Label className="lg:w-[220px] lg:p-[10px]">おすすめ業態</Label>
            <div className="flex flex-wrap items-center gap-3 lg:w-[calc(100%-240px)] lg:gap-4">
              {cuisineTypes.map((cuisineType) => (
                <Button
                  key={cuisineType.id}
                  to={`/${areaSlug}/properties?cuisineTypes=${encodeURIComponent(cuisineType.name)}`}
                  variant="tertiary"
                  size="xs"
                >
                  {cuisineType.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
        <section className="space-y-8 lg:space-y-6">
          <Heading level={2}>{areaName}の新着物件ピックアップ</Heading>
          <div className="flex flex-wrap gap-3 gap-y-6 lg:gap-x-[20px]">
            {properties.length > 0 ? (
              properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  areaSlug={areaSlug}
                  id={property.id}
                  image={property.image}
                  title={property.title}
                  price={property.price}
                  address={property.address}
                  size={property.size}
                  distance={property.distance}
                  isFavorite={property.isFavorite}
                  isNew={property.isNew}
                  isSkeleton={property.isSkeleton}
                  isInteriorIncluded={property.isInteriorIncluded}
                  variant="default"
                  details={property.details}
                />
              ))
            ) : (
              <p className="w-full text-center text-gray-500">{areaName}の物件は現在ありません。</p>
            )}
          </div>
          {properties.length > 0 && (
            <Button
              to={`/${areaSlug}/properties`}
              variant="secondary"
              size="sm"
              className="mx-auto flex w-full max-w-[464px]"
            >
              {areaName}の物件をもっとみる
            </Button>
          )}
        </section>
        {featuredProperties?.length > 0 && (
          <section className="space-y-8 lg:space-y-6">
            <Heading level={2}>注目物件</Heading>
            <div className="flex flex-wrap gap-3 gap-y-6 lg:gap-x-[20px]">
              {featuredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  areaSlug={areaSlug}
                  id={property.id}
                  image={property.image}
                  title={property.title}
                  price={property.price}
                  address={property.address}
                  size={property.size}
                  distance={property.distance}
                  isFavorite={property.isFavorite}
                  isNew={property.isNew}
                  isSkeleton={property.isSkeleton}
                  isInteriorIncluded={property.isInteriorIncluded}
                  variant="default"
                  details={property.details}
                />
              ))}
            </div>
          </section>
        )}
      </ContentsLayout>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorPage />;
}

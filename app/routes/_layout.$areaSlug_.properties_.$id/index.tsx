import React, { useState, useRef } from 'react';
import type { MetaFunction, LoaderFunction, ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { createClient } from 'contentful';
import ContentsLayout from '~/components/layouts/ContentsLayout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import ContactForm from '~/components/parts/ContactForm';
import { PropertyDetail } from 'types/property';
import { contentfulClient } from '~/lib/contentful.server';
import { saveContactForm } from '~/services/contact.server';
import { isNewProperty } from '~/utils/property';
import { ErrorPage } from '~/components/parts/ErrorPage';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: '飲食店物件 | 居抜きビュッフェ' },
      {
        name: 'description',
        content:
          '飲食店物件・居抜き物件・スケルトン物件の詳細情報です。立地・賃料・面積・前業態など、物件に関する詳しい情報を掲載しています。',
      },
    ];
  }

  const typeLabels = [
    data.isNew && 'NEW',
    data.isSkeleton && 'スケルトン',
    data.isInteriorIncluded && '居抜き',
  ]
    .filter(Boolean)
    .join('・');

  const rentText = data.rent ? `${data.rent}万円` : '';

  const areaText = data.floorArea ? `${data.floorArea}㎡（${data.floorAreaTsubo}坪）` : '';

  const mainImage = data.images[0] || '/propertyImage.png';

  return [
    {
      title: `${data.title} | 居抜きビュッフェ`,
    },
    {
      name: 'description',
      content: `${data.title}。${typeLabels && `${typeLabels}物件、`}${data.address}に所在。${rentText && `賃料${rentText}、`}${areaText && `面積${areaText}。`}${data.cuisineTypes.length > 0 ? `${data.cuisineTypes.join('・')}など出店可能。` : ''}飲食店の居抜き物件やスケルトン物件をお探しの方は、詳細情報をご確認ください。`,
    },
    {
      name: 'keywords',
      content: `${data.title},${data.address},飲食店物件,${typeLabels},居抜き物件,スケルトン物件,貸店舗,飲食店開業,${data.allowedRestaurantTypes.join(',')}`,
    },
    {
      property: 'og:title',
      content: `${data.title} | 居抜きビュッフェ`,
    },
    {
      property: 'og:description',
      content: `${data.title}。${typeLabels && `${typeLabels}物件、`}${data.address}に所在。${rentText && `賃料${rentText}、`}${areaText && `面積${areaText}。`}${data.cuisineTypes.length > 0 ? `${data.cuisineTypes.join('・')}など出店可能。` : ''}飲食店の居抜き物件やスケルトン物件をお探しの方は、詳細情報をご確認ください。`,
    },
    { property: 'og:image', content: mainImage },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: '居抜きビュッフェ' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: data.title },
    {
      name: 'twitter:description',
      content: `${data.address}所在。${rentText && `賃料${rentText}、`}${areaText && `面積${areaText}。`}`,
    },
    { name: 'twitter:image', content: mainImage },
    { name: 'format-detection', content: 'telephone=no' },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as unknown as FormData;

  // バリデーションエラーを格納する配列
  const errors = {};

  // 必須項目のバリデーション
  if (!data.inquiryType) {
    errors.inquiryType = 'お問い合わせ内容を選択してください';
  }

  if (data.inquiryType === 'other' && !data.inquiryContent) {
    errors.inquiryContent = 'その他の内容を入力してください';
  }

  if (!data.name) {
    errors.name = 'お名前を入力してください';
  }

  if (!data.email) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '正しいメールアドレスを入力してください';
  }

  if (!data.message) {
    errors.message = 'ご要望や確認事項を入力してください';
  }

  // エラーがある場合は早期リターン
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 400 });
  }

  try {
    await saveContactForm(data);

    return json(
      {
        success: true,
        message: 'お問い合わせ誠にありがとうございます。お問い合わせを受け付けました。',
        errors: null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    return json(
      {
        success: false,
        errors: {
          _form: 'エラーが発生しました。時間をおいて再度お試しください。',
        },
      },
      {
        status: 500,
      }
    );
  }
};

export const loader: LoaderFunction = async ({ params }) => {
  try {
    const entries = await contentfulClient.getEntry(params.id as string, {
      include: 2,
    });

    if (!entries) {
      throw new Response('物件が見つかりません', { status: 404 });
    }

    const expiredDays = 3650;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - expiredDays);

    const registrationDate = entries.fields.registrationDate
      ? new Date(entries.fields.registrationDate)
      : null;

    if (registrationDate && registrationDate < dateThreshold) {
      throw new Response('物件が見つかりません', { status: 404 });
    }

    const fields = entries.fields;

    const badges = [];
    if (isNewProperty(entries)) {
      badges.push({ text: 'NEW', variant: 'new' });
    }
    if (fields.isSkeleton) {
      badges.push({ text: 'スケルトン', variant: 'skeleton' });
    }
    if (fields.isInteriorIncluded) {
      badges.push({ text: '居抜き', variant: 'furnished' });
    }

    const images = [
      ...(fields.exteriorImages?.map((image: any) => image.fields?.file?.url) || [
        '/propertyImage.png',
      ]),
      ...(fields.floorPlan ? [fields.floorPlan.fields?.file?.url] : []),
    ];

    const formatFloor = (floors: string[]): string => {
      if (!floors || floors.length === 0) return '-';

      return floors
        .map((floor) => {
          if (floor.startsWith('B')) {
            const floorNum = floor.substring(1);
            return `地下${floorNum}階`;
          }
          return `${floor}階`;
        })
        .join('、');
    };

    const property: PropertyDetail = {
      id: entries.sys.id,
      propertyId: fields.propertyId,
      assignedAgent: fields.assignedAgent || '',
      title: fields.title || '',
      address: fields.address || '',
      distance: fields.walkingTimeToStation ? `徒歩${fields.walkingTimeToStation}分` : '-',
      size: `${fields.floorArea || 0}㎡（${fields.floorAreaTsubo || 0}坪）`,
      rent: fields.rent || 0,
      pricePerTsubo: fields.pricePerTsubo || 0,
      floorArea: fields.floorArea || 0,
      floorAreaTsubo: fields.floorAreaTsubo || 0,
      interiorTransferFee: fields.interiorTransferFee || '-',
      allowedRestaurantTypes:
        fields.allowedRestaurantTypes?.map((type: any) => type.fields.name) || [],
      cuisineTypes: fields.cuisineType?.map((type: any) => type.fields.name) || [],
      notes: fields.notes || '-',
      comment: fields.notes || '-',
      images,
      isNew: isNewProperty(entries),
      isSkeleton: fields.isSkeleton || false,
      isInteriorIncluded: fields.isInteriorIncluded || false,
      isWatermarkEnabled: fields.isWatermarkEnabled || false,
      details: [
        { label: '所在地', value: fields.address || '-' },
        {
          label: '最寄り駅',
          value: `${fields.stationName1}${fields.walkingTimeToStation ? ` 徒歩${fields.walkingTimeToStation}分` : ''}`,
        },
        {
          label: '賃料/坪単価',
          value: `${fields.rent?.toLocaleString() || 0}万円 / ${fields.pricePerTsubo?.toLocaleString() || 0}万円`,
        },
        {
          label: '面積㎡/坪',
          value: `${fields.floorArea || 0}㎡ / ${fields.floorAreaTsubo || 0}坪`,
        },
        {
          label: '礼金/権利金',
          value: `${(fields.nonRefundableDeposit && `${fields.nonRefundableDeposit}`) || '-'}`,
        },
        {
          label: '保証金/敷金',
          value: `${(fields.securityDeposit && `${fields.securityDeposit}`) || '-'}`,
        },
        {
          label: '所在階',
          value: formatFloor(fields.floors),
        },
        { label: '造作譲渡料/前テナント', value: fields.interiorTransferFee || '-' },
        {
          label: '出店可能な飲食店の種類',
          value:
            fields.allowedRestaurantTypes?.map((type: any) => type.fields.name).join('・') || '-',
        },
        { label: '備考', value: fields.notes || '-' },
      ],
    };

    return json(property);
  } catch (error) {
    console.error('Contentful fetch error:', error);
    throw new Response('物件が見つかりません', { status: 404 });
  }
};

export default function PropertyDetail() {
  const property = useLoaderData<typeof loader>();
  const [showContactForm, setShowContactForm] = useState(false);
  const contactFormRef = useRef<HTMLDivElement>(null);

  const handleContactClick = () => {
    setShowContactForm(true);
    setTimeout(() => {
      contactFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const shouldShowWatermark = (label: string) => {
    if (!property.isWatermarkEnabled) return false;

    const watermarkStartItems = [
      '礼金/権利金',
      '保証金/敷金',
      '所在階',
      '造作譲渡料/前テナント',
      '出店可能な飲食店の種類',
      '備考',
    ];

    return watermarkStartItems.includes(label);
  };

  const getWatermarkHeightClass = (label: string) => {
    return label === '備考' ? 'h-12' : 'h-6';
  };

  const getWatermarkPath = (label: string) => {
    const labelToPath: { [key: string]: string } = {
      '礼金/権利金': 'key-money',
      '保証金/敷金': 'deposit',
      所在階: 'floor',
      '造作譲渡料/前テナント': 'interior',
      出店可能な飲食店の種類: 'restaurant-types',
      備考: 'notes',
    };

    const path = labelToPath[label] || 'default';
    return `/property-detail_water-mark-${path}.png`;
  };

  return (
    <ContentsLayout className="mx-auto max-w-[950px] p-3">
      <div className="space-x-2">
        {property.isNew && <Badge variant="new">NEW</Badge>}
        {property.isSkeleton && <Badge variant="skeleton">スケルトン</Badge>}
        {property.isInteriorIncluded && <Badge variant="equipped">居抜き</Badge>}
      </div>

      <h1 className="mt-2 text-base font-medium lg:text-2xl">{property.title}</h1>

      {!showContactForm && (
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            className="mt-6 w-auto gap-x-2 px-6"
            onClick={handleContactClick}
          >
            <img src="/mail-icon.svg" alt="" width="20" height="20" />
            物件のお問い合わせ
          </Button>
        </div>
      )}

      <div className="mt-6 lg:mt-8">
        <div className="relative">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {property.images.map((image, index) => (
                <div key={index} className="shrink-0 first:ml-0">
                  <img
                    src={image}
                    alt={`${property.title} - 画像${index + 1}`}
                    className="aspect-[3/2] h-auto w-[325px] object-cover lg:w-[530px]"
                    width="325"
                    height="216"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Table className="mt-4 border-collapse lg:mt-8">
          <TableBody>
            {property.details.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="w-4/12 border border-background bg-[#E8EAED] py-3 text-xs font-medium md:text-base">
                  {item.label}
                </TableCell>
                <TableCell className="w-[80px] whitespace-pre-line border-y border-[#C9C9C9] py-3 md:text-base">
                  {shouldShowWatermark(item.label) ? (
                    <img
                      src={getWatermarkPath(item.label)}
                      className={`${getWatermarkHeightClass(item.label)} bg-no-repeat`}
                      alt="詳細はお問い合わせください"
                    />
                  ) : (
                    item.value
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {property.isWatermarkEnabled && !showContactForm && (
          <div className="absolute bottom-[86px] left-1/2 mt-6 -translate-x-1/2 rounded-[8px] border border-[#217BAD] bg-background p-6 text-center">
            <p className="mb-4 text-sm font-medium">
              こちらの物件の
              <br className="block md:hidden" />
              詳細情報については
              <br />
              お問い合わせください
            </p>
            <Button
              variant="default"
              size="sm"
              className="mx-auto gap-x-2"
              onClick={handleContactClick}
            >
              お問い合わせ
            </Button>
          </div>
        )}
      </div>
      <span className="text-sm">※表記は消費税を含む金額となります。</span>
      {!showContactForm && (
        <Button
          variant="default"
          size="sm"
          className="mt-4 w-full gap-x-2 lg:mt-10"
          onClick={handleContactClick}
        >
          <img src="/mail-icon.svg" alt="" width="20" height="20" />
          物件のお問い合わせ
        </Button>
      )}

      <div
        ref={contactFormRef}
        className={`mt-6 border border-[#C9C9C9] px-4 py-8 lg:px-10 lg:py-14 ${
          showContactForm ? '' : 'hidden'
        }`}
      >
        <h2 className="mb-6 text-center text-xl font-bold">物件のお問い合わせ</h2>
        <ContactForm
          propertyTitle={property.title}
          propertyId={property.propertyId}
          assignedAgent={property.assignedAgent}
        />
      </div>

      <div className="space-y-4 px-4 py-8 text-center lg:py-14">
        <img
          className="lg:hidden"
          src="/property-detail_cta_sp.png"
          alt="条件に合う物件がなかなか見つからない"
          width="366"
          height="553"
        />
        <img
          className="hidden lg:block"
          src="/property-detail_cta_pc.png"
          alt="自分に合う物件を教えてほしい"
          width="950"
          height="356"
        />
        <span className="block">そんな時は</span>
        <img
          className="mx-auto"
          src="/property-detail_takankaitori.png"
          alt="店舗高値買取センター"
          width="240"
          height="38"
        />
        <span className="block">にご相談ください</span>
        <div className="space-y-4">
          <span className="font-bold text-[#1ABC9C]">
            非公開物件も多数ございます。
            <br />
            ぜひお問い合わせください！
          </span>
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-5">
            <Button
              to="https://t-kaitori.com/restaurantexit/"
              variant="secondary"
              size="sm"
              className="w-full max-w-[284px] md:flex"
              target="_blank"
            >
              お問い合わせ
            </Button>
            <Button
              to="https://t-kaitori.com/"
              variant="secondary"
              size="sm"
              className="w-full max-w-[284px] md:flex"
              target="_blank"
            >
              会社Webサイト
            </Button>
          </div>
        </div>
      </div>
    </ContentsLayout>
  );
}

export function ErrorBoundary() {
  return <ErrorPage />;
}

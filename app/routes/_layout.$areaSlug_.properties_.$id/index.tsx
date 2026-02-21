import React, { useRef, useState } from 'react';
import type { ActionFunction, LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import ContentsLayout from '~/components/layouts/ContentsLayout';
import ContactForm from '~/components/parts/ContactForm';
import { ErrorPage } from '~/components/parts/ErrorPage';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { guardAgainstBadBots } from '~/lib/bot-guard.server';
import { contentfulClient } from '~/lib/contentful.server';
import { createPropertyUnlockCookie, isPropertyUnlocked } from '~/lib/property-unlock.server';
import { saveContactForm } from '~/services/contact.server';
import type {
  ActionData,
  ActionErrors,
  DesiredOpeningPeriod,
  FormData as ContactFormData,
} from '~/types/contact';
import { isNewProperty } from '~/utils/property';

const DESIRED_OPENING_PERIODS: Record<DesiredOpeningPeriod, string> = {
  A: '1ヶ月以内（移転などの急ぎ）',
  B: '3ヶ月以内（資金OK！物件があればすぐ）',
  C: '6ヶ月以内（事業計画中）',
  D: 'その他（情報収集中）',
};
const LOCK_START_LABEL = '礼金/権利金';

const UNLOCK_INQUIRY_TYPE = '物件詳細情報の閲覧申請';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isMobilePhone = (value: string) => {
  const normalizedPhone = value.replace(/[^\d]/g, '');
  return /^0\d{9,10}$/.test(normalizedPhone);
};

const trimString = (value: FormDataEntryValue | null | undefined) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const validatePropertyInquiry = (data: ContactFormData): ActionErrors => {
  const errors: ActionErrors = {};

  if (!data.inquiryType) {
    errors.inquiryType = 'お問い合わせ内容を選択してください';
  }

  if (data.inquiryType === 'その他' && !data.inquiryContent) {
    errors.inquiryContent = 'その他の内容を入力してください';
  }

  if (!data.name) {
    errors.name = 'お名前を入力してください';
  }

  if (!data.email) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!emailRegex.test(data.email)) {
    errors.email = '正しいメールアドレスを入力してください';
  }

  if (!data.message) {
    errors.message = 'ご要望や確認事項を入力してください';
  }

  return errors;
};

const validateUnlockDetails = (data: ContactFormData): ActionErrors => {
  const errors: ActionErrors = {};

  if (!data.name) {
    errors.name = '氏名を入力してください';
  }

  if (!data.phone) {
    errors.phone = '携帯番号を入力してください';
  } else if (!isMobilePhone(data.phone)) {
    errors.phone = '正しい携帯番号を入力してください';
  }

  if (!data.email) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!emailRegex.test(data.email)) {
    errors.email = '正しいメールアドレスを入力してください';
  }

  if (!data.desiredOpeningPeriod || !(data.desiredOpeningPeriod in DESIRED_OPENING_PERIODS)) {
    errors.desiredOpeningPeriod = '出店希望時期を選択してください';
  }

  return errors;
};

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

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const formKind =
    trimString(formData.get('formKind')) === 'unlockDetails' ? 'unlockDetails' : 'propertyInquiry';

  const data: ContactFormData = {
    formKind,
    inquiryType: trimString(formData.get('inquiryType')),
    inquiryContent: trimString(formData.get('inquiryContent')),
    name: trimString(formData.get('name')),
    email: trimString(formData.get('email')),
    phone: trimString(formData.get('phone')),
    message: trimString(formData.get('message')),
    desiredOpeningPeriod: trimString(formData.get('desiredOpeningPeriod')) as DesiredOpeningPeriod,
    propertyTitle: trimString(formData.get('propertyTitle')),
    propertyId: trimString(formData.get('propertyId')),
    assignedAgent: trimString(formData.get('assignedAgent')),
  };

  const errors =
    formKind === 'unlockDetails' ? validateUnlockDetails(data) : validatePropertyInquiry(data);

  if (Object.keys(errors).length > 0) {
    return json({ success: false, formKind, errors }, { status: 400 });
  }

  try {
    if (formKind === 'unlockDetails') {
      const desiredOpeningPeriod = data.desiredOpeningPeriod as DesiredOpeningPeriod;
      await saveContactForm({
        ...data,
        inquiryType: UNLOCK_INQUIRY_TYPE,
        inquiryContent: '',
        message: DESIRED_OPENING_PERIODS[desiredOpeningPeriod],
      });

      const headers: HeadersInit = {
        'Cache-Control': 'no-store',
      };

      if (params.id) {
        headers['Set-Cookie'] = await createPropertyUnlockCookie(
          request.headers.get('Cookie'),
          params.id
        );
      }

      return json(
        {
          success: true,
          formKind,
          message: '入力内容を送信しました。詳細情報を表示します。',
          errors: null,
        },
        {
          status: 200,
          headers,
        }
      );
    }

    await saveContactForm(data);

    return json(
      {
        success: true,
        formKind,
        message: 'お問い合わせ誠にありがとうございます。お問い合わせを受け付けました。',
        errors: null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return json(
      {
        success: false,
        formKind,
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

export const loader: LoaderFunction = async ({ params, request }) => {
  guardAgainstBadBots(request);
  const cacheControl = 'private, no-store';

  try {
    const entryId = params.id as string;
    const entries = await contentfulClient.getEntry(entryId, {
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
    const isDetailUnlocked = await isPropertyUnlocked(request.headers.get('Cookie'), entryId);

    const exteriorImageUrls = Array.isArray(fields.exteriorImages)
      ? fields.exteriorImages.map((image: any) => image?.fields?.file?.url || '').filter(Boolean)
      : [];

    const images = [
      ...(exteriorImageUrls.length > 0 ? exteriorImageUrls : ['/propertyImage.png']),
      ...(fields.floorPlan && fields.floorPlan.fields?.file?.url
        ? [fields.floorPlan.fields.file.url]
        : []),
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

    const safeAllowedRestaurantTypes = Array.isArray(fields.allowedRestaurantTypes)
      ? fields.allowedRestaurantTypes.map((type: any) => type?.fields?.name || '').filter(Boolean)
      : [];

    const safeCuisineTypes = Array.isArray(fields.cuisineType)
      ? fields.cuisineType.map((type: any) => type?.fields?.name || '').filter(Boolean)
      : [];

    const property = {
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
      allowedRestaurantTypes: safeAllowedRestaurantTypes,
      cuisineTypes: safeCuisineTypes,
      notes: fields.notes || '-',
      comment: fields.notes || '-',
      images,
      isNew: isNewProperty(entries),
      isSkeleton: fields.isSkeleton || false,
      isInteriorIncluded: fields.isInteriorIncluded || false,
      isWatermarkEnabled: fields.isWatermarkEnabled || false,
      isDetailUnlocked,
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
          value: formatFloor(Array.isArray(fields.floors) ? fields.floors : []),
        },
        { label: '造作譲渡料/前テナント', value: fields.interiorTransferFee || '-' },
        {
          label: '出店可能な飲食店の種類',
          value:
            safeAllowedRestaurantTypes.length > 0 ? safeAllowedRestaurantTypes.join('・') : '-',
        },
        {
          label: 'おすすめ業態',
          value: safeCuisineTypes.length > 0 ? safeCuisineTypes.join('・') : '-',
        },
        { label: '備考', value: fields.notes || '-' },
      ],
    };

    return json(property, {
      headers: {
        'Cache-Control': cacheControl,
        Vary: 'Cookie',
      },
    });
  } catch (error) {
    console.error('Contentful fetch error:', error);
    throw new Response('物件が見つかりません', { status: 404 });
  }
};

export default function PropertyDetail() {
  const property = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [showContactForm, setShowContactForm] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const contactFormRef = useRef<HTMLDivElement>(null);

  const unlockActionData = actionData?.formKind === 'unlockDetails' ? actionData : null;
  const unlockErrors = unlockActionData?.errors;
  const isUnlockSubmitting =
    navigation.state === 'submitting' && navigation.formData?.get('formKind') === 'unlockDetails';

  const isDetailsVisible = property.isDetailUnlocked || Boolean(unlockActionData?.success);
  const lockStartIndex = property.details.findIndex(
    (detail: { label: string }) => detail.label === LOCK_START_LABEL
  );
  const hasLockedSection = !isDetailsVisible && lockStartIndex >= 0;
  const lockedSectionTopPercent =
    lockStartIndex <= 0 ? 0 : (lockStartIndex / property.details.length) * 100;

  const handleContactClick = () => {
    setShowContactForm(true);
    setTimeout(() => {
      contactFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenUnlockModal = () => {
    setIsUnlockModalOpen(true);
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
              {property.images.map((image: string, index: number) => (
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

      <div className="relative mt-4 lg:mt-8">
        <Table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-4/12" />
            <col className="w-8/12" />
          </colgroup>
          <TableBody>
            {property.details.map((item: { label: string; value: string }, index: number) => (
              <TableRow key={index}>
                <TableCell className="border border-background bg-[#E8EAED] py-3 text-xs font-medium md:text-base">
                  {item.label}
                </TableCell>
                <TableCell className="whitespace-pre-line border-y border-[#C9C9C9] py-3 md:text-base">
                  {item.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasLockedSection && (
          <div
            className="absolute bottom-0 right-0 z-10 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[3px] md:p-6"
            style={{ top: `${lockedSectionTopPercent}%`, left: 'calc(33.333333% + 1px)' }}
          >
            <Button
              type="button"
              className="w-full max-w-[300px] gap-x-2 whitespace-normal bg-[#445A9C] hover:bg-[#3B4F8C]"
              size="sm"
              onClick={handleOpenUnlockModal}
            >
              <img src="/mail-icon.svg" alt="" width="18" height="18" />
              無料でメール登録して詳細を見る
            </Button>
          </div>
        )}

        {hasLockedSection && isUnlockModalOpen && (
          <Dialog open={isUnlockModalOpen} onOpenChange={setIsUnlockModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>無料でメール登録して物件を見る</DialogTitle>
              </DialogHeader>
              <Form method="post" className="mt-6 space-y-4">
                <input type="hidden" name="formKind" value="unlockDetails" />
                <input type="hidden" name="propertyTitle" value={property.title} />
                <input type="hidden" name="propertyId" value={property.propertyId || ''} />
                <input type="hidden" name="assignedAgent" value={property.assignedAgent || ''} />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    氏名
                    <span className="ml-2 inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
                      必須
                    </span>
                  </Label>
                  <Input type="text" name="name" placeholder="山田 太郎" className="text-sm" />
                  {unlockErrors?.name && (
                    <p className="text-sm text-red-500">{unlockErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    携帯番号
                    <span className="ml-2 inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
                      必須
                    </span>
                  </Label>
                  <Input type="tel" name="phone" placeholder="090-1234-5678" className="text-sm" />
                  {unlockErrors?.phone && (
                    <p className="text-sm text-red-500">{unlockErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    メールアドレス
                    <span className="ml-2 inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
                      必須
                    </span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="sample@t-kaitori.com"
                    className="text-sm"
                  />
                  {unlockErrors?.email && (
                    <p className="text-sm text-red-500">{unlockErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    出店希望時期
                    <span className="ml-2 inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
                      必須
                    </span>
                  </Label>
                  <select
                    name="desiredOpeningPeriod"
                    defaultValue=""
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="" disabled>
                      選択してください
                    </option>
                    <option value="A">1ヶ月以内（移転などの急ぎ）</option>
                    <option value="B">3ヶ月以内（資金OK！物件があればすぐ）</option>
                    <option value="C">6ヶ月以内（事業計画中）</option>
                    <option value="D">その他（情報収集中）</option>
                  </select>
                  {unlockErrors?.desiredOpeningPeriod && (
                    <p className="text-sm text-red-500">{unlockErrors.desiredOpeningPeriod}</p>
                  )}
                </div>

                {unlockErrors?._form && (
                  <p className="text-sm text-red-500">{unlockErrors._form}</p>
                )}

                <div className="mt-2 flex justify-center">
                  <Button
                    type="submit"
                    className="bg-[#445A9C] hover:bg-[#3B4F8C]"
                    size="sm"
                    disabled={isUnlockSubmitting}
                  >
                    {isUnlockSubmitting ? '送信中...' : '送信する'}
                  </Button>
                </div>
              </Form>
            </DialogContent>
          </Dialog>
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
          formKind="propertyInquiry"
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

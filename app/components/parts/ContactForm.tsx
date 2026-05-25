import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useRouteLoaderData,
  useSubmit,
} from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useState, useEffect, type FormEvent } from 'react';
import { getRecaptchaToken, loadRecaptchaScript } from '~/lib/recaptcha.client';
import type { ActionData, FormKind } from '~/types/contact';

const RECAPTCHA_ACTIONS: Record<FormKind, string> = {
  propertyInquiry: 'property_inquiry',
  unlockDetails: 'unlock_details',
};

type RootLoaderData = {
  ENV?: {
    RECAPTCHA_SITE_KEY?: string;
  };
};

interface ContactFormProps {
  propertyId?: string;
  propertyTitle?: string;
  assignedAgent?: string;
  isPhoneRequired?: boolean;
  formKind?: FormKind;
  defaultInquiryType?: string;
}

const ContactForm = ({
  propertyTitle,
  propertyId,
  assignedAgent,
  isPhoneRequired = false,
  formKind = 'propertyInquiry',
  defaultInquiryType,
}: ContactFormProps) => {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const rootData = useRouteLoaderData<RootLoaderData>('root');
  const recaptchaSiteKey = rootData?.ENV?.RECAPTCHA_SITE_KEY || '';
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState('');
  const isSubmitting = navigation.state === 'submitting';
  const [showSuccess, setShowSuccess] = useState(false);
  const scopedActionData =
    actionData && (!actionData.formKind || actionData.formKind === formKind) ? actionData : null;

  useEffect(() => {
    if (recaptchaSiteKey) {
      loadRecaptchaScript(recaptchaSiteKey).catch((error) => {
        console.error('Failed to load reCAPTCHA:', error);
      });
    }
  }, [recaptchaSiteKey]);

  useEffect(() => {
    if (scopedActionData?.success) {
      setShowSuccess(true);

      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [scopedActionData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const recaptchaAction = RECAPTCHA_ACTIONS[formKind];

    try {
      setRecaptchaError('');
      const token = await getRecaptchaToken(recaptchaSiteKey, recaptchaAction);
      const tokenInput = form.querySelector<HTMLInputElement>('input[name="g-recaptcha-response"]');
      const actionInput = form.querySelector<HTMLInputElement>('input[name="recaptchaAction"]');

      if (tokenInput) {
        tokenInput.value = token;
      }

      if (actionInput) {
        actionInput.value = recaptchaAction;
      }

      submit(form, { method: 'post' });
    } catch (error) {
      console.error('reCAPTCHA token generation failed:', error);
      setRecaptchaError('reCAPTCHA の確認に失敗しました。時間をおいて再度お試しください。');
    }
  };

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs leading-[150%]">
          ※個人情報の取り扱いについては
          <Link to="/privacy-policy" target="_blank" className="font-bold text-primary underline">
            プライバシーポリシー
          </Link>
          をご確認ください。
        </p>
        <p className="text-xs leading-[150%]">
          ※通常はメールにてご連絡いたします。メール連絡が困難な場合には、お電話にてご連絡を差し上げる場合があります
        </p>
        <p className="!mt-[6px] text-xs leading-[150%] text-[#EF3535]">
          ※物件担当からのご連絡がご確認いただけない場合、メールが迷惑メールフォルダへ振り分けられている可能性がございます。恐れ入りますが、迷惑メールフォルダもご確認ください。
        </p>
      </div>

      <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
        <input type="hidden" name="formKind" value={formKind} />
        <input type="hidden" name="propertyTitle" value={propertyTitle || ''} />
        <input type="hidden" name="propertyId" value={propertyId || ''} />
        <input type="hidden" name="assignedAgent" value={assignedAgent || ''} />
        <input type="hidden" name="g-recaptcha-response" defaultValue="" />
        <input type="hidden" name="recaptchaAction" value={RECAPTCHA_ACTIONS[formKind]} />
        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            お問い合わせ内容{' '}
            <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
              必須
            </span>
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              type="radio"
              id="inquiry"
              name="inquiryType"
              value="内見希望"
              className="size-4"
              defaultChecked={defaultInquiryType === '内見希望'}
              onChange={() => setShowOtherInput(false)}
            />
            <label htmlFor="inquiry" className="text-sm">
              内見希望
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="radio"
              id="other"
              name="inquiryType"
              value="その他"
              className="size-4"
              defaultChecked={defaultInquiryType === 'その他'}
              onChange={() => setShowOtherInput(true)}
            />
            <label htmlFor="other" className="text-sm">
              その他
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="radio"
              id="listing-request"
              name="inquiryType"
              value="掲載希望"
              className="size-4"
              defaultChecked={defaultInquiryType === '掲載希望'}
              onChange={() => setShowOtherInput(false)}
            />
            <label htmlFor="listing-request" className="text-sm">
              掲載希望
            </label>
          </div>
          {scopedActionData?.errors?.inquiryType && (
            <p className="text-sm text-red-500">{scopedActionData.errors.inquiryType}</p>
          )}
          {showOtherInput && (
            <>
              <Textarea
                name="inquiryContent"
                className="w-full border border-gray-300 p-2 text-sm"
                rows={4}
                placeholder="その他を選択した場合は内容をご入力ください。"
              />
              {scopedActionData?.errors?.inquiryContent && (
                <p className="text-sm text-red-500">{scopedActionData.errors.inquiryContent}</p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            お名前{' '}
            <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
              必須
            </span>
          </Label>
          <Input
            type="text"
            name="name"
            className="w-full border border-gray-300 p-2 text-sm"
            placeholder="ヤマダ タロウ"
          />
          {scopedActionData?.errors?.name && (
            <p className="text-sm text-red-500">{scopedActionData.errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            メールアドレス{' '}
            <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
              必須
            </span>
          </Label>
          <Input
            type="email"
            name="email"
            className="w-full border border-gray-300 p-2 text-sm"
            placeholder="sample@t-kaitori.com"
          />
          {scopedActionData?.errors?.email && (
            <p className="text-sm text-red-500">{scopedActionData.errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            電話番号{' '}
            {isPhoneRequired ? (
              <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
                必須
              </span>
            ) : (
              <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#898989] px-1 text-xs font-medium text-white">
                任意
              </span>
            )}
          </Label>
          <Input
            type="tel"
            name="phone"
            className="w-full border border-gray-300 p-2 text-sm"
            placeholder="090-1234-5678"
          />
          {scopedActionData?.errors?.phone && (
            <p className="text-sm text-red-500">{scopedActionData.errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            ご要望や確認事項など{' '}
            <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
              必須
            </span>
          </Label>
          <Textarea name="message" className="w-full border border-gray-300 p-2 text-sm" rows={4} />
          {scopedActionData?.errors?.message && (
            <p className="text-sm text-red-500">{scopedActionData.errors.message}</p>
          )}
        </div>
        {showSuccess && (
          <div className="mb-4 rounded bg-green-100 p-4 text-green-700">
            {scopedActionData?.message}
          </div>
        )}

        {scopedActionData?.errors?._form && (
          <div className="mb-4 rounded bg-red-100 p-4 text-red-700">
            {scopedActionData.errors._form}
          </div>
        )}
        {(recaptchaError || scopedActionData?.errors?.recaptcha) && (
          <div className="mb-4 rounded bg-red-100 p-4 text-red-700">
            {recaptchaError || scopedActionData?.errors?.recaptcha}
          </div>
        )}
        <p className="text-xs leading-[150%] text-gray-500">
          このサイトは reCAPTCHA によって保護されており、Google の
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            プライバシーポリシー
          </a>
          と
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            利用規約
          </a>
          が適用されます。
        </p>
        <Button
          type="submit"
          className="mx-auto !mt-14 flex w-full max-w-[240px] self-center"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? '送信中...' : '送信する'}
        </Button>
      </Form>
    </>
  );
};

export default ContactForm;

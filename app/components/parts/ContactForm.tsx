import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useState, useEffect } from 'react';
import type { ActionData } from '~/types/contact';

interface ContactFormProps {
  propertyId?: string;
  propertyTitle?: string;
  assignedAgent?: string;
}

const ContactForm = ({ propertyTitle, propertyId, assignedAgent }: ContactFormProps) => {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const isSubmitting = navigation.state === 'submitting';
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      setShowSuccess(true);

      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [actionData]);

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

      <Form method="post" className="space-y-6">
        <input type="hidden" name="propertyTitle" value={propertyTitle || ''} />
        <input type="hidden" name="propertyId" value={propertyId || ''} />
        <input type="hidden" name="assignedAgent" value={assignedAgent || ''} />
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
              onChange={() => setShowOtherInput(true)}
            />
            <label htmlFor="other" className="text-sm">
              その他
            </label>
          </div>
          {actionData?.errors?.inquiryType && (
            <p className="text-sm text-red-500">{actionData.errors.inquiryType}</p>
          )}
          {showOtherInput && (
            <>
              <Textarea
                name="inquiryContent"
                className="w-full border border-gray-300 p-2 text-sm"
                rows={4}
                placeholder="その他を選択した場合は内容をご入力ください。"
              />
              {actionData?.errors?.inquiryContent && (
                <p className="text-sm text-red-500">{actionData.errors.inquiryContent}</p>
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
          {actionData?.errors?.name && (
            <p className="text-sm text-red-500">{actionData.errors.name}</p>
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
          {actionData?.errors?.email && (
            <p className="text-sm text-red-500">{actionData.errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            電話番号{' '}
            <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#898989] px-1 text-xs font-medium text-white">
              任意
            </span>
          </Label>
          <Input
            type="tel"
            name="phone"
            className="w-full border border-gray-300 p-2 text-sm"
            placeholder="090-1234-5678"
          />
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">
            ご要望や確認事項など{' '}
            <span className="inline-flex h-4 items-center justify-center rounded-[2px] bg-[#EF3535] px-1 text-xs font-medium text-white">
              必須
            </span>
          </Label>
          <Textarea name="message" className="w-full border border-gray-300 p-2 text-sm" rows={4} />
          {actionData?.errors?.message && (
            <p className="text-sm text-red-500">{actionData.errors.message}</p>
          )}
        </div>
        {showSuccess && (
          <div className="mb-4 rounded bg-green-100 p-4 text-green-700">{actionData?.message}</div>
        )}

        {actionData?.errors?._form && (
          <div className="mb-4 rounded bg-red-100 p-4 text-red-700">{actionData.errors._form}</div>
        )}
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

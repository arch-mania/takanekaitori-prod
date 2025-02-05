import { json, type MetaFunction, type ActionFunction } from '@remix-run/node';
import { saveContactForm } from '~/services/contact.server';
import ContentsLayout from '~/components/layouts/ContentsLayout';
import ContactForm from '~/components/parts/ContactForm';
import type { FormData } from '~/types/contact';

const ERROR_MESSAGES = {
  REQUIRED: 'この項目は必須です',
  INVALID_EMAIL: '正しいメールアドレス形式で入力してください',
  SYSTEM_ERROR: 'システムエラーが発生しました。時間をおいて再度お試しください。',
  INQUIRY_CONTENT_REQUIRED: 'その他を選択した場合は、具体的な内容の入力が必須です',
} as const;

interface FormErrors {
  inquiryType?: string;
  inquiryContent?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  _form?: string;
}

interface SystemError {
  message: string;
  code?: string;
  details?: unknown;
}

interface CustomError extends Error {
  code?: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'お問い合わせ | 居抜きビュッフェ Presented by 店舗高値買取センター' },
    {
      name: 'description',
      content:
        '居抜きビュッフェで掲載中の居抜き・スケルトンなどの店舗物件について内見希望やご質問を受け付けるお問い合わせをフォームです。',
    },
  ];
};

function sanitizeError(error: unknown): SystemError {
  if (error instanceof Error) {
    const customError = error as CustomError;
    return {
      message: customError.message,
      code: customError.code,
      details: {
        name: customError.name,
        stack: process.env.NODE_ENV === 'development' ? customError.stack : undefined,
      },
    };
  }

  return {
    message: String(error),
    details: error,
  };
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.inquiryType?.trim()) {
    errors.inquiryType = ERROR_MESSAGES.REQUIRED;
  }

  if (data.inquiryType === 'other') {
    if (!data.inquiryContent?.trim()) {
      errors.inquiryContent = ERROR_MESSAGES.INQUIRY_CONTENT_REQUIRED;
    }
  }

  if (!data.name?.trim()) {
    errors.name = ERROR_MESSAGES.REQUIRED;
  }

  const isContactPage = true;
  if (isContactPage && !data.phone?.trim()) {
    errors.phone = ERROR_MESSAGES.REQUIRED;
  }

  if (!data.email?.trim()) {
    errors.email = ERROR_MESSAGES.REQUIRED;
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      errors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }
  }

  if (!data.message?.trim()) {
    errors.message = ERROR_MESSAGES.REQUIRED;
  }

  return errors;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const data = Object.fromEntries(formData) as unknown as FormData;

  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim();
    }
  });

  const errors = validateForm(data);

  if (Object.keys(errors).length > 0) {
    return json(
      {
        success: false,
        errors,
        data,
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  try {
    await saveContactForm(data);

    return json(
      {
        success: true,
        message: 'お問い合わせを受け付けました。確認メールをお送りしましたのでご確認ください。',
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
    console.error('Contact form submission error:', error);

    const sanitizedError = sanitizeError(error);

    return json(
      {
        success: false,
        errors: {
          _form: ERROR_MESSAGES.SYSTEM_ERROR,
        },
        error: sanitizedError,
        data,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};

export default function Contact() {
  return (
    <ContentsLayout className="mx-auto max-w-[950px] space-y-8 py-14 md:space-y-10 md:py-[72px]">
      <h1 className="text-2xl font-bold md:text-[32px]">お問い合わせ</h1>
      <ContactForm isPhoneRequired={true} />
    </ContentsLayout>
  );
}

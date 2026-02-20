import { type FormData } from '~/types/contact';
import { sendEmail } from '~/lib/email.server';

class EmailError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly target: 'admin' | 'user',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

export const saveContactForm = async (data: FormData) => {
  const isUnlockDetails = data.formKind === 'unlockDetails';
  const desiredOpeningPeriod = data.message
    ? data.message.replace(/^出店希望時期:\s*/, '')
    : '-';

  const adminMailText = isUnlockDetails
    ? `新規のお問い合わせがありました。

────────────────────
担当者: ${data.assignedAgent ? `${data.assignedAgent}` : '-'}
物件タイトル： ${data.propertyTitle ? `${data.propertyTitle}` : `物件指定なし`}
お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone ? `${data.phone}` : `-`}
出店希望時期: ${desiredOpeningPeriod}
────────────────────`
    : `新規のお問い合わせがありました。

────────────────────
物件ID: ${data.propertyId ? `${data.propertyId}` : 'お問い合わせ'}
担当者: ${data.assignedAgent}
物件タイトル： ${data.propertyTitle ? `${data.propertyTitle}` : `物件指定なし`}
お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone ? `${data.phone}` : `-`}
お問い合わせ内容: ${data.inquiryType}
その他詳細: ${data.inquiryContent ? `${data.inquiryContent}` : `-`}
ご要望/確認事項: ${data.message}
────────────────────`;

  const userMailText = isUnlockDetails
    ? `${data.name} 様

お問い合わせいただき、ありがとうございます。
以下の内容で承りました。
担当者より順次ご連絡させていただきます。

────────────────────
物件タイトル： ${data.propertyTitle ? `${data.propertyTitle}` : `物件指定なし`}
お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone ? `${data.phone}` : `-`}
出店希望時期: ${desiredOpeningPeriod}
────────────────────
  
※このメールは自動送信されています。
※返信はお受けできませんので、ご了承ください。
`
    : `${data.name} 様

お問い合わせいただき、ありがとうございます。
以下の内容で承りました。
担当者より順次ご連絡させていただきます。

────────────────────
お問い合わせ内容: ${data.inquiryType}
その他詳細: ${data.inquiryContent ? `${data.inquiryContent}` : `-`}
お名前: ${data.name}
メールアドレス: ${data.email}
電話番号: ${data.phone ? `${data.phone}` : `-`}
ご要望/確認事項: ${data.message}
────────────────────
  
※このメールは自動送信されています。
※返信はお受けできませんので、ご了承ください。
`;

  try {
    // 管理者向けメールの送信
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `【居抜きビュッフェ】${data.propertyTitle ? `${data.propertyTitle}に` : ''}お問い合わせがありました`,
        text: adminMailText,
      });
    } catch (error) {
      throw new EmailError(
        '管理者向けメールの送信に失敗しました',
        'ADMIN_EMAIL_FAILED',
        'admin',
        error
      );
    }

    if (!isUnlockDetails) {
      // ユーザー向けメールの送信（通常お問い合わせのみ）
      try {
        await sendEmail({
          to: data.email,
          subject: '【居抜きビュッフェ】お問い合わせありがとうございます',
          text: userMailText,
        });
      } catch (error) {
        throw new EmailError(
          'お客様向け自動返信メールの送信に失敗しました',
          'USER_EMAIL_FAILED',
          'user',
          error
        );
      }
    }
  } catch (error) {
    console.error('Contact form save error:', error);

    if (error instanceof EmailError) {
      let userMessage = '';

      if (error.target === 'admin') {
        userMessage =
          'お問い合わせの受付処理に失敗しました。お手数ですが、時間をおいて再度お試しいただくか、お電話にてお問い合わせください。';
      } else {
        userMessage =
          '確認メールの送信に失敗しました。お問い合わせは受け付けていますので、担当者から別途ご連絡させていただきます。';
      }

      throw new Error(userMessage);
    }

    throw new Error('予期せぬエラーが発生しました。お手数ですが、時間をおいて再度お試しください。');
  }
};

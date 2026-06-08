import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from '~/lib/email.server';
import { saveContactForm } from './contact.server';
import type { FormData } from '~/types/contact';

vi.mock('~/lib/email.server', () => ({
  sendEmail: vi.fn(),
}));

const baseData: FormData = {
  formKind: 'propertyInquiry',
  inquiryType: '内見希望',
  inquiryContent: '',
  name: '山田 太郎',
  email: 'test@example.com',
  phone: '090-1234-5678',
  message: '内見を希望します。',
  propertyTitle: 'テスト物件',
  propertyId: 'property-1',
  assignedAgent: '担当者',
};

describe('saveContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendEmail).mockResolvedValue({} as Awaited<ReturnType<typeof sendEmail>>);
  });

  it('uses the current admin subject for contact page submissions', async () => {
    await saveContactForm(baseData);

    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: '【居抜きビュッフェ】テスト物件にお問い合わせがありました',
      })
    );
  });

  it('uses the current admin subject for property detail inquiries', async () => {
    await saveContactForm({
      ...baseData,
    });

    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: '【居抜きビュッフェ】テスト物件にお問い合わせがありました',
      })
    );
  });

  it('uses the mail registration admin subject for unlock details submissions', async () => {
    await saveContactForm({
      ...baseData,
      formKind: 'unlockDetails',
      inquiryType: '物件詳細情報の閲覧申請',
      inquiryContent: '',
      message: '1ヶ月以内（移転などの急ぎ）',
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: '【居抜きビュッフェ】メール登録がありました',
      })
    );
  });
});

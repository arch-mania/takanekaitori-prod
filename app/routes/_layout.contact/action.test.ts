import { describe, expect, it, vi } from 'vitest';
import { action } from './index';
import { saveContactForm } from '~/services/contact.server';
import { verifyRecaptcha } from '~/lib/recaptcha.server';

vi.mock('~/services/contact.server', () => ({
  saveContactForm: vi.fn(),
}));

vi.mock('~/lib/recaptcha.server', async () => {
  const actual = await vi.importActual<typeof import('~/lib/recaptcha.server')>(
    '~/lib/recaptcha.server'
  );

  return {
    ...actual,
    getClientIp: vi.fn(() => '203.0.113.1'),
    verifyRecaptcha: vi.fn(),
  };
});

const createContactRequest = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const values = {
    inquiryType: '内見希望',
    inquiryContent: '',
    name: '山田 太郎',
    phone: '090-1234-5678',
    email: 'test@example.com',
    message: '内見を希望します。',
    propertyTitle: 'テスト物件',
    propertyId: 'property-1',
    assignedAgent: '担当者',
    'g-recaptcha-response': 'recaptcha-token',
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return new Request('https://example.com/contact', {
    method: 'POST',
    body: formData,
  });
};

describe('/contact action', () => {
  it('does not send email when reCAPTCHA verification fails', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValue(false);

    const response = (await action({
      request: createContactRequest(),
      params: {},
      context: {},
    })) as Response;
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errors.recaptcha).toBe(
      'reCAPTCHA の確認に失敗しました。時間をおいて再度お試しください。'
    );
    expect(saveContactForm).not.toHaveBeenCalled();
  });

  it('sends email when validation and reCAPTCHA verification pass', async () => {
    vi.mocked(verifyRecaptcha).mockResolvedValue(true);
    vi.mocked(saveContactForm).mockResolvedValue(undefined);

    const response = (await action({
      request: createContactRequest(),
      params: {},
      context: {},
    })) as Response;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(saveContactForm).toHaveBeenCalledWith(
      expect.objectContaining({
        formKind: 'propertyInquiry',
        email: 'test@example.com',
        message: '内見を希望します。',
      })
    );
  });
});

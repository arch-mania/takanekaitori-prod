import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyRecaptcha } from './recaptcha.server';

const originalEnv = process.env;

describe('verifyRecaptcha', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it('returns false when secret is missing', async () => {
    process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: '' };

    await expect(
      verifyRecaptcha({
        token: 'token',
        expectedAction: 'property_inquiry',
      })
    ).resolves.toBe(false);
  });

  it('returns false when token is missing', async () => {
    process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: 'secret' };

    await expect(
      verifyRecaptcha({
        token: '',
        expectedAction: 'property_inquiry',
      })
    ).resolves.toBe(false);
  });

  it('returns true for a successful response with matching action and sufficient score', async () => {
    process.env = {
      ...originalEnv,
      RECAPTCHA_SECRET_KEY: 'secret',
      RECAPTCHA_SCORE_THRESHOLD: '0.5',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'property_inquiry',
          score: 0.8,
        }),
      })
    );

    await expect(
      verifyRecaptcha({
        token: 'token',
        expectedAction: 'property_inquiry',
        remoteIp: '203.0.113.1',
      })
    ).resolves.toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('returns false when action does not match', async () => {
    process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: 'secret' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'unlock_details',
          score: 0.9,
        }),
      })
    );

    await expect(
      verifyRecaptcha({
        token: 'token',
        expectedAction: 'property_inquiry',
      })
    ).resolves.toBe(false);
  });

  it('returns false when score is below threshold', async () => {
    process.env = {
      ...originalEnv,
      RECAPTCHA_SECRET_KEY: 'secret',
      RECAPTCHA_SCORE_THRESHOLD: '0.7',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          action: 'property_inquiry',
          score: 0.6,
        }),
      })
    );

    await expect(
      verifyRecaptcha({
        token: 'token',
        expectedAction: 'property_inquiry',
      })
    ).resolves.toBe(false);
  });
});

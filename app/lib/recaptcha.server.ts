const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_RECAPTCHA_SCORE_THRESHOLD = 0.5;

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
};

export const RECAPTCHA_ERROR_MESSAGE =
  'reCAPTCHA の確認に失敗しました。時間をおいて再度お試しください。';

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip');
};

export const verifyRecaptcha = async ({
  token,
  expectedAction,
  remoteIp,
}: {
  token: string;
  expectedAction: string;
  remoteIp?: string | null;
}) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret || !token) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as RecaptchaVerifyResponse;
    const threshold = Number(
      process.env.RECAPTCHA_SCORE_THRESHOLD || DEFAULT_RECAPTCHA_SCORE_THRESHOLD
    );
    const scoreThreshold = Number.isFinite(threshold)
      ? threshold
      : DEFAULT_RECAPTCHA_SCORE_THRESHOLD;

    return (
      result.success === true &&
      result.action === expectedAction &&
      typeof result.score === 'number' &&
      result.score >= scoreThreshold
    );
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
};

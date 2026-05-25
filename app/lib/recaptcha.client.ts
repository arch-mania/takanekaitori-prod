type Grecaptcha = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let recaptchaScriptPromise: Promise<void> | null = null;

export const loadRecaptchaScript = (siteKey: string) => {
  if (!siteKey || typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (recaptchaScriptPromise) {
    return recaptchaScriptPromise;
  }

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-recaptcha-v3="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('reCAPTCHA load failed')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaV3 = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('reCAPTCHA load failed')), {
      once: true,
    });

    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
};

export const getRecaptchaToken = async (siteKey: string, action: string) => {
  if (!siteKey) {
    throw new Error('reCAPTCHA site key is not configured');
  }

  await loadRecaptchaScript(siteKey);

  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA is not available');
  }

  await new Promise<void>((resolve) => {
    window.grecaptcha?.ready(resolve);
  });

  return window.grecaptcha.execute(siteKey, { action });
};

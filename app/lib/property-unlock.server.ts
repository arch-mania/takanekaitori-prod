import { createCookie } from '@remix-run/node';

const PROPERTY_UNLOCK_COOKIE_NAME = 'property_unlocks';
const PROPERTY_UNLOCK_MAX_AGE = 60 * 60 * 24 * 365; // 365日
const FALLBACK_COOKIE_SECRET = 'property-unlock-secret';

const propertyUnlockCookie = createCookie(PROPERTY_UNLOCK_COOKIE_NAME, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: PROPERTY_UNLOCK_MAX_AGE,
  secrets: [process.env.PROPERTY_UNLOCK_COOKIE_SECRET || FALLBACK_COOKIE_SECRET],
});

const normalizeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))];
};

export const getUnlockedPropertyIds = async (cookieHeader: string | null): Promise<string[]> => {
  try {
    const parsed = await propertyUnlockCookie.parse(cookieHeader);
    return normalizeIds(parsed);
  } catch {
    return [];
  }
};

export const isPropertyUnlocked = async (
  cookieHeader: string | null,
  propertyId: string
): Promise<boolean> => {
  const unlockedIds = await getUnlockedPropertyIds(cookieHeader);
  return unlockedIds.includes(propertyId);
};

export const createPropertyUnlockCookie = async (
  cookieHeader: string | null,
  propertyId: string
): Promise<string> => {
  const unlockedIds = await getUnlockedPropertyIds(cookieHeader);
  const nextIds = [...new Set([...unlockedIds, propertyId])];
  return propertyUnlockCookie.serialize(nextIds);
};

import { isbot } from 'isbot';

// SEO等で許可するBot一覧
const GOOD_BOTS = [
  'googlebot',
  'apis-google',
  'google-inspectiontool',
  'googleother',
  'bingbot',
  'msnbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'yandex',
  'facebot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'pinterestbot',
  'applebot',
];

/**
 * 悪意のあるBotの場合は403を投げる。
 * Google等の検索エンジンBotは許可する。
 */
export function guardAgainstBadBots(request: Request): void {
  const ua = request.headers.get('user-agent') || '';
  if (!isbot(ua)) return;

  const uaLower = ua.toLowerCase();
  const isGoodBot = GOOD_BOTS.some((bot) => uaLower.includes(bot));
  if (isGoodBot) return;

  console.log(`[BLOCKED BOT] ${new URL(request.url).pathname} | UA: ${ua.slice(0, 120)}`);
  throw new Response('Forbidden', { status: 403 });
}

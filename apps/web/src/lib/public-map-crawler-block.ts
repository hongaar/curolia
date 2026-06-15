/** Robots directive for maps that block crawlers while staying link-shareable. */
export const BLOCK_PUBLIC_CRAWLERS_ROBOTS =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

const CRAWLER_UA_RE =
  /bot|crawl|spider|slurp|archiver|wget|curl\/|python-requests|scrapy|headless|phantom|selenium|puppeteer|playwright|gptbot|chatgpt-user|claudebot|anthropic-ai|google-extended|bytespider|ccbot|amazonbot|applebot|bingbot|duckduckbot|facebookexternalhit|linkedinbot|meta-externalagent|perplexitybot|youbot|cohere-ai|ai2bot|diffbot|semrush|ahrefs|mj12bot|dotbot|petalbot|yandexbot|baiduspider|sogou|ia_archiver|rogerbot|embedly|quora link preview|telegrambot|discordbot|slackbot|whatsapp|preview/i;

export function mapBlocksPublicCrawlers(map: {
  is_public: boolean;
  block_public_crawlers: boolean;
}): boolean {
  return map.is_public && map.block_public_crawlers;
}

export function profileBlocksPublicCrawlers(profile: {
  is_public: boolean;
  block_public_crawlers: boolean;
}): boolean {
  return profile.is_public && profile.block_public_crawlers;
}

export function isLikelyCrawlerUserAgent(
  userAgent: string | null | undefined,
): boolean {
  const ua = userAgent?.trim();
  if (!ua) return false;
  return CRAWLER_UA_RE.test(ua);
}

export function crawlerBlockResponseHeaders(): Record<string, string> {
  return {
    "X-Robots-Tag": BLOCK_PUBLIC_CRAWLERS_ROBOTS,
    "Cache-Control": "private, no-store",
  };
}

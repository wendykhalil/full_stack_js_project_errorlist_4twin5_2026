/**
 * YouTube video service.
 *
 * Strategy (no API key required):
 *  - Build a focused search query from product name + category
 *  - Return the query so the frontend can use YouTube's search embed
 *    (youtube.com/embed?listType=search&list=QUERY) — no API key needed
 *
 * If YOUTUBE_API_KEY is set, we use the Data API v3 to get a specific videoId
 * for a cleaner embed experience.
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

// In-memory cache: productId → { data, expiresAt }
const videoCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Build a focused, construction-relevant search query.
 */
function buildSearchQuery(product) {
  const name = (product.name || '').trim();
  const category = (product.categoryId?.name || '').trim();

  // Build a query that finds "how to use" tutorials for this product
  const parts = [];
  if (name) parts.push(name);
  if (category && !name.toLowerCase().includes(category.toLowerCase())) {
    parts.push(category);
  }
  parts.push('tutoriel utilisation');

  return parts.join(' ').slice(0, 120);
}

/**
 * Search YouTube Data API v3 — only used when YOUTUBE_API_KEY is set.
 */
async function searchYouTubeAPI(query) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '1',
    relevanceLanguage: 'fr',
    safeSearch: 'strict',
    videoCategoryId: '26', // How-to & Style
    key: YOUTUBE_API_KEY,
  });

  try {
    const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[VideoService] YouTube API ${res.status}:`, body.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const item = data?.items?.[0];
    if (!item?.id?.videoId) return null;

    return {
      videoId: item.id.videoId,
      title: item.snippet?.title || query,
      thumbnail: item.snippet?.thumbnails?.medium?.url || null,
      channelTitle: item.snippet?.channelTitle || '',
    };
  } catch (err) {
    console.warn('[VideoService] YouTube API fetch failed:', err.message);
    return null;
  }
}

/**
 * Main exported function.
 *
 * Returns one of:
 *  { mode: 'embed',  videoId, title, thumbnail, channelTitle, source: 'youtube' }
 *  { mode: 'search', searchQuery, source: 'search' }   ← no API key path
 *  null  (product has no meaningful query)
 */
async function getProductVideo(product) {
  const cacheKey = String(product._id);
  const now = Date.now();

  if (videoCache.has(cacheKey)) {
    const cached = videoCache.get(cacheKey);
    if (now < cached.expiresAt) return { ...cached.data, cached: true };
    videoCache.delete(cacheKey);
  }

  const searchQuery = buildSearchQuery(product);

  if (!searchQuery.trim()) {
    videoCache.set(cacheKey, { data: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }

  let result = null;

  // Path A: YouTube Data API v3 (specific videoId)
  if (YOUTUBE_API_KEY) {
    const ytResult = await searchYouTubeAPI(searchQuery);
    if (ytResult?.videoId) {
      result = { mode: 'embed', ...ytResult, source: 'youtube' };
    }
  }

  // Path B: No API key — return the search query for frontend search-embed
  if (!result) {
    result = {
      mode: 'search',
      searchQuery,
      source: 'search',
    };
  }

  videoCache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}

module.exports = { getProductVideo };


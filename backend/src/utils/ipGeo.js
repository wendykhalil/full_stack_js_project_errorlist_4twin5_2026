const https = require('https');

// Very small cache to avoid calling the geo service for every request.
// key: ip, value: { country, countryCode, city, region, cachedAt }
const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function isPrivateOrLocal(ip) {
  if (!ip) return true;
  const v = String(ip);
  return (
    v === '::1' ||
    v === '127.0.0.1' ||
    v.startsWith('10.') ||
    v.startsWith('192.168.') ||
    v.startsWith('172.16.') ||
    v.startsWith('172.17.') ||
    v.startsWith('172.18.') ||
    v.startsWith('172.19.') ||
    v.startsWith('172.2') ||
    v.startsWith('fc') ||
    v.startsWith('fd')
  );
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function lookupIpGeo(ip) {
  if (!ip || isPrivateOrLocal(ip)) {
    return { country: 'Local', countryCode: '', city: '', region: '' };
  }

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { country: cached.country, countryCode: cached.countryCode, city: cached.city, region: cached.region };
  }

  // Free endpoint (no key). If it fails, we simply return empty values.
  // Note: if your server has no internet access, this will gracefully fail.
  try {
    const json = await getJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    const result = {
      country: json.country_name || '',
      countryCode: json.country_code || '',
      city: json.city || '',
      region: json.region || '',
    };
    cache.set(ip, { ...result, cachedAt: Date.now() });
    return result;
  } catch (_) {
    return { country: '', countryCode: '', city: '', region: '' };
  }
}

module.exports = { lookupIpGeo };

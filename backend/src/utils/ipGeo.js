const https = require('https');

const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function isPrivateOrLocal(ip) {
  if (!ip) return true;
  const v = String(ip).replace(/^::ffff:/, '');
  return (
    v === '::1' ||
    v === '127.0.0.1' ||
    v === '0.0.0.0' ||
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

async function lookupIpGeo(ip, fallback = {}) {
  if ((!ip || isPrivateOrLocal(ip)) && (fallback.country || fallback.countryCode)) {
    return {
      country: fallback.country || 'Unknown',
      countryCode: fallback.countryCode || '',
      city: '',
      region: '',
    };
  }

  if (!ip || isPrivateOrLocal(ip)) {
    return { country: 'Local', countryCode: '', city: '', region: '' };
  }

  const normalizedIp = String(ip).replace(/^::ffff:/, '');
  const cached = cache.get(normalizedIp);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { country: cached.country, countryCode: cached.countryCode, city: cached.city, region: cached.region };
  }

  const providers = [
    async () => {
      const json = await getJson(`https://ipwho.is/${encodeURIComponent(normalizedIp)}`);
      return {
        country: json.country || fallback.country || '',
        countryCode: json.country_code || fallback.countryCode || '',
        city: json.city || '',
        region: json.region || '',
      };
    },
    async () => {
      const json = await getJson(`https://ipapi.co/${encodeURIComponent(normalizedIp)}/json/`);
      return {
        country: json.country_name || fallback.country || '',
        countryCode: json.country_code || fallback.countryCode || '',
        city: json.city || '',
        region: json.region || '',
      };
    },
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result.country || result.countryCode || result.city || result.region) {
        cache.set(normalizedIp, { ...result, cachedAt: Date.now() });
        return result;
      }
    } catch (_) {}
  }

  return { country: fallback.country || '', countryCode: fallback.countryCode || '', city: '', region: '' };
}

module.exports = { lookupIpGeo, isPrivateOrLocal };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let clientMetaPromise = null;

async function tryFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
  return res.json();
}

async function resolveClientMeta() {
  if (typeof window === 'undefined') {
    return { ip: '', country: '', countryCode: '' };
  }

  const cached = window.sessionStorage.getItem('bmp_client_meta');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Ignore parsing errors and continue with fetching
    }
  }

  const sources = [
    async () => {
      const data = await tryFetchJson('https://ipwho.is/');
      return { ip: data?.ip || '', country: data?.country || '', countryCode: data?.country_code || '' };
    },
    async () => {
      const data = await tryFetchJson('https://ipapi.co/json/');
      return { ip: data?.ip || '', country: data?.country_name || '', countryCode: data?.country_code || '' };
    },
    async () => {
      const [ipData, geoData] = await Promise.all([
        tryFetchJson('https://api.ipify.org?format=json'),
        tryFetchJson('https://ipwho.is/'),
      ]);
      return { ip: ipData?.ip || geoData?.ip || '', country: geoData?.country || '', countryCode: geoData?.country_code || '' };
    },
  ];

  for (const source of sources) {
    try {
      const meta = await source();
      if (meta.ip || meta.country || meta.countryCode) {
        window.sessionStorage.setItem('bmp_client_meta', JSON.stringify(meta));
        return meta;
      }
    } catch {
      // Geo lookup failed, continue to next source
      // Intentionally empty - we want to try the next source
    }
  }

  return { ip: '', country: '', countryCode: '' };
}

async function getClientMeta() {
  if (!clientMetaPromise) clientMetaPromise = resolveClientMeta();
  return clientMetaPromise;
}

export async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const clientMeta = await getClientMeta();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(clientMeta?.ip ? { 'X-Client-IP': clientMeta.ip } : {}),
      ...(clientMeta?.country ? { 'X-Client-Country': clientMeta.country } : {}),
      ...(clientMeta?.countryCode ? { 'X-Client-Country-Code': clientMeta.countryCode } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Product API helpers for supplier & catalog
export async function getMyProducts({ token, page = 1, limit = 10, search = '', category = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  return apiFetch(`/supplier/products?${params}`, { token });
}

export async function getSupplierStats({ token }) {
  return apiFetch('/supplier/stats', { token });
}

export async function createProduct({ token, formData }) {
  return apiFetch('/supplier/products', { 
    token, 
    method: 'POST', 
    body: formData 
  });
}

export async function updateProduct({ token, id, formData }) {
  return apiFetch(`/supplier/products/${id}`, { 
    token, 
    method: 'PUT', 
    body: formData 
  });
}

export async function deleteProduct({ token, id }) {
  return apiFetch(`/supplier/products/${id}`, { 
    token, 
    method: 'DELETE' 
  });
}

export async function getCatalogProducts({ page = 1, limit = 12, search = '', category = '', approved = 'true' } = {}) {
  const params = new URLSearchParams({ page, limit, search, category, approved });
  return apiFetch(`/catalog/products?${params}`);
}

export async function getSupplierCategories({ token }) {
  return apiFetch('/supplier/categories', { token });
}


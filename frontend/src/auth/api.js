  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  export async function apiFetch(path, { token, method = 'GET', body } = {}) {
<<<<<<< HEAD
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
=======
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
>>>>>>> 647f7778898b6e789d224d02d48bccf97d15a8c9
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

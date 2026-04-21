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
      const data = await tryFetchJson('https://ipapi.co/json/');
      return { ip: data?.ip || '', country: data?.country_name || '', countryCode: data?.country_code || '' };
    },
    async () => {
      const data = await tryFetchJson('https://api.ipify.org?format=json');
      return { ip: data?.ip || '', country: '', countryCode: '' };
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

export async function getSupplierAiInsights({ token, refresh = false } = {}) {
  const params = refresh ? '?refresh=true' : '';
  return apiFetch(`/supplier/ai-insights${params}`, { token });
}

export async function postSupplierAiRetrain({ token } = {}) {
  return apiFetch('/supplier/ai-retrain', { token, method: 'POST' });
}

export async function getSupplierModelMeta({ token } = {}) {
  return apiFetch('/supplier/ai-model-meta', { token });
}

// ── Favorites ─────────────────────────────────────────────────────────────────
export async function getFavorites({ token }) {
  return apiFetch('/marketplace/favorites', { token });
}
export async function toggleFavorite({ token, productId }) {
  return apiFetch(`/marketplace/favorites/${productId}`, { token, method: 'POST' });
}
export async function removeFavorite({ token, productId }) {
  return apiFetch(`/marketplace/favorites/${productId}`, { token, method: 'DELETE' });
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export async function getCart({ token }) {
  return apiFetch('/marketplace/cart', { token });
}
export async function addToCart({ token, productId, quantity = 1 }) {
  return apiFetch('/marketplace/cart/add', { token, method: 'POST', body: { productId, quantity } });
}
export async function removeFromCart({ token, productId }) {
  return apiFetch('/marketplace/cart/remove', { token, method: 'POST', body: { productId } });
}
export async function updateCartQty({ token, productId, quantity }) {
  return apiFetch('/marketplace/cart/update-qty', { token, method: 'PATCH', body: { productId, quantity } });
}
export async function clearCart({ token }) {
  return apiFetch('/marketplace/cart', { token, method: 'DELETE' });
}
export async function checkoutCart({ token, deliveryAddress, artisanMessage = '' }) {
  return apiFetch('/marketplace/orders/from-cart', { token, method: 'POST', body: { deliveryAddress, artisanMessage } });
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

export async function getCatalogProductById({ id } = {}) {
  return apiFetch(`/catalog/products/${id}`);
}

export async function getProductRecommendations({ id } = {}) {
  return apiFetch(`/catalog/products/${id}/recommendations`);
}

export async function getProductVideo({ id } = {}) {
  return apiFetch(`/catalog/products/${id}/video`);
}

export async function rateCatalogProduct({ productId, rating, token }) {
  return apiFetch(`/catalog/products/${productId}/rate`, {
    token,
    method: 'POST',
    body: { rating }
  });
}

export async function getSupplierCategories({ token }) {
  return apiFetch('/supplier/categories', { token });
}

export async function updateUserLocation({ token, lat, lng }) {
  return apiFetch('/users/update-location', {
    token,
    method: 'POST',
    body: { lat, lng },
  });
}

export async function getMySubscription({ token }) {
  return apiFetch('/subscriptions/me', { token });
}

export async function setUserSubscription({ token, userId, plan, status }) {
  return apiFetch(`/subscriptions/${userId}/authorize`, {
    token,
    method: 'POST',
    body: { plan, status }
  });
}

// ========== ORDERS API ==========
export async function createOrder({ token, orderData }) {
  return apiFetch('/orders', {
    token,
    method: 'POST',
    body: orderData
  });
}

export async function getMyOrders({ token, page = 1, limit = 10, status = '' }) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  return apiFetch(`/orders/my-orders?${params}`, { token });
}

export async function getSupplierOrders({ token, page = 1, limit = 10, status = '' }) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  return apiFetch(`/orders/supplier?${params}`, { token });
}

export async function updateOrderStatus({ token, orderId, status, note = '' }) {
  return apiFetch(`/orders/${orderId}/status`, {
    token,
    method: 'PATCH',
    body: { status, note }
  });
}

export async function addSupplierNote({ token, orderId, note }) {
  return apiFetch(`/orders/${orderId}/note`, {
    token,
    method: 'POST',
    body: { note }
  });
}

export async function getOrderById({ token, orderId }) {
  return apiFetch(`/orders/${orderId}`, { token });
}

export async function submitOrderReview({ token, orderId, rating, comment }) {
  return apiFetch(`/orders/${orderId}/review`, {
    token,
    method: 'POST',
    body: { rating, comment },
  });
}

// ========== MESSAGES API ==========
export async function sendMessage({ token, messageData }) {
  return apiFetch('/messages', {
    token,
    method: 'POST',
    body: messageData
  });
}

export async function getOrderMessages({ token, orderId }) {
  return apiFetch(`/messages/order/${orderId}`, { token });
}

export async function markMessageAsRead({ token, messageId }) {
  return apiFetch(`/messages/${messageId}/read`, {
    token,
    method: 'PATCH'
  });
}

export async function getUnreadCount({ token }) {
  return apiFetch('/messages/unread/count', { token });
}

export async function getArtisanDashboardSummary({ token }) {
  return apiFetch('/artisan/dashboard-summary', { token });
}

export async function getAdminDashboardSummary({ token, days = 30 } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  return apiFetch(`/admin/dashboard-summary?${params.toString()}`, { token });
}

export async function getAdminAiInsights({ token, days = 30, refresh = false } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  if (refresh) params.append('refresh', 'true');
  return apiFetch(`/admin/ai-insights?${params.toString()}`, { token });
}



export async function suggestProjectWithAI({ token, payload }) {
  return apiFetch('/ai/suggest/project', {
    token,
    method: 'POST',
    body: payload,
  });
}

export async function suggestProductWithAI({ token, payload }) {
  return apiFetch('/ai/suggest/product', {
    token,
    method: 'POST',
    body: payload,
  });
}

export async function suggestQuoteFromProject({ token, projectId }) {
  return apiFetch('/ai/quote/from-project', {
    token,
    method: 'POST',
    body: { projectId },
  });
}

export async function smartSearchAI({ q, scope = 'all', limit = 8 } = {}) {
  const params = new URLSearchParams({ q, scope, limit });
  return apiFetch(`/ai/smart-search?${params}`);
}

export async function translateUiBatch({ texts, targetLang, sourceLang = 'auto' }) {
  return apiFetch('/translations/translate', {
    method: 'POST',
    body: { texts, targetLang, sourceLang },
  });
}

// ========== SERVICE REQUESTS API ==========
export async function createServiceRequest({ token, data }) {
  return apiFetch("/service-requests", { token, method: "POST", body: data });
}

export async function getMyServiceRequests({ token }) {
  return apiFetch("/service-requests/my", { token });
}

export async function getMyServiceRequest({ token, id }) {
  return apiFetch(`/service-requests/my/${id}`, { token });
}

export async function updateServiceRequest({ token, id, data }) {
  return apiFetch(`/service-requests/my/${id}`, { token, method: "PUT", body: data });
}

export async function deleteServiceRequest({ token, id }) {
  return apiFetch(`/service-requests/my/${id}`, { token, method: "DELETE" });
}

export async function changeServiceRequestStatus({ token, id, status }) {
  return apiFetch(`/service-requests/my/${id}/status`, { token, method: "PATCH", body: { status } });
}

export async function reopenServiceRequest({ token, id }) {
  return apiFetch(`/service-requests/my/${id}/reopen`, { token, method: "PATCH" });
}

export async function acceptApplication({ token, requestId, appId }) {
  return apiFetch(`/service-requests/my/${requestId}/applications/${appId}/accept`, { token, method: "PATCH" });
}

export async function rejectApplication({ token, requestId, appId }) {
  return apiFetch(`/service-requests/my/${requestId}/applications/${appId}/reject`, { token, method: "PATCH" });
}

export async function getOpenServiceRequests({ token, trade, city, page = 1, limit = 10 }) {
  const params = new URLSearchParams({ page, limit });
  if (trade) params.append("trade", trade);
  if (city) params.append("city", city);
  return apiFetch(`/service-requests/open?${params}`, { token });
}
export async function getOpenServiceRequest({ token, id }) {
  return apiFetch(`/service-requests/open/${id}`, { token });
}

export async function applyToServiceRequest({ token, id, message, proposedPrice }) {
  return apiFetch(`/service-requests/${id}/apply`, { token, method: "POST", body: { message, proposedPrice } });
}

export async function withdrawApplication({ token, id }) {
  return apiFetch(`/service-requests/${id}/apply`, { token, method: "DELETE" });
}

export async function getMyApplications({ token }) {
  return apiFetch("/service-requests/my-applications", { token });
}

export async function getArtisanAvailability({ artisanId, month } = {}) {
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  return apiFetch(`/availability/artisan/${artisanId}?${params}`);
}

// ========== REVIEWS API ==========
export async function submitReview({ token, data }) {
  return apiFetch("/reviews", { token, method: "POST", body: data });
}

export async function getReviewsForUser({ userId }) {
  return apiFetch(`/reviews/user/${userId}`);
}

export async function getPendingReviews({ token }) {
  return apiFetch("/reviews/pending", { token });
}

export async function deleteReview({ token, id }) {
  return apiFetch(`/reviews/${id}`, { token, method: "DELETE" });
}

// ========== PROMO CODES API ==========
export async function validatePromoCode({ token, code, plan }) {
  return apiFetch("/promo/validate", { token, method: "POST", body: { code, plan } });
}

export async function getPromoCodes({ token }) {
  return apiFetch("/promo", { token });
}

export async function createPromoCode({ token, data }) {
  return apiFetch("/promo", { token, method: "POST", body: data });
}

export async function updatePromoCode({ token, id, data }) {
  return apiFetch(`/promo/${id}`, { token, method: "PATCH", body: data });
}

export async function deletePromoCode({ token, id }) {
  return apiFetch(`/promo/${id}`, { token, method: "DELETE" });
}

// ========== SUBSCRIPTION EXTRAS ==========
export async function cancelSubscription({ token }) {
  return apiFetch('/subscriptions/cancel', { token, method: 'POST' });
}

export async function startTrial({ token }) {
  return apiFetch('/subscriptions/trial', { token, method: 'POST' });
}

// ========== NOTIFICATIONS API ==========
export async function getNotifications({ token, page = 1, limit = 20 }) {
  return apiFetch(`/notifications?page=${page}&limit=${limit}`, { token });
}

export async function getUnreadNotifCount({ token }) {
  return apiFetch('/notifications/unread-count', { token });
}

export async function markNotificationRead({ token, id }) {
  return apiFetch(`/notifications/${id}/read`, { token, method: 'PATCH' });
}

export async function markAllNotificationsRead({ token }) {
  return apiFetch('/notifications/read-all', { token, method: 'PATCH' });
}

export async function deleteNotification({ token, id }) {
  return apiFetch(`/notifications/${id}`, { token, method: 'DELETE' });
}

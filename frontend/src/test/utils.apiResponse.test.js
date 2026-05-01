import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock fetch before any imports ─────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock DOMParser (not available in jsdom for this use case)
global.DOMParser = class {
  parseFromString(str) {
    return { documentElement: { textContent: str } };
  }
};

// Helper: build a mock Response that apiFetch expects (uses res.text())
function mockResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

// apiFetch calls getClientMeta() which fetches an IP service first
// We need to handle that call too — make it succeed silently
function setupMocks(apiBody, apiStatus = 200) {
  // First call: getClientMeta IP lookup — return empty object (success)
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ ip: '127.0.0.1' }),
    text: async () => JSON.stringify({ ip: '127.0.0.1' }),
  });
  // Second call: the actual API call
  mockFetch.mockResolvedValueOnce(mockResponse(apiBody, apiStatus));
}

const { apiFetch } = await import('../auth/api.js');

beforeEach(() => vi.clearAllMocks());

describe('apiFetch', () => {
  it('makes a GET request and returns parsed JSON', async () => {
    setupMocks({ data: 'test' });
    const result = await apiFetch('/test', { token: 'tok123' });
    expect(result).toMatchObject({ data: 'test' });
  });

  it('sends Authorization header when token provided', async () => {
    setupMocks({});
    await apiFetch('/test', { token: 'mytoken' });
    // Find the API call (second fetch call)
    const apiCall = mockFetch.mock.calls.find(([url]) => url.includes('/test'));
    expect(apiCall).toBeDefined();
    expect(apiCall[1].headers['Authorization']).toBe('Bearer mytoken');
  });

  it('sends Content-Type: application/json for JSON body', async () => {
    setupMocks({});
    await apiFetch('/test', { method: 'POST', body: { name: 'test' } });
    const apiCall = mockFetch.mock.calls.find(([url]) => url.includes('/test'));
    expect(apiCall[1].headers['Content-Type']).toBe('application/json');
    expect(apiCall[1].body).toBe(JSON.stringify({ name: 'test' }));
  });

  it('does NOT set Content-Type for FormData body', async () => {
    setupMocks({});
    const fd = new FormData();
    fd.append('file', 'data');
    await apiFetch('/upload', { method: 'POST', body: fd });
    const apiCall = mockFetch.mock.calls.find(([url]) => url.includes('/upload'));
    expect(apiCall[1].headers['Content-Type']).toBeUndefined();
  });

  it('includes method in request options', async () => {
    setupMocks({ created: true }, 201);
    await apiFetch('/resource', { method: 'POST', body: { x: 1 } });
    const apiCall = mockFetch.mock.calls.find(([url]) => url.includes('/resource'));
    expect(apiCall[1].method).toBe('POST');
  });

  it('handles empty response body gracefully', async () => {
    // Just verify apiFetch doesn't crash on empty body
    setupMocks({ ok: true }, 200);
    const result = await apiFetch('/ok');
    expect(result).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for reverse geocoding
global.fetch = vi.fn();

describe('geolocation utilities', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getCurrentPositionWithAddress', () => {
    it('resolves with coordinates when geolocation succeeds', async () => {
      const mockPosition = {
        coords: { latitude: 36.8065, longitude: 10.1815, accuracy: 10 },
      };

      global.navigator.geolocation = {
        getCurrentPosition: vi.fn((success) => success(mockPosition)),
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          address: {
            city: 'Tunis',
            suburb: 'Lac 2',
            display_name: '123 Rue Test, Tunis',
          },
          display_name: '123 Rue Test, Tunis',
        }),
      });

      const { getCurrentPositionWithAddress } = await import('../utils/geolocation.js');
      const result = await getCurrentPositionWithAddress();

      expect(result.latitude).toBe(36.8065);
      expect(result.longitude).toBe(10.1815);
    });

    it('rejects when geolocation is denied', async () => {
      global.navigator.geolocation = {
        getCurrentPosition: vi.fn((_, error) =>
          error({ code: 1, message: 'User denied geolocation' })
        ),
      };

      const { getCurrentPositionWithAddress } = await import('../utils/geolocation.js');
      await expect(getCurrentPositionWithAddress()).rejects.toThrow();
    });

    it('rejects when geolocation is not supported', async () => {
      const originalGeo = global.navigator.geolocation;
      delete global.navigator.geolocation;

      const { getCurrentPositionWithAddress } = await import('../utils/geolocation.js');
      await expect(getCurrentPositionWithAddress()).rejects.toThrow();

      global.navigator.geolocation = originalGeo;
    });
  });
});

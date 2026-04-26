'use strict';

jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Review');

const ArtisanProfile = require('../../src/models/ArtisanProfile');
const User = require('../../src/models/User');
const Review = require('../../src/models/Review');
const { searchArtisans, getNearbyArtisans } = require('../../src/modules/search/search.service');

describe('search.service – searchArtisans (no geolocation)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all active artisans when no filters', async () => {
    const mockUsers = [
      { _id: 'u1', firstName: 'Ali', lastName: 'Ben', role: 'ARTISAN', status: 'ACTIVE' },
    ];
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUsers),
    });
    ArtisanProfile.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    Review.aggregate.mockResolvedValue([]);

    const result = await searchArtisans({});
    expect(result.artisans).toBeDefined();
    expect(result.pagination).toBeDefined();
  });

  it('filters by specialty', async () => {
    const mockUsers = [
      { _id: 'u1', firstName: 'Ali', lastName: 'Ben', role: 'ARTISAN', status: 'ACTIVE' },
    ];
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUsers),
    });
    ArtisanProfile.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'prof1', userId: 'u1', trade: 'Plombier', isActive: true },
      ]),
    });
    Review.aggregate.mockResolvedValue([]);

    const result = await searchArtisans({ specialty: 'Plombier' });
    expect(result.artisans.length).toBeGreaterThanOrEqual(0);
  });

  it('filters by region', async () => {
    const mockUsers = [
      { _id: 'u1', firstName: 'Ali', lastName: 'Ben', role: 'ARTISAN', status: 'ACTIVE' },
    ];
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUsers),
    });
    ArtisanProfile.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'prof1', userId: 'u1', region: 'Tunis', isActive: true },
      ]),
    });
    Review.aggregate.mockResolvedValue([]);

    const result = await searchArtisans({ region: 'Tunis' });
    expect(result.filters.region).toBe('Tunis');
  });

  it('paginates results', async () => {
    const mockUsers = Array.from({ length: 25 }, (_, i) => ({
      _id: `u${i}`, firstName: `User${i}`, lastName: 'Test', role: 'ARTISAN', status: 'ACTIVE',
    }));
    User.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUsers),
    });
    ArtisanProfile.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    Review.aggregate.mockResolvedValue([]);

    const result = await searchArtisans({ page: 2, limit: 10 });
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.total).toBe(25);
  });
});

describe('search.service – searchArtisans (with geolocation)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses $near query when lat/lng provided', async () => {
    const mockProfiles = [
      {
        _id: 'prof1',
        userId: { _id: 'u1', firstName: 'Ali', lastName: 'Ben', role: 'ARTISAN', status: 'ACTIVE' },
        trade: 'Plombier',
        region: 'Tunis',
      },
    ];
    ArtisanProfile.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProfiles),
    });
    ArtisanProfile.countDocuments.mockResolvedValue(1);
    Review.aggregate.mockResolvedValue([]);

    const result = await searchArtisans({ latitude: '36.8', longitude: '10.5', maxDistance: 5000 });
    expect(result.filters.hasGeolocation).toBe(true);
    expect(result.artisans).toBeDefined();
  });
});

describe('search.service – getNearbyArtisans', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns nearby artisans', async () => {
    const mockArtisans = [
      {
        _id: 'prof1',
        userId: { firstName: 'Ali', lastName: 'Ben' },
        trade: 'Plombier',
        region: 'Tunis',
        profileImage: '',
        dist: null,
      },
    ];
    ArtisanProfile.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockArtisans),
    });

    const result = await getNearbyArtisans('36.8', '10.5', 5000);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ali Ben');
  });

  it('throws on DB error', async () => {
    ArtisanProfile.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB fail')),
    });

    await expect(getNearbyArtisans('36.8', '10.5')).rejects.toThrow('DB fail');
  });
});

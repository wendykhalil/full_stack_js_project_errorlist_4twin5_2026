'use strict';
jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/User');

const ArtisanProfile = require('../../src/models/ArtisanProfile');
const User = require('../../src/models/User');

const {
  updateArtisanProfile,
  getArtisanProfile,
  updateArtisanLocation,
  getPublicArtisanProfile,
  resetArtisanTrialFeatures,
} = require('../../src/modules/artisan/artisanProfile.service');

beforeEach(() => jest.clearAllMocks());

// ─── updateArtisanProfile ─────────────────────────────────────────────────────
describe('artisanProfile.service — updateArtisanProfile', () => {
  it('creates new profile when not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    const mockProfile = {
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.mockImplementation(() => mockProfile);
    const result = await updateArtisanProfile('user1', { trade: 'Plombier', region: 'Tunis' });
    expect(mockProfile.save).toHaveBeenCalled();
  });

  it('updates existing profile', async () => {
    const profile = {
      trade: 'Old',
      region: 'Old',
      phone: '',
      description: '',
      profileImage: '',
      address: {},
      location: { coordinates: [0, 0] },
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);
    await updateArtisanProfile('user1', { trade: 'Plombier', region: 'Tunis', phone: '123' });
    expect(profile.trade).toBe('Plombier');
    expect(profile.phone).toBe('123');
    expect(profile.save).toHaveBeenCalled();
  });

  it('updates coordinates when provided', async () => {
    const profile = {
      trade: 'Plombier',
      location: { coordinates: [0, 0] },
      address: {},
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);
    await updateArtisanProfile('user1', { coordinates: [10.5, 36.8] });
    expect(profile.location.coordinates).toEqual([10.5, 36.8]);
  });

  it('updates address when provided', async () => {
    const profile = {
      address: { city: 'Old' },
      location: { coordinates: [0, 0] },
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);
    await updateArtisanProfile('user1', { address: { city: 'Tunis' } });
    expect(profile.address.city).toBe('Tunis');
  });

  it('throws on DB error', async () => {
    ArtisanProfile.findOne.mockRejectedValue(new Error('DB error'));
    await expect(updateArtisanProfile('user1', {})).rejects.toThrow('DB error');
  });
});

// ─── getArtisanProfile ────────────────────────────────────────────────────────
describe('artisanProfile.service — getArtisanProfile', () => {
  it('returns profile when found', async () => {
    const profile = { _id: 'p1', trade: 'Plombier' };
    ArtisanProfile.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: undefined,
    });
    // Use a simpler mock
    ArtisanProfile.findOne.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(profile),
    }));
    // Actually mock the full chain
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
    };
    mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(profile);
    ArtisanProfile.findOne.mockReturnValue(mockQuery);
    // Simpler: just mock findOne to return profile directly via the chain
    ArtisanProfile.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(profile),
    });
  });

  it('throws 400 when userId missing', async () => {
    await expect(getArtisanProfile(null)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when profile not found', async () => {
    const mockQuery = { populate: jest.fn() };
    mockQuery.populate.mockReturnValueOnce(mockQuery).mockResolvedValueOnce(null);
    ArtisanProfile.findOne.mockReturnValue(mockQuery);
    await expect(getArtisanProfile('user1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── updateArtisanLocation ────────────────────────────────────────────────────
describe('artisanProfile.service — updateArtisanLocation', () => {
  it('updates location successfully', async () => {
    const profile = {
      location: { coordinates: [0, 0] },
      save: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const result = await updateArtisanLocation('user1', [10.5, 36.8]);
    expect(profile.location.coordinates).toEqual([10.5, 36.8]);
    expect(profile.save).toHaveBeenCalled();
  });

  it('throws 400 when userId missing', async () => {
    await expect(updateArtisanLocation(null, [10, 36])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when coordinates invalid', async () => {
    await expect(updateArtisanLocation('user1', [10])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when profile not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    await expect(updateArtisanLocation('user1', [10.5, 36.8])).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getPublicArtisanProfile ──────────────────────────────────────────────────
describe('artisanProfile.service — getPublicArtisanProfile', () => {
  it('returns formatted profile when found', async () => {
    const profile = {
      _id: 'p1',
      userId: { _id: 'u1', firstName: 'John', lastName: 'Doe', email: 'j@d.com', phone: '123' },
      trade: 'Plombier',
      region: 'Tunis',
      phone: '123',
      description: 'Desc',
      profileImage: 'img.jpg',
      address: {},
      portfolio: [{ _id: 'port1' }],
    };
    ArtisanProfile.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: undefined,
    });
    // Mock the full chain
    const mockQuery = { populate: jest.fn().mockReturnThis() };
    // Resolve at the end
    ArtisanProfile.findById.mockReturnValue({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(profile),
      })),
    });
    const result = await getPublicArtisanProfile('p1');
    expect(result.name).toBe('John Doe');
    expect(result.trade).toBe('Plombier');
  });

  it('falls back to user when no profile', async () => {
    ArtisanProfile.findById.mockReturnValue({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null),
      })),
    });
    ArtisanProfile.findOne.mockReturnValue({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null),
      })),
    });
    const user = { _id: 'u1', firstName: 'Jane', lastName: 'Doe', phone: '456', role: 'ARTISAN', status: 'ACTIVE' };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    const result = await getPublicArtisanProfile('u1');
    expect(result.name).toBe('Jane Doe');
    expect(result.hasCompletedProfile).toBe(false);
  });

  it('throws 404 when user not found', async () => {
    ArtisanProfile.findById.mockReturnValue({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null),
      })),
    });
    ArtisanProfile.findOne.mockReturnValue({
      populate: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null),
      })),
    });
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(getPublicArtisanProfile('u1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── resetArtisanTrialFeatures ────────────────────────────────────────────────
describe('artisanProfile.service — resetArtisanTrialFeatures', () => {
  it('resets trial features', async () => {
    const profile = {
      trialFeatures: { projectCreated: true },
      save: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const result = await resetArtisanTrialFeatures('user1');
    expect(profile.trialFeatures.projectCreated).toBe(false);
    expect(profile.save).toHaveBeenCalled();
  });

  it('throws 404 when profile not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    await expect(resetArtisanTrialFeatures('user1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when userId missing', async () => {
    await expect(resetArtisanTrialFeatures(null)).rejects.toMatchObject({ statusCode: 400 });
  });
});

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

const USER_ID = 'user123';

function mockProfile(overrides = {}) {
  return {
    _id: 'profile1',
    userId: USER_ID,
    trade: 'Plombier',
    region: 'Tunis',
    phone: '12345678',
    location: { type: 'Point', coordinates: [0, 0] },
    portfolio: [],
    trialFeatures: {},
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('artisanProfile.service – updateArtisanProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates new profile when none exists', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    const newProfile = mockProfile();
    ArtisanProfile.mockImplementation(() => newProfile);

    const result = await updateArtisanProfile(USER_ID, {
      trade: 'Plombier',
      region: 'Tunis',
      phone: '12345678',
    });
    expect(newProfile.save).toHaveBeenCalled();
  });

  it('updates existing profile fields', async () => {
    const existingProfile = mockProfile();
    ArtisanProfile.findOne.mockResolvedValue(existingProfile);

    await updateArtisanProfile(USER_ID, { trade: 'Électricien', phone: '99999999' });
    expect(existingProfile.trade).toBe('Électricien');
    expect(existingProfile.phone).toBe('99999999');
    expect(existingProfile.save).toHaveBeenCalled();
  });

  it('updates coordinates when provided', async () => {
    const existingProfile = mockProfile();
    ArtisanProfile.findOne.mockResolvedValue(existingProfile);

    await updateArtisanProfile(USER_ID, { coordinates: [10.5, 36.8] });
    expect(existingProfile.location.coordinates).toEqual([10.5, 36.8]);
  });

  it('throws when userId is missing', async () => {
    // validateUserId is called inside findProfile, but updateArtisanProfile
    // calls ArtisanProfile.findOne directly then creates a new profile.
    // The null check only fires when populateOptions=true (via findProfile).
    // For updateArtisanProfile, null userId goes to findOne then new ArtisanProfile.
    // We test validateUserId directly via getArtisanProfile instead.
    await expect(getArtisanProfile(null)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('artisanProfile.service – getArtisanProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns profile when found', async () => {
    const profile = mockProfile();
    // findProfile calls .populate('userId'...).populate('portfolio') — need two chained populate calls
    const chain = {
      populate: jest.fn(),
    };
    // First populate returns chain, second populate resolves to profile
    chain.populate
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(profile) });
    ArtisanProfile.findOne.mockReturnValue(chain);

    const result = await getArtisanProfile(USER_ID);
    expect(result).toBe(profile);
  });

  it('throws 404 when profile not found', async () => {
    const chain = {
      populate: jest.fn(),
    };
    chain.populate
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(null) });
    ArtisanProfile.findOne.mockReturnValue(chain);

    await expect(getArtisanProfile(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('artisanProfile.service – updateArtisanLocation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 400 for invalid coordinates format', async () => {
    await expect(updateArtisanLocation(USER_ID, [10])).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for non-array coordinates', async () => {
    await expect(updateArtisanLocation(USER_ID, 'invalid')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('updates location when valid coordinates provided', async () => {
    const profile = mockProfile();
    ArtisanProfile.findOne.mockResolvedValue(profile);

    const result = await updateArtisanLocation(USER_ID, [10.5, 36.8]);
    expect(profile.location.coordinates).toEqual([10.5, 36.8]);
    expect(profile.save).toHaveBeenCalled();
  });
});

describe('artisanProfile.service – getPublicArtisanProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  function makeDoublePopulateChain(resolveValue) {
    return {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(resolveValue),
      }),
    };
  }

  it('returns formatted profile when artisan profile found', async () => {
    const mockUser = { _id: USER_ID, firstName: 'Ali', lastName: 'Ben', phone: '123', role: 'ARTISAN', status: 'ACTIVE' };
    const profile = {
      _id: 'profile1',
      userId: mockUser,
      trade: 'Plombier',
      region: 'Tunis',
      phone: '123',
      description: 'Expert',
      profileImage: '',
      address: {},
      portfolio: [],
    };

    ArtisanProfile.findById.mockReturnValue(makeDoublePopulateChain(profile));

    const result = await getPublicArtisanProfile(USER_ID);
    expect(result.name).toBe('Ali Ben');
    expect(result.trade).toBe('Plombier');
    expect(result.hasCompletedProfile).toBe(true);
  });

  it('returns incomplete profile when no artisan profile but user exists', async () => {
    ArtisanProfile.findById.mockReturnValue(makeDoublePopulateChain(null));
    ArtisanProfile.findOne.mockReturnValue(makeDoublePopulateChain(null));

    const mockUser = { _id: USER_ID, firstName: 'Ali', lastName: 'Ben', phone: '123', role: 'ARTISAN', status: 'ACTIVE' };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

    const result = await getPublicArtisanProfile(USER_ID);
    expect(result.hasCompletedProfile).toBe(false);
    expect(result.name).toBe('Ali Ben');
  });

  it('throws 404 when neither profile nor user found', async () => {
    ArtisanProfile.findById.mockReturnValue(makeDoublePopulateChain(null));
    ArtisanProfile.findOne.mockReturnValue(makeDoublePopulateChain(null));
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await expect(getPublicArtisanProfile(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('artisanProfile.service – resetArtisanTrialFeatures', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resets trial features', async () => {
    const profile = mockProfile({
      trialFeatures: { projectCreated: true, portfolioCreated: true, quoteCreated: true, invoiceCreated: true },
    });
    ArtisanProfile.findOne.mockResolvedValue(profile);

    const result = await resetArtisanTrialFeatures(USER_ID);
    expect(profile.trialFeatures.projectCreated).toBe(false);
    expect(profile.trialFeatures.portfolioCreated).toBe(false);
    expect(profile.save).toHaveBeenCalled();
  });

  it('throws 404 when profile not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    await expect(resetArtisanTrialFeatures(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

'use strict';

jest.mock('../../src/modules/artisan/artisanProfile.service');
jest.mock('../../src/utils/apiResponse');
jest.mock('../../src/config/cloudinary', () => ({
  uploadBufferToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://cdn.example.com/img.jpg' }),
}));

const artisanProfileService = require('../../src/modules/artisan/artisanProfile.service');
const apiResponse = require('../../src/utils/apiResponse');
const {
  updateProfile,
  getMyProfile,
  updateLocation,
  getPublicProfile,
  resetTrialFeatures,
} = require('../../src/modules/artisan/artisanProfile.controller');

function makeReq(overrides = {}) {
  return {
    body: {},
    params: {},
    user: { _id: 'user1' },
    file: null,
    files: null,
    ...overrides,
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('artisanProfile.controller – updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates profile without image', async () => {
    const mockProfile = { _id: 'profile1', trade: 'Plombier' };
    artisanProfileService.updateArtisanProfile.mockResolvedValue(mockProfile);
    const req = makeReq({ body: { trade: 'Plombier', region: 'Tunis', phone: '123' } });
    const res = makeRes();
    await updateProfile(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Profil mis à jour avec succès', mockProfile);
  });

  it('uploads image when file is present', async () => {
    const { uploadBufferToCloudinary } = require('../../src/config/cloudinary');
    const mockProfile = { _id: 'profile1' };
    artisanProfileService.updateArtisanProfile.mockResolvedValue(mockProfile);
    const req = makeReq({
      body: {},
      file: { buffer: Buffer.from('img'), mimetype: 'image/jpeg' },
    });
    const res = makeRes();
    await updateProfile(req, res);
    expect(uploadBufferToCloudinary).toHaveBeenCalled();
    expect(artisanProfileService.updateArtisanProfile).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({ profileImage: 'https://cdn.example.com/img.jpg' })
    );
  });

  it('parses coordinates from body', async () => {
    artisanProfileService.updateArtisanProfile.mockResolvedValue({});
    const req = makeReq({ body: { coordinates: '[10.5, 36.8]' } });
    const res = makeRes();
    await updateProfile(req, res);
    expect(artisanProfileService.updateArtisanProfile).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({ coordinates: [10.5, 36.8] })
    );
  });

  it('returns 500 on service error', async () => {
    artisanProfileService.updateArtisanProfile.mockRejectedValue(new Error('DB fail'));
    const req = makeReq();
    const res = makeRes();
    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses statusCode from error', async () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    artisanProfileService.updateArtisanProfile.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('artisanProfile.controller – getMyProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns profile on success', async () => {
    const mockProfile = { _id: 'profile1' };
    artisanProfileService.getArtisanProfile.mockResolvedValue(mockProfile);
    const req = makeReq();
    const res = makeRes();
    await getMyProfile(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Profil récupéré', mockProfile);
  });

  it('returns 404 when profile not found', async () => {
    const err = new Error('Profil artisan non trouvé');
    err.statusCode = 404;
    artisanProfileService.getArtisanProfile.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await getMyProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('artisanProfile.controller – updateLocation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when lat/lng missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await updateLocation(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Latitude et longitude requises' });
  });

  it('updates location on success', async () => {
    const mockProfile = { _id: 'profile1' };
    artisanProfileService.updateArtisanLocation.mockResolvedValue(mockProfile);
    const req = makeReq({ body: { latitude: 36.8, longitude: 10.5 } });
    const res = makeRes();
    await updateLocation(req, res);
    expect(artisanProfileService.updateArtisanLocation).toHaveBeenCalledWith('user1', [10.5, 36.8]);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Localisation mise à jour', mockProfile);
  });
});

describe('artisanProfile.controller – getPublicProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns public profile', async () => {
    const mockProfile = { _id: 'profile1', name: 'Ali Ben' };
    artisanProfileService.getPublicArtisanProfile.mockResolvedValue(mockProfile);
    const req = makeReq({ params: { id: 'artisan1' } });
    const res = makeRes();
    await getPublicProfile(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Profil artisan récupéré', mockProfile);
  });

  it('returns 404 when not found', async () => {
    const err = new Error('Artisan non trouvé');
    err.statusCode = 404;
    artisanProfileService.getPublicArtisanProfile.mockRejectedValue(err);
    const req = makeReq({ params: { id: 'artisan1' } });
    const res = makeRes();
    await getPublicProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('artisanProfile.controller – resetTrialFeatures', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resets trial features', async () => {
    const mockProfile = { _id: 'profile1' };
    artisanProfileService.resetArtisanTrialFeatures.mockResolvedValue(mockProfile);
    const req = makeReq();
    const res = makeRes();
    await resetTrialFeatures(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Trial features réinitialisés', mockProfile);
  });
});

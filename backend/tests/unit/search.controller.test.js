'use strict';

jest.mock('../../src/modules/search/search.service');
jest.mock('../../src/utils/apiResponse');

const searchService = require('../../src/modules/search/search.service');
const apiResponse = require('../../src/utils/apiResponse');
const { searchArtisans, getNearbyArtisans } = require('../../src/modules/search/search.controller');

function makeReq(overrides = {}) {
  return { query: {}, params: {}, ...overrides };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('search.controller – searchArtisans', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns results on success', async () => {
    const mockResults = { artisans: [], pagination: {} };
    searchService.searchArtisans.mockResolvedValue(mockResults);
    const req = makeReq({ query: { specialty: 'Plombier', region: 'Tunis' } });
    const res = makeRes();
    await searchArtisans(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Recherche effectuée avec succès', mockResults);
  });

  it('converts distance from km to meters', async () => {
    searchService.searchArtisans.mockResolvedValue({ artisans: [], pagination: {} });
    const req = makeReq({ query: { lat: '36.8', lng: '10.5', distance: '10' } });
    const res = makeRes();
    await searchArtisans(req, res);
    expect(searchService.searchArtisans).toHaveBeenCalledWith(
      expect.objectContaining({ maxDistance: 10000 })
    );
  });

  it('uses default 20km when no distance provided', async () => {
    searchService.searchArtisans.mockResolvedValue({ artisans: [], pagination: {} });
    const req = makeReq({ query: {} });
    const res = makeRes();
    await searchArtisans(req, res);
    expect(searchService.searchArtisans).toHaveBeenCalledWith(
      expect.objectContaining({ maxDistance: 20000 })
    );
  });

  it('returns 500 on service error', async () => {
    searchService.searchArtisans.mockRejectedValue(new Error('DB fail'));
    const req = makeReq();
    const res = makeRes();
    await searchArtisans(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses statusCode from error', async () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    searchService.searchArtisans.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await searchArtisans(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('search.controller – getNearbyArtisans', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when lat/lng missing', async () => {
    const req = makeReq({ query: {} });
    const res = makeRes();
    await getNearbyArtisans(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Latitude et longitude requises' });
  });

  it('returns nearby artisans on success', async () => {
    const mockArtisans = [{ _id: 'a1', name: 'Ali' }];
    searchService.getNearbyArtisans.mockResolvedValue(mockArtisans);
    const req = makeReq({ query: { lat: '36.8', lng: '10.5', distance: '5' } });
    const res = makeRes();
    await getNearbyArtisans(req, res);
    expect(searchService.getNearbyArtisans).toHaveBeenCalledWith('36.8', '10.5', 5000);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Artisans proches récupérés', mockArtisans);
  });

  it('returns 500 on service error', async () => {
    searchService.getNearbyArtisans.mockRejectedValue(new Error('fail'));
    const req = makeReq({ query: { lat: '36.8', lng: '10.5' } });
    const res = makeRes();
    await getNearbyArtisans(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

'use strict';

jest.mock('../../src/modules/artisan/portfolio.service');
jest.mock('../../src/utils/apiResponse');
jest.mock('../../src/models/Portfolio', () => ({
  find: jest.fn(),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
}));
jest.mock('../../src/config/cloudinary', () => ({
  uploadBufferToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://cdn.example.com/img.jpg' }),
}));

const portfolioService = require('../../src/modules/artisan/portfolio.service');
const apiResponse = require('../../src/utils/apiResponse');
const Portfolio = require('../../src/models/Portfolio');
const {
  addProject,
  getMyPortfolio,
  getPublicPortfolio,
  getProject,
  updateProject,
  deleteProject,
} = require('../../src/modules/artisan/portfolio.controller');

function makeReq(overrides = {}) {
  return {
    body: {},
    params: {},
    files: [],
    user: { _id: 'user1' },
    isTrialAttempt: false,
    ...overrides,
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('portfolio.controller – addProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds project and returns 201', async () => {
    const mockProject = { _id: 'proj1', title: 'Test' };
    portfolioService.addPortfolioProject.mockResolvedValue(mockProject);
    const req = makeReq({ body: { title: 'Test', description: 'Desc', location: 'Tunis', date: '2024-01-01' } });
    const res = makeRes();
    await addProject(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockProject }));
  });

  it('includes trialInfo when isTrialAttempt is true', async () => {
    portfolioService.addPortfolioProject.mockResolvedValue({ _id: 'proj1' });
    const req = makeReq({ isTrialAttempt: true });
    const res = makeRes();
    await addProject(req, res);
    const call = res.json.mock.calls[0][0];
    expect(call.trialInfo).toBeDefined();
    expect(call.trialInfo.isTrialAttempt).toBe(true);
  });

  it('returns 500 on service error', async () => {
    portfolioService.addPortfolioProject.mockRejectedValue(new Error('fail'));
    const req = makeReq();
    const res = makeRes();
    await addProject(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses statusCode from error', async () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    portfolioService.addPortfolioProject.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await addProject(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('portfolio.controller – getMyPortfolio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns portfolio on success', async () => {
    portfolioService.getArtisanPortfolio.mockResolvedValue([{ _id: 'proj1' }]);
    const req = makeReq();
    const res = makeRes();
    await getMyPortfolio(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Portfolio récupéré', [{ _id: 'proj1' }]);
  });

  it('returns 404 on not found error', async () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    portfolioService.getArtisanPortfolio.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await getMyPortfolio(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('portfolio.controller – getPublicPortfolio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns public portfolio', async () => {
    const mockProjects = [{ _id: 'proj1', isPublic: true }];
    Portfolio.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockProjects) });
    const req = makeReq({ params: { artisanId: 'artisan1' } });
    const res = makeRes();
    await getPublicPortfolio(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Portfolio récupéré', mockProjects);
  });

  it('returns 500 on error', async () => {
    Portfolio.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('fail')) });
    const req = makeReq({ params: { artisanId: 'artisan1' } });
    const res = makeRes();
    await getPublicPortfolio(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('portfolio.controller – getProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns project on success', async () => {
    const mockProject = { _id: 'proj1' };
    portfolioService.getProjectById.mockResolvedValue(mockProject);
    const req = makeReq({ params: { id: 'proj1' } });
    const res = makeRes();
    await getProject(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Projet récupéré', mockProject);
  });

  it('returns 403 on unauthorized', async () => {
    const err = new Error('Non autorisé');
    err.statusCode = 403;
    portfolioService.getProjectById.mockRejectedValue(err);
    const req = makeReq({ params: { id: 'proj1' } });
    const res = makeRes();
    await getProject(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('portfolio.controller – deleteProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes project and returns message', async () => {
    portfolioService.deleteProject.mockResolvedValue({ message: 'Projet supprimé avec succès' });
    const req = makeReq({ params: { id: 'proj1' } });
    const res = makeRes();
    await deleteProject(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Projet supprimé avec succès');
  });
});

'use strict';

jest.mock('../../src/models/Portfolio');
jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/User');

const Portfolio = require('../../src/models/Portfolio');
const ArtisanProfile = require('../../src/models/ArtisanProfile');
const User = require('../../src/models/User');

// portfolio.service calls fixPortfolioVisibility() on load — mock Portfolio.updateMany
Portfolio.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });

const {
  addPortfolioProject,
  getArtisanPortfolio,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../../src/modules/artisan/portfolio.service');

const ARTISAN_ID = 'artisan1';
const PROJECT_ID = 'project1';

function mockProfile(overrides = {}) {
  return {
    _id: 'profile1',
    userId: ARTISAN_ID,
    portfolio: [],
    totalProjects: 0,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function mockProject(overrides = {}) {
  return {
    _id: PROJECT_ID,
    artisanId: 'profile1',
    title: 'Test Project',
    save: jest.fn().mockResolvedValue(true),
    toString: () => 'profile1',
    ...overrides,
  };
}

describe('portfolio.service – addPortfolioProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates project when profile exists', async () => {
    const profile = mockProfile();
    ArtisanProfile.findOne.mockResolvedValue(profile);

    const project = mockProject();
    Portfolio.mockImplementation(() => project);

    const result = await addPortfolioProject(ARTISAN_ID, {
      title: 'Test',
      description: 'Desc',
      location: 'Tunis',
      date: new Date(),
      tags: 'tag1,tag2',
    }, ['img1.jpg']);

    expect(project.save).toHaveBeenCalled();
    expect(profile.portfolio).toContain(PROJECT_ID);
    expect(profile.save).toHaveBeenCalled();
  });

  it('creates profile automatically when not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    const mockUser = { _id: ARTISAN_ID, phone: '123' };
    User.findById.mockResolvedValue(mockUser);

    const newProfile = mockProfile();
    ArtisanProfile.mockImplementation(() => newProfile);

    const project = mockProject();
    Portfolio.mockImplementation(() => project);

    await addPortfolioProject(ARTISAN_ID, {
      title: 'Test',
      description: 'Desc',
      location: 'Tunis',
      date: new Date(),
    }, []);

    expect(newProfile.save).toHaveBeenCalled();
  });

  it('throws 404 when user not found and no profile', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    User.findById.mockResolvedValue(null);

    await expect(addPortfolioProject(ARTISAN_ID, {}, [])).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('portfolio.service – getArtisanPortfolio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns projects for artisan', async () => {
    const profile = mockProfile();
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const mockProjects = [{ _id: PROJECT_ID }];
    Portfolio.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockProjects),
    });

    const result = await getArtisanPortfolio(ARTISAN_ID);
    expect(result).toEqual(mockProjects);
  });

  it('throws 404 when profile not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    await expect(getArtisanPortfolio(ARTISAN_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('portfolio.service – getProjectById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns project when found and authorized', async () => {
    const profile = mockProfile();
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const project = {
      _id: PROJECT_ID,
      artisanId: { toString: () => 'profile1' },
    };
    Portfolio.findById.mockResolvedValue(project);

    const result = await getProjectById(PROJECT_ID, ARTISAN_ID);
    expect(result).toBe(project);
  });

  it('throws 404 when project not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(mockProfile());
    Portfolio.findById.mockResolvedValue(null);
    await expect(getProjectById(PROJECT_ID, ARTISAN_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when project belongs to different artisan', async () => {
    const profile = mockProfile({ _id: 'profile1' });
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const project = {
      _id: PROJECT_ID,
      artisanId: { toString: () => 'other_profile' },
    };
    Portfolio.findById.mockResolvedValue(project);

    await expect(getProjectById(PROJECT_ID, ARTISAN_ID)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('portfolio.service – deleteProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes project and updates profile', async () => {
    const profile = mockProfile({ portfolio: [{ toString: () => PROJECT_ID }] });
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const project = {
      _id: PROJECT_ID,
      artisanId: { toString: () => 'profile1' },
    };
    Portfolio.findById.mockResolvedValue(project);
    Portfolio.findByIdAndDelete.mockResolvedValue(project);

    const result = await deleteProject(PROJECT_ID, ARTISAN_ID);
    expect(result.message).toBe('Projet supprimé avec succès');
    expect(Portfolio.findByIdAndDelete).toHaveBeenCalledWith(PROJECT_ID);
    expect(profile.save).toHaveBeenCalled();
  });

  it('throws 404 when project not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(mockProfile());
    Portfolio.findById.mockResolvedValue(null);
    await expect(deleteProject(PROJECT_ID, ARTISAN_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

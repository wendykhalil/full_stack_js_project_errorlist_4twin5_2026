'use strict';

// Mock BEFORE requiring the service (fixPortfolioVisibility runs at load time)
jest.mock('../../src/models/Portfolio');
jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/User');
jest.mock('../../src/config/cloudinary');

const Portfolio      = require('../../src/models/Portfolio');
const ArtisanProfile = require('../../src/models/ArtisanProfile');
const User           = require('../../src/models/User');

// Set up updateMany mock BEFORE requiring the service
Portfolio.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });

const portfolioService = require('../../src/modules/artisan/portfolio.service');

beforeEach(() => {
  jest.clearAllMocks();
  Portfolio.updateMany.mockResolvedValue({ modifiedCount: 0 });
});

// ─── addPortfolioProject ──────────────────────────────────────────────────────
describe('portfolio.service — addPortfolioProject', () => {
  it('creates project when profile exists', async () => {
    const profile = {
      _id: 'profile1',
      portfolio: [],
      totalProjects: 0,
      save: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);

    const savedProject = { _id: 'proj1' };
    const mockProjectInstance = {
      ...savedProject,
      save: jest.fn().mockResolvedValue(savedProject),
    };
    Portfolio.mockImplementation(() => mockProjectInstance);

    const result = await portfolioService.addPortfolioProject('user1', {
      title: 'Test Project',
      description: 'Desc',
      tags: 'tag1, tag2',
    });
    expect(mockProjectInstance.save).toHaveBeenCalled();
    expect(profile.save).toHaveBeenCalled();
  });

  it('creates profile automatically when not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    const user = { _id: 'user1', phone: '123' };
    User.findById.mockResolvedValue(user);

    const profile = {
      _id: 'newprofile',
      portfolio: [],
      totalProjects: 0,
      save: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.mockImplementation(() => profile);

    const savedProject = { _id: 'proj1' };
    const mockProjectInstance = {
      ...savedProject,
      save: jest.fn().mockResolvedValue(savedProject),
    };
    Portfolio.mockImplementation(() => mockProjectInstance);

    await portfolioService.addPortfolioProject('user1', { title: 'Test' });
    expect(profile.save).toHaveBeenCalled();
  });

  it('throws 404 when user not found and no profile', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    User.findById.mockResolvedValue(null);
    await expect(portfolioService.addPortfolioProject('user1', { title: 'Test' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('handles coordinates in project data', async () => {
    const profile = {
      _id: 'profile1',
      portfolio: [],
      totalProjects: 0,
      save: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);

    const mockProjectInstance = {
      _id: 'proj1',
      save: jest.fn().mockResolvedValue(true),
    };
    Portfolio.mockImplementation(() => mockProjectInstance);

    await portfolioService.addPortfolioProject('user1', {
      title: 'Test',
      coordinates: [10.5, 36.8],
    });
    expect(mockProjectInstance.save).toHaveBeenCalled();
  });
});

// ─── getArtisanPortfolio ──────────────────────────────────────────────────────
describe('portfolio.service — getArtisanPortfolio', () => {
  it('returns portfolio projects', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'p1', title: 'Project 1' }]),
    });
    const result = await portfolioService.getArtisanPortfolio('user1');
    expect(result).toBeDefined();
  });

  it('throws 404 when profile not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    await expect(portfolioService.getArtisanPortfolio('user1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getProjectById ───────────────────────────────────────────────────────────
describe('portfolio.service — getProjectById', () => {
  it('returns project when found', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue({
      _id: 'p1',
      artisanId: { toString: () => 'profile1' },
    });
    const result = await portfolioService.getProjectById('p1', 'user1');
    expect(result).toBeDefined();
  });

  it('throws 404 when project not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue(null);
    await expect(portfolioService.getProjectById('p1', 'user1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when not owner', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue({
      _id: 'p1',
      artisanId: { toString: () => 'other-profile' },
    });
    await expect(portfolioService.getProjectById('p1', 'user1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns project when no profile (no ownership check)', async () => {
    ArtisanProfile.findOne.mockResolvedValue(null);
    Portfolio.findById.mockResolvedValue({ _id: 'p1', artisanId: { toString: () => 'any' } });
    const result = await portfolioService.getProjectById('p1', 'user1');
    expect(result).toBeDefined();
  });
});

// ─── updateProject ────────────────────────────────────────────────────────────
describe('portfolio.service — updateProject', () => {
  it('throws 404 when project not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue(null);
    await expect(portfolioService.updateProject('p1', 'u1', {}))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when not owner', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue({
      _id: 'p1',
      artisanId: { toString: () => 'other' },
    });
    await expect(portfolioService.updateProject('p1', 'u1', {}))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates project successfully', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'u1' });
    const project = {
      _id: 'p1',
      artisanId: { toString: () => 'u1' },
      title: 'Old',
      save: jest.fn().mockResolvedValue(true),
    };
    Portfolio.findById.mockResolvedValue(project);
    await portfolioService.updateProject('p1', 'u1', { title: 'New Title', description: 'Updated' });
    expect(project.save).toHaveBeenCalled();
    expect(project.title).toBe('New Title');
  });

  it('updates images when provided', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'u1' });
    const project = {
      _id: 'p1',
      artisanId: { toString: () => 'u1' },
      images: [],
      save: jest.fn().mockResolvedValue(true),
    };
    Portfolio.findById.mockResolvedValue(project);
    await portfolioService.updateProject('p1', 'u1', {}, ['img1.jpg', 'img2.jpg']);
    expect(project.images).toEqual(['img1.jpg', 'img2.jpg']);
  });

  it('updates tags when provided', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'u1' });
    const project = {
      _id: 'p1',
      artisanId: { toString: () => 'u1' },
      tags: [],
      save: jest.fn().mockResolvedValue(true),
    };
    Portfolio.findById.mockResolvedValue(project);
    await portfolioService.updateProject('p1', 'u1', { tags: 'tag1, tag2' });
    expect(project.tags).toEqual(['tag1', 'tag2']);
  });

  it('updates location and date when provided', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'u1' });
    const project = {
      _id: 'p1',
      artisanId: { toString: () => 'u1' },
      save: jest.fn().mockResolvedValue(true),
    };
    Portfolio.findById.mockResolvedValue(project);
    await portfolioService.updateProject('p1', 'u1', {
      location: 'Tunis',
      date: '2024-01-01',
    });
    expect(project.location).toBe('Tunis');
    expect(project.date).toBe('2024-01-01');
  });
});

// ─── deleteProject ────────────────────────────────────────────────────────────
describe('portfolio.service — deleteProject (extended)', () => {
  it('throws 404 when project not found', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue(null);
    await expect(portfolioService.deleteProject('p1', 'u1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when not owner', async () => {
    ArtisanProfile.findOne.mockResolvedValue({ _id: 'profile1' });
    Portfolio.findById.mockResolvedValue({
      _id: 'p1',
      artisanId: { toString: () => 'other' },
    });
    await expect(portfolioService.deleteProject('p1', 'u1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('deletes project and updates profile', async () => {
    const profile = {
      _id: 'u1',
      portfolio: [{ toString: () => 'p1' }],
      totalProjects: 1,
      save: jest.fn().mockResolvedValue(true),
    };
    ArtisanProfile.findOne.mockResolvedValue(profile);
    const project = {
      _id: 'p1',
      artisanId: { toString: () => 'u1' },
    };
    Portfolio.findById.mockResolvedValue(project);
    Portfolio.findByIdAndDelete = jest.fn().mockResolvedValue(project);

    const result = await portfolioService.deleteProject('p1', 'u1');
    expect(Portfolio.findByIdAndDelete).toHaveBeenCalledWith('p1');
    expect(profile.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

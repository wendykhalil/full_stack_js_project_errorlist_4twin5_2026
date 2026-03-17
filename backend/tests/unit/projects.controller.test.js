const httpMocks = require('node-mocks-http');

jest.mock('../../src/models/Project', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
}));

const Project = require('../../src/models/Project');
const controller = require('../../src/modules/projects/projects.controller');

describe('projects.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createProject rejects missing title', async () => {
    const req = httpMocks.createRequest({ method: 'POST', body: {} });
    req.user = { sub: 'artisan-1' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await controller.createProject(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toBe('Title is required');
  });

  test('createProject creates artisan project', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        title: 'Villa moderne',
        city: 'Tunis',
        address: 'Lac 1',
        budgetTND: '120000',
        materials: 'béton,verre',
      },
    });
    req.user = { sub: 'artisan-1' };
    req.files = [];

    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.create.mockResolvedValue({ _id: 'p1' });
    Project.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', title: 'Villa moderne', artisanId: 'artisan-1' }),
    });

    await controller.createProject(req, res, next);

    expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({
      artisanId: 'artisan-1',
      title: 'Villa moderne',
      budgetTND: 120000,
      materials: ['béton', 'verre'],
    }));
    expect(res.statusCode).toBe(201);
  });

  test('listMyProjects returns only artisan projects', async () => {
    const req = httpMocks.createRequest({ method: 'GET' });
    req.user = { sub: 'artisan-1' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'p1' }]),
    });

    await controller.listMyProjects(req, res, next);

    expect(Project.find).toHaveBeenCalledWith({ artisanId: 'artisan-1' });
    expect(res._getJSONData().items).toHaveLength(1);
  });

  test('listAllProjects returns projects for prescripteur view', async () => {
    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'p1' }, { _id: 'p2' }]),
    });

    await controller.listAllProjects(req, res, next);
    const data = res._getJSONData();

    expect(data.ok).toBe(true);
    expect(data.items).toHaveLength(2);
  });

  test('getProjectById returns 404 when project is missing', async () => {
    const req = httpMocks.createRequest({ method: 'GET', params: { id: 'p404' } });
    req.user = { role: 'PRESCRIPTEUR', sub: 'pres-1' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    await controller.getProjectById(req, res, next);

    expect(res.statusCode).toBe(404);
  });

  test('getProjectById blocks artisan from reading another artisan project', async () => {
    const req = httpMocks.createRequest({ method: 'GET', params: { id: 'p1' } });
    req.user = { role: 'ARTISAN', sub: 'artisan-2' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', artisanId: { _id: 'artisan-1' } }),
    });

    await controller.getProjectById(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res._getJSONData().message).toBe('Forbidden');
  });

  test('getProjectById allows prescripteur to read artisan project', async () => {
    const req = httpMocks.createRequest({ method: 'GET', params: { id: 'p1' } });
    req.user = { role: 'PRESCRIPTEUR', sub: 'pres-1' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', artisanId: { _id: 'artisan-1' } }),
    });

    await controller.getProjectById(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().ok).toBe(true);
  });

  test('updateProject updates fields, images and contact phone for owner artisan', async () => {
    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: 'p1' },
      body: {
        title: 'Projet modifié',
        budgetTND: '95000',
        surfaceM2: '180',
        startDate: '2026-03-17',
        endDate: '2026-04-17',
        city: 'Sousse',
        address: 'Corniche',
        contactPhone: '+21699999999',
        materials: 'bois,acier',
        clearImages: 'true',
      },
    });
    req.user = { sub: 'artisan-1' };
    req.files = [{ filename: 'img1.jpg', originalname: 'img1.jpg', mimetype: 'image/jpeg', size: 1234 }];
    const res = httpMocks.createResponse();
    const next = jest.fn();

    const project = {
      _id: 'p1',
      artisanId: 'artisan-1',
      title: 'Old',
      location: { city: 'Tunis', address: 'Lac' },
      images: [{ filename: 'old.jpg' }],
      client: { phone: '+21611111111' },
      save: jest.fn().mockResolvedValue(true),
    };

    Project.findById
      .mockResolvedValueOnce(project)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: 'p1', title: 'Projet modifié', contactPhone: '+21699999999' }),
      });

    await controller.updateProject(req, res, next);

    expect(project.save).toHaveBeenCalled();
    expect(project.title).toBe('Projet modifié');
    expect(project.budgetTND).toBe(95000);
    expect(project.surfaceM2).toBe(180);
    expect(project.location.city).toBe('Sousse');
    expect(project.contactPhone).toBe('+21699999999');
    expect(project.client.phone).toBe('+21699999999');
    expect(project.materials).toEqual(['bois', 'acier']);
    expect(project.images).toHaveLength(1);
    expect(res._getJSONData().ok).toBe(true);
  });

  test('updateProject rejects invalid numeric field', async () => {
    const req = httpMocks.createRequest({
      method: 'PUT',
      params: { id: 'p1' },
      body: { budgetTND: 'not-a-number' },
    });
    req.user = { sub: 'artisan-1' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockResolvedValue({ _id: 'p1', artisanId: 'artisan-1' });

    await controller.updateProject(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/budgetTND/);
  });

  test('deleteProject rejects non owner artisan', async () => {
    const req = httpMocks.createRequest({ method: 'DELETE', params: { id: 'p1' } });
    req.user = { sub: 'artisan-2' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockResolvedValue({ _id: 'p1', artisanId: 'artisan-1' });

    await controller.deleteProject(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(Project.deleteOne).not.toHaveBeenCalled();
  });

  test('deleteProject deletes owner project', async () => {
    const req = httpMocks.createRequest({ method: 'DELETE', params: { id: 'p1' } });
    req.user = { sub: 'artisan-1' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockResolvedValue({ _id: 'p1', artisanId: 'artisan-1' });
    Project.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await controller.deleteProject(req, res, next);

    expect(Project.deleteOne).toHaveBeenCalledWith({ _id: 'p1' });
    expect(res._getJSONData().ok).toBe(true);
  });
});

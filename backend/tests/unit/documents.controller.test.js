const httpMocks = require('node-mocks-http');

jest.mock('../../src/models/Devis', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/models/Facture', () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/Project', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/ActivityLog', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../src/utils/ipGeo', () => ({
  lookupIpGeo: jest.fn().mockResolvedValue({ country: '', countryCode: '' }),
  isPrivateOrLocal: jest.fn().mockReturnValue(true),
}));

const Devis = require('../../src/models/Devis');
const Facture = require('../../src/models/Facture');
const Project = require('../../src/models/Project');
const controller = require('../../src/modules/documents/documents.controller');

describe('documents.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listMyDocuments returns quotes and invoices for artisan', async () => {
    const req = httpMocks.createRequest({ method: 'GET' });
    req.user = { _id: 'artisan-1', role: 'ARTISAN' };
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Devis.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'd1' }]),
    });
    Facture.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'f1' }]),
    });

    await controller.listMyDocuments(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._getJSONData().quotes).toHaveLength(1);
    expect(res._getJSONData().invoices).toHaveLength(1);
  });

  test('createQuote creates a quote from project id', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        projectId: 'p1',
        lines: [
          { description: 'Main d oeuvre', quantity: 2, unitPrice: 100 },
          { description: 'Materiaux', quantity: 1, unitPrice: 50 },
        ],
      },
      headers: {},
    });
    req.user = { _id: 'artisan-1', role: 'ARTISAN' };
    req.get = jest.fn().mockReturnValue('jest');
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Project.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'p1', artisanId: 'artisan-1', title: 'Project title' }) });
    Devis.create.mockResolvedValue({ _id: 'd1', total: 297.5 });

    await controller.createQuote(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Devis.create).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'p1',
      artisanId: 'artisan-1',
      subTotal: 250,
      taxAmount: 47.5,
      total: 297.5,
    }));
    expect(res.statusCode).toBe(201);
  });

  test('createInvoice creates invoice from quote id', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { devisId: 'd1', dueDate: '2026-04-30' },
      headers: {},
    });
    req.user = { _id: 'artisan-1', role: 'ARTISAN' };
    req.get = jest.fn().mockReturnValue('jest');
    const res = httpMocks.createResponse();
    const next = jest.fn();

    Devis.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({
      _id: 'd1',
      projectId: 'p1',
      artisanId: 'artisan-1',
      lines: [{ description: 'A', quantity: 1, unitPrice: 10, lineTotal: 10 }],
      subTotal: 10,
      taxRate: 0.19,
      taxAmount: 1.9,
      discount: 0,
      total: 11.9,
    }) });
    Facture.create.mockResolvedValue({ _id: 'f1', total: 11.9 });
    Project.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', title: 'Project title' }),
    });

    await controller.createInvoice(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Facture.create).toHaveBeenCalledWith(expect.objectContaining({
      devisId: 'd1',
      projectId: 'p1',
      artisanId: 'artisan-1',
      total: 11.9,
    }));
    expect(res.statusCode).toBe(201);
  });
});

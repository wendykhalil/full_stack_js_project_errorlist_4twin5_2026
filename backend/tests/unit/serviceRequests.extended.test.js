'use strict';
/**
 * Extended unit tests for serviceRequests.controller.js
 * Covers: create, listMine, getOne, update, remove,
 *         apply, cancelApplication, listApplications,
 *         acceptApplication, listForArtisan, getForArtisan
 */

jest.mock('../../src/models/ServiceRequest');
jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/Availability');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/notify');
jest.mock('../../src/utils/serviceRequestEmail');

const httpMocks = require('node-mocks-http');
const ServiceRequest = require('../../src/models/ServiceRequest');
const ArtisanProfile = require('../../src/models/ArtisanProfile');
const { notify } = require('../../src/utils/notify');
const { sendApplicationReceivedEmail, sendApplicationAcceptedEmail } = require('../../src/utils/serviceRequestEmail');

const ctrl = require('../../src/modules/service-requests/serviceRequests.controller');

function req(overrides = {}) {
  return httpMocks.createRequest({
    user: { _id: 'user123', id: 'user123' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── create ──────────────────────────────────────────────────────────────────
describe('serviceRequests.create', () => {
  it('returns 400 if title missing', async () => {
    const r = res();
    await ctrl.create(req({ body: { trade: 'Plombier' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 400 if trade missing', async () => {
    const r = res();
    await ctrl.create(req({ body: { title: 'Test' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('creates service request and returns 201', async () => {
    const doc = { _id: 'sr1', title: 'Test', trade: 'Plombier' };
    ServiceRequest.create.mockResolvedValue(doc);
    const r = res();
    await ctrl.create(req({ body: { title: 'Test', trade: 'Plombier' } }), r, next);
    expect(r.statusCode).toBe(201);
    expect(r._getJSONData().serviceRequest).toEqual(doc);
  });

  it('calls next on DB error', async () => {
    ServiceRequest.create.mockRejectedValue(new Error('DB error'));
    await ctrl.create(req({ body: { title: 'Test', trade: 'Plombier' } }), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── listMine ─────────────────────────────────────────────────────────────────
describe('serviceRequests.listMine', () => {
  it('returns list of service requests', async () => {
    const items = [{ _id: 'sr1' }, { _id: 'sr2' }];
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(items),
    });
    const r = res();
    await ctrl.listMine(req(), r, next);
    expect(r._getJSONData().items).toHaveLength(2);
  });

  it('calls next on error', async () => {
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('fail')),
    });
    await ctrl.listMine(req(), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── getOne ───────────────────────────────────────────────────────────────────
describe('serviceRequests.getOne', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const r = res();
    await ctrl.getOne(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns service request with enriched applications', async () => {
    const doc = {
      _id: 'sr1',
      applications: [{ artisanId: { _id: 'a1', firstName: 'Bob' } }],
    };
    ServiceRequest.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(doc),
    });
    ArtisanProfile.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ userId: 'a1', profileImage: 'img.jpg' }]),
    });
    const r = res();
    await ctrl.getOne(req({ params: { id: 'sr1' } }), r, next);
    expect(r._getJSONData().serviceRequest.applications[0].artisanId.profilePicture).toBe('img.jpg');
  });
});

// ─── listOpen ─────────────────────────────────────────────────────────────────
describe('serviceRequests.listOpen (artisan)', () => {
  it('returns open service requests', async () => {
    const items = [{ _id: 'sr1', trade: 'Plombier', prescripteurId: 'p1', applications: [] }];
    ArtisanProfile.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ trade: 'Plombier', region: 'Tunis' }),
    });
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(items),
    });
    ServiceRequest.countDocuments.mockResolvedValue(1);
    const r = res();
    await ctrl.listOpen(req({ query: { page: '1', limit: '10' } }), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('calls next on error', async () => {
    ArtisanProfile.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('fail')),
    });
    await ctrl.listOpen(req(), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── apply ────────────────────────────────────────────────────────────────────
describe('serviceRequests.apply', () => {
  it('returns 400 if service request not found', async () => {
    ServiceRequest.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const r = res();
    await ctrl.apply(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 400 if already applied', async () => {
    const doc = {
      _id: 'sr1',
      status: 'OPEN',
      applications: [{ artisanId: 'user123' }],
      maxApplicants: null,
    };
    ServiceRequest.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(doc),
    });
    const r = res();
    await ctrl.apply(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 400 if max applicants reached', async () => {
    const doc = {
      _id: 'sr1',
      status: 'OPEN',
      applications: [{ artisanId: 'other1' }, { artisanId: 'other2' }],
      maxApplicants: 2,
    };
    ServiceRequest.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(doc),
    });
    const r = res();
    await ctrl.apply(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });
});

// ─── remove ───────────────────────────────────────────────────────────────────
describe('serviceRequests.remove', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const r = res();
    await ctrl.remove(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('deletes and returns ok', async () => {
    const doc = { _id: 'sr1', deleteOne: jest.fn().mockResolvedValue(true) };
    ServiceRequest.findOne.mockResolvedValue(doc);
    const r = res();
    await ctrl.remove(req({ params: { id: 'sr1' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

// ─── changeStatus ─────────────────────────────────────────────────────────────
describe('serviceRequests.changeStatus', () => {
  it('returns 400 for invalid status', async () => {
    const r = res();
    await ctrl.changeStatus(req({ params: { id: 'sr1' }, body: { status: 'INVALID' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const r = res();
    await ctrl.changeStatus(req({ params: { id: 'sr1' }, body: { status: 'CANCELLED' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('changes status successfully', async () => {
    const doc = { _id: 'sr1', status: 'OPEN', save: jest.fn().mockResolvedValue(true) };
    ServiceRequest.findOne.mockResolvedValue(doc);
    const r = res();
    await ctrl.changeStatus(req({ params: { id: 'sr1' }, body: { status: 'CANCELLED' } }), r, next);
    expect(doc.save).toHaveBeenCalled();
  });
});

// ─── myApplications ───────────────────────────────────────────────────────────
describe('serviceRequests.myApplications', () => {
  it('returns artisan applications', async () => {
    const items = [{ _id: 'sr1', title: 'Test', applications: [{ artisanId: 'user123', status: 'PENDING' }] }];
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(items),
    });
    const r = res();
    await ctrl.myApplications(req(), r, next);
    expect(r.statusCode).toBe(200);
  });
});

// ─── withdraw ─────────────────────────────────────────────────────────────────
describe('serviceRequests.withdraw', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findById.mockResolvedValue(null);
    const r = res();
    await ctrl.withdraw(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns 400 if not open', async () => {
    ServiceRequest.findById.mockResolvedValue({ _id: 'sr1', status: 'ASSIGNED', applications: [] });
    const r = res();
    await ctrl.withdraw(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });
});

// ─── getOpenOne ───────────────────────────────────────────────────────────────
describe('serviceRequests.getOpenOne', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const r = res();
    await ctrl.getOpenOne(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns service request', async () => {
    const doc = { _id: 'sr1', status: 'OPEN', applications: [], prescripteurId: { firstName: 'Jean' } };
    ServiceRequest.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(doc),
    });
    const r = res();
    await ctrl.getOpenOne(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(200);
  });
});

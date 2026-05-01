'use strict';
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
    params: {}, body: {}, query: {},
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── update ───────────────────────────────────────────────────────────────────
describe('serviceRequests.update', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const r = res();
    await ctrl.update(req({ params: { id: 'sr1' }, body: { title: 'New' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns 400 if not OPEN', async () => {
    ServiceRequest.findOne.mockResolvedValue({ _id: 'sr1', status: 'ASSIGNED' });
    const r = res();
    await ctrl.update(req({ params: { id: 'sr1' }, body: { title: 'New' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('updates successfully', async () => {
    const doc = { _id: 'sr1', status: 'OPEN', title: 'Old', save: jest.fn().mockResolvedValue(true) };
    ServiceRequest.findOne.mockResolvedValue(doc);
    const r = res();
    await ctrl.update(req({ params: { id: 'sr1' }, body: { title: 'New Title', trade: 'Plombier' } }), r, next);
    expect(doc.save).toHaveBeenCalled();
  });
});

// ─── acceptApplication ────────────────────────────────────────────────────────
describe('serviceRequests.acceptApplication', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const r = res();
    await ctrl.acceptApplication(req({ params: { id: 'sr1', appId: 'app1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns 400 if not OPEN', async () => {
    ServiceRequest.findOne.mockResolvedValue({ _id: 'sr1', status: 'ASSIGNED' });
    const r = res();
    await ctrl.acceptApplication(req({ params: { id: 'sr1', appId: 'app1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 404 if application not found', async () => {
    const doc = {
      _id: 'sr1', status: 'OPEN',
      applications: { id: jest.fn().mockReturnValue(null) },
    };
    ServiceRequest.findOne.mockResolvedValue(doc);
    const r = res();
    await ctrl.acceptApplication(req({ params: { id: 'sr1', appId: 'app1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });
});

// ─── rejectApplication ────────────────────────────────────────────────────────
describe('serviceRequests.rejectApplication', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const r = res();
    await ctrl.rejectApplication(req({ params: { id: 'sr1', appId: 'app1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns 404 if application not found', async () => {
    const doc = {
      _id: 'sr1', status: 'OPEN',
      applications: { id: jest.fn().mockReturnValue(null) },
    };
    ServiceRequest.findOne.mockResolvedValue(doc);
    const r = res();
    await ctrl.rejectApplication(req({ params: { id: 'sr1', appId: 'app1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('rejects application successfully', async () => {
    const app = { _id: 'app1', artisanId: 'a1', status: 'PENDING' };
    const doc = {
      _id: 'sr1', status: 'OPEN',
      applications: { id: jest.fn().mockReturnValue(app) },
      save: jest.fn().mockResolvedValue(true),
    };
    ServiceRequest.findOne.mockResolvedValue(doc);
    notify.mockResolvedValue(true);
    const r = res();
    await ctrl.rejectApplication(req({ params: { id: 'sr1', appId: 'app1' } }), r, next);
    expect(doc.save).toHaveBeenCalled();
    expect(app.status).toBe('REJECTED');
  });
});

// ─── reopen ───────────────────────────────────────────────────────────────────
describe('serviceRequests.reopen', () => {
  it('returns 404 if not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const r = res();
    await ctrl.reopen(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('returns 400 if not CANCELLED', async () => {
    ServiceRequest.findOne.mockResolvedValue({ _id: 'sr1', status: 'OPEN' });
    const r = res();
    await ctrl.reopen(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('reopens successfully', async () => {
    const doc = { _id: 'sr1', status: 'CANCELLED', save: jest.fn().mockResolvedValue(true) };
    ServiceRequest.findOne.mockResolvedValue(doc);
    const r = res();
    await ctrl.reopen(req({ params: { id: 'sr1' } }), r, next);
    expect(doc.save).toHaveBeenCalled();
    expect(doc.status).toBe('OPEN');
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

  it('returns 400 if not OPEN', async () => {
    ServiceRequest.findById.mockResolvedValue({ _id: 'sr1', status: 'ASSIGNED', applications: [] });
    const r = res();
    await ctrl.withdraw(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 404 if no application found', async () => {
    ServiceRequest.findById.mockResolvedValue({
      _id: 'sr1', status: 'OPEN',
      applications: [{ artisanId: 'other', status: 'PENDING' }],
    });
    const r = res();
    await ctrl.withdraw(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(404);
  });

  it('withdraws successfully', async () => {
    const doc = {
      _id: 'sr1', status: 'OPEN',
      applications: [{ artisanId: 'user123', status: 'PENDING' }],
      save: jest.fn().mockResolvedValue(true),
    };
    ServiceRequest.findById.mockResolvedValue(doc);
    const r = res();
    await ctrl.withdraw(req({ params: { id: 'sr1' } }), r, next);
    expect(doc.save).toHaveBeenCalled();
  });
});

// ─── myApplications ───────────────────────────────────────────────────────────
describe('serviceRequests.myApplications', () => {
  it('returns artisan applications', async () => {
    const items = [{ _id: 'sr1', title: 'Test', applications: [{ artisanId: 'user123', status: 'PENDING' }], prescripteurId: { firstName: 'Jean' } }];
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(items),
    });
    const r = res();
    await ctrl.myApplications(req(), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('calls next on error', async () => {
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('fail')),
    });
    await ctrl.myApplications(req(), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── listApplications (prescripteur) ─────────────────────────────────────────
describe('serviceRequests.listApplications', () => {
  it('returns applications for a service request', async () => {
    const doc = {
      _id: 'sr1',
      applications: [{ artisanId: { _id: 'a1', firstName: 'Ali' }, status: 'PENDING' }],
    };
    ServiceRequest.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(doc),
    });
    ArtisanProfile.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const r = res();
    // listApplications is getOne with applications populated
    await ctrl.getOne(req({ params: { id: 'sr1' } }), r, next);
    expect(r.statusCode).toBe(200);
  });
});

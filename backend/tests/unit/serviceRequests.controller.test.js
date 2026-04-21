const httpMocks = require('node-mocks-http');

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/ServiceRequest', () => {
  const mockDoc = () => ({
    _id: 'sr1',
    prescripteurId: 'pres-1',
    title: 'Besoin plombier',
    description: '',
    trade: 'Plombier',
    city: 'Tunis',
    budgetTND: 2000,
    deadline: null,
    status: 'OPEN',
    assignedArtisanId: null,
    applications: [],
    save: jest.fn().mockResolvedValue(true),
    id: jest.fn(id => null),
  });

  const SR = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    _mockDoc: mockDoc,
  };
  return SR;
});

jest.mock('../../src/models/ArtisanProfile', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../src/models/Availability', () => ({
  findOne: jest.fn(),
}));

// Helper to make Availability.findOne chain .lean()
function mockAvailFindOne(value) {
  require('../../src/models/Availability').findOne.mockReturnValue({
    lean: jest.fn().mockResolvedValue(value),
  });
}

jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
}));

// Helper to make User.findById chain .select().lean()
function mockUserFindById(value) {
  const chain = { select: jest.fn(), lean: jest.fn().mockResolvedValue(value) };
  chain.select.mockReturnValue(chain);
  require('../../src/models/User').findById.mockReturnValue(chain);
}

jest.mock('../../src/utils/notify', () => ({
  notify: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/utils/serviceRequestEmail', () => ({
  sendApplicationReceivedEmail: jest.fn().mockResolvedValue(true),
  sendApplicationAcceptedEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/models/Review', () => ({
  find: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

const ServiceRequest = require('../../src/models/ServiceRequest');
const ArtisanProfile = require('../../src/models/ArtisanProfile');
const Availability = require('../../src/models/Availability');
const User = require('../../src/models/User');
const { notify } = require('../../src/utils/notify');
const { sendApplicationReceivedEmail } = require('../../src/utils/serviceRequestEmail');
const ctrl = require('../../src/modules/service-requests/serviceRequests.controller');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides = {}) {
  const req = httpMocks.createRequest(overrides);
  req.user = overrides.user || { _id: 'pres-1', id: 'pres-1' };
  return req;
}

function makeRes() {
  return httpMocks.createResponse();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('serviceRequests.controller — create', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects missing title', async () => {
    const req = makeReq({ method: 'POST', body: { trade: 'Plombier' } });
    const res = makeRes();
    await ctrl.create(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/title/i);
  });

  test('rejects missing trade', async () => {
    const req = makeReq({ method: 'POST', body: { title: 'Test' } });
    const res = makeRes();
    await ctrl.create(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/trade/i);
  });

  test('creates service request successfully', async () => {
    const doc = ServiceRequest._mockDoc();
    ServiceRequest.create.mockResolvedValue(doc);
    const req = makeReq({ method: 'POST', body: { title: 'Besoin plombier', trade: 'Plombier', city: 'Tunis', budgetTND: 2000 } });
    const res = makeRes();
    await ctrl.create(req, res, jest.fn());
    expect(res.statusCode).toBe(201);
    expect(res._getJSONData().ok).toBe(true);
    expect(ServiceRequest.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Besoin plombier', trade: 'Plombier' }));
  });
});

describe('serviceRequests.controller — listMine', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns prescripteur requests', async () => {
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'sr1', title: 'Test' }]),
    });
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await ctrl.listMine(req, res, jest.fn());
    expect(res._getJSONData().ok).toBe(true);
    expect(res._getJSONData().items).toHaveLength(1);
  });
});

describe('serviceRequests.controller — changeStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects invalid status', async () => {
    const req = makeReq({ method: 'PATCH', body: { status: 'INVALID' } });
    const res = makeRes();
    await ctrl.changeStatus(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('cancels an open request', async () => {
    const doc = ServiceRequest._mockDoc();
    ServiceRequest.findOne.mockResolvedValue(doc);
    const req = makeReq({ method: 'PATCH', params: { id: 'sr1' }, body: { status: 'CANCELLED' } });
    const res = makeRes();
    await ctrl.changeStatus(req, res, jest.fn());
    expect(doc.status).toBe('CANCELLED');
    expect(doc.save).toHaveBeenCalled();
    expect(res._getJSONData().ok).toBe(true);
  });

  test('returns 404 when request not found', async () => {
    ServiceRequest.findOne.mockResolvedValue(null);
    const req = makeReq({ method: 'PATCH', params: { id: 'sr-missing' }, body: { status: 'CANCELLED' } });
    const res = makeRes();
    await ctrl.changeStatus(req, res, jest.fn());
    expect(res.statusCode).toBe(404);
  });
});

describe('serviceRequests.controller — reopen', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects reopening a non-cancelled request', async () => {
    const doc = ServiceRequest._mockDoc(); // status: OPEN
    ServiceRequest.findOne.mockResolvedValue(doc);
    const req = makeReq({ method: 'PATCH', params: { id: 'sr1' } });
    const res = makeRes();
    await ctrl.reopen(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/CANCELLED/);
  });

  test('reopens a cancelled request and clears expired deadline', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.status = 'CANCELLED';
    doc.deadline = new Date('2020-01-01'); // past date
    ServiceRequest.findOne.mockResolvedValue(doc);
    const req = makeReq({ method: 'PATCH', params: { id: 'sr1' } });
    const res = makeRes();
    await ctrl.reopen(req, res, jest.fn());
    expect(doc.status).toBe('OPEN');
    expect(doc.deadline).toBeNull();
    expect(doc.save).toHaveBeenCalled();
    expect(res._getJSONData().ok).toBe(true);
  });

  test('reopens a cancelled request with future deadline unchanged', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.status = 'CANCELLED';
    const futureDate = new Date(Date.now() + 86400000 * 30);
    doc.deadline = futureDate;
    ServiceRequest.findOne.mockResolvedValue(doc);
    const req = makeReq({ method: 'PATCH', params: { id: 'sr1' } });
    const res = makeRes();
    await ctrl.reopen(req, res, jest.fn());
    expect(doc.status).toBe('OPEN');
    expect(doc.deadline).toBe(futureDate); // not cleared
  });
});

describe('serviceRequests.controller — apply', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects applying to non-open request', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.status = 'ASSIGNED';
    ServiceRequest.findById.mockResolvedValue(doc);
    const req = makeReq({ method: 'POST', params: { id: 'sr1' }, body: { proposedPrice: 1500 }, user: { _id: 'art-1' } });
    const res = makeRes();
    await ctrl.apply(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/no longer open/i);
  });

  test('rejects duplicate application', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.applications = [{ artisanId: 'art-1', status: 'PENDING' }];
    ServiceRequest.findById.mockResolvedValue(doc);
    User.findById.mockResolvedValue({ firstName: 'A', lastName: 'B', email: 'a@b.com' });
    const req = makeReq({ method: 'POST', params: { id: 'sr1' }, body: { proposedPrice: 1500 }, user: { _id: 'art-1' } });
    const res = makeRes();
    await ctrl.apply(req, res, jest.fn());
    expect(res.statusCode).toBe(409);
  });

  test('submits application and notifies prescripteur', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.applications = [];
    ServiceRequest.findById.mockResolvedValue(doc);
    mockAvailFindOne(null);
    mockUserFindById({ firstName: 'User', lastName: 'Test', email: 'user@test.com' });
    const req = makeReq({ method: 'POST', params: { id: 'sr1' }, body: { proposedPrice: 2000, message: 'Je suis disponible' }, user: { _id: 'art-2' } });
    const res = makeRes();
    const next = jest.fn();
    await ctrl.apply(req, res, next);
    if (next.mock.calls.length > 0) throw next.mock.calls[0][0];
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.message).toBe('Application submitted');
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'APPLICATION_RECEIVED' }));
    expect(sendApplicationReceivedEmail).toHaveBeenCalled();
  });

  test('returns availability warning when artisan is busy on deadline', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.deadline = new Date(Date.now() + 86400000 * 7);
    doc.applications = [];
    ServiceRequest.findById.mockResolvedValue(doc);
    mockAvailFindOne({ status: 'BUSY' });
    mockUserFindById({ firstName: 'User', lastName: 'Test', email: 'user@test.com' });
    const req = makeReq({ method: 'POST', params: { id: 'sr1' }, body: { proposedPrice: 1500 }, user: { _id: 'art-3' } });
    const res = makeRes();
    const next = jest.fn();
    await ctrl.apply(req, res, next);
    if (next.mock.calls.length > 0) throw next.mock.calls[0][0];
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.availabilityWarning).toBeTruthy();
    expect(data.availabilityWarning).toMatch(/occupé/i);
  });

  test('no availability warning when artisan is available on deadline', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.deadline = new Date(Date.now() + 86400000 * 7);
    doc.applications = [];
    ServiceRequest.findById.mockResolvedValue(doc);
    mockAvailFindOne({ status: 'AVAILABLE' });
    mockUserFindById({ firstName: 'User', lastName: 'Test', email: 'user@test.com' });
    const req = makeReq({ method: 'POST', params: { id: 'sr1' }, body: { proposedPrice: 1500 }, user: { _id: 'art-4' } });
    const res = makeRes();
    const next = jest.fn();
    await ctrl.apply(req, res, next);
    if (next.mock.calls.length > 0) throw next.mock.calls[0][0];
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.availabilityWarning).toBeNull();
  });
});

describe('serviceRequests.controller — withdraw', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects withdraw from non-open request', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.status = 'ASSIGNED';
    ServiceRequest.findById.mockResolvedValue(doc);
    const req = makeReq({ method: 'DELETE', params: { id: 'sr1' }, user: { _id: 'art-1' } });
    const res = makeRes();
    await ctrl.withdraw(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
  });

  test('rejects withdraw when no application found', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.applications = [];
    ServiceRequest.findById.mockResolvedValue(doc);
    const req = makeReq({ method: 'DELETE', params: { id: 'sr1' }, user: { _id: 'art-1' } });
    const res = makeRes();
    await ctrl.withdraw(req, res, jest.fn());
    expect(res.statusCode).toBe(404);
  });

  test('rejects withdraw of accepted application', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.applications = [{ artisanId: 'art-1', status: 'ACCEPTED' }];
    ServiceRequest.findById.mockResolvedValue(doc);
    const req = makeReq({ method: 'DELETE', params: { id: 'sr1' }, user: { _id: 'art-1' } });
    const res = makeRes();
    await ctrl.withdraw(req, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/accepted/i);
  });

  test('withdraws pending application successfully', async () => {
    const doc = ServiceRequest._mockDoc();
    doc.applications = [{ artisanId: 'art-1', status: 'PENDING' }];
    doc.applications.splice = jest.fn();
    ServiceRequest.findById.mockResolvedValue(doc);
    const req = makeReq({ method: 'DELETE', params: { id: 'sr1' }, user: { _id: 'art-1' } });
    const res = makeRes();
    await ctrl.withdraw(req, res, jest.fn());
    expect(doc.applications.splice).toHaveBeenCalledWith(0, 1);
    expect(doc.save).toHaveBeenCalled();
    expect(res._getJSONData().ok).toBe(true);
  });
});

describe('serviceRequests.controller — listOpen (artisan)', () => {
  beforeEach(() => jest.clearAllMocks());

  function mockFindChain(items) {
    return {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(items),
    };
  }

  test('auto-filters by artisan trade when no trade param', async () => {
    ArtisanProfile.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ trade: 'Électricien' }),
    });
    ServiceRequest.find.mockReturnValue(mockFindChain([]));
    ServiceRequest.countDocuments.mockResolvedValue(0);

    const req = makeReq({ method: 'GET', query: {} });
    const res = makeRes();
    await ctrl.listOpen(req, res, jest.fn());

    expect(ServiceRequest.find).toHaveBeenCalledWith(expect.objectContaining({ trade: 'Électricien' }));
    expect(res._getJSONData().ok).toBe(true);
  });

  test('remaps prescripteurId to prescripteur in response', async () => {
    ArtisanProfile.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const prescripteur = { _id: 'pres-1', firstName: 'Jean', lastName: 'Dupont', profilePicture: '' };
    ServiceRequest.find.mockReturnValue(mockFindChain([{
      _id: 'sr1', title: 'Test', prescripteurId: prescripteur, applications: [],
    }]));
    ServiceRequest.countDocuments.mockResolvedValue(1);

    const req = makeReq({ method: 'GET', query: {} });
    const res = makeRes();
    await ctrl.listOpen(req, res, jest.fn());

    const items = res._getJSONData().items;
    expect(items[0].prescripteur).toEqual(prescripteur);
    expect(items[0].prescripteurId).toBeUndefined();
  });

  test('marks hasApplied correctly', async () => {
    ArtisanProfile.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    ServiceRequest.find.mockReturnValue(mockFindChain([{
      _id: 'sr1', title: 'Test', prescripteurId: {},
      applications: [{ artisanId: 'pres-1' }],
    }]));
    ServiceRequest.countDocuments.mockResolvedValue(1);

    const req = makeReq({ method: 'GET', query: {}, user: { _id: 'pres-1' } });
    const res = makeRes();
    await ctrl.listOpen(req, res, jest.fn());

    expect(res._getJSONData().items[0].hasApplied).toBe(true);
    expect(res._getJSONData().items[0].applications).toBeUndefined();
  });
});

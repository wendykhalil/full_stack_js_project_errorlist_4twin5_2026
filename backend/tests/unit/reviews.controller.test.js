'use strict';
jest.mock('../../src/models/Review');
jest.mock('../../src/models/ServiceRequest');

const Review = require('../../src/models/Review');
const ServiceRequest = require('../../src/models/ServiceRequest');
const { create, getForUser, getPending, remove } = require('../../src/modules/reviews/reviews.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    user: { _id: 'user1', id: 'user1', role: 'ARTISAN' },
    body: {},
    params: {},
    ...overrides,
  };
}

const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── create ───────────────────────────────────────────────────────────────────
describe('reviews.controller — create', () => {
  it('returns 400 when targetId missing', async () => {
    const req = mockReq({ body: { targetType: 'ARTISAN', rating: 4, comment: 'Great work done here' } });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when targetType invalid', async () => {
    const req = mockReq({ body: { targetId: 't1', targetType: 'INVALID', rating: 4, comment: 'Great work done here' } });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when rating out of range', async () => {
    const req = mockReq({ body: { targetId: 't1', targetType: 'ARTISAN', rating: 6, comment: 'Great work done here' } });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when comment too short', async () => {
    const req = mockReq({ body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Short' } });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when self-review', async () => {
    const req = mockReq({
      user: { _id: 'user1' },
      body: { targetId: 'user1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when service request not found', async () => {
    ServiceRequest.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = mockReq({
      body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here', sourceId: 'sr1' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when service request not completed', async () => {
    ServiceRequest.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'sr1', status: 'OPEN', prescripteurId: 'user1', assignedArtisanId: 't1' }),
    });
    const req = mockReq({
      body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here', sourceId: 'sr1' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when user not part of service request', async () => {
    ServiceRequest.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'sr1', status: 'COMPLETED', prescripteurId: 'other1', assignedArtisanId: 'other2' }),
    });
    const req = mockReq({
      body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here', sourceId: 'sr1' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 409 when duplicate review', async () => {
    ServiceRequest.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'sr1', status: 'COMPLETED', prescripteurId: 'user1', assignedArtisanId: 't1' }),
    });
    Review.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'existing' }) });
    const req = mockReq({
      body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here', sourceId: 'sr1' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('creates review successfully', async () => {
    ServiceRequest.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'sr1', status: 'COMPLETED', prescripteurId: 'user1', assignedArtisanId: 't1' }),
    });
    Review.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    Review.create.mockResolvedValue({ _id: 'rev1' });
    Review.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'rev1', rating: 4 }),
    });
    const req = mockReq({
      body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here', sourceId: 'sr1' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('creates review without sourceId', async () => {
    Review.create.mockResolvedValue({ _id: 'rev1' });
    Review.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'rev1', rating: 5 }),
    });
    const req = mockReq({
      body: { targetId: 't1', targetType: 'PRESCRIPTEUR', rating: 5, comment: 'Excellent prescripteur professionnel' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('calls next on unexpected error', async () => {
    Review.create.mockRejectedValue(new Error('DB error'));
    const req = mockReq({
      body: { targetId: 't1', targetType: 'ARTISAN', rating: 4, comment: 'Great work done here' },
    });
    const res = mockRes();
    await create(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── getForUser ───────────────────────────────────────────────────────────────
describe('reviews.controller — getForUser', () => {
  it('returns reviews with avg rating', async () => {
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'r1', rating: 4 },
        { _id: 'r2', rating: 5 },
      ]),
    });
    const req = mockReq({ params: { userId: 'u1' } });
    const res = mockRes();
    await getForUser(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, avgRating: 4.5 }));
  });

  it('returns 0 avgRating when no reviews', async () => {
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = mockReq({ params: { userId: 'u1' } });
    const res = mockRes();
    await getForUser(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ avgRating: 0 }));
  });

  it('calls next on error', async () => {
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ params: { userId: 'u1' } });
    const res = mockRes();
    await getForUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── getPending ───────────────────────────────────────────────────────────────
describe('reviews.controller — getPending', () => {
  it('returns 403 for invalid role', async () => {
    const req = mockReq({ user: { _id: 'u1', role: 'ADMIN' } });
    const res = mockRes();
    await getPending(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns empty pending when no completed requests', async () => {
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = mockReq({ user: { _id: 'u1', id: 'u1', role: 'PRESCRIPTEUR' } });
    const res = mockRes();
    await getPending(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pending: [] }));
  });

  it('returns pending reviews for PRESCRIPTEUR', async () => {
    const sr = {
      _id: 'sr1',
      title: 'Test',
      updatedAt: new Date(),
      prescripteurId: { _id: 'u1', firstName: 'A', lastName: 'B' },
      assignedArtisanId: { _id: 'artisan1', firstName: 'C', lastName: 'D', targetType: 'ARTISAN' },
    };
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([sr]),
    });
    Review.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = mockReq({ user: { _id: 'u1', id: 'u1', role: 'PRESCRIPTEUR' } });
    const res = mockRes();
    await getPending(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('returns pending reviews for ARTISAN', async () => {
    const sr = {
      _id: 'sr1',
      title: 'Test',
      updatedAt: new Date(),
      prescripteurId: { _id: 'p1', firstName: 'A', lastName: 'B' },
      assignedArtisanId: { _id: 'u1', firstName: 'C', lastName: 'D' },
    };
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([sr]),
    });
    Review.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = mockReq({ user: { _id: 'u1', id: 'u1', role: 'ARTISAN' } });
    const res = mockRes();
    await getPending(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('filters out already reviewed requests', async () => {
    const sr = { _id: 'sr1', title: 'Test', updatedAt: new Date(), prescripteurId: {}, assignedArtisanId: {} };
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([sr]),
    });
    Review.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ sourceId: 'sr1' }]),
    });
    const req = mockReq({ user: { _id: 'u1', id: 'u1', role: 'PRESCRIPTEUR' } });
    const res = mockRes();
    await getPending(req, res, next);
    const call = res.json.mock.calls[0][0];
    expect(call.pending).toHaveLength(0);
  });

  it('calls next on error', async () => {
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ user: { _id: 'u1', id: 'u1', role: 'ARTISAN' } });
    const res = mockRes();
    await getPending(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── remove ───────────────────────────────────────────────────────────────────
describe('reviews.controller — remove', () => {
  it('returns 404 when review not found', async () => {
    Review.findById.mockResolvedValue(null);
    const req = mockReq({ params: { id: 'r1' } });
    const res = mockRes();
    await remove(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when not author', async () => {
    Review.findById.mockResolvedValue({ _id: 'r1', authorId: 'other' });
    const req = mockReq({ params: { id: 'r1' }, user: { _id: 'user1' } });
    const res = mockRes();
    await remove(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('deletes review successfully', async () => {
    Review.findById.mockResolvedValue({ _id: 'r1', authorId: 'user1' });
    Review.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const req = mockReq({ params: { id: 'r1' }, user: { _id: 'user1' } });
    const res = mockRes();
    await remove(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('calls next on error', async () => {
    Review.findById.mockRejectedValue(new Error('DB error'));
    const req = mockReq({ params: { id: 'r1' } });
    const res = mockRes();
    await remove(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

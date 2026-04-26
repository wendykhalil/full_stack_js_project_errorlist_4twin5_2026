'use strict';

jest.mock('../../src/models/Review');
jest.mock('../../src/models/ServiceRequest');

const Review = require('../../src/models/Review');
const ServiceRequest = require('../../src/models/ServiceRequest');
const { create, getForUser, getPending, remove } = require('../../src/modules/reviews/reviews.controller');

function makeReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { _id: 'user1', role: 'ARTISAN' },
    ...overrides,
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

const next = jest.fn();

describe('reviews.controller – create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when targetId missing', async () => {
    const req = makeReq({ body: { targetType: 'ARTISAN', rating: 4, comment: 'Great work here!' } });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'targetId est requis' });
  });

  it('returns 400 for invalid targetType', async () => {
    const req = makeReq({ body: { targetId: 'target1', targetType: 'INVALID', rating: 4, comment: 'Great work here!' } });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for rating out of range', async () => {
    const req = makeReq({ body: { targetId: 'target1', targetType: 'ARTISAN', rating: 6, comment: 'Great work here!' } });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for comment too short', async () => {
    const req = makeReq({ body: { targetId: 'target1', targetType: 'ARTISAN', rating: 4, comment: 'Short' } });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for self-review', async () => {
    const req = makeReq({
      body: { targetId: 'user1', targetType: 'ARTISAN', rating: 4, comment: 'Great work here!' },
      user: { _id: 'user1', role: 'ARTISAN' },
    });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Vous ne pouvez pas vous évaluer vous-même' });
  });

  it('creates review successfully', async () => {
    const mockReview = { _id: 'rev1', rating: 4, comment: 'Great work here!' };
    Review.create.mockResolvedValue(mockReview);
    Review.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockReview),
    });

    const req = makeReq({
      body: { targetId: 'target1', targetType: 'ARTISAN', rating: 4, comment: 'Great work here!' },
    });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ok: true, review: mockReview });
  });

  it('returns 404 when sourceId service request not found', async () => {
    ServiceRequest.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = makeReq({
      body: { targetId: 'target1', targetType: 'ARTISAN', rating: 4, comment: 'Great work here!', sourceId: 'sr1' },
    });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 for duplicate review', async () => {
    const mockSR = { _id: 'sr1', status: 'COMPLETED', prescripteurId: 'user1', assignedArtisanId: 'target1' };
    ServiceRequest.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockSR) });
    Review.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'existing' }) });

    const req = makeReq({
      body: { targetId: 'target1', targetType: 'ARTISAN', rating: 4, comment: 'Great work here!', sourceId: 'sr1' },
      user: { _id: 'user1', role: 'PRESCRIPTEUR' },
    });
    const res = makeRes();
    await create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('reviews.controller – getForUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns reviews and stats', async () => {
    const mockReviews = [{ rating: 4 }, { rating: 5 }];
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockReviews),
    });

    const req = makeReq({ params: { userId: 'target1' } });
    const res = makeRes();
    await getForUser(req, res, next);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      reviews: mockReviews,
      total: 2,
      avgRating: 4.5,
    });
  });

  it('returns 0 avgRating when no reviews', async () => {
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const req = makeReq({ params: { userId: 'target1' } });
    const res = makeRes();
    await getForUser(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true, reviews: [], total: 0, avgRating: 0 });
  });

  it('calls next on error', async () => {
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB fail')),
    });
    const req = makeReq({ params: { userId: 'target1' } });
    const res = makeRes();
    await getForUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('reviews.controller – getPending', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 403 for invalid role', async () => {
    const req = makeReq({ user: { _id: 'user1', role: 'SUPPLIER' } });
    const res = makeRes();
    await getPending(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns empty pending when no completed service requests', async () => {
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const req = makeReq({ user: { _id: 'user1', role: 'ARTISAN' } });
    const res = makeRes();
    await getPending(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true, pending: [] });
  });

  it('filters out already reviewed service requests', async () => {
    const mockSRs = [
      { _id: 'sr1', title: 'Job 1', updatedAt: new Date(), prescripteurId: { _id: 'p1' }, assignedArtisanId: { _id: 'user1' } },
      { _id: 'sr2', title: 'Job 2', updatedAt: new Date(), prescripteurId: { _id: 'p1' }, assignedArtisanId: { _id: 'user1' } },
    ];
    ServiceRequest.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockSRs),
    });
    Review.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ sourceId: 'sr1' }]),
    });

    const req = makeReq({ user: { _id: 'user1', role: 'ARTISAN' } });
    const res = makeRes();
    await getPending(req, res, next);
    const call = res.json.mock.calls[0][0];
    expect(call.ok).toBe(true);
    expect(call.pending).toHaveLength(1);
  });
});

describe('reviews.controller – remove', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when review not found', async () => {
    Review.findById.mockResolvedValue(null);
    const req = makeReq({ params: { id: 'rev1' } });
    const res = makeRes();
    await remove(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when user is not the author', async () => {
    Review.findById.mockResolvedValue({ _id: 'rev1', authorId: 'other_user' });
    const req = makeReq({ params: { id: 'rev1' }, user: { _id: 'user1' } });
    const res = makeRes();
    await remove(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('deletes review when authorized', async () => {
    Review.findById.mockResolvedValue({ _id: 'rev1', authorId: 'user1' });
    Review.deleteOne.mockResolvedValue({});
    const req = makeReq({ params: { id: 'rev1' }, user: { _id: 'user1' } });
    const res = makeRes();
    await remove(req, res, next);
    expect(Review.deleteOne).toHaveBeenCalledWith({ _id: 'rev1' });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

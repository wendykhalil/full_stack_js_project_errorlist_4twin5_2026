'use strict';

jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { authRequired } = require('../../src/middleware/authMiddleware');

function makeReq(authHeader) {
  return {
    headers: { authorization: authHeader || '' },
    get: jest.fn(),
  };
}

function makeRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

describe('authMiddleware – authRequired', () => {
  const next = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when no Authorization header', async () => {
    const req = makeReq('');
    const res = makeRes();
    await authRequired(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non autorisé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when scheme is not Bearer', async () => {
    const req = makeReq('Basic sometoken');
    const res = makeRes();
    await authRequired(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Bearer token is missing', async () => {
    const req = makeReq('Bearer ');
    const res = makeRes();
    // jwt.verify would throw but we check the split first
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    await authRequired(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when jwt.verify throws', async () => {
    const req = makeReq('Bearer badtoken');
    const res = makeRes();
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });
    await authRequired(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when user not found in DB', async () => {
    const req = makeReq('Bearer validtoken');
    const res = makeRes();
    jwt.verify.mockReturnValue({ sub: 'user123' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await authRequired(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur introuvable' });
  });

  it('returns 403 when user is BLOCKED', async () => {
    const req = makeReq('Bearer validtoken');
    const res = makeRes();
    jwt.verify.mockReturnValue({ sub: 'user123' });
    const mockUser = { _id: 'user123', status: 'BLOCKED' };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
    await authRequired(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Le compte est bloqué' });
  });

  it('calls next() and sets req.user when token is valid', async () => {
    const req = makeReq('Bearer validtoken');
    const res = makeRes();
    jwt.verify.mockReturnValue({ sub: 'user123' });
    const mockUser = { _id: 'user123', status: 'ACTIVE' };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
    await authRequired(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBe(mockUser);
    expect(req.user.id).toBe('user123');
    expect(req.user.sub).toBe('user123');
  });
});

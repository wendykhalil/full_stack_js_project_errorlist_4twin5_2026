'use strict';

const { requireRoles } = require('../../src/middleware/roleMiddleware');

function makeRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

describe('roleMiddleware – requireRoles', () => {
  const next = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when req.user is undefined', () => {
    const mw = requireRoles('ADMIN');
    const req = {};
    const res = makeRes();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Non autorisé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user.role is undefined', () => {
    const mw = requireRoles('ADMIN');
    const req = { user: {} };
    const res = makeRes();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when role is not in allowed list', () => {
    const mw = requireRoles('ADMIN', 'SUPPLIER');
    const req = { user: { role: 'ARTISAN' } };
    const res = makeRes();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès interdit' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when role is allowed', () => {
    const mw = requireRoles('ADMIN', 'SUPPLIER');
    const req = { user: { role: 'SUPPLIER' } };
    const res = makeRes();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for ADMIN role', () => {
    const mw = requireRoles('ADMIN');
    const req = { user: { role: 'ADMIN' } };
    const res = makeRes();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('handles single allowed role correctly', () => {
    const mw = requireRoles('ARTISAN');
    const req = { user: { role: 'PRESCRIPTEUR' } };
    const res = makeRes();
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

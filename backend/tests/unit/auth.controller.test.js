'use strict';
/**
 * Unit tests for auth.controller.js
 */

jest.mock('../../src/modules/auth/auth.service');
jest.mock('../../src/models/AuthLog');
jest.mock('../../src/models/ActivityLog');
jest.mock('../../src/utils/notify');
jest.mock('../../src/socket');
jest.mock('../../src/utils/ipGeo', () => ({
  lookupIpGeo: jest.fn().mockResolvedValue({ country: 'TN', countryCode: 'TN' }),
  isPrivateOrLocal: jest.fn().mockReturnValue(true),
}));
jest.mock('../../src/config/cloudinary', () => ({
  uploadBufferToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'http://cloud.com/img.jpg' }),
}));

const httpMocks = require('node-mocks-http');
const authService = require('../../src/modules/auth/auth.service');
const AuthLog = require('../../src/models/AuthLog');
const ActivityLog = require('../../src/models/ActivityLog');
const ctrl = require('../../src/modules/auth/auth.controller');

AuthLog.create = jest.fn().mockResolvedValue(true);
ActivityLog.create = jest.fn().mockResolvedValue(true);

function req(overrides = {}) {
  return httpMocks.createRequest({
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: {},
    files: {},
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('auth.controller — register', () => {
  it('returns 201 on success', async () => {
    authService.register.mockResolvedValue({ user: { _id: 'u1', email: 'a@b.com' }, devLink: null });
    const r = res();
    await ctrl.register(req({ body: { email: 'a@b.com', password: 'pass', role: 'ARTISAN', firstName: 'A', lastName: 'B' } }), r, next);
    expect(r.statusCode).toBe(201);
  });

  it('calls next on error', async () => {
    authService.register.mockRejectedValue(Object.assign(new Error('Email taken'), { statusCode: 409 }));
    await ctrl.register(req({ body: {} }), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('auth.controller — login', () => {
  it('returns token on success', async () => {
    authService.login.mockResolvedValue({ token: 'tok', user: { _id: 'u1', email: 'a@b.com' } });
    const r = res();
    await ctrl.login(req({ body: { email: 'a@b.com', password: 'pass' } }), r, next);
    expect(r._getJSONData().token).toBe('tok');
  });

  it('calls next on error', async () => {
    authService.login.mockRejectedValue(Object.assign(new Error('Invalid'), { statusCode: 401 }));
    await ctrl.login(req({ body: {} }), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('auth.controller — me', () => {
  it('returns user', async () => {
    authService.me.mockResolvedValue({ _id: 'u1', email: 'a@b.com' });
    const r = res();
    await ctrl.me(req({ user: { _id: 'u1' } }), r, next);
    expect(r._getJSONData().user).toBeDefined();
  });
});

describe('auth.controller — updateProfile', () => {
  it('updates profile without files', async () => {
    authService.updateProfile.mockResolvedValue({ ok: true, user: { _id: 'u1' } });
    const r = res();
    await ctrl.updateProfile(req({ user: { _id: 'u1' }, body: { firstName: 'Bob' }, files: {} }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });

  it('uploads profile picture to cloudinary', async () => {
    const { uploadBufferToCloudinary } = require('../../src/config/cloudinary');
    authService.updateProfile.mockResolvedValue({ ok: true, user: { _id: 'u1' } });
    const r = res();
    await ctrl.updateProfile(req({
      user: { _id: 'u1' },
      body: {},
      files: { profilePicture: [{ buffer: Buffer.from('img'), mimetype: 'image/jpeg' }] },
    }), r, next);
    expect(uploadBufferToCloudinary).toHaveBeenCalled();
  });
});

describe('auth.controller — changePassword', () => {
  it('changes password successfully', async () => {
    authService.changePassword.mockResolvedValue({ ok: true });
    const r = res();
    await ctrl.changePassword(req({ user: { _id: 'u1' }, body: { currentPassword: 'old', newPassword: 'new123' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — forgotPassword', () => {
  it('sends reset link', async () => {
    authService.forgotPassword.mockResolvedValue({ ok: true, message: 'Sent' });
    const r = res();
    await ctrl.forgotPassword(req({ body: { email: 'a@b.com' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — verifyEmail', () => {
  it('verifies email', async () => {
    authService.verifyEmail.mockResolvedValue({ ok: true, message: 'Verified' });
    const r = res();
    await ctrl.verifyEmail(req({ query: { token: 'tok123' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — googleLogin', () => {
  it('logs in with Google', async () => {
    authService.googleLogin.mockResolvedValue({ token: 'tok', user: { _id: 'u1', email: 'a@b.com' }, needsRole: false });
    const r = res();
    await ctrl.googleLogin(req({ body: { credential: 'google-cred' } }), r, next);
    expect(r._getJSONData().token).toBe('tok');
  });

  it('calls next on error', async () => {
    authService.googleLogin.mockRejectedValue(Object.assign(new Error('Invalid'), { statusCode: 400 }));
    await ctrl.googleLogin(req({ body: {} }), res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('auth.controller — logout', () => {
  it('logs out successfully', async () => {
    const r = res();
    await ctrl.logout(req({ user: { _id: 'u1' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — resendVerification', () => {
  it('resends verification email', async () => {
    authService.resendVerification.mockResolvedValue({ ok: true, message: 'Sent' });
    const r = res();
    await ctrl.resendVerification(req({ body: { email: 'a@b.com' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — resetPassword', () => {
  it('resets password', async () => {
    authService.resetPassword.mockResolvedValue({ ok: true, message: 'Updated' });
    const r = res();
    await ctrl.resetPassword(req({ body: { token: 'tok', newPassword: 'newpass123' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — phoneStart', () => {
  it('starts phone verification', async () => {
    authService.phoneStart.mockResolvedValue({ ok: true, message: 'SMS sent' });
    const r = res();
    await ctrl.phoneStart(req({ body: { phone: '+21612345678' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

describe('auth.controller — phoneVerify', () => {
  it('verifies phone code', async () => {
    authService.phoneVerify.mockResolvedValue({ token: 'tok', user: { _id: 'u1' } });
    const r = res();
    await ctrl.phoneVerify(req({ body: { phone: '+21612345678', code: '123456' } }), r, next);
    expect(r._getJSONData().token).toBe('tok');
  });
});

describe('auth.controller — setRole', () => {
  it('sets role', async () => {
    authService.setRole.mockResolvedValue({ ok: true, token: 'tok', user: { _id: 'u1', role: 'ARTISAN' } });
    const r = res();
    await ctrl.setRole(req({ user: { _id: 'u1' }, body: { role: 'ARTISAN' } }), r, next);
    expect(r._getJSONData().ok).toBe(true);
  });
});

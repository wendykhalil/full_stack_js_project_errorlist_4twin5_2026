'use strict';
/**
 * Extended unit tests for auth.service.js
 * Covers: register, login, verifyEmail, resendVerification,
 *         googleLogin, updateProfile, changePassword, forgotPassword,
 *         resetPassword, phoneStart, phoneVerify, setRole
 */

jest.mock('../../src/models/User');
jest.mock('../../src/models/SupplierProfile');
jest.mock('../../src/utils/email');
jest.mock('../../src/utils/twilioVerify');
jest.mock('google-auth-library');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User           = require('../../src/models/User');
const SupplierProfile = require('../../src/models/SupplierProfile');
const { sendMail, isEmailConfigured } = require('../../src/utils/email');
const { startPhoneVerification, checkPhoneVerification } = require('../../src/utils/twilioVerify');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const authService = require('../../src/modules/auth/auth.service');

// ─── helpers ────────────────────────────────────────────────────────────────
function makeUser(overrides = {}) {
  const base = {
    _id: 'user123',
    firstName: 'Alice',
    lastName: 'Dupont',
    email: 'alice@example.com',
    password: 'hashed',
    phone: '+21612345678',
    role: 'ARTISAN',
    status: 'ACTIVE',
    emailVerified: true,
    authProvider: 'LOCAL',
    blockedUntil: null,
    supplierProfile: null,
    city: '',
    zone: '',
    location: { lat: null, lng: null },
    toObject() { return { ...this }; },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
  return base;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.APP_BASE_URL = 'http://localhost:5173';
  jwt.sign.mockReturnValue('mock-token');
  bcrypt.hash.mockResolvedValue('hashed-password');
  bcrypt.compare.mockResolvedValue(true);
  isEmailConfigured.mockReturnValue(false);
});

// ─── register ───────────────────────────────────────────────────────────────
describe('authService.register', () => {
  it('throws 400 for invalid role', async () => {
    await expect(authService.register({ role: 'HACKER', email: 'x@x.com', password: 'pass', firstName: 'A', lastName: 'B' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for ADMIN role', async () => {
    await expect(authService.register({ role: 'ADMIN', email: 'x@x.com', password: 'pass', firstName: 'A', lastName: 'B' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 if email already exists', async () => {
    User.findOne.mockResolvedValue(makeUser());
    await expect(authService.register({ role: 'ARTISAN', email: 'alice@example.com', password: 'pass', firstName: 'A', lastName: 'B' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates user and returns devLink when email not configured', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ emailVerified: false }));
    const result = await authService.register({ role: 'ARTISAN', email: 'new@example.com', password: 'pass', firstName: 'A', lastName: 'B' });
    expect(result.user).toBeDefined();
    expect(result.devLink).toMatch(/verify-email/);
  });

  it('sends verification email when email is configured', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ emailVerified: false }));
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue(true);
    const result = await authService.register({ role: 'ARTISAN', email: 'new@example.com', password: 'pass', firstName: 'A', lastName: 'B' });
    expect(sendMail).toHaveBeenCalled();
    expect(result.devLink).toBeNull();
  });
});

// ─── login ───────────────────────────────────────────────────────────────────
describe('authService.login', () => {
  it('throws 401 for empty identifier', async () => {
    await expect(authService.login({ email: '', password: 'x' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.login({ email: 'nobody@x.com', password: 'x' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 400 if user has no password (Google account)', async () => {
    User.findOne.mockResolvedValue(makeUser({ password: null }));
    await expect(authService.login({ email: 'alice@example.com', password: 'x' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 401 for wrong password', async () => {
    User.findOne.mockResolvedValue(makeUser());
    bcrypt.compare.mockResolvedValue(false);
    await expect(authService.login({ email: 'alice@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 403 if email not verified (non-phone login)', async () => {
    User.findOne.mockResolvedValue(makeUser({ emailVerified: false }));
    await expect(authService.login({ email: 'alice@example.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 if account is blocked', async () => {
    User.findOne.mockResolvedValue(makeUser({ status: 'BLOCKED', blockedUntil: new Date(Date.now() + 99999) }));
    await expect(authService.login({ email: 'alice@example.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('unblocks user if blockedUntil has passed', async () => {
    const user = makeUser({ status: 'BLOCKED', blockedUntil: new Date(Date.now() - 1000) });
    User.findOne.mockResolvedValue(user);
    const result = await authService.login({ email: 'alice@example.com', password: 'pass' });
    expect(result.token).toBe('mock-token');
    expect(user.save).toHaveBeenCalled();
  });

  it('returns token and user on success', async () => {
    User.findOne.mockResolvedValue(makeUser());
    const result = await authService.login({ email: 'alice@example.com', password: 'pass' });
    expect(result.token).toBe('mock-token');
    expect(result.user.password).toBeUndefined();
  });

  it('allows phone login even if email not verified', async () => {
    User.findOne.mockResolvedValue(makeUser({ emailVerified: false }));
    const result = await authService.login({ email: '+21612345678', password: 'pass' });
    expect(result.token).toBe('mock-token');
  });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────
describe('authService.verifyEmail', () => {
  it('throws 400 if token missing', async () => {
    await expect(authService.verifyEmail({ token: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 if token invalid or expired', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.verifyEmail({ token: 'bad-token' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('verifies email and clears token', async () => {
    const user = makeUser({ emailVerified: false, emailVerificationTokenHash: 'hash', emailVerificationTokenExpiresAt: new Date(Date.now() + 9999) });
    User.findOne.mockResolvedValue(user);
    const result = await authService.verifyEmail({ token: 'valid-token' });
    expect(result.ok).toBe(true);
    expect(user.emailVerified).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });
});

// ─── resendVerification ───────────────────────────────────────────────────────
describe('authService.resendVerification', () => {
  it('throws 400 if email missing', async () => {
    await expect(authService.resendVerification({ email: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns ok silently if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    const result = await authService.resendVerification({ email: 'nobody@x.com' });
    expect(result.ok).toBe(true);
  });

  it('returns ok if already verified', async () => {
    User.findOne.mockResolvedValue(makeUser({ emailVerified: true }));
    const result = await authService.resendVerification({ email: 'alice@example.com' });
    expect(result.ok).toBe(true);
  });

  it('sends email and returns devLink when not configured', async () => {
    const user = makeUser({ emailVerified: false });
    User.findOne.mockResolvedValue(user);
    const result = await authService.resendVerification({ email: 'alice@example.com' });
    expect(result.devLink).toMatch(/verify-email/);
    expect(user.save).toHaveBeenCalled();
  });
});

// ─── changePassword ───────────────────────────────────────────────────────────
describe('authService.changePassword', () => {
  it('throws 404 if user not found', async () => {
    User.findById.mockResolvedValue(null);
    await expect(authService.changePassword('uid', { currentPassword: 'old', newPassword: 'newpass' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 if new password too short', async () => {
    User.findById.mockResolvedValue(makeUser());
    await expect(authService.changePassword('uid', { currentPassword: 'old', newPassword: '123' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 401 if current password wrong', async () => {
    User.findById.mockResolvedValue(makeUser());
    bcrypt.compare.mockResolvedValue(false);
    await expect(authService.changePassword('uid', { currentPassword: 'wrong', newPassword: 'newpass123' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('changes password successfully', async () => {
    const user = makeUser();
    User.findById.mockResolvedValue(user);
    const result = await authService.changePassword('uid', { currentPassword: 'old', newPassword: 'newpass123' });
    expect(result.ok).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });
});

// ─── forgotPassword ───────────────────────────────────────────────────────────
describe('authService.forgotPassword', () => {
  it('throws 400 if email missing', async () => {
    await expect(authService.forgotPassword({ email: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns ok silently if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    const result = await authService.forgotPassword({ email: 'nobody@x.com' });
    expect(result.ok).toBe(true);
  });

  it('returns ok silently if user not active', async () => {
    User.findOne.mockResolvedValue(makeUser({ status: 'INACTIVE' }));
    const result = await authService.forgotPassword({ email: 'alice@example.com' });
    expect(result.ok).toBe(true);
  });

  it('saves reset token and returns devLink when email not configured', async () => {
    const user = makeUser();
    User.findOne.mockResolvedValue(user);
    const result = await authService.forgotPassword({ email: 'alice@example.com' });
    expect(result.ok).toBe(true);
    expect(result.devLink).toMatch(/reset-password/);
    expect(user.save).toHaveBeenCalled();
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────
describe('authService.resetPassword', () => {
  it('throws 400 if token missing', async () => {
    await expect(authService.resetPassword({ token: '', newPassword: 'newpass123' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 if new password too short', async () => {
    await expect(authService.resetPassword({ token: 'tok', newPassword: '123' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 if token invalid or expired', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.resetPassword({ token: 'bad', newPassword: 'newpass123' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('resets password successfully', async () => {
    const user = makeUser();
    User.findOne.mockResolvedValue(user);
    const result = await authService.resetPassword({ token: 'valid', newPassword: 'newpass123' });
    expect(result.ok).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });
});

// ─── setRole ──────────────────────────────────────────────────────────────────
describe('authService.setRole', () => {
  it('throws 400 for invalid role', async () => {
    await expect(authService.setRole('uid', { role: 'HACKER' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for ADMIN role', async () => {
    await expect(authService.setRole('uid', { role: 'ADMIN' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 if user not found', async () => {
    User.findById.mockResolvedValue(null);
    await expect(authService.setRole('uid', { role: 'ARTISAN' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('sets role and returns token', async () => {
    const user = makeUser({ role: 'REGISTER_ROLE' });
    User.findById.mockResolvedValue(user);
    const result = await authService.setRole('uid', { role: 'ARTISAN' });
    expect(result.ok).toBe(true);
    expect(result.token).toBe('mock-token');
    expect(user.role).toBe('ARTISAN');
  });
});

// ─── phoneStart ───────────────────────────────────────────────────────────────
describe('authService.phoneStart', () => {
  it('throws 400 if phone missing', async () => {
    await expect(authService.phoneStart({ phone: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 if phone not found', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.phoneStart({ phone: '+21600000000' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if user blocked', async () => {
    User.findOne.mockResolvedValue(makeUser({ status: 'BLOCKED', blockedUntil: new Date(Date.now() + 99999) }));
    await expect(authService.phoneStart({ phone: '+21612345678' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('sends SMS and returns ok', async () => {
    User.findOne.mockResolvedValue(makeUser());
    startPhoneVerification.mockResolvedValue(true);
    const result = await authService.phoneStart({ phone: '+21612345678' });
    expect(result.ok).toBe(true);
  });
});

// ─── phoneVerify ──────────────────────────────────────────────────────────────
describe('authService.phoneVerify', () => {
  it('throws 400 if phone or code missing', async () => {
    await expect(authService.phoneVerify({ phone: '', code: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.phoneVerify({ phone: '+21600000000', code: '123456' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 401 if code invalid', async () => {
    User.findOne.mockResolvedValue(makeUser());
    checkPhoneVerification.mockResolvedValue({ status: 'pending' });
    await expect(authService.phoneVerify({ phone: '+21612345678', code: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns token on success', async () => {
    User.findOne.mockResolvedValue(makeUser());
    checkPhoneVerification.mockResolvedValue({ status: 'approved' });
    const result = await authService.phoneVerify({ phone: '+21612345678', code: '123456' });
    expect(result.token).toBe('mock-token');
  });

  it('returns needsRole=true for REGISTER_ROLE user', async () => {
    User.findOne.mockResolvedValue(makeUser({ role: 'REGISTER_ROLE' }));
    checkPhoneVerification.mockResolvedValue({ status: 'approved' });
    const result = await authService.phoneVerify({ phone: '+21612345678', code: '123456' });
    expect(result.needsRole).toBe(true);
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────
describe('authService.updateProfile', () => {
  it('throws 404 if user not found', async () => {
    User.findById.mockResolvedValue(null);
    await expect(authService.updateProfile('uid', { firstName: 'Bob' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates basic fields for non-supplier', async () => {
    const user = makeUser();
    const updatedUser = { ...user, toObject() { return { ...user }; } };
    User.findById
      .mockResolvedValueOnce(user)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedUser) });
    await authService.updateProfile('uid', { firstName: 'Bob', city: 'Tunis', latitude: '36.8', longitude: '10.1' });
    expect(user.save).toHaveBeenCalled();
  });

  it('creates supplier profile if not exists', async () => {
    const user = makeUser({ role: 'SUPPLIER', supplierProfile: null });
    const updatedUser = { ...user, toObject() { return { ...user }; } };
    User.findById
      .mockResolvedValueOnce(user)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedUser) });
    SupplierProfile.findOne.mockResolvedValue(null);
    const newProfile = { _id: 'sp1', save: jest.fn().mockResolvedValue(true) };
    SupplierProfile.mockImplementation(() => newProfile);
    await authService.updateProfile('uid', { companyName: 'ACME' });
    expect(newProfile.save).toHaveBeenCalled();
  });
});

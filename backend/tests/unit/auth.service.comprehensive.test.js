'use strict';
jest.mock('../../src/models/User');
jest.mock('../../src/models/SupplierProfile');
jest.mock('../../src/utils/email');
jest.mock('../../src/utils/twilioVerify');
jest.mock('google-auth-library');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User            = require('../../src/models/User');
const SupplierProfile = require('../../src/models/SupplierProfile');
const { sendMail, isEmailConfigured } = require('../../src/utils/email');
const { startPhoneVerification, checkPhoneVerification } = require('../../src/utils/twilioVerify');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const authService = require('../../src/modules/auth/auth.service');

function makeUser(overrides = {}) {
  return {
    _id: 'u1', firstName: 'Alice', lastName: 'Dupont',
    email: 'alice@example.com', password: 'hashed', phone: '+21612345678',
    role: 'ARTISAN', status: 'ACTIVE', emailVerified: true,
    authProvider: 'LOCAL', blockedUntil: null, supplierProfile: null,
    city: '', zone: '', location: { lat: null, lng: null },
    toObject() { return { ...this }; },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
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

// ─── register edge cases ──────────────────────────────────────────────────────
describe('authService.register — edge cases', () => {
  it('sends email when configured', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ emailVerified: false }));
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue(true);
    const result = await authService.register({ role: 'ARTISAN', email: 'new@test.com', password: 'pass', firstName: 'A', lastName: 'B' });
    expect(sendMail).toHaveBeenCalled();
    expect(result.devLink).toBeNull();
  });

  it('registers PRESCRIPTEUR role', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ role: 'PRESCRIPTEUR', emailVerified: false }));
    const result = await authService.register({ role: 'PRESCRIPTEUR', email: 'p@test.com', password: 'pass', firstName: 'P', lastName: 'R' });
    expect(result.user).toBeDefined();
  });

  it('registers SUPPLIER role', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ role: 'SUPPLIER', emailVerified: false }));
    const result = await authService.register({ role: 'SUPPLIER', email: 's@test.com', password: 'pass', firstName: 'S', lastName: 'U' });
    expect(result.user).toBeDefined();
  });
});

// ─── login edge cases ─────────────────────────────────────────────────────────
describe('authService.login — edge cases', () => {
  it('throws 403 for inactive account', async () => {
    User.findOne.mockResolvedValue(makeUser({ status: 'INACTIVE' }));
    await expect(authService.login({ email: 'alice@example.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows login by phone number', async () => {
    User.findOne.mockResolvedValue(makeUser());
    const result = await authService.login({ email: '+21612345678', password: 'pass' });
    expect(result.token).toBe('mock-token');
  });
});

// ─── googleLogin ──────────────────────────────────────────────────────────────
describe('authService.googleLogin', () => {
  it('throws 500 when GOOGLE_CLIENT_ID not set', async () => {
    const orig = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    await expect(authService.googleLogin({ credential: 'cred' }))
      .rejects.toMatchObject({ statusCode: 500 });
    process.env.GOOGLE_CLIENT_ID = orig;
  });

  it('creates new user on first Google login', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    const mockClient = {
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: 'google@test.com',
          email_verified: true,
          sub: 'google-sub-123',
          given_name: 'Google',
          family_name: 'User',
        }),
      }),
    };
    OAuth2Client.mockImplementation(() => mockClient);
    User.findOne.mockResolvedValue(null);
    const newUser = makeUser({ role: 'REGISTER_ROLE', email: 'google@test.com', authProvider: 'GOOGLE' });
    User.create.mockResolvedValue(newUser);
    const result = await authService.googleLogin({ credential: 'google-cred' });
    expect(result.token).toBe('mock-token');
    expect(result.needsRole).toBe(true);
  });

  it('logs in existing Google user', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    const mockClient = {
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: 'existing@test.com',
          email_verified: true,
          sub: 'sub-456',
        }),
      }),
    };
    OAuth2Client.mockImplementation(() => mockClient);
    const existingUser = makeUser({ email: 'existing@test.com', authProvider: 'GOOGLE', role: 'ARTISAN' });
    User.findOne.mockResolvedValue(existingUser);
    const result = await authService.googleLogin({ credential: 'google-cred' });
    expect(result.token).toBe('mock-token');
  });
});

// ─── updateProfile — supplier ─────────────────────────────────────────────────
describe('authService.updateProfile — supplier', () => {
  it('updates existing supplier profile', async () => {
    const user = makeUser({ role: 'SUPPLIER', supplierProfile: 'sp1' });
    const updatedUser = { ...user, toObject() { return { ...user }; } };
    User.findById
      .mockResolvedValueOnce(user)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedUser) });
    const existingProfile = {
      _id: 'sp1', companyName: 'Old', save: jest.fn().mockResolvedValue(true)
    };
    SupplierProfile.findOne.mockResolvedValue(existingProfile);
    await authService.updateProfile('u1', { companyName: 'New Corp', categories: ['c1'] });
    expect(existingProfile.save).toHaveBeenCalled();
    expect(existingProfile.companyName).toBe('New Corp');
  });

  it('parses categories from JSON string', async () => {
    const user = makeUser({ role: 'SUPPLIER' });
    const updatedUser = { ...user, toObject() { return { ...user }; } };
    User.findById
      .mockResolvedValueOnce(user)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedUser) });
    SupplierProfile.findOne.mockResolvedValue(null);
    const newProfile = { _id: 'sp1', save: jest.fn().mockResolvedValue(true) };
    SupplierProfile.mockImplementation(() => newProfile);
    await authService.updateProfile('u1', { categories: '["c1","c2"]' });
    expect(newProfile.save).toHaveBeenCalled();
  });

  it('saves location fields for non-supplier', async () => {
    const user = makeUser({ role: 'PRESCRIPTEUR' });
    const updatedUser = { ...user, toObject() { return { ...user }; } };
    User.findById
      .mockResolvedValueOnce(user)
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedUser) });
    await authService.updateProfile('u1', { city: 'Tunis', latitude: '36.8', longitude: '10.1' });
    expect(user.city).toBe('Tunis');
    expect(user.location.lat).toBe(36.8);
  });
});

// ─── resendVerification ───────────────────────────────────────────────────────
describe('authService.resendVerification — edge cases', () => {
  it('sends email when configured', async () => {
    const user = makeUser({ emailVerified: false });
    User.findOne.mockResolvedValue(user);
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue(true);
    const result = await authService.resendVerification({ email: 'alice@example.com' });
    expect(sendMail).toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});

// ─── phoneStart edge cases ────────────────────────────────────────────────────
describe('authService.phoneStart — edge cases', () => {
  it('throws 403 for blocked user', async () => {
    User.findOne.mockResolvedValue(makeUser({ status: 'BLOCKED', blockedUntil: new Date(Date.now() + 99999) }));
    await expect(authService.phoneStart({ phone: '+21612345678' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── setRole edge cases ───────────────────────────────────────────────────────
describe('authService.setRole — edge cases', () => {
  it('sets PRESCRIPTEUR role', async () => {
    const user = makeUser({ role: 'REGISTER_ROLE' });
    User.findById.mockResolvedValue(user);
    const result = await authService.setRole('u1', { role: 'PRESCRIPTEUR' });
    expect(result.ok).toBe(true);
    expect(user.role).toBe('PRESCRIPTEUR');
  });

  it('sets SUPPLIER role', async () => {
    const user = makeUser({ role: 'REGISTER_ROLE' });
    User.findById.mockResolvedValue(user);
    const result = await authService.setRole('u1', { role: 'SUPPLIER' });
    expect(result.ok).toBe(true);
  });
});

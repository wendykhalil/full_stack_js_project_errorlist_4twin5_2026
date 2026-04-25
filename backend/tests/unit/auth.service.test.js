const bcrypt = require('bcryptjs');

jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/SupplierProfile', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/utils/email', () => ({
  sendMail: jest.fn(),
  isEmailConfigured: jest.fn(),
}));

jest.mock('../../src/utils/twilioVerify', () => ({
  startPhoneVerification: jest.fn(),
  checkPhoneVerification: jest.fn(),
}));

const User = require('../../src/models/User');
const emailUtils = require('../../src/utils/email');
const twilioUtils = require('../../src/utils/twilioVerify');
const authService = require('../../src/modules/auth/auth.service');

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.APP_BASE_URL = 'http://localhost:5173';
    process.env.EMAIL_VERIFY_EXPIRES_HOURS = '24';
    process.env.RESET_PWD_EXPIRES_MIN = '30';
  });

  test('register creates user and returns dev verification link when email is not configured', async () => {
    emailUtils.isEmailConfigured.mockReturnValue(false);
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => ({
      _id: 'u1',
      ...data,
      toObject() {
        return { _id: 'u1', ...data };
      },
    }));

    const result = await authService.register({
      firstName: 'Eya',
      lastName: 'Saya',
      email: 'eya@test.com',
      password: 'secret123',
      phone: '+21612345678',
      role: 'ARTISAN',
    });

    expect(User.create).toHaveBeenCalled();
    expect(result.user.email).toBe('eya@test.com');
    expect(result.user.password).toBeUndefined();
    expect(result.devLink).toContain('/verify-email?token=');
  });

  test('register rejects invalid role', async () => {
    await expect(authService.register({
      firstName: 'Eya',
      lastName: 'Saya',
      email: 'eya@test.com',
      password: 'secret123',
      phone: '+21612345678',
      role: 'CLIENT',
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('register rejects duplicate email', async () => {
    User.findOne.mockResolvedValue({ _id: 'u-existing' });

    await expect(authService.register({
      firstName: 'Eya',
      lastName: 'Saya',
      email: 'eya@test.com',
      password: 'secret123',
      phone: '+21612345678',
      role: 'ARTISAN',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('login rejects missing identifier', async () => {
    await expect(authService.login({ email: '', password: 'secret123' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  test('login rejects unverified email login', async () => {
    User.findOne.mockResolvedValue({
      _id: 'u1',
      email: 'eya@test.com',
      phone: '+21612345678',
      password: await bcrypt.hash('secret123', 1),
      emailVerified: false,
      status: 'ACTIVE',
    });

    await expect(authService.login({ email: 'eya@test.com', password: 'secret123' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('login succeeds by phone even if email is not verified', async () => {
    const user = {
      _id: 'u1',
      email: 'eya@test.com',
      phone: '+21612345678',
      password: await bcrypt.hash('secret123', 1),
      emailVerified: false,
      status: 'ACTIVE',
      role: 'ARTISAN',
      toObject() {
        return { ...this };
      },
    };
    User.findOne.mockResolvedValue(user);

    const result = await authService.login({ email: '+21612345678', password: 'secret123' });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('eya@test.com');
  });

  test('login unblocks expired blocked account and succeeds', async () => {
    const user = {
      _id: 'u1',
      email: 'eya@test.com',
      phone: '+21612345678',
      password: await bcrypt.hash('secret123', 1),
      emailVerified: true,
      status: 'BLOCKED',
      blockedUntil: new Date(Date.now() - 60_000),
      role: 'ARTISAN',
      save: jest.fn().mockResolvedValue(true),
      toObject() {
        return { ...this };
      },
    };
    User.findOne.mockResolvedValue(user);

    const result = await authService.login({ email: 'eya@test.com', password: 'secret123' });

    expect(user.save).toHaveBeenCalled();
    expect(user.status).toBe('ACTIVE');
    expect(result.token).toBeTruthy();
  });

  test('verifyEmail activates account with a valid token', async () => {
    const fakeUser = {
      emailVerified: false,
      emailVerificationTokenHash: 'hash',
      emailVerificationTokenExpiresAt: new Date(Date.now() + 10000),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(fakeUser);

    const result = await authService.verifyEmail({ token: 'plain-token' });

    expect(result.ok).toBe(true);
    expect(fakeUser.emailVerified).toBe(true);
    expect(fakeUser.save).toHaveBeenCalled();
  });

  test('verifyEmail rejects missing token', async () => {
    await expect(authService.verifyEmail({ token: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('resendVerification returns already verified message', async () => {
    User.findOne.mockResolvedValue({ emailVerified: true });

    const result = await authService.resendVerification({ email: 'eya@test.com' });

    expect(result.message).toMatch(/vérifié|verified/i);
  });

  test('resendVerification generates dev link when smtp is disabled', async () => {
    emailUtils.isEmailConfigured.mockReturnValue(false);
    const user = {
      email: 'eya@test.com',
      emailVerified: false,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(user);

    const result = await authService.resendVerification({ email: 'eya@test.com' });

    expect(user.save).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.devLink).toContain('/verify-email?token=');
  });

  test('forgotPassword returns generic success when email does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const result = await authService.forgotPassword({ email: 'missing@test.com' });

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Si cet email existe/i);
  });

  test('forgotPassword returns dev link for active existing account when email is not configured', async () => {
    emailUtils.isEmailConfigured.mockReturnValue(false);
    const user = {
      email: 'eya@test.com',
      status: 'ACTIVE',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(user);

    const result = await authService.forgotPassword({ email: 'eya@test.com' });

    expect(user.save).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.devLink).toContain('/reset-password?token=');
  });

  test('resetPassword updates password and clears reset token', async () => {
    const fakeUser = {
      password: 'old-hash',
      authProvider: 'LOCAL',
      resetPasswordTokenHash: 'old-token-hash',
      resetPasswordTokenExpiresAt: new Date(Date.now() + 10000),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(fakeUser);

    const result = await authService.resetPassword({ token: 'reset-token', newPassword: 'newpass123' });

    expect(result.ok).toBe(true);
    expect(fakeUser.resetPasswordTokenHash).toBeNull();
    expect(fakeUser.resetPasswordTokenExpiresAt).toBeNull();
    expect(fakeUser.save).toHaveBeenCalled();
  });

  test('resetPassword rejects invalid token', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(authService.resetPassword({ token: 'bad-token', newPassword: 'newpass123' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('changePassword rejects wrong current password', async () => {
    const user = {
      password: await bcrypt.hash('oldpass', 1),
    };
    User.findById.mockResolvedValue(user);

    await expect(authService.changePassword('u1', { currentPassword: 'wrong', newPassword: 'newpass123' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  test('phoneStart sends SMS when phone exists', async () => {
    User.findOne.mockResolvedValue({ status: 'ACTIVE', blockedUntil: null });
    twilioUtils.startPhoneVerification.mockResolvedValue({ sid: 'sid1', status: 'pending' });

    const result = await authService.phoneStart({ phone: '+21612345678' });

    expect(twilioUtils.startPhoneVerification).toHaveBeenCalledWith('+21612345678');
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/sms/i);
  });

  test('phoneStart rejects blocked phone account', async () => {
    User.findOne.mockResolvedValue({ status: 'BLOCKED', blockedUntil: null });

    await expect(authService.phoneStart({ phone: '+21612345678' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('phoneVerify returns token for approved code', async () => {
    const user = {
      _id: 'u1',
      phone: '+21612345678',
      role: 'ARTISAN',
      email: 'eya@test.com',
      toObject() {
        return { ...this };
      },
    };
    User.findOne.mockResolvedValue(user);
    twilioUtils.checkPhoneVerification.mockResolvedValue({ status: 'approved', valid: true });

    const result = await authService.phoneVerify({ phone: '+21612345678', code: '123456' });

    expect(result.token).toBeTruthy();
    expect(result.user.phone).toBe('+21612345678');
  });

  test('phoneVerify rejects invalid code', async () => {
    User.findOne.mockResolvedValue({ phone: '+21612345678', role: 'ARTISAN' });
    twilioUtils.checkPhoneVerification.mockResolvedValue({ status: 'pending', valid: false });

    await expect(authService.phoneVerify({ phone: '+21612345678', code: '000000' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });
});

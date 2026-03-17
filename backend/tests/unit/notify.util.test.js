jest.mock('../../src/utils/email', () => ({
  sendMail: jest.fn(),
  isEmailConfigured: jest.fn(),
}));

jest.mock('../../src/socket', () => ({
  notifyUser: jest.fn(),
  notifyAdmins: jest.fn(),
}));

const { sendMail, isEmailConfigured } = require('../../src/utils/email');
const socket = require('../../src/socket');
const { notify } = require('../../src/utils/notify');

describe('notify util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NOTIFY_EMAILS = 'admin1@test.com,admin2@test.com';
  });

  test('emits realtime notification to admins', async () => {
    isEmailConfigured.mockReturnValue(false);

    const result = await notify({
      toAdmins: true,
      payload: { type: 'activity', title: 'Activity', message: 'Profile updated' },
      sendEmail: false,
    });

    expect(result.ok).toBe(true);
    expect(socket.notifyAdmins).toHaveBeenCalled();
  });

  test('sends email notification when smtp is configured', async () => {
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue(true);

    await notify({
      userId: 'u1',
      payload: {
        type: 'activity',
        title: 'Reset password',
        message: 'User reset password',
        meta: { action: 'RESET', details: '<unsafe>' },
      },
      sendEmail: true,
    });

    expect(socket.notifyUser).toHaveBeenCalledWith('u1', expect.any(Object));
    expect(sendMail).toHaveBeenCalled();

    const mailArgs = sendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe('admin1@test.com,admin2@test.com');
    expect(mailArgs.subject).toContain('Reset password');
    expect(mailArgs.text).toContain('Meta:');
    expect(mailArgs.html).toContain('Details');
    expect(mailArgs.html).toContain('&lt;unsafe&gt;');
  });

  test('uses explicit emailTo list and skips email when disabled', async () => {
    isEmailConfigured.mockReturnValue(true);

    const result = await notify({
      userId: 'u2',
      payload: { type: 'project', title: 'Project updated', message: 'Budget changed' },
      emailTo: ['owner@test.com'],
      sendEmail: false,
    });

    expect(result.ok).toBe(true);
    expect(socket.notifyUser).toHaveBeenCalledWith('u2', expect.any(Object));
    expect(sendMail).not.toHaveBeenCalled();
  });
});

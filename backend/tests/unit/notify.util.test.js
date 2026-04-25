jest.mock('../../src/models/Notification', () => ({
  create: jest.fn(),
}));

jest.mock('../../src/socket', () => ({
  notifyUser: jest.fn(),
  notifyAdmins: jest.fn(),
}));

const Notification = require('../../src/models/Notification');
const socket = require('../../src/socket');
const { notify } = require('../../src/utils/notify');

describe('notify util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('persists and emits realtime notification to a user', async () => {
    Notification.create.mockResolvedValue({
      _id: 'n1',
      userId: '507f1f77bcf86cd799439011',
      type: 'GENERAL',
      title: 'Activity',
      message: 'Profile updated',
      link: '/admin/activity',
      createdAt: new Date('2026-01-01'),
    });

    const result = await notify({
      userId: '507f1f77bcf86cd799439011',
      type: 'GENERAL',
      title: 'Activity',
      message: 'Profile updated',
      link: '/admin/activity',
    });

    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: '507f1f77bcf86cd799439011',
      type: 'GENERAL',
      title: 'Activity',
      message: 'Profile updated',
      link: '/admin/activity',
    }));
    expect(socket.notifyUser).toHaveBeenCalledWith('507f1f77bcf86cd799439011', expect.objectContaining({
      _id: 'n1',
      title: 'Activity',
      read: false,
    }));
    expect(result._id).toBe('n1');
  });

  test('returns undefined and does not throw when notification persistence fails', async () => {
    Notification.create.mockRejectedValue(new Error('DB error'));

    await expect(notify({
      userId: '507f1f77bcf86cd799439011',
      title: 'Broken notification',
    })).resolves.toBeUndefined();

    expect(socket.notifyUser).not.toHaveBeenCalled();
  });
});

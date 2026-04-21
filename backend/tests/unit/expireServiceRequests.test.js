jest.mock('../../src/models/ServiceRequest', () => ({
  updateMany: jest.fn(),
}));

const ServiceRequest = require('../../src/models/ServiceRequest');
const { expireServiceRequests } = require('../../src/jobs/expireServiceRequests');

describe('expireServiceRequests job', () => {
  beforeEach(() => jest.clearAllMocks());

  test('cancels OPEN requests with past deadline', async () => {
    ServiceRequest.updateMany.mockResolvedValue({ modifiedCount: 3 });
    await expireServiceRequests();
    expect(ServiceRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'OPEN', deadline: expect.objectContaining({ $lt: expect.any(Date), $ne: null }) }),
      { $set: { status: 'CANCELLED' } }
    );
  });

  test('does nothing when no requests are expired', async () => {
    ServiceRequest.updateMany.mockResolvedValue({ modifiedCount: 0 });
    await expireServiceRequests();
    expect(ServiceRequest.updateMany).toHaveBeenCalledTimes(1);
  });

  test('handles DB errors gracefully without throwing', async () => {
    ServiceRequest.updateMany.mockRejectedValue(new Error('DB error'));
    await expect(expireServiceRequests()).resolves.toBeUndefined();
  });
});

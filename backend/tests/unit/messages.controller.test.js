const httpMocks = require('node-mocks-http');

jest.mock('../../src/modules/messages/messages.service', () => ({
  sendDirectMessage: jest.fn(),
  getConversation: jest.fn(),
  getRecentConversations: jest.fn(),
  getOrderMessages: jest.fn(),
  markAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
}));

const service = require('../../src/modules/messages/messages.service');
const controller = require('../../src/modules/messages/messages.controller');

describe('messages.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendDirectMessage merges uploaded files and body attachments and uses req.user.id fallback', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        receiverId: 'u2',
        content: '',
        attachments: JSON.stringify([
          {
            url: '/uploads/messages/existing.pdf',
            filename: 'existing.pdf',
            storedFilename: 'existing.pdf',
            type: 'application/pdf',
            size: 55,
          },
        ]),
      },
    });
    req.user = { id: 'u1' };
    req.files = [
      {
        filename: '171-file.pdf',
        originalname: 'file.pdf',
        mimetype: 'application/pdf',
        size: 101,
      },
    ];
    const res = httpMocks.createResponse();

    service.sendDirectMessage.mockResolvedValue({ _id: 'm1', attachments: [] });

    await controller.sendDirectMessage(req, res);

    expect(service.sendDirectMessage).toHaveBeenCalledWith({
      senderId: 'u1',
      receiverId: 'u2',
      content: '',
      attachments: [
        expect.objectContaining({ filename: 'existing.pdf', type: 'application/pdf' }),
        expect.objectContaining({ filename: 'file.pdf', storedFilename: '171-file.pdf', type: 'application/pdf' }),
      ],
    });
    expect(res.statusCode).toBe(201);
  });
});

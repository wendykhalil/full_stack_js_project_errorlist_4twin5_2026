jest.mock('../../src/models/Message', () => {
  function Message(doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
    this.populate = jest.fn().mockResolvedValue(this);
  }
  Message.find = jest.fn();
  Message.updateMany = jest.fn();
  Message.findById = jest.fn();
  Message.countDocuments = jest.fn();
  return Message;
});

jest.mock('../../src/models/Order', () => ({
  findById: jest.fn(),
}));

const Message = require('../../src/models/Message');
const service = require('../../src/modules/messages/messages.service');

describe('messages.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendDirectMessage persists attachments', async () => {
    const result = await service.sendDirectMessage({
      senderId: 'u1',
      receiverId: 'u2',
      content: 'Bonjour',
      attachments: [{ filename: 'doc.pdf', url: '/uploads/messages/doc.pdf', type: 'application/pdf' }],
    });

    expect(result.attachments).toHaveLength(1);
    expect(result.save).toHaveBeenCalled();
  });


  test('sendDirectMessage normalizes attachment payloads received as a JSON string', async () => {
    const result = await service.sendDirectMessage({
      senderId: 'u1',
      receiverId: 'u2',
      content: '',
      attachments: JSON.stringify([
        {
          filename: 'voice.webm',
          url: '/uploads/messages/voice.webm',
          storedFilename: 'voice.webm',
          type: 'audio/webm',
          size: 123,
        },
      ]),
    });

    expect(result.content).toBe('Pièce jointe');
    expect(result.attachments).toEqual([
      expect.objectContaining({
        filename: 'voice.webm',
        url: '/uploads/messages/voice.webm',
        storedFilename: 'voice.webm',
        type: 'audio/webm',
        size: 123,
      }),
    ]);
    expect(result.save).toHaveBeenCalled();
  });

  test('getConversation marks unread incoming messages as read before loading', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      then: undefined,
    };
    chain.populate
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce([{ _id: 'm1', createdAt: '2026-03-18T00:00:00Z' }]);
    Message.find.mockReturnValue(chain);
    Message.updateMany.mockResolvedValue({ modifiedCount: 2 });

    const result = await service.getConversation('u1', 'u2', 1, 20);

    expect(Message.updateMany).toHaveBeenCalledWith(
      { senderId: 'u2', receiverId: 'u1', read: false },
      { $set: { read: true, readAt: expect.any(Date) } }
    );
    expect(result).toHaveLength(1);
  });
});

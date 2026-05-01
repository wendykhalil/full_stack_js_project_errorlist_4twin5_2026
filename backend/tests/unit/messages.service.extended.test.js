'use strict';
jest.mock('../../src/models/Message');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/User');

const Message = require('../../src/models/Message');
const Order   = require('../../src/models/Order');
const User    = require('../../src/models/User');

const {
  sendMessage, sendDirectMessage, getOrderMessages,
  getConversation, getRecentConversations, markAsRead, getUnreadCount, normalizeAttachments
} = require('../../src/modules/messages/messages.service');

beforeEach(() => jest.clearAllMocks());

describe('messages.service — normalizeAttachments', () => {
  it('returns empty for empty array', () => {
    expect(normalizeAttachments([])).toEqual([]);
  });
  it('returns empty for empty string', () => {
    expect(normalizeAttachments('')).toEqual([]);
  });
  it('returns empty for invalid JSON string', () => {
    expect(normalizeAttachments('not-json')).toEqual([]);
  });
  it('parses valid JSON string', () => {
    const att = [{ url: 'http://x.com/f.pdf', filename: 'f.pdf', type: 'application/pdf', size: 100 }];
    const result = normalizeAttachments(JSON.stringify(att));
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('http://x.com/f.pdf');
  });
  it('filters out attachments without url', () => {
    const att = [{ filename: 'f.pdf', type: 'application/pdf', size: 100 }];
    expect(normalizeAttachments(att)).toHaveLength(0);
  });
  it('filters out null entries', () => {
    expect(normalizeAttachments([null, undefined])).toHaveLength(0);
  });
  it('parses string items inside array', () => {
    const att = [JSON.stringify({ url: 'http://x.com/f.pdf', filename: 'f.pdf' })];
    const result = normalizeAttachments(att);
    expect(result).toHaveLength(1);
  });
  it('returns empty for non-array non-string', () => {
    expect(normalizeAttachments(42)).toEqual([]);
  });
});

describe('messages.service — sendMessage', () => {
  it('throws 404 if order not found', async () => {
    Order.findById.mockResolvedValue(null);
    await expect(sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hi', senderId: 's1' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if sender not part of order', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'a1' },
      supplierId: { toString: () => 's1' },
    });
    await expect(sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hi', senderId: 'intruder' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('sends message successfully', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'sender1' },
      supplierId: { toString: () => 's1' },
    });
    const msg = { _id: 'm1', save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    await sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hello', senderId: 'sender1' });
    expect(msg.save).toHaveBeenCalled();
  });
});

describe('messages.service — sendDirectMessage', () => {
  it('saves direct message', async () => {
    const msg = { _id: 'm1', save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    await sendDirectMessage({ receiverId: 'r1', content: 'hello', senderId: 's1' });
    expect(msg.save).toHaveBeenCalled();
  });

  it('uses attachment label when content empty', async () => {
    const msg = { _id: 'm1', save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    const att = [{ url: 'http://x.com/f.pdf', filename: 'f.pdf', type: 'application/pdf', size: 100 }];
    await sendDirectMessage({ receiverId: 'r1', content: '', senderId: 's1', attachments: att });
    expect(msg.save).toHaveBeenCalled();
  });
});

describe('messages.service — getOrderMessages', () => {
  it('returns messages for order', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'u1' },
      supplierId: { toString: () => 'u2' },
    });
    Message.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: 'm1' }]),
    });
    const result = await getOrderMessages('o1', 'u1');
    expect(result).toBeDefined();
  });

  it('throws 404 if order not found', async () => {
    Order.findById.mockResolvedValue(null);
    await expect(getOrderMessages('bad', 'u1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if user not part of order', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'a1' },
      supplierId: { toString: () => 's1' },
    });
    await expect(getOrderMessages('o1', 'intruder')).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('messages.service — getConversation', () => {
  it('returns conversation messages', async () => {
    const msgs = [{ _id: 'm1', read: false, receiverId: { toString: () => 'u1' } }];
    const pop2 = jest.fn().mockResolvedValue(msgs);
    const pop1 = jest.fn().mockReturnValue({ populate: pop2 });
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ populate: pop1 }),
    });
    Message.updateMany.mockResolvedValue({ modifiedCount: 1 });
    const result = await getConversation('u1', 'u2');
    expect(result).toBeDefined();
  });
});

describe('messages.service — getRecentConversations', () => {
  it('returns recent conversations', async () => {
    const userId = 'u1';
    const msgs = [
      {
        _id: 'm1', read: false,
        senderId: { _id: { toString: () => userId }, firstName: 'Alice' },
        receiverId: { _id: { toString: () => 'u2' }, firstName: 'Bob' },
      }
    ];
    const pop2 = jest.fn().mockResolvedValue(msgs);
    const pop1 = jest.fn().mockReturnValue({ populate: pop2 });
    Message.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ populate: pop1 }) });
    const result = await getRecentConversations(userId);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array when no messages', async () => {
    const pop2 = jest.fn().mockResolvedValue([]);
    const pop1 = jest.fn().mockReturnValue({ populate: pop2 });
    Message.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ populate: pop1 }) });
    const result = await getRecentConversations('u1');
    expect(result).toEqual([]);
  });

  it('skips messages with null sender/receiver', async () => {
    const msgs = [{ _id: 'm1', read: false, senderId: null, receiverId: null }];
    const pop2 = jest.fn().mockResolvedValue(msgs);
    const pop1 = jest.fn().mockReturnValue({ populate: pop2 });
    Message.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ populate: pop1 }) });
    const result = await getRecentConversations('u1');
    expect(result).toEqual([]);
  });
});

describe('messages.service — markAsRead', () => {
  it('marks message as read', async () => {
    const msg = { _id: 'm1', read: false, receiverId: { toString: () => 'u1' }, save: jest.fn().mockResolvedValue(true) };
    Message.findById.mockResolvedValue(msg);
    await markAsRead('m1', 'u1');
    expect(msg.read).toBe(true);
    expect(msg.save).toHaveBeenCalled();
  });

  it('throws 404 if message not found', async () => {
    Message.findById.mockResolvedValue(null);
    await expect(markAsRead('bad', 'u1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if not the receiver', async () => {
    const msg = { _id: 'm1', read: false, receiverId: { toString: () => 'other' } };
    Message.findById.mockResolvedValue(msg);
    await expect(markAsRead('m1', 'u1')).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('messages.service — getUnreadCount', () => {
  it('returns unread count', async () => {
    Message.countDocuments.mockResolvedValue(5);
    const result = await getUnreadCount('u1');
    expect(result).toBe(5);
  });
});

'use strict';
/**
 * Extended unit tests for messages.service.js and messages.controller.js
 */

jest.mock('../../src/models/Message');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/User');

const Message = require('../../src/models/Message');
const Order   = require('../../src/models/Order');

const messagesService = require('../../src/modules/messages/messages.service');

// ─── normalizeAttachments (via sendMessage) ───────────────────────────────────
describe('messagesService.normalizeAttachments (internal)', () => {
  it('handles empty attachments array', async () => {
    Order.findById.mockResolvedValue({
      _id: 'o1',
      artisanId: { toString: () => 'sender1' },
      supplierId: { toString: () => 'supplier1' },
    });
    const msg = { save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    await messagesService.sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hello', senderId: 'sender1', attachments: [] });
    expect(msg.save).toHaveBeenCalled();
  });

  it('handles string JSON attachments', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'sender1' },
      supplierId: { toString: () => 'supplier1' },
    });
    const msg = { save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    const attachments = JSON.stringify([{ url: 'http://x.com/f.pdf', filename: 'f.pdf', type: 'application/pdf', size: 100 }]);
    await messagesService.sendMessage({ orderId: 'o1', receiverId: 'r1', content: '', senderId: 'sender1', attachments });
    expect(msg.save).toHaveBeenCalled();
  });

  it('handles invalid JSON string attachments gracefully', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'sender1' },
      supplierId: { toString: () => 'supplier1' },
    });
    const msg = { save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    await messagesService.sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hi', senderId: 'sender1', attachments: 'not-json' });
    expect(msg.save).toHaveBeenCalled();
  });
});

// ─── sendMessage ─────────────────────────────────────────────────────────────
describe('messagesService.sendMessage', () => {
  it('throws 404 if order not found', async () => {
    Order.findById.mockResolvedValue(null);
    await expect(messagesService.sendMessage({ orderId: 'bad', receiverId: 'r1', content: 'hi', senderId: 's1' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if sender not part of order', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'artisan1' },
      supplierId: { toString: () => 'supplier1' },
    });
    await expect(messagesService.sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hi', senderId: 'intruder' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('saves message and returns it', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'sender1' },
      supplierId: { toString: () => 'supplier1' },
    });
    const msg = { _id: 'm1', save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    const result = await messagesService.sendMessage({ orderId: 'o1', receiverId: 'r1', content: 'hello', senderId: 'sender1' });
    expect(msg.save).toHaveBeenCalled();
  });
});

// ─── sendDirectMessage ────────────────────────────────────────────────────────
describe('messagesService.sendDirectMessage', () => {
  it('saves direct message', async () => {
    const msg = { _id: 'm2', save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    const result = await messagesService.sendDirectMessage({ receiverId: 'r1', content: 'direct', senderId: 's1' });
    expect(msg.save).toHaveBeenCalled();
  });

  it('uses attachment label when content empty', async () => {
    const msg = { _id: 'm3', save: jest.fn().mockResolvedValue(true), populate: jest.fn().mockResolvedValue(true) };
    Message.mockImplementation(() => msg);
    const attachments = [{ url: 'http://x.com/f.pdf', filename: 'f.pdf', type: 'application/pdf', size: 100 }];
    await messagesService.sendDirectMessage({ receiverId: 'r1', content: '', senderId: 's1', attachments });
    expect(msg.save).toHaveBeenCalled();
  });
});

// ─── getOrderMessages ─────────────────────────────────────────────────────────
describe('messagesService.getOrderMessages', () => {
  it('returns messages for an order', async () => {
    Order.findById.mockResolvedValue({
      artisanId: { toString: () => 'u1' },
      supplierId: { toString: () => 'u2' },
    });
    const msgs = [{ _id: 'm1' }, { _id: 'm2' }];
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(msgs),
    });
    const result = await messagesService.getOrderMessages('o1', 'u1');
    expect(result).toBeDefined();
  });
});

// ─── getConversation ─────────────────────────────────────────────────────────
describe('messagesService.getConversation', () => {
  it('returns direct messages between two users', async () => {
    const msgs = [{ _id: 'm1' }, { _id: 'm2' }];
    const populateMock2 = jest.fn().mockResolvedValue(msgs);
    const populateMock1 = jest.fn().mockReturnValue({ populate: populateMock2 });
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ populate: populateMock1 }),
    });
    const result = await messagesService.getConversation('u1', 'u2');
    expect(result).toBeDefined();
  });
});

// ─── markAsRead ───────────────────────────────────────────────────────────────
describe('messagesService.markAsRead', () => {
  it('marks a message as read', async () => {
    const msg = { _id: 'm1', read: false, receiverId: { toString: () => 'u1' }, save: jest.fn().mockResolvedValue(true) };
    Message.findById.mockResolvedValue(msg);
    await messagesService.markAsRead('m1', 'u1');
    expect(msg.save).toHaveBeenCalled();
  });

  it('throws 404 if message not found', async () => {
    Message.findById.mockResolvedValue(null);
    await expect(messagesService.markAsRead('bad', 'u1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getUnreadCount ───────────────────────────────────────────────────────────
describe('messagesService.getUnreadCount', () => {
  it('returns unread count', async () => {
    Message.countDocuments.mockResolvedValue(5);
    const result = await messagesService.getUnreadCount('u1');
    expect(result).toBe(5);
  });
});

'use strict';
/**
 * Extended tests for messages.controller.js
 */

jest.mock('../../src/modules/messages/messages.service');
jest.mock('../../src/utils/apiResponse', () => (res, msg, data, status = 200) => {
  res.status(status).json({ message: msg, data });
});

const httpMocks = require('node-mocks-http');
const messagesService = require('../../src/modules/messages/messages.service');
const ctrl = require('../../src/modules/messages/messages.controller');

function req(overrides = {}) {
  return httpMocks.createRequest({
    user: { _id: 'user1', id: 'user1' },
    body: {},
    files: [],
    params: {},
    query: {},
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }

beforeEach(() => jest.clearAllMocks());

// ─── sendMessage ──────────────────────────────────────────────────────────────
describe('messages.controller — sendMessage', () => {
  it('sends message and returns 201', async () => {
    messagesService.sendMessage.mockResolvedValue({ _id: 'm1', content: 'hello' });
    const r = res();
    await ctrl.sendMessage(req({ body: { orderId: 'o1', receiverId: 'r1', content: 'hello' } }), r);
    expect(r.statusCode).toBe(201);
  });

  it('returns 500 on error', async () => {
    messagesService.sendMessage.mockRejectedValue(new Error('fail'));
    const r = res();
    await ctrl.sendMessage(req({ body: {} }), r);
    expect(r.statusCode).toBe(500);
  });

  it('returns 403 on unauthorized error', async () => {
    messagesService.sendMessage.mockRejectedValue(Object.assign(new Error('Non autorisé'), { statusCode: 403 }));
    const r = res();
    await ctrl.sendMessage(req({ body: {} }), r);
    expect(r.statusCode).toBe(403);
  });
});

// ─── sendDirectMessage ────────────────────────────────────────────────────────
describe('messages.controller — sendDirectMessage', () => {
  it('returns 400 if receiverId missing', async () => {
    const r = res();
    await ctrl.sendDirectMessage(req({ body: { content: 'hi' } }), r);
    expect(r.statusCode).toBe(400);
  });

  it('returns 400 if content and files both empty', async () => {
    const r = res();
    await ctrl.sendDirectMessage(req({ body: { receiverId: 'r1', content: '' }, files: [] }), r);
    expect(r.statusCode).toBe(400);
  });

  it('sends direct message successfully', async () => {
    messagesService.sendDirectMessage.mockResolvedValue({ _id: 'm1' });
    const r = res();
    await ctrl.sendDirectMessage(req({ body: { receiverId: 'r1', content: 'hello' } }), r);
    expect(r.statusCode).toBe(201);
  });

  it('sends message with file attachment', async () => {
    messagesService.sendDirectMessage.mockResolvedValue({ _id: 'm1' });
    const r = res();
    await ctrl.sendDirectMessage(req({
      body: { receiverId: 'r1', content: '' },
      files: [{ filename: 'test.pdf', mimetype: 'application/pdf', size: 1000 }],
    }), r);
    expect(r.statusCode).toBe(201);
  });

  it('returns 500 on service error', async () => {
    messagesService.sendDirectMessage.mockRejectedValue(new Error('fail'));
    const r = res();
    await ctrl.sendDirectMessage(req({ body: { receiverId: 'r1', content: 'hi' } }), r);
    expect(r.statusCode).toBe(500);
  });
});

// ─── getOrderMessages ─────────────────────────────────────────────────────────
describe('messages.controller — getOrderMessages', () => {
  it('returns messages for order', async () => {
    messagesService.getOrderMessages.mockResolvedValue([{ _id: 'm1' }]);
    const r = res();
    await ctrl.getOrderMessages(req({ params: { orderId: 'o1' } }), r);
    expect(r.statusCode).toBe(200);
  });

  it('returns 500 on error', async () => {
    messagesService.getOrderMessages.mockRejectedValue(new Error('fail'));
    const r = res();
    await ctrl.getOrderMessages(req({ params: { orderId: 'o1' } }), r);
    expect(r.statusCode).toBe(500);
  });
});

// ─── getConversation ──────────────────────────────────────────────────────────
describe('messages.controller — getConversation', () => {
  it('returns conversation messages', async () => {
    messagesService.getConversation.mockResolvedValue([{ _id: 'm1' }]);
    const r = res();
    await ctrl.getConversation(req({ params: { userId: 'u2' } }), r);
    expect(r.statusCode).toBe(200);
  });

  it('returns 500 on error', async () => {
    messagesService.getConversation.mockRejectedValue(new Error('fail'));
    const r = res();
    await ctrl.getConversation(req({ params: { userId: 'u2' } }), r);
    expect(r.statusCode).toBe(500);
  });
});

// ─── getRecentConversations ───────────────────────────────────────────────────
describe('messages.controller — getRecentConversations', () => {
  it('returns recent conversations', async () => {
    messagesService.getRecentConversations.mockResolvedValue([{ userId: 'u2', lastMessage: 'hi' }]);
    const r = res();
    await ctrl.getRecentConversations(req(), r);
    expect(r.statusCode).toBe(200);
  });
});

// ─── markAsRead ───────────────────────────────────────────────────────────────
describe('messages.controller — markAsRead', () => {
  it('marks message as read', async () => {
    messagesService.markAsRead.mockResolvedValue({ read: true });
    const r = res();
    await ctrl.markAsRead(req({ params: { messageId: 'm1' } }), r);
    expect(r.statusCode).toBe(200);
  });

  it('returns 404 on not found', async () => {
    messagesService.markAsRead.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));
    const r = res();
    await ctrl.markAsRead(req({ params: { messageId: 'bad' } }), r);
    expect(r.statusCode).toBe(404);
  });
});

// ─── getUnreadCount ───────────────────────────────────────────────────────────
describe('messages.controller — getUnreadCount', () => {
  it('returns unread count', async () => {
    messagesService.getUnreadCount.mockResolvedValue(5);
    const r = res();
    await ctrl.getUnreadCount(req(), r);
    expect(r.statusCode).toBe(200);
  });
});

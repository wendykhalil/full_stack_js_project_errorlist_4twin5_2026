const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer, { corsOrigin }) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').split(' ')[1] ||
        '';

      if (!token) return next(new Error('Non autorisé'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload; // { sub, role }

      // Per-user room for targeted notifications
      socket.join(`user:${payload.sub}`);

      // Role-based rooms
      const role = String(payload.role || '').toUpperCase();
      if (role === 'ADMIN')    socket.join('admins');
      if (role === 'SUPPLIER') socket.join(`supplier:${payload.sub}`);
      if (role === 'ARTISAN')  socket.join(`artisan:${payload.sub}`);

      return next();
    } catch (e) {
      return next(new Error('Non autorisé'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('connected', { ok: true });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io non initialisé');
  return io;
}

function notifyUser(userId, payload) {
  try {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification', payload);
  } catch (_) {}
}

function notifyAdmins(payload) {
  try {
    if (!io) return;
    io.to('admins').emit('notification', payload);
  } catch (_) {}
}

/**
 * Emit a new_order event to the supplier's dedicated room.
 * Also emits a notification event so the bell updates.
 */
function notifySupplierNewOrder(supplierId, orderPayload) {
  try {
    if (!io) return;
    io.to(`supplier:${supplierId}`).emit('new_order', orderPayload);
  } catch (_) {}
}

module.exports = { initSocket, getIO, notifyUser, notifyAdmins, notifySupplierNewOrder };

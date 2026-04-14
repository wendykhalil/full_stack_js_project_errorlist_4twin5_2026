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

  // Authenticate sockets using JWT (sent via auth.token or Authorization header)
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').split(' ')[1] ||
        '';

      if (!token) return next(new Error('Non autorisé'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload; // { sub, role }
      // Join per-user room for targeted notifications
      socket.join(`user:${payload.sub}`);

      // Admin room for broadcast notifications
      if (String(payload.role || '').toUpperCase() === 'ADMIN') {
        socket.join('admins');
      }
      return next();
    } catch (e) {
      return next(new Error('Non autorisé'));
    }
  });

  io.on('connection', (socket) => {
    // You can add more listeners here if needed
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

module.exports = { initSocket, getIO, notifyUser, notifyAdmins };

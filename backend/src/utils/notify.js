const Notification = require('../models/Notification');
const { notifyUser } = require('../socket');

/**
 * Save a notification to DB and emit via Socket.io
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.type
 * @param {string} opts.title
 * @param {string} [opts.message]
 * @param {string} [opts.link]
 */
async function notify({ userId, type = 'GENERAL', title, message = '', link = '' }) {
  try {
    const doc = await Notification.create({ userId, type, title, message, link });
    notifyUser(String(userId), {
      _id: doc._id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      link: doc.link,
      read: false,
      createdAt: doc.createdAt,
    });
    return doc;
  } catch (err) {
    console.error('notify() error:', err.message);
  }
}

module.exports = { notify };

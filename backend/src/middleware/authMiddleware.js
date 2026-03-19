const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch the full user from database
    const user = await User.findById(payload.sub).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is blocked
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    
    req.user = user; // Now req.user has _id and all other fields
    req.user.id = String(user._id);
    req.user.sub = String(user._id);
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = { authRequired };
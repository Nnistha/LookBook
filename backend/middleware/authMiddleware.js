const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Format: Bearer TOKEN
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Token malformed' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Attach user
    req.user = decoded.userId;

    next();
  } catch (err) {
    console.error('AUTH ERROR:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
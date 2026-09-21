const jwt = require('jsonwebtoken');

// Verify standard logged-in user
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // Contains { id, username, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

// Restrict route strictly to Admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
};

// Restrict route to Admin or Farmer
const requireFarmerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'farmer')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden', message: 'Farmer or Admin access required' });
};

module.exports = { authenticate, requireAdmin, requireFarmerOrAdmin };
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protectRoute = async (req, res, next) => {
  console.log('Auth Header:', req.headers.authorization);
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('protectRoute: missing token');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded?.user?.id || decoded?.id || decoded?._id;

    if (!userId) {
      console.log('JWT payload invalid:', decoded);
      return res.status(401).json({ msg: 'Invalid token payload' });
    }

    req.userId = String(userId);
    req.user = await User.findById(req.userId).select('-password');
    console.log('protectRoute req.user:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null);
    next();
  } catch (err) {
    console.log('protectRoute: invalid token', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = protectRoute;

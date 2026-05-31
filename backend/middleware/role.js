const role = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'No user found' });
    }

    const rawRole = String(req.user.role || '').toLowerCase();
    const normalizedRole = rawRole === 'business_owner'
      ? 'owner'
      : rawRole === 'analyst'
        ? 'customer'
        : rawRole;

    if (!roles.includes(normalizedRole)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    next();
  };
};

module.exports = role;

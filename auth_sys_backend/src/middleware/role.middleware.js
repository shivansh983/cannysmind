'use strict';


const requireRole = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }


    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({
        message: `Forbidden: This action requires one of these roles: ${allowedRoles.join(', ')}`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = { requireRole };
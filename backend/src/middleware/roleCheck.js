const ApiError = require('../utils/ApiError');
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) return next(new ApiError(401, 'Authentication required.'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `This action is only available to: ${allowedRoles.join(', ')}.`));
    }
    next();
  };
}
module.exports = { requireRole };

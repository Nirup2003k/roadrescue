const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { query } = require('../db/query');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw new ApiError(401, 'Session expired or invalid. Please log in again.');
    }
    const rows = await query('SELECT id, name, email, phone, role, status FROM users WHERE id = ?', [payload.id]);
    if (rows.length === 0) throw new ApiError(401, 'Account no longer exists.');
    const user = rows[0];
    if (user.status === 'suspended') throw new ApiError(403, 'Your account has been suspended. Contact support.');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
module.exports = { requireAuth };

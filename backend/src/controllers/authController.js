const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { signToken } = require('../utils/jwt');
const { query, withTransaction } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');

const SALT_ROUNDS = 10;

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, address, city, bio, experienceYears, serviceArea } = req.body;

  runValidation([
    rules.required(name, 'Name'),
    rules.required(email, 'Email'),
    rules.email(email),
    rules.required(password, 'Password'),
    rules.password(password),
    rules.required(phone, 'Phone'),
    rules.phone(phone),
    rules.required(role, 'Role'),
    rules.oneOf(role, 'Role', ['customer', 'mechanic']),
  ]);

  const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing.length > 0) throw new ApiError(409, 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await withTransaction(async (conn) => {
    const inserted = await conn.query(
      `INSERT INTO users (name, email, password_hash, phone, role, status)
       VALUES (?, ?, ?, ?, ?, 'active') RETURNING id`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone.trim(), role]
    );
    const userId = inserted[0].id;

    if (role === 'customer') {
      await conn.query('INSERT INTO customers (user_id, address, city) VALUES (?, ?, ?)', [
        userId, address || null, city || null,
      ]);
    } else if (role === 'mechanic') {
      await conn.query(
        `INSERT INTO mechanics (user_id, bio, experience_years, service_area, availability_status, approval_status)
         VALUES (?, ?, ?, ?, 'offline', 'pending')`,
        [userId, bio || null, experienceYears || 0, serviceArea || null]
      );
    }
    return { id: userId, name, email: email.toLowerCase().trim(), phone, role };
  });

  const token = signToken({ id: user.id, role: user.role });
  const message = role === 'mechanic'
    ? 'Registration successful. Your mechanic account is pending admin approval.'
    : 'Registration successful. Welcome to RoadRescue.';
  success(res, 201, message, { token, user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  runValidation([rules.required(email, 'Email'), rules.required(password, 'Password')]);

  const rows = await query(
    'SELECT id, name, email, password_hash, phone, role, status FROM users WHERE email = ?',
    [String(email).toLowerCase().trim()]
  );
  if (rows.length === 0) throw new ApiError(401, 'Invalid email or password.');

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid email or password.');
  if (user.status === 'suspended') throw new ApiError(403, 'Your account has been suspended. Contact support.');

  const token = signToken({ id: user.id, role: user.role });
  delete user.password_hash;
  success(res, 200, 'Login successful.', { token, user });
});

const getMe = asyncHandler(async (req, res) => {
  success(res, 200, 'Current user fetched.', { user: req.user });
});

module.exports = { register, login, getMe };

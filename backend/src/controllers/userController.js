const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');

const SALT_ROUNDS = 10;

const getProfile = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  let profile = { ...req.user };

  if (role === 'customer') {
    const rows = await query('SELECT address, city FROM customers WHERE user_id = ?', [id]);
    profile = { ...profile, ...rows[0] };
  } else if (role === 'mechanic') {
    const rows = await query(
      `SELECT bio, experience_years, service_area, availability_status, approval_status
       FROM mechanics WHERE user_id = ?`,
      [id]
    );
    profile = { ...profile, ...rows[0] };
    const services = await query(
      `SELECT s.id, s.name FROM mechanic_services ms
       JOIN services s ON s.id = ms.service_id WHERE ms.mechanic_id = ?`,
      [id]
    );
    profile.services = services;
  }
  success(res, 200, 'Profile fetched.', { profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const { name, phone, address, city, bio, experienceYears, serviceArea } = req.body;

  runValidation([
    name !== undefined ? rules.required(name, 'Name') : null,
    phone !== undefined ? rules.phone(phone) : null,
  ]);

  if (name !== undefined || phone !== undefined) {
    await query(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`, [
      name ?? null, phone ?? null, id,
    ]);
  }
  if (role === 'customer' && (address !== undefined || city !== undefined)) {
    await query(`UPDATE customers SET address = COALESCE(?, address), city = COALESCE(?, city) WHERE user_id = ?`, [
      address ?? null, city ?? null, id,
    ]);
  }
  if (role === 'mechanic' && (bio !== undefined || experienceYears !== undefined || serviceArea !== undefined)) {
    await query(
      `UPDATE mechanics SET bio = COALESCE(?, bio), experience_years = COALESCE(?, experience_years), service_area = COALESCE(?, service_area) WHERE user_id = ?`,
      [bio ?? null, experienceYears ?? null, serviceArea ?? null, id]
    );
  }
  success(res, 200, 'Profile updated.');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  runValidation([
    rules.required(currentPassword, 'Current password'),
    rules.required(newPassword, 'New password'),
    rules.password(newPassword),
  ]);

  const rows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!match) throw new ApiError(400, 'Current password is incorrect.');

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
  success(res, 200, 'Password updated successfully.');
});

module.exports = { getProfile, updateProfile, changePassword };

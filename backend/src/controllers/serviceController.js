const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');

const listServices = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === 'true' && req.user?.role === 'admin';
  const rows = includeInactive
    ? await query('SELECT * FROM services ORDER BY name ASC')
    : await query('SELECT * FROM services WHERE is_active = TRUE ORDER BY name ASC');
  success(res, 200, 'Services fetched.', { services: rows });
});

const getService = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM services WHERE id = ?', [req.params.id]);
  if (rows.length === 0) throw new ApiError(404, 'Service not found.');
  success(res, 200, 'Service fetched.', { service: rows[0] });
});

const createService = asyncHandler(async (req, res) => {
  const { name, description, basePrice } = req.body;
  runValidation([
    rules.required(name, 'Service name'),
    basePrice !== undefined && Number.isNaN(Number(basePrice)) ? 'Base price must be a number.' : null,
  ]);

  const existing = await query('SELECT id FROM services WHERE name = ?', [name.trim()]);
  if (existing.length > 0) throw new ApiError(409, 'A service with this name already exists.');

  const [service] = await query(
    'INSERT INTO services (name, description, base_price, is_active) VALUES (?, ?, ?, TRUE) RETURNING *',
    [name.trim(), description || null, basePrice || 0]
  );
  success(res, 201, 'Service created.', { service });
});

const updateService = asyncHandler(async (req, res) => {
  const rows = await query('SELECT id FROM services WHERE id = ?', [req.params.id]);
  if (rows.length === 0) throw new ApiError(404, 'Service not found.');

  const { name, description, basePrice, isActive } = req.body;
  const [service] = await query(
    `UPDATE services SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       base_price = COALESCE(?, base_price),
       is_active = COALESCE(?, is_active)
     WHERE id = ? RETURNING *`,
    [
      name ?? null, description ?? null, basePrice ?? null,
      typeof isActive === 'boolean' ? isActive : null,
      req.params.id,
    ]
  );
  success(res, 200, 'Service updated.', { service });
});

module.exports = { listServices, getService, createService, updateService };

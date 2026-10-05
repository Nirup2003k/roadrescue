const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/response');
const { query } = require('../db/query');
const { rules, runValidation } = require('../validators/validate');

const VEHICLE_TYPES = ['Car', 'Bike', 'Truck', 'Other'];

async function getOwnedVehicleOr404(vehicleId, customerId) {
  const rows = await query('SELECT * FROM vehicles WHERE id = ? AND customer_id = ?', [vehicleId, customerId]);
  if (rows.length === 0) throw new ApiError(404, 'Vehicle not found.');
  return rows[0];
}

const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await query('SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC', [req.user.id]);
  success(res, 200, 'Vehicles fetched.', { vehicles });
});

const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await getOwnedVehicleOr404(req.params.id, req.user.id);
  success(res, 200, 'Vehicle fetched.', { vehicle });
});

const createVehicle = asyncHandler(async (req, res) => {
  const { vehicleType, brand, model, registrationNumber } = req.body;
  runValidation([
    rules.required(vehicleType, 'Vehicle type'),
    rules.oneOf(vehicleType, 'Vehicle type', VEHICLE_TYPES),
    rules.required(brand, 'Brand'),
    rules.required(model, 'Model'),
    rules.required(registrationNumber, 'Registration number'),
    rules.registrationNumber(registrationNumber),
  ]);

  const existing = await query('SELECT id FROM vehicles WHERE registration_number = ?', [
    registrationNumber.trim().toUpperCase(),
  ]);
  if (existing.length > 0) throw new ApiError(409, 'A vehicle with this registration number is already registered.');

  const [vehicle] = await query(
    `INSERT INTO vehicles (customer_id, vehicle_type, brand, model, registration_number)
     VALUES (?, ?, ?, ?, ?) RETURNING *`,
    [req.user.id, vehicleType, brand.trim(), model.trim(), registrationNumber.trim().toUpperCase()]
  );
  success(res, 201, 'Vehicle added.', { vehicle });
});

const updateVehicle = asyncHandler(async (req, res) => {
  await getOwnedVehicleOr404(req.params.id, req.user.id);
  const { vehicleType, brand, model, registrationNumber } = req.body;

  runValidation([
    vehicleType !== undefined ? rules.oneOf(vehicleType, 'Vehicle type', VEHICLE_TYPES) : null,
    registrationNumber !== undefined ? rules.registrationNumber(registrationNumber) : null,
  ]);

  if (registrationNumber) {
    const clash = await query('SELECT id FROM vehicles WHERE registration_number = ? AND id != ?', [
      registrationNumber.trim().toUpperCase(), req.params.id,
    ]);
    if (clash.length > 0) throw new ApiError(409, 'A vehicle with this registration number is already registered.');
  }

  const [vehicle] = await query(
    `UPDATE vehicles SET
       vehicle_type = COALESCE(?, vehicle_type),
       brand = COALESCE(?, brand),
       model = COALESCE(?, model),
       registration_number = COALESCE(?, registration_number)
     WHERE id = ? RETURNING *`,
    [
      vehicleType ?? null, brand ?? null, model ?? null,
      registrationNumber ? registrationNumber.trim().toUpperCase() : null,
      req.params.id,
    ]
  );
  success(res, 200, 'Vehicle updated.', { vehicle });
});

const deleteVehicle = asyncHandler(async (req, res) => {
  await getOwnedVehicleOr404(req.params.id, req.user.id);
  const activeBooking = await query(
    `SELECT id FROM bookings WHERE vehicle_id = ? AND status IN ('pending','accepted','in_progress')`,
    [req.params.id]
  );
  if (activeBooking.length > 0) throw new ApiError(409, 'This vehicle has an active assistance request and cannot be deleted.');
  await query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  success(res, 200, 'Vehicle deleted.');
});

module.exports = { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle };

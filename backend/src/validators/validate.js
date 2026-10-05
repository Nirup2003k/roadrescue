const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const REG_RE = /^[A-Za-z0-9 -]{4,15}$/;

const rules = {
  required(value, field) {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${field} is required.`;
    }
    return null;
  },
  email(value) {
    if (value && !EMAIL_RE.test(value)) return 'Enter a valid email address.';
    return null;
  },
  password(value) {
    if (value && value.length < 6) return 'Password must be at least 6 characters long.';
    return null;
  },
  phone(value) {
    if (value && !PHONE_RE.test(value)) return 'Enter a valid phone number (7-15 digits).';
    return null;
  },
  registrationNumber(value) {
    if (value && !REG_RE.test(value)) return 'Registration number looks invalid.';
    return null;
  },
  rating(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) return 'Rating must be a whole number between 1 and 5.';
    return null;
  },
  oneOf(value, field, options) {
    if (value && !options.includes(value)) return `${field} must be one of: ${options.join(', ')}.`;
    return null;
  },
  latitude(value) {
    const n = Number(value);
    if (Number.isNaN(n) || n < -90 || n > 90) return 'Latitude must be a number between -90 and 90.';
    return null;
  },
  longitude(value) {
    const n = Number(value);
    if (Number.isNaN(n) || n < -180 || n > 180) return 'Longitude must be a number between -180 and 180.';
    return null;
  },
};

function runValidation(checks) {
  const errors = [];
  for (const check of checks) {
    if (check) errors.push(check);
  }
  if (errors.length > 0) {
    throw new ApiError(422, 'Please fix the highlighted fields.', errors);
  }
}

module.exports = { rules, runValidation };

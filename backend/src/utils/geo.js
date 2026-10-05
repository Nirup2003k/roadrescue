const { AVG_SPEED_KMH } = require('../config/constants');

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function estimateEtaMinutes(distanceKm) {
  return Math.round((distanceKm / AVG_SPEED_KMH) * 60);
}

function isValidLatitude(value) {
  return typeof value === 'number' && !Number.isNaN(value) && value >= -90 && value <= 90;
}
function isValidLongitude(value) {
  return typeof value === 'number' && !Number.isNaN(value) && value >= -180 && value <= 180;
}

module.exports = { haversineDistanceKm, estimateEtaMinutes, isValidLatitude, isValidLongitude };

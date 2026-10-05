const express = require('express');
const {
  listMechanics, listNearbyMechanics, getMechanic, updateAvailability, updateServices, getEarningsSummary,
} = require('../controllers/mechanicController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const router = express.Router();
router.get('/', listMechanics);
router.get('/nearby', listNearbyMechanics);
router.put('/availability', requireAuth, requireRole('mechanic'), updateAvailability);
router.put('/services', requireAuth, requireRole('mechanic'), updateServices);
router.get('/earnings', requireAuth, requireRole('mechanic'), getEarningsSummary);
router.get('/:id', getMechanic);
module.exports = router;

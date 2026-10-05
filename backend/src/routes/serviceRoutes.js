const express = require('express');
const { listServices, getService, createService, updateService } = require('../controllers/serviceController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const router = express.Router();
router.get('/', (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return listServices(req, res, next);
  return requireAuth(req, res, () => listServices(req, res, next));
});
router.get('/:id', getService);
router.post('/', requireAuth, requireRole('admin'), createService);
router.put('/:id', requireAuth, requireRole('admin'), updateService);
module.exports = router;

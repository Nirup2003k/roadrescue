const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
module.exports = router;

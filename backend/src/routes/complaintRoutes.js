const express = require('express');
const {
  createComplaint, listMyComplaints, getBookingComplaints,
} = require('../controllers/complaintController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);
router.post('/', createComplaint);
router.get('/my', listMyComplaints);
router.get('/booking/:bookingId', getBookingComplaints);

module.exports = router;

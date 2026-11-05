const express = require('express');
const {
  getStats, listCustomers, listMechanicsAdmin, suspendCustomer, activateCustomer,
  approveMechanic, suspendMechanic, activateMechanic, listAllBookings, listAllReviews, deleteReview,
} = require('../controllers/adminController');
const { listAllComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const router = express.Router();
router.use(requireAuth, requireRole('admin'));
router.get('/stats', getStats);
router.get('/customers', listCustomers);
router.put('/customers/:id/suspend', suspendCustomer);
router.put('/customers/:id/activate', activateCustomer);
router.get('/mechanics', listMechanicsAdmin);
router.put('/mechanics/:id/approve', approveMechanic);
router.put('/mechanics/:id/suspend', suspendMechanic);
router.put('/mechanics/:id/activate', activateMechanic);
router.get('/bookings', listAllBookings);
router.get('/reviews', listAllReviews);
router.delete('/reviews/:id', deleteReview);
router.get('/complaints', listAllComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);
module.exports = router;


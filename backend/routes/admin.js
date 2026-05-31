const express = require('express');
const protectRoute = require('../middleware/auth');
const role = require('../middleware/role');
const {
  listUsers,
  deleteUser,
  getStats,
  listOwnerRequests,
  approveOwnerRequest,
  rejectOwnerRequest,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protectRoute);
router.use(role('admin'));

router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);
router.get('/owner-requests', listOwnerRequests);
router.post('/owner-requests/:id/approve', approveOwnerRequest);
router.post('/owner-requests/:id/reject', rejectOwnerRequest);

module.exports = router;

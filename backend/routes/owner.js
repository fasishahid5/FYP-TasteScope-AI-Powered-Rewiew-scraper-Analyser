const express = require('express');
const protectRoute = require('../middleware/auth');
const { getMyOwnerRequest, submitOwnerRequest } = require('../controllers/ownerController');

const router = express.Router();

router.use(protectRoute);

router.get('/request', getMyOwnerRequest);
router.post('/request', submitOwnerRequest);

module.exports = router;


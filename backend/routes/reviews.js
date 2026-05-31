const express = require('express');
const { scrape, analyze } = require('../controllers/reviewController');
const protectRoute = require('../middleware/auth');

const router = express.Router();

router.post('/scrape', protectRoute, scrape);
router.post('/analyze', protectRoute, analyze);

module.exports = router;

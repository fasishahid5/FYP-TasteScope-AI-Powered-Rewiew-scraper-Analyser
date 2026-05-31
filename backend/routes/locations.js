const express = require('express');
const { getCountries, getCities } = require('../controllers/authController');

const router = express.Router();

router.get('/countries', getCountries);
router.get('/cities/:countryCode', getCities);

module.exports = router;

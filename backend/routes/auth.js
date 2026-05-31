const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  updateProfile,
  getCountries,
  getCities,
} = require('../controllers/authController');
const protectRoute = require('../middleware/auth');

const router = express.Router();

// Local auth routes
router.post('/register', registerUser);
// alias for frontend naming consistency
router.post('/signup', registerUser);

router.post('/login', loginUser);
router.post('/logout', protectRoute, logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);
router.get('/countries', getCountries);
router.get('/cities/:countryCode', getCities);
router.get('/me', protectRoute, getMe);
router.get('/profile', protectRoute, getMe);
router.patch('/profile', protectRoute, updateProfile);

// Social auth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }), (req, res) => {
  const payload = { user: { id: req.user.id } };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/login` }), (req, res) => {
  const payload = { user: { id: req.user.id } };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
});

router.get('/apple', passport.authenticate('apple'));

router.post('/apple/callback', passport.authenticate('apple', { failureRedirect: `${process.env.FRONTEND_URL}/login` }), (req, res) => {
  const payload = { user: { id: req.user.id } };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
});

module.exports = router;

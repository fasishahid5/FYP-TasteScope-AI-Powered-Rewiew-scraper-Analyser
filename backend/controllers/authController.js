const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const { toPublicUser } = require('../utils/user');
const {
  sendPasswordChangedEmail,
  sendNewLoginDetectedEmail,
  sendAiAnalysisCompleteEmail,
} = require('../lib/mailer');

let worldCountries = [];
try {
  worldCountries = require('world-countries');
} catch (err) {
  console.warn('Location data package not available:', err.message);
}

const countryCodeToFlag = (isoCode = '') => {
  if (!isoCode || typeof isoCode !== 'string') return '🏳️';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const LOCATION_COUNTRIES = (worldCountries || [])
  .map((country) => {
    const name = country?.name?.common || '';
    const iso2 = String(country?.cca2 || '').toUpperCase();
    const capitals = Array.isArray(country?.capital) ? country.capital.filter(Boolean) : [];
    const dialRoot = String(country?.idd?.root || '').trim();
    const dialSuffixes = Array.isArray(country?.idd?.suffixes) ? country.idd.suffixes.filter(Boolean) : [];
    const dialCodes = dialRoot
      ? dialSuffixes
          .map((suffix) => `${dialRoot}${suffix || ''}`.replace(/\s+/g, '').trim())
          .filter(Boolean)
      : [];
    return {
      name,
      iso2,
      flag: countryCodeToFlag(iso2),
      dialCodes,
      capitals,
    };
  })
  .filter((country) => Boolean(country.name && country.iso2))
  .sort((a, b) => a.name.localeCompare(b.name));

const LOCATION_CITY_OPTIONS = LOCATION_COUNTRIES.flatMap((country) =>
  country.capitals.map((city) => ({
    city,
    country: country.name,
    countryCode: country.iso2,
  }))
).sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const coerceSignupRole = (value) => {
  if (!value) return 'customer';
  const role = String(value).toLowerCase().trim();

  if (role === 'customer' || role === 'analyst') return 'customer';
  if (role === 'owner' || role === 'business_owner' || role === 'business owner') return 'owner';
  if (role === 'admin') return 'admin';

  return null;
};

const getCountries = (req, res) => {
  return res.json({ countries: LOCATION_COUNTRIES });
};

const getCities = (req, res) => {
  const requestedCountryCode = String(req.params.countryCode || '').toUpperCase();
  if (!requestedCountryCode) {
    return res.status(400).json({ msg: 'Missing country code' });
  }

  const filteredCities = LOCATION_CITY_OPTIONS.filter((item) => item.countryCode === requestedCountryCode);
  if (!filteredCities.length) {
    return res.json({ cities: [] });
  }

  return res.json({ cities: filteredCities });
};

const registerUser = async (req, res) => {
  // support both name or firstName/lastName from frontend
  const { name, firstName, lastName, email, password, role } = req.body;
  console.log('registerUser called with:', { name, firstName, lastName, email });
  const fullName = name || [firstName, lastName].filter(Boolean).join(' ').trim();

  try {
    const coercedRole = coerceSignupRole(role) || 'customer';
    if (coercedRole === 'admin') {
      return res.status(400).json({ msg: 'Admin role cannot be assigned during signup' });
    }
    if (!coercedRole) {
      return res.status(400).json({ msg: 'Invalid role. Please select Customer or Business Owner.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      console.log('registerUser: user already exists', email);
      return res.status(400).json({ msg: 'User already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    user = new User({
      firstName: firstName || '',
      lastName: lastName || '',
      name: fullName,
      email,
      password,
      role: coercedRole,
      provider: 'local',
      verificationToken,
      ownerRequest: coercedRole === 'owner' ? { status: 'pending' } : undefined,
    });

    await user.save();
    console.log('registerUser: user saved', user.id);

    // Send verification email (wrapped in try/catch so it doesn't crash if email fails)
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await transporter.sendMail({
        to: email,
        subject: 'Verify your email',
        html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
      });
      res.status(201).json({ msg: 'User registered. Please check your email to verify.' });
    } catch (emailErr) {
      console.warn('Email send failed (user still created):', emailErr.message);
      res.status(201).json({ msg: 'User registered. Email could not be sent, but you can still login.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('loginUser attempt for', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('loginUser failed: no user', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({ msg: 'Please use social login' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('loginUser failed: wrong password', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    console.log('loginUser success', user.id);
    const publicUser = toPublicUser(user, { includeOwnerRequest: true });
    res.json({
      token,
      user: publicUser,
      redirectTo: publicUser.role === 'admin'
        ? '/admin-dashboard'
        : publicUser.role === 'owner'
          ? '/business-dashboard'
          : '/dashboard',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const logoutUser = (req, res) => {
  // For JWT, logout is handled on client side by removing token
  res.json({ msg: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log('forgotPassword request for', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('forgotPassword: no user', email);
      return res.status(400).json({ msg: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    try {
      await transporter.sendMail({
        to: email,
        subject: 'Password Reset',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
      });
      res.json({ msg: 'Password reset email sent' });
    } catch (emailErr) {
      console.warn('Reset email send failed:', emailErr.message);
      res.json({ msg: 'Reset link generated but email could not be sent. Contact support.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  console.log('resetPassword called with token', token);

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('resetPassword success for user', user.id);
    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'No user found' });
    }
    res.json({ user: toPublicUser(req.user, { includeOwnerRequest: true }) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const {
    firstName,
    lastName,
    bio,
    phone,
    city,
    country,
    countryCode,
    avatarUrl,
    coverUrl,
    locationEnabled,
    pushNotificationsEnabled,
    emailNotificationsEnabled,
  } = req.body || {};

  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'No user found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const safe = (v) => (v === null || v === undefined ? '' : String(v).trim());
    const incomingFirstName = safe(firstName);
    const incomingLastName = safe(lastName);
    const existingFirstName = String(user.firstName || '').trim();
    const existingLastName = String(user.lastName || '').trim();

    // Preserve existing names when client sends empty values to avoid failing required validation.
    user.firstName = incomingFirstName || existingFirstName;
    user.lastName = incomingLastName || existingLastName;

    if (user.provider === 'local' && (!user.firstName || !user.lastName)) {
      return res.status(400).json({ msg: 'First name and last name are required.' });
    }

    if (typeof bio !== 'undefined') user.bio = safe(bio);
    if (typeof phone !== 'undefined') user.phone = safe(phone);
    if (typeof city !== 'undefined') user.city = safe(city);
    if (typeof country !== 'undefined') user.country = safe(country);
    if (typeof countryCode !== 'undefined') user.countryCode = safe(countryCode);
    if (typeof avatarUrl !== 'undefined' && typeof avatarUrl === 'string') {
      const av = avatarUrl.trim();
      if (av && av !== 'undefined') user.avatarUrl = av;
    }
    if (typeof coverUrl !== 'undefined' && typeof coverUrl === 'string') {
      const cv = coverUrl.trim();
      if (cv && cv !== 'undefined') user.coverUrl = cv;
    }
    if (typeof locationEnabled === 'boolean') {
      user.locationEnabled = locationEnabled;
    }
    if (typeof pushNotificationsEnabled === 'boolean') {
      user.pushNotificationsEnabled = pushNotificationsEnabled;
    }
    if (typeof emailNotificationsEnabled === 'boolean') {
      user.preferences = user.preferences || {};
      user.preferences.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    const composedName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    if (composedName) {
      user.name = composedName;
    }

    await user.save();

    return res.json({
      msg: 'Profile updated successfully',
      user: toPublicUser(user, { includeOwnerRequest: true }),
    });
  } catch (err) {
    console.error(err);

    if (err && err.name === 'ValidationError') {
      const validationMessages = Object.values(err.errors || {})
        .map((errorItem) => errorItem.message)
        .filter(Boolean);

      return res.status(400).json({ msg: validationMessages[0] || 'Invalid profile data' });
    }

    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
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
  sendPasswordChangedEmail,
  sendNewLoginDetectedEmail,
  sendAiAnalysisCompleteEmail,
};

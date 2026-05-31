const User = require('../models/User');

const getMyOwnerRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'No user found' });
    }

    return res.json({
      ownerRequest: user.ownerRequest || { status: 'none' },
      role: user.role,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

const submitOwnerRequest = async (req, res) => {
  const { businessName, restaurantName, phone, website } = req.body || {};

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'No user found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ msg: 'Admin account cannot request owner access' });
    }
    if (user.role === 'owner') {
      return res.status(400).json({ msg: 'You already have owner access' });
    }

    if (!businessName || !restaurantName || !phone) {
      return res.status(400).json({ msg: 'businessName, restaurantName, and phone are required' });
    }

    const currentStatus = user.ownerRequest?.status || 'none';
    if (currentStatus === 'pending') {
      return res.status(400).json({ msg: 'Your request is already pending review' });
    }
    if (currentStatus === 'approved') {
      return res.status(400).json({ msg: 'Your request is already approved' });
    }

    user.ownerRequest = {
      status: 'pending',
      businessName: String(businessName).trim(),
      restaurantName: String(restaurantName).trim(),
      phone: String(phone).trim(),
      website: website ? String(website).trim() : '',
      submittedAt: new Date(),
      reviewedAt: undefined,
      reviewedBy: undefined,
      reviewNote: undefined,
    };

    await user.save();

    return res.json({ msg: 'Owner request submitted', ownerRequest: user.ownerRequest });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getMyOwnerRequest,
  submitOwnerRequest,
};


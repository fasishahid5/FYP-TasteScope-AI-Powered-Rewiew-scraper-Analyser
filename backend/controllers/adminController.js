const User = require('../models/User');
const { toPublicUser } = require('../utils/user');

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users: users.map((u) => toPublicUser(u)) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ msg: 'User id is required' });
    }

    if (String(req.user?._id || req.user?.id) === String(id)) {
      return res.status(400).json({ msg: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User deleted', user: toPublicUser(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const customers = await User.countDocuments({ role: { $in: ['customer', 'analyst'] } });
    const owners = await User.countDocuments({ role: { $in: ['owner', 'business_owner'] } });
    const admins = await User.countDocuments({ role: 'admin' });

    res.json({
      totalUsers,
      verifiedUsers,
      roles: { customers, owners, admins },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const listOwnerRequests = async (req, res) => {
  try {
    const users = await User.find({ 'ownerRequest.status': 'pending' })
      .select('-password')
      .sort({ 'ownerRequest.submittedAt': -1, createdAt: -1 });

    res.json({
      requests: users.map((u) => toPublicUser(u, { includeOwnerRequest: true })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

const approveOwnerRequest = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if ((user.ownerRequest?.status || 'none') !== 'pending') {
      return res.status(400).json({ msg: 'Owner request is not pending' });
    }

    user.role = 'owner';
    user.ownerRequest.status = 'approved';
    user.ownerRequest.reviewedAt = new Date();
    user.ownerRequest.reviewedBy = req.user.id;
    if (note) {
      user.ownerRequest.reviewNote = String(note).trim();
    }

    await user.save();
    return res.json({ msg: 'Owner request approved', user: toPublicUser(user, { includeOwnerRequest: true }) });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

const rejectOwnerRequest = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if ((user.ownerRequest?.status || 'none') !== 'pending') {
      return res.status(400).json({ msg: 'Owner request is not pending' });
    }

    user.role = 'customer';
    user.ownerRequest.status = 'rejected';
    user.ownerRequest.reviewedAt = new Date();
    user.ownerRequest.reviewedBy = req.user.id;
    user.ownerRequest.reviewNote = note ? String(note).trim() : 'Rejected';

    await user.save();
    return res.json({ msg: 'Owner request rejected', user: toPublicUser(user, { includeOwnerRequest: true }) });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  listUsers,
  deleteUser,
  getStats,
  listOwnerRequests,
  approveOwnerRequest,
  rejectOwnerRequest,
};

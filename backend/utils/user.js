const normalizeRole = (value) => {
  if (!value) return 'customer';
  const role = String(value).toLowerCase();

  if (role === 'analyst') return 'customer';
  if (role === 'business_owner') return 'owner';

  if (role === 'customer' || role === 'owner' || role === 'admin') return role;
  return 'customer';
};

const toPublicUser = (userDoc, options = {}) => {
  if (!userDoc) return null;

  const user = typeof userDoc.toObject === 'function'
    ? userDoc.toObject({ virtuals: false })
    : userDoc;

  const publicUser = {
    id: String(user._id || user.id || ''),
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    bio: user.bio,
    phone: user.phone,
    city: user.city,
    country: user.country,
    countryCode: user.countryCode,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
    reviews: Array.isArray(user.reviews) ? user.reviews : [],
    restaurantVisits: Array.isArray(user.restaurantVisits) ? user.restaurantVisits : [],
    comparisons: Array.isArray(user.comparisons) ? user.comparisons : [],
    email: user.email,
    role: normalizeRole(user.role),
    provider: user.provider,
    isVerified: Boolean(user.isVerified),
    createdAt: user.createdAt,
  };

  if (options.includeOwnerRequest) {
    const ownerRequest = user.ownerRequest || {};
    publicUser.ownerRequest = {
      status: ownerRequest.status || 'none',
      businessName: ownerRequest.businessName,
      restaurantName: ownerRequest.restaurantName,
      phone: ownerRequest.phone,
      website: ownerRequest.website,
      submittedAt: ownerRequest.submittedAt,
      reviewedAt: ownerRequest.reviewedAt,
      reviewNote: ownerRequest.reviewNote,
    };
  }

  return publicUser;
};

module.exports = {
  normalizeRole,
  toPublicUser,
};

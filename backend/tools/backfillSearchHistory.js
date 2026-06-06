const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/tastescope';
const APPLY_CHANGES = process.argv.includes('--apply');

const normalizeKey = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const sanitizeDetails = (restaurant = {}) => {
  if (!restaurant || typeof restaurant !== 'object') return null;

  const details = {};
  const fields = [
    'restaurantId',
    'placeId',
    'name',
    'image',
    'cuisine',
    'priceRange',
    'rating',
    'location',
    'sentiment',
    'reviews',
    'lat',
    'lng',
  ];

  for (const field of fields) {
    const value = restaurant[field];
    if (value !== undefined && value !== null && value !== '') {
      details[field] = value;
    }
  }

  if (!details.restaurantId && restaurant.id != null) {
    details.restaurantId = String(restaurant.id);
  }

  if (!details.restaurantId && details.placeId) {
    details.restaurantId = String(details.placeId);
  }

  if (!details.placeId && restaurant.placeId != null) {
    details.placeId = String(restaurant.placeId);
  }

  if (!details.placeId && details.restaurantId) {
    details.placeId = String(details.restaurantId);
  }

  return Object.keys(details).length ? details : null;
};

const getRestaurantId = (entry = {}) =>
  normalizeKey(
    entry.restaurantId
    || entry.selectedRestaurantId
    || entry.details?.restaurantId
    || entry.details?.placeId
    || entry.selectedRestaurantDetails?.restaurantId
    || entry.selectedRestaurantDetails?.placeId
  );

const getQueryKey = (value) => normalizeKey(value)?.toLowerCase() || null;

const buildFallbackMap = (user) => {
  const byRestaurantId = new Map();
  const byQuery = new Map();

  const register = (source, details) => {
    if (!details) return;
    const restaurantId = getRestaurantId(source) || getRestaurantId(details);
    const queryKey = getQueryKey(source.query);

    if (restaurantId && !byRestaurantId.has(restaurantId)) {
      byRestaurantId.set(restaurantId, details);
    }

    if (queryKey && !byQuery.has(queryKey)) {
      byQuery.set(queryKey, details);
    }
  };

  (Array.isArray(user.searchClicks) ? user.searchClicks : []).forEach((click) => {
    const details = sanitizeDetails(click.selectedRestaurantDetails);
    register(click, details);
  });

  (Array.isArray(user.restaurantVisits) ? user.restaurantVisits : []).forEach((visit) => {
    const details = sanitizeDetails(visit.details);
    register(visit, details);
  });

  (Array.isArray(user.comparisons) ? user.comparisons : []).forEach((comparison) => {
    const leftDetails = sanitizeDetails(comparison.leftRestaurantDetails);
    const rightDetails = sanitizeDetails(comparison.rightRestaurantDetails);
    register({ restaurantId: comparison.leftRestaurantId }, leftDetails);
    register({ restaurantId: comparison.rightRestaurantId }, rightDetails);
  });

  (Array.isArray(user.searchHistory) ? user.searchHistory : []).forEach((search) => {
    const existing = sanitizeDetails(search.selectedRestaurantDetails || search.firstResultDetails);
    if (!existing) return;
    register(search, existing);
  });

  return { byRestaurantId, byQuery };
};

const mergeDetails = (baseDetails, fallbackDetails) => {
  if (!fallbackDetails) return baseDetails || null;
  if (!baseDetails) return fallbackDetails;

  const merged = { ...fallbackDetails, ...baseDetails };
  return sanitizeDetails(merged);
};

const repairSearchEntry = (search, fallbackMap) => {
  const currentDetails = sanitizeDetails(search.selectedRestaurantDetails || search.firstResultDetails);
  const currentRestaurantId = getRestaurantId(search) || getRestaurantId(currentDetails);
  const queryKey = getQueryKey(search.query);

  const fallbackDetails =
    (currentRestaurantId && fallbackMap.byRestaurantId.get(currentRestaurantId))
    || (queryKey && fallbackMap.byQuery.get(queryKey))
    || null;

  const repairedDetails = mergeDetails(currentDetails, fallbackDetails);
  const needsDetails = !currentDetails && !!repairedDetails;
  const needsRestaurantId = !normalizeKey(search.restaurantId) && !!getRestaurantId(repairedDetails);

  if (!needsDetails && !needsRestaurantId) return null;

  return {
    ...search.toObject(),
    restaurantId: normalizeKey(search.restaurantId) || getRestaurantId(repairedDetails) || undefined,
    selectedRestaurantDetails: repairedDetails || undefined,
    firstResultDetails: repairedDetails || search.firstResultDetails || undefined,
  };
};

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB');
  console.log(APPLY_CHANGES ? 'Running in APPLY mode' : 'Running in DRY-RUN mode');

  const users = await User.find({
    searchHistory: { $exists: true, $ne: [] },
  });

  let updatedUsers = 0;
  let updatedEntries = 0;

  for (const user of users) {
    const fallbackMap = buildFallbackMap(user);
    let userChanged = false;

    user.searchHistory = (Array.isArray(user.searchHistory) ? user.searchHistory : []).map((search) => {
      const repaired = repairSearchEntry(search, fallbackMap);
      if (!repaired) return search;
      userChanged = true;
      updatedEntries += 1;
      return repaired;
    });

    if (userChanged && APPLY_CHANGES) {
      await user.save();
      updatedUsers += 1;
      console.log(`Updated ${user.email || user._id}`);
    } else if (userChanged) {
      console.log(`Would update ${user.email || user._id}`);
    }
  }

  console.log(`Processed ${users.length} users`);
  console.log(`Updated entries: ${updatedEntries}`);
  console.log(APPLY_CHANGES ? `Saved users: ${updatedUsers}` : 'No database changes were written');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('backfillSearchHistory error:', err.message);
      process.exit(1);
    });
}

module.exports = {
  run,
  sanitizeDetails,
  repairSearchEntry,
  buildFallbackMap,
};

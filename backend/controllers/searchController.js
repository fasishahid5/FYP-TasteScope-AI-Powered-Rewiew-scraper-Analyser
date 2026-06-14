const User = require('../models/User');

const HISTORY_DETAILS_FIELDS = [
  'restaurantId',
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
  'placeId',
  'naturalReview',
  'aiOverview',
  'aiVerdict',
  'insight',
  'isFallback',
  'naturalReviewSections',
  'source',
  'model',
];

const sanitizeRestaurantDetails = (restaurant = {}) => {
  if (!restaurant || typeof restaurant !== 'object') return null;

  const details = {};
  for (const field of HISTORY_DETAILS_FIELDS) {
    if (restaurant[field] !== undefined && restaurant[field] !== null && restaurant[field] !== '') {
      details[field] = restaurant[field];
    }
  }

  if (!details.restaurantId && restaurant.id != null) {
    details.restaurantId = String(restaurant.id);
  }

  if (!details.restaurantId && restaurant.placeId != null) {
    details.restaurantId = String(restaurant.placeId);
  }

  if (!details.placeId && restaurant.placeId != null) {
    details.placeId = String(restaurant.placeId);
  }

  return Object.keys(details).length ? details : null;
};

const sanitizeResultsShown = (results = []) => (
  Array.isArray(results)
    ? results.map(sanitizeRestaurantDetails).filter(Boolean).slice(0, 50)
    : []
);

const getHistoryDate = (entry = {}) =>
  entry.clickedAt || entry.searchedAt || entry.createdAt || entry.visitedAt || entry.favoritedAt || new Date(0);

const getCurrentUserId = (req) => req.user?.id || req.userId || null;

const normalizeHistoryKey = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const getDetailsRestaurantId = (details = null) => {
  if (!details || typeof details !== 'object') return null;

  return normalizeHistoryKey(details.restaurantId || details.placeId || details.id);
};

const getRestaurantLocationKey = (details = null) => {
  if (!details || typeof details !== 'object' || !details.name || !details.location) return null;

  const name = String(details.name).toLowerCase().trim();
  const location = String(details.location).toLowerCase().trim();
  return name && location ? `name-location:${name}|${location}` : null;
};

const getHistoryAliases = (entry = {}) => {
  const aliases = new Set();
  const addAlias = (value) => {
    const normalized = normalizeHistoryKey(value);
    if (normalized) aliases.add(normalized);
  };
  const addDetailsAliases = (details = null) => {
    if (!details || typeof details !== 'object') return;
    addAlias(getDetailsRestaurantId(details));
    addAlias(getRestaurantLocationKey(details));
    if (!details.location && details.name) {
      addAlias(`name:${String(details.name).toLowerCase().trim()}`);
    }
  };

  addAlias(entry.restaurantId);
  addAlias(entry.leftRestaurantId);
  addAlias(entry.rightRestaurantId);
  addDetailsAliases(entry.details);
  addDetailsAliases(entry.selectedRestaurantDetails);
  addDetailsAliases(entry.firstResultDetails);
  addDetailsAliases(entry.leftRestaurantDetails);
  addDetailsAliases(entry.rightRestaurantDetails);

  if (!aliases.size && entry.type === 'searched' && entry.query) {
    addAlias(`query:${String(entry.query).toLowerCase().trim()}`);
  }

  return [...aliases];
};

const filterEntriesByAliases = (entries = [], aliases = []) => {
  const aliasSet = new Set((Array.isArray(aliases) ? aliases : []).map(normalizeHistoryKey).filter(Boolean));
  if (!aliasSet.size) return Array.isArray(entries) ? entries : [];

  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const entryAliases = getHistoryAliases(entry);
    return !entryAliases.some((alias) => aliasSet.has(alias));
  });
};

const removeHistoryEntriesForAliases = (user, aliases = []) => {
  const normalizedAliases = [...new Set((Array.isArray(aliases) ? aliases : []).map(normalizeHistoryKey).filter(Boolean))];
  if (!normalizedAliases.length) return;

  user.searchHistory = filterEntriesByAliases(user.searchHistory, normalizedAliases);
  user.restaurantVisits = filterEntriesByAliases(user.restaurantVisits, normalizedAliases);
  user.favoriteHistory = filterEntriesByAliases(user.favoriteHistory, normalizedAliases);
  user.comparisons = filterEntriesByAliases(user.comparisons, normalizedAliases);
};

const getDetailsDedupAliases = (details = null) => [
  getDetailsRestaurantId(details),
  getRestaurantLocationKey(details),
].filter(Boolean);

const normalizeTextKey = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).toLowerCase().trim().replace(/\s+/g, ' ');
  return normalized || null;
};

const getUnifiedHistoryItemId = (entry = {}, type = null) => {
  const normalizedType = String(type || entry.type || '').toLowerCase();
  const entryId = normalizeHistoryKey(entry?._id);
  if (entryId) return entryId;

  const dateValue = getHistoryDate(entry);
  const timestamp = new Date(dateValue).getTime();

  if (normalizedType === 'favorite') {
    const restaurantId = normalizeHistoryKey(entry.restaurantId || getDetailsRestaurantId(entry.details));
    return `${restaurantId || 'favorite'}-${timestamp}`;
  }

  if (normalizedType === 'compared') {
    const leftRestaurantId = normalizeHistoryKey(entry.leftRestaurantId || getDetailsRestaurantId(entry.leftRestaurantDetails));
    const rightRestaurantId = normalizeHistoryKey(entry.rightRestaurantId || getDetailsRestaurantId(entry.rightRestaurantDetails));
    return `${leftRestaurantId || 'comparison'}-${rightRestaurantId || 'comparison'}-${timestamp}`;
  }

  if (normalizedType === 'visited') {
    const restaurantId = normalizeHistoryKey(entry.restaurantId || getDetailsRestaurantId(entry.details));
    return `${restaurantId || 'visit'}-${timestamp}`;
  }

  if (normalizedType === 'searched') {
    return `${timestamp}`;
  }

  if (normalizedType === 'search_click') {
    const restaurantId = normalizeHistoryKey(entry.selectedRestaurantId || getDetailsRestaurantId(entry.selectedRestaurantDetails));
    return `${restaurantId || 'search-click'}-${timestamp}`;
  }

  return entryId || `${timestamp}`;
};

const getUnifiedHistoryPayload = (user) => {
  const favoriteHistoryItems = (Array.isArray(user.favoriteHistory) ? user.favoriteHistory : []).map((favorite) => {
    const details = sanitizeRestaurantDetails(favorite.details);
    const restaurantId = normalizeHistoryKey(favorite.restaurantId || getDetailsRestaurantId(details));
    return {
      _id: getUnifiedHistoryItemId(favorite, 'favorite'),
      type: 'favorite',
      restaurantId,
      favoritedAt: favorite.favoritedAt,
      name: details?.name || restaurantId || 'Favorite',
      details,
      __aliases: [restaurantId, ...getDetailsDedupAliases(details)].filter(Boolean),
    };
  });

  const fallbackFavoriteItems = (Array.isArray(user.favorites) ? user.favorites : []).map((restaurantId) => {
    const normalizedRestaurantId = normalizeHistoryKey(restaurantId);
    return {
      _id: String(normalizedRestaurantId),
      type: 'favorite',
      restaurantId: normalizedRestaurantId,
      name: normalizedRestaurantId || 'Favorite',
      __aliases: [normalizedRestaurantId].filter(Boolean),
    };
  });

  const searchHistoryItems = (Array.isArray(user.searchHistory) ? user.searchHistory : []).map((search) => {
    const details = sanitizeRestaurantDetails(
      search.selectedRestaurantDetails
      || search.firstResultDetails
      || (Array.isArray(search.resultsShown) ? search.resultsShown[0] : null)
    );
    const restaurantId = normalizeHistoryKey(search.restaurantId || getDetailsRestaurantId(details));
    const aliases = [
      restaurantId,
      ...getDetailsDedupAliases(details),
      search.query ? `query:${String(search.query).toLowerCase().trim()}` : null,
    ].filter(Boolean);

    return {
      _id: getUnifiedHistoryItemId(search, 'searched'),
      type: 'searched',
      query: search.query,
      restaurantId,
      resultCount: search.resultCount,
      searchedAt: search.searchedAt,
      name: details?.name || restaurantId || search.query,
      details,
      resultsShown: sanitizeResultsShown(search.resultsShown),
      __aliases: aliases,
    };
  });

  const searchClickHistoryItems = (Array.isArray(user.searchClicks) ? user.searchClicks : []).map((click) => {
    const details = sanitizeRestaurantDetails(click.selectedRestaurantDetails);
    const restaurantId = normalizeHistoryKey(click.selectedRestaurantId || getDetailsRestaurantId(details));
    const historyId = getUnifiedHistoryItemId(click, 'search_click');

    return {
      _id: historyId,
      type: 'search_click',
      query: click.query,
      restaurantId,
      resultCount: Array.isArray(click.resultsShown) ? click.resultsShown.length : 0,
      resultsShown: sanitizeResultsShown(click.resultsShown),
      position: click.position,
      clickedAt: click.clickedAt,
      searchedAt: click.clickedAt,
      name: details?.name || restaurantId || click.query,
      details,
      __aliases: [`search-click:${historyId}`],
    };
  });

  const comparisonHistoryItems = (Array.isArray(user.comparisons) ? user.comparisons : []).map((comparison) => {
    const leftDetails = sanitizeRestaurantDetails(comparison.leftRestaurantDetails);
    const rightDetails = sanitizeRestaurantDetails(comparison.rightRestaurantDetails);
    const leftRestaurantId = normalizeHistoryKey(
      comparison.leftRestaurantId || getDetailsRestaurantId(leftDetails)
    );
    const rightRestaurantId = normalizeHistoryKey(
      comparison.rightRestaurantId || getDetailsRestaurantId(rightDetails)
    );
    const aliases = [
      leftRestaurantId,
      rightRestaurantId,
      ...getDetailsDedupAliases(leftDetails),
      ...getDetailsDedupAliases(rightDetails),
    ].filter(Boolean);
    const leftName = leftDetails?.name || leftRestaurantId;
    const rightName = rightDetails?.name || rightRestaurantId;

    return {
      _id: getUnifiedHistoryItemId(comparison, 'compared'),
      type: 'compared',
      restaurantId: leftRestaurantId || rightRestaurantId,
      leftRestaurantId,
      rightRestaurantId,
      createdAt: comparison.createdAt,
      note: comparison.note,
      name: leftName || rightName || 'Comparison',
      details: leftDetails || rightDetails,
      comparedWith: rightName || leftName || '',
      comparisonLabel: leftName && rightName ? `${leftName} compared with ${rightName}` : comparison.note || 'Compared restaurants',
      comparisonDetails: rightDetails || null,
      __aliases: aliases,
    };
  });

  const visitHistoryItems = (Array.isArray(user.restaurantVisits) ? user.restaurantVisits : []).map((visit) => {
    const details = sanitizeRestaurantDetails(visit.details);
    const restaurantId = normalizeHistoryKey(visit.restaurantId || getDetailsRestaurantId(details));

    return {
      _id: getUnifiedHistoryItemId(visit, 'visited'),
      type: 'visited',
      restaurantId,
      visitedAt: visit.visitedAt,
      name: details?.name || restaurantId || 'Visited restaurant',
      details,
      __aliases: [restaurantId, ...getDetailsDedupAliases(details)].filter(Boolean),
    };
  });

  const allHistory = dedupeUnifiedHistory([
    ...searchClickHistoryItems,
    ...searchHistoryItems,
    ...comparisonHistoryItems,
    ...favoriteHistoryItems,
    ...fallbackFavoriteItems,
    ...visitHistoryItems,
  ]);

  return {
    history: allHistory,
    stats: buildUnifiedHistoryStats(allHistory),
  };
};

const dedupeUnifiedHistory = (items = []) => {
  const sortedItems = [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => new Date(getHistoryDate(b)) - new Date(getHistoryDate(a))
  );

  const seenAliases = new Set();
  const uniqueItems = [];

  for (const item of sortedItems) {
    const aliases = (item.__aliases || []).map(normalizeHistoryKey).filter(Boolean);
    const uniqueAliases = aliases.length ? aliases : [normalizeHistoryKey(item._id) || `item:${uniqueItems.length}`];

    if (uniqueAliases.some((alias) => seenAliases.has(alias))) {
      continue;
    }

    uniqueItems.push(item);
    uniqueAliases.forEach((alias) => seenAliases.add(alias));
  }

  return uniqueItems.map(({ __aliases, ...item }) => item);
};

const buildUnifiedHistoryStats = (items = []) => {
  return items.reduce(
    (stats, item) => {
      if (item.type === 'searched') stats.searches += 1;
      if (item.type === 'search_click') {
        stats.searches += 1;
        stats.clicks += 1;
      }
      if (item.type === 'compared') stats.comparisons += 1;
      if (item.type === 'favorite') stats.favorites += 1;
      if (item.type === 'visited') stats.visits += 1;
      return stats;
    },
    { searches: 0, clicks: 0, comparisons: 0, favorites: 0, visits: 0 }
  );
};

/**
 * Get unified history (searches, comparisons, favorites, visits)
 * GET /api/search/history/all
 */
const getUnifiedHistory = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json(getUnifiedHistoryPayload(user));
  } catch (err) {
    console.error('getUnifiedHistory error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Toggle favorite for a restaurant
 * POST /api/search/favorite/toggle
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { restaurantId, restaurantDetails = null } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!restaurantId) {
      return res.status(400).json({ msg: 'restaurantId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const detailsSnapshot = sanitizeRestaurantDetails(restaurantDetails);
    const normalizedRestaurantId = String(restaurantId);
    user.favorites = Array.isArray(user.favorites) ? user.favorites : [];
    const index = user.favorites.indexOf(normalizedRestaurantId);
    user.favoriteHistory = Array.isArray(user.favoriteHistory) ? user.favoriteHistory : [];

    if (index > -1) {
      // Remove from favorites
      user.favorites.splice(index, 1);
      user.favoriteHistory = user.favoriteHistory.filter(
        (entry) => String(entry.restaurantId) !== normalizedRestaurantId
      );
    } else {
      // Add to favorites
      removeHistoryEntriesForAliases(user, [normalizedRestaurantId, ...getDetailsDedupAliases(detailsSnapshot)]);
      user.favorites.push(normalizedRestaurantId);
      user.favoriteHistory.unshift({
        restaurantId: normalizedRestaurantId,
        favoritedAt: new Date(),
        details: detailsSnapshot || undefined,
      });
    }

    await user.save();

    return res.json({
      msg: index > -1 ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: index === -1,
      favorites: user.favorites,
      favoriteHistory: user.favoriteHistory,
    });
  } catch (err) {
    console.error('toggleFavorite error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Add restaurant to favorites
 * POST /api/search/favorite/add
 */
const addFavorite = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { restaurantId, restaurantDetails = null } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!restaurantId) {
      return res.status(400).json({ msg: 'restaurantId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.favorites = Array.isArray(user.favorites) ? user.favorites : [];
    user.favoriteHistory = Array.isArray(user.favoriteHistory) ? user.favoriteHistory : [];
    const detailsSnapshot = sanitizeRestaurantDetails(restaurantDetails);
    const normalizedRestaurantId = String(restaurantId);

    if (!user.favorites.includes(normalizedRestaurantId)) {
      user.favorites.push(normalizedRestaurantId);
    }

    removeHistoryEntriesForAliases(user, [normalizedRestaurantId, ...getDetailsDedupAliases(detailsSnapshot)]);
    user.favoriteHistory = user.favoriteHistory.filter(
      (entry) => String(entry.restaurantId) !== normalizedRestaurantId
    );
    user.favoriteHistory.unshift({
      restaurantId: normalizedRestaurantId,
      favoritedAt: new Date(),
      details: detailsSnapshot || undefined,
    });

    await user.save();

    return res.json({
      msg: 'Added to favorites',
      favorites: user.favorites,
      favoriteHistory: user.favoriteHistory,
    });
  } catch (err) {
    console.error('addFavorite error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Remove from favorites
 * POST /api/search/favorite/remove
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { restaurantId } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!restaurantId) {
      return res.status(400).json({ msg: 'restaurantId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.favorites = Array.isArray(user.favorites) ? user.favorites : [];
    user.favoriteHistory = Array.isArray(user.favoriteHistory) ? user.favoriteHistory : [];
    const normalizedRestaurantId = String(restaurantId);
    const index = user.favorites.indexOf(normalizedRestaurantId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    }

    user.favoriteHistory = user.favoriteHistory.filter(
      (entry) => String(entry.restaurantId) !== normalizedRestaurantId
    );

    await user.save();

    return res.json({
      msg: 'Removed from favorites',
      favorites: user.favorites,
      favoriteHistory: user.favoriteHistory,
    });
  } catch (err) {
    console.error('removeFavorite error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Get all favorites
 * GET /api/search/favorites
 */
const getFavorites = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json({
      favorites: user.favorites || [],
      count: (user.favorites || []).length,
    });
  } catch (err) {
    console.error('getFavorites error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Log a search query to user's search history
 * POST /api/search/log
 */
const logSearch = async (req, res) => {
  try {
    const {
      query,
      resultCount = 0,
      selectedRestaurantDetails = null,
      restaurantId = null,
      resultsShown = [],
    } = req.body;
    const userId = getCurrentUserId(req);
    console.log('req.user:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null);

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!query || String(query).trim().length < 2) {
      return res.status(400).json({ msg: 'Query must be at least 2 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create new search history entry
    const resultsSnapshot = sanitizeResultsShown(resultsShown);
    const detailsSnapshot = sanitizeRestaurantDetails(selectedRestaurantDetails) || resultsSnapshot[0] || null;
    const normalizedRestaurantId = normalizeHistoryKey(
      restaurantId || detailsSnapshot?.restaurantId || detailsSnapshot?.placeId
    );
    removeHistoryEntriesForAliases(user, [
      normalizedRestaurantId,
      ...getDetailsDedupAliases(detailsSnapshot),
      `query:${String(query).toLowerCase().trim()}`,
    ]);
    const newSearch = {
      query: String(query).trim(),
      resultCount: parseInt(resultCount) || 0,
      searchedAt: new Date(),
      restaurantId: normalizedRestaurantId || undefined,
      selectedRestaurantDetails: detailsSnapshot || undefined,
      resultsShown: resultsSnapshot.length ? resultsSnapshot : undefined,
    };

    // Add to search history (newest first) and keep only last 100 searches
    user.searchHistory.unshift(newSearch);
    user.searchHistory = user.searchHistory.slice(0, 100);

    await user.save();

    return res.json({
      msg: 'Search logged successfully',
      searchHistory: user.searchHistory,
    });
  } catch (err) {
    console.error('logSearch error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Log a clicked search result to user's click intelligence history
 * POST /api/search/click-log
 */
const logSearchClick = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      query,
      selectedRestaurant = null,
      resultsShown = [],
      position = 0,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!query || String(query).trim().length < 2) {
      return res.status(400).json({ msg: 'Query must be at least 2 characters' });
    }

    const selectedRestaurantDetails = sanitizeRestaurantDetails(selectedRestaurant);
    if (!selectedRestaurantDetails) {
      return res.status(400).json({ msg: 'selectedRestaurant is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const selectedRestaurantId = normalizeHistoryKey(
      selectedRestaurantDetails.restaurantId || selectedRestaurantDetails.placeId
    );
    const resultsSnapshot = sanitizeResultsShown(resultsShown);

    user.searchClicks = Array.isArray(user.searchClicks) ? user.searchClicks : [];
    user.searchClicks.unshift({
      query: String(query).trim(),
      selectedRestaurantId: selectedRestaurantId || undefined,
      selectedRestaurantDetails,
      resultsShown: resultsSnapshot,
      position: parseInt(position, 10) || 0,
      clickedAt: new Date(),
    });
    user.searchClicks = user.searchClicks.slice(0, 200);

    await user.save();

    return res.json({
      success: true,
      msg: 'Search click logged successfully',
      searchClick: user.searchClicks[0],
    });
  } catch (err) {
    console.error('logSearchClick error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Get recent searches for the user
 * GET /api/search/recent?limit=6
 */
const getRecentSearches = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const clickSearches = (Array.isArray(user.searchClicks) ? user.searchClicks : []).map((click) => {
      const details = sanitizeRestaurantDetails(click.selectedRestaurantDetails);
      const restaurantId = normalizeHistoryKey(click.selectedRestaurantId || getDetailsRestaurantId(details));
      return {
        _id: click._id,
        type: 'search_click',
        query: click.query,
        restaurantId,
        resultCount: Array.isArray(click.resultsShown) ? click.resultsShown.length : 0,
        selectedRestaurantDetails: details || {},
        resultsShown: sanitizeResultsShown(click.resultsShown),
        position: click.position,
        searchedAt: click.clickedAt,
        clickedAt: click.clickedAt,
      };
    });

    const legacySearches = (Array.isArray(user.searchHistory) ? user.searchHistory : []).map((search) => ({
      _id: search._id,
      type: 'searched',
      query: search.query,
      restaurantId: search.restaurantId,
      resultCount: search.resultCount,
      selectedRestaurantDetails: sanitizeRestaurantDetails(search.selectedRestaurantDetails || search.firstResultDetails) || {},
      searchedAt: search.searchedAt,
    }));

    const searchEvents = [...clickSearches, ...legacySearches].sort(
      (a, b) => new Date(b.searchedAt || b.clickedAt) - new Date(a.searchedAt || a.clickedAt)
    );

    // Get unique searches, deduped by clicked restaurant when available, then query
    const seen = new Set();
    const uniqueSearches = [];

    for (const search of searchEvents) {
      const queryKey = String(search.query || '').toLowerCase().trim();
      const details = sanitizeRestaurantDetails(search.selectedRestaurantDetails);
      const historyKey = getDetailsRestaurantId(details) || queryKey;
      if (!seen.has(historyKey)) {
        seen.add(historyKey);
        uniqueSearches.push(search);
        if (uniqueSearches.length >= limit) break;
      }
    }

    return res.json({
      recentSearches: uniqueSearches,
      total: uniqueSearches.length,
    });
  } catch (err) {
    console.error('getRecentSearches error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Clear all search history
 * POST /api/search/clear
 */
const clearSearchHistory = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.searchHistory = [];
    user.searchClicks = [];
    await user.save();

    return res.json({ msg: 'Search history cleared' });
  } catch (err) {
    console.error('clearSearchHistory error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Delete a specific search from history
 * DELETE /api/search/:searchId
 */
const deleteSearch = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { searchId } = req.params;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.searchHistory = user.searchHistory.filter(
      (s) => s._id.toString() !== searchId
    );
    user.searchClicks = (Array.isArray(user.searchClicks) ? user.searchClicks : []).filter(
      (s) => s._id.toString() !== searchId
    );
    await user.save();

    return res.json({ msg: 'Search deleted', searchHistory: user.searchHistory });
  } catch (err) {
    console.error('deleteSearch error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Delete a specific unified history item
 * DELETE /api/search/history/:historyId
 */
const deleteUnifiedHistoryItem = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { historyId } = req.params;
    const payload = {
      ...(req.body || {}),
      ...(req.query || {}),
    };
    const { type, restaurantId } = payload;
    const query = payload.query || null;
    const name = payload.name || payload.comparisonLabel || null;
    const location = payload.location || null;
    const leftRestaurantId = payload.leftRestaurantId || null;
    const rightRestaurantId = payload.rightRestaurantId || null;
    const leftRestaurantName = payload.leftRestaurantName || null;
    const rightRestaurantName = payload.rightRestaurantName || null;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!historyId) {
      return res.status(400).json({ msg: 'historyId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const normalizedHistoryId = normalizeHistoryKey(historyId);
    const normalizedType = String(type || '').toLowerCase();
    const normalizedRestaurantId = normalizeHistoryKey(restaurantId || historyId);
    const normalizedQuery = normalizeTextKey(query);
    const normalizedName = normalizeTextKey(name);
    const normalizedLocation = normalizeTextKey(location);
    const normalizedLeftRestaurantId = normalizeHistoryKey(leftRestaurantId);
    const normalizedRightRestaurantId = normalizeHistoryKey(rightRestaurantId);
    const normalizedLeftRestaurantName = normalizeTextKey(leftRestaurantName);
    const normalizedRightRestaurantName = normalizeTextKey(rightRestaurantName);
    let deleted = false;

    const removeMatching = (entries = [], matcher) => {
      const list = Array.isArray(entries) ? entries : [];
      const filtered = list.filter((entry) => !matcher(entry));
      if (filtered.length !== list.length) deleted = true;
      return filtered;
    };

    const matchesHistoryId = (entry, entryType = null) => {
      if (!entry) return false;
      const candidates = [
        getUnifiedHistoryItemId(entry, entryType),
        normalizeHistoryKey(entry._id),
        ...getHistoryAliases(entry),
      ].filter(Boolean);
      return candidates.includes(normalizedHistoryId);
    };

    const matchesContent = (entry, entryType = null) => {
      if (!entry) return false;

      const entryDetails = sanitizeRestaurantDetails(
        entry.details || entry.selectedRestaurantDetails || entry.firstResultDetails || entry.leftRestaurantDetails || entry.rightRestaurantDetails
      );
      const entryName = normalizeTextKey(entry.name || entry.query || entryDetails?.name);
      const entryLocation = normalizeTextKey(entryDetails?.location);
      const entryRestaurantId = normalizeHistoryKey(
        entry.restaurantId
        || entry.leftRestaurantId
        || entry.rightRestaurantId
        || getDetailsRestaurantId(entryDetails)
      );
      const entryLeftRestaurantId = normalizeHistoryKey(entry.leftRestaurantId || getDetailsRestaurantId(entry.leftRestaurantDetails));
      const entryRightRestaurantId = normalizeHistoryKey(entry.rightRestaurantId || getDetailsRestaurantId(entry.rightRestaurantDetails));
      const entryLeftName = normalizeTextKey(entry.leftRestaurantDetails?.name);
      const entryRightName = normalizeTextKey(entry.rightRestaurantDetails?.name);

      if (normalizedRestaurantId && entryRestaurantId === normalizedRestaurantId) return true;
      if (normalizedQuery && normalizeTextKey(entry.query) === normalizedQuery) return true;
      if (normalizedName && entryName === normalizedName && (!normalizedLocation || entryLocation === normalizedLocation)) return true;
      if (normalizedName && normalizedLocation && entryLocation === normalizedLocation && entryName === normalizedName) return true;

      if (entryType === 'compared' || normalizedType === 'compared') {
        if (normalizedLeftRestaurantId && entryLeftRestaurantId === normalizedLeftRestaurantId) return true;
        if (normalizedRightRestaurantId && entryRightRestaurantId === normalizedRightRestaurantId) return true;
        if (normalizedLeftRestaurantName && entryLeftName === normalizedLeftRestaurantName) return true;
        if (normalizedRightRestaurantName && entryRightName === normalizedRightRestaurantName) return true;
      }

      return false;
    };

    if (!normalizedType || normalizedType === 'searched') {
      user.searchHistory = removeMatching(user.searchHistory, (entry) => matchesHistoryId(entry, 'searched') || matchesContent(entry, 'searched'));
    }

    if (!normalizedType || normalizedType === 'search_click') {
      user.searchClicks = removeMatching(user.searchClicks, (entry) => matchesHistoryId(entry, 'search_click') || matchesContent(entry, 'search_click'));
    }

    if (!normalizedType || normalizedType === 'visited') {
      user.restaurantVisits = removeMatching(user.restaurantVisits, (entry) => matchesHistoryId(entry, 'visited') || matchesContent(entry, 'visited'));
    }

    if (!normalizedType || normalizedType === 'compared') {
      user.comparisons = removeMatching(user.comparisons, (entry) => matchesHistoryId(entry, 'compared') || matchesContent(entry, 'compared'));
    }

    if (!normalizedType || normalizedType === 'favorite') {
      user.favoriteHistory = removeMatching(
        user.favoriteHistory,
        (entry) => matchesHistoryId(entry, 'favorite') || matchesContent(entry, 'favorite') || (
          normalizedRestaurantId
          && normalizeHistoryKey(entry.restaurantId || getDetailsRestaurantId(entry.details)) === normalizedRestaurantId
        )
      );

      const favorites = Array.isArray(user.favorites) ? user.favorites : [];
      const filteredFavorites = normalizedRestaurantId
        ? favorites.filter((favorite) => normalizeHistoryKey(favorite) !== normalizedRestaurantId)
        : favorites;

      if (filteredFavorites.length !== favorites.length) deleted = true;
      user.favorites = filteredFavorites;
    }

    if (!deleted) {
      return res.status(404).json({ msg: 'History item not found' });
    }

    await user.save();

    return res.json({
      msg: 'History item deleted successfully',
      ...getUnifiedHistoryPayload(user),
    });
  } catch (err) {
    console.error('deleteUnifiedHistoryItem error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Save a restaurant comparison
 * POST /api/search/comparison/save
 */
const saveComparison = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      leftRestaurantId,
      rightRestaurantId,
      note,
      leftRestaurantDetails = null,
      rightRestaurantDetails = null,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!leftRestaurantId || !rightRestaurantId) {
      return res.status(400).json({ msg: 'leftRestaurantId and rightRestaurantId are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.comparisons = Array.isArray(user.comparisons) ? user.comparisons : [];
    const leftDetailsSnapshot = sanitizeRestaurantDetails(leftRestaurantDetails);
    const rightDetailsSnapshot = sanitizeRestaurantDetails(rightRestaurantDetails);
    const normalizedLeftRestaurantId = normalizeHistoryKey(
      leftRestaurantId || leftDetailsSnapshot?.restaurantId || leftDetailsSnapshot?.placeId
    );
    const normalizedRightRestaurantId = normalizeHistoryKey(
      rightRestaurantId || rightDetailsSnapshot?.restaurantId || rightDetailsSnapshot?.placeId
    );

    removeHistoryEntriesForAliases(user, [
      normalizedLeftRestaurantId,
      normalizedRightRestaurantId,
      ...getDetailsDedupAliases(leftDetailsSnapshot),
      ...getDetailsDedupAliases(rightDetailsSnapshot),
    ]);

    // Add comparison to user's comparisons array
    user.comparisons.unshift({
      leftRestaurantId: normalizedLeftRestaurantId,
      rightRestaurantId: normalizedRightRestaurantId,
      createdAt: new Date(),
      note: note || '',
      leftRestaurantDetails: leftDetailsSnapshot || undefined,
      rightRestaurantDetails: rightDetailsSnapshot || undefined,
    });
    user.comparisons = user.comparisons.slice(0, 100);

    await user.save();

    return res.json({
      msg: 'Comparison saved successfully',
      comparison: {
        leftRestaurantId: normalizedLeftRestaurantId,
        rightRestaurantId: normalizedRightRestaurantId,
        note,
        createdAt: new Date(),
        leftRestaurantDetails: leftDetailsSnapshot,
        rightRestaurantDetails: rightDetailsSnapshot,
      },
    });
  } catch (err) {
    console.error('saveComparison error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Log a restaurant visit
 * POST /api/search/visit/log
 */
const logVisit = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { restaurantId, restaurantDetails = null } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    if (!restaurantId && !restaurantDetails) {
      return res.status(400).json({ msg: 'restaurantId or restaurantDetails is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.restaurantVisits = Array.isArray(user.restaurantVisits) ? user.restaurantVisits : [];
    const detailsSnapshot = sanitizeRestaurantDetails(restaurantDetails);
    const resolvedRestaurantId = normalizeHistoryKey(
      restaurantId
      || detailsSnapshot?.restaurantId
      || restaurantDetails?.placeId
      || restaurantDetails?.id
    );

    removeHistoryEntriesForAliases(user, [resolvedRestaurantId, ...getDetailsDedupAliases(detailsSnapshot)]);
    user.restaurantVisits.unshift({
      restaurantId: resolvedRestaurantId,
      visitedAt: new Date(),
      details: detailsSnapshot || undefined,
    });
    user.restaurantVisits = user.restaurantVisits.slice(0, 100);

    await user.save();

    return res.json({
      msg: 'Visit logged successfully',
      restaurantVisits: user.restaurantVisits,
    });
  } catch (err) {
    console.error('logVisit error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Clear all browsing history
 * POST /api/search/history/clear
 */
const clearHistory = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.searchHistory = [];
    user.searchClicks = [];
    user.restaurantVisits = [];
    user.comparisons = [];
    user.favoriteHistory = [];
    user.favorites = [];
    await user.save();

    return res.json({ msg: 'History cleared successfully' });
  } catch (err) {
    console.error('clearHistory error:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  logSearch,
  logSearchClick,
  getRecentSearches,
  clearSearchHistory,
  deleteSearch,
  deleteUnifiedHistoryItem,
  getUnifiedHistory,
  saveComparison,
  logVisit,
  clearHistory,
  toggleFavorite,
  addFavorite,
  removeFavorite,
  getFavorites,
};

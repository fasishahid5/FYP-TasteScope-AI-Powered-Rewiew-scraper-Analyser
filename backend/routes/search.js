const express = require('express');
const {
  logSearch,
  logSearchClick,
  getRecentSearches,
  clearSearchHistory,
  deleteSearch,
  deleteUnifiedHistoryItem,
  getUnifiedHistory,
  saveComparison,
  logVisit,
  getCachedVisit,
  clearHistory,
  toggleFavorite,
  addFavorite,
  removeFavorite,
  getFavorites,
} = require('../controllers/searchController');
const protectRoute = require('../middleware/auth');

const router = express.Router();

// Search endpoints
router.post('/log', protectRoute, logSearch);
router.post('/click-log', protectRoute, logSearchClick);
router.get('/recent', protectRoute, getRecentSearches);
router.post('/clear', protectRoute, clearSearchHistory);
router.delete('/:searchId', protectRoute, deleteSearch);

// Unified history endpoint
router.get('/history/all', protectRoute, getUnifiedHistory);
router.post('/history/clear', protectRoute, clearHistory);
router.delete('/history/:historyId', protectRoute, deleteUnifiedHistoryItem);

// Comparison endpoints
router.post('/comparison/save', protectRoute, saveComparison);
router.post('/visit/log', protectRoute, logVisit);
router.get('/visit/cache', protectRoute, getCachedVisit);

// Favorites endpoints
router.get('/favorites', protectRoute, getFavorites);
router.post('/favorite/toggle', protectRoute, toggleFavorite);
router.post('/favorite/add', protectRoute, addFavorite);
router.post('/favorite/remove', protectRoute, removeFavorite);

module.exports = router;

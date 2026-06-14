import { API_BASE_URL, getStoredToken, getStoredUser, handleExpiredAuthSession } from './auth';

const API_URL = `${API_BASE_URL}/api/search`;

const getAuthToken = () => getStoredToken() || getStoredUser()?.token || null;


const handleUnauthorizedResponse = (response) => {
  if (response?.status === 401) {
    handleExpiredAuthSession();
    return true;
  }

  return false;
};

const serializeRestaurantDetails = (restaurant = null) => {
  if (!restaurant || typeof restaurant !== 'object') return null;

  const details = {};
  const fields = [
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

  fields.forEach((field) => {
    const value = restaurant[field];
    if (value !== undefined && value !== null && value !== '') {
      details[field] = value;
    }
  });

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

/**
 * Log a search to the database
 * @param {string} query - The search query
 * @param {number} resultCount - Number of results found
 * @param {Object} selectedRestaurantDetails - Details of selected restaurant (optional)
 */
export async function logSearchToDatabase(
  query,
  resultCount = 0,
  selectedRestaurantDetails = null,
  resultsShown = []
) {
  try {
    const user = getStoredUser();
    const token = getAuthToken();
    const restaurantId = selectedRestaurantDetails?.restaurantId || selectedRestaurantDetails?.placeId || selectedRestaurantDetails?.id || null;
    console.log('Stored User:', user);
    console.log('Token:', token);
    console.log('Authorization Header:', `Bearer ${token}`);
    if (!token) return null;

    const response = await fetch(`${API_URL}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        resultCount,
        selectedRestaurantDetails,
        restaurantId,
        resultsShown: (Array.isArray(resultsShown) ? resultsShown : [])
          .map(serializeRestaurantDetails)
          .filter(Boolean),
      }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to log search:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('logSearchToDatabase error:', err);
    return null;
  }
}

/**
 * Log a real result click to the database
 * @param {Object} payload - Search click intelligence payload
 */
export async function logSearchClickToDatabase({
  query,
  selectedRestaurant,
  resultsShown = [],
  position = 0,
}) {
  try {
    const token = getAuthToken();
    const selectedRestaurantDetails = serializeRestaurantDetails(selectedRestaurant);
    if (!token || !selectedRestaurantDetails) return null;

    const response = await fetch(`${API_URL}/click-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        selectedRestaurant: selectedRestaurantDetails,
        resultsShown: (Array.isArray(resultsShown) ? resultsShown : [])
          .map(serializeRestaurantDetails)
          .filter(Boolean),
        position,
      }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to log search click:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('logSearchClickToDatabase error:', err);
    return null;
  }
}

/**
 * Fetch recent searches from database
 * @param {number} limit - Maximum number of searches to fetch (default 6)
 */
export async function fetchRecentSearches(limit = 6) {
  try {
    const token = getAuthToken();
    if (!token) return [];

    const response = await fetch(`${API_URL}/recent?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return [];
      console.error('Failed to fetch recent searches:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.recentSearches || [];
  } catch (err) {
    console.error('fetchRecentSearches error:', err);
    return [];
  }
}

/**
 * Clear all search history
 */
export async function clearAllSearchHistory() {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const response = await fetch(`${API_URL}/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return false;
    }

    return response.ok;
  } catch (err) {
    console.error('clearAllSearchHistory error:', err);
    return false;
  }
}

/**
 * Delete a specific search from history
 * @param {string} searchId - The ID of the search to delete
 */
export async function deleteSearchFromHistory(searchId) {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const response = await fetch(`${API_URL}/${searchId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return false;
    }

    return response.ok;
  } catch (err) {
    console.error('deleteSearchFromHistory error:', err);
    return false;
  }
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Save a restaurant comparison to the database
 * @param {string} leftRestaurantId - ID of first restaurant
 * @param {string} rightRestaurantId - ID of second restaurant
 * @param {string} note - Optional note about the comparison
 */
export async function saveComparisonToDatabase(
  leftRestaurantId,
  rightRestaurantId,
  note = '',
  leftRestaurantDetails = null,
  rightRestaurantDetails = null
) {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/comparison/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        leftRestaurantId,
        rightRestaurantId,
        note,
        leftRestaurantDetails,
        rightRestaurantDetails,
      }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to save comparison:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('saveComparisonToDatabase error:', err);
    return null;
  }
}

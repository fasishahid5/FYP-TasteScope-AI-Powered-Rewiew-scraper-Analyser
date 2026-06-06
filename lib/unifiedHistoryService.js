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

const emitHistoryUpdated = () => {
  try {
    window.dispatchEvent(new CustomEvent('historyUpdated'));
  } catch {
    // ignore
  }
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
 * Fetch unified history (searches, comparisons, favorites, visits) from database
 */
export async function fetchUnifiedHistory() {
  try {
    const token = getAuthToken();
    if (!token) return { history: [], stats: {} };

    const response = await fetch(`${API_URL}/history/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return { history: [], stats: {} };
      console.error('Failed to fetch unified history:', response.statusText);
      return { history: [], stats: {} };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('fetchUnifiedHistory error:', err);
    return { history: [], stats: {} };
  }
}

/**
 * Clear all browsing history
 */
export async function clearUnifiedHistory() {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const response = await fetch(`${API_URL}/history/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return false;
      console.error('Failed to clear unified history:', response.statusText);
      return false;
    }

    const ok = response.ok;
    if (ok) emitHistoryUpdated();
    return ok;
  } catch (err) {
    console.error('clearUnifiedHistory error:', err);
    return false;
  }
}

/**
 * Delete one browsing history item
 */
export async function deleteUnifiedHistoryItem(item) {
  try {
    const token = getAuthToken();
    const historyId = item?._id;
    if (!token || !historyId) return false;

    const requestPayload = {
      type: item?.type,
      restaurantId: item?.restaurantId,
      query: item?.query,
      name: item?.details?.name || item?.name,
      location: item?.details?.location,
      leftRestaurantId: item?.leftRestaurantId,
      rightRestaurantId: item?.rightRestaurantId,
      leftRestaurantName: item?.leftRestaurantDetails?.name,
      rightRestaurantName: item?.rightRestaurantDetails?.name,
      comparisonLabel: item?.comparisonLabel,
    };

    const deleteWithUrl = async (url, options = {}) => {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(options.body ?? requestPayload),
      });

      if (!response.ok) {
        return { ok: false, response };
      }

      return { ok: true, data: await response.json() };
    };

    const unifiedUrl = `${API_URL}/history/${historyId}`;
    const unifiedResult = await deleteWithUrl(unifiedUrl);

    if (unifiedResult.ok) {
      emitHistoryUpdated();
      return unifiedResult.data;
    }

    if (handleUnauthorizedResponse(unifiedResult.response)) return false;

    if (item?.type === 'searched') {
      const legacyResult = await deleteWithUrl(`${API_URL}/${historyId}`, { body: {} });
      if (legacyResult.ok) {
        emitHistoryUpdated();
        return legacyResult.data;
      }

      if (handleUnauthorizedResponse(legacyResult.response)) return false;
    }

    console.error('Failed to delete history item:', unifiedResult.response?.statusText || 'Unknown error');
    return false;
  } catch (err) {
    console.error('deleteUnifiedHistoryItem error:', err);
    return false;
  }
}

/**
 * Toggle favorite status for a restaurant
 */
export async function toggleFavoriteRestaurant(restaurantId, restaurantDetails = null) {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/favorite/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurantId,
        restaurantDetails: serializeRestaurantDetails(restaurantDetails),
      }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to toggle favorite:', response.statusText);
      return null;
    }

    const data = await response.json();
    emitHistoryUpdated();
    return data;
  } catch (err) {
    console.error('toggleFavoriteRestaurant error:', err);
    return null;
  }
}

/**
 * Log a restaurant visit
 */
export async function logVisitToDatabase(restaurantId, restaurantDetails = null) {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/visit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurantId,
        restaurantDetails: serializeRestaurantDetails(restaurantDetails),
      }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to log visit:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('logVisitToDatabase error:', err);
    return null;
  }
}

/**
 * Add restaurant to favorites
 */
export async function addToFavorites(restaurantId) {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/favorite/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ restaurantId }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to add favorite:', response.statusText);
      return null;
    }

    const data = await response.json();
    emitHistoryUpdated();
    return data;
  } catch (err) {
    console.error('addToFavorites error:', err);
    return null;
  }
}

/**
 * Remove from favorites
 */
export async function removeFromFavorites(restaurantId) {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/favorite/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ restaurantId }),
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return null;
      console.error('Failed to remove favorite:', response.statusText);
      return null;
    }

    const data = await response.json();
    emitHistoryUpdated();
    return data;
  } catch (err) {
    console.error('removeFromFavorites error:', err);
    return null;
  }
}

/**
 * Get all favorites
 */
export async function getFavoritesList() {
  try {
    const token = getAuthToken();
    if (!token) return [];

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (handleUnauthorizedResponse(response)) return [];
      console.error('Failed to fetch favorites:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.favorites || [];
  } catch (err) {
    console.error('getFavoritesList error:', err);
    return [];
  }
}

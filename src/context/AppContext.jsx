import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL, getStoredToken, getStoredUser } from '../../lib/auth';
import { fetchUnifiedHistory } from '../../lib/unifiedHistoryService';
import { generateFallbackReviewData, reportSentimentFallback } from '../../lib/reviewHelpers';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentSelectedRestaurant, setCurrentSelectedRestaurant] = useState(null);
  const [activeSentimentData, setActiveSentimentData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalMetricsLoading, setGlobalMetricsLoading] = useState(false);
  const [globalHistoryData, setGlobalHistoryData] = useState({ history: [], stats: null });
  const [globalProfileData, setGlobalProfileData] = useState({ stats: null, favoritesCount: 0, favoriteRestaurants: [] });
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(() => {
    const storedUser = getStoredUser();
    return storedUser?.pushNotificationsEnabled !== false;
  });
  const [toasts, setToasts] = useState([]);
  const notificationsRef = React.useRef([]);

  const aiProgressIntervalRef = useRef(null);
  const aiProgressTimeoutRef = useRef(null);

  const clearAiProgress = () => {
    if (aiProgressIntervalRef.current) {
      clearInterval(aiProgressIntervalRef.current);
      aiProgressIntervalRef.current = null;
    }
    if (aiProgressTimeoutRef.current) {
      clearTimeout(aiProgressTimeoutRef.current);
      aiProgressTimeoutRef.current = null;
    }
  };

  const startAiProgress = () => {
    setAiProgress(5);
    if (aiProgressIntervalRef.current) clearInterval(aiProgressIntervalRef.current);
    aiProgressIntervalRef.current = setInterval(() => {
      setAiProgress((prev) => Math.min(95, prev + Math.floor(Math.random() * 10) + 4));
    }, 220);
  };

  const deriveProfileDataFromHistory = useCallback((historyData) => {
    const history = Array.isArray(historyData?.history) ? historyData.history : [];
    const favoriteRestaurants = history.filter((item) => item?.type === 'favorite');
    const favoriteIdsFromHistory = favoriteRestaurants.map((item) => String(item.restaurantId || item._id));

    setFavoriteIds(favoriteIdsFromHistory);
    setGlobalProfileData({
      stats: historyData?.stats || { visits: 0, comparisons: 0, searches: 0 },
      favoritesCount: favoriteIdsFromHistory.length,
      favoriteRestaurants,
    });
  }, []);

  useEffect(() => {
    deriveProfileDataFromHistory(globalHistoryData);
  }, [globalHistoryData, deriveProfileDataFromHistory]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Toast stack helper
  const addToast = (title, message, type = 'system') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const refreshGlobalHistoryData = useCallback(async () => {
    try {
      const data = await fetchUnifiedHistory();
      if (data) {
        setGlobalHistoryData(data);
      }
      return data;
    } catch (error) {
      console.error('AppContext: refreshGlobalHistoryData failed', error);
      return null;
    }
  }, []);

  // Live notifications: polling + server-sent events
  useEffect(() => {
    let es = null;
    let pollId = null;

    const notificationsEnabled = pushNotificationsEnabled !== false;

    if (!notificationsEnabled) {
      setNotifications([]);
      return undefined;
    }

    const startPolling = () => {
      pollId = setInterval(async () => {
        try {
          const token = getStoredToken();
          const res = await fetch(`${API_BASE_URL}/api/notifications`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            setNotifications((prev) => {
              // simple replace to keep ordering consistent
              return Array.isArray(data) ? data : prev;
            });
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 8000);
    };

    const startSSE = () => {
      try {
        const token = getStoredToken();
        if (!token) return;
        const url = `${API_BASE_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`;
        es = new EventSource(url);
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload && payload.type === 'notification' && payload.notification) {
              setNotifications((prev) => {
                const exists = Array.isArray(prev) && prev.find((n) => String(n._id) === String(payload.notification._id));
                if (exists) return prev;
                // add a stacked toast for real-time arrival
                addToast(payload.notification.title || 'New notification', payload.notification.message || '', payload.notification.type || 'system');
                return [payload.notification, ...prev];
              });
            }
          } catch (err) {
            // ignore parse errors
          }
        };
        es.onerror = () => {
          try { es.close(); } catch (e) {}
          es = null;
        };
      } catch (err) {
        // ignore SSE setup errors
      }
    };

    startPolling();
    startSSE();

    return () => {
      if (pollId) clearInterval(pollId);
      if (es) try { es.close(); } catch (e) {}
    };
  }, [pushNotificationsEnabled, setNotifications]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = getStoredUser();
      setPushNotificationsEnabled(storedUser?.pushNotificationsEnabled !== false);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    refreshGlobalHistoryData();
  }, []); // Only run once on mount

  const appendGlobalHistoryItem = useCallback((item) => {
    if (!item) return;
    setGlobalHistoryData((prev) => {
      const currentHistory = Array.isArray(prev.history) ? prev.history : [];
      const updatedHistory = [item, ...currentHistory];
      const updatedStats = { ...(prev.stats || {}) };

      if (item.type === 'favorite') updatedStats.favorites = (updatedStats.favorites || 0) + 1;
      if (item.type === 'visited') updatedStats.visits = (updatedStats.visits || 0) + 1;
      if (item.type === 'compared') updatedStats.comparisons = (updatedStats.comparisons || 0) + 1;
      if (item.type === 'searched' || item.type === 'search_click') updatedStats.searches = (updatedStats.searches || 0) + 1;

      return { history: updatedHistory, stats: updatedStats };
    });
  }, []);

  const toggleGlobalFavorite = useCallback((restaurantId, restaurantDetails = null, isFavorite = true) => {
    const normalizedId = String(restaurantId || '').trim();
    if (!normalizedId) return;

    setGlobalProfileData((prev) => {
      const favorites = Array.isArray(prev.favoriteRestaurants) ? [...prev.favoriteRestaurants] : [];
      const existingIndex = favorites.findIndex((item) => String(item.restaurantId || item._id) === normalizedId);
      let updatedFavorites = favorites;

      if (isFavorite) {
        if (existingIndex === -1 && restaurantDetails) {
          updatedFavorites = [{ ...restaurantDetails, restaurantId: normalizedId }, ...favorites];
        }
      } else {
        updatedFavorites = favorites.filter((item) => String(item.restaurantId || item._id) !== normalizedId);
      }

      return {
        ...prev,
        favoritesCount: updatedFavorites.length,
        favoriteRestaurants: updatedFavorites,
      };
    });

    setFavoriteIds((prevIds) => {
      const exists = prevIds.includes(normalizedId);
      if (isFavorite) {
        return exists ? prevIds : [normalizedId, ...prevIds];
      }
      return prevIds.filter((id) => id !== normalizedId);
    });
  }, []);

  // Keeps the backend scraping task active in global memory and updates global sentiment state
  const triggerLiveScrape = async (placeDetails) => {
    if (!placeDetails) return null;

    setIsAiLoading(true);
    startAiProgress();
    setActiveSentimentData({ loading: true });

    // Extract properties safely with fallback values to match backend schema
    const placeId = placeDetails?.placeId || placeDetails?.restaurantId || placeDetails?.id;
    const placeName = placeDetails?.name || '';
    const address = placeDetails?.location || placeDetails?.address || '';

    // Safely extract reviews array; default to empty array if not available
    let existingReviews = [];
    if (Array.isArray(placeDetails?.reviews)) {
      existingReviews = placeDetails.reviews
        .map((r) => (typeof r === 'string' ? r : r?.text || ''))
        .filter(Boolean);
    } else if (Array.isArray(placeDetails?.rawReviews)) {
      existingReviews = placeDetails.rawReviews
        .map((r) => (typeof r === 'string' ? r : r?.text || ''))
        .filter(Boolean);
    }

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/sentiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          placeId: placeId || '',
          placeName: placeName,
          address: address,
          reviews: existingReviews,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        throw new Error(text || response.statusText || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const normalizedData = {
        ...data,
        placeId: placeId,
        loading: false,
        isFallback: Boolean(data.isFallback) || !Array.isArray(data.naturalReviewSections) || data.naturalReviewSections.length === 0,
        source: data.source || 'google_places_aggregator',
        model: data.model || (data.isFallback ? 'google_places_aggregator' : 'roberta'),
      };

      setActiveSentimentData(normalizedData);
      setIsAiLoading(false);

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt');
        const notiRes = await fetch('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notiRes.ok) {
          const freshNotis = await notiRes.json();
          // if the newest notification is not present locally, show a stacked toast
          const newest = Array.isArray(freshNotis) && freshNotis[0];
          const localNewest = notificationsRef.current && notificationsRef.current[0];
          if (newest && (!localNewest || String(newest._id) !== String(localNewest._id))) {
            addToast(newest.title || 'New notification', newest.message || '', newest.type || 'system');
          }
          setNotifications(freshNotis);
        }
      } catch (syncErr) {
        console.error('Failed to quietly sync live notifications array:', syncErr);
      }

      return normalizedData;
    } catch (err) {
      console.error('AppContext: sentiment fetch failed:', err);
      const fallback = generateFallbackReviewData({}, placeDetails, 'google_places_aggregator');
      setActiveSentimentData(fallback);
      reportSentimentFallback({
        errorType: 'sentiment_fetch_failure',
        message: err?.message || 'Sentiment request failed',
        placeId: placeId || 'unknown',
        placeName,
        source: 'google_places_aggregator',
        model: 'google_places_aggregator',
        details: { reviewCount: existingReviews.length },
      });
      return fallback;
    } finally {
      clearAiProgress();
      setAiProgress(100);
      aiProgressTimeoutRef.current = setTimeout(() => {
        setIsAiLoading(false);
        aiProgressTimeoutRef.current = null;
      }, 260);
    }
  };

  const value = {
    currentSelectedRestaurant,
    setCurrentSelectedRestaurant,
    activeSentimentData,
    setActiveSentimentData,
    isAiLoading,
    setIsAiLoading,
    aiProgress,
    setAiProgress,
    globalLoading,
    setGlobalLoading,
    globalMetricsLoading,
    setGlobalMetricsLoading,
    notifications,
    setNotifications,
    pushNotificationsEnabled,
    setPushNotificationsEnabled,
    globalHistoryData,
    setGlobalHistoryData,
    globalProfileData,
    setGlobalProfileData,
    favoriteIds,
    setFavoriteIds,
    refreshGlobalHistoryData,
    appendGlobalHistoryItem,
    toggleGlobalFavorite,
    triggerLiveScrape,
    // Toast API
    toasts,
    setToasts,
    addToast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

export default AppContext;

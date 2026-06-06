import { useEffect, useState } from 'react';
import { API_BASE_URL, getStoredToken, getStoredUser } from './auth';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchRestaurants = async () => {
      try {
        const storedUser = getStoredUser();
        const token = getStoredToken() || storedUser?.token || null;
        const normalizedRole = String(storedUser?.role || '').toLowerCase();
        const canFetchRemoteRestaurants = Boolean(token) && (!normalizedRole || normalizedRole === 'owner');

        if (!canFetchRemoteRestaurants) {
          if (mounted) {
            setRestaurants([]);
            setIsFallback(false);
            setError(null);
          }
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/business/restaurants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !Array.isArray(data) || data.length === 0) {
          if (response.status === 401 || response.status === 403) {
            if (mounted) {
              setRestaurants([]);
              setIsFallback(false);
              setError(null);
            }
            return;
          }

          throw new Error('Restaurant API unavailable or returned no data');
        }

        if (mounted) {
          setRestaurants(data);
          setIsFallback(false);
        }
      } catch (err) {
        if (mounted) {
          setRestaurants([]);
          setIsFallback(false);
          setError(err);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchRestaurants();
    return () => {
      mounted = false;
    };
  }, []);

  return { restaurants, isLoading, isFallback, error };
}

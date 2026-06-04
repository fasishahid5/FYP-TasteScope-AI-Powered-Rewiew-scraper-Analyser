import { useEffect, useState } from 'react';
import { API_BASE_URL } from './auth';
import { restaurants as fallbackRestaurants } from '../data/restaurants';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/business/restaurants`);
        const data = await response.json().catch(() => null);

        if (!response.ok || !Array.isArray(data) || data.length === 0) {
          throw new Error('Restaurant API unavailable or returned no data');
        }

        if (mounted) {
          setRestaurants(data);
          setIsFallback(false);
        }
      } catch (err) {
        if (mounted) {
          const useFallback = import.meta.env.DEV;
      if (useFallback) {
        setRestaurants(fallbackRestaurants);
        setIsFallback(true);
      } else {
        setRestaurants([]);
        setIsFallback(false);
      }
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

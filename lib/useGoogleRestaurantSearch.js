import { useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  DEFAULT_MAP_CENTER,
  filterPakistanPlaces,
  filterRestaurantPlaces,
  getPakistanSearchCenter,
  mapGooglePlaceToRestaurant,
} from './googlePlacesUtils';
import { useSettings } from './SettingsContext';

const NEARBY_RADIUS = 5000;
const TEXT_SEARCH_RADIUS = 50000;
const SEARCH_DEBOUNCE_MS = 150;
const GOOGLE_MAP_LIBRARIES = ['places'];

export function useGoogleRestaurantSearch(searchQuery) {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rawLocation, setRawLocation] = useState(null);
  const [searchCenter, setSearchCenter] = useState(DEFAULT_MAP_CENTER);
  const [locationStatus, setLocationStatus] = useState(null);
  const [error, setError] = useState(null);
  const placesServiceRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const { locationEnabled } = useSettings();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY).');
      setIsLoading(false);
    } else if (loadError) {
      setError('Failed to load Google Maps. Check your API key and billing.');
      setIsLoading(false);
    }
  }, [apiKey, loadError]);

  useEffect(() => {
    if (!locationEnabled) {
      setError('Location access is disabled in your Profile Privacy Settings.');
      setRawLocation(null);
      setRestaurants([]);
      setSearchCenter(DEFAULT_MAP_CENTER);
      setLocationStatus('disabled_by_user');
      setIsLoading(false);
      return;
    }

    setLocationStatus(null);
    if (!navigator.geolocation) {
      setSearchCenter(DEFAULT_MAP_CENTER);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setRawLocation(coords);
        setSearchCenter(getPakistanSearchCenter(coords));
      },
      () => {
        setSearchCenter(DEFAULT_MAP_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [locationEnabled]);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.places) return;
    if (!placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(div);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !placesServiceRef.current || !searchCenter || !locationEnabled) return;

    const service = placesServiceRef.current;
    const query = searchQuery.trim();
    const location = new window.google.maps.LatLng(searchCenter.lat, searchCenter.lng);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const runSearch = () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      const finish = (results, status, isTextSearch) => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
        const ok = status === window.google.maps.places.PlacesServiceStatus.OK;
        const pkPlaces =
          ok && results?.length
            ? filterRestaurantPlaces(filterPakistanPlaces(results))
            : [];

        if (pkPlaces.length) {
          const mapped = pkPlaces.map((place, idx) =>
            mapGooglePlaceToRestaurant(place, idx, searchCenter)
          );
          if (query) {
            const q = query.toLowerCase();
            const nameMatch = mapped.filter(
              (r) =>
                r.name.toLowerCase().includes(q) ||
                r.location.toLowerCase().includes(q) ||
                r.cuisine.toLowerCase().includes(q)
            );
            const list = nameMatch.length ? nameMatch : mapped;
            list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setRestaurants(list);
          } else {
            mapped.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setRestaurants(mapped);
          }
          return;
        }

        setRestaurants([]);
        if (!ok && query) {
          setError(isTextSearch ? 'No restaurants found in Pakistan for this search.' : null);
        } else if (!ok && !query) {
          setError('Unable to load nearby restaurants in Pakistan.');
        }
      };

      if (!query) {
        service.nearbySearch(
          { location, radius: NEARBY_RADIUS, type: 'restaurant' },
          (results, status) => finish(results, status, false)
        );
        return;
      }

      const textQuery = `${query} restaurant Pakistan`;
      service.textSearch(
        { query: textQuery, location, radius: TEXT_SEARCH_RADIUS, region: 'pk' },
        (results, status) => finish(results, status, true)
      );
    };

    debounceRef.current = setTimeout(runSearch, query ? SEARCH_DEBOUNCE_MS : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isLoaded, searchCenter, searchQuery]);

  return {
    restaurants,
    isLoading: !apiKey || loadError ? false : isLoading || !isLoaded,
    userLocation: searchCenter,
    rawLocation,
    error,
    mapsReady: isLoaded && !!apiKey && !loadError,
  };
}

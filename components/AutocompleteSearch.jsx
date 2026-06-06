import React, { useState, useEffect, useRef } from 'react';
import {
  filterRestaurantPredictions,
  formatPredictionLabel,
  getPakistanSearchCenter,
} from '../lib/googlePlacesUtils';

const SearchBarIcon = ({ color = '#94a3b8' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function AutocompleteSearch({
  mapInstance,
  mapsReady = false,
  onPlaceSelected,
  onSubmit,
  searchQuery,
  setSearchQuery,
  locationBias,
  debounceMs = 120,
  placeholder = 'Search restaurants, cuisines, or dishes...',
  containerStyle,
  inputBoxStyle,
  inputStyle,
  dropdownStyle,
}) {
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const placesDivRef = useRef(null);
  const containerRef = useRef(null);

  const searchCenter = getPakistanSearchCenter(locationBias);
  const canUsePlaces = mapsReady || !!mapInstance;

  useEffect(() => {
    if (!canUsePlaces || !window.google?.maps?.places) return;

    autocompleteService.current = new window.google.maps.places.AutocompleteService();

    if (mapInstance) {
      placesService.current = new window.google.maps.places.PlacesService(mapInstance);
    } else {
      if (!placesDivRef.current) {
        placesDivRef.current = document.createElement('div');
      }
      placesService.current = new window.google.maps.places.PlacesService(placesDivRef.current);
    }
  }, [mapInstance, canUsePlaces]);

  useEffect(() => {
    if (!searchQuery.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const location = new window.google.maps.LatLng(searchCenter.lat, searchCenter.lng);
      const baseRequest = {
        input: searchQuery,
        componentRestrictions: { country: 'pk' },
        location,
        radius: 50000,
      };

      const applyPredictions = (results) => {
        setPredictions(filterRestaurantPredictions(results || []));
      };

      autocompleteService.current.getPlacePredictions(
        { ...baseRequest, types: 'restaurant' },
        (results, status) => {
          const ok = status === window.google.maps.places.PlacesServiceStatus.OK;
          const filtered = filterRestaurantPredictions(ok ? results : []);
          if (filtered.length) {
            applyPredictions(filtered);
            return;
          }
          autocompleteService.current.getPlacePredictions(baseRequest, (results2, status2) => {
            const ok2 = status2 === window.google.maps.places.PlacesServiceStatus.OK;
            applyPredictions(ok2 ? results2 : []);
          });
        }
      );
    }, debounceMs);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchCenter.lat, searchCenter.lng, debounceMs, canUsePlaces]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePredictionClick = (prediction) => {
    const { name, location } = formatPredictionLabel(prediction);
    const brandQuery = name || prediction.description.split(',')[0].trim();
    setSearchQuery(brandQuery);
    setShowDropdown(false);

    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: [
          'geometry', 'name', 'formatted_address', 'rating', 'user_ratings_total',
          'reviews', 'photos', 'opening_hours', 'price_level', 'website',
          'formatted_phone_number', 'types', 'url', 'place_id',
        ],
      },
      (place, status) => {
        const getPhotoUrl = () => {
          try {
            return place?.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 }) || '';
          } catch {
            return '';
          }
        };

        const selectedRestaurantDetails = {
          restaurantId: prediction.place_id,
          placeId: prediction.place_id,
          name: place?.name || brandQuery,
          location: place?.formatted_address || location || '',
          rating: place?.rating ?? null,
          reviews: place?.user_ratings_total ?? null,
          priceRange: place?.price_level ? '$'.repeat(Math.min(place.price_level, 4)) : '',
          image: getPhotoUrl(),
          cuisine: Array.isArray(place?.types)
            ? place.types.find((type) => !['establishment', 'point_of_interest', 'food', 'restaurant'].includes(type))?.replace(/_/g, ' ')
            : '',
          lat: place?.geometry?.location?.lat?.() ?? null,
          lng: place?.geometry?.location?.lng?.() ?? null,
        };

        if (onSubmit && brandQuery.trim().length >= 2) {
          onSubmit({
            query: brandQuery.trim(),
            selectedRestaurantDetails,
          });
        }

        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          return;
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        if (mapInstance) {
          mapInstance.panTo({ lat, lng });
          mapInstance.setZoom(14);
        }

        if (onPlaceSelected) {
          onPlaceSelected({
            lat,
            lng,
            name: selectedRestaurantDetails.name,
            address: selectedRestaurantDetails.location,
            rating: selectedRestaurantDetails.rating,
            reviews: place.reviews,
            userRatingsTotal: place.user_ratings_total,
            photos: place.photos,
            types: place.types,
            openingHours: place.opening_hours,
            priceLevel: place.price_level,
            website: place.website,
            phoneNumber: place.formatted_phone_number,
            url: place.url,
            placeId: prediction.place_id,
            image: selectedRestaurantDetails.image,
            cuisine: selectedRestaurantDetails.cuisine,
            priceRange: selectedRestaurantDetails.priceRange,
          });
        }
      }
    );
  };

  const defaultBoxStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0 14px',
    width: '100%',
  };

  const defaultInputStyle = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: '#1e293b',
    fontFamily: "'Poppins', sans-serif",
    padding: '11px 0',
    outline: 'none',
  };

  const defaultDropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    marginTop: '6px',
    minHeight: '40px',
    maxHeight: '280px',
    overflowY: 'auto',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    padding: '6px 0',
  };

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', ...containerStyle }}
    >
      <div style={{ ...defaultBoxStyle, ...inputBoxStyle }}>
        <SearchBarIcon />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setShowDropdown(false);
              if (onSubmit && searchQuery.trim().length >= 2) {
                onSubmit(searchQuery.trim());
              }
            }
          }}
          style={{ ...defaultInputStyle, ...inputStyle }}
        />
      </div>

      {showDropdown && predictions.length > 0 && (
        <div style={{ ...defaultDropdownStyle, ...dropdownStyle }}>
          {predictions.map((p) => {
            const { name, location } = formatPredictionLabel(p);
            return (
              <div
                key={p.place_id}
                onClick={() => handlePredictionClick(p)}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  color: '#334155',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{name}</div>
                {location ? (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.35 }}>
                    {location}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AutocompleteSearch;

import React, { useState, useEffect, useRef } from "react";

// Your exact original SearchBarIcon
const SearchBarIcon = ({ color = '#94a3b8' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function AutocompleteSearch({ mapInstance, onPlaceSelected, searchQuery, setSearchQuery }) {
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const containerRef = useRef(null);

  // Initialize Google Places services once the map instance loads
  useEffect(() => {
    if (mapInstance && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(mapInstance);
    }
  }, [mapInstance]);

  // Fetch live predictions as the user types
  useEffect(() => {
    if (!searchQuery.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: "pk" }, // Primary region constraint
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 200); // 200ms debounce to prevent hitting API limits instantly

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close dropdown if user clicks completely outside the search area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePredictionClick = (prediction) => {
    setSearchQuery(prediction.description);
    setShowDropdown(false);

    if (!placesService.current || !mapInstance) return;

    // Fetch detailed information about the place (including reviews, photos, ratings, etc.)
    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["geometry", "name", "formatted_address", "rating", "user_ratings_total", "reviews", "photos", "opening_hours", "price_level", "website", "formatted_phone_number", "types", "url"] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          // Smoothly pan and zoom map to selection
          mapInstance.panTo({ lat, lng });
          mapInstance.setZoom(14);

          if (onPlaceSelected) {
            onPlaceSelected({ 
              lat, 
              lng, 
              name: place.name || place.formatted_address,
              // Full place details for displaying card
              address: place.formatted_address,
              rating: place.rating,
              reviews: place.reviews,
              userRatingsTotal: place.user_ratings_total,
              photos: place.photos,
              types: place.types,
              openingHours: place.opening_hours,
              priceLevel: place.price_level,
              website: place.website,
              phoneNumber: place.formatted_phone_number,
              url: place.url,
              placeId: prediction.place_id
            });
          }
        }
      }
    );
  };

  return (
    <div ref={containerRef} style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
      
      {/* YOUR EXACT ORIGINAL INPUT VISUAL LOOK */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: '10px', padding: '0 14px', width: '100%'
      }}>
        <SearchBarIcon />
        <input
          type="text"
          placeholder="Search restaurants, cuisines, or dishes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          style={{
            width: '100%', border: 'none', background: 'transparent',
            fontSize: '13px', color: '#1e293b',
            fontFamily: "'Poppins', sans-serif",
            padding: '11px 0', outline: 'none',
          }}
        />
      </div>

      {/* Elegant, clean prediction results overlay panel */}
      {showDropdown && predictions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#ffffff", border: "1px solid #e2e8f0",
          borderRadius: "10px", marginTop: "6px", minHeight: "40px", maxHeight: "240px",
          overflowY: "auto", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          zIndex: 999, padding: "6px 0"
        }}>
          {predictions.map((p) => (
            <div
              key={p.place_id}
              onClick={() => handlePredictionClick(p)}
              style={{
                padding: "10px 16px", fontSize: "13px", color: "#334155",
                cursor: "pointer", fontFamily: "'Poppins', sans-serif",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => e.target.style.background = "#f1f5f9"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              {p.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutocompleteSearch;

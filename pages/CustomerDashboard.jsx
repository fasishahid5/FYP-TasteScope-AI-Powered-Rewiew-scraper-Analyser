import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import GoogleMapView from '../components/GoogleMapView';
import AutocompleteSearch from '../components/AutocompleteSearch';
import { useRestaurants } from '../lib/useRestaurants';
import { getStoredUser } from '../lib/auth';
import { logVisitToDatabase, toggleFavoriteRestaurant } from '../lib/unifiedHistoryService';

// Filter icon for the filter button.
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

// ─── SENTIMENT HELPERS ───────────────────────────────────────────────────────
const getSentiment = (score) => {
  if (score >= 80) return { label: 'Positive', textColor: '#15803d', bg: '#dcfce7', dot: '#22c55e' };
  if (score >= 60) return { label: 'Neutral',  textColor: '#b45309', bg: '#fef3c7', dot: '#f59e0b' };
  return               { label: 'Negative', textColor: '#dc2626', bg: '#fee2e2', dot: '#ef4444' };
};

// Weighted AI score: positive is primary, neutral partial, negative penalises
// Scale: 0–100. Grade thresholds: A≥85, B≥70, C≥55, D≥40, F<40
const calcAIScore = (pos = 0, neu = 0, neg = 0) => {
  const raw = Math.round(pos * 1.0 + neu * 0.4 - neg * 0.5);
  return Math.max(0, Math.min(100, raw));
};
const getGrade = (score) => {
  if (score >= 85) return { grade: 'A', label: 'Excellent',  color: '#15803d', bg: '#dcfce7', ring: '#22c55e' };
  if (score >= 70) return { grade: 'B', label: 'Good',       color: '#1d4ed8', bg: '#dbeafe', ring: '#3b82f6' };
  if (score >= 55) return { grade: 'C', label: 'Average',    color: '#b45309', bg: '#fef3c7', ring: '#f59e0b' };
  if (score >= 40) return { grade: 'D', label: 'Below Avg',  color: '#c2410c', bg: '#ffedd5', ring: '#f97316' };
  return                  { grade: 'F', label: 'Poor',        color: '#dc2626', bg: '#fee2e2', ring: '#ef4444' };
};

// ─── RESTAURANT CARD ─────────────────────────────────────────────────────────
const RestaurantCard = ({ r, hovered, onHover, inCompare, onToggleCompare, onCardClick }) => {
  const s = getSentiment(r.sentiment);
  return (
    <div
      onClick={() => onCardClick && onCardClick(r)}
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '286px',
        boxShadow: hovered ? '0 16px 34px rgba(37,99,235,0.18)' : '0 2px 10px rgba(15,23,42,0.08)',
        border: `1px solid ${hovered ? '#93c5fd' : '#e2e8f0'}`,
        transition: 'box-shadow 0.22s ease, border-color 0.22s ease, transform 0.22s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
      }}
    >
      <div style={{ position: 'relative', height: '168px', flexShrink: 0 }}>
        <img
          src={r.image}
          alt={r.name}
          style={{
            width: '100%',
            height: '168px',
            objectFit: 'cover',
            display: 'block',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.28s ease',
          }}
        />

        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: s.dot, color: '#ffffff',
          borderRadius: '9999px', padding: '5px 11px',
          fontSize: '11px', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: s.dot, display: 'inline-block', flexShrink: 0,
          }} />
          {r.sentiment}% {s.label}
        </div>

        <button
          title={inCompare ? 'Remove from compare' : 'Add to compare'}
          onClick={(e) => { e.stopPropagation(); onToggleCompare(r.id); }}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: inCompare ? '#2563eb' : 'rgba(255,255,255,0.93)',
            color: inCompare ? '#fff' : '#374151',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', lineHeight: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
            transition: 'background 0.15s ease',
          }}
        >
          {inCompare ? '✓' : '+'}
        </button>
      </div>

      <div style={{ padding: '10px 14px 11px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
          <h3 style={{
            fontSize: '15px', fontWeight: '700', color: '#0f172a',
            margin: 0, lineHeight: 1.25, flex: 1,
          }}>
            {r.name}
          </h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            background: '#f1f5f9', borderRadius: '9999px', padding: '4px 10px',
          }}>
            <span style={{ color: '#f97316', fontSize: '12px', lineHeight: 1 }}>★</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{r.rating}</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 5px', lineHeight: 1.3 }}>
          {r.cuisine} - {r.priceRange}
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '2px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontSize: '11px', color: '#64748b',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'block'
              }}>
                {r.location.length > 24 ? r.location.slice(0, 22) + '…' : r.location}
              </span>
              {typeof r.distance === 'number' && (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{r.distance.toFixed(1)} km away</span>
              )}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            ({r.reviews.toLocaleString()} reviews)
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD PAGE ─────────────────────────────────────────────────────
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const customerName = user?.firstName || user?.name || 'Customer';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [hoveredPin, setHoveredPin] = useState(null);
  const [compareList, setCompareList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ts_compareList') || '[]'); } catch { return []; }
  });
  const [mapInstance, setMapInstance] = useState(null);
  
  // Geolocation and nearby filtering
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Real nearby restaurants fetched from Google Places
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const { restaurants: restaurantsData, isLoading: restaurantsLoading, error: restaurantsError, isFallback: restaurantsIsFallback } = useRestaurants();

  // Searched place marker and details
  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);

  // Real sentiment from backend VADER analysis
  const [sentimentData, setSentimentData] = useState(null); // { positive, neutral, negative, sentiment, insight, reviewCount, loading }

  // Ref for scrolling the list panel to top when a card is opened
  const listPanelRef = useRef(null);

  // Fallback images for restaurants that have no Google photo
  const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
  ];

  // Deterministic mock sentiment from place_id (so it doesn't jump on re-renders)
  const mockSentiment = (placeId) => {
    let h = 0;
    for (let i = 0; i < placeId.length; i++) h = (Math.imul(31, h) + placeId.charCodeAt(i)) | 0;
    return 58 + Math.abs(h % 38); // 58–95
  };

  // Builds a mock sentiment object deterministically (fallback when backend is unavailable)
  const buildMockSentimentData = (placeId) => {
    const pos = mockSentiment(String(placeId));
    const neg = Math.max(5, Math.round((100 - pos) * 0.35));
    const neu = 100 - pos - neg;
    let insight = '';
    if (pos >= 80) insight = 'Customers consistently rate this place highly. The food and service receive strong praise.';
    else if (pos >= 65) insight = 'Most customers enjoy this restaurant. A few concerns about service speed are noted.';
    else if (pos >= 50) insight = 'Opinions are mixed. Many enjoy the food but some customers mention service issues.';
    else insight = 'Balanced reception — the restaurant has both fans and critics worth considering.';
    return { positive: pos, neutral: neu, negative: neg, sentiment: pos, insight, reviewCount: 0, loading: false, source: 'mock' };
  };

  // Fetch real Google reviews for the selected place and run VADER analysis on backend
  // Backend uses Puppeteer to scrape Google Maps (up to 25 reviews), falls back to Places API reviews, then mock
  useEffect(() => {
    if (!selectedPlaceDetails) { setSentimentData(null); return; }

    setSentimentData({ loading: true });

    const placeId = selectedPlaceDetails.placeId;
    const placeName = selectedPlaceDetails.name || '';
    const address = selectedPlaceDetails.address || selectedPlaceDetails.location || '';

    // Collect any reviews already attached (Places API gives up to 5 as fallback for backend)
    const existingReviews = Array.isArray(selectedPlaceDetails.reviews)
      ? selectedPlaceDetails.reviews.map(r => (typeof r === 'string' ? r : r?.text || '')).filter(Boolean)
      : [];

    fetch('http://localhost:5000/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, placeName, address, reviews: existingReviews }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSentimentData({ ...data, loading: false }))
      .catch(() => setSentimentData(buildMockSentimentData(placeId || placeName)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceDetails]);

  // Compute distance (km) between two lat/lng points using Haversine formula
  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // When mapInstance + userLocation are both ready, fetch real nearby restaurants
  useEffect(() => {
    if (!mapInstance || !userLocation || !window.google?.maps?.places) return;
    setNearbyLoading(true);
    const service = new window.google.maps.places.PlacesService(mapInstance);
    service.nearbySearch(
      {
        location: { lat: userLocation.lat, lng: userLocation.lng },
        radius: 5000,
        type: 'restaurant',
      },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length) {
          const mapped = results.map((place, idx) => {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const sentiment = mockSentiment(place.place_id);
            let photo = null;
            try { photo = place.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 }); } catch (_) {}
            return {
              id: place.place_id,
              name: place.name,
              location: place.vicinity || '',
              rating: place.rating || 4.0,
              sentiment,
              reviews: place.user_ratings_total || (300 + idx * 47),
              cuisine: (place.types?.find(t => !['establishment','point_of_interest','food'].includes(t)) || 'restaurant').replace(/_/g, ' '),
              priceRange: place.price_level ? '$'.repeat(place.price_level) : '$$',
              waitTime: 10 + (idx % 5) * 5,
              waitTimeLabel: `${10 + (idx % 5) * 5}–${15 + (idx % 5) * 5} min`,
              image: photo || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
              lat,
              lng,
              distance: distanceKm(userLocation.lat, userLocation.lng, lat, lng),
            };
          });
          // Sort nearest first by default
          mapped.sort((a, b) => a.distance - b.distance);
          setNearbyRestaurants(mapped);
        } else {
          // Places API failed or no results — keep showing mock data
          setNearbyRestaurants([]);
        }
        setNearbyLoading(false);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance, userLocation]);

  // Source: use real nearby results when available, fall back to API-loaded data
  const activeRestaurants = nearbyRestaurants.length > 0
    ? nearbyRestaurants
    : (userLocation || selectedSearchPlace ? restaurantsData : []);

  const restaurantsUnavailable = !restaurantsLoading && restaurantsError;
  const restaurantsStatusMessage = restaurantsUnavailable
    ? `Unable to load restaurant data from the shared API. ${restaurantsError?.message || 'Please ensure the backend is running and you are authenticated.'}${restaurantsIsFallback ? ' Fallback data is available in development mode.' : ''}`
    : restaurantsLoading
      ? 'Loading restaurants, please wait…'
      : null;

  // Persist compareList to localStorage so CompareDashboard can read it
  useEffect(() => {
    try { localStorage.setItem('ts_compareList', JSON.stringify(compareList)); } catch {}
  }, [compareList]);

  // Persist restaurant pool to localStorage so CompareDashboard can look up full objects
  useEffect(() => {
    if (activeRestaurants.length > 0) {
      try { localStorage.setItem('ts_restaurantPool', JSON.stringify(activeRestaurants)); } catch {}
    }
  }, [activeRestaurants]);

  const filteredRestaurants = useMemo(() => {
    let list = [...activeRestaurants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }

    // Ensure distance is always attached when userLocation is known
    if (userLocation) {
      list = list.map((r) => ({
        ...r,
        distance: r.distance ?? distanceKm(userLocation.lat, userLocation.lng, r.lat, r.lng),
      }));
    }

    if (sortBy === 'rating')    list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'sentiment') list.sort((a, b) => b.sentiment - a.sentiment);
    if (sortBy === 'reviews')   list.sort((a, b) => b.reviews - a.reviews);
    if (sortBy === 'distance' && userLocation) list.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return list;
  }, [searchQuery, sortBy, userLocation, activeRestaurants]);

  const toggleCompare = (id) => {
    setCompareList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Clicking a nearby restaurant card opens the same AI review card used by manual search
  const handleCardClick = (r) => {
    setSelectedPlaceDetails({
      name: r.name,
      image: r.image,
      photos: null,
      rating: r.rating,
      userRatingsTotal: r.reviews,
      types: [r.cuisine.replace(/ /g, '_')],
      priceLevel: r.priceRange,
      address: r.location,
      lat: r.lat,
      lng: r.lng,
      phoneNumber: null,
      website: null,
      placeId: String(r.id),
    });
    setSelectedSearchPlace({ lat: r.lat, lng: r.lng, name: r.name });
    logVisitToDatabase(String(r.id), {
      restaurantId: String(r.id),
      name: r.name,
      image: r.image,
      cuisine: r.cuisine,
      priceRange: r.priceRange,
      rating: r.rating,
      location: r.location,
      sentiment: r.sentiment,
      reviews: r.reviews,
      lat: r.lat,
      lng: r.lng,
      placeId: String(r.id),
    });
    if (listPanelRef.current) listPanelRef.current.scrollTop = 0;
  };

  const handleSidebarNavClick = (id) => {
    setActiveNav(id);
    if (id === 'home') navigate('/dashboard');
    if (id === 'search') navigate('/search');
    if (id === 'compare') navigate('/compare');
    if (id === 'history') navigate('/history');
    if (id === 'profile') navigate('/profile');
    if (id === 'settings') navigate('/settings');
  };

  // Auto-fetch user location on dashboard mount
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('distance'); // auto-sort nearest restaurants
        setLocationLoading(false);
      },
      (err) => {
        console.log('Geolocation error:', err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#f8fafc',
      fontFamily: "'Poppins', sans-serif",
    }}>

      {/* ══════════════ LEFT SIDEBAR ══════════════ */}
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Page header with title + search bar */}
        <header style={{
          padding: '20px 26px 16px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen((previousValue) => !previousValue)}
                aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  border: '1px solid #dbe3ee',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  flexShrink: 0,
                }}
              >
                <SidebarToggleIcon open={isSidebarOpen} />
              </button>

              <div>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '0 0 16px', lineHeight: 1.05 }}>
                  Welcome, <span style={{ color: '#0f172a' }}>{customerName}</span>
                </p>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px', lineHeight: 1.2 }}>
                  Discover Restaurants
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  AI-powered sentiment analysis to find your perfect dining experience
                </p>
              </div>
            </div>

            <div style={{
              padding: '9px 12px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}>
              {isSidebarOpen ? 'Sidebar Visible' : 'Sidebar Hidden'}
            </div>
          </div>

          {/* Search + Filter row */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
            
            {/* Autocomplete search with Google Places */}
            <AutocompleteSearch
              mapInstance={mapInstance}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              locationBias={userLocation}
              onPlaceSelected={(placeData) => {
                console.log("Selected Location Details:", placeData);
                const shortName = placeData.name.split(',')[0];
                setSearchQuery(shortName);
                // Set marker pin for the searched place
                setSelectedSearchPlace({
                  lat: placeData.lat,
                  lng: placeData.lng,
                  name: placeData.name
                });
                // Store full place details for card display
                setSelectedPlaceDetails(placeData);
                logVisitToDatabase(placeData.placeId || placeData.id || placeData.name, placeData);
              }} 
            />

            <button style={{
              background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '10px',
              padding: '11px 20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              fontFamily: "'Poppins', sans-serif", flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search
            </button>

            {/* Use my location button */}
            <button
              title={userLocation ? `📍 Your location: ${userLocation.lat.toFixed(3)}°, ${userLocation.lng.toFixed(3)}°` : "Show nearby restaurants"}
              onClick={() => {
                setLocationLoading(true);
                if (!navigator.geolocation) {
                  alert('Geolocation not supported by this browser');
                  setLocationLoading(false);
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSortBy('distance'); // auto-sort nearest when re-located
                    setLocationLoading(false);
                  },
                  (err) => {
                    alert('Unable to determine location: ' + (err.message || err.code));
                    setLocationLoading(false);
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              style={{
                background: userLocation ? '#dbeafe' : (locationLoading ? '#e6f0ff' : '#f8fafc'),
                border: userLocation ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={userLocation ? '#0284c7' : '#2563eb'} stroke="none">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a7 7 0 0 0 0-6" fill="none" stroke={userLocation ? '#0284c7' : '#2563eb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.6 9a7 7 0 0 0 0 6" fill="none" stroke={userLocation ? '#0284c7' : '#2563eb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{
                marginLeft: '8px',
                color: userLocation ? '#0284c7' : '#2563eb',
                fontWeight: 700, fontSize: '13px',
              }}>
                {locationLoading ? 'Locating...' : (userLocation ? '✓ Located' : 'My Location')}
              </span>
            </button>

            <button style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', padding: '10px 12px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}>
              <FilterIcon />
            </button>
          </div>


        </header>

        {/* Body: Google Map on left, restaurant list on right */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, justifyContent: 'space-between' }}>

          {/* ── GOOGLE MAP SECTION ────────────────────────── */}
          <div style={{
            flex: '0 0 52%',
            borderRight: '1px solid #e2e8f0',
            background: '#eef2f7',
            position: 'relative',
            overflow: 'hidden',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%', 
              borderRadius: '24px',
              overflow: 'hidden',
              background: '#e5edf5',
              boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
            }}>
              {/* Live Google Map component */}
              <GoogleMapView
                restaurants={filteredRestaurants}
                hoveredPin={hoveredPin}
                onMapLoad={setMapInstance}
                selectedSearchPlace={selectedSearchPlace}
                userLocation={userLocation}
              />

              {/* AI Sentiment legend overlay */}
              <div style={{
                position: 'absolute', bottom: '24px', left: '24px',
                background: 'rgba(255,255,255,0.97)',
                borderRadius: '14px', padding: '10px 14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                fontFamily: "'Poppins', sans-serif",
                zIndex: 10 
              }}>
                <p style={{ fontWeight: '600', color: '#374151', margin: '0 0 7px', fontSize: '11px' }}>
                  AI Sentiment
                </p>
                {[
                  { dot: '#22c55e', label: 'Positive' },
                  { dot: '#f59e0b', label: 'Neutral' },
                  { dot: '#ef4444', label: 'Negative' },
                ].map(({ dot, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#374151' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RESTAURANT LIST SECTION ────────────── */}
          <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px',
              background: '#ffffff', borderBottom: '1px solid #f1f5f9',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                {nearbyLoading ? (
                  <span style={{ color: '#94a3b8' }}>Finding nearby restaurants…</span>
                ) : (
                  <><span style={{ color: '#2563eb', fontWeight: '700' }}>
                    {(selectedPlaceDetails ? 1 : 0) + filteredRestaurants.length}
                  </span> {nearbyRestaurants.length > 0 ? 'nearby restaurants' : 'restaurants found'}</>
                )}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  padding: '6px 10px', fontSize: '12px', color: '#374151',
                  fontFamily: "'Poppins', sans-serif", background: '#fff',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="rating">Sort by: Rating</option>
                <option value="sentiment">Sort by: Sentiment</option>
                <option value="reviews">Sort by: Reviews</option>
                <option value="distance">Sort by: Distance</option>
              </select>
            </div>

            <div
              ref={listPanelRef}
              style={{
              flex: 1, overflowY: 'auto',
              padding: '14px', display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: '12px',
              alignContent: 'start',
            }}>
              {/* Display searched place with FINAL CARD DESIGN */}
              {selectedPlaceDetails && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: '#fff',
                    borderRadius: '12px',
                    overflow: 'visible',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.16)',
                    border: '2px solid #93c5fd',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    marginBottom: '12px',
                  }}
                >
                  {/* Image Banner */}
                  <div style={{
                    position: 'relative',
                    height: '180px',
                    borderRadius: '10px 10px 0 0',
                    background: selectedPlaceDetails.photos && selectedPlaceDetails.photos.length > 0
                      ? `url('${selectedPlaceDetails.photos[0].getUrl()}')`
                      : selectedPlaceDetails.image
                      ? `url('${selectedPlaceDetails.image}')`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    overflow: 'hidden',
                  }}>
                    {/* AI Score Badge */}
                    {(() => {
                      const aiScore = sentimentData && !sentimentData.loading
                        ? calcAIScore(sentimentData.positive, sentimentData.neutral, sentimentData.negative)
                        : null;
                      const g = aiScore !== null ? getGrade(aiScore) : null;
                      return (
                        <div style={{
                          position: 'absolute', top: '12px', left: '12px',
                          background: 'rgba(255,255,255,0.97)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: '12px', padding: '6px 10px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          border: g ? `1.5px solid ${g.ring}` : '1.5px solid #e2e8f0',
                        }}>
                          {/* Grade circle */}
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: g ? g.bg : '#f1f5f9',
                            border: `2px solid ${g ? g.ring : '#cbd5e1'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '15px',
                            color: g ? g.color : '#64748b', flexShrink: 0,
                          }}>
                            {sentimentData?.loading ? '…' : (g ? g.grade : '?')}
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: g ? g.color : '#64748b', lineHeight: 1 }}>
                              {sentimentData?.loading ? 'Analysing…' : (g ? g.label : 'AI Score')}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>
                              {aiScore !== null ? `${aiScore}/100` : '—'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick Buttons */}
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      display: 'flex', gap: '8px',
                    }}>
                      {selectedPlaceDetails.phoneNumber && (
                        <a href={`tel:${selectedPlaceDetails.phoneNumber}`}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.95)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            textDecoration: 'none',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          title="Call"
                        >
                          📞
                        </a>
                      )}
                      {selectedPlaceDetails.website && (
                        <a href={selectedPlaceDetails.website} target="_blank" rel="noopener noreferrer"
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.95)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            textDecoration: 'none',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          title="Website"
                        >
                          🌐
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '14px', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>

                    {/* ─ Basic Identity Section ─ */}
                    <div style={{ marginBottom: '10px' }}>
                      <h2 style={{
                        fontSize: '16px', fontWeight: '800', color: '#0f172a',
                        margin: '0 0 4px', lineHeight: 1.2,
                      }}>
                        {selectedPlaceDetails.name}
                      </h2>
                      <p style={{
                        fontSize: '12px', color: '#64748b', margin: '0 0 6px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        🏷️ {selectedPlaceDetails.types && selectedPlaceDetails.types.length > 0
                          ? selectedPlaceDetails.types[0].replace(/_/g, ' ')
                          : 'Restaurant'} • {
                            typeof selectedPlaceDetails.priceLevel === 'number'
                              ? '$'.repeat(selectedPlaceDetails.priceLevel)
                              : selectedPlaceDetails.priceLevel
                                ? selectedPlaceDetails.priceLevel
                                : 'N/A'
                          }
                      </p>
                      <p style={{
                        fontSize: '11px', color: '#94a3b8', margin: 0,
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        📍 {selectedPlaceDetails.address && selectedPlaceDetails.address.length > 45
                          ? selectedPlaceDetails.address.slice(0, 43) + '…'
                          : selectedPlaceDetails.address}
                      </p>
                    </div>

                    {/* ─ Rating & Distance Row ─ */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
                      marginBottom: '10px', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>⭐</span>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                            {selectedPlaceDetails.rating ? selectedPlaceDetails.rating.toFixed(1) : 'N/A'} / 5
                          </p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                            {selectedPlaceDetails.userRatingsTotal || 0} reviews
                          </p>
                        </div>
                      </div>

                      {userLocation && selectedPlaceDetails.lat && selectedPlaceDetails.lng && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{
                            fontSize: '13px', fontWeight: '700', color: '#2563eb', margin: 0
                          }}>
                            {distanceKm(userLocation.lat, userLocation.lng, selectedPlaceDetails.lat, selectedPlaceDetails.lng).toFixed(1)} km
                          </p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                            from you
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ─ Sentiment Analysis (CORE FYP FEATURE) ─ */}
                    <div style={{
                      padding: '10px 12px', background: '#f0f9ff', borderRadius: '10px',
                      marginBottom: '10px', border: '1px solid #bfdbfe',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        🤖 AI Sentiment Analysis
                      </p>
                      {sentimentData && sentimentData.loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '12px', fontWeight: '600' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                          Scraping Google Maps reviews…
                        </div>
                      )}
                      {sentimentData && !sentimentData.loading && (() => {
                        const aiScore = calcAIScore(sentimentData.positive, sentimentData.neutral, sentimentData.negative);
                        const g = getGrade(aiScore);
                        return (
                          <>
                            {/* Score row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '9px' }}>
                              {/* Circular score */}
                              <div style={{
                                width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                                background: `conic-gradient(${g.ring} ${aiScore * 3.6}deg, #e2e8f0 0deg)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                              }}>
                                <div style={{
                                  width: '34px', height: '34px', borderRadius: '50%',
                                  background: '#f0f9ff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: '800', fontSize: '13px', color: g.color,
                                }}>
                                  {g.grade}
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: g.color }}>{g.label}</span>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>{aiScore}<span style={{ fontSize: '10px', color: '#94a3b8' }}>/100</span></span>
                                </div>
                                {/* Stacked bar */}
                                <div style={{ display: 'flex', height: '7px', borderRadius: '4px', overflow: 'hidden', background: '#e2e8f0' }}>
                                  <div style={{ width: `${sentimentData.positive}%`, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', transition: 'width 0.6s ease' }} />
                                  <div style={{ width: `${sentimentData.neutral}%`, background: '#f59e0b', transition: 'width 0.6s ease' }} />
                                  <div style={{ width: `${sentimentData.negative}%`, background: '#ef4444', transition: 'width 0.6s ease' }} />
                                </div>
                              </div>
                            </div>
                            {/* Breakdown pills */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginBottom: '7px' }}>
                              {[['😊','Positive', sentimentData.positive,'#dbeafe','#1d4ed8'],
                                ['😐','Neutral',  sentimentData.neutral, '#fef3c7','#b45309'],
                                ['😡','Negative', sentimentData.negative,'#fee2e2','#dc2626']].map(([emoji, lbl, val, bg, col]) => (
                                <div key={lbl} style={{ background: bg, borderRadius: '7px', padding: '5px 4px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '13px' }}>{emoji}</div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: col }}>{val}%</div>
                                  <div style={{ fontSize: '9px', color: col, fontWeight: '600', letterSpacing: '0.3px' }}>{lbl}</div>
                                </div>
                              ))}
                            </div>
                            {/* Source / count */}
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {sentimentData.reviewCount > 0
                                ? `📊 ${sentimentData.reviewCount} review${sentimentData.reviewCount !== 1 ? 's' : ''} analysed`
                                : '🔮 Estimated'}
                              {' · '}
                              {sentimentData.source?.includes('google_scrape') ? '🌐 Google Maps'
                                : sentimentData.source?.includes('places_api') ? '📌 Places API'
                                : '🔮 Fallback'}
                              {' · '}
                              {sentimentData.model === 'vader' ? 'VADER NLP' : 'RoBERTa AI'}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* ─ AI Natural Review ─ */}
                    {sentimentData && !sentimentData.loading && (
                      <div style={{
                        padding: '12px 14px', background: 'linear-gradient(135deg, #f8f6ff 0%, #fdf4ff 100%)',
                        borderRadius: '10px', border: '1px solid #e9d5ff', marginBottom: '10px',
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px' }}>🤖</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed' }}>AI Review Summary</span>
                          {sentimentData.model && sentimentData.model !== 'vader' && (
                            <span style={{ fontSize: '9px', background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600', marginLeft: 'auto' }}>
                              RoBERTa + Extractive AI
                            </span>
                          )}
                        </div>

                        {sentimentData.naturalReviewSections ? (() => {
                          const sections = sentimentData.naturalReviewSections;
                          const overview = sections.find(s => s.type === 'overview');
                          const verdict  = sections.find(s => s.type === 'verdict');
                          const topics   = sections.filter(s => ['food','service','ambiance','concern','value'].includes(s.type));

                          const topicStyle = {
                            food:     { bg: '#f0fdf4', border: '#86efac', label: '#15803d', dot: '#22c55e' },
                            service:  { bg: '#eff6ff', border: '#93c5fd', label: '#1d4ed8', dot: '#3b82f6' },
                            ambiance: { bg: '#fefce8', border: '#fde047', label: '#a16207', dot: '#eab308' },
                            concern:  { bg: '#fff7ed', border: '#fdba74', label: '#c2410c', dot: '#f97316' },
                            value:    { bg: '#fdf4ff', border: '#d8b4fe', label: '#7e22ce', dot: '#a855f7' },
                          };

                          return (
                            <div>
                              {/* Overview */}
                              {overview && (
                                <p style={{ fontSize: '11.5px', color: '#4c1d95', margin: '0 0 10px 0', lineHeight: 1.6, fontStyle: 'italic', paddingBottom: '8px', borderBottom: '1px dashed #ddd6fe' }}>
                                  {overview.text}
                                </p>
                              )}

                              {/* Topic sections */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
                                {topics.map((sec, i) => {
                                  const st = topicStyle[sec.type] || topicStyle.food;
                                  return (
                                    <div key={i} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: '7px', padding: '7px 9px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '12px' }}>{sec.icon}</span>
                                        <span style={{ fontSize: '10px', fontWeight: '700', color: st.label, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                          {sec.label}
                                        </span>
                                        <span style={{ fontSize: '9px', color: '#9ca3af', marginLeft: 'auto' }}>
                                          {sec.framing}
                                        </span>
                                      </div>
                                      <div style={{ paddingLeft: '8px', borderLeft: `2px solid ${st.dot}` }}>
                                        <p style={{ fontSize: '11px', color: '#1f2937', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                                          "{sec.quote}"
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Verdict */}
                              {verdict && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', paddingTop: '8px', borderTop: '1px dashed #ddd6fe' }}>
                                  <span style={{ fontSize: '12px', marginTop: '1px' }}>
                                    {(sentimentData.positive || 0) >= 70 ? '✅' : (sentimentData.positive || 0) >= 50 ? '🔶' : '❌'}
                                  </span>
                                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#4c1d95', margin: 0, lineHeight: 1.5 }}>
                                    {verdict.text}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          /* Fallback: plain text or insight */
                          <p style={{ fontSize: '12px', color: sentimentData.naturalReview ? '#3b0764' : '#6b21a8', margin: 0, lineHeight: 1.6, fontStyle: sentimentData.naturalReview ? 'normal' : 'italic' }}>
                            {sentimentData.naturalReview ? sentimentData.naturalReview : `💡 ${sentimentData.insight}`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ─ Action Buttons ─ */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
                    }}>
                      <button
                        onClick={() => alert('View Details - Coming Soon')}
                        style={{
                          padding: '8px 10px', fontSize: '11px', fontWeight: '700',
                          borderRadius: '8px', border: 'none',
                          background: '#2563eb', color: '#fff',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                        onMouseLeave={(e) => e.target.style.background = '#2563eb'}
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => {
                          if (selectedPlaceDetails.placeId) {
                            const newList = compareList.includes(selectedPlaceDetails.placeId)
                              ? compareList.filter(x => x !== selectedPlaceDetails.placeId)
                              : [...compareList, selectedPlaceDetails.placeId];
                            setCompareList(newList);
                          }
                        }}
                        style={{
                          padding: '8px 10px', fontSize: '11px', fontWeight: '700',
                          borderRadius: '8px', border: '1.5px solid #2563eb',
                          background: compareList.includes(selectedPlaceDetails.placeId) ? '#2563eb' : '#fff',
                          color: compareList.includes(selectedPlaceDetails.placeId) ? '#fff' : '#2563eb',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = compareList.includes(selectedPlaceDetails.placeId) ? '#1d4ed8' : '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = compareList.includes(selectedPlaceDetails.placeId) ? '#2563eb' : '#fff';
                        }}
                      >
                        🔀 Compare
                      </button>

                      <button
                        style={{
                          padding: '8px 10px', fontSize: '11px', fontWeight: '700',
                          borderRadius: '8px', border: '1.5px solid #ec4899',
                          background: '#fff', color: '#ec4899',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                        onClick={() => {
                          if (selectedPlaceDetails?.placeId || selectedPlaceDetails?.id) {
                            toggleFavoriteRestaurant(
                              String(selectedPlaceDetails.placeId || selectedPlaceDetails.id),
                              selectedPlaceDetails
                            );
                          }
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#fce7f3'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                      >
                        ❤️ Favorite
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {filteredRestaurants.length === 0 && !selectedPlaceDetails ? (
                <div style={{
                  gridColumn: '1 / -1', textAlign: 'center',
                  color: '#94a3b8', padding: '48px 0', fontSize: '14px',
                }}>
                  {restaurantsStatusMessage || (locationLoading ? 'Locating restaurants near you...' : userLocation || searchQuery ? 'No restaurants match your search.' : 'Use the search box or allow location access to see nearby restaurants.')}
                </div>
              ) : (
                filteredRestaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    r={r}
                    hovered={hoveredPin === r.id}
                    onHover={setHoveredPin}
                    inCompare={compareList.includes(r.id)}
                    onToggleCompare={toggleCompare}
                    onCardClick={handleCardClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;

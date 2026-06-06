import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import AutocompleteSearch from '../components/AutocompleteSearch';
import RecentSearches from '../components/RecentSearches';
import { useGoogleRestaurantSearch } from '../lib/useGoogleRestaurantSearch';
import { logSearchClickToDatabase, logSearchToDatabase } from '../lib/searchHistoryService';
import {
  clearRecentSearchQueries,
  formatRelativeSearchTime,
  getRecentSearchQueries,
  getTrendingSearchTags,
  logSearchQuery,
} from '../lib/searchInsights';
import { getStoredUser } from '../lib/auth';

const SearchBarIcon = ({ color = '#94a3b8' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const getSentiment = (score) => {
  if (score >= 80) return { label: 'Positive', dot: '#22c55e', textColor: '#166534' };
  if (score >= 60) return { label: 'Neutral', dot: '#f59e0b', textColor: '#92400e' };
  return { label: 'Negative', dot: '#ef4444', textColor: '#991b1b' };
};

const normalizeDetailsKey = (value) => String(value || '').toLowerCase().trim();

const toHistoryRestaurantDetails = (restaurant = null) => {
  if (!restaurant || typeof restaurant !== 'object') return null;

  return {
    restaurantId: restaurant.restaurantId || restaurant.placeId || restaurant.id || null,
    placeId: restaurant.placeId || restaurant.id || null,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    rating: restaurant.rating,
    location: restaurant.location || restaurant.address,
    sentiment: restaurant.sentiment,
    reviews: restaurant.reviews,
    image: restaurant.image,
    lat: restaurant.lat,
    lng: restaurant.lng,
  };
};

const findSelectedRestaurantResult = (restaurants = [], selectedDetails = null) => {
  if (!selectedDetails) return null;

  const selectedId = normalizeDetailsKey(
    selectedDetails.restaurantId || selectedDetails.placeId || selectedDetails.id
  );
  const selectedName = normalizeDetailsKey(selectedDetails.name);
  const selectedLocation = normalizeDetailsKey(selectedDetails.location || selectedDetails.address);

  return (Array.isArray(restaurants) ? restaurants : []).find((restaurant) => {
    const restaurantId = normalizeDetailsKey(
      restaurant?.restaurantId || restaurant?.placeId || restaurant?.id
    );
    const restaurantName = normalizeDetailsKey(restaurant?.name);
    const restaurantLocation = normalizeDetailsKey(restaurant?.location || restaurant?.address);

    if (selectedId && restaurantId === selectedId) return true;
    if (
      selectedName
      && restaurantName === selectedName
      && (!selectedLocation || restaurantLocation.includes(selectedLocation) || selectedLocation.includes(restaurantLocation))
    ) {
      return true;
    }

    return false;
  }) || null;
};

const RestaurantCard = ({ r, inCompare, onToggleCompare, onRestaurantClick }) => {
  const sentiment = getSentiment(r.sentiment);
  return (
    <div onClick={() => onRestaurantClick(r)} style={{
      background: '#fff', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '314px', cursor: 'pointer',
    }}>
      <div style={{ position: 'relative', minHeight: '190px' }}>
        <img src={r.image} alt={r.name} style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: '14px', left: '14px', padding: '8px 12px', borderRadius: '9999px', background: '#0f172a', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {r.status || 'Open'}
        </div>
        <button type="button" onClick={(event) => { event.stopPropagation(); onToggleCompare(r.id); }} style={{ position: 'absolute', top: '14px', right: '14px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: inCompare ? '#2563eb' : 'rgba(255,255,255,0.96)', color: inCompare ? '#fff' : '#334155', fontSize: '18px', cursor: 'pointer', boxShadow: '0 10px 24px rgba(15,23,42,0.14)' }}>
          {inCompare ? '✓' : '+'}
        </button>
      </div>
      <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{r.name}</h3>
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#64748b' }}>{r.cuisine} · {r.priceRange}</p>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '9999px', padding: '7px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#f97316' }}>★</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.rating}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
            <span>{r.location}</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{typeof r.distance === 'number' ? `${r.distance.toFixed(1)} km` : ''}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sentiment.dot, display: 'inline-block' }} />
            <span style={{ color: sentiment.textColor, fontSize: '12px', fontWeight: 700 }}>{sentiment.label} {r.sentiment}%</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{r.reviews.toLocaleString()} reviews</span>
        </div>
      </div>
    </div>
  );
};

const SearchDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const customerName = user?.firstName || user?.name || 'Customer';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [compareList, setCompareList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ts_compareList') || '[]'); } catch { return []; }
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [pendingSearch, setPendingSearch] = useState(null);
  const pendingSearchKeyRef = useRef('');

  const { restaurants: restaurantsData, isLoading, error, mapsReady, userLocation } =
    useGoogleRestaurantSearch(searchQuery);

  const refreshSearchInsights = useCallback(() => {
    setRecentSearches(getRecentSearchQueries(6));
    setTrendingTags(getTrendingSearchTags(6));
  }, []);

  useEffect(() => {
    refreshSearchInsights();
    window.addEventListener('historyUpdated', refreshSearchInsights);
    return () => window.removeEventListener('historyUpdated', refreshSearchInsights);
  }, [refreshSearchInsights]);

  const filteredRestaurants = useMemo(() => {
    let list = [...restaurantsData];

    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'sentiment') list.sort((a, b) => b.sentiment - a.sentiment);
    if (sortBy === 'reviews') list.sort((a, b) => b.reviews - a.reviews);
    if (sortBy === 'relevance' && list[0]?.distance != null) {
      list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return list;
  }, [restaurantsData, sortBy]);

  useEffect(() => {
    try { localStorage.setItem('ts_compareList', JSON.stringify(compareList)); } catch {}
  }, [compareList]);

  useEffect(() => {
    if (filteredRestaurants.length > 0) {
      try { localStorage.setItem('ts_restaurantPool', JSON.stringify(filteredRestaurants)); } catch {}
    }
  }, [filteredRestaurants]);

  useEffect(() => {
    const q = String(pendingSearch?.query || '').trim();
    if (q.length < 2 || isLoading) return;

    const selectedRestaurantDetails = pendingSearch?.selectedRestaurantDetails
      ? toHistoryRestaurantDetails(pendingSearch.selectedRestaurantDetails)
      : null;
    const resultsShown = filteredRestaurants
      .map(toHistoryRestaurantDetails)
      .filter(Boolean);
    const matchedSelectedRestaurant = selectedRestaurantDetails
      ? findSelectedRestaurantResult(filteredRestaurants, selectedRestaurantDetails)
      : null;
    const fallbackRestaurantDetails = resultsShown[0] || null;
    const historyRestaurantDetails =
      toHistoryRestaurantDetails(matchedSelectedRestaurant)
      || selectedRestaurantDetails
      || fallbackRestaurantDetails;

    const key = `${q.toLowerCase()}|${historyRestaurantDetails?.restaurantId || historyRestaurantDetails?.placeId || 'query-only'}|${pendingSearch?.submittedAt || 0}`;

    if (pendingSearchKeyRef.current === key) return;
    pendingSearchKeyRef.current = key;

    logSearchQuery(q, filteredRestaurants.length, historyRestaurantDetails);
    logSearchToDatabase(q, filteredRestaurants.length, historyRestaurantDetails, resultsShown);
    refreshSearchInsights();
    setPendingSearch(null);
  }, [filteredRestaurants, isLoading, pendingSearch, refreshSearchInsights]);

  const handleSearchCommit = useCallback((payload) => {
    const searchObj = typeof payload === 'object' && payload !== null ? payload : null;
    const query = searchObj?.query ?? payload;
    const selectedRestaurantDetails = searchObj?.selectedRestaurantDetails || searchObj?.details || null;

    const q = String(query || '').trim();
    if (q.length < 2) return;

    setSearchQuery(q);
    setPendingSearch({ query: q, selectedRestaurantDetails, submittedAt: Date.now() });
  }, []);

  const handleRestaurantClick = useCallback((restaurant) => {
    const selectedRestaurant = toHistoryRestaurantDetails(restaurant);
    const query = String(searchQuery || '').trim();
    if (query.length < 2 || !selectedRestaurant) return;

    const resultsShown = filteredRestaurants
      .map(toHistoryRestaurantDetails)
      .filter(Boolean);
    const selectedId = normalizeDetailsKey(selectedRestaurant.restaurantId || selectedRestaurant.placeId);
    const selectedName = normalizeDetailsKey(selectedRestaurant.name);
    const position = Math.max(
      1,
      resultsShown.findIndex((result) => {
        const resultId = normalizeDetailsKey(result.restaurantId || result.placeId);
        const resultName = normalizeDetailsKey(result.name);
        return (selectedId && resultId === selectedId) || (selectedName && resultName === selectedName);
      }) + 1
    );

    logSearchQuery(query, filteredRestaurants.length, selectedRestaurant);
    logSearchClickToDatabase({
      query,
      selectedRestaurant,
      resultsShown,
      position,
    });
    refreshSearchInsights();
  }, [filteredRestaurants, refreshSearchInsights, searchQuery]);


  const handleClearRecent = () => {
    clearRecentSearchQueries();
    refreshSearchInsights();
  };

  const applySearch = (query) => {
    handleSearchCommit(query);
  };

  const toggleCompare = (id) => {
    setCompareList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ padding: '24px 28px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, position: 'relative', zIndex: 20, overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                style={{
                  width: '46px', height: '46px', borderRadius: '16px', border: '1px solid #dbe3ee',
                  background: '#f8fafc', display: 'grid', placeItems: 'center', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(15,23,42,0.08)', flexShrink: 0,
                }}
              >
                <SidebarToggleIcon open={isSidebarOpen} />
              </button>
              <div>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#2563eb', lineHeight: 1.05 }}>
                  Search
                </p>
                <p style={{ margin: '12px 0 0', color: '#475569', fontSize: '14px', maxWidth: '680px' }}>
                  Find restaurants, apply filters, and compare options from one page.
                </p>
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
              Welcome back, {customerName}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', alignItems: 'stretch', position: 'relative', zIndex: 30 }}>
            {mapsReady ? (
              <AutocompleteSearch
                mapsReady
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSubmit={handleSearchCommit}
                locationBias={userLocation}
                debounceMs={120}
                placeholder="Search restaurants, cuisines, locations..."
                containerStyle={{ flex: '1 1 420px', minWidth: 0 }}
                inputBoxStyle={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '0 16px',
                  gap: '10px',
                }}
                inputStyle={{
                  flex: 1,
                  padding: '16px 0',
                  fontSize: '14px',
                  color: '#0f172a',
                }}
                dropdownStyle={{ borderRadius: '16px', zIndex: 1000 }}
              />
            ) : (
              <div style={{ flex: '1 1 420px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '0 16px' }}>
                <SearchBarIcon />
                <input
                  type="text"
                  disabled
                  placeholder="Loading search…"
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '16px 0', outline: 'none', fontSize: '14px', color: '#94a3b8', fontFamily: "'Poppins', sans-serif" }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => handleSearchCommit(searchQuery)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '16px', padding: '16px 22px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
            >
              <SearchBarIcon color="#fff" />
              Search
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '18px', border: '1.5px solid #e2e8f0', background: '#ffffff', cursor: 'pointer' }}>
              <FilterIcon />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Recent Searches</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                    From your history
                  </span>
                </div>
              </div>

              <RecentSearches limit={6} onSearchSelect={(query) => { handleSearchCommit(query); }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Trending in Pakistan</span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff',
                  padding: '3px 8px', borderRadius: '9999px',
                }}>
                  Popular
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.45 }}>
                Quick picks — tap to search restaurants across Pakistan
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {trendingTags.map((tag) => (
                  <button
                    key={tag.query}
                    type="button"
                    onClick={() => applySearch(tag.query)}
                    style={{
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Poppins', sans-serif",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(37,99,235,0.08)',
                    }}
                  >
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>↗</span>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>{filteredRestaurants.length}</span> results found
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', minWidth: '170px', fontSize: '13px', color: '#334155', background: '#ffffff', outline: 'none', cursor: 'pointer' }}>
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="sentiment">Sentiment</option>
                <option value="reviews">Reviews</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px' }}>
              {isLoading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '80px 0', fontSize: '15px' }}>
                  Searching restaurants…
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '80px 0', fontSize: '15px' }}>
                  {error || (searchQuery.trim() ? 'No restaurants match this search.' : 'No nearby restaurants found. Try a search term.')}
                </div>
              ) : (
                filteredRestaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    r={r}
                    inCompare={compareList.includes(r.id)}
                    onToggleCompare={toggleCompare}
                    onRestaurantClick={handleRestaurantClick}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SearchDashboard;

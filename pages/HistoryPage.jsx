import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { useRestaurants } from '../lib/useRestaurants';
import { useGoogleRestaurantSearch } from '../lib/useGoogleRestaurantSearch';
import { fetchUnifiedHistory, toggleFavoriteRestaurant, clearUnifiedHistory, deleteUnifiedHistoryItem } from '../lib/unifiedHistoryService';

const SearchBarIcon = ({ color = '#64748b' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

const typeStyles = {
  visited: { label: 'Visited', bg: '#eff6ff', color: '#2563eb', emoji: '👁️' },
  compared: { label: 'Compared', bg: '#f5f3ff', color: '#8b5cf6', emoji: '🔁' },
  searched: { label: 'Searched', bg: '#ecfdf5', color: '#059669', emoji: '🔎' },
  search_click: { label: 'Search Click', bg: '#eef2ff', color: '#4f46e5', emoji: '👆' },
  favorite: { label: 'Favorite', bg: '#fef3c7', color: '#ca8a04', emoji: '⭐' },
};

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'visited', label: 'Visited' },
  { id: 'compared', label: 'Compared' },
  { id: 'searched', label: 'Searched' },
  { id: 'search_click', label: 'Search Clicks' },
  { id: 'favorite', label: 'Favorites' },
];

const DEFAULT_HISTORY_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';

const hasMeaningfulDetails = (details) => (
  details
  && typeof details === 'object'
  && Object.values(details).some((value) => value !== undefined && value !== null && value !== '')
);

const normalizeHistoryItem = (item = {}, restaurantLookup = new Map()) => {
  const selectedRestaurantDetails = hasMeaningfulDetails(item.selectedRestaurantDetails)
    ? item.selectedRestaurantDetails
    : null;
  const legacyDetails = hasMeaningfulDetails(item.details) ? item.details : null;
  const firstResultDetails = hasMeaningfulDetails(item.firstResultDetails) ? item.firstResultDetails : null;
  const details = selectedRestaurantDetails || legacyDetails || firstResultDetails;
  const lookupKey = String(item.restaurantId || item._id || '').toLowerCase();
  const matchedRestaurant =
    details
    || restaurantLookup.get(String(item.restaurantId || item._id))
    || restaurantLookup.get(lookupKey)
    || null;

  const resolvedDetails = details || matchedRestaurant || null;
  const fallbackImage = item.image || matchedRestaurant?.image || DEFAULT_HISTORY_IMAGE;
  const data = {
    id: item._id || item.id,
    type: item.type,
    name: resolvedDetails?.name || item.name || item.query || 'Unnamed Restaurant',
    image: resolvedDetails?.image || resolvedDetails?.imageUrl || fallbackImage,
    location: resolvedDetails?.location || item.location || 'Unknown Location',
    rating: resolvedDetails?.rating ?? item.rating ?? 'N/A',
    rawItem: item,
  };

  return {
    ...item,
    details: resolvedDetails,
    name: data.name,
    image: data.image,
    location: data.location,
    rating: data.rating,
    data,
  };
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const { restaurants: restaurantsData = [] } = useRestaurants();

  // Load data from database
  const [historyData, setHistoryData] = useState({
    history: [],
    stats: {
      searches: 0,
      clicks: 0,
      comparisons: 0,
      favorites: 0,
      visits: 0,
    },
  });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const restaurantLookup = useMemo(() => {
    const lookup = new Map();
    (restaurantsData || []).forEach((restaurant) => {
      if (restaurant?.id != null) {
        lookup.set(String(restaurant.id), restaurant);
      }
      if (restaurant?.placeId != null) {
        lookup.set(String(restaurant.placeId), restaurant);
      }
      if (restaurant?.name) {
        lookup.set(String(restaurant.name).toLowerCase(), restaurant);
      }
    });
    return lookup;
  }, [restaurantsData]);

  // Load unified history and favorites on mount
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await fetchUnifiedHistory();
      setHistoryData(data);
      setFavorites((data.history || []).filter((item) => item.type === 'favorite').map((item) => String(item.restaurantId || item._id)));
      setLoading(false);
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const refreshHistory = async () => {
      const data = await fetchUnifiedHistory();
      setHistoryData(data);
      setFavorites((data.history || []).filter((item) => item.type === 'favorite').map((item) => String(item.restaurantId || item._id)));
    };

    const handleHistoryUpdated = () => {
      refreshHistory();
    };

    window.addEventListener('historyUpdated', handleHistoryUpdated);
    return () => window.removeEventListener('historyUpdated', handleHistoryUpdated);
  }, []);

  const historyItems = useMemo(() => {
    return (historyData.history || []).map((item) => normalizeHistoryItem(item, restaurantLookup));
  }, [historyData.history, restaurantLookup]);

  const currentFilterLabel = filterOptions.find((option) => option.id === selectedType)?.label || 'All';

  const filteredHistory = useMemo(() => {
    let items = historyItems;

    if (selectedType !== 'all') {
      items = items.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = item.data?.name || item.details?.name || item.name || item.query || '';
        const cuisine = item.details?.cuisine || '';
        const location = item.data?.location || item.details?.location || '';
        return (
          name.toLowerCase().includes(query) ||
          cuisine.toLowerCase().includes(query) ||
          location.toLowerCase().includes(query)
        );
      });
    }

    return items;
  }, [historyItems, selectedType, searchQuery]);

  const handleSidebarNavClick = useCallback((id) => {
    setActiveNav(id);
    if (id === 'home') navigate('/dashboard');
    if (id === 'search') navigate('/search');
    if (id === 'compare') navigate('/compare');
    if (id === 'history') navigate('/history');
    if (id === 'profile') navigate('/profile');
    if (id === 'settings') navigate('/settings');
  }, [navigate]);

  const handleViewDetail = useCallback((id) => {
    const item = historyItems.find((h) => h._id === id);
    if (item) setDetailItem(item);
  }, [historyItems]);

  const handleDeleteItem = useCallback(async (item) => {
    if (!item?._id) return;
    setDeleteTargetItem(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetItem?._id) return;

    const targetId = String(deleteTargetItem._id);
    setConfirmDeleteId(targetId);

    const result = await deleteUnifiedHistoryItem(deleteTargetItem);
    if (result?.history) {
      setHistoryData(result);
      setFavorites((result.history || []).filter((item) => item.type === 'favorite').map((item) => String(item.restaurantId || item._id)));
      if (detailItem?._id === deleteTargetItem._id) {
        setDetailItem(null);
      }
      setToast({
        type: 'success',
        message: 'Entry removed from history.',
      });
    } else {
      setToast({
        type: 'error',
        message: 'Could not delete that entry. Please try again.',
      });
    }

    setDeleteTargetItem(null);
    setConfirmDeleteId(null);

    window.setTimeout(() => setToast(null), 2800);
  }, [deleteTargetItem, detailItem]);

  const handleCancelDelete = useCallback(() => {
    if (confirmDeleteId) return;
    setDeleteTargetItem(null);
  }, [confirmDeleteId]);

  const handleCloseDetail = useCallback(() => {
    setDetailItem(null);
  }, []);

  const handleToggleFavorite = useCallback(async (restaurantId, restaurantDetails = null) => {
    const result = await toggleFavoriteRestaurant(restaurantId, restaurantDetails);
    if (result) {
      setFavorites(Array.isArray(result.favorites) ? result.favorites.map(String) : []);
    }
  }, []);

  const detailData = detailItem?.data || {};

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      const success = await clearUnifiedHistory();
      if (success) {
        setHistoryData({
          history: [],
          stats: {
            searches: 0,
            clicks: 0,
            comparisons: 0,
            favorites: 0,
            visits: 0,
          },
        });
        setFavorites([]);
      }
    }
  }, []);

  function FormatTime({ date }) {
    if (!date) return 'Recently';
    const now = new Date();
    const diff = now - new Date(date);
    const diffMins = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  function QueryImage({ query, fallback }) {
    const { restaurants = [], isLoading } = useGoogleRestaurantSearch(query || '');
    const img = restaurants?.[0]?.image;

    if (isLoading) {
      return (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg,#f1f5f9,#eef2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: '#e6eefc' }} />
        </div>
      );
    }

    if (img) {
      return <img src={img} alt={query} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }

    return (
      <div style={{ width: '100%', height: '100%', background: fallback || 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ padding: '20px 26px 16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
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
                  Browsing History
                </p>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Your recent restaurant views, searches, and comparisons
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '15px',
                border: '1px solid #dc2626',
                background: '#ffffff',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>Clear All</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    color: '#1e293b',
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    fontSize: '14px',
                    color: '#1e293b',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span>{currentFilterLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {filterOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    zIndex: 20,
                    width: '180px',
                    padding: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 18px 48px rgba(15,23,42,0.12)',
                  }}>
                    {filterOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedType(option.id);
                          setFilterOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          border: 'none',
                          background: selectedType === option.id ? '#eff6ff' : 'transparent',
                          color: selectedType === option.id ? '#1d4ed8' : '#0f172a',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: selectedType === option.id ? 700 : 500,
                        }}
                      >
                        <span>{option.label}</span>
                        {selectedType === option.id ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{historyData.stats.visits || 0}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Visited</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#f5f3ff', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{historyData.stats.comparisons || 0}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Compared</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{historyData.stats.searches || 0}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Searched</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{historyData.stats.favorites || 0}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Favorites</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>No history found</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Try a different search or filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredHistory.map((item) => {
                const badgeStyle = typeStyles[item.type] || typeStyles.visited;
                const favoriteKey = String(item.restaurantId || item._id);
                const isFavorited = favorites.includes(favoriteKey);
                const isDeleting = confirmDeleteId === String(item._id);
                const data = item.data || {};
                const comparisonText = item.comparisonLabel
                  || (item.comparedWith ? `Compared with: ${item.comparedWith}` : '')
                  || (item.note || '').replace(/^Compared\s*/i, 'Compared ');

                return (
                  <div
                    key={item._id}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.05)';
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Image Section */}
                    <div style={{
                      position: 'relative',
                      height: '160px',
                      overflow: 'hidden',
                      background: '#f1f5f9',
                    }}>
                      {data.image ? (
                        <img
                          src={data.image}
                          alt={data.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : null}

                      {/* Badge Overlay */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: badgeStyle.color, borderRadius: '50%', display: 'inline-block' }} />
                        {badgeStyle.label}
                      </div>

                      {/* Favorite button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item.restaurantId || item._id, item.details || null)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isFavorited ? '#fbbf24' : 'rgba(255,255,255,0.88)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                          transition: 'all 0.2s',
                        }}
                        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorited ? '⭐' : '☆'}
                      </button>
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      {/* Title */}
                      <h3 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#0f172a',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {data.name}
                      </h3>

                      {/* Cuisine & Price */}
                      {item.details && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          color: '#64748b',
                        }}>
                          {item.details.cuisine && <span style={{ fontWeight: 500 }}>{item.details.cuisine}</span>}
                          {item.details.priceRange && <span>{item.details.priceRange}</span>}
                        </div>
                      )}

                      {/* Details Line */}
                      <div style={{
                        fontSize: '11px',
                        color: '#0f172a',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        {data.rating != null && data.rating !== 'N/A' && (
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>★{data.rating}</span>
                        )}
                        {data.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span>📍</span>
                            <span>{data.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Sentiment & Reviews */}
                      {item.details && (
                        <div style={{
                          fontSize: '11px',
                          color: '#0f172a',
                          lineHeight: 1.4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}>
                          {item.details.sentiment != null && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontWeight: 600,
                              color: item.details.sentiment >= 80 ? '#16a34a' : item.details.sentiment >= 60 ? '#ca8a04' : '#dc2626',
                            }}>
                              <span>●</span>
                              {item.details.sentiment}%
                            </span>
                          )}
                          {item.details.reviews != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#0f172a', fontWeight: 500 }}>
                              <span>📝</span>
                              {item.details.reviews.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Search Query (if searched) */}
                      {(item.type === 'searched' || item.type === 'search_click') && item.query && (
                        <div style={{
                          fontSize: '10px',
                          color: '#475569',
                          padding: '6px 8px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          fontStyle: 'italic',
                        }}>
                          {item.type === 'search_click' ? 'Clicked from search' : 'Searched'}: <strong>{item.query}</strong>
                          {item.position ? ` • Position #${item.position}` : ''}
                        </div>
                      )}

                      {item.type === 'compared' && comparisonText && (
                        <div style={{
                          fontSize: '10px',
                          color: '#6d28d9',
                          padding: '6px 8px',
                          backgroundColor: '#f5f3ff',
                          borderRadius: '6px',
                          fontWeight: 600,
                          lineHeight: 1.4,
                        }}>
                          {comparisonText}
                        </div>
                      )}

                      {/* Time */}
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '4px',
                      }}>
                        🕐 <FormatTime date={item.clickedAt || item.searchedAt || item.createdAt || item.visitedAt} />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item._id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          disabled={isDeleting}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: isDeleting ? '#fee2e2' : '#f8fafc',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDeleting ? '#fee2e2' : '#f8fafc'; }}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 70,
          minWidth: '280px',
          maxWidth: '360px',
          padding: '14px 16px',
          borderRadius: '14px',
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#047857' : '#b91c1c',
          boxShadow: '0 16px 36px rgba(15,23,42,0.14)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {toast.message}
        </div>
      )}

      {deleteTargetItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 65,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 28px 70px rgba(15,23,42,0.22)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Delete history entry?</h3>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                This will permanently remove{' '}
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {deleteTargetItem.details?.name || deleteTargetItem.query || deleteTargetItem.name || 'this entry'}
                </span>{' '}
                from your database.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px 22px' }}>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={Boolean(confirmDeleteId)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: confirmDeleteId ? 'not-allowed' : 'pointer',
                  opacity: confirmDeleteId ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(confirmDeleteId)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #dc2626',
                  background: confirmDeleteId ? '#ef4444' : '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: confirmDeleteId ? 'not-allowed' : 'pointer',
                  opacity: confirmDeleteId ? 0.8 : 1,
                }}
              >
                {confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: '92%', maxWidth: '720px', background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', fontFamily: "'Poppins', sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {detailData.name || detailItem.details?.name || detailItem.query || detailItem.name || 'Item'}
                </h2>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
                  {typeStyles[detailItem.type]?.label || 'History item'} • <FormatTime date={detailItem.clickedAt || detailItem.searchedAt || detailItem.createdAt || detailItem.visitedAt} />
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '28px' }}>
              <div>
                <img
                  src={detailData.image || detailItem.details?.image || detailItem.image || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={detailData.name || detailItem.details?.name || detailItem.name || 'Item'}
                  style={{ width: '100%', borderRadius: '20px', height: '260px', objectFit: 'cover', marginBottom: '20px' }}
                />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {detailItem.details?.cuisine && (
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', background: '#eff6ff', padding: '8px 12px', borderRadius: '999px' }}>
                      {detailItem.details.cuisine}
                    </span>
                  )}
                  {detailItem.details?.priceRange && (
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', background: '#f8fafc', padding: '8px 12px', borderRadius: '999px' }}>
                      {detailItem.details.priceRange}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {detailData.rating != null && detailData.rating !== 'N/A' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Rating</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{detailData.rating ?? detailItem.details.rating} ★</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#f97316', fontWeight: '700' }}>Top score</div>
                  </div>
                )}
                {detailItem.details?.sentiment != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>AI Sentiment</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: (detailItem.details.sentiment ?? 0) >= 80 ? '#16a34a' : (detailItem.details.sentiment ?? 0) >= 60 ? '#ca8a04' : '#dc2626' }}>
                        {detailItem.details.sentiment}%
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Customer mood</div>
                  </div>
                )}
                {detailItem.details?.reviews != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Reviews</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{(detailItem.details.reviews ?? 0).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Total reviews</div>
                  </div>
                )}
                {(detailItem.type === 'searched' || detailItem.type === 'search_click') && detailItem.resultCount != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>{detailItem.type === 'search_click' ? 'Results Shown' : 'Results Found'}</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{detailItem.resultCount}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Restaurants</div>
                  </div>
                )}
                {detailItem.type === 'search_click' && detailItem.position != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Clicked Position</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>#{detailItem.position}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Result rank</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '0 28px 24px', color: '#475569' }}>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7 }}>
                {detailData.location && detailData.location !== 'Unknown Location' && <span>{detailData.location}</span>}
                {detailItem.details?.location && detailItem.details?.cuisine && ' • '}
                {detailItem.details?.cuisine && <span>{detailItem.details.cuisine}</span>}
                {detailItem.details?.cuisine && detailItem.details?.priceRange && ' • '}
                {detailItem.details?.priceRange && <span>{detailItem.details.priceRange}</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;

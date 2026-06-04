import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { useRestaurants } from '../lib/useRestaurants';
import { useGoogleRestaurantSearch } from '../lib/useGoogleRestaurantSearch';
import { logSearch, logView, logCompare, getHistory, clearHistory, removeHistoryItem } from '../lib/historyService';
import { formatRelativeSearchTime } from '../lib/searchInsights';

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
  viewed: { label: 'Viewed', bg: '#eff6ff', color: '#2563eb', emoji: '👁️' },
  compared: { label: 'Compared', bg: '#f5f3ff', color: '#8b5cf6', emoji: '🔁' },
  searched: { label: 'Searched', bg: '#ecfdf5', color: '#059669', emoji: '🔎' },
};

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'compared', label: 'Compared' },
  { id: 'searched', label: 'Searches' },
];

// Dummy sample data if no real history exists
const dummySampleHistory = [
  {
    id: 'dummy-1',
    type: 'searched',
    name: 'Butt Karahi',
    query: 'butt karahi',
    cuisine: 'Pakistani',
    priceRange: '$',
    rating: 4.4,
    location: 'Lakshmi Chowk, Lahore',
    distance: 2.1,
    sentiment: 88,
    reviews: 3210,
    resultCount: 20,
    status: 'Open',
    time: Date.now() - 60000,
    image: 'https://source.unsplash.com/400x300/?karahi,food',
  },
  {
    id: 'dummy-2',
    type: 'viewed',
    name: 'Naan House',
    cuisine: 'Indian',
    priceRange: '$$',
    rating: 4.6,
    location: 'Mall Road, Lahore',
    distance: 3.5,
    sentiment: 78,
    reviews: 2150,
    status: 'Open',
    time: Date.now() - 300000,
    image: 'https://source.unsplash.com/400x300/?naan,restaurant',
  },
  {
    id: 'dummy-3',
    type: 'searched',
    name: 'Pizza Hut',
    query: 'pizza',
    cuisine: 'Fast Food',
    priceRange: '$$',
    rating: 4.0,
    location: 'Defense, Lahore',
    distance: 5.2,
    sentiment: 65,
    reviews: 5420,
    resultCount: 45,
    status: 'Open',
    time: Date.now() - 900000,
    image: 'https://source.unsplash.com/400x300/?pizza,fastfood',
  },
];

const initialHistory = [];

const HistoryPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const { restaurants: restaurantsData = [] } = useRestaurants();
  
  const [historyItems, setHistoryItems] = useState(() => {
    const history = getHistory();
    // Show only real history, no dummy fallback
    return history;
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const currentFilterLabel = filterOptions.find((option) => option.id === selectedType)?.label || 'All';

  const stats = useMemo(() => {
    const viewed = historyItems.filter((item) => item.type === 'viewed').length;
    const compared = historyItems.filter((item) => item.type === 'compared').length;
    const searched = historyItems.filter((item) => item.type === 'searched').length;
    return { viewed, compared, searched };
  }, [historyItems]);

  // Persist historyItems to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('userHistory', JSON.stringify(historyItems));
    } catch (e) {
      console.error('Failed to save userHistory to localStorage', e);
    }
  }, [historyItems]);

  // Listen for external history updates (from historyService or other pages)
  React.useEffect(() => {
    const handler = (e) => {
      try {
        const arr = e?.detail ?? getHistory();
        setHistoryItems(arr);
      } catch (err) {
        console.error('Error updating history', err);
      }
    };
    window.addEventListener('historyUpdated', handler);
    return () => window.removeEventListener('historyUpdated', handler);
  }, []);

  const handleDelete = useCallback((id) => {
    setConfirmDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback((id) => {
    removeHistoryItem(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    setConfirmDeleteId(null);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const handleClearAll = useCallback(() => {
    clearHistory();
    setHistoryItems([]);
    setConfirmDeleteId(null);
  }, []);

  const historyWithDetails = useMemo(
    () => historyItems.map((item) => {
      const searchQuery = (item.query || item.name || '').toLowerCase();
      const rest = restaurantsData.find((r) =>
        item.restaurantId === r.id ||
        (item.name && r.name === item.name) ||
        (item.type === 'searched' && searchQuery && (
          r.name?.toLowerCase().includes(searchQuery) ||
          r.cuisine?.toLowerCase().includes(searchQuery) ||
          r.location?.toLowerCase().includes(searchQuery)
        ))
      ) || {};

      const merged = { ...item, ...rest };
      if (item.type === 'searched') {
        merged.location = item.location || rest.location || 'Search results';
        merged.image = item.image || rest.image || '';
      }
      return merged;
    }),
    [historyItems, restaurantsData]
  );

  const filteredHistory = useMemo(() => {
    return historyWithDetails.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (!query) return true;
      return [item.name, item.cuisine, item.location, item.note].some((value) =>
        value?.toLowerCase().includes(query)
      );
    });
  }, [historyWithDetails, searchQuery, selectedType]);

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
    const item = historyWithDetails.find((h) => h.id === id);
    if (item) setDetailItem(item);
  }, [historyWithDetails]);

  const handleCloseDetail = useCallback(() => {
    setDetailItem(null);
  }, []);

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{stats.viewed}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Restaurants Viewed</span>
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
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{stats.compared}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Comparisons Made</span>
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
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>{stats.searched}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Searches Performed</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>No history found</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Try a different search or clear the filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredHistory.map((item) => {
                const badgeStyle = typeStyles[item.type] || typeStyles.viewed;
                const statusLabel = item.type === 'searched'
                  ? 'Searched'
                  : item.type === 'compared'
                    ? item.note || 'Compared'
                    : 'Viewed';

                const isSearched = item.type === 'searched';

                return (
                  <div
                    key={item.id}
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
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : isSearched ? (
                        <QueryImage query={item.query || item.name} fallback={'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'} />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </div>
                      )}

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
                        {statusLabel}
                      </div>
                      {item.status && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(15, 23, 42, 0.88)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '5px 11px',
                          borderRadius: '9999px',
                        }}>
                          {item.status}
                        </div>
                      )}
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
                        {item.name}
                      </h3>

                      {/* Cuisine & Price on same line */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        color: '#64748b',
                      }}>
                        {item.cuisine && <span style={{ fontWeight: 500 }}>{item.cuisine}</span>}
                        {item.priceRange && <span>{item.priceRange}</span>}
                      </div>

                      {/* Line 1: Rating + Location */}
                      <div style={{
                        fontSize: '11px',
                        color: '#0f172a',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexWrap: 'wrap',
                      }}>
                        {item.rating != null && (
                          <>
                            <span style={{ color: '#fbbf24', fontWeight: 600 }}>★{item.rating}</span>
                          </>
                        )}
                        {item.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span>📍</span>
                            <span>{item.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Line 2: Sentiment + Reviews */}
                      <div style={{
                        fontSize: '11px',
                        color: '#0f172a',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        {item.sentiment != null && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontWeight: 600,
                            color: item.sentiment >= 80 ? '#16a34a' : item.sentiment >= 60 ? '#ca8a04' : '#dc2626',
                          }}>
                            <span>●</span>
                            {item.sentiment}% sentiment
                          </span>
                        )}
                        {item.reviews != null && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#0f172a', fontWeight: 500 }}>
                            <span>📝</span>
                            {item.reviews.toLocaleString()} reviews
                          </span>
                        )}
                      </div>

                      {/* Line 3: Query (if searched) */}
                      {isSearched && item.query && (
                        <div style={{
                          fontSize: '10px',
                          color: '#475569',
                          padding: '6px 8px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          fontStyle: 'italic',
                        }}>
                          Query: <strong>{item.query}</strong>
                        </div>
                      )}

                      {/* Line 4: Results + Location (if searched) */}
                      {isSearched && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '10px',
                          color: '#0f172a',
                          flexWrap: 'wrap',
                        }}>
                          {item.resultCount != null && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <span>🔎</span>
                              <span>{item.resultCount} results</span>
                            </span>
                          )}
                          {item.location && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <span>📍</span>
                              <span>{item.location}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Line 5: Time */}
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '4px',
                      }}>
                        🕐 {formatRelativeSearchTime(item.time) || 'Just now'}
                      </div>

                      {/* Action Buttons - Bottom */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item.id)}
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
                          onClick={() => handleDelete(item.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: '#f8fafc',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        >
                          Delete
                        </button>
                      </div>

                      {/* Delete Confirmation */}
                      {confirmDeleteId === item.id && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(item.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#dc2626',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelDelete}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#475569',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: '92%', maxWidth: '720px', background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', fontFamily: "'Poppins', sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{detailItem.name}</h2>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>{detailItem.note || 'Compared item details'}</p>
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
                  src={detailItem.image}
                  alt={detailItem.name}
                  style={{ width: '100%', borderRadius: '20px', height: '260px', objectFit: 'cover', marginBottom: '20px' }}
                />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', background: '#eff6ff', padding: '8px 12px', borderRadius: '999px' }}>
                    {detailItem.cuisine}
                  </span>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', background: '#f8fafc', padding: '8px 12px', borderRadius: '999px' }}>
                    {detailItem.priceRange}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Rating</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{detailItem.rating ?? 0} ★</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#f97316', fontWeight: '700' }}>Top score</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>AI Sentiment</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: (detailItem.sentiment ?? 0) >= 80 ? '#16a34a' : (detailItem.sentiment ?? 0) >= 60 ? '#ca8a04' : '#dc2626' }}>
                      {detailItem.sentiment ?? 0}%
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Customer mood</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Reviews</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{(detailItem.reviews ?? 0).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total reviews</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '18px', borderRadius: '20px', background: '#f8fafc' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>Wait Time</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{detailItem.waitTimeLabel || (detailItem.waitTime ? `${detailItem.waitTime} min` : 'N/A')}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Estimated wait</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '0 28px 24px', color: '#475569' }}>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7 }}>
                {detailItem.location} • {detailItem.cuisine} • {detailItem.priceRange}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;

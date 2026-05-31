import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { restaurants } from '../data/restaurants';
import { logCompare } from '../lib/historyService';
import { getStoredUser } from '../lib/auth';

const RatingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 10.26 24 10.35 17.77 16.88 20.16 25.07 12 19.77 3.84 25.07 6.23 16.88 0 10.35 8.91 10.26 12 2" />
  </svg>
);

const SentimentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="1" />
    <circle cx="15" cy="9" r="1" />
  </svg>
);

const ReviewsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PriceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TimeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CuisineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SpecialtiesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const SplitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

// ── ADD RESTAURANT MODAL ──────────────────────
const AddRestaurantModal = ({ isOpen, onClose, onAdd, allRestaurants, selectedIds }) => {
  const [searchText, setSearchText] = useState('');
  const availableRestaurants = allRestaurants.filter(r => !selectedIds.includes(r.id));

  const filteredRestaurants = availableRestaurants.filter((r) => {
    if (!searchText.trim()) return true;
    const query = searchText.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.cuisine.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query)
    );
  });

  const visibleRestaurants = filteredRestaurants.slice(0, 4);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        width: '90%',
        maxWidth: '520px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(15,23,42,0.20)',
        fontFamily: "'Poppins', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 12px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Add Restaurant to Compare
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 14px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search restaurants, cuisine or location"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                color: '#1f2937',
                fontFamily: "'Poppins', sans-serif",
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '10px 0 0 0' }}>
            Showing up to 4 matching restaurants. Search to narrow results.
          </p>
        </div>

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px 12px 12px',
        }}>
          {availableRestaurants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#94a3b8',
              padding: '32px 16px',
              fontSize: '13px',
            }}>
              All restaurants already selected.
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#94a3b8',
              padding: '32px 16px',
              fontSize: '13px',
            }}>
              No restaurants found. Try another name or cuisine.
            </div>
          ) : (
            visibleRestaurants.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 14px 30px rgba(15,23,42,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Image */}
                <img
                  src={r.image}
                  alt={r.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0f172a',
                    margin: '0 0 2px',
                  }}>
                    {r.name}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: 0,
                  }}>
                    {r.cuisine} • {r.location}
                  </p>
                </div>

                {/* Rating */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  flexShrink: 0,
                  border: '1px solid #d1d5db',
                }}>
                  <span style={{ fontSize: '12px', color: '#f97316' }}>★</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                    {r.rating}
                  </span>
                </div>

                {/* Add button */}
                <button
                  onClick={() => onAdd(r.id)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 6px 18px rgba(37,99,235,0.18)',
                  }}
                >
                  +
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ──────────────────────────────

// ── MAIN COMPONENT ──────────────────────────────
const CompareDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('compare');
  const [compareList, setCompareList] = useState([]); // start with no preselected restaurants
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSidebarNavClick = (id) => {
    setActiveNav(id);
    if (id === 'home') navigate('/dashboard');
    if (id === 'search') navigate('/search');
    if (id === 'compare') navigate('/compare');
    if (id === 'history') navigate('/history');
    if (id === 'profile') navigate('/profile');
    if (id === 'settings') navigate('/settings');
  };

  const selectedRestaurants = restaurants.filter(r => compareList.includes(r.id));

  const handleAddRestaurant = (id) => {
    if (compareList.length < 4) {
      setCompareList([...compareList, id]);
    }
  };

  const handleRemoveRestaurant = (id) => {
    setCompareList(compareList.filter(x => x !== id));
  };

  // Auto-log comparisons when the selection changes to 2+ restaurants.
  const lastLoggedCompareRef = useRef('');
  useEffect(() => {
    const idsKey = compareList.slice().sort().join(',');
    if (compareList.length >= 2 && lastLoggedCompareRef.current !== idsKey) {
      const sel = restaurants.filter(r => compareList.includes(r.id));
      try {
        logCompare(sel);
        lastLoggedCompareRef.current = idsKey;
        console.log('Auto-logged comparison of', sel.map(s => s.name));
      } catch (e) {
        console.error('Auto logCompare failed', e);
      }
    }
  }, [compareList]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#f8fafc',
      fontFamily: "'Poppins', sans-serif",
    }}>
      {/* SIDEBAR */}
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* HEADER */}
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
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '0 0 4px', lineHeight: 1.05 }}>
                  Compare Restaurants
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Side-by-side comparison with AI sentiment analysis
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#e0f2fe', borderRadius: '16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#032b53', fontFamily: 'sans-serif' }}>
                  {compareList.length} of 4 selected
                </span>
                <span style={{ fontSize: '14px', color: '#627d98', fontFamily: 'sans-serif' }}>
                  Add up to 4 restaurants to compare
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                boxShadow: '0 10px 24px rgba(37,99,235,0.18)',
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              Add Restaurant
            </button>
          </div>

          {selectedRestaurants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#94a3b8',
              padding: '48px 20px',
              fontSize: '14px',
            }}>
              <p>No restaurants selected. Click "Add Restaurant" to start comparing.</p>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '280px minmax(0, 1fr)',
                gap: '20px',
                alignItems: 'start',
              }}>
                <div style={{
  background: '#f1f5f9', // Light gray background jo original picture me hai
  borderRadius: '20px',  // Slightly smoother corners
  padding: '24px 20px',  // Perfect spacing inside the box
  width: '240px',        // KFC card ke barabar width
  height: '160px',       // KFC card ke barabar height
  boxSizing: 'border-box',
  boxShadow: '0 4px 12px rgba(15,23,42,0.02)', // Bohot halka aur clean shadow
}}>
  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#475569', margin: 0 }}>
    Comparison Metrics
  </h2>
</div>


                <div style={{
                  display: 'grid',
                  gridTemplateColumns: selectedRestaurants.length === 1 ? '1fr' : selectedRestaurants.length === 2 ? 'repeat(2, minmax(0, 1fr))' : selectedRestaurants.length === 3 ? 'repeat(3, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}>
                  {selectedRestaurants.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
                        border: '1px solid #cbd5e1',
                        position: 'relative',
                        minHeight: '210px',
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        height: '130px',
                        background: '#e5edf5',
                        overflow: 'hidden',
                      }}>
                        <img
                          src={r.image}
                          alt={r.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <button
                          onClick={() => handleRemoveRestaurant(r.id)}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#334155',
                            boxShadow: '0 3px 9px rgba(0,0,0,0.12)',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
                          {r.name}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                          {r.cuisine}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <RatingIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Rating
                  </span>
                </div>
                <MetricValueRow
                  restaurants={selectedRestaurants}
                  getValue={(r) => `★ ${r.rating}`}
                  valueColor={() => '#0f172a'}
                  isBest={(r) => selectedRestaurants.length > 1 && r.rating === Math.max(...selectedRestaurants.map(x => x.rating))}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <SentimentIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    AI Sentiment
                  </span>
                </div>
                <MetricValueRow
                  restaurants={selectedRestaurants}
                  getValue={(r) => `${r.sentiment}%`}
                  valueColor={(r) => r.sentiment >= 80 ? '#22c55e' : r.sentiment >= 60 ? '#f59e0b' : '#ef4444'}
                  isBest={(r) => selectedRestaurants.length > 1 && r.sentiment === Math.max(...selectedRestaurants.map(x => x.sentiment))}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <ReviewsIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Total Reviews
                  </span>
                </div>
                <MetricValueRow
                  restaurants={selectedRestaurants}
                  getValue={(r) => r.reviews.toLocaleString()}
                  valueColor={() => '#0f172a'}
                  isBest={(r) => selectedRestaurants.length > 1 && r.reviews === Math.max(...selectedRestaurants.map(x => x.reviews))}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <PriceIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Price Range
                  </span>
                </div>
                <MetricValueRow
                  restaurants={selectedRestaurants}
                  getValue={(r) => r.priceRange}
                  valueColor={() => '#0f172a'}
                  isBest={(r) => r.priceRange === '$'}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <TimeIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Wait Time
                  </span>
                </div>
                <MetricValueRow
                  restaurants={selectedRestaurants}
                  getValue={(r) => r.waitTimeLabel || `${r.waitTime} min`}
                  valueColor={() => '#0f172a'}
                  isBest={(r) => selectedRestaurants.length > 1 && r.waitTime === Math.min(...selectedRestaurants.map((x) => x.waitTime ?? Number.MAX_SAFE_INTEGER))}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <CuisineIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Cuisine
                  </span>
                </div>
                <MetricValueRow
                  restaurants={selectedRestaurants}
                  getValue={(r) => r.cuisine}
                  valueColor={() => '#0f172a'}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <SpecialtiesIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Specialties
                  </span>
                </div>
                <SpecialtiesValueRow restaurants={selectedRestaurants} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <SplitIcon />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Review Split
                  </span>
                </div>
                <ReviewSplitValueRow restaurants={selectedRestaurants} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ADD RESTAURANT MODAL */}
      <AddRestaurantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(id) => {
          handleAddRestaurant(id);
          if (compareList.length >= 3) {
            setShowAddModal(false);
          }
        }}
        allRestaurants={restaurants}
        selectedIds={compareList}
      />
    </div>
  );
};

// ── METRIC ROW COMPONENT ──────────────────────
const MetricRowNew = ({ label, icon, restaurants, getValue, valueColor, isBest, showLabel = true }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 0',
      borderBottom: '1px solid #f1f5f9',
    }}>
      {showLabel && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '120px',
          flexShrink: 0,
        }}>
          {icon}
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
            {label}
          </span>
        </div>
      )}

      {/* Values */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: restaurants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
      }}>
        {restaurants.map((r, idx) => (
          <div
            key={r.id}
            style={{
              padding: '16px',
              borderRadius: '14px',
              border: isBest && isBest(r, idx) ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: isBest && isBest(r, idx) ? '#eff6ff' : '#f8fafc',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: isBest && isBest(r, idx) ? '700' : '600',
              color: isBest && isBest(r, idx) ? '#2563eb' : valueColor ? valueColor(r) : '#0f172a',
              position: 'relative',
              boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
            }}
          >
            {getValue(r, idx)}
            {isBest && isBest(r, idx) && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '8px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                Best
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricValueRow = ({ restaurants, getValue, valueColor, isBest }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: restaurants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '12px',
    }}>
      {restaurants.map((r, idx) => (
        <div
          key={r.id}
          style={{
            padding: '16px',
            borderRadius: '14px',
            border: isBest && isBest(r, idx) ? '2px solid #2563eb' : '1px solid #cbd5e1',
            background: isBest && isBest(r, idx) ? '#eff6ff' : '#f8fafc',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: isBest && isBest(r, idx) ? '700' : '600',
            color: isBest && isBest(r, idx) ? '#2563eb' : valueColor ? valueColor(r) : '#0f172a',
            position: 'relative',
            boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
          }}
        >
          {getValue(r, idx)}
          {isBest && isBest(r, idx) && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '8px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              Best
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const SpecialtiesValueRow = ({ restaurants }) => {
  const specialties = {
    1: ['Zinger Burger', 'Hot Wings', 'Krunch Burger'],
    3: ['Pasta Alfredo', 'Steak', 'Club Sandwich'],
    2: ['Whoppers', 'Grilled Chicken'],
    4: ['Karahi', 'Biryani', 'Seekh Kebab'],
    5: ['BBQ Platter', 'Grilled Steak'],
    6: ['Margarita', 'Vegetarian Pizza'],
    7: ['Continental Platter', 'Grilled Fish'],
    8: ['Sub Sandwiches', 'Salads'],
  };

  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: restaurants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
      }}>
        {restaurants.map((r) => (
          <div key={r.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(specialties[r.id] || []).map((specialty, idx) => (
              <span
                key={idx}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {specialty}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewSplitValueRow = ({ restaurants }) => {
  const reviewSplits = {
    1: { positive: 85, negative: 15 },
    2: { positive: 80, negative: 20 },
    3: { positive: 92, negative: 8 },
    4: { positive: 88, negative: 12 },
    5: { positive: 82, negative: 18 },
    6: { positive: 65, negative: 35 },
    7: { positive: 79, negative: 21 },
    8: { positive: 73, negative: 27 },
  };

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: restaurants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}>
        {restaurants.map((r) => {
          const split = reviewSplits[r.id] || { positive: 50, negative: 50 };
          return (
            <div key={r.id}>
              <div style={{
                display: 'flex',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden',
                background: '#e2e8f0',
                marginBottom: '6px',
              }}>
                <div style={{ width: `${split.positive}%`, background: '#22c55e' }} />
                <div style={{ width: `${split.negative}%`, background: '#ef4444' }} />
              </div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                textAlign: 'center',
              }}>
                {split.positive}% / {split.negative}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── SPECIALTIES ROW ──────────────────────────
const SpecialtiesRow = ({ restaurants }) => {
  const specialties = {
    1: ['Zinger Burger', 'Hot Wings', 'Krunch Burger'],
    3: ['Pasta Alfredo', 'Steak', 'Club Sandwich'],
    2: ['Whoppers', 'Grilled Chicken'],
    4: ['Karahi', 'Biryani', 'Seekh Kebab'],
    5: ['BBQ Platter', 'Grilled Steak'],
    6: ['Margarita', 'Vegetarian Pizza'],
    7: ['Continental Platter', 'Grilled Fish'],
    8: ['Sub Sandwiches', 'Salads'],
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      padding: '16px 0',
      borderBottom: '1px solid #f1f5f9',
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '120px',
        flexShrink: 0,
        paddingTop: '8px',
      }}>
        <SpecialtiesIcon />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
          Specialties
        </span>
      </div>

      {/* Values */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: restaurants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
      }}>
        {restaurants.map((r) => (
          <div key={r.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(specialties[r.id] || []).map((specialty, idx) => (
              <span
                key={idx}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {specialty}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── REVIEW SPLIT ROW ─────────────────────────
const ReviewSplitRow = ({ restaurants }) => {
  const reviewSplits = {
    1: { positive: 85, negative: 15 },
    2: { positive: 80, negative: 20 },
    3: { positive: 92, negative: 8 },
    4: { positive: 88, negative: 12 },
    5: { positive: 82, negative: 18 },
    6: { positive: 65, negative: 35 },
    7: { positive: 79, negative: 21 },
    8: { positive: 73, negative: 27 },
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 0',
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '120px',
        flexShrink: 0,
      }}>
        <SplitIcon />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
          Review Split
        </span>
      </div>

      {/* Values */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: restaurants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}>
        {restaurants.map((r) => {
          const split = reviewSplits[r.id] || { positive: 50, negative: 50 };
          return (
            <div key={r.id}>
              <div style={{
                display: 'flex',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden',
                background: '#e2e8f0',
                marginBottom: '4px',
              }}>
                <div style={{
                  width: `${split.positive}%`,
                  background: '#22c55e',
                }} />
                <div style={{
                  width: `${split.negative}%`,
                  background: '#ef4444',
                }} />
              </div>
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                textAlign: 'center',
              }}>
                {split.positive}% / {split.negative}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompareDashboard;

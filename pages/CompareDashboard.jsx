import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { useRestaurants } from '../lib/useRestaurants';
import { logCompare } from '../lib/historyService';
import { getStoredUser } from '../lib/auth';

// ── LOCALSTORE HELPERS
const readLS = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeLS = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// Dynamic specialties based on cuisine
const getSpecialties = (r) => {
  const c = (r.cuisine || '').toLowerCase();
  if (c.includes('fast') || c.includes('fried chicken') || c.includes('american')) return ['Burgers', 'Fries', 'Chicken Meal'];
  if (c.includes('pizza') || c.includes('italian')) return ['Pizza', 'Pasta', 'Calzone'];
  if (c.includes('karahi') || c.includes('pakistani') || c.includes('desi') || c.includes('mughlai')) return ['Karahi', 'Biryani', 'Seekh Kebab'];
  if (c.includes('chinese') || c.includes('asian') || c.includes('thai')) return ['Noodles', 'Fried Rice', 'Dumplings'];
  if (c.includes('cafe') || c.includes('continental') || c.includes('international')) return ['Steaks', 'Pasta', 'Club Sandwich'];
  if (c.includes('bbq') || c.includes('grill')) return ['BBQ Platter', 'Grilled Chicken', 'Ribs'];
  if (c.includes('sub') || c.includes('sandwich') || c.includes('bakery')) return ['Subs', 'Wraps', 'Fresh Salads'];
  if (c.includes('seafood')) return ['Grilled Fish', 'Prawns', 'Seafood Platter'];
  if (c.includes('burger')) return ['Smash Burger', 'Double Patty', 'Crispy Chicken'];
  return ['House Special', "Chef's Choice", 'Signature Platter'];
};

const getReviewSplit = (r) => {
  const pos = r.sentiment ?? 70;
  const neg = Math.max(5, Math.round((100 - pos) * 0.35));
  const neu = 100 - pos - neg;
  return { positive: pos, neutral: neu, negative: neg };
};

const sentimentColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

// ADD RESTAURANT MODAL
const AddRestaurantModal = ({ isOpen, onClose, onAdd, allRestaurants, selectedIds }) => {
  const [query, setQuery] = React.useState('');
  if (!isOpen) return null;

  const available = allRestaurants.filter(r => !selectedIds.includes(String(r.id)));
  const filtered = query.trim()
    ? available.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        (r.cuisine || '').toLowerCase().includes(query.toLowerCase()) ||
        (r.location || r.vicinity || '').toLowerCase().includes(query.toLowerCase())
      )
    : available;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px',
          width: '90%', maxWidth: '520px', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(15,23,42,0.22)',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' }}>
              Add to Compare
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              {available.length} restaurant{available.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            x
          </button>
        </div>

        <div style={{ padding: '14px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, cuisine or location..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#1f2937', fontFamily: "'Poppins', sans-serif" }}
              autoFocus
            />
            {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>x</button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {available.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '13px' }}>All restaurants are already selected.</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '13px' }}>No matches found.</p>
          ) : filtered.slice(0, 20).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', marginBottom: '8px' }}>
              <img src={r.image} alt={r.name} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=60'; }} style={{ width: 52, height: 52, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{r.cuisine} - {r.location || r.vicinity || ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: '#f97316' }}>*</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{r.rating}</span>
              </div>
              <button onClick={() => onAdd(String(r.id))} style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>+</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// METRIC ROW
const MetricRow = ({ icon, label, restaurants, getValue, valueColor, isBest, renderValue }) => {
  const cols = restaurants.length;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        {icon}
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: cols === 1 ? '1fr' : `repeat(${cols}, minmax(0, 1fr))`, gap: '12px' }}>
        {restaurants.map(r => {
          const best = isBest ? isBest(r) : false;
          return (
            <div key={r.id} style={{ padding: '14px 12px', borderRadius: '12px', border: best ? '2px solid #2563eb' : '1px solid #e2e8f0', background: best ? '#eff6ff' : '#fff', textAlign: 'center', fontSize: '13px', fontWeight: best ? '700' : '600', color: best ? '#2563eb' : (valueColor ? valueColor(r) : '#0f172a'), position: 'relative', boxShadow: best ? '0 4px 14px rgba(37,99,235,0.14)' : '0 1px 4px rgba(15,23,42,0.06)' }}>
              {renderValue ? renderValue(r) : getValue(r)}
              {best && <span style={{ position: 'absolute', top: -9, right: 8, background: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '6px' }}>Best</span>}
            </div>
          );
        })}
      </div>
    </>
  );
};

const CompareDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('compare');
  const [showAddModal, setShowAddModal] = useState(false);
  const [compareList, setCompareList] = useState(() => readLS('ts_compareList', []));
  const { restaurants: restaurantsData } = useRestaurants();

  const restaurantPool = useMemo(() => {
    const stored = readLS('ts_restaurantPool', []);
    const poolMap = new Map();
    (restaurantsData || []).forEach(r => poolMap.set(String(r.id), r));
    stored.forEach(r => poolMap.set(String(r.id), r));
    return Array.from(poolMap.values());
  }, [restaurantsData]);

  useEffect(() => { writeLS('ts_compareList', compareList); }, [compareList]);

  const lastLoggedRef = useRef('');
  useEffect(() => {
    const key = [...compareList].sort().join(',');
    if (compareList.length >= 2 && lastLoggedRef.current !== key) {
      const sel = compareList.map(id => restaurantPool.find(r => String(r.id) === String(id))).filter(Boolean);
      if (sel.length >= 2) { try { logCompare(sel); lastLoggedRef.current = key; } catch {} }
    }
  }, [compareList, restaurantPool]);

  const handleSidebarNavClick = (id) => {
    setActiveNav(id);
    if (id === 'home') navigate('/dashboard');
    if (id === 'search') navigate('/search');
    if (id === 'compare') navigate('/compare');
    if (id === 'history') navigate('/history');
    if (id === 'profile') navigate('/profile');
    if (id === 'settings') navigate('/settings');
  };

  const selectedRestaurants = compareList
    .map(id => restaurantPool.find(r => String(r.id) === String(id)))
    .filter(Boolean);

  const handleAddRestaurant = (id) => {
    if (compareList.length < 4 && !compareList.includes(id)) setCompareList([...compareList, id]);
  };

  const handleRemove = (id) => setCompareList(compareList.filter(x => x !== id));

  const winner = useMemo(() => {
    if (selectedRestaurants.length < 2) return null;
    return selectedRestaurants.reduce((best, r) => {
      const score = (r.rating || 0) * 20 + (r.sentiment || 0) * 0.6 + Math.log((r.reviews || 0) + 1) * 5;
      const bScore = (best.rating || 0) * 20 + (best.sentiment || 0) * 0.6 + Math.log((best.reviews || 0) + 1) * 5;
      return score > bScore ? r : best;
    });
  }, [selectedRestaurants]);

  const cols = selectedRestaurants.length;
  const colTemplate = cols <= 1 ? '1fr' : `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ padding: '18px 26px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setIsSidebarOpen(p => !p)} style={{ width: 42, height: 42, borderRadius: '12px', border: '1px solid #dbe3ee', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <SidebarToggleIcon open={isSidebarOpen} />
            </button>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#2563eb', margin: '0 0 2px', lineHeight: 1.1 }}>Compare Restaurants</h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Side-by-side AI sentiment comparison - up to 4 restaurants</p>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 18px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 1px' }}>{compareList.length} <span style={{ color: '#94a3b8', fontWeight: '500' }}>/ 4 selected</span></p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{compareList.length === 0 ? 'Click Add Restaurant to begin' : compareList.length === 1 ? 'Add at least one more to compare' : `Comparing ${compareList.length} restaurants`}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {compareList.length > 0 && (
                <button onClick={() => setCompareList([])} style={{ background: '#fff', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                disabled={compareList.length >= 4}
                style={{ background: compareList.length >= 4 ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: compareList.length >= 4 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: compareList.length >= 4 ? 'none' : '0 6px 18px rgba(37,99,235,0.25)' }}
              >
                <span style={{ fontSize: 18 }}>+</span> Add Restaurant
              </button>
            </div>
          </div>

          {selectedRestaurants.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '20px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>No restaurants selected</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>
                Add restaurants from the Home page using the Compare button, or click below to pick from the list.
              </p>
              <button onClick={() => setShowAddModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.28)' }}>
                + Add Restaurant
              </button>
            </div>
          )}

          {selectedRestaurants.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>

              <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px 18px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Comparison</p>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px', lineHeight: 1.2 }}>Side-by-Side<br />Metrics</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Best in each category is highlighted in blue</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: '14px' }}>
                {selectedRestaurants.map(r => (
                  <div key={r.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,0.10)', border: winner && String(winner.id) === String(r.id) ? '2px solid #2563eb' : '1px solid #e2e8f0', position: 'relative' }}>
                    {winner && String(winner.id) === String(r.id) && (
                      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px' }}>Best Pick</div>
                    )}
                    <div style={{ position: 'relative', height: '120px', overflow: 'hidden', background: '#e5edf5' }}>
                      <img src={r.image} alt={r.name} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=60'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => handleRemove(String(r.id))} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</h3>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px' }}>{r.cuisine}</p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f8fafc', borderRadius: '8px', padding: '3px 8px' }}>
                        <span style={{ color: '#f97316', fontSize: 12 }}>*</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>{r.rating}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ 5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <MetricRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polygon points="12 2 15.09 10.26 24 10.35 17.77 16.88 20.16 25.07 12 19.77 3.84 25.07 6.23 16.88 0 10.35 8.91 10.26 12 2"/></svg>}
                label="Rating"
                restaurants={selectedRestaurants}
                getValue={r => `${(r.rating || 0).toFixed(1)} / 5`}
                valueColor={() => '#f97316'}
                isBest={r => selectedRestaurants.length > 1 && r.rating === Math.max(...selectedRestaurants.map(x => x.rating || 0))}
              />

              <MetricRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>}
                label="AI Sentiment"
                restaurants={selectedRestaurants}
                getValue={r => `${r.sentiment ?? 0}%`}
                valueColor={r => sentimentColor(r.sentiment ?? 0)}
                isBest={r => selectedRestaurants.length > 1 && (r.sentiment ?? 0) === Math.max(...selectedRestaurants.map(x => x.sentiment ?? 0))}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Review Split</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: '12px' }}>
                {selectedRestaurants.map(r => {
                  const split = getReviewSplit(r);
                  return (
                    <div key={r.id} style={{ padding: '16px 14px', borderRadius: '14px', border: '1.5px solid #dbeafe', background: 'linear-gradient(145deg, #f0f7ff 0%, #fff 100%)', boxShadow: '0 2px 10px rgba(37,99,235,0.07)' }}>
                      {/* Stacked bar */}
                      <div style={{ display: 'flex', height: '14px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ width: `${split.positive}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)', transition: 'width 0.4s ease' }} />
                        <div style={{ width: `${split.neutral}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', transition: 'width 0.4s ease' }} />
                        <div style={{ width: `${split.negative}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 0.4s ease' }} />
                      </div>
                      {/* Legend rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>Positive</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563eb' }}>{split.positive}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>Neutral</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>{split.neutral}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>Negative</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#dc2626' }}>{split.negative}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <MetricRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                label="Total Reviews"
                restaurants={selectedRestaurants}
                getValue={r => (r.reviews || 0).toLocaleString()}
                valueColor={() => '#0f172a'}
                isBest={r => selectedRestaurants.length > 1 && (r.reviews || 0) === Math.max(...selectedRestaurants.map(x => x.reviews || 0))}
              />

              <MetricRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                label="Price Range"
                restaurants={selectedRestaurants}
                getValue={r => r.priceRange || 'N/A'}
                valueColor={() => '#0f172a'}
                isBest={r => (r.priceRange || '').length > 0 && (r.priceRange || '').length === Math.min(...selectedRestaurants.map(x => (x.priceRange || '$$').length))}
              />

              <MetricRow
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                label="Cuisine"
                restaurants={selectedRestaurants}
                getValue={r => r.cuisine || '-'}
                valueColor={() => '#0f172a'}
              />

              {selectedRestaurants.some(r => typeof r.distance === 'number') && (
                <MetricRow
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>}
                  label="Distance"
                  restaurants={selectedRestaurants}
                  getValue={r => typeof r.distance === 'number' ? `${r.distance.toFixed(1)} km` : 'N/A'}
                  valueColor={() => '#2563eb'}
                  isBest={r => typeof r.distance === 'number' && selectedRestaurants.length > 1 && r.distance === Math.min(...selectedRestaurants.filter(x => typeof x.distance === 'number').map(x => x.distance))}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Specialties</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: '12px' }}>
                {selectedRestaurants.map(r => (
                  <div key={r.id} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {getSpecialties(r).map((s, i) => (
                      <span key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '500' }}>{s}</span>
                    ))}
                  </div>
                ))}
              </div>

            </div>
          )}

          {winner && (
            <div style={{ marginTop: '24px', padding: '20px 24px', background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)', borderRadius: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 28px rgba(37,99,235,0.28)' }}>
              <img src={winner.image} alt={winner.name} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=60'; }} style={{ width: 64, height: 64, borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.65)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Winner</p>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{winner.name}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>{(winner.rating || 0).toFixed(1)} stars - {winner.sentiment ?? '-'}% positive - {(winner.reviews || 0).toLocaleString()} reviews</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 2px' }}>{winner.sentiment ?? '-'}%</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>AI Sentiment</p>
              </div>
            </div>
          )}

        </div>
      </main>

      <AddRestaurantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(id) => { handleAddRestaurant(id); if (compareList.length >= 3) setShowAddModal(false); }}
        allRestaurants={readLS('ts_restaurantPool', [])}
        selectedIds={compareList}
      />
    </div>
  );
};

export default CompareDashboard;

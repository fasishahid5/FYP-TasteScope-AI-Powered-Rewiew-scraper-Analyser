import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { restaurants } from '../data/restaurants';
import { getStoredUser } from '../lib/auth';

// Search icon used inside the search bar and search button.
const SearchBarIcon = ({ color = '#94a3b8' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Filter icon for the filter button.
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

// ─── SENTIMENT HELPER ────────────────────────────────────────────────────────
// Returns label and colours based on the AI sentiment score (0–100).
// >= 80 = Positive (green), >= 60 = Neutral (yellow), below 60 = Negative (red).
const getSentiment = (score) => {
  if (score >= 80) return { label: 'Positive', textColor: '#15803d', bg: '#dcfce7', dot: '#22c55e' };
  if (score >= 60) return { label: 'Neutral',  textColor: '#b45309', bg: '#fef3c7', dot: '#f59e0b' };
  return               { label: 'Negative', textColor: '#dc2626', bg: '#fee2e2', dot: '#ef4444' };
};

// ─── MAP COORDINATE CONVERTER ────────────────────────────────────────────────
// Converts a restaurant's real-world lat/lng into x,y pixel position
// inside our 600×420 SVG that covers Lahore's bounding box.
const toMapXY = (lat, lng) => {
  // These bounds cover all 8 restaurant locations in Lahore.
  const minLat = 31.430, maxLat = 31.570;
  const minLng = 74.290, maxLng = 74.430;
  // Usable drawing area: 500×350px with 50px left/right + 35px top/bottom padding.
  const x = Math.round(((lng - minLng) / (maxLng - minLng)) * 500 + 50);
  const y = Math.round(((maxLat - lat) / (maxLat - minLat)) * 350 + 35);
  return { x, y };
};

// ─── MAP SVG COMPONENT ───────────────────────────────────────────────────────
// Draws a simplified city-style map with restaurants plotted as pins.
// Pins are blue normally, and turn the sentiment colour when hovered.
const MapView = ({ visibleRestaurants, hoveredPin, onPinHover }) => (
  <svg
    viewBox="0 0 600 420"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid slice"
    style={{ display: 'block' }}
  >
    {/* ── Background ────────────────────────────────────────────────── */}
    <rect width="600" height="420" fill="#e8edf3" />

    {/* ── Neighbourhood blocks (light grey areas) ───────────────────── */}
    <rect x="58"  y="48"  width="172" height="128" rx="4" fill="#dce4ee" />
    <rect x="268" y="58"  width="182" height="112" rx="4" fill="#dce4ee" />
    <rect x="98"  y="208" width="152" height="122" rx="4" fill="#dce4ee" />
    <rect x="308" y="198" width="202" height="152" rx="4" fill="#dce4ee" />
    <rect x="448" y="48"  width="132" height="102" rx="4" fill="#dce4ee" />
    <rect x="38"  y="298" width="102" height="92"  rx="4" fill="#dce4ee" />

    {/* ── Water / park feature ──────────────────────────────────────── */}
    <ellipse cx="188" cy="328" rx="66" ry="28" fill="#bed3e8" opacity="0.65" />

    {/* ── Major horizontal roads ────────────────────────────────────── */}
    <rect x="0" y="173" width="600" height="9" fill="#c9d4e0" />
    <rect x="0" y="283" width="600" height="9" fill="#c9d4e0" />
    <rect x="0" y="93"  width="600" height="5" fill="#cfdae7" />
    <rect x="0" y="353" width="600" height="5" fill="#cfdae7" />

    {/* ── Major vertical roads ──────────────────────────────────────── */}
    <rect x="143" y="0" width="9" height="420" fill="#c9d4e0" />
    <rect x="313" y="0" width="9" height="420" fill="#c9d4e0" />
    <rect x="473" y="0" width="5" height="420" fill="#cfdae7" />
    <rect x="63"  y="0" width="5" height="420" fill="#cfdae7" />

    {/* ── Diagonal canal road ───────────────────────────────────────── */}
    <path d="M0,370 Q150,300 300,225 Q430,175 600,145"
      stroke="#c9d4e0" strokeWidth="7" fill="none" />

    {/* ── Secondary streets ─────────────────────────────────────────── */}
    <line x1="0" y1="233" x2="600" y2="233" stroke="#d4dce8" strokeWidth="3" />
    <line x1="0" y1="133" x2="600" y2="133" stroke="#d4dce8" strokeWidth="3" />
    <line x1="213" y1="0" x2="213" y2="420" stroke="#d4dce8" strokeWidth="3" />
    <line x1="393" y1="0" x2="393" y2="420" stroke="#d4dce8" strokeWidth="3" />
    <line x1="533" y1="0" x2="533" y2="420" stroke="#d4dce8" strokeWidth="3" />

    {/* ── Road centre-line dashes (gives real-map feel) ─────────────── */}
    <line x1="0" y1="178" x2="600" y2="178"
      stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="10 7" />
    <line x1="148" y1="0" x2="148" y2="420"
      stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="10 7" />
    <line x1="318" y1="0" x2="318" y2="420"
      stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="10 7" />

    {/* ── Restaurant pins ───────────────────────────────────────────── */}
    {visibleRestaurants.map((r) => {
      const { x, y } = toMapXY(r.lat, r.lng);
      const s = getSentiment(r.sentiment);
      const hovered = hoveredPin === r.id;

      // Keep tooltip rect inside SVG bounds.
      const tw = 118;
      const tx = Math.min(Math.max(x - tw / 2, 4), 596 - tw);
      // Flip tooltip below the pin if pin is near the top edge.
      const ty = y < 72 ? y + 18 : y - 54;

      return (
        <g
          key={r.id}
          onMouseEnter={() => onPinHover(r.id)}
          onMouseLeave={() => onPinHover(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Soft shadow under pin */}
          <ellipse cx={x} cy={y + 13} rx={5} ry={2.5} fill="rgba(0,0,0,0.18)" />

          {/* Teardrop pin shape */}
          <path
            d={`M${x},${y + 11} C${x - 8},${y} ${x - 8},${y - 16} ${x},${y - 18} C${x + 8},${y - 16} ${x + 8},${y} ${x},${y + 11}Z`}
            fill={hovered ? s.dot : '#2563eb'}
            stroke={hovered ? s.textColor : '#1d4ed8'}
            strokeWidth="1"
          />

          {/* White inner dot on pin */}
          <circle cx={x} cy={y - 7} r="3.5" fill="rgba(255,255,255,0.92)" />

          {/* Tooltip shown on hover */}
          {hovered && (
            <g>
              <rect x={tx} y={ty} width={tw} height={32} rx="5" fill="rgba(15,23,42,0.93)" />
              <text
                x={tx + tw / 2} y={ty + 13}
                textAnchor="middle" fill="white"
                fontSize="10" fontFamily="Poppins, sans-serif" fontWeight="600"
              >
                {r.name.length > 17 ? r.name.slice(0, 15) + '…' : r.name}
              </text>
              <text
                x={tx + tw / 2} y={ty + 25}
                textAnchor="middle" fill={s.dot}
                fontSize="9" fontFamily="Poppins, sans-serif"
              >
                {r.sentiment}% {s.label}
              </text>
            </g>
          )}
        </g>
      );
    })}
  </svg>
);

// ─── RESTAURANT CARD ─────────────────────────────────────────────────────────
// Displays one restaurant with image, sentiment badge, rating, and compare button.
const RestaurantCard = ({ r, hovered, onHover, inCompare, onToggleCompare }) => {
  const s = getSentiment(r.sentiment);
  return (
    <div
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '286px',
        // Shadow gets stronger and border turns blue when hovered.
        boxShadow: hovered ? '0 16px 34px rgba(37,99,235,0.18)' : '0 2px 10px rgba(15,23,42,0.08)',
        border: `1px solid ${hovered ? '#93c5fd' : '#e2e8f0'}`,
        transition: 'box-shadow 0.22s ease, border-color 0.22s ease, transform 0.22s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
      }}
    >
      {/* Restaurant image with overlay elements */}
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

        {/* Sentiment badge (top-left of image) */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: s.dot, color: '#ffffff',
          borderRadius: '9999px', padding: '5px 11px',
          fontSize: '11px', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          {/* Coloured dot */}
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: s.dot, display: 'inline-block', flexShrink: 0,
          }} />
          {r.sentiment}% {s.label}
        </div>

        {/* Compare (+/✓) button (top-right of image) */}
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

      {/* Card info section */}
      <div style={{ padding: '10px 14px 11px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Name + star rating row */}
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

        {/* Cuisine type and price range */}
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 5px', lineHeight: 1.3 }}>
          {r.cuisine} - {r.priceRange}
        </p>

        {/* Location and review count row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '2px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
            {/* Location pin icon */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span style={{
              fontSize: '11px', color: '#64748b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {r.location.length > 24 ? r.location.slice(0, 22) + '…' : r.location}
            </span>
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

  // This controls whether the sidebar is visible or hidden.
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Which sidebar item is currently selected.
  const [activeNav, setActiveNav] = useState('home');

  // Text the user typed in the search bar.
  const [searchQuery, setSearchQuery] = useState('');

  // Currently selected sort option.
  const [sortBy, setSortBy] = useState('relevance');

  // The restaurant id whose pin is being hovered on the map or card.
  // Shared between the map and the cards so they highlight together.
  const [hoveredPin, setHoveredPin] = useState(null);

  // List of restaurant ids the user added to compare.
  const [compareList, setCompareList] = useState([]);

  // Filter and sort restaurants whenever searchQuery or sortBy changes.
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];

    // If the user typed something, keep only matching restaurants.
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }

    // Sort by the selected option.
    if (sortBy === 'rating')    list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'sentiment') list.sort((a, b) => b.sentiment - a.sentiment);
    if (sortBy === 'reviews')   list.sort((a, b) => b.reviews - a.reviews);

    return list;
  }, [searchQuery, sortBy]);

  // Add or remove a restaurant from the compare list.
  const toggleCompare = (id) => {
    setCompareList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
    // Full viewport layout — sidebar on left, main on right, nothing overflows.
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

            {/* Text input with search icon inside */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', padding: '0 14px',
            }}>
              <SearchBarIcon />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: '13px', color: '#1e293b',
                  fontFamily: "'Poppins', sans-serif",
                  padding: '11px 0', outline: 'none',
                }}
              />
            </div>

            {/* Blue search button */}
            <button style={{
              background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '10px',
              padding: '11px 20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              fontFamily: "'Poppins', sans-serif", flexShrink: 0,
            }}>
              <SearchBarIcon color="#fff" />
              Search
            </button>

            {/* Filter icon button */}
            <button style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', padding: '10px 12px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}>
              <FilterIcon />
            </button>
          </div>
        </header>

        {/* Body: Map on the left, restaurant list on the right */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, justifyContent: 'space-between' }}>

          {/* ── MAP SECTION ────────────────────────── */}
          <div style={{
            flex: '0 0 52%',
            borderRight: '1px solid #e2e8f0',
            background: '#eef2f7',
            position: 'relative',
            overflow: 'hidden',
            padding: '16px',
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '50%',
              minHeight: '280px',
              maxHeight: '340px',
              borderRadius: '28px',
              overflow: 'hidden',
              background: '#e5edf5',
              boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.12)',
            }}>
              {/* SVG map fills the shorter rounded map box */}
              <MapView
                visibleRestaurants={filteredRestaurants}
                hoveredPin={hoveredPin}
                onPinHover={setHoveredPin}
              />

              {/* AI Sentiment legend in the bottom-left corner of the map */}
              <div style={{
                position: 'absolute', bottom: '16px', left: '16px',
                background: 'rgba(255,255,255,0.97)',
                borderRadius: '14px', padding: '10px 14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                fontFamily: "'Poppins', sans-serif",
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

            {/* Count + sort bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px',
              background: '#ffffff', borderBottom: '1px solid #f1f5f9',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                <span style={{ color: '#2563eb', fontWeight: '700' }}>{filteredRestaurants.length}</span> restaurants found
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
              </select>
            </div>

            {/* Scrollable 2-column card grid */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '14px', display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: '12px',
              alignContent: 'start',
            }}>
              {filteredRestaurants.length === 0 ? (
                // Empty-state message when search matches nothing.
                <div style={{
                  gridColumn: '1 / -1', textAlign: 'center',
                  color: '#94a3b8', padding: '48px 0', fontSize: '14px',
                }}>
                  No restaurants found matching your search.
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

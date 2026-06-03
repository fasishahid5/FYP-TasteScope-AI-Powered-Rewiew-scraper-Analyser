import React, { useState } from 'react';
import Logo from './Logo';

const navBtnStyle = (isActive, isHovered) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  marginBottom: '4px',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  background: isActive ? '#2563eb' : isHovered ? '#eff6ff' : 'transparent',
  color: isActive ? '#ffffff' : isHovered ? '#1d4ed8' : '#64748b',
  fontSize: '14px',
  fontWeight: isActive ? 600 : 500,
  fontFamily: "'Poppins', sans-serif",
  transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
  textAlign: 'left',
  transform: isHovered && !isActive ? 'translateX(2px)' : 'translateX(0)',
});

const IconWrapper = ({ active, children }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '18px', height: '18px' }}>
    {React.cloneElement(children, { stroke: active ? '#fff' : '#64748b' })}
  </div>
);

const dashboardIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const restaurantIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 21V3" />
    <path d="M17 21V3" />
    <path d="M7 11h10" />
    <path d="M7 7h10" />
  </svg>
);

const analyticsIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19h16" />
    <path d="M8 14v5" />
    <path d="M12 10v9" />
    <path d="M16 6v13" />
  </svg>
);

const reviewsIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M7 8h10" />
    <path d="M7 12h7" />
  </svg>
);

const aiIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2h4" />
    <path d="M12 22v-4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const keywordsIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5h14" />
    <path d="M5 12h14" />
    <path d="M5 19h14" />
  </svg>
);

const competitorsIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="3" />
    <circle cx="17" cy="7" r="3" />
    <circle cx="12" cy="17" r="3" />
  </svg>
);

const reportsIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z" />
    <path d="M8 8h8" />
    <path d="M8 12h8" />
    <path d="M8 16h5" />
  </svg>
);

const profileIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const settingsIcon = (active) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const BusinessSidebarNav = ({ activeItem, onNavigate, isSidebarOpen }) => {
  const [hoveredNav, setHoveredNav] = useState(null);

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon },
    { id: 'restaurants', label: 'My Restaurants', icon: restaurantIcon },
    { id: 'analytics', label: 'Analytics', icon: analyticsIcon },
    { id: 'reviews', label: 'Reviews', icon: reviewsIcon },
    { id: 'ai-summary', label: 'AI Summary', icon: aiIcon },
    { id: 'keywords', label: 'Keywords', icon: keywordsIcon },
    { id: 'competitors', label: 'Competitors', icon: competitorsIcon },
    { id: 'reports', label: 'Reports', icon: reportsIcon },
  ];

  const bottomNav = [
    { id: 'profile', label: 'Profile', icon: profileIcon },
    { id: 'settings', label: 'Settings', icon: settingsIcon },
  ];

  const sidebarWidth = isSidebarOpen ? '264px' : '0px';

  return (
    <aside style={{
      width: sidebarWidth,
      minWidth: sidebarWidth,
      background: '#ffffff',
      borderRight: isSidebarOpen ? '1px solid #e2e8f0' : '1px solid transparent',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      zIndex: 10,
      overflow: 'hidden',
      transition: 'width 0.28s ease, min-width 0.28s ease, border-color 0.28s ease',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <div style={{
        width: '300px',
        minWidth: '300px',
        opacity: isSidebarOpen ? 1 : 0,
        pointerEvents: isSidebarOpen ? 'auto' : 'none',
        transition: 'opacity 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        <div style={{ padding: '20px 22px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <Logo size="small" />
        </div>

        <nav style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
          {mainNav.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              onMouseEnter={() => setHoveredNav(id)}
              onMouseLeave={() => setHoveredNav(null)}
              style={navBtnStyle(activeItem === id, hoveredNav === id)}
            >
              <IconWrapper active={activeItem === id}>{icon(activeItem === id)}</IconWrapper>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
          {bottomNav.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              onMouseEnter={() => setHoveredNav(id)}
              onMouseLeave={() => setHoveredNav(null)}
              style={navBtnStyle(activeItem === id, hoveredNav === id)}
            >
              <IconWrapper active={activeItem === id}>{icon(activeItem === id)}</IconWrapper>
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default BusinessSidebarNav;

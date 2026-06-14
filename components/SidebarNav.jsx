import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';

const HomeIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CompareIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const HistoryIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-.86-4.49" />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const SidebarToggleIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="9" y1="4" x2="9" y2="20" />
    {open ? <polyline points="14 9 11 12 14 15" /> : <polyline points="12 9 15 12 12 15" />}
  </svg>
);

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
  textDecoration: 'none',
  transform: isHovered && !isActive ? 'translateX(2px)' : 'translateX(0)',
});

const SidebarNav = ({ activeItem, onNavigate, isSidebarOpen }) => {
  const [hoveredNav, setHoveredNav] = useState(null);

  const mainNav = [
    { id: 'home', label: 'Home', Icon: HomeIcon },
    { id: 'search', label: 'Search', Icon: SearchIcon },
    { id: 'compare', label: 'Compare', Icon: CompareIcon },
    { id: 'history', label: 'History', Icon: HistoryIcon },
  ];

  const bottomNav = [
    { id: 'profile', label: 'Profile', Icon: ProfileIcon },
    { id: 'settings', label: 'Settings', Icon: SettingsIcon },
  ];

  const routeMap = {
    home: '/dashboard',
    search: '/search',
    compare: '/compare',
    history: '/history',
    profile: '/profile',
    settings: '/settings',
  };

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
    }}>
      <div style={{
        width: '264px',
        minWidth: '264px',
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
          {mainNav.map(({ id, label, Icon }) => (
            <NavLink
              key={id}
              to={routeMap[id] || '/'}
              end
              style={({ isActive }) => navBtnStyle(isActive, hoveredNav === id)}
              onMouseEnter={() => setHoveredNav(id)}
              onMouseLeave={() => setHoveredNav(null)}
              onClick={() => {
                if (typeof onNavigate === 'function') onNavigate(id);
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
          {bottomNav.map(({ id, label, Icon }) => (
            <NavLink
              key={id}
              to={routeMap[id] || '/'}
              end
              style={({ isActive }) => navBtnStyle(isActive, hoveredNav === id)}
              onMouseEnter={() => setHoveredNav(id)}
              onMouseLeave={() => setHoveredNav(null)}
              onClick={() => {
                if (typeof onNavigate === 'function') onNavigate(id);
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;

import React, { useMemo, useState } from 'react';
import { Home, Users, FileText, ShoppingBag, Star, BarChart3, MessageSquare, Settings, Bell, UserCircle, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { SidebarToggleIcon } from './SidebarNav';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin-dashboard', Icon: Home },
  { id: 'users', label: 'User Management', path: '/admin/users', Icon: Users },
  { id: 'requests', label: 'Business Owner Requests', path: '/admin/requests', Icon: FileText },
  { id: 'restaurants', label: 'Restaurant Management', path: '/admin/restaurants', Icon: ShoppingBag },
  { id: 'reviews', label: 'Reviews Management', path: '/admin/reviews', Icon: Star },
  { id: 'analytics', label: 'Platform Analytics', path: '/admin/analytics', Icon: BarChart3 },
  { id: 'feedback', label: 'Feedback Center', path: '/admin/feedback', Icon: MessageSquare },
  { id: 'settings', label: 'Settings', path: '/admin/settings', Icon: Settings },
];

const navButtonStyles = (active) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  marginBottom: '4px',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  background: active ? '#2563eb' : 'transparent',
  color: active ? '#ffffff' : '#334155',
  fontSize: '14px',
  fontWeight: active ? 600 : 500,
  fontFamily: "'Poppins', sans-serif",
  textAlign: 'left',
  transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
});

const AdminLayout = ({ pageTitle, pageDescription, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredNav, setHoveredNav] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeItem = useMemo(() => {
    const matched = navItems.find((item) => pathname.startsWith(item.path));
    return matched ? matched.id : 'dashboard';
  }, [pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <aside style={{ width: sidebarOpen ? '264px' : '0px', minWidth: sidebarOpen ? '264px' : '0px', background: '#ffffff', borderRight: '1px solid #e2e8f0', boxShadow: '2px 0 8px rgba(15, 23, 42, 0.08)', overflow: 'hidden', transition: 'width 0.28s ease, min-width 0.28s ease' }}>
        <div style={{ width: '264px', minWidth: '264px', opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none', transition: 'opacity 0.18s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '20px 22px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo size="small" />
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={{ width: '38px', height: '38px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
          </div>

          <nav style={{ flex: 1, padding: '18px 14px', overflowY: 'auto' }}>
            {navItems.map(({ id, label, path, Icon }) => {
              const active = activeItem === id;
              const hovered = hoveredNav === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(path)}
                  onMouseEnter={() => setHoveredNav(id)}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    ...navButtonStyles(active),
                    background: active ? '#2563eb' : hovered ? '#eff6ff' : 'transparent',
                    color: active ? '#ffffff' : hovered ? '#1d4ed8' : '#334155',
                  }}
                >
                  <Icon size={18} color={active ? '#ffffff' : hovered ? '#1d4ed8' : '#64748b'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '18px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#f8fafc', borderRadius: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                A
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 600 }}>Admin</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Platform owner</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ padding: '20px 26px 16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
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
                  flexShrink: 0,
                }}
              >
                <SidebarToggleIcon open={sidebarOpen} />
              </button>

              <div>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: 0, lineHeight: 1.05 }}>{pageTitle}</p>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '10px 0 0' }}>{pageDescription}</p>
              </div>
            </div>

            <div style={{ padding: '9px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Admin panel
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', padding: '0 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search admin actions or reports"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#1e293b',
                  padding: '11px 0',
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>

            <button style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Poppins', sans-serif",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search
            </button>

            <button style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

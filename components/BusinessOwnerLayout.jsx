import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessSidebarNav from './BusinessSidebarNav';
import { SidebarToggleIcon } from './SidebarNav';

const routeMap = {
  dashboard: '/business-dashboard',
  restaurants: '/my-restaurants',
  analytics: '/analytics',
  reviews: '/reviews',
  'ai-summary': '/ai-summary',
  keywords: '/keywords',
  competitors: '/competitors',
  reports: '/reports',
  profile: '/business-profile',
  settings: '/business-settings',
};

const BusinessOwnerLayout = ({ activeItem, pageTitle, pageDescription, children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNavigate = (id) => {
    const path = routeMap[id] || '/business-dashboard';
    navigate(path);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <BusinessSidebarNav activeItem={activeItem} onNavigate={handleNavigate} isSidebarOpen={sidebarOpen} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '26px 32px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>{pageTitle}</h1>
              <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '14px', maxWidth: '760px' }}>{pageDescription}</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Toggle sidebar"
            >
              <SidebarToggleIcon open={sidebarOpen} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default BusinessOwnerLayout;

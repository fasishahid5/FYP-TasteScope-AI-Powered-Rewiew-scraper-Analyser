import React, { useState } from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import ToggleRow from '../components/ToggleRow';

const BusinessSettingsPage = () => {
  const [theme, setTheme] = useState('Light');
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState({
    reviewAlerts: true,
    weeklySummary: true,
    marketingEmails: false,
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <BusinessOwnerLayout
      activeItem="settings"
      pageTitle="Business Settings"
      pageDescription="Configure theme, language, email notifications, and owner account settings."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Theme</h2>
            <p style={{ margin: '10px 0 20px', color: '#64748b', fontSize: '14px' }}>Choose how the owner dashboard appears.</p>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              style={{ width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc', color: '#0f172a', fontSize: '14px' }}
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System</option>
            </select>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Language</h2>
            <p style={{ margin: '10px 0 20px', color: '#64748b', fontSize: '14px' }}>Select your preferred dashboard language.</p>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              style={{ width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc', color: '#0f172a', fontSize: '14px' }}
            >
              <option>English</option>
              <option>Urdu</option>
              <option>Arabic</option>
            </select>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Email Notifications</h2>
          <p style={{ margin: '10px 0 20px', color: '#64748b', fontSize: '14px' }}>Enable alerts and summaries for your business performance.</p>
          <ToggleRow label="Review alert notifications" value={notifications.reviewAlerts} onChange={() => toggleNotification('reviewAlerts')} />
          <ToggleRow label="Weekly summary emails" value={notifications.weeklySummary} onChange={() => toggleNotification('weeklySummary')} />
          <ToggleRow label="Promotional emails" value={notifications.marketingEmails} onChange={() => toggleNotification('marketingEmails')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Account Settings</h2>
            <div style={{ marginTop: '16px', display: 'grid', gap: '14px' }}>
              {[
                { label: 'Change password', description: 'Update your owner login credentials.' },
                { label: 'Manage connected apps', description: 'Review API and partner access.' },
                { label: 'Two-factor authentication', description: 'Improve account security.' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '18px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{item.label}</p>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Quick actions</h2>
            <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
              <button type="button" style={{ width: '100%', borderRadius: '16px', border: '1px solid #2563eb', background: '#2563eb', color: '#ffffff', padding: '14px 16px', fontWeight: 700, cursor: 'pointer' }}>
                Save settings
              </button>
              <button type="button" style={{ width: '100%', borderRadius: '16px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', padding: '14px 16px', fontWeight: 700, cursor: 'pointer' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default BusinessSettingsPage;

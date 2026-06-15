import React from 'react';
import { Shield } from 'lucide-react';
import { API_BASE_URL, clearStoredAuth, getStoredToken } from '../lib/auth';
import { useSettings } from '../lib/SettingsContext';

const PrivacySecurityPanel = () => {
  const { locationEnabled, setLocationEnabled } = useSettings();
  const [clearingHistory, setClearingHistory] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  const handleToggleLocation = () => {
    setLocationEnabled(!locationEnabled);
  };

  const handleClearSearchHistory = async () => {
    if (clearingHistory) return;
    setClearingHistory(true);
    try {
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/search/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      await response.json().catch(() => null);
      if (!response.ok) throw new Error('Unable to clear search history');
    } catch (error) {
      console.warn('PrivacySecurityPanel clear history failed:', error);
    } finally {
      setClearingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    const confirmed = window.confirm('Delete account locally and sign out? This will clear your saved auth state.');
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      const token = getStoredToken();
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(() => null);
      clearStoredAuth();
      window.location.replace('/login');
    } catch (error) {
      console.warn('PrivacySecurityPanel delete account error:', error);
    } finally {
      setDeletingAccount(false);
    }
  };

  const rowWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderRadius: '24px',
    background: '#ffffff',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
  };

  const rowTextStyle = {
    minWidth: 0,
    paddingRight: '16px',
  };

  const rowTitleStyle = {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
  };

  const rowDescStyle = {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.6,
  };

  const actionButtonStyle = {
    padding: '10px 22px',
    borderRadius: '999px',
    border: 'none',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
    minWidth: '110px',
    transition: 'transform 0.18s ease, background 0.18s ease',
  };

  return (
    <div style={{ paddingTop: '16px' }}>
      <div style={{ marginTop: '0', borderRadius: '20px', background: '#ffffff', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Shield size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Privacy & Security</p>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>Manage location access and clear search history and delete account.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
          <div style={rowWrapperStyle}>
            <div style={rowTextStyle}>
              <p style={rowTitleStyle}>Location Access</p>
              <p style={rowDescStyle}>Enable location services for secure nearby restaurant discovery.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleLocation}
              style={{
                width: '80px',
                height: '35px',
                borderRadius: '999px',
                border: 'none',
                background: locationEnabled ? '#2563eb' : '#e2e8f0',
                padding: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: locationEnabled ? 'flex-end' : 'flex-start',
                cursor: 'pointer',
                transition: 'background 0.25s ease',
              }}
              aria-pressed={locationEnabled}
            >
              <span
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '999px',
                  background: '#ffffff',
                  boxShadow: '0 10px 20px rgba(15,23,42,0.12)',
                  transition: 'transform 250ms ease',
                }}
              />
            </button>
          </div>

          <div style={rowWrapperStyle}>
            <div style={rowTextStyle}>
              <p style={rowTitleStyle}>Clear Search History</p>
              <p style={rowDescStyle}>This will remove your recent search activity and clear your history.</p>
            </div>
            <button
              type="button"
              onClick={handleClearSearchHistory}
              disabled={clearingHistory}
              style={{
                ...actionButtonStyle,
                background: '#2563eb',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#2563eb'; }}
            >
              {clearingHistory ? 'Clearing...' : 'Clear'}
            </button>
          </div>

          <div style={rowWrapperStyle}>
            <div style={rowTextStyle}>
              <p style={rowTitleStyle}>Delete Account</p>
              <p style={rowDescStyle}>This will permanently delete your account, remove your data, and sign you out of the application.</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              style={{
                ...actionButtonStyle,
                background: '#ef4444',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#dc2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#ef4444'; }}
            >
              {deletingAccount ? 'Signing out…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySecurityPanel;
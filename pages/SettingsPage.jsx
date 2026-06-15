import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // 🚀 Premium Toast Alerts Connected
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Lock,
  Key,
  Mail,
  Download,
  Trash2,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import ToggleRow from '../components/ToggleRow';
import ActionRow from '../components/ActionRow';
import PrivacySecurityPanel from '../components/PrivacySecurityPanel';
import { clearStoredAuth, API_BASE_URL, getStoredToken, getStoredUser, setStoredAuth } from '../lib/auth';
import { useAppContext } from '../src/context/AppContext';
import { useSettings } from '../lib/SettingsContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('settings');
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { pushNotificationsEnabled, setPushNotificationsEnabled } = useAppContext();
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    deals: true,
    review: true,
  });
  const [privacy, setPrivacy] = useState({
    history: true,
    location: true,
    analytics: false,
    personalized: true,
  });

  // 🌓 Dynamic Dark Mode State Detector
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Core Solid Styles Sheet (Bina Tailwind layout crash kiye perfect spacing banata hai)
  const styles = {
    pageWrapper: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: isDark ? '#071127' : '#f8fafc',
      fontFamily: "'Poppins', sans-serif",
      transition: 'background 0.3s ease-out',
    },
    mainSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
    },
    header: {
      padding: '20px 26px 16px',
      background: isDark ? '#0f1724' : '#ffffff',
      borderBottom: isDark ? '1px solid #243249' : '1px solid #e2e8f0',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      transition: 'all 0.3s ease-out',
    },
    scrollContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '28px',
    },
    gridFramework: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr', 
      gap: '24px',
      marginBottom: '24px',
      alignItems: 'stretch',
    },
    card: {
      background: isDark ? '#0f1724' : '#ffffff',
      border: isDark ? '1px solid #243249' : '1px solid #e2e8f0',
      borderRadius: '24px',
      boxShadow: isDark ? 'none' : '0 18px 50px rgba(15,23,42,0.04)',
      padding: '32px',
      transition: 'all 0.3s ease-out',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    },
    iconCircle: (lightBg, darkBg, lightColor, darkColor) => ({
      width: '44px',
      height: '44px',
      borderRadius: '16px',
      background: isDark ? darkBg : lightBg,
      color: isDark ? darkColor : lightColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
    }),
    headingText: {
      margin: 0,
      fontSize: '16px',
      fontWeight: 700,
      color: isDark ? '#e6eef8' : '#0f172a',
    },
    subText: {
      margin: '4px 0 0',
      fontSize: '13px',
      color: isDark ? '#94a3b8' : '#64748b',
    }
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

  const handleLogout = () => {
    clearStoredAuth();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
  };

  const getAuthHeaders = () => {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleChangePassword = async () => {
    const user = getStoredUser();
    const email = user?.email || window.prompt('Enter your account email for password reset:');
    if (!email) return toast.error('Email is required');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'Failed');
      toast.success(data.msg || 'Password reset link sent to your mail!');
    } catch (err) {
      toast.error(err.message || 'Unable to request password reset');
    }
  };

  const handleChangeEmail = async () => {
    const newEmail = window.prompt('Enter new email address:');
    if (!newEmail) return;
    const ok = window.confirm('Changing email requires verification. Save locally and contact support?');
    if (ok) {
      const user = getStoredUser() || {};
      user.email = newEmail;
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Email synchronized locally.');
    }
  };

  const handleDownloadData = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.msg || 'Failed to fetch data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taste-scope-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('System log download initiated!');
    } catch (err) {
      toast.error(err.message || 'Unable to download logs data');
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Delete account locally and sign out? This does NOT remove your server account.');
    if (!confirmed) return;
    clearStoredAuth();
    navigate('/', { replace: true });
    toast.success('Workspace dynamic profile configuration erased.');
  };

  const handleToggle = (section, key) => {
    if (section === 'notifications') {
      if (key === 'push') {
        togglePushNotifications();
        return;
      }
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    } else if (section === 'privacy') {
      setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  useEffect(() => {
    setNotifications((prev) => ({ ...prev, push: pushNotificationsEnabled }));
  }, [pushNotificationsEnabled]);

  const togglePushNotifications = async () => {
    const newValue = !pushNotificationsEnabled;
    setNotifications((prev) => ({ ...prev, push: newValue }));
    setPushNotificationsEnabled(newValue);

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pushNotificationsEnabled: newValue }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.msg || 'Failed to save notification preference');
      }

      const user = getStoredUser();
      if (user) {
        localStorage.setItem('user', JSON.stringify({ ...user, pushNotificationsEnabled: newValue }));
      }
      if (typeof setStoredAuth === 'function') {
        // Keep auth persistence in sync if this helper is used elsewhere.
        setStoredAuth({ token: getStoredToken(), user: { ...user, pushNotificationsEnabled: newValue } });
      }
    } catch (err) {
      setNotifications((prev) => ({ ...prev, push: !newValue }));
      setPushNotificationsEnabled(!newValue);
      window.alert(err.message || 'Unable to update notification settings.');
    }
  };
  return (
    <div style={styles.pageWrapper}>
      <SidebarNav activeItem="settings" onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      <main style={styles.mainSection}>
        {/* HEADER AREA */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: isDark ? '1px solid #243249' : '1px solid #dbe3ee',
                background: isDark ? '#071127' : '#f8fafc',
                color: isDark ? '#94a3b8' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <SidebarToggleIcon open={isSidebarOpen} />
            </button>
            <div>
              <h1 style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: 800, color: isDark ? '#ffffff' : '#2563EB' }}>Settings</h1>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#475569' }}>Application Settings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              border: 'none',
              background: '#fef2f2',
              color: '#b91c1c',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(185,28,28,0.14)',
              transition: 'transform 0.18s ease, background 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#fef2f2'; }}
          >
            Sign out
          </button>
        </header>

        {/* SCROLL CONTAINER */}
        <div style={styles.scrollContainer}>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b' }}>Manage your account preferences and app configurations context layout.</p>
          
          <div style={styles.gridFramework}>
            
            {/* 1. APPEARANCE BOX (FIXED GRID INTERFACE) */}
            <section style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.iconCircle('#fdf2f8', '#4c0519', '#db2777', '#f43f5e')}>
                  <Sun size={20} />
                </div>
                <div>
                  <h2 style={styles.headingText}>Appearance</h2>
                  <p style={styles.subText}>Customize how the core framework view looks.</p>
                </div>
              </div>
              
              {/* Premium Box Dynamic Segment Buttons Group */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' }}>
                {[
                  { key: 'light', label: 'Light', icon: <Sun size={18} /> },
                  { key: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                  { key: 'system', label: 'System', icon: <Monitor size={18} /> },
                ].map((option) => {
                  const selected = theme === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setTheme(option.key)}
                      style={{
                        borderRadius: '18px',
                        border: selected ? '1px solid #3b82f6' : (isDark ? '1px solid #243249' : '1px solid #e2e8f0'),
                        background: selected ? (isDark ? '#243249' : '#e0f2fe') : (isDark ? '#071127' : '#ffffff'),
                        color: selected ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b'),
                        padding: '18px 14px',
                        display: 'flex',
                        flexDirection: 'column', 
                        gap: '10px',             
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            {/* 2. NOTIFICATIONS PREFERENCES VIEW BLOCK */}
            <section style={styles.card}>
              <div style={styles.sectionHeader}>
                <div style={styles.iconCircle('#eff6ff', '#172554', '#2563eb', '#3b82f6')}>
                  <Bell size={20} />
                </div>
                <div>
                  <h2 style={styles.headingText}>Notifications</h2>
                  <p style={styles.subText}>Manage notification preferences</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                <ToggleRow title="Push Notifications" desc="Receive push notifications on your device" checked={notifications.push} onChange={() => handleToggle('notifications', 'push')} />
                <ToggleRow title="Email Notifications" desc="Receive updates via email" checked={notifications.email} onChange={() => handleToggle('notifications', 'email')} />
                <ToggleRow title="Review Reminders" desc="Reminder to review restaurants you visited" checked={notifications.review} onChange={() => handleToggle('notifications', 'review')} />
              </div>
            </section>

            {/* 3. PRIVACY & SECURITY PANEL */}
            <div style={{ gridColumn: '1 / -1' }}>
              <PrivacySecurityPanel onAccountDeleted={() => navigate('/login', { replace: true })} />
            </div>

            {/* 5. OVERALL LOWER TECHNICAL SERVICE TICKET HELPDESK ROW */}
            <section style={{ ...styles.card, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <div style={styles.iconCircle('#f1f5f9', '#1e293b', '#475569', '#94a3b8')}>
                  <HelpCircle size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>Need Help?</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>Contact our support team for assistance.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = 'mailto:support@tastescope.example?subject=Support%20Request'; }}
                style={{
                  borderRadius: '16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '14px 24px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  minWidth: '170px',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)',
                }}
              >
                Contact Support
              </button>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

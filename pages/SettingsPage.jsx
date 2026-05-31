import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, Bell, Shield, Lock, Key, Mail, Download, Trash2, HelpCircle, ChevronDown } from 'lucide-react';
import SidebarNav from '../components/SidebarNav';
import ToggleRow from '../components/ToggleRow';
import ActionRow from '../components/ActionRow';
import { clearStoredAuth } from '../lib/auth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('settings');
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [notifications, setNotifications] = useState({ push: true, email: true, deals: true, review: true });
  const [privacy, setPrivacy] = useState({ history: true, location: true, analytics: false, personalized: true });

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
    navigate('/login', { replace: true });
  };

  const handleToggle = (section, key) => {
    if (section === 'notifications') {
      setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    } else if (section === 'privacy') {
      setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex">
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen />

      <main className="flex-1 overflow-hidden">
        <div className="h-full min-w-0 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
          <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e293b]">Settings</h1>
            <p className="text-sm text-[#64748b] mt-1">Manage your account preferences and app settings.</p>
          </div>
          <div>
            <button onClick={handleLogout} className="text-sm text-sky-600">Sign out</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[#fdf2f8] text-[#db2777] rounded-lg flex items-center justify-center text-lg">
                <Sun size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Appearance</h2>
                <p className="text-xs text-[#64748b]">Customize how the app looks.</p>
              </div>
            </div>

            <label className="block text-xs font-semibold mb-2 text-[#1e293b]">Theme</label>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <button
                onClick={() => setTheme('light')}
                className={`border rounded-lg p-3 flex flex-col items-center gap-2 text-xs transition-all ${theme === 'light' ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0284c7] font-semibold' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}
              >
                <Sun size={16} /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`border rounded-lg p-3 flex flex-col items-center gap-2 text-xs transition-all ${theme === 'dark' ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0284c7] font-semibold' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}
              >
                <Moon size={16} /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`border rounded-lg p-3 flex flex-col items-center gap-2 text-xs transition-all ${theme === 'system' ? 'border-[#0284c7] bg-[#e0f2fe] text-[#0284c7] font-semibold' : 'border-[#e2e8f0] bg-white text-[#64748b]'}`}
              >
                <Monitor size={16} /> System
              </button>
            </div>

            <label className="block text-xs font-semibold mb-2 text-[#1e293b]">Language</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="w-full p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm flex justify-between items-center text-left"
              >
                {language}
                <ChevronDown size={16} className="text-[#64748b]" />
              </button>
              {isLangOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-[#e2e8f0] mt-1 rounded-lg shadow-lg z-10 text-sm overflow-hidden">
                  {['English', 'Español', 'Français'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLanguage(lang);
                        setIsLangOpen(false);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-[#f1f5f9]"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[#eff6ff] text-[#2563eb] rounded-lg flex items-center justify-center text-lg">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Notifications</h2>
                <p className="text-xs text-[#64748b]">Manage notification preferences.</p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <ToggleRow title="Push Notifications" desc="Receive push notifications on your device" checked={notifications.push} onChange={() => handleToggle('notifications', 'push')} />
              <ToggleRow title="Email Notifications" desc="Receive updates via email" checked={notifications.email} onChange={() => handleToggle('notifications', 'email')} />
              <ToggleRow title="Deals & Offers" desc="Get notified about special deals and discounts" checked={notifications.deals} onChange={() => handleToggle('notifications', 'deals')} />
              <ToggleRow title="Review Reminders" desc="Reminder to review restaurants you visited" checked={notifications.review} onChange={() => handleToggle('notifications', 'review')} />
            </div>
          </section>

          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[#f0fdf4] text-[#16a34a] rounded-lg flex items-center justify-center text-lg">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Privacy & Security</h2>
                <p className="text-xs text-[#64748b]">Control your data and privacy.</p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <ToggleRow title="Save Browsing History" desc="Keep track of restaurants you view" checked={privacy.history} onChange={() => handleToggle('privacy', 'history')} />
              <ToggleRow title="Location Services" desc="Allow app to access your location" checked={privacy.location} onChange={() => handleToggle('privacy', 'location')} />
              <ToggleRow title="Usage Analytics" desc="Help us improve by sharing anonymous data" checked={privacy.analytics} onChange={() => handleToggle('privacy', 'analytics')} />
              <ToggleRow title="Personalized Recommendations" desc="Get restaurant suggestions based on your preferences" checked={privacy.personalized} onChange={() => handleToggle('privacy', 'personalized')} />
            </div>
          </section>

          <section className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-[#fffbeb] text-[#d97706] rounded-lg flex items-center justify-center text-lg">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Account</h2>
                <p className="text-xs text-[#64748b]">Manage your account settings.</p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <ActionRow icon={<Key size={16} />} title="Change Password" desc="Update your password" onClick={() => alert('Change Password route logic')} />
              <ActionRow icon={<Mail size={16} />} title="Change Email" desc="Update your email address" onClick={() => alert('Change Email route logic')} />
              <ActionRow icon={<Download size={16} />} title="Download My Data" desc="Get a copy of your data" onClick={() => alert('Downloading initiated')} />
              <ActionRow icon={<Trash2 size={16} />} title="Delete Account" desc="Permanently delete your account" isDelete onClick={() => confirm('Are you sure you want to permanently delete your account?')} />
            </div>
          </section>
        </div>

        <footer className="mt-6 bg-white border border-[#e2e8f0] rounded-xl p-5 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#f1f5f9] text-[#475569] rounded-lg flex items-center justify-center text-lg">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Need Help?</h3>
              <p className="text-xs text-[#64748b] mt-0.5">Contact our support team for assistance with your account or app settings.</p>
            </div>
          </div>
          <button onClick={() => alert('Redirecting to Support Channel...')} className="rounded-lg bg-[#0284c7] px-4 py-2 text-sm font-semibold text-white">Contact Support</button>
        </footer>
      </div>
    </main>
  </div>
  );
}

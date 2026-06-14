import React, { useEffect, useState } from 'react';
import { useAppContext } from '../src/context/AppContext';
import { API_BASE_URL, getStoredToken } from '../lib/auth';

const TYPE_STYLES = {
  ai_complete: { emoji: '✨', border: 'border-indigo-100', bg: 'bg-indigo-50/40', iconBg: 'bg-indigo-100', iconText: 'text-indigo-700' },
  trend_drop: { emoji: '🔥', border: 'border-amber-100', bg: 'bg-amber-50/40', iconBg: 'bg-amber-100', iconText: 'text-amber-700' },
  milestone: { emoji: '🏅', border: 'border-indigo-100', bg: 'bg-indigo-50/40', iconBg: 'bg-indigo-100', iconText: 'text-indigo-700' },
  system_log: { emoji: '⚙️', border: 'border-slate-100', bg: 'bg-slate-50/40', iconBg: 'bg-slate-100', iconText: 'text-slate-700' },
};

const NotificationSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-gray-200" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 w-1/2 rounded-full bg-gray-200" />
        <div className="h-3 w-3/4 rounded-full bg-gray-200" />
      </div>
    </div>
  </div>
);

const NotificationsDrawer = ({ isOpen, onClose }) => {
  const { notifications, setNotifications } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(Array.isArray(notifications) ? notifications : []);

  useEffect(() => {
    setLocalNotifications(Array.isArray(notifications) ? notifications : []);
  }, [notifications]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let active = true;
    const token = getStoredToken();

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const tokenToUse = getStoredToken?.() || localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
        };
        if (tokenToUse) {
          headers.Authorization = `Bearer ${tokenToUse}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          method: 'GET',
          headers,
        });
        if (!response.ok) {
          throw new Error(`Failed to load notifications (${response.status})`);
        }
        const data = await response.json();
        const items = Array.isArray(data) ? data : Array.isArray(data.notifications) ? data.notifications : [];
        if (!active) return;
        setNotifications(items);
        setLocalNotifications(items);
      } catch (error) {
        console.error('NotificationsDrawer: load failed', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadNotifications();
    return () => {
      active = false;
    };
  }, [isOpen, setNotifications]);

  const handleMarkRead = async (notificationId) => {
    if (!notificationId) return;

    const updatedNotifications = localNotifications.map((item) => {
      if (String(item.id || item._id) === String(notificationId)) {
        return { ...item, isRead: true };
      }
      return item;
    });

    setLocalNotifications(updatedNotifications);
    setNotifications(updatedNotifications);

    try {
      const tokenToUse = getStoredToken?.() || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (tokenToUse) {
        headers.Authorization = `Bearer ${tokenToUse}`;
      }

      await fetch(`${API_BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: 'PUT',
        headers,
      });
    } catch (error) {
      console.error('NotificationsDrawer: mark read failed', error);
    }
  };

  const visibleNotifications = Array.isArray(localNotifications) ? localNotifications : [];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 z-50 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white shadow-[0_32px_120px_rgba(15,23,42,0.12)] z-50 flex flex-col transition-transform duration-300 border-l border-gray-100 sm:rounded-l-[36px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="bg-slate-50/70 border-b border-gray-100 px-6 py-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Notifications</p>
                <h2 className="mt-3 text-lg font-bold text-gray-800">Activity feed</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition duration-200 hover:bg-red-50 hover:text-red-600"
                aria-label="Close notifications drawer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {isLoading ? (
              <div className="space-y-4">
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </div>
            ) : (
              <div className="flex h-full flex-col">
                {visibleNotifications.length === 0 ? (
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 text-4xl">📭</div>
                    <p className="font-semibold text-gray-700 text-sm">Your feed is all caught up</p>
                    <p className="mt-3 text-xs text-gray-400 max-w-[280px] leading-relaxed">
                      Real-time AI scraper completions, user milestones, and system metrics updates will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleNotifications.map((notification) => {
                      const notificationId = notification.id || notification._id;
                      const style = TYPE_STYLES[notification.type] || {
                        emoji: '🔔',
                        border: 'border-gray-100',
                        bg: 'bg-white',
                        iconBg: 'bg-slate-100',
                        iconText: 'text-slate-700',
                      };
                      const createdAt = notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '';
                      const isUnread = !notification.isRead;
                      return (
                        <button
                          key={notificationId}
                          type="button"
                          onClick={() => handleMarkRead(notificationId)}
                          className={`w-full rounded-xl border p-4 transition-all duration-200 group relative text-left ${isUnread ? 'border-indigo-100/70 bg-indigo-50/20' : 'border-gray-100 bg-white opacity-75'} hover:shadow-xs`}
                        >
                          <div className="absolute right-4 top-4">
                            {isUnread && (
                              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500 shadow-[0_0_0_8px_rgba(79,70,229,0.08)]" />
                            )}
                          </div>
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 border rounded-lg flex items-center justify-center text-base font-medium ${style.iconBg} ${style.iconText}`}>
                              {style.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <p className="text-sm font-bold text-gray-800">{notification.title || 'Update available'}</p>
                                {!notification.isRead && (
                                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">Unread</span>
                                )}
                              </div>
                              <p className="mt-2 text-xs text-gray-600 leading-relaxed font-medium">
                                {notification.message || notification.description || 'Tap to mark read and sync the latest update.'}
                              </p>
                              {createdAt && <p className="pt-1 text-[10px] text-gray-400 font-semibold">{createdAt}</p>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default NotificationsDrawer;

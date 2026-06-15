import React from 'react';
import { useAppContext } from '../src/context/AppContext';

const emojiForType = (type) => {
  if (!type) return '🔔';
  if (String(type) === 'ai_complete') return '✨';
  if (String(type) === 'milestone') return '🏅';
  return '🔔';
};

const typeStyles = {
  ai_complete: { accentColor: '#3b82f6' },
  milestone: { accentColor: '#3b82f6' },
  default: { accentColor: '#3b82f6' },
};

const ToastContainer = () => {
  const { toasts, setToasts } = useAppContext();

  if (!Array.isArray(toasts)) return null;

  return (
    <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-4 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        const st = typeStyles[t.type] || typeStyles.default;
        const accent = st.accentColor;
        const emoji = emojiForType(t.type);
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            style={{ borderLeft: `6px solid ${accent}` }}
            className="pointer-events-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-7 flex items-start gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div style={{
              background: `${accent}22`,
              color: accent,
              minWidth: 48,
              minHeight: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              fontSize: 22,
              boxShadow: `0 0 0 4px ${accent}15`,
            }}>
              {emoji}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-slate-900">{t.title}</div>
              <div className="text-sm text-slate-600 mt-1">{t.message}</div>
              {t.action && (
                <div className="mt-3">
                  <button
                    onClick={() => { try { t.action(); } catch (e) { console.warn(e); } }}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    {t.actionLabel || 'View details'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-start">
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                style={{ background: `${accent}14`, borderRadius: 10, padding: '8px 10px' }}
                className="ml-2 text-slate-600 hover:text-slate-900"
                aria-label="close"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;

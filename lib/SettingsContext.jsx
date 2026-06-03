import React, { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext({
  theme: 'system',
  setTheme: () => {},
  language: 'English',
  setLanguage: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'English');

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('language', language); } catch (e) {}
  }, [language]);

  // Apply theme to document element
  useEffect(() => {
    const el = document.documentElement;
    const apply = (t) => {
      if (t === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) el.classList.add('dark'); else el.classList.remove('dark');
      } else if (t === 'dark') {
        el.classList.add('dark');
      } else {
        el.classList.remove('dark');
      }
    };

    apply(theme);

    // Listen for system changes when using 'system'
    let mq;
    if (window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => { if (theme === 'system') apply('system'); };
      try { mq.addEventListener('change', onChange); } catch (err) { mq.addListener(onChange); }
      return () => {
        try { mq.removeEventListener('change', onChange); } catch (err) { mq.removeListener(onChange); }
      };
    }
    return undefined;
  }, [theme]);

  // Apply language to document
  useEffect(() => {
    const langMap = {
      English: 'en',
      Español: 'es',
      Français: 'fr',
      हिंदी: 'hi',
      中文: 'zh',
      العربية: 'ar',
      Português: 'pt',
      Русский: 'ru',
      日本語: 'ja',
    };
    const code = langMap[language] || 'en';
    try {
      document.documentElement.lang = code;
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    } catch (e) {}
  }, [language]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

export default SettingsContext;

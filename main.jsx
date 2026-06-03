import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SettingsProvider } from './lib/SettingsContext';

// This creates and renders the React app in the root element.
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode helps catch common React issues in development.
  <React.StrictMode>
    {/* BrowserRouter enables page routing in the app. */}
    <BrowserRouter>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);

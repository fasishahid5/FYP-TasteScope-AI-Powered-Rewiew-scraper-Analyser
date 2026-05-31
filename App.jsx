import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TasteScopeLanding from './pages/TasteScopeLanding';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmail from './pages/VerifyEmail';
import CustomerDashboard from './pages/CustomerDashboard';
import SearchDashboard from './pages/SearchDashboard';
import CompareDashboard from './pages/CompareDashboard';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import BusinessDashboard from './pages/BusinessDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SettingsPage from './pages/SettingsPage';

const App = () => {
  // This hook is used for page navigation.
  const navigate = useNavigate();

  // These helpers keep route navigation easy to read.
  const goToHome = () => navigate('/');
  const goToLogin = () => navigate('/login');
  const goToSignUp = () => navigate('/signup');
  const goToForgotPassword = () => navigate('/forgot-password');

  return (
    // This block defines all app routes.
    <Routes>
      <Route
        path="/"
        element={(
          <TasteScopeLanding
            onLoginClick={goToLogin}
            onSignUpClick={goToSignUp}
          />
        )}
      />
      <Route
        path="/login"
        element={(
          <LoginPage
            onSignUpClick={goToSignUp}
            onForgotPasswordClick={goToForgotPassword}
            onBackClick={goToHome}
          />
        )}
      />
      <Route
        path="/signup"
        element={(
          <SignUpPage
            onLoginClick={goToLogin}
            onBackClick={goToHome}
          />
        )}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage onBackClick={goToLogin} />}
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage onBackClick={goToLogin} />}
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/dashboard" element={<CustomerDashboard />} />
      <Route path="/search" element={<SearchDashboard />} />
      <Route path="/compare" element={<CompareDashboard />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/business-dashboard" element={<BusinessDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

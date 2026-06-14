import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ToastContainer from './components/ToastContainer';

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
import MyRestaurants from './pages/MyRestaurants';
import AnalyticsPage from './pages/AnalyticsPage';
import ReviewsPage from './pages/ReviewsPage';
import AISummary from './pages/AISummary';
import KeywordsPage from './pages/KeywordsPage';
import CompetitorsPage from './pages/CompetitorsPage';
import ReportsPage from './pages/ReportsPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import BusinessSettingsPage from './pages/BusinessSettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminFeedback from './pages/AdminFeedback';
import AdminSettings from './pages/AdminSettings';
import UserManagement from './pages/UserManagement';
import BusinessOwnerRequests from './pages/BusinessOwnerRequests';
import RestaurantManagement from './pages/RestaurantManagement';
import ReviewsManagement from './pages/ReviewsManagement';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { getStoredUser, normalizeRole } from './lib/auth';

const RedirectOwner = ({ to, children }) => {
  const user = getStoredUser();
  const role = normalizeRole(user?.role);
  return role === 'owner' ? <Navigate to={to} replace /> : children;
};

const App = () => {
  // This hook is used for page navigation.
  const navigate = useNavigate();

  // These helpers keep route navigation easy to read.
  const goToHome = () => navigate('/');
  const goToLogin = () => navigate('/login');
  const goToSignUp = () => navigate('/signup');
  const goToForgotPassword = () => navigate('/forgot-password');

  return (
    <>
      {/* 🚀 Toast container for stacked animated toasts */}
      <ToastContainer />

      {/* This block defines all app routes. */}
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
        <Route path="/profile" element={(
          <RedirectOwner to="/business-profile">
            <ProfilePage />
          </RedirectOwner>
        )} />
        <Route path="/settings" element={(
          <RedirectOwner to="/business-settings">
            <SettingsPage />
          </RedirectOwner>
        )} />
        <Route path="/history" element={<HistoryPage />} />
        <Route
          path="/business-dashboard"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <BusinessDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/my-restaurants"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <MyRestaurants />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/analytics"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <AnalyticsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/reviews"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <ReviewsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/ai-summary"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <AISummary />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/keywords"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <KeywordsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/competitors"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <CompetitorsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/reports"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <ReportsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/business-profile"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <BusinessProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/business-settings"
          element={(
            <ProtectedRoute roles={[ 'owner' ]}>
              <BusinessSettingsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin-dashboard"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <AdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <UserManagement />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/requests"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <BusinessOwnerRequests />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/restaurants"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <RestaurantManagement />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/reviews"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <ReviewsManagement />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/analytics"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <AdminAnalytics />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/feedback"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <AdminFeedback />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/settings"
          element={(
            <ProtectedRoute roles={[ 'admin' ]}>
              <AdminSettings />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;

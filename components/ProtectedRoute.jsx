import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  clearStoredAuth,
  fetchMe,
  getDashboardPathForRole,
  getStoredToken,
  getStoredUser,
  normalizeRole,
  setStoredAuth,
} from '../lib/auth';

const ProtectedRoute = ({ children, roles }) => {
  // This gives access to current location for redirect handling.
  const location = useLocation();
  // This gets auth token from local storage.
  const token = getStoredToken();

  // This stores logged-in user and loading state.
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(token) && !user);

  // This fetches user profile when token exists but user data is missing.
  useEffect(() => {
    let isMounted = true;

    const loadMe = async () => {
      if (!token || user) return;
      try {
        const me = await fetchMe(token);
        if (!isMounted) return;
        setStoredAuth({ token, user: me });
        setUser(me);
      } catch (err) {
        if (!isMounted) return;
        clearStoredAuth();
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMe();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // This redirects to login when token is missing.
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // This waits until profile fetch completes.
  if (loading) {
    return null;
  }

  // This checks if current user role is allowed for this route.
  if (Array.isArray(roles) && roles.length > 0) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    const normalizedRole = normalizeRole(user.role);
    if (!roles.includes(normalizedRole)) {
      return <Navigate to={getDashboardPathForRole(normalizedRole)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

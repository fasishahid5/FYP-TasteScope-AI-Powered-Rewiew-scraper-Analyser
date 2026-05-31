// This is the base URL for all API calls.
// It reads from the .env file (VITE_API_URL). If not set, it defaults to localhost.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// This function converts any role value into one of our 3 known roles:
// 'customer', 'owner', or 'admin'.
// It handles old/alternate role names so the rest of the app stays simple.
export const normalizeRole = (value) => {
  // If no role given, treat them as a regular customer.
  if (!value) return 'customer';

  // Convert to lowercase so 'Admin' and 'admin' both work.
  const role = String(value).toLowerCase();

  // Old name 'analyst' maps to customer.
  if (role === 'analyst') return 'customer';

  // Old name 'business_owner' maps to owner.
  if (role === 'business_owner') return 'owner';

  // These 3 roles are valid as-is.
  if (role === 'customer' || role === 'owner' || role === 'admin') return role;

  // Anything else defaults to customer.
  return 'customer';
};

// This function returns the correct page URL based on user role.
// After login, we redirect the user to their personal dashboard.
export const getDashboardPathForRole = (role) => {
  // First, make sure the role is in our standard format.
  const normalized = normalizeRole(role);

  if (normalized === 'admin') return '/admin-dashboard';
  if (normalized === 'owner') return '/business-dashboard';

  // Default: regular customer goes to /dashboard.
  return '/dashboard';
};

// This reads the saved JWT token from the browser's localStorage.
// Returns null if not logged in.
export const getStoredToken = () => localStorage.getItem('token');

// This reads the saved user object from localStorage and converts it from
// text (JSON string) back to a JavaScript object.
export const getStoredUser = () => {
  const raw = localStorage.getItem('user');

  // If nothing is saved, return null (no user logged in).
  if (!raw) return null;

  try {
    // JSON.parse converts the stored text back into an object.
    return JSON.parse(raw);
  } catch {
    // If the stored text is broken/invalid, return null safely.
    return null;
  }
};

// This saves the token and user info to localStorage after a successful login.
// Both are optional — you can save just the token, just the user, or both.
export const setStoredAuth = ({ token, user }) => {
  // Only save if a value was actually provided.
  if (token) localStorage.setItem('token', token);

  // JSON.stringify converts the user object to a text string so it can be stored.
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

// This removes all auth info from localStorage — used when the user logs out.
export const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// This calls the backend to get the current logged-in user's profile.
// It sends the JWT token in the request header so the server knows who is asking.
export const fetchMe = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    // The Authorization header is how we send our token to the server.
    headers: { Authorization: `Bearer ${token}` },
  });

  // Try to read the response body as JSON. If that fails, use an empty object.
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If the server returned an error, throw it so the caller can handle it.
    const msg = data?.msg || 'Unable to fetch profile';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  // Return just the user object from the response.
  return data.user;
};


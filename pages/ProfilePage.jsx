import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { useRestaurants } from '../lib/useRestaurants';
import worldCountries from 'world-countries';
import { Country, City } from 'country-state-city';
import {
  API_BASE_URL,
  clearStoredAuth,
  getDashboardPathForRole,
  getStoredToken,
  getStoredUser,
  normalizeRole,
  setStoredAuth,
} from '../lib/auth';
import { removeFromFavorites } from '../lib/unifiedHistoryService';
import { useAppContext } from '../src/context/AppContext';
import NotificationsDrawer from '../components/NotificationsDrawer';

const countryCodeToFlag = (isoCode = '') => {
  if (!isoCode || typeof isoCode !== 'string') return '🏳️';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const MIN_BIO_LENGTH = 20;

// Loading Skeleton Components
const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '8px' }) => (
  <div style={{
    width, height, borderRadius, background: '#e2e8f0', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }} />
);

const SkeletonStats = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px',
        display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
      }}>
        <div style={{ fontSize: '26px', opacity: 0.45 }}>⏳</div>
        <div style={{ flex: 1 }}>
          <SkeletonBox width="70px" height="14px" />
          <SkeletonBox width="84px" height="24px" style={{ marginTop: '10px' }} />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonFavorites = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <SkeletonBox width="100%" height="100px" borderRadius="0" />
        <div style={{ padding: '12px' }}>
          <SkeletonBox width="80%" height="14px" />
          <SkeletonBox width="60%" height="12px" style={{ marginTop: '8px' }} />
        </div>
      </div>
    ))}
  </div>
);

const PACKAGE_COUNTRY_OPTIONS = Country.getAllCountries()
  .map((country) => ({
    value: country.isoCode,
    label: country.name,
    isoCode: country.isoCode,
    flag: countryCodeToFlag(country.isoCode),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const PHONE_CODE_OPTIONS = worldCountries.flatMap((country) => {
  const name = country?.name?.common || '';
  const iso2 = String(country?.cca2 || '').toUpperCase();
  const dialRoot = String(country?.idd?.root || '').trim();
  const dialSuffixes = Array.isArray(country?.idd?.suffixes) ? country.idd.suffixes.filter(Boolean) : [];
  const dialCodes = dialRoot
    ? dialSuffixes
        .map((suffix) => `${dialRoot}${suffix || ''}`.replace(/\s+/g, '').trim())
        .filter(Boolean)
    : [];
  return dialCodes.map((dialCode) => ({
    iso2,
    countryName: name,
    flag: countryCodeToFlag(iso2),
    dialCode,
  }));
}).sort((a, b) => a.dialCode.localeCompare(b.dialCode) || a.countryName.localeCompare(b.countryName));

const splitPhoneParts = (phoneValue = '') => {
  const raw = String(phoneValue).trim();
  if (!raw) return { phoneCode: '+92', phoneNumber: '' };
  const matched = raw.match(/^(\+\d{1,4})\s*(.*)$/);
  if (!matched) return { phoneCode: '+92', phoneNumber: raw };
  return { phoneCode: matched[1] || '+92', phoneNumber: (matched[2] || '').trim() };
};

const createProfileForm = (user = {}) => ({ ...splitPhoneParts(user.phone), firstName: user.firstName || '', lastName: user.lastName || '', bio: user.bio || '', city: user.city || '', country: user.country || '', countryCode: user.countryCode || '' });
const formatJoinDate = (dateValue) => {
  if (!dateValue) return 'Joined March 2024';
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return 'Joined March 2024';
  return `Joined ${parsedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
};

const getBadgeDetails = (visitCount = 0) => {
  if (visitCount >= 25) {
    return {
      title: 'Taste Master',
      subtitle: 'Visited 25 restaurants',
      level: 25,
    };
  }
  if (visitCount >= 13) {
    return {
      title: 'Food Explorer',
      subtitle: "You unlocked the 'Food Explorer' badge after visiting 13 restaurants.",
      level: 13,
    };
  }
  if (visitCount >= 5) {
    return {
      title: 'Rising Reviewer',
      subtitle: 'Visited 5 restaurants',
      level: 5,
    };
  }
  return {
    title: 'Keep Going',
    subtitle: 'Visit 5 restaurants to earn your first badge',
    level: 0,
  };
};

// Built-in cover options
const BUILTIN_COVERS = [
  { id: 'fast-food', name: 'Fast Food', imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=800&fit=crop&q=80' },
  // updated: richer Desi / South-Asian food imagery
  { id: 'desi', name: 'Desi Flavors', imageUrl: 'https://plus.unsplash.com/premium_photo-1728412897938-d70e9c5becd7?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZGVzaSUyMGZvb2RzfGVufDB8fDB8fHww' },
  { id: 'cafe', name: 'Cafe Vibes', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=800&fit=crop&q=80' },
  // updated: dessert image to a clear dessert photo
  { id: 'sweet', name: 'Dessert Mood', imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&h=800&fit=crop&q=80' },
  // updated: street food that shows vibrant stalls / flatlay
  { id: 'street-food', name: 'Street Food', imageUrl: 'https://images.unsplash.com/photo-1543353071-087092ec393a?w=1200&h=800&fit=crop&q=80' },
  // updated: BBQ / grill close-up
  { id: 'grill', name: 'BBQ Grill', imageUrl: 'https://plus.unsplash.com/premium_photo-1693221705527-d46b2477f5cd?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmJxJTIwZ3JpbGx8ZW58MHx8MHx8fDA%3D' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser() || {};
  const [user, setUser] = useState(storedUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCoverOptionsOpen, setIsCoverOptionsOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(() => createProfileForm(storedUser));
  const [countryOptions, setCountryOptions] = useState(PACKAGE_COUNTRY_OPTIONS);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, error: '', success: '' });
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || null);
  const [coverPreview, setCoverPreview] = useState(user.coverUrl || null);
  const {
    notifications,
    setNotifications,
    globalLoading,
    setGlobalLoading,
    globalMetricsLoading,
    setGlobalMetricsLoading,
    globalProfileData,
    refreshGlobalHistoryData,
    toggleGlobalFavorite,
  } = useAppContext();
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0;
  const [isLoading, setIsLoading] = useState(!globalProfileData?.stats);
  const [removingFavoriteId, setRemovingFavoriteId] = useState(null);
  const isMetricsLoading = globalMetricsLoading;
  const { restaurants: restaurantsData = [] } = useRestaurants();
  const showProfileSkeleton = isLoading || isMetricsLoading;
  const photoInputRef = useRef(null);

  // Direct bindings to global context (no local state copies, true reactivity)
  const profileStats = globalProfileData?.stats || { visits: 0, comparisons: 0, searches: 0 };
  const badgeDetails = getBadgeDetails(profileStats.visits);
  const favoritesCount = globalProfileData?.favoritesCount || 0;
  const favoriteRestaurants = Array.isArray(globalProfileData?.favoriteRestaurants) ? globalProfileData.favoriteRestaurants : [];

  // Update loading state when globalProfileData.stats is actually available
  useEffect(() => {
    if (globalProfileData?.stats) {
      setIsLoading(false);
    }
  }, [globalProfileData?.stats]);

  // Fetch user profile from backend on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      const token = getStoredToken();
      if (!token) {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const profile = data.user;
            const countryMatch = PACKAGE_COUNTRY_OPTIONS.find(
              (country) => country.value === profile.countryCode || country.label === profile.country
            );
            const nextProfileForm = createProfileForm({
              ...profile,
              countryCode: profile.countryCode || countryMatch?.value || '',
            });

            setUser(profile);
            setAvatarPreview(profile.avatarUrl || null);
            setCoverPreview(profile.coverUrl || null);
            setProfileForm(nextProfileForm);
            setStoredAuth({ token, user: profile });
          }
        } else {
          console.warn('Profile fetch failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  // Load profile metrics (history/favorites/stats) from context
  useEffect(() => {
    let active = true;

    const loadProfileMetrics = async () => {
      setGlobalMetricsLoading(true);
      try {
        await refreshGlobalHistoryData();
        // Context will auto-update from refreshGlobalHistoryData via AppContext logic
        if (!active) return;
      } catch (err) {
        console.error('Error loading profile metrics:', err);
      } finally {
        if (!active) return;
        setGlobalMetricsLoading(false);
        setIsLoading(false);
      }
    };

    if (!globalProfileData?.stats) {
      loadProfileMetrics();
    } else {
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [globalProfileData?.stats, setGlobalMetricsLoading]);

  const handleRemoveFavorite = async (restaurantId) => {
    const normalizedId = String(restaurantId || '').trim();
    if (!normalizedId || removingFavoriteId) return;
    setRemovingFavoriteId(normalizedId);
    try {
      const result = await removeFromFavorites(normalizedId);
      if (result) {
        // Context will auto-update via toggleGlobalFavorite
        toggleGlobalFavorite(normalizedId, null, false);
        await refreshGlobalHistoryData();
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setRemovingFavoriteId(null);
    }
  };

  const loadCityOptions = useCallback(async (countryCode, inputValue = '') => {
    if (!countryCode) {
      return [];
    }

    setIsCityLoading(true);
    try {
      const cities = City.getCitiesOfCountry(countryCode) || [];
      const mappedCities = cities
        .map((city) => ({ value: city.name || city, label: city.name || city }))
        .filter((city) => city.value && city.label);

      const normalizedSearch = String(inputValue || '').trim().toLowerCase();
      const filteredCities = normalizedSearch
        ? mappedCities.filter((city) => city.label.toLowerCase().includes(normalizedSearch))
        : mappedCities;

      const uniqueCities = Array.from(new Map(filteredCities.map((city) => [city.value, city])).values());
      const sortedCities = uniqueCities.sort((a, b) => a.label.localeCompare(b.label));

      if (!normalizedSearch && mappedCities.length > 300) {
        return [];
      }

      return sortedCities.slice(0, 200);
    } catch (err) {
      console.warn('Unable to load city list for', countryCode, err);
      return [];
    } finally {
      setIsCityLoading(false);
    }
  }, []);

  useEffect(() => {
    const countryCode = selectedCountry?.value || profileForm.countryCode;
    if (!countryCode) {
      setCityOptions([]);
      return;
    }

    let active = true;
    loadCityOptions(countryCode).then((options) => {
      if (!active) return;
      setCityOptions(options);
      if (profileForm.city && !selectedCity) {
        const matchedCity = options.find((item) => item.value === profileForm.city);
        if (matchedCity) {
          setSelectedCity(matchedCity);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [selectedCountry?.value, profileForm.countryCode, profileForm.city, selectedCity, loadCityOptions]);

  useEffect(() => {
    if (!selectedCountry && profileForm.countryCode && countryOptions.length) {
      const matchedCountry = countryOptions.find((option) => option.value === profileForm.countryCode);
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
      }
    }
  }, [countryOptions, profileForm.countryCode, selectedCountry]);

  const displayName = useMemo(() => {
    const composed = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    if (composed) return composed;
    if (user.name) return user.name;
    return 'Complete Your Profile';
  }, [user.firstName, user.lastName, user.name]);

  const profileBio = user.bio || 'Add a bio to your profile';
  const profileEmail = user.email || 'No email set';
  const profilePhone = user.phone || 'No phone set';
  const profileLocation = [user.city, user.country].filter(Boolean).join(', ') || 'Add your location';
  const joinedLabel = formatJoinDate(user.createdAt);

  const handleNav = (key) => {
    if (key === 'home') navigate('/dashboard');
    if (key === 'search') navigate('/search');
    if (key === 'compare') navigate('/compare');
    if (key === 'history') navigate('/history');
    if (key === 'profile') navigate('/profile');
    if (key === 'settings') navigate('/settings');
  };

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login', { replace: true });
  };

  const openEditModal = () => {
    const form = createProfileForm(user);
    setProfileForm(form);
    setSaveState({ isSaving: false, error: '', success: '' });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (saveState.isSaving) return;
    setIsEditModalOpen(false);
  };

  const openPhotoPicker = () => {
    if (photoInputRef.current) photoInputRef.current.click();
  };

  const handlePhotoChange = async (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Only JPG, PNG, or WebP images are allowed.');
      event.target.value = '';
      return;
    }
    const fiveMbInBytes = 5 * 1024 * 1024;
    if (selectedFile.size > fiveMbInBytes) {
      alert('Image size must be 5 MB or less.');
      event.target.value = '';
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const result = typeof fileReader.result === 'string' ? fileReader.result : '';
      if (result) {
        setAvatarPreview(result);
        const token = getStoredToken();
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ avatarUrl: result }),
          });
          const data = await response.json().catch(() => ({}));
          if (response.ok) {
            const updatedUser = { ...user, avatarUrl: result };
            setUser(updatedUser);
            setStoredAuth({ token, user: updatedUser });
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      }
    };
    fileReader.readAsDataURL(selectedFile);
    event.target.value = '';
  };

  const applyBuiltinCover = async (coverData) => {
    setCoverPreview(coverData.imageUrl);
    const token = getStoredToken();
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coverUrl: coverData.imageUrl }),
      });
      if (response.ok) {
        const updatedUser = { ...user, coverUrl: coverData.imageUrl };
        setUser(updatedUser);
        setStoredAuth({ token, user: updatedUser });
        setIsCoverOptionsOpen(false);
      }
    } catch (error) {
      console.error('Error applying cover:', error);
    }
  };

  const Option = (props) => (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 text-sm text-slate-900">
          <span className="text-lg">{props.data.flag}</span>
          <span>{props.data.label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{props.data.isoCode}</span>
          {props.isSelected ? <span className="text-emerald-600">✓</span> : null}
        </div>
      </div>
    </components.Option>
  );

  const SingleValue = (props) => (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-3 text-slate-900">
        <span className="text-lg">{props.data.flag}</span>
        <span>{props.data.label}</span>
      </div>
    </components.SingleValue>
  );

  const DropdownIndicator = (props) => (
    <components.DropdownIndicator {...props}>
      <span className="text-slate-500 text-base">▾</span>
    </components.DropdownIndicator>
  );

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '52px',
      borderRadius: '12px',
      borderWidth: '2px',
      borderColor: state.isFocused ? '#0ea5e9' : '#334155',
      boxShadow: 'none',
      backgroundColor: '#ffffff',
      '&:hover': { borderColor: '#0ea5e9' },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(15,23,42,0.12)',
      marginTop: '8px',
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '280px',
      padding: 0,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#eff6ff' : '#ffffff',
      color: '#0f172a',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),
    dropdownIndicator: (base) => ({ ...base, padding: '0 8px', color: '#94a3b8' }),
    indicatorSeparator: () => ({ display: 'none' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    singleValue: (base) => ({ ...base, color: '#0f172a' }),
  };

  const handleCountryChange = (option) => {
    setSaveState({ isSaving: false, error: '', success: '' });
    setSelectedCountry(option);
    setCityOptions([]);
    setSelectedCity(null);
    setProfileForm((prev) => ({
      ...prev,
      country: option?.label || '',
      countryCode: option?.value || '',
      city: '',
    }));
  };

  const handleCityChange = (option) => {
    setSaveState({ isSaving: false, error: '', success: '' });
    setSelectedCity(option);
    setProfileForm((prev) => ({ ...prev, city: option?.label || '' }));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setSaveState({ isSaving: false, error: '', success: '' });
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const isProfileFormValid = Boolean(
    profileForm.firstName?.trim() &&
    profileForm.lastName?.trim() &&
    profileForm.bio?.trim().length >= MIN_BIO_LENGTH &&
    profileForm.phoneNumber?.trim() &&
    profileForm.city?.trim() &&
    profileForm.country?.trim()
  );

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!isProfileFormValid) {
      setSaveState({
        isSaving: false,
        error: `Please complete all fields and enter a bio with at least ${MIN_BIO_LENGTH} characters.`,
        success: '',
      });
      return;
    }
    const token = getStoredToken();
    if (!token) {
      setSaveState({ isSaving: false, error: 'Please login again to update your profile.', success: '' });
      return;
    }
    setSaveState({ isSaving: true, error: '', success: '' });
    try {
      const trimmedPhoneNumber = String(profileForm.phoneNumber || '').trim();
      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        bio: profileForm.bio,
        city: profileForm.city,
        country: profileForm.country,
        countryCode: profileForm.countryCode,
        avatarUrl: avatarPreview,
        coverUrl: coverPreview,
        phone: trimmedPhoneNumber ? `${profileForm.phoneCode} ${trimmedPhoneNumber}`.trim() : '',
      };
      console.log('Sending profile save payload:', payload);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      console.log('Backend response:', { status: response.status, data });
      if (!response.ok) {
        if (response.status === 401) {
          clearStoredAuth();
          throw new Error('Your session has expired. Please login again.');
        }
        throw new Error(data?.msg || 'Unable to update profile');
      }
      const updatedUser = { ...(data.user || user), avatarUrl: avatarPreview };
      setUser(updatedUser);
      setStoredAuth({ token, user: updatedUser });
      setSaveState({ isSaving: false, error: '', success: data?.msg || 'Profile updated successfully' });
      window.setTimeout(() => { setIsEditModalOpen(false); setSaveState({ isSaving: false, error: '', success: '' }); }, 700);
    } catch (error) {
      setSaveState({ isSaving: false, error: error.message || 'Unable to update profile', success: '' });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <SidebarNav activeItem="profile" onNavigate={handleNav} isSidebarOpen={isSidebarOpen} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* HEADER */}
        <header style={{
          padding: '20px 26px 16px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: '1px solid #dbe3ee',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
              }}
            >
              <SidebarToggleIcon open={isSidebarOpen} />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', margin: '4px 0 0' }}>{displayName}</h1>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', margin: 0 }}>Profile Overview</p>         
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {/* PROFILE HEADER CARD */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            overflow: 'hidden',
            marginBottom: '28px',
            paddingBottom: '24px',
          }}>
            {/* BANNER AREA */}
            <div style={{
              position: 'relative',
              height: '220px',
              borderRadius: '24px 24px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {/* Render image element for reliable cover rendering when coverPreview is a URL/data-uri */}
              {coverPreview && !coverPreview.includes('linear-gradient') && (
                <img
                  src={coverPreview}
                  alt="cover"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                  }}
                />
              )}
              {/* fallback background for gradients or no cover */}
              {!coverPreview && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                }} />
              )}
              {/* OVERLAY: lighter + bottom gradient to preserve image visibility */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: coverPreview && !coverPreview.includes('linear-gradient') ? 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.22) 100%)' : 'none',
                borderRadius: '24px 24px 0 0',
                pointerEvents: 'none',
              }} />
              
              {/* CHANGE COVER BUTTONS */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '8px',
                zIndex: 10,
              }}>
                {/* CHOOSE OPTIONS BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsCoverOptionsOpen(!isCoverOptionsOpen)}
                  style={{
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🎨 Theme
                </button>
              </div>
            </div>

            {/* PROFILE CONTENT SECTION */}
            <div style={{
              padding: '0 28px',
              position: 'relative',
              marginTop: '-60px',
              display: 'flex',
              gap: '24px',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}>
              {/* PROFILE PHOTO */}
              <div style={{
                position: 'relative',
                flexShrink: 0,
              }}>
                {avatarPreview ? (
                  <>
                    <img
                      src={avatarPreview}
                      alt={displayName}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '20px',
                        border: '4px solid #ffffff',
                        objectFit: 'cover',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                      }}
                    />
                    {/* CAMERA ACTION BUTTON */}
                    <button
                      type="button"
                      onClick={openPhotoPicker}
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        border: '3px solid #ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      📷
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={openPhotoPicker}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '20px',
                      border: '4px solid #e2e8f0',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '32px',
                      color: '#cbd5e1',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    📷
                    <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: "'Poppins', sans-serif" }}>Add Photo</div>
                  </button>
                )}
              </div>

              {/* USER NAME AND BIO */}
              <div style={{
                flex: 1,
                paddingTop: '24px',
              }}>
                <h2 style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  marginTop: '40px',
                  marginBottom: '8px',
                }}>
                  {displayName}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: '#303232',
                  margin: 0,
                  lineHeight: '1.5',
                }}>
                  {profileBio}
                </p>
              </div>

              {/* EDIT PROFILE BUTTON */}
              <button
                type="button"
                onClick={openEditModal}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dbe3ee',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  whiteSpace: 'nowrap',
                  marginTop: '24px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                }}
              >
                ✏️ Edit Profile
              </button>
            </div>

            {/* METADATA ROW */}
            <div style={{
              paddingLeft: '28px',
              paddingRight: '28px',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              fontSize: '12px',
              color: '#64748b',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#303232' }}>
                <span style={{ fontSize: '16px' }}>📧</span>
                <span>{profileEmail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#303232' }}>
                <span style={{ fontSize: '16px' }}>📱</span>
                <span>{profilePhone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#303232' }}>
                <span style={{ fontSize: '16px' }}>📍</span>
                <span>{profileLocation}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#303232' }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span>{joinedLabel}</span>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          {showProfileSkeleton ? (
            <>
              <SkeletonStats />
              <div style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.6' }}>
                Preparing your profile summary and favorites overview. Please wait while we gather the latest personalized insights.
              </div>
            </>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {[
                { icon: '📍', label: 'Restaurant Visits', value: profileStats.visits },
                { icon: '⚖️', label: 'Comparisons Made', value: profileStats.comparisons },
                { icon: '🔍', label: 'Searched', value: profileStats.searches },
                { icon: '❤️', label: 'Favorites Saved', value: favoritesCount },
              ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                }}
              >
                <div style={{ fontSize: '32px' }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#000000' }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* MAIN GRID: Favorites + Quick Menu */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* LEFT: Favorites list */}
            <div>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '22px 24px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', letterSpacing: '0.12em', marginBottom: '6px' }}>YOUR TOP PICKS</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Favorite Restaurants</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>{favoritesCount} saved</div>
              </div>

              {showProfileSkeleton ? (
                <SkeletonFavorites />
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '20px',
                }}>
                  {favoriteRestaurants.length === 0 ? (
                    <div style={{
                    gridColumn: '1 / -1',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '40px 32px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>❤️</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>No saved favorites yet</div>
                    <div style={{ fontSize: '13px', maxWidth: '320px', margin: '0 auto' }}>
                      Tap the heart on any restaurant while browsing to save it here.
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/search')}
                      style={{
                        marginTop: '20px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#ffffff',
                        background: '#2563eb',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                      }}
                    >
                      Explore Restaurants
                    </button>
                  </div>
                ) : favoriteRestaurants.map((item, index) => {
                  const details = item.details || {};
                  const restaurantId = String(item.restaurantId || item._id || '').trim();
                  const fallbackImage = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop&q=80';
                  const imageUrl = details.image || details.imageUrl || details.photo || item.image || fallbackImage;
                  const name = details.name || item.name || `Saved Favorite ${index + 1}`;
                  const location = details.location || details.address || item.location || 'Location unavailable';
                  const rating = details.rating ?? details.avgRating ?? null;
                  const cuisine = details.cuisine || item.cuisine || '';
                  const reviewCount = details.reviews ?? details.reviewCount ?? null;
                  const isRemoving = removingFavoriteId === restaurantId;

                  return (
                    <div
                      key={restaurantId || `${name}-${index}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.05)';
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        height: '160px',
                        overflow: 'hidden',
                        background: '#f1f5f9',
                        flexShrink: 0,
                      }}>
                        <img
                          src={imageUrl}
                          alt={name}
                          onError={(event) => {
                            if (event.currentTarget.src !== fallbackImage) {
                              event.currentTarget.src = fallbackImage;
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />

                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#fef3c7',
                          color: '#ca8a04',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '20px',
                        }}>
                          <span style={{ width: '5px', height: '5px', backgroundColor: '#ca8a04', borderRadius: '50%', display: 'inline-block' }} />
                          Favorite
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(restaurantId)}
                          disabled={Boolean(removingFavoriteId)}
                          aria-label={`Remove ${name} from favorites`}
                          title="Remove from favorites"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isRemoving ? '#fde68a' : '#fbbf24',
                            border: 'none',
                            cursor: removingFavoriteId ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                            opacity: removingFavoriteId && !isRemoving ? 0.55 : 1,
                            transition: 'transform 0.15s ease, background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!removingFavoriteId) e.currentTarget.style.transform = 'scale(1.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {isRemoving ? '…' : '❤️'}
                        </button>
                      </div>

                      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#0f172a',
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {name}
                        </h3>

                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#64748b',
                          lineHeight: 1.45,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          📍 {location}
                        </p>

                        {(rating != null || cuisine || reviewCount != null) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            {rating != null && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#0f172a',
                                background: '#fef9c3',
                                borderRadius: '999px',
                                padding: '4px 10px',
                              }}>
                                ★ {Number(rating).toFixed(1)}
                              </span>
                            )}
                            {cuisine && (
                              <span style={{
                                fontSize: '11px',
                                color: '#475569',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '999px',
                                padding: '4px 10px',
                              }}>
                                {cuisine}
                              </span>
                            )}
                            {reviewCount != null && (
                              <span style={{
                                fontSize: '11px',
                                color: '#64748b',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '999px',
                                padding: '4px 10px',
                              }}>
                                {reviewCount} reviews
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            {/* RIGHT: QUICK MENU + BADGES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* QUICK MENU */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' }}>Quick Menu</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setIsNotiOpen(true)}
                    style={{
                      padding: '12px 14px',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔔 Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{ display: 'inline-flex', minWidth: '28px', justifyContent: 'center', padding: '2px 8px', borderRadius: '999px', background: '#4338ca', color: '#ffffff', fontSize: '10px', fontWeight: '700', boxShadow: '0 4px 16px rgba(67,56,202,0.18)', animation: 'pulse 1.6s ease-in-out infinite' }}>
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '16px' }}>›</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      marginTop: '16px',
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#dc2626',
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    🚪 Log Out
                  </button>
                </div>
              </div>

              {/* BADGE DETAILS */}
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '20px',
                padding: '20px 24px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400e' }}>🎖️ Badge</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#b45309', marginTop: '8px' }}>{badgeDetails.title}</div>
                <div style={{ fontSize: '13px', color: '#a16207', marginTop: '4px' }}>{badgeDetails.subtitle}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NotificationsDrawer isOpen={isNotiOpen} onClose={() => setIsNotiOpen(false)} />

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(15,23,42,0.3)',
          }}>
            {/* MODAL HEADER */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', letterSpacing: '0.1em', margin: 0 }}>EDIT PROFILE</div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '8px 0 0' }}>Update your details</h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleProfileSave} style={{ padding: '24px 28px' }}>
              {/* ERROR/SUCCESS MESSAGES */}
              {saveState.error && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 14px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#991b1b',
                }}>
                  ⚠️ {saveState.error}
                </div>
              )}
              {saveState.success && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 14px',
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#166534',
                }}>
                  ✓ {saveState.success}
                </div>
              )}

              {/* FIRST NAME */}
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-slate-600 mb-2">First Name</label>
                <input
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleFormChange}
                  className="w-full rounded-[12px] border-2 border-slate-800 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  style={{ boxSizing: 'border-box', minHeight: '45px', paddingLeft: '18px' }}
                  placeholder="Enter Your First Name"
                />
              </div>

              {/* LAST NAME */}
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-slate-600 mb-2">Last Name</label>
                <input
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleFormChange}
                  className="w-full rounded-[12px] border-2 border-slate-800 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  style={{ boxSizing: 'border-box', minHeight: '45px', paddingLeft: '18px' }}
                  placeholder="Enter Your Last Name"
                />
              </div>

              {/* BIO */}
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-slate-600 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleFormChange}
                  rows="5"
                  className="w-full rounded-[12px] border-2 border-slate-800 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 font-sans"
                  style={{ boxSizing: 'border-box', minHeight: '52px', paddingLeft: '18px' }}
                  placeholder="Tell us about yourself..."
                />
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                  Please enter at least {MIN_BIO_LENGTH} characters for your bio.
                </div>
              </div>

              {/* PHONE */}
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-slate-600 mb-2">Phone</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                  <select
                    name="phoneCode"
                    value={profileForm.phoneCode}
                    onChange={handleFormChange}
                    className="rounded-[12px] border-2 border-slate-800 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 font-sans"
                    style={{ boxSizing: 'border-box', minHeight: '52px', paddingLeft: '18px' }}
                  >
                    {PHONE_CODE_OPTIONS.map((option) => (
                      <option key={option.dialCode} value={option.dialCode}>
                        {option.flag} {option.dialCode}
                      </option>
                    ))}
                  </select>
                  <input
                    name="phoneNumber"
                    value={profileForm.phoneNumber}
                    onChange={handleFormChange}
                    className="w-full rounded-[12px] border-2 border-slate-800 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    style={{ boxSizing: 'border-box', minHeight: '52px', paddingLeft: '18px' }}
                    placeholder="000-0000000"
                  />
                </div>
              </div>

              {/* COUNTRY */}
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-slate-600 mb-2">Country</label>
                <Select
                  components={{ Option, SingleValue, DropdownIndicator }}
                  styles={selectStyles}
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  placeholder="Search for a country"
                  className="text-sm"
                  classNamePrefix="react-select"
                  isClearable
                  isSearchable
                  menuPlacement="auto"
                  menuShouldScrollIntoView={false}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  noOptionsMessage={() => 'No matching countries'}
                />
                <p className="mt-3 text-[12px] text-slate-500">
                  To ensure accurate selection, please start by typing. Cities will update dynamically.
                </p>
              </div>

              {/* CITY */}
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-slate-600 mb-2">City</label>
                <AsyncSelect
                  styles={selectStyles}
                  defaultOptions={cityOptions}
                  cacheOptions
                  loadOptions={(inputValue) => loadCityOptions(selectedCountry?.value || profileForm.countryCode, inputValue)}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder={selectedCountry ? 'Search for a city' : 'Please select a country first...'}
                  className="text-sm"
                  classNamePrefix="react-select"
                  isDisabled={!selectedCountry}
                  isLoading={isCityLoading}
                  isSearchable
                  menuPlacement="auto"
                  menuShouldScrollIntoView={false}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  noOptionsMessage={({ inputValue }) => {
                    if (!selectedCountry) return 'Select a country first';
                    if (!inputValue || inputValue.trim().length < 2) return 'Type 2+ letters to search cities';
                    return 'No matching cities';
                  }}
                />
                <div className="mt-3 text-[12px] text-slate-500">
                  {selectedCountry ? 'Type 2 or more letters to search cities for the selected country.' : 'Please select a country first...'}
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#64748b',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isProfileFormValid || saveState.isSaving}
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: isProfileFormValid ? '#2563eb' : '#94a3b8',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isProfileFormValid ? 'pointer' : 'not-allowed',
                    boxShadow: isProfileFormValid ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                  }}
                >
                  {saveState.isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COVER OPTIONS MODAL */}
      {isCoverOptionsOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 70,
          padding: '20px',
        }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(15,23,42,0.3)',
            }}>
            {/* MODAL HEADER */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🎨 Choose Cover Theme</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0' }}>Pick a food-inspired theme for your profile</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCoverOptionsOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* COVER OPTIONS GRID */}
            <div style={{ padding: '24px 28px' }}>
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
              }}>
                {BUILTIN_COVERS.map((cover) => (
                  <button
                    key={cover.id}
                    type="button"
                    onClick={() => applyBuiltinCover(cover)}
                    style={{
                      padding: 0,
                      border: '2px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: `url(${cover.imageUrl}) top center/cover no-repeat`,
                      minHeight: '180px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      transition: 'all 0.18s',
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.58) 100%)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '800',
                      }}>
                        {cover.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProfilePage;

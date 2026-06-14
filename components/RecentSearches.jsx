import React, { useEffect, useState } from 'react';
import { fetchRecentSearches, formatRelativeTime, deleteSearchFromHistory } from '../lib/searchHistoryService';

const RecentSearches = ({ onSearchSelect, limit = 6, refreshKey = 0 }) => {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentSearches();
  }, [limit, refreshKey]);

  const loadRecentSearches = async () => {
    setLoading(true);
    const recentSearches = await fetchRecentSearches(limit);
    setSearches(recentSearches);
    setLoading(false);
  };

  const handleSearchClick = (search) => {
    if (onSearchSelect) {
      // Pass full object so location-specific searches can be reconstructed.
      onSearchSelect(search);
    }
  };

  const handleDeleteSearch = async (e, searchId) => {
    e.stopPropagation();
    const success = await deleteSearchFromHistory(searchId);
    if (success) {
      setSearches(searches.filter((s) => s._id !== searchId));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
        Loading recent searches...
      </div>
    );
  }

  if (!searches || searches.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        No recent searches yet. Try searching for your favorite restaurant!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {searches.map((search) => {
        const restaurantDetails = search.selectedRestaurantDetails || search.firstResultDetails;

        return (
          <div
            key={search._id}
            onClick={() => handleSearchClick(search)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              padding: '8px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              width: 'fit-content',
              maxWidth: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
          {/* Search icon */}
          <span style={{ fontSize: '13px', flexShrink: 0, color: '#64748b', lineHeight: 1 }}>🔍</span>

          {/* Restaurant name */}
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#0f172a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '220px',
            }}
          >
            {restaurantDetails?.name || search.query}
          </span>

          {/* Result count badge */}
          {search.resultCount > 0 && (
            <span style={{
              fontSize: '10px',
              color: '#64748b',
              background: '#f1f5f9',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontWeight: '500',
              flexShrink: 0,
            }}>
              {search.resultCount}
            </span>
          )}

          {/* Separator dot */}
          <span style={{ color: '#d1d5db', fontSize: '10px', flexShrink: 0 }}>·</span>

          {/* Relative time */}
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {formatRelativeTime(search.searchedAt)}
          </span>

          {/* Delete button */}
          <button
            onClick={(e) => handleDeleteSearch(e, search._id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '15px',
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              flexShrink: 0,
              borderRadius: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'transparent';
            }}
            title="Remove from history"
          >
            ✕
          </button>
          </div>
        );
      })}
    </div>
  );
};

export default RecentSearches;

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNav, { SidebarToggleIcon } from '../components/SidebarNav';
import { useRestaurants } from '../lib/useRestaurants';
import { useGoogleRestaurantSearch } from '../lib/useGoogleRestaurantSearch';
import { fetchUnifiedHistory, toggleFavoriteRestaurant, clearUnifiedHistory, deleteUnifiedHistoryItem } from '../lib/unifiedHistoryService';
import { generateFallbackReviewData } from '../src/utils/reviewHelpers';

const SearchBarIcon = ({ color = '#64748b' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

const typeStyles = {
  visited: { label: 'Visited', bg: '#eff6ff', color: '#2563eb', emoji: '👁️' },
  compared: { label: 'Compared', bg: '#f5f3ff', color: '#8b5cf6', emoji: '🔁' },
  searched: { label: 'Searched', bg: '#ecfdf5', color: '#059669', emoji: '🔎' },
  search_click: { label: 'Search Click', bg: '#eef2ff', color: '#4f46e5', emoji: '👆' },
  favorite: { label: 'Favorite', bg: '#fef3c7', color: '#ca8a04', emoji: '❤️' },
};

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'visited', label: 'Visited' },
  { id: 'compared', label: 'Compared' },
  { id: 'searched', label: 'Searched' },
  { id: 'search_click', label: 'Search Clicks' },
  { id: 'favorite', label: 'Favorites' },
];

const DEFAULT_HISTORY_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop';

const SkeletonStatBadge = () => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }}>
    <div style={{ fontSize: '18px', opacity: 0.5 }}>⏳</div>
    <div style={{ flex: 1 }}>
      <div style={{ width: '60px', height: '12px', background: '#e2e8f0', borderRadius: '4px' }} />
      <div style={{ width: '80px', height: '20px', background: '#e2e8f0', borderRadius: '4px', marginTop: '8px' }} />
    </div>
  </div>
);

const SkeletonHistoryCard = () => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }}>
    <div style={{ width: '100%', height: '160px', background: '#e2e8f0' }} />
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '70%', height: '14px', background: '#e2e8f0', borderRadius: '4px' }} />
      <div style={{ width: '50%', height: '12px', background: '#e2e8f0', borderRadius: '4px' }} />
      <div style={{ width: '80%', height: '12px', background: '#e2e8f0', borderRadius: '4px' }} />
    </div>
  </div>
);

const LoadingSpinner = ({ text = 'Compiling your personalized activity log and restaurant interactions...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    }} />
    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{text}</p>
  </div>
);

const hasMeaningfulDetails = (details) => (
  details
  && typeof details === 'object'
  && Object.values(details).some((value) => value !== undefined && value !== null && value !== '')
);

const mergeRestaurantDetails = (...sources) => {
  const merged = {};
  sources.forEach((source) => {
    if (!hasMeaningfulDetails(source)) return;
    Object.entries(source).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        merged[key] = value;
      }
    });
  });
  return Object.keys(merged).length ? merged : null;
};

const calcAIScore = (pos = 0, neu = 0, neg = 0) => {
  const raw = Math.round(pos * 1.0 + neu * 0.4 - neg * 0.5);
  return Math.max(0, Math.min(100, raw));
};

const getGrade = (score) => {
  if (score >= 85) return { grade: 'A', label: 'Excellent', color: '#15803d', bg: '#dcfce7', ring: '#22c55e' };
  if (score >= 70) return { grade: 'B', label: 'Good', color: '#1d4ed8', bg: '#dbeafe', ring: '#3b82f6' };
  if (score >= 55) return { grade: 'C', label: 'Average', color: '#b45309', bg: '#fef3c7', ring: '#f59e0b' };
  if (score >= 40) return { grade: 'D', label: 'Below Avg', color: '#c2410c', bg: '#ffedd5', ring: '#f97316' };
  return { grade: 'F', label: 'Poor', color: '#dc2626', bg: '#fee2e2', ring: '#ef4444' };
};

const buildHistorySentimentData = (details = {}) => {
  if (!details || typeof details !== 'object') {
    return generateFallbackReviewData({}, {}, 'HistoryView');
  }

  const sections = Array.isArray(details.naturalReviewSections) ? details.naturalReviewSections : [];
  const hasSections = sections.length > 0;

  if (!hasSections) {
    return generateFallbackReviewData(
      {
        positive: details.sentiment ?? details.positive,
        negative: details.negative,
        neutral: details.neutral,
        reviewCount: details.reviews ?? details.reviewCount ?? details.userRatingsTotal,
        insight: details.insight,
      },
      details,
      'HistoryView'
    );
  }

  const positive = Number.isFinite(details.positive)
    ? details.positive
    : Number.isFinite(details.sentiment)
      ? details.sentiment
      : 0;
  const negative = Number.isFinite(details.negative) ? details.negative : 0;
  const neutral = Number.isFinite(details.neutral)
    ? details.neutral
    : Math.max(0, 100 - positive - negative);

  const model = details.model || 'roberta';
  const source = details.source || 'history_snapshot';
  const isFallback = Boolean(
    details.isFallback
    || model === 'google_places_aggregator'
    || String(source).toLowerCase().includes('fallback')
  );

  return {
    positive,
    neutral,
    negative,
    sentiment: details.sentiment ?? positive,
    reviewCount: details.reviews ?? details.reviewCount ?? 0,
    insight: details.insight ?? null,
    naturalReview: details.naturalReview ?? null,
    aiOverview: details.aiOverview ?? sections.find((section) => section.type === 'overview')?.text ?? null,
    aiVerdict: details.aiVerdict ?? sections.find((section) => section.type === 'verdict')?.text ?? null,
    naturalReviewSections: hasSections ? sections : [],
    source,
    model,
    isFallback,
    loading: false,
  };
};

const getHistoryAnalyticsBadge = (input = {}) => {
  if (!input || typeof input !== 'object') return null;

  const hasAnalytics = Boolean(
    input.isFallback
    || input.sentiment != null
    || input.positive != null
    || input.negative != null
    || input.neutral != null
    || input.insight
    || input.aiOverview
    || input.aiVerdict
    || input.naturalReview
    || (Array.isArray(input.naturalReviewSections) && input.naturalReviewSections.length > 0)
    || input.source
    || input.model
  );

  if (!hasAnalytics) return null;

  const hasLiveAI = !input.isFallback && Boolean(
    input.aiOverview
    || input.aiVerdict
    || input.naturalReview
    || input.insight
    || input.sentiment != null
    || input.positive != null
    || input.negative != null
    || input.neutral != null
    || (Array.isArray(input.naturalReviewSections) && input.naturalReviewSections.length > 0)
  );

  if (
    input.isFallback
    || input.model === 'google_places_aggregator'
    || String(input.source || '').toLowerCase().includes('fallback')
  ) {
    return '⚙️ Smart Analytics';
  }

  if (hasLiveAI) {
    return '✨ Live AI';
  }

  return '⚙️ Smart Analytics';
};

const DEFAULT_LOCATION = 'Lahore, Pakistan';

const formatPriceRange = (details = {}) => {
  if (details.priceRange) return details.priceRange;
  if (typeof details.priceLevel === 'number' && details.priceLevel > 0) {
    return '$'.repeat(Math.min(details.priceLevel, 4));
  }
  if (typeof details.price_level === 'number' && details.price_level > 0) {
    return '$'.repeat(Math.min(details.price_level, 4));
  }
  return '$$';
};

const resolveLocation = (details = {}, item = {}) => (
  details.location
  || details.address
  || details.formatted_address
  || item.location
  || DEFAULT_LOCATION
);

const resolveReviewCount = (details = {}) => {
  const raw = details.reviews
    ?? details.userRatingsTotal
    ?? details.user_ratings_total
    ?? details.reviewCount
    ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const distanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const extractDetailSources = (item = {}) => {
  if (item.type === 'compared') {
    return [
      item.leftRestaurantDetails,
      item.rightRestaurantDetails,
      item.details,
      item.comparisonDetails,
    ];
  }

  return [
    item.details,
    item.selectedRestaurantDetails,
    item.firstResultDetails,
    item.leftRestaurantDetails,
    item.rightRestaurantDetails,
    item.comparisonDetails,
  ];
};

const normalizeHistoryDetails = (item = {}, restaurantLookup = new Map()) => {
  const sources = extractDetailSources(item).filter(hasMeaningfulDetails);
  let merged = mergeRestaurantDetails(...sources);

  if (!merged) {
    const lookupKey = String(item.restaurantId || item._id || '').toLowerCase();
    merged = restaurantLookup.get(String(item.restaurantId || item._id))
      || restaurantLookup.get(lookupKey)
      || {};
  }

  const ratingValue = Number(merged.rating ?? item.rating);
  const reviews = resolveReviewCount(merged);

  return {
    ...merged,
    name: merged.name || item.name || item.query || 'Unnamed Restaurant',
    image: merged.image || merged.imageUrl || merged.photo || item.image || DEFAULT_HISTORY_IMAGE,
    location: resolveLocation(merged, item),
    rating: Number.isFinite(ratingValue) ? ratingValue : null,
    cuisine: merged.cuisine
      || (Array.isArray(merged.types) && merged.types[0] ? merged.types[0].replace(/_/g, ' ') : null)
      || 'Restaurant',
    priceRange: formatPriceRange(merged),
    reviews,
    userRatingsTotal: reviews,
    lat: merged.lat ?? merged.latitude ?? null,
    lng: merged.lng ?? merged.longitude ?? null,
    restaurantId: merged.restaurantId || merged.placeId || item.restaurantId || item._id || null,
    placeId: merged.placeId || merged.restaurantId || item.restaurantId || null,
  };
};

const buildDisplayData = (item = {}, restaurantLookup = new Map()) => {
  const details = normalizeHistoryDetails(item, restaurantLookup);
  const sentimentData = buildHistorySentimentData(details);
  const aiScore = calcAIScore(sentimentData.positive, sentimentData.neutral, sentimentData.negative);
  const grade = getGrade(aiScore);

  const leftDetails = hasMeaningfulDetails(item.leftRestaurantDetails)
    ? normalizeHistoryDetails({ details: item.leftRestaurantDetails, restaurantId: item.leftRestaurantId }, restaurantLookup)
    : null;
  const rightDetails = hasMeaningfulDetails(item.rightRestaurantDetails)
    ? normalizeHistoryDetails({ details: item.rightRestaurantDetails, restaurantId: item.rightRestaurantId }, restaurantLookup)
    : hasMeaningfulDetails(item.comparisonDetails)
      ? normalizeHistoryDetails({ details: item.comparisonDetails, restaurantId: item.rightRestaurantId }, restaurantLookup)
      : null;

  return {
    id: item._id || item.id,
    type: item.type,
    name: details.name,
    image: details.image,
    location: details.location,
    rating: details.rating,
    cuisine: details.cuisine,
    priceRange: details.priceRange,
    reviews: details.reviews,
    userRatingsTotal: details.userRatingsTotal,
    lat: details.lat,
    lng: details.lng,
    sentiment: sentimentData.sentiment ?? details.sentiment ?? null,
    isFallback: sentimentData.isFallback,
    analyticsBadge: getHistoryAnalyticsBadge(sentimentData),
    aiScore,
    grade,
    sentimentData,
    details,
    leftDetails,
    rightDetails,
    rawItem: item,
  };
};

const HistoryGradeBanner = ({ grade, aiScore }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    background: grade.bg,
    border: `1px solid ${grade.ring}`,
    marginBottom: '12px',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      flexShrink: 0,
      background: `conic-gradient(${grade.ring} ${aiScore * 3.6}deg, #e2e8f0 0deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        fontSize: '14px',
        color: grade.color,
      }}>
        {grade.grade}
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: '800', color: grade.color, lineHeight: 1.2 }}>
        {grade.grade} {grade.label}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
        AI Score {aiScore}/100
      </div>
    </div>
  </div>
);

const TOPIC_STYLE = {
  food: { bg: '#f0fdf4', border: '#86efac', label: '#15803d', dot: '#22c55e' },
  service: { bg: '#eff6ff', border: '#93c5fd', label: '#1d4ed8', dot: '#3b82f6' },
  ambiance: { bg: '#fefce8', border: '#fde047', label: '#a16207', dot: '#eab308' },
  concern: { bg: '#fff7ed', border: '#fdba74', label: '#c2410c', dot: '#f97316' },
  value: { bg: '#fdf4ff', border: '#d8b4fe', label: '#7e22ce', dot: '#a855f7' },
};

const HistorySentimentPanel = ({ details = {}, sentimentData = null }) => {
  const resolvedSentiment = sentimentData || buildHistorySentimentData(details);
  if (!resolvedSentiment || resolvedSentiment.loading) return null;

  const aiScore = calcAIScore(resolvedSentiment.positive, resolvedSentiment.neutral, resolvedSentiment.negative);
  const grade = getGrade(aiScore);
  const sections = resolvedSentiment.naturalReviewSections || [];
  const overview = sections.find((section) => section.type === 'overview');
  const verdict = sections.find((section) => section.type === 'verdict');
  const topics = sections.filter((section) => ['food', 'service', 'ambiance', 'concern', 'value'].includes(section.type));
  const verdictText = verdict?.text || resolvedSentiment.aiVerdict;
  const totalPublicReviews = resolveReviewCount(details);
  const aiAnalysedCount = Number.isFinite(resolvedSentiment.reviewCount) ? resolvedSentiment.reviewCount : 0;

  return (
    <>
      <div style={{
        padding: '10px 12px',
        background: '#f0f9ff',
        borderRadius: '10px',
        marginBottom: '10px',
        border: '1px solid #bfdbfe',
      }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🤖 AI Sentiment Analysis
        </p>

        {resolvedSentiment.isFallback && (
          <div style={{
            marginBottom: '10px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#fffbeb',
            border: '1px solid #facc15',
            color: '#92400e',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            ⚠️ Static Data Snapshot (AI Offline) — using aggregated Google Places rating data only.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '9px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            flexShrink: 0,
            background: `conic-gradient(${grade.ring} ${aiScore * 3.6}deg, #e2e8f0 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '13px',
              color: grade.color,
            }}>
              {grade.grade}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: grade.color }}>{grade.label}</span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                {aiScore}
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>/100</span>
              </span>
            </div>
            <div style={{ display: 'flex', height: '7px', borderRadius: '4px', overflow: 'hidden', background: '#e2e8f0' }}>
              <div style={{ width: `${resolvedSentiment.positive}%`, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', transition: 'width 0.6s ease' }} />
              <div style={{ width: `${resolvedSentiment.neutral}%`, background: '#f59e0b', transition: 'width 0.6s ease' }} />
              <div style={{ width: `${resolvedSentiment.negative}%`, background: '#ef4444', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginBottom: '7px' }}>
          {[['😊', 'Positive', resolvedSentiment.positive, '#dbeafe', '#1d4ed8'],
            ['😐', 'Neutral', resolvedSentiment.neutral, '#fef3c7', '#b45309'],
            ['😡', 'Negative', resolvedSentiment.negative, '#fee2e2', '#dc2626']].map(([emoji, label, value, bg, col]) => (
            <div key={label} style={{ background: bg, borderRadius: '7px', padding: '5px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px' }}>{emoji}</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: col }}>{value}%</div>
              <div style={{ fontSize: '9px', color: col, fontWeight: '600', letterSpacing: '0.3px' }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {totalPublicReviews > 0
            ? `${totalPublicReviews.toLocaleString()} public review${totalPublicReviews !== 1 ? 's' : ''}`
            : 'Public review count unavailable'}
          {' · '}
          {aiAnalysedCount > 0
            ? `📊 ${aiAnalysedCount.toLocaleString()} analysed by AI`
            : '🔮 Estimated sentiment'}
          {' · '}
          {resolvedSentiment.source?.includes('google_scrape') ? '🌐 Google Maps'
            : resolvedSentiment.source?.includes('places_api') ? '📌 Places API'
              : resolvedSentiment.source === 'HistoryView' ? '🗂️ History Snapshot'
                : '🔮 Smart Analytics'}
          {' · '}
          {resolvedSentiment.model === 'vader' ? 'VADER NLP'
            : resolvedSentiment.model === 'google_places_aggregator' ? 'Google Places Aggregator'
              : 'RoBERTa AI'}
        </p>
      </div>

      <div style={{
        padding: '12px 14px',
        background: 'linear-gradient(135deg, #f8f6ff 0%, #fdf4ff 100%)',
        borderRadius: '10px',
        border: '1px solid #e9d5ff',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px' }}>🤖</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed' }}>AI Review Summary</span>
          {resolvedSentiment.model === 'roberta' && (
            <span style={{ fontSize: '9px', background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600', marginLeft: 'auto' }}>
              RoBERTa + Extractive AI
            </span>
          )}
          {resolvedSentiment.model === 'google_places_aggregator' && (
            <span style={{ fontSize: '9px', background: '#fffbeb', color: '#92400e', padding: '1px 6px', borderRadius: '6px', fontWeight: '600', marginLeft: 'auto' }}>
              Google Places Aggregator
            </span>
          )}
        </div>

        {(sections.length > 0 || resolvedSentiment.aiOverview || resolvedSentiment.aiVerdict || resolvedSentiment.naturalReview) ? (
          <div>
            {(overview?.text || resolvedSentiment.aiOverview) && (
              <p style={{ fontSize: '11.5px', color: '#4c1d95', margin: '0 0 10px 0', lineHeight: 1.6, fontStyle: 'italic', paddingBottom: '8px', borderBottom: '1px dashed #ddd6fe' }}>
                {overview?.text || resolvedSentiment.aiOverview}
              </p>
            )}

            {sections.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
                {topics.map((section, index) => {
                  const style = TOPIC_STYLE[section.type] || TOPIC_STYLE.food;
                  const snippet = section.quote || section.text || '';
                  return (
                    <div key={`${section.type}-${index}`} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: '7px', padding: '7px 9px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px' }}>{section.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: style.label, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {section.label}
                        </span>
                        {section.framing && (
                          <span style={{ fontSize: '9px', color: '#9ca3af', marginLeft: 'auto' }}>
                            {section.framing}
                          </span>
                        )}
                      </div>
                      {snippet && (
                        <div style={{ paddingLeft: '8px', borderLeft: `2px solid ${style.dot}` }}>
                          <p style={{ fontSize: '11px', color: '#1f2937', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                            "{snippet}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {verdictText && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', paddingTop: '8px', borderTop: '1px dashed #ddd6fe' }}>
                <span style={{ fontSize: '12px', marginTop: '1px' }}>
                  {(resolvedSentiment.positive || 0) >= 70 ? '✅' : (resolvedSentiment.positive || 0) >= 50 ? '🔶' : '❌'}
                </span>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#4c1d95', margin: 0, lineHeight: 1.5 }}>
                  {verdictText}
                </p>
              </div>
            )}

            {!verdictText && resolvedSentiment.naturalReview && (
              <p style={{ fontSize: '12px', color: '#3b0764', margin: 0, lineHeight: 1.6, fontStyle: 'normal' }}>
                {resolvedSentiment.naturalReview}
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#6b21a8', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
            💡 {resolvedSentiment.insight || 'AI summary unavailable for this snapshot.'}
          </p>
        )}
      </div>
    </>
  );
};

const normalizeHistoryItem = (item = {}, restaurantLookup = new Map()) => {
  const displayData = buildDisplayData(item, restaurantLookup);

  return {
    ...item,
    details: displayData.details,
    displayData,
    name: displayData.name,
    image: displayData.image,
    location: displayData.location,
    rating: displayData.rating ?? 'N/A',
    data: displayData,
  };
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const { restaurants: restaurantsData = [] } = useRestaurants();

  // Load data from database
  const [historyData, setHistoryData] = useState({
    history: [],
    stats: null,
  });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
    return undefined;
  }, []);

  const restaurantLookup = useMemo(() => {
    const lookup = new Map();
    (restaurantsData || []).forEach((restaurant) => {
      if (restaurant?.id != null) {
        lookup.set(String(restaurant.id), restaurant);
      }
      if (restaurant?.placeId != null) {
        lookup.set(String(restaurant.placeId), restaurant);
      }
      if (restaurant?.name) {
        lookup.set(String(restaurant.name).toLowerCase(), restaurant);
      }
    });
    return lookup;
  }, [restaurantsData]);

  // Load unified history and favorites on mount
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await fetchUnifiedHistory();
        if (data) {
          setHistoryData(data);
          setFavorites((data.history || []).filter((item) => item.type === 'favorite').map((item) => String(item.restaurantId || item._id)));
        }
      } catch (error) {
        console.error('Error loading history:', error);
        setHistoryData({ history: [], stats: { searches: 0, clicks: 0, comparisons: 0, favorites: 0, visits: 0 } });
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const refreshHistory = async () => {
      const data = await fetchUnifiedHistory();
      setHistoryData(data);
      setFavorites((data.history || []).filter((item) => item.type === 'favorite').map((item) => String(item.restaurantId || item._id)));
    };

    const handleHistoryUpdated = () => {
      refreshHistory();
    };

    window.addEventListener('historyUpdated', handleHistoryUpdated);
    return () => window.removeEventListener('historyUpdated', handleHistoryUpdated);
  }, []);

  const historyItems = useMemo(() => {
    return (historyData.history || []).map((item) => normalizeHistoryItem(item, restaurantLookup));
  }, [historyData.history, restaurantLookup]);

  const currentFilterLabel = filterOptions.find((option) => option.id === selectedType)?.label || 'All';

  const filteredHistory = useMemo(() => {
    let items = historyItems;

    if (selectedType !== 'all') {
      items = items.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = item.data?.name || item.details?.name || item.name || item.query || '';
        const cuisine = item.details?.cuisine || '';
        const location = item.displayData?.location || item.data?.location || item.details?.location || '';
        return (
          name.toLowerCase().includes(query) ||
          cuisine.toLowerCase().includes(query) ||
          location.toLowerCase().includes(query)
        );
      });
    }

    return items;
  }, [historyItems, selectedType, searchQuery]);

  const handleSidebarNavClick = useCallback((id) => {
    setActiveNav(id);
    if (id === 'home') navigate('/dashboard');
    if (id === 'search') navigate('/search');
    if (id === 'compare') navigate('/compare');
    if (id === 'history') navigate('/history');
    if (id === 'profile') navigate('/profile');
    if (id === 'settings') navigate('/settings');
  }, [navigate]);

  const handleViewDetail = useCallback((id) => {
    const item = historyItems.find((h) => h._id === id || h.id === id || String(h._id) === String(id) || String(h.id) === String(id));
    if (item) setDetailItem(item);
  }, [historyItems]);

  const handleDeleteItem = useCallback(async (item) => {
    if (!item?._id && !item?.id) return;
    setDeleteTargetItem(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetItem?._id) return;

    const targetId = String(deleteTargetItem._id);
    setConfirmDeleteId(targetId);

    const result = await deleteUnifiedHistoryItem(deleteTargetItem);
    if (result?.history) {
      setHistoryData(result);
      setFavorites((result.history || []).filter((item) => item.type === 'favorite').map((item) => String(item.restaurantId || item._id)));
      if (detailItem?._id === deleteTargetItem._id) {
        setDetailItem(null);
      }
      setToast({
        type: 'success',
        message: 'Entry removed from history.',
      });
    } else {
      setToast({
        type: 'error',
        message: 'Could not delete that entry. Please try again.',
      });
    }

    setDeleteTargetItem(null);
    setConfirmDeleteId(null);

    window.setTimeout(() => setToast(null), 2800);
  }, [deleteTargetItem, detailItem]);

  const handleCancelDelete = useCallback(() => {
    if (confirmDeleteId) return;
    setDeleteTargetItem(null);
  }, [confirmDeleteId]);

  const handleCloseDetail = useCallback(() => {
    setDetailItem(null);
  }, []);

  const handleToggleFavorite = useCallback(async (restaurantId, restaurantDetails = null) => {
    const result = await toggleFavoriteRestaurant(restaurantId, restaurantDetails);
    if (result) {
      setFavorites(Array.isArray(result.favorites) ? result.favorites.map(String) : []);
    }
  }, []);

  const detailData = detailItem?.displayData || detailItem?.data || {};
  const detailAnalyticsBadge = detailData.analyticsBadge || null;

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      const success = await clearUnifiedHistory();
      if (success) {
        setHistoryData({
          history: [],
          stats: {
            searches: 0,
            clicks: 0,
            comparisons: 0,
            favorites: 0,
            visits: 0,
          },
        });
        setFavorites([]);
      }
    }
  }, []);

  function FormatTime({ date }) {
    if (!date) return 'Recently';
    const now = new Date();
    const diff = now - new Date(date);
    const diffMins = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  function QueryImage({ query, fallback }) {
    const { restaurants = [], isLoading } = useGoogleRestaurantSearch(query || '');
    const img = restaurants?.[0]?.image;

    if (isLoading) {
      return (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg,#f1f5f9,#eef2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: '#e6eefc' }} />
        </div>
      );
    }

    if (img) {
      return <img src={img} alt={query} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }

    return (
      <div style={{ width: '100%', height: '100%', background: fallback || 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Poppins', sans-serif" }}>
      <SidebarNav activeItem={activeNav} onNavigate={handleSidebarNavClick} isSidebarOpen={isSidebarOpen} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ padding: '20px 26px 16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
                  flexShrink: 0,
                }}
              >
                <SidebarToggleIcon open={isSidebarOpen} />
              </button>
              <div>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '0 0 16px', lineHeight: 1.05 }}>
                  Browsing History
                </p>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Your recent restaurant views, searches, and comparisons
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '15px',
                border: '1px solid #dc2626',
                background: '#ffffff',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>Clear All</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    color: '#1e293b',
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    fontSize: '14px',
                    color: '#1e293b',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span>{currentFilterLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {filterOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    zIndex: 20,
                    width: '180px',
                    padding: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: '0 18px 48px rgba(15,23,42,0.12)',
                  }}>
                    {filterOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedType(option.id);
                          setFilterOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          border: 'none',
                          background: selectedType === option.id ? '#eff6ff' : 'transparent',
                          color: selectedType === option.id ? '#1d4ed8' : '#0f172a',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: selectedType === option.id ? 700 : 500,
                        }}
                      >
                        <span>{option.label}</span>
                        {selectedType === option.id ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <>
                <div style={{
                  marginBottom: '24px',
                  padding: '18px 22px',
                  borderRadius: '18px',
                  background: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  color: '#4338ca',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '16px' }}>🔄</span>
                  Compiling your personalized activity log and restaurant interactions...
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[0, 1, 2, 3].map((item) => <SkeletonStatBadge key={item} />)}
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '50%' }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>
                      {historyData.stats?.visits ?? 0}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Restaurant Visits</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#f5f3ff', borderRadius: '50%' }}>
                    <span style={{ fontSize: '18px' }}>⚖️</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>
                      {historyData.stats?.comparisons ?? 0}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Comparisons Made</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#f0fdf4', borderRadius: '50%' }}>
                    <span style={{ fontSize: '18px' }}>🔍</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>
                      {historyData.stats?.searches ?? 0}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Searched</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(15,23,42,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#fef2f2', borderRadius: '50%' }}>
                    <span style={{ fontSize: '18px' }}>❤️</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#000000', lineHeight: '1.2' }}>
                      {historyData.stats?.favorites ?? 0}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Favorites Saved</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonHistoryCard key={i} />)}
              </div>
              <LoadingSpinner text="🗂️ Compiling your personalized activity log and restaurant interactions..." />
            </>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>No history found</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Try a different search or filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredHistory.map((item) => {
                const badgeStyle = typeStyles[item.type] || typeStyles.visited;
                const favoriteKey = String(item.restaurantId || item._id);
                const isFavorited = favorites.includes(favoriteKey);
                const isDeleting = confirmDeleteId === String(item._id);
                const display = item.displayData || item.data || {};
                const comparisonText = item.comparisonLabel
                  || (item.comparedWith ? `Compared with: ${item.comparedWith}` : '')
                  || (item.note || '').replace(/^Compared\s*/i, 'Compared ');
                const cardDistance = userLocation && display.lat && display.lng
                  ? distanceKm(userLocation.lat, userLocation.lng, display.lat, display.lng)
                  : null;

                return (
                  <div
                    key={item._id}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.05)';
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Image Section */}
                    <div style={{
                      position: 'relative',
                      height: '160px',
                      overflow: 'hidden',
                      background: '#f1f5f9',
                    }}>
                      {display.image ? (
                        <img
                          src={display.image}
                          alt={display.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : null}

                      {display.grade && (
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '12px',
                          background: display.grade.bg,
                          color: display.grade.color,
                          border: `1px solid ${display.grade.ring}`,
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '4px 8px',
                          borderRadius: '999px',
                        }}>
                          {display.grade.grade} · {display.aiScore}/100
                        </div>
                      )}

                      {/* Badge Overlay */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: badgeStyle.color, borderRadius: '50%', display: 'inline-block' }} />
                        {badgeStyle.label}
                      </div>

                      {/* Favorite button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item.restaurantId || item._id, display.details || item.details || null)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isFavorited ? '#fbbf24' : 'rgba(255,255,255,0.88)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                          transition: 'all 0.2s',
                        }}
                        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorited ? '❤️' : '🤍'}
                      </button>
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      {/* Title */}
                      <h3 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#0f172a',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {display.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        color: '#64748b',
                      }}>
                        <span style={{ fontWeight: 500 }}>{display.cuisine || 'Restaurant'}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{display.priceRange || '$$'}</span>
                      </div>

                      <div style={{
                        fontSize: '11px',
                        color: '#0f172a',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        {display.rating != null && display.rating !== 'N/A' && (
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>★{Number(display.rating).toFixed(1)}</span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#64748b' }}>
                          <span>📍</span>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '160px',
                          }}>
                            {display.location}
                          </span>
                        </span>
                        {cardDistance != null && (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>
                            {cardDistance.toFixed(1)} km
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: '11px',
                        color: '#0f172a',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        {display.sentiment != null && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontWeight: 600,
                            color: display.sentiment >= 80 ? '#16a34a' : display.sentiment >= 60 ? '#ca8a04' : '#dc2626',
                          }}>
                            <span>●</span>
                            {Math.round(display.sentiment)}%
                          </span>
                        )}
                        {display.reviews > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#0f172a', fontWeight: 500 }}>
                            <span>📝</span>
                            {display.reviews.toLocaleString()} reviews
                          </span>
                        )}
                      </div>

                      {/* Search Query (if searched) */}
                      {(item.type === 'searched' || item.type === 'search_click') && item.query && (
                        <div style={{
                          fontSize: '10px',
                          color: '#475569',
                          padding: '6px 8px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          fontStyle: 'italic',
                        }}>
                          {item.type === 'search_click' ? 'Clicked from search' : 'Searched'}: <strong>{item.query}</strong>
                          {item.position ? ` • Position #${item.position}` : ''}
                        </div>
                      )}

                      {item.type === 'compared' && comparisonText && (
                        <div style={{
                          fontSize: '10px',
                          color: '#6d28d9',
                          padding: '6px 8px',
                          backgroundColor: '#f5f3ff',
                          borderRadius: '6px',
                          fontWeight: 600,
                          lineHeight: 1.4,
                        }}>
                          {comparisonText}
                        </div>
                      )}

                      {display.analyticsBadge && (
                        <div style={{
                          fontSize: '10px',
                          color: display.isFallback ? '#92400e' : '#166534',
                          padding: '6px 8px',
                          backgroundColor: display.isFallback ? '#fffbeb' : '#f0fdf4',
                          border: `1px solid ${display.isFallback ? '#fcd34d' : '#86efac'}`,
                          borderRadius: '6px',
                          fontWeight: 700,
                          lineHeight: 1.4,
                        }}>
                          {display.analyticsBadge}
                        </div>
                      )}

                      {/* Time */}
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '4px',
                      }}>
                        🕐 <FormatTime date={item.clickedAt || item.searchedAt || item.createdAt || item.visitedAt} />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item._id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          disabled={isDeleting}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: isDeleting ? '#fee2e2' : '#f8fafc',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDeleting ? '#fee2e2' : '#f8fafc'; }}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 70,
          minWidth: '280px',
          maxWidth: '360px',
          padding: '14px 16px',
          borderRadius: '14px',
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: toast.type === 'success' ? '#047857' : '#b91c1c',
          boxShadow: '0 16px 36px rgba(15,23,42,0.14)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {toast.message}
        </div>
      )}

      {deleteTargetItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 65,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 28px 70px rgba(15,23,42,0.22)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Delete history entry?</h3>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                This will permanently remove{' '}
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {deleteTargetItem.details?.name || deleteTargetItem.query || deleteTargetItem.name || 'this entry'}
                </span>{' '}
                from your database.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px 22px' }}>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={Boolean(confirmDeleteId)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: confirmDeleteId ? 'not-allowed' : 'pointer',
                  opacity: confirmDeleteId ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(confirmDeleteId)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #dc2626',
                  background: confirmDeleteId ? '#ef4444' : '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: confirmDeleteId ? 'not-allowed' : 'pointer',
                  opacity: confirmDeleteId ? 0.8 : 1,
                }}
              >
                {confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '20px' }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '92vh',
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(15,23,42,0.25)',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: 1.25 }}>
                  {detailData.name || detailItem.details?.name || detailItem.query || detailItem.name || 'Item'}
                </h2>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>
                  {typeStyles[detailItem.type]?.label || 'History item'} • <FormatTime date={detailItem.clickedAt || detailItem.searchedAt || detailItem.createdAt || detailItem.visitedAt} />
                </p>
                {detailAnalyticsBadge && (
                  <div style={{
                    marginTop: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: detailData.isFallback ? '#fffbeb' : '#f0fdf4',
                    border: `1px solid ${detailData.isFallback ? '#fcd34d' : '#86efac'}`,
                    color: detailData.isFallback ? '#92400e' : '#166534',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}>
                    {detailAnalyticsBadge}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#64748b',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#f1f5f9' }}>
                <img
                  src={detailData.image || detailItem.details?.image || detailItem.image || DEFAULT_HISTORY_IMAGE}
                  alt={detailData.name || detailItem.details?.name || detailItem.name || 'Item'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              <div style={{ padding: '14px 18px 20px' }}>
                {detailData.grade && detailData.aiScore != null && (
                  <HistoryGradeBanner grade={detailData.grade} aiScore={detailData.aiScore} />
                )}

                <div style={{ marginBottom: '10px' }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: '0 0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    🏷️ {detailData.cuisine || 'Restaurant'} • {detailData.priceRange || '$$'}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    📍 {detailData.location || DEFAULT_LOCATION}
                  </p>
                </div>

                {Number.isFinite(Number(detailData.rating)) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    borderTop: '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: '10px',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>⭐</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                          {Number(detailData.rating).toFixed(1)} / 5
                        </p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                          {(detailData.reviews || 0).toLocaleString()} public reviews
                        </p>
                      </div>
                    </div>
                    {userLocation && detailData.lat && detailData.lng && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                          {distanceKm(userLocation.lat, userLocation.lng, detailData.lat, detailData.lng).toFixed(1)} km
                        </p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>from you</p>
                      </div>
                    )}
                  </div>
                )}

                {detailItem.type === 'compared' && (detailData.leftDetails || detailData.rightDetails) && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    marginBottom: '12px',
                  }}>
                    {[detailData.leftDetails, detailData.rightDetails].filter(Boolean).map((side, index) => (
                      <div key={`comparison-side-${index}`} style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                          {index === 0 ? 'Left pick' : 'Right pick'}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{side.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{side.location}</div>
                        {side.rating != null && (
                          <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, marginTop: '4px' }}>
                            ★ {Number(side.rating).toFixed(1)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {detailData.sentimentData ? (
                  <HistorySentimentPanel
                    details={detailData.details || detailItem.details}
                    sentimentData={detailData.sentimentData}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(detailItem.type === 'searched' || detailItem.type === 'search_click') && detailItem.resultCount != null && (
                      <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                          {detailItem.type === 'search_click' ? 'Results Shown' : 'Results Found'}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{detailItem.resultCount}</div>
                      </div>
                    )}
                    {detailItem.type === 'search_click' && detailItem.position != null && (
                      <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Clicked Position</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>#{detailItem.position}</div>
                      </div>
                    )}
                    {!detailItem.details && (
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                        This history entry does not include a saved restaurant snapshot. Open the restaurant from Search or Dashboard to capture full AI analysis.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;

export const generateFallbackReviewData = (sentimentData = {}, place = {}, source = 'google_places_aggregator') => {
  const rawRating = place?.rating != null ? Number(place.rating) : NaN;
  const rating = Number.isFinite(rawRating) ? Math.max(0, Math.min(5, rawRating)) : null;
  const score = rating != null ? Math.round(rating * 20) : 60;
  const positive = rating != null
    ? score
    : Number.isFinite(sentimentData.positive)
      ? Math.max(0, Math.min(100, Math.round(sentimentData.positive)))
      : 60;
  const negative = rating != null
    ? Math.max(0, Math.min(100, 100 - score))
    : Number.isFinite(sentimentData.negative)
      ? Math.max(0, Math.min(100, Math.round(sentimentData.negative)))
      : 20;
  const neutral = Math.max(0, Math.min(100, 100 - positive - negative));

  const ratingLabel = rating != null
    ? (rating >= 4.5 ? 'Excellent' : rating >= 4.0 ? 'Good' : rating >= 3.0 ? 'Average' : 'Below Average')
    : 'Average';
  const placeName = place?.name || 'this restaurant';
  const ratingText = rating != null ? `${rating.toFixed(1)}-star` : 'available';

  const overview = rating != null
    ? `${placeName} currently holds a ${rating.toFixed(1)}-star average across public review platforms.`
    : `${placeName} is being evaluated using saved rating metadata from your history snapshot.`;

  const verdict = rating != null
    ? `Overall, ${placeName} is considered ${ratingLabel.toLowerCase()} based on its ${rating.toFixed(1)}-star public rating.`
    : `${placeName} shows a balanced profile based on the saved rating metadata in this history record.`;

  const qualitySummary = rating != null
    ? `Based on the overall ${ratingText} rating, customers frequently highlight standard operational qualities that align with this score.`
    : 'Based on the available rating metadata, customers generally describe a consistent day-to-day experience.';

  const sections = [
    {
      type: 'overview',
      label: 'Overview',
      text: overview,
    },
    {
      type: 'food',
      icon: '🍽️',
      label: 'Food & Taste',
      framing: 'Regarding the menu and dishes...',
      text: `${qualitySummary} Guests often mention dependable flavors and menu choices that match expectations for this rating tier.`,
    },
    {
      type: 'ambiance',
      icon: '✨',
      label: 'Ambiance',
      framing: 'On the atmosphere and setting...',
      text: `${qualitySummary} The dining environment is typically described as comfortable and suitable for the restaurant category.`,
    },
    {
      type: 'service',
      icon: '🧑‍🍳',
      label: 'Service & Value',
      framing: 'In terms of service and overall hospitality...',
      text: `${qualitySummary} Service pace and hospitality are generally viewed as fair for the price point and overall experience.`,
    },
    {
      type: 'verdict',
      label: 'Verdict',
      text: verdict,
    },
  ];

  const publicReviewCount = Number.isFinite(sentimentData.reviewCount)
    ? sentimentData.reviewCount
    : Number.isFinite(place?.reviews)
      ? place.reviews
      : Number.isFinite(place?.userRatingsTotal)
        ? place.userRatingsTotal
        : 0;

  const insight = sentimentData.insight || (rating != null
    ? `Smart analytics for ${placeName} are derived from a ${rating.toFixed(1)}-star public rating snapshot.`
    : `Smart analytics for ${placeName} are based on saved review metadata from your history record.`);

  return {
    positive,
    neutral,
    negative,
    sentiment: positive,
    reviewCount: publicReviewCount,
    insight,
    naturalReview: null,
    aiOverview: overview,
    aiVerdict: verdict,
    naturalReviewSections: sections,
    source,
    model: 'google_places_aggregator',
    isFallback: true,
    loading: false,
  };
};

export const reportSentimentFallback = async (payload = {}) => {
  try {
    await fetch('/api/sentiment/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        errorType: payload.errorType || 'sentiment_fetch_failure',
        message: payload.message || 'Sentiment fetch failed and fallback data was used.',
        placeId: payload.placeId || null,
        placeName: payload.placeName || null,
        source: payload.source || null,
        model: payload.model || null,
        details: payload.details || null,
      }),
    });
  } catch (err) {
    console.warn('Failed to report sentiment fallback telemetry:', err);
  }
};

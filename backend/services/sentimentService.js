const vader = require('vader-sentiment');
const { analyzeWithAI } = require('./aiSentimentService');

const classify = (compound) => {
  if (compound >= 0.05) return 'positive';
  if (compound <= -0.05) return 'negative';
  return 'neutral';
};

const toPercentages = (counts) => {
  const total = counts.positive + counts.negative + counts.neutral;
  if (total <= 0) return { positive: 0, negative: 0, neutral: 0 };

  const raw = [
    { key: 'positive', value: (counts.positive / total) * 100 },
    { key: 'negative', value: (counts.negative / total) * 100 },
    { key: 'neutral',  value: (counts.neutral / total) * 100 },
  ];

  const base = { positive: 0, negative: 0, neutral: 0 };
  const fractions = [];
  let sumFloors = 0;

  raw.forEach((item) => {
    const floored = Math.floor(item.value);
    base[item.key] = floored;
    sumFloors += floored;
    fractions.push({ key: item.key, frac: item.value - floored });
  });

  let remaining = 100 - sumFloors;
  fractions.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remaining; i += 1) base[fractions[i % fractions.length].key] += 1;

  return base;
};

// VADER-only analysis (synchronous, used as fallback) — returns labelledResults too
const analyzeWithVADER = (reviews) => {
  const counts = { positive: 0, negative: 0, neutral: 0 };
  const labelledResults = [];
  reviews.forEach((text) => {
    const reviewText = typeof text === 'string' ? text : String(text ?? '');
    const scores = vader.SentimentIntensityAnalyzer.polarity_scores(reviewText);
    const label = classify(scores.compound);
    counts[label] += 1;
    labelledResults.push({ label });
  });
  return { ...toPercentages(counts), labelledResults, modelUsed: 'vader' };
};

/**
 * Analyze reviews using RoBERTa AI model (primary) with VADER as fallback.
 * Returns { positive, neutral, negative, labelledResults, modelUsed }
 */
const analyzeReviews = async (reviews) => {
  try {
    return await analyzeWithAI(reviews);
  } catch (err) {
    console.warn('[Sentiment] AI model unavailable, falling back to VADER:', err.message);
    return analyzeWithVADER(reviews);
  }
};

module.exports = { analyzeReviews };



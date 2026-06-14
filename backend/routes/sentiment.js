const express = require('express');
const { analyzeReviews } = require('../services/sentimentService');
const { generateNaturalReview } = require('../services/aiSentimentService');
const { scrapeGoogleMapsReviews } = require('../services/googleReviewsScraper');

const router = express.Router();

// Generate a human-readable insight from sentiment percentages
const generateInsight = ({ positive, neutral, negative }) => {
  if (positive >= 85) return 'Customers are overwhelmingly happy here — exceptional food and service consistently praised.';
  if (positive >= 70) return 'Strong positive reviews. Most customers enjoy the food and atmosphere; minor service complaints noted.';
  if (positive >= 55) return 'Generally well-liked but some inconsistency. Customers enjoy the menu but mention occasional service issues.';
  if (negative >= 55) return 'Mostly negative reviews. Customers frequently report disappointing experiences with food and service.';
  if (negative >= 40) return 'Mixed reception — recurring complaints about food quality or service speed worth considering before visiting.';
  return 'Balanced reception. Customer experiences vary widely — the restaurant has both fans and critics.';
};

// POST /api/sentiment
// Body: { placeId?, placeName?, address?, reviews? }
// - Scrapes Google Maps for real reviews (up to 100), then runs RoBERTa AI
// - Falls back to client-provided reviews (Places API, max 5) if scraping fails
// - Falls back to VADER if RoBERTa model hasn't downloaded yet
// - Public endpoint — no auth required
router.post('/', async (req, res) => {
  const { reviews: providedReviews, placeId, placeName, address } = req.body || {};

  let reviewTexts = [];
  let dataSource = 'ai';

  // ── Try scraping Google Maps first ──
  if (placeId || placeName) {
    try {
      const scraped = await scrapeGoogleMapsReviews(
        { placeId, placeName, address: address || '' },
        100, // request up to 100 reviews
      );
      if (scraped.length > 0) {
        reviewTexts = scraped;
        dataSource = 'google_scrape+ai';
        console.log(`[Sentiment] Using ${scraped.length} scraped reviews`);
      }
    } catch (scrapeErr) {
      console.warn('[Sentiment] Scraping failed, falling back to provided reviews:', scrapeErr.message);
    }
  }

  // ── Fall back to client-provided reviews if scraping got nothing ──
  if (reviewTexts.length === 0 && Array.isArray(providedReviews) && providedReviews.length > 0) {
    reviewTexts = providedReviews
      .filter((r) => typeof r === 'string' && r.trim().length > 0)
      .map((r) => r.trim().slice(0, 512));
    dataSource = 'places_api+ai';
  }

  if (reviewTexts.length === 0) {
    return res.status(400).json({ msg: 'No reviews available for analysis. Provide reviews[] or a placeId/placeName.' });
  }

  try {
    const result = await analyzeReviews(reviewTexts);

    // Generate a structured review ({ text, sections })
    let naturalReview = null;
    let naturalReviewSections = null;
    let aiOverview = null;
    let aiVerdict = null;

    try {
      const reviewResult = await generateNaturalReview(
        placeName || 'this restaurant',
        reviewTexts,
        result,
      );
      // reviewResult is { text, sections } from extractiveSummary
      if (reviewResult && typeof reviewResult === 'object' && reviewResult.sections) {
        naturalReview = reviewResult.text;
        naturalReviewSections = reviewResult.sections;
        aiOverview = reviewResult.sections.find((section) => section.type === 'overview')?.text || reviewResult.text;
        aiVerdict = reviewResult.sections.find((section) => section.type === 'verdict')?.text || reviewResult.text;
      } else {
        naturalReview = reviewResult; // plain string fallback
        aiOverview = String(reviewResult);
        aiVerdict = String(reviewResult);
      }
    } catch (genErr) {
      console.error('[Sentiment] Natural review generation failed:', genErr.message);
    }

    // Reflect which engine was actually used (AI vs VADER fallback)
    const engineSuffix = result.modelUsed === 'vader' ? 'vader' : 'roberta';
    const finalSource = dataSource.replace('+ai', `+${engineSuffix}`);
    const isFallback = result.modelUsed === 'vader' || !naturalReviewSections;

    return res.json({
      positive: result.positive,
      neutral: result.neutral,
      negative: result.negative,
      sentiment: result.positive,
      reviewCount: reviewTexts.length,
      insight: generateInsight(result),
      naturalReview,
      aiOverview,
      aiVerdict,
      naturalReviewSections,
      source: finalSource,
      model: result.modelUsed,
      isFallback,
    });
  } catch (err) {
    console.error('Sentiment analysis error:', err.message);
    return res.status(500).json({ msg: 'Sentiment analysis failed' });
  }
});

router.post('/error-report', async (req, res) => {
  const {
    errorType,
    message,
    placeId,
    placeName,
    source,
    model,
    details,
  } = req.body || {};

  console.warn('[Sentiment] Fallback telemetry report:', {
    errorType,
    message,
    placeId,
    placeName,
    source,
    model,
    details,
  });

  return res.status(204).send();
});

module.exports = router;


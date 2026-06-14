const express = require('express');
const protectRoute = require('../middleware/auth');
const { analyzeReviews } = require('../services/sentimentService');
const { generateNaturalReview } = require('../services/aiSentimentService');
const { scrapeGoogleMapsReviews } = require('../services/googleReviewsScraper');
const { createSystemNotification } = require('../routes/notification');

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
// - Protected endpoint for authenticated users
router.post('/sentiment', protectRoute, async (req, res) => {
  try {
    const {
      placeId,
      placeName,
      name,
      address,
      reviews: providedReviews,
    } = req.body || {};

    const finalRestaurantName = placeName || name || 'Selected Restaurant';

    let reviewTexts = [];
    let dataSource = 'ai';

    // 1. Core Scraper and AI Processing Execution Block Runs First
    if (placeId || placeName) {
      try {
        const scraped = await scrapeGoogleMapsReviews(
          { placeId, placeName, address: address || '' },
          100,
        );
        if (Array.isArray(scraped) && scraped.length > 0) {
          reviewTexts = scraped;
          dataSource = 'google_scrape+ai';
        }
      } catch (scrapeErr) {
        console.warn('[Sentiment] Scraping failed, falling back to provided reviews:', scrapeErr.message);
      }
    }

    if (reviewTexts.length === 0 && Array.isArray(providedReviews) && providedReviews.length > 0) {
      reviewTexts = providedReviews
        .filter((r) => typeof r === 'string' && r.trim().length > 0)
        .map((r) => r.trim().slice(0, 512));
      dataSource = 'places_api+ai';
    }

    if (reviewTexts.length === 0) {
      return res.status(400).json({ msg: 'No reviews available for analysis. Provide reviews[] or a placeId/placeName.' });
    }

    const result = await analyzeReviews(reviewTexts);

    let naturalReview = null;
    let naturalReviewSections = null;
    let aiOverview = null;
    let aiVerdict = null;

    try {
      const reviewResult = await generateNaturalReview(
        finalRestaurantName,
        reviewTexts,
        result,
      );
      if (reviewResult && typeof reviewResult === 'object' && reviewResult.sections) {
        naturalReview = reviewResult.text;
        naturalReviewSections = reviewResult.sections;
        aiOverview = reviewResult.sections.find((section) => section.type === 'overview')?.text || reviewResult.text;
        aiVerdict = reviewResult.sections.find((section) => section.type === 'verdict')?.text || reviewResult.text;
      } else {
        naturalReview = reviewResult;
        aiOverview = String(reviewResult);
        aiVerdict = String(reviewResult);
      }
    } catch (genErr) {
      console.error('[Sentiment] Natural review generation failed:', genErr.message);
    }

    const engineSuffix = result.modelUsed === 'vader' ? 'vader' : 'roberta';
    const finalSource = dataSource.replace('+ai', `+${engineSuffix}`);
    const isFallback = result.modelUsed === 'vader' || !naturalReviewSections;

    // 2. IMMEDIATE INJECTION BEFORE RESPONSE DELIVERY
    if (req.user && req.user.id) {
      try {
        const countProcessed = result?.reviewCount || (providedReviews && providedReviews.length) || reviewTexts.length || 0;
        const notificationMessage = `RoBERTa AI analysis for '${finalRestaurantName}' is ready! ${countProcessed} new reviews processed.`;

        console.log(`\n\x1b[32m[NOTIFICATION DEBUG]\x1b[0m Attempting database insert for user: ${req.user.id}`);

        await createSystemNotification(
          req.user.id,
          '✨ AI Scraper Completion',
          notificationMessage,
          'ai_complete',
          { placeId: placeId || 'Unknown ID', restaurantName: finalRestaurantName }
        );

        console.log(`\x1b[32m[NOTIFICATION SUCCESS]\x1b[0m Row successfully saved to MongoDB.\n`);
      } catch (notiError) {
        console.error(' [Notification Error] Schema insertion failed:', notiError.message);
      }
    }

    const analysis = {
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
    };

    // 3. FINAL ROUTE EXECUTION TERMINATOR (Always placed at the absolute bottom)
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Critical error in sentiment controller handler loop:', error.message);
    return res.status(500).json({ msg: 'Internal system processing fault' });
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


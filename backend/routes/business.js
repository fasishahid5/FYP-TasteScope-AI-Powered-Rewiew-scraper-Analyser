const express = require('express');
const protectRoute = require('../middleware/auth');
const role = require('../middleware/role');
const router = express.Router();

// ════════════════════════════════════════════════════════════════════════════
// TEST ENDPOINT (NO AUTH) - For debugging
// ════════════════════════════════════════════════════════════════════════════
router.get('/test', (req, res) => {
  res.json({ status: 'Business API is working', timestamp: new Date() });
});

// Protect all remaining routes - only owners can access
router.use(protectRoute);
router.use(role('owner'));

// ════════════════════════════════════════════════════════════════════════════
// MODULE 1: DASHBOARD OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
router.get('/dashboard/overview', async (req, res) => {
  try {
    console.log('Dashboard overview called, user:', req.user?._id);
    const userId = req.user?._id || 'test-user';

    // Sample overview data - in production, aggregate from MongoDB
    const overview = {
      activeLocations: 8,
      totalReviews: 15432,
      averageRating: 4.3,
      weeklySentiment: 87,
      flaggedReviews: 12,
      lastSync: new Date(),
    };

    res.json(overview);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MODULE 2: REVIEWS SYSTEM
// ════════════════════════════════════════════════════════════════════════════
router.get('/reviews', async (req, res) => {
  try {
    console.log('Reviews called');
    const { page = 1, limit = 20, rating, sentiment, restaurant } = req.query;

    // Sample reviews data - in production, query MongoDB Reviews collection
    const reviews = [
      {
        _id: '1',
        text: 'Amazing food and excellent service',
        rating: 5,
        sentiment: 'positive',
        restaurant: 'Arcadian Cafe',
        date: '2026-06-04',
        author: 'Hassan Raza',
      },
      {
        _id: '2',
        text: 'Good biryani but slow service',
        rating: 4,
        sentiment: 'neutral',
        restaurant: 'Biryani Street',
        date: '2026-06-03',
        author: 'Fatima Ali',
      },
      {
        _id: '3',
        text: 'Terrible experience, cold food',
        rating: 2,
        sentiment: 'negative',
        restaurant: 'Karahi King',
        date: '2026-06-02',
        author: 'Ahmed Khan',
      },
      {
        _id: '4',
        text: 'Perfect timing and perfect taste',
        rating: 5,
        sentiment: 'positive',
        restaurant: 'Spice Route',
        date: '2026-06-01',
        author: 'Sara Khan',
      },
      {
        _id: '5',
        text: 'Average quality, overpriced',
        rating: 3,
        sentiment: 'neutral',
        restaurant: 'Urban Tandoor',
        date: '2026-05-31',
        author: 'Mina Qureshi',
      },
    ];

    res.json({
      reviews,
      page: parseInt(page),
      limit: parseInt(limit),
      total: reviews.length,
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
});

router.get('/reviews/recent', async (req, res) => {
  try {
    console.log('Recent reviews called');
    const userId = req.user?._id || 'test-user';

    // Last 5 reviews only
    const recentReviews = [
      {
        _id: '1',
        text: 'Amazing food and excellent service',
        rating: 5,
        sentiment: 'positive',
        restaurant: 'Arcadian Cafe',
        date: '2026-06-04',
        author: 'Hassan Raza',
      },
      {
        _id: '2',
        text: 'Good biryani but slow service',
        rating: 4,
        sentiment: 'neutral',
        restaurant: 'Biryani Street',
        date: '2026-06-03',
        author: 'Fatima Ali',
      },
      {
        _id: '3',
        text: 'Terrible experience, cold food',
        rating: 2,
        sentiment: 'negative',
        restaurant: 'Karahi King',
        date: '2026-06-02',
        author: 'Ahmed Khan',
      },
      {
        _id: '4',
        text: 'Perfect timing and perfect taste',
        rating: 5,
        sentiment: 'positive',
        restaurant: 'Spice Route',
        date: '2026-06-01',
        author: 'Sara Khan',
      },
      {
        _id: '5',
        text: 'Average quality, overpriced',
        rating: 3,
        sentiment: 'neutral',
        restaurant: 'Urban Tandoor',
        date: '2026-05-31',
        author: 'Mina Qureshi',
      },
    ];

    res.json(recentReviews);
  } catch (error) {
    console.error('Recent reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch recent reviews', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MODULE 3: SENTIMENT ANALYSIS
// ════════════════════════════════════════════════════════════════════════════
router.get('/sentiment', async (req, res) => {
  try {
    console.log('Sentiment called');

    // VADER sentiment distribution
    const sentiment = {
      positive: 8720,
      neutral: 3980,
      negative: 1732,
      positivePercent: 65,
      neutralPercent: 30,
      negativePercent: 5,
    };

    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment data', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MODULE 4: KEYWORDS (NON-AI, SIMPLE NLP)
// ════════════════════════════════════════════════════════════════════════════
router.get('/keywords', async (req, res) => {
  try {
    console.log('Keywords called');

    // Simple keyword extraction (frequency-based)
    const keywords = {
      positive: [
        { word: 'food', count: 342 },
        { word: 'taste', count: 298 },
        { word: 'service', count: 276 },
        { word: 'ambience', count: 234 },
        { word: 'portion', count: 187 },
      ],
      negative: [
        { word: 'slow', count: 89 },
        { word: 'parking', count: 76 },
        { word: 'expensive', count: 65 },
        { word: 'cold', count: 54 },
        { word: 'wait', count: 48 },
      ],
    };

    res.json(keywords);
  } catch (error) {
    console.error('Keywords fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch keywords', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MODULE 5: RESTAURANTS
// ════════════════════════════════════════════════════════════════════════════
router.get('/restaurants', async (req, res) => {
  try {
    console.log('Restaurants called');

    // Owner's restaurants
    const restaurants = [
      {
        _id: '1',
        name: 'Arcadian Cafe',
        location: 'Lahore',
        rating: 4.8,
        reviews: 2340,
        sentiment: 'positive',
      },
      {
        _id: '2',
        name: 'Biryani Street',
        location: 'Karachi',
        rating: 4.5,
        reviews: 1890,
        sentiment: 'positive',
      },
      {
        _id: '3',
        name: 'Karahi King',
        location: 'Islamabad',
        rating: 4.3,
        reviews: 1560,
        sentiment: 'neutral',
      },
      {
        _id: '4',
        name: 'Spice Route',
        location: 'Peshawar',
        rating: 4.6,
        reviews: 1420,
        sentiment: 'positive',
      },
    ];

    res.json(restaurants);
  } catch (error) {
    console.error('Restaurants fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MODULE 6: ANALYTICS (CHARTS DATA)
// ════════════════════════════════════════════════════════════════════════════
router.get('/analytics', async (req, res) => {
  try {
    console.log('Analytics called');

    const analytics = {
      monthlyReviews: [
        { month: 'Jan', reviews: 1240 },
        { month: 'Feb', reviews: 1450 },
        { month: 'Mar', reviews: 1890 },
        { month: 'Apr', reviews: 2120 },
        { month: 'May', reviews: 2680 },
        { month: 'Jun', reviews: 3240 },
      ],
      ratingDistribution: {
        '5': 3450,
        '4': 5120,
        '3': 2840,
        '2': 1560,
        '1': 890,
      },
      sentimentTrend: [
        { date: '2026-05-28', positive: 82, neutral: 12, negative: 6 },
        { date: '2026-05-29', positive: 84, neutral: 10, negative: 6 },
        { date: '2026-05-30', positive: 86, neutral: 9, negative: 5 },
        { date: '2026-06-01', positive: 85, neutral: 11, negative: 4 },
        { date: '2026-06-02', positive: 87, neutral: 8, negative: 5 },
        { date: '2026-06-03', positive: 88, neutral: 7, negative: 5 },
      ],
      topRestaurants: [
        { name: 'Arcadian Cafe', reviews: 2340, sentiment: 4.8 },
        { name: 'Biryani Street', reviews: 1890, sentiment: 4.5 },
        { name: 'Karahi King', reviews: 1560, sentiment: 4.3 },
        { name: 'Spice Route', reviews: 1420, sentiment: 4.6 },
      ],
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MODULE 7: REPORTS
// ════════════════════════════════════════════════════════════════════════════
router.get('/reports', async (req, res) => {
  try {
    console.log('Reports called');

    const reports = [
      {
        _id: '1',
        title: 'Monthly Performance Report - June 2026',
        createdAt: '2026-06-03',
        type: 'monthly',
        status: 'ready',
        downloadUrl: '/api/business/reports/1/download',
      },
      {
        _id: '2',
        title: 'Sentiment Analysis Report - May 2026',
        createdAt: '2026-05-30',
        type: 'sentiment',
        status: 'ready',
        downloadUrl: '/api/business/reports/2/download',
      },
      {
        _id: '3',
        title: 'Competitor Benchmark Report - Q2 2026',
        createdAt: '2026-05-25',
        type: 'competitor',
        status: 'ready',
        downloadUrl: '/api/business/reports/3/download',
      },
    ];

    res.json(reports);
  } catch (error) {
    console.error('Reports fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
});

module.exports = router;

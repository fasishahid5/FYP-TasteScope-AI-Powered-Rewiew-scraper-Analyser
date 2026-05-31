const { scrapeReviews } = require('../services/reviewScraper');
const { analyzeReviews } = require('../services/sentimentService');

const scrape = async (req, res) => {
  const { businessName, platform, businessUrl, reviewCount } = req.body || {};

  try {
    const reviews = await scrapeReviews({ businessName, platform, businessUrl, reviewCount });
    return res.json(reviews);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

const analyze = async (req, res) => {
  const { reviews } = req.body || {};

  if (!Array.isArray(reviews)) {
    return res.status(400).json({ msg: 'reviews must be an array of strings' });
  }

  try {
    const result = analyzeReviews(reviews);
    return res.json(result);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  scrape,
  analyze,
};


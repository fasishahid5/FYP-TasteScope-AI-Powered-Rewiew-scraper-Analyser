const DEFAULT_REVIEWS = [
  'Great food and service',
  'Staff was rude',
  'Best restaurant in town',
  'The ambience was nice and cozy',
  'Would not recommend, very slow service',
  'Amazing experience, will come again',
];

const coerceCount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_REVIEWS.length;
  return Math.max(1, Math.min(500, Math.floor(n)));
};

const scrapeReviews = async ({ reviewCount }) => {
  const count = coerceCount(reviewCount);
  const reviews = [];

  for (let i = 0; i < count; i += 1) {
    reviews.push(DEFAULT_REVIEWS[i % DEFAULT_REVIEWS.length]);
  }

  return reviews;
};

module.exports = {
  scrapeReviews,
};


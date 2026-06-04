const { scrapeGoogleMapsReviews } = require('../services/googleReviewsScraper');

// Test with a well-known Islamabad restaurant that has a claimed listing
(async () => {
  const places = [
    { placeId: 'ChIJE1P7dqQmHSkRFfQqJAmpL-k', placeName: 'Monal Restaurant', address: 'Islamabad' },
    { placeId: 'ChIJ0xGwawDt3zgR18atvXIHRHI', placeName: 'HOT N CHEESES', address: 'Islamabad' },
  ];

  for (const place of places) {
    console.log(`\n=== Testing: ${place.placeName} ===`);
    const reviews = await scrapeGoogleMapsReviews(place, 10);
    console.log(`Result: ${reviews.length} reviews`);
    if (reviews.length > 0) {
      reviews.slice(0, 3).forEach((r, i) => console.log(`[${i+1}] ${r.slice(0, 100)}`));
    }
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });


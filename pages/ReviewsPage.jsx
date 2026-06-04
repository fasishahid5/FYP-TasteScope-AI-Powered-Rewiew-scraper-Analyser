import React, { useState, useEffect } from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import RestaurantCard from '../components/RestaurantCard';

const sentimentMap = {
  'positive': 'Positive',
  'neutral': 'Neutral',
  'negative': 'Negative',
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/business/reviews', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err.message);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((review) =>
    review.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByRestaurant = reviews.reduce((acc, review) => {
    if (!acc[review.restaurant]) acc[review.restaurant] = [];
    acc[review.restaurant].push(review);
    return acc;
  }, {});

  return (
    <BusinessOwnerLayout
      activeItem="reviews"
      pageTitle="Reviews"
      pageDescription="See customer feedback, sentiment badges, and ratings in one place."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Review management</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Search, filter, and act on reviews from across your locations.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search review"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: '240px', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }}
            />
            <button
              type="button"
              style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid #2563eb', background: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
            >
              Filter reviews
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading reviews...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>{error}</div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>No reviews yet</p>
          </div>
        ) : (
          <>
            <div>
              <h3 style={{ margin: '8px 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>By Restaurant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedByRestaurant).map(([restaurant, rReviews]) => {
                  const avgRating = (rReviews.reduce((sum, r) => sum + r.rating, 0) / rReviews.length).toFixed(1);
                  return (
                    <div
                      key={restaurant}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{restaurant}</h4>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#f97316' }}>★ {avgRating}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{rReviews.length} reviews</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {rReviews.map((r) => (
                          <span
                            key={r._id}
                            style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: r.sentiment === 'positive' ? '#ecfdf5' : r.sentiment === 'neutral' ? '#f8fafc' : '#fee2e2',
                              color: r.sentiment === 'positive' ? '#166534' : r.sentiment === 'neutral' ? '#0f172a' : '#991b1b',
                            }}
                          >
                            {sentimentMap[r.sentiment] || r.sentiment}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      {['User', 'Rating', 'Review Text', 'Restaurant', 'Date', 'Sentiment'].map((title) => (
                        <th key={title} style={{ padding: '16px 12px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((review) => (
                      <tr key={review._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '18px 12px', color: '#0f172a' }}>{review.author}</td>
                        <td style={{ padding: '18px 12px', color: '#0f172a', fontWeight: 700 }}>{review.rating} ★</td>
                        <td style={{ padding: '18px 12px', color: '#475569', maxWidth: '420px', lineHeight: 1.6 }}>{review.text}</td>
                        <td style={{ padding: '18px 12px', color: '#0f172a' }}>{review.restaurant}</td>
                        <td style={{ padding: '18px 12px', color: '#64748b' }}>{new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td style={{ padding: '18px 12px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              borderRadius: '9999px',
                              padding: '10px 14px',
                              fontSize: '13px',
                              fontWeight: 700,
                              background: review.sentiment === 'positive' ? '#ecfdf5' : review.sentiment === 'neutral' ? '#f8fafc' : '#fee2e2',
                              color: review.sentiment === 'positive' ? '#166534' : review.sentiment === 'neutral' ? '#0f172a' : '#991b1b',
                            }}
                          >
                            {sentimentMap[review.sentiment] || review.sentiment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </BusinessOwnerLayout>
  );
};

export default ReviewsPage;

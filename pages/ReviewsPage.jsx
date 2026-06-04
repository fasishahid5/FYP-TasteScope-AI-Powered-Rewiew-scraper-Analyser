import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import RestaurantCard from '../components/RestaurantCard';

const reviewSamples = [
  { id: 1, user: 'Aziz Khan', rating: 5, text: 'Amazing service and the flavors were spot on. Highly recommended!', date: 'Jun 1, 2026', sentiment: 'Positive' },
  { id: 2, user: 'Sana Malik', rating: 4, text: 'Great karahi and fast service, just a little noisy inside.', date: 'May 29, 2026', sentiment: 'Positive' },
  { id: 3, user: 'Hamza Ali', rating: 3, text: 'Food was okay but delivery took longer than expected.', date: 'May 27, 2026', sentiment: 'Neutral' },
  { id: 4, user: 'Ayesha Rauf', rating: 2, text: 'Pizza crust was soggy and the order was missing toppings.', date: 'May 25, 2026', sentiment: 'Negative' },
  { id: 5, user: 'Bilal Shah', rating: 4, text: 'Cozy atmosphere and very friendly staff. Coffee was excellent.', date: 'May 22, 2026', sentiment: 'Positive' },
];

const restaurantSamples = [
  {
    id: 'r1',
    name: 'MEG',
    status: 'Open',
    image: 'https://source.unsplash.com/800x600/?restaurant,dinner',
    rating: 4.8,
    category: 'Restaurant · $$',
    address: '123 Main St, Cityville',
    distance: '7.3 km',
    totalReviews: '10,288 reviews',
    sentiment: 'Negative 58%',
  },
  {
    id: 'r2',
    name: 'La Petite Table',
    status: 'Open',
    image: 'https://source.unsplash.com/800x600/?bistro',
    rating: 4.6,
    category: 'French · $$$',
    address: '45 Rue de Paris',
    distance: '3.2 km',
    totalReviews: '342 reviews',
    sentiment: 'Negative 22%',
  },
  {
    id: 'r3',
    name: 'Saffron House',
    status: 'Closed',
    image: 'https://source.unsplash.com/800x600/?indian-restaurant',
    rating: 4.4,
    category: 'Indian · $$',
    address: '8 Spice Ave',
    distance: '1.1 km',
    totalReviews: '1,204 reviews',
    sentiment: 'Negative 12%',
  },
];

const sentimentStyles = {
  Positive: { background: '#ecfdf5', color: '#166534' },
  Neutral: { background: '#f8fafc', color: '#0f172a' },
  Negative: { background: '#fee2e2', color: '#991b1b' },
};

const ReviewsPage = () => {
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

        <div>
          <h3 style={{ margin: '8px 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Restaurants</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantSamples.map((r) => (
              <div key={r.id} className="px-0">
                <RestaurantCard
                  name={r.name}
                  status={r.status}
                  image={r.image}
                  rating={r.rating}
                  category={r.category}
                  address={r.address}
                  distance={r.distance}
                  totalReviews={r.totalReviews}
                  sentiment={r.sentiment}
                  onPrimaryAction={() => alert(`Primary action for ${r.name}`)}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  {['User', 'Rating', 'Review Text', 'Date', 'Sentiment'].map((title) => (
                    <th key={title} style={{ padding: '16px 12px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviewSamples.map((review) => (
                  <tr key={review.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '18px 12px', color: '#0f172a' }}>{review.user}</td>
                    <td style={{ padding: '18px 12px', color: '#0f172a', fontWeight: 700 }}>{review.rating} ★</td>
                    <td style={{ padding: '18px 12px', color: '#475569', maxWidth: '420px', lineHeight: 1.6 }}>{review.text}</td>
                    <td style={{ padding: '18px 12px', color: '#64748b' }}>{review.date}</td>
                    <td style={{ padding: '18px 12px' }}>
                      <span style={{ display: 'inline-flex', borderRadius: '9999px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, ...sentimentStyles[review.sentiment] }}>
                        {review.sentiment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default ReviewsPage;

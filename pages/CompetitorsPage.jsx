import React, { useState } from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';

const competitorOptions = [
  'Spice Corner',
  'Grill House',
  'Cafe Mosaic',
  'Taste Scope Bistro',
];

const competitorMetrics = {
  'Taste Scope Bistro': { rating: 4.5, reviews: 238, sentiment: '82%' },
  'Spice Corner': { rating: 4.2, reviews: 192, sentiment: '78%' },
  'Grill House': { rating: 4.0, reviews: 171, sentiment: '74%' },
  'Cafe Mosaic': { rating: 4.7, reviews: 254, sentiment: '85%' },
};

const CompetitorsPage = () => {
  const [restaurantA, setRestaurantA] = useState('Taste Scope Bistro');
  const [restaurantB, setRestaurantB] = useState('Spice Corner');

  const statsA = competitorMetrics[restaurantA];
  const statsB = competitorMetrics[restaurantB];

  return (
    <BusinessOwnerLayout
      activeItem="competitors"
      pageTitle="Competitor Comparison"
      pageDescription="Compare your restaurant performance directly against competitors with rating, reviews, and sentiment metrics."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#64748b' }}>Restaurant A</label>
            <select
              value={restaurantA}
              onChange={(event) => setRestaurantA(event.target.value)}
              style={{ padding: '12px 14px', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none', minWidth: '220px' }}
            >
              {competitorOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>VS</div>
          <div style={{ display: 'grid', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#64748b' }}>Restaurant B</label>
            <select
              value={restaurantB}
              onChange={(event) => setRestaurantB(event.target.value)}
              style={{ padding: '12px 14px', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none', minWidth: '220px' }}
            >
              {competitorOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
          {[
            { label: 'Rating', valueA: statsA.rating, valueB: statsB.rating, unit: '★' },
            { label: 'Reviews', valueA: statsA.reviews, valueB: statsB.reviews, unit: '' },
            { label: 'Sentiment', valueA: statsA.sentiment, valueB: statsB.sentiment, unit: '' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{item.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>{item.valueA}{item.unit}</p>
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>{restaurantA}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 800 }}>{item.valueB}{item.unit}</p>
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>{restaurantB}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Bar Chart</h3>
            <div style={{ marginTop: '22px', display: 'grid', gap: '18px' }}>
              {['Rating', 'Reviews', 'Sentiment'].map((metric, index) => {
                const valueA = [statsA.rating * 20, statsA.reviews / 3, parseInt(statsA.sentiment, 10)][index];
                const valueB = [statsB.rating * 20, statsB.reviews / 3, parseInt(statsB.sentiment, 10)][index];
                return (
                  <div key={metric} style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                      <span>{metric}</span>
                      <span>{Math.round(valueA)} / {Math.round(valueB)}</span>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: `${Math.min(valueA, 100)}%`, height: '10px', borderRadius: '9999px', background: '#2563eb' }} />
                        <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '9999px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: `${Math.min(valueB, 100)}%`, height: '10px', borderRadius: '9999px', background: '#f97316' }} />
                        <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Radar Chart</h3>
            <div style={{ marginTop: '24px', display: 'grid', placeItems: 'center', minHeight: '320px' }}>
              <div style={{ width: '260px', height: '260px', borderRadius: '50%', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'grid', placeItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Radar chart placeholder</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default CompetitorsPage;

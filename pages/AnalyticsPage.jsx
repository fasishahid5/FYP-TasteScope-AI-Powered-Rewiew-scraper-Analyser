import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import { useRestaurants } from '../lib/useRestaurants';

const AnalyticsPage = () => {
  const { restaurants: restaurantsData = [] } = useRestaurants();
  const totalReviews = restaurantsData.reduce((sum, r) => sum + (r.reviews || 0), 0);
  const averageRating = restaurantsData.length
    ? (restaurantsData.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurantsData.length).toFixed(1)
    : '0.0';
  const positive = restaurantsData.filter((r) => (r.sentiment || 0) >= 80).length;
  const negative = restaurantsData.filter((r) => (r.sentiment || 0) <= 70).length;

  return (
    <BusinessOwnerLayout
      activeItem="analytics"
      pageTitle="Analytics"
      pageDescription="Track review sentiment, rating distribution, and performance trends across your restaurant portfolio."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Reviews</p>
            <p style={{ margin: '14px 0 0', fontSize: '34px', fontWeight: 800, color: '#0f172a' }}>{totalReviews.toLocaleString()}</p>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Average Rating</p>
            <p style={{ margin: '14px 0 0', fontSize: '34px', fontWeight: 800, color: '#0f172a' }}>{averageRating}</p>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Positive Locations</p>
            <p style={{ margin: '14px 0 0', fontSize: '34px', fontWeight: 800, color: '#0f172a' }}>{positive}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Sentiment overview</h2>
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
              {['Positive', 'Neutral', 'Negative'].map((label, index) => {
                const value = label === 'Positive' ? 52 : label === 'Neutral' ? 28 : 20;
                const color = label === 'Positive' ? '#22c55e' : label === 'Neutral' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
                    <div style={{ height: '12px', width: '100%', borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: color }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Rating distribution</h2>
            <div style={{ marginTop: '24px', display: 'grid', gap: '14px' }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const value = star === 5 ? 28 : star === 4 ? 24 : star === 3 ? 18 : star === 2 ? 16 : 14;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '24px', fontSize: '13px', color: '#475569' }}>{star}★</span>
                    <div style={{ flex: 1, height: '10px', borderRadius: '9999px', background: '#eff6ff', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: '#2563eb' }} />
                    </div>
                    <span style={{ width: '42px', textAlign: 'right', fontSize: '13px', color: '#475569' }}>{value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Review trend</h2>
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'flex-end', gap: '12px', minHeight: '180px' }}>
              {[72, 82, 74, 88, 93, 86, 98].map((value, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: `${value}px`, borderRadius: '14px 14px 0 0', background: '#2563eb' }} />
                  <span style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>WK {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Quick KPI snapshot</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginTop: '24px' }}>
              <div style={{ background: '#eff6ff', borderRadius: '18px', padding: '18px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#2563eb' }}>Customer satisfaction</p>
                <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>86%</p>
              </div>
              <div style={{ background: '#fef3c7', borderRadius: '18px', padding: '18px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>Response time</p>
                <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>18m</p>
              </div>
              <div style={{ background: '#ecfdf5', borderRadius: '18px', padding: '18px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>Repeat visits</p>
                <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>41%</p>
              </div>
              <div style={{ background: '#ede9fe', borderRadius: '18px', padding: '18px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#5b21b6' }}>Open tickets</p>
                <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default AnalyticsPage;

import React from 'react';
import AdminLayout from '../components/AdminLayout';

const reviews = [
  { id: 1, review: 'Excellent flavors and fast service.', rating: 5, sentiment: 'Positive', date: 'Jun 3, 2026' },
  { id: 2, review: 'Good food but the order arrived late.', rating: 3, sentiment: 'Neutral', date: 'Jun 2, 2026' },
  { id: 3, review: 'Poor packaging and slow delivery.', rating: 2, sentiment: 'Negative', date: 'May 29, 2026' },
];

const ReviewsManagement = () => (
  <AdminLayout
    pageTitle="Reviews Management"
    pageDescription="Monitor and moderate customer reviews across the platform."
  >
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Reviews</h2>
        <p style={{ margin: '10px 0 0', color: '#64748b' }}>Review content, rating, sentiment, and moderation actions.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '16px 12px' }}>Review</th>
              <th style={{ padding: '16px 12px' }}>Rating</th>
              <th style={{ padding: '16px 12px' }}>Sentiment</th>
              <th style={{ padding: '16px 12px' }}>Date</th>
              <th style={{ padding: '16px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px', color: '#0f172a' }}>{item.review}</td>
                <td style={{ padding: '16px 12px', color: '#475569', fontWeight: 700 }}>{item.rating}</td>
                <td style={{ padding: '16px 12px', color: item.sentiment === 'Positive' ? '#166534' : item.sentiment === 'Negative' ? '#b45309' : '#0f172a', fontWeight: 700 }}>{item.sentiment}</td>
                <td style={{ padding: '16px 12px', color: '#64748b' }}>{item.date}</td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" style={{ borderRadius: '14px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>View</button>
                    <button type="button" style={{ borderRadius: '14px', background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
);

export default ReviewsManagement;

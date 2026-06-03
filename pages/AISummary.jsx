import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';

const strengthCards = [
  { title: 'Food Quality', description: 'Dishes are consistently praised for flavor, presentation and freshness.' },
  { title: 'Staff Behaviour', description: 'Staff are described as friendly, attentive, and professional.' },
  { title: 'Cleanliness', description: 'Dining areas and restrooms receive strong cleanliness feedback.' },
];

const improvementCards = [
  { title: 'Parking', description: 'Customers often mention limited parking and crowded entry.' },
  { title: 'Waiting Time', description: 'Peak hours have longer wait times that may hurt satisfaction.' },
  { title: 'Service Speed', description: 'Front-of-house service could be faster during busy shifts.' },
];

const AISummary = () => (
  <BusinessOwnerLayout
    activeItem="ai-summary"
    pageTitle="AI Summary"
    pageDescription="AI-generated summary of strengths, customer sentiment, and improvement areas."
  >
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', display: 'grid', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Summary</p>
        <blockquote style={{ margin: 0, padding: '22px 24px', borderRadius: '24px', background: '#f8fafc', color: '#0f172a', fontSize: '18px', lineHeight: 1.8, borderLeft: '4px solid #2563eb' }}>
          Customers love food quality and ambience.
        </blockquote>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Strengths</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
            {strengthCards.map((item) => (
              <div key={item.title} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{item.title}</p>
                <p style={{ margin: '12px 0 0', fontSize: '15px', color: '#0f172a', lineHeight: 1.7 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Improvement Areas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
            {improvementCards.map((item) => (
              <div key={item.title} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '22px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{item.title}</p>
                <p style={{ margin: '12px 0 0', fontSize: '15px', color: '#0f172a', lineHeight: 1.7 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </BusinessOwnerLayout>
);

export default AISummary;

import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const positiveKeywords = ['Taste', 'Delicious', 'Friendly Staff'];
const negativeKeywords = ['Slow Service', 'Parking', 'Waiting'];
const keywordFrequency = [
  { term: 'Taste', value: 86 },
  { term: 'Delicious', value: 72 },
  { term: 'Friendly Staff', value: 64 },
  { term: 'Slow Service', value: 44 },
  { term: 'Parking', value: 36 },
  { term: 'Waiting', value: 29 },
];

const KeywordsPage = () => (
  <BusinessOwnerLayout
    activeItem="keywords"
    pageTitle="Keyword Insights"
    pageDescription="Track positive and negative keyword trends, frequency, and word cloud sentiment across your customer feedback."
  >
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Positive Keywords</h3>
          <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
            {positiveKeywords.map((term) => (
              <div key={term} style={{ padding: '18px', background: '#ecfdf5', borderRadius: '20px', color: '#166534', fontWeight: 700 }}>{term}</div>
            ))}
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Negative Keywords</h3>
          <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
            {negativeKeywords.map((term) => (
              <div key={term} style={{ padding: '18px', background: '#fee2e2', borderRadius: '20px', color: '#991b1b', fontWeight: 700 }}>{term}</div>
            ))}
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Keyword Frequency</h3>
          <div style={{ marginTop: '20px', display: 'grid', gap: '16px' }}>
            {keywordFrequency.map((item) => (
              <div key={item.term} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontSize: '14px' }}>{item.term}</span>
                <div style={{ width: '100%', minWidth: '120px', height: '12px', borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ width: `${item.value}%`, height: '100%', borderRadius: '9999px', background: item.value > 60 ? '#2563eb' : '#a855f7' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', minHeight: '420px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Word Cloud</h3>
          <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            {['Taste', 'Delicious', 'Friendly Staff', 'Slow Service', 'Parking', 'Waiting', 'Ambience', 'Fresh', 'Value'].map((word, index) => (
              <span
                key={word}
                style={{
                  padding: `${12 + (index % 3) * 4}px ${16 + (index % 4) * 6}px`,
                  borderRadius: '9999px',
                  background: index % 2 === 0 ? '#eff6ff' : '#f0f9ff',
                  color: '#1e3a8a',
                  fontSize: `${14 + (index % 4) * 2}px`,
                  fontWeight: 700,
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', minHeight: '200px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Frequency Chart</h3>
            <div style={{ marginTop: '20px', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordFrequency} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="term" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', minHeight: '180px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Insights</h3>
            <p style={{ margin: '16px 0 0', color: '#475569', lineHeight: 1.8 }}>Positive keywords are driving traffic, while slow service and parking remain the top issues to address in customer feedback.</p>
          </div>
        </div>
      </div>
    </div>
  </BusinessOwnerLayout>
);

export default KeywordsPage;

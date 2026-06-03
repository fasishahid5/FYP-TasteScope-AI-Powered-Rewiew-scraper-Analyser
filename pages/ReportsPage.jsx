import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';

const reportCards = [
  { title: 'Weekly Report', value: '7-Day snapshot', description: 'Orders, ratings, and sentiment from the last week.' },
  { title: 'Monthly Report', value: '30-Day overview', description: 'Trends, review themes, and performance changes over the month.' },
  { title: 'Quarterly Report', value: '90-Day summary', description: 'Executive-level insights and long-term growth signals.' },
];

const reportHistory = [
  { id: 1, name: 'Weekly Report', generated: 'Jun 1, 2026', status: 'Ready' },
  { id: 2, name: 'Monthly Report', generated: 'May 28, 2026', status: 'Downloaded' },
  { id: 3, name: 'Quarterly Report', generated: 'Apr 30, 2026', status: 'Ready' },
  { id: 4, name: 'Competitor Analysis', generated: 'Apr 15, 2026', status: 'Archived' },
];

const ReportsPage = () => (
  <BusinessOwnerLayout
    activeItem="reports"
    pageTitle="Reports"
    pageDescription="Generate business reports, download PDFs, and review your report history."
  >
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
        {reportCards.map((card) => (
          <div key={card.title} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{card.title}</p>
              <p style={{ margin: '14px 0 0', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{card.value}</p>
            </div>
            <p style={{ margin: '18px 0 0', color: '#475569', lineHeight: 1.7 }}>{card.description}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
        <button type="button" style={{ borderRadius: '16px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '14px 20px', fontWeight: 700, cursor: 'pointer' }}>
          Download PDF
        </button>
        <button type="button" style={{ borderRadius: '16px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '14px 20px', fontWeight: 700, cursor: 'pointer' }}>
          Generate Report
        </button>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Report History</h3>
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Report name', 'Generated date', 'Status', 'Action'].map((heading) => (
                  <th key={heading} style={{ textAlign: 'left', padding: '16px 12px', fontSize: '13px', color: '#64748b', fontWeight: 700 }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportHistory.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 12px', color: '#0f172a' }}>{entry.name}</td>
                  <td style={{ padding: '16px 12px', color: '#64748b' }}>{entry.generated}</td>
                  <td style={{ padding: '16px 12px', color: entry.status === 'Ready' ? '#166534' : '#475569', fontWeight: 700 }}>{entry.status}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <button type="button" style={{ borderRadius: '14px', border: '1px solid #2563eb', background: 'transparent', color: '#2563eb', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
                      View
                    </button>
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

export default ReportsPage;

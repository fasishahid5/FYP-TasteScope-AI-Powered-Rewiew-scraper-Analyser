import React from 'react';
import AdminLayout from '../components/AdminLayout';

const pendingRequests = [
  { id: 1, name: 'Ayesha Tariq', business: 'Ayesha Biryani', email: 'ayesha@example.com' },
  { id: 2, name: 'Omar Sheikh', business: 'Karahi King', email: 'omar@example.com' },
  { id: 3, name: 'Sara Javed', business: 'Cafe Zest', email: 'sara@example.com' },
];

const BusinessOwnerRequests = () => (
  <AdminLayout
    pageTitle="Owner Requests"
    pageDescription="Approve or reject pending business owner onboarding requests."
  >
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Pending Requests</h2>
        <p style={{ margin: '10px 0 0', color: '#64748b' }}>Review incoming business owner applications and take action.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '16px 12px' }}>Name</th>
              <th style={{ padding: '16px 12px' }}>Business</th>
              <th style={{ padding: '16px 12px' }}>Email</th>
              <th style={{ padding: '16px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((request) => (
              <tr key={request.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px', color: '#0f172a' }}>{request.name}</td>
                <td style={{ padding: '16px 12px', color: '#475569' }}>{request.business}</td>
                <td style={{ padding: '16px 12px', color: '#475569' }}>{request.email}</td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" style={{ borderRadius: '14px', background: '#22c55e', color: '#ffffff', border: 'none', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
                      Approve
                    </button>
                    <button type="button" style={{ borderRadius: '14px', background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
                      Reject
                    </button>
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

export default BusinessOwnerRequests;

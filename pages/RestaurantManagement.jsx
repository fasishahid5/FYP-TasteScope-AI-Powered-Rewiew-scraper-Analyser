import React from 'react';
import AdminLayout from '../components/AdminLayout';

const restaurants = [
  { id: 1, name: 'Arcadian Cafe', owner: 'Ayesha Tariq', reviews: 324, status: 'Active' },
  { id: 2, name: 'Butt Karahi', owner: 'Omar Sheikh', reviews: 210, status: 'Pending' },
  { id: 3, name: 'KFC Lahore', owner: 'Sara Javed', reviews: 132, status: 'Active' },
];

const RestaurantManagement = () => (
  <AdminLayout
    pageTitle="Restaurant Management"
    pageDescription="View restaurant listings, manage review metrics and take action on restaurants."
  >
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Restaurants</h2>
        <p style={{ margin: '10px 0 0', color: '#64748b' }}>Manage restaurant entries, owners, and review activity.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '16px 12px' }}>Restaurant Name</th>
              <th style={{ padding: '16px 12px' }}>Owner</th>
              <th style={{ padding: '16px 12px' }}>Reviews</th>
              <th style={{ padding: '16px 12px' }}>Status</th>
              <th style={{ padding: '16px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px', color: '#0f172a' }}>{restaurant.name}</td>
                <td style={{ padding: '16px 12px', color: '#475569' }}>{restaurant.owner}</td>
                <td style={{ padding: '16px 12px', color: '#475569' }}>{restaurant.reviews}</td>
                <td style={{ padding: '16px 12px', color: restaurant.status === 'Active' ? '#166534' : '#b45309', fontWeight: 700 }}>{restaurant.status}</td>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" style={{ borderRadius: '14px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>View</button>
                    <button type="button" style={{ borderRadius: '14px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    <button type="button" style={{ borderRadius: '14px', background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
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

export default RestaurantManagement;

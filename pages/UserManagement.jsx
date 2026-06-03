import React from 'react';
import AdminLayout from '../components/AdminLayout';

const users = [
  { id: 1, name: 'Fatima Ali', email: 'Fizza@example.com', role: 'customer', status: 'active' },
  { id: 2, name: 'Bilal Khan', email: 'bilal@example.com', role: 'owner', status: 'pending' },
  { id: 3, name: 'Aisha Noor', email: 'ali@example.com', role: 'customer', status: 'suspended' },
  { id: 4, name: 'Admin', email: 'admin@tastescope.local', role: 'admin', status: 'active' },
];

const ActionButtons = ({ user }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <button type="button" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>View</button>
    <button type="button" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700 }}>Edit</button>
    <button type="button" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #f59e0b', background: '#fffbeb', color: '#b45309', fontWeight: 700 }}>Suspend</button>
    <button type="button" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #ef4444', background: '#fff7f7', color: '#c0262e', fontWeight: 700 }}>Delete</button>
  </div>
);

const UserManagement = () => (
  <AdminLayout
    pageTitle="User Management"
    pageDescription="View, edit, and moderate user accounts across the platform."
  >
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Users</h3>
        <p style={{ marginTop: 8, color: '#64748b' }}>Manage users, change roles, and take moderation actions.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Role</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 12px', color: '#0f172a' }}>{u.name}</td>
                <td style={{ padding: '14px 12px', color: '#475569' }}>{u.email}</td>
                <td style={{ padding: '14px 12px' }}>{u.role}</td>
                <td style={{ padding: '14px 12px', color: u.status === 'active' ? '#166534' : u.status === 'suspended' ? '#b45309' : '#0f172a', fontWeight: 700 }}>{u.status}</td>
                <td style={{ padding: '14px 12px' }}><ActionButtons user={u} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
);

export default UserManagement;

import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import { getStoredUser } from '../lib/auth';

const BusinessProfilePage = () => {
  const user = getStoredUser() || {};
  const businessName = user.businessName || 'Taste Scope Bistro';
  const contactEmail = user.email || 'owner@example.com';
  const contactPhone = user.phone || '+92 300 1234567';
  const address = user.address || '123 Food Street, Lahore, Pakistan';
  const website = user.website || 'https://tastescope.example.com';
  const socialLinks = [
    { label: 'Instagram', url: 'instagram.com/tastescope' },
    { label: 'Facebook', url: 'facebook.com/tastescope' },
    { label: 'LinkedIn', url: 'linkedin.com/company/tastescope' },
  ];
  const initials = businessName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <BusinessOwnerLayout
      activeItem="profile"
      pageTitle="Business Profile"
      pageDescription="Manage your restaurant profile, contact details, business address, and online listings."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: '#eff6ff', display: 'grid', placeItems: 'center', fontSize: '32px', fontWeight: 800, color: '#1d4ed8' }}>
                {initials}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{businessName}</h2>
                <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '14px' }}>Premium restaurant listing with owner-managed contact and location details.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '18px', marginTop: '28px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Contact</span>
                <p style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{contactPhone}</p>
                <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#0f172a' }}>{contactEmail}</p>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Address</span>
                <p style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{address}</p>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Website</span>
                <a href={website} style={{ color: '#2563eb', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>{website}</a>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', display: 'grid', gap: '22px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Social Links</h3>
            {socialLinks.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '20px', background: '#f8fafc' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{item.label}</span>
                <a href={`https://${item.url}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none' }}>{item.url}</a>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
          {[
            { label: 'Active locations', value: '8' },
            { label: 'Open hours', value: '9am - 11pm' },
            { label: 'Current rating', value: '4.7/5' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{item.label}</p>
              <p style={{ margin: '14px 0 0', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default BusinessProfilePage;

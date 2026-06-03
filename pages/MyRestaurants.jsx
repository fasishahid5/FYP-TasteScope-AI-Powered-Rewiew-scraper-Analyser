import React from 'react';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import { restaurants } from '../data/restaurants';

const MyRestaurants = () => {
  const handleAddRestaurant = () => {
    window.alert('Add Restaurant flow will be added here.');
  };

  return (
    <BusinessOwnerLayout
      activeItem="restaurants"
      pageTitle="My Restaurants"
      pageDescription="View and manage your restaurant locations, ratings, and review performance."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Restaurant portfolio</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Manage your locations</h2>
          </div>
          <button
            type="button"
            onClick={handleAddRestaurant}
            style={{
              borderRadius: '16px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              padding: '12px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add Restaurant
          </button>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                gap: '18px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '24px',
                padding: '20px',
                alignItems: 'stretch',
              }}
            >
              <img
                src={restaurant.image}
                alt={restaurant.name}
                style={{ width: '100%', minHeight: '220px', objectFit: 'cover', borderRadius: '20px' }}
              />
              <div style={{ display: 'grid', gap: '18px' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{restaurant.name}</h3>
                      <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '14px' }}>{restaurant.location}</p>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', padding: '10px 14px', fontWeight: 700 }}>
                      <span>{restaurant.rating.toFixed(1)}</span>
                      <span>★</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}><strong>Address:</strong> {restaurant.location}</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}><strong>Reviews:</strong> {restaurant.reviews.toLocaleString()}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => window.alert(`View analytics for ${restaurant.name}`)}
                    style={{
                      borderRadius: '14px',
                      border: '1px solid #2563eb',
                      background: '#ffffff',
                      color: '#2563eb',
                      padding: '12px 18px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: '150px',
                    }}
                  >
                    View Analytics
                  </button>
                  <button
                    type="button"
                    onClick={() => window.alert(`Edit ${restaurant.name}`)}
                    style={{
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      padding: '12px 18px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: '120px',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => window.alert(`Delete ${restaurant.name}`)}
                    style={{
                      borderRadius: '14px',
                      border: '1px solid #fee2e2',
                      background: '#fef2f2',
                      color: '#991b1b',
                      padding: '12px 18px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: '120px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default MyRestaurants;

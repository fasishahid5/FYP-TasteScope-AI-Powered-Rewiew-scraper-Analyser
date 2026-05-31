import React from 'react';
import { useNavigate } from 'react-router-dom';

const BusinessDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Business Dashboard</h1>
        <p className="mt-2 text-slate-600">
          You are now in Business Owner mode. Your business tools and analytics will appear here.
        </p>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default BusinessDashboard;

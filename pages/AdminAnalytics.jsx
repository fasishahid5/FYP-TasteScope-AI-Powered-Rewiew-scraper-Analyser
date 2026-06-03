import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';

const analyticsData = [
  { name: 'Jan', sessions: 4200, conversions: 280 },
  { name: 'Feb', sessions: 4600, conversions: 330 },
  { name: 'Mar', sessions: 5200, conversions: 390 },
  { name: 'Apr', sessions: 5600, conversions: 420 },
  { name: 'May', sessions: 6100, conversions: 470 },
  { name: 'Jun', sessions: 6600, conversions: 510 },
];

const KPI_WIDGETS = [
  { label: 'Daily Active Users', value: '2,980', delta: '+8%' },
  { label: 'New Restaurants', value: '186', delta: '+12%' },
  { label: 'Review Conversion', value: '4.8%', delta: '+1.4%' },
];

const AdminAnalytics = () => (
  <AdminLayout pageTitle="Platform Analytics" pageDescription="Deep dive into platform adoption, review performance and admin metrics.">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {KPI_WIDGETS.map((widget) => (
        <div key={widget.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{widget.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{widget.value}</p>
          <p className="mt-2 text-sm text-slate-600">{widget.delta} vs last month</p>
        </div>
      ))}
    </div>

    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Engagement Growth</h2>
            <p className="mt-1 text-sm text-slate-500">Sessions and conversions over the past 6 months.</p>
          </div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="conversions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="sessions" stroke="#2563eb" fill="url(#sessions)" strokeWidth={2} />
              <Area type="monotone" dataKey="conversions" stroke="#10b981" fill="url(#conversions)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review Volume</h2>
            <p className="mt-1 text-sm text-slate-500">Monthly review submission trends.</p>
          </div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions" fill="#2563eb" radius={[12, 12, 0, 0]} />
              <Bar dataKey="conversions" fill="#14b8a6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>

    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Performance highlights</h2>
          <p className="mt-1 text-sm text-slate-500">Key metrics support decisions on expansion, moderation, and trust.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Retention</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">78%</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">CSAT</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">92%</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">Moderation Rate</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">4.1%</p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
);

export default AdminAnalytics;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import AdminLayout from '../components/AdminLayout';

const stats = [
  { label: 'Total users', value: 4821 },
  { label: 'Business owners', value: 312 },
  { label: 'Restaurants', value: 1189 },
  { label: 'Reviews', value: 15432 },
];

const growthData = [
  { month: 'Jan', users: 4200, restaurants: 900, reviews: 9800 },
  { month: 'Feb', users: 4300, restaurants: 940, reviews: 10200 },
  { month: 'Mar', users: 4450, restaurants: 965, reviews: 10850 },
  { month: 'Apr', users: 4620, restaurants: 1020, reviews: 11800 },
  { month: 'May', users: 4730, restaurants: 1080, reviews: 13100 },
  { month: 'Jun', users: 4821, restaurants: 1189, reviews: 15432 },
];

const reviewDistribution = [
  { label: '1 Star', value: 2450 },
  { label: '2 Star', value: 1820 },
  { label: '3 Star', value: 1240 },
  { label: '4 Star', value: 856 },
  { label: '5 Star', value: 540 },
];

const sentimentDistribution = [
  { label: 'Positive', value: 8720 },
  { label: 'Neutral', value: 3980 },
  { label: 'Negative', value: 1732 },
];

const topRestaurants = [
  { label: 'Arcadian Cafe', value: 1840 },
  { label: 'Biryani Street', value: 1590 },
  { label: 'Karahi King', value: 1410 },
  { label: 'Spice Route', value: 1240 },
];

const topCities = [
  { label: 'Lahore', value: 6450 },
  { label: 'Karachi', value: 5120 },
  { label: 'Islamabad', value: 3760 },
  { label: 'Peshawar', value: 2480 },
];

const recentActivities = [
  { id: 1, activity: 'User signup', user: 'Fatima Ali', date: 'Jun 3, 2026' },
  { id: 2, activity: 'Owner request approved', user: 'Admin', date: 'Jun 2, 2026' },
  { id: 3, activity: 'Report generated', user: 'System', date: 'May 30, 2026' },
  { id: 4, activity: 'Review flagged', user: 'Hamza', date: 'May 28, 2026' },
];

const complaints = [
  { id: 1, user: 'Hassan Raza', subject: 'Restaurant page not updating', status: 'Open' },
  { id: 2, user: 'Mina Qureshi', subject: 'Wrong sentiment label', status: 'In review' },
  { id: 3, user: 'Sara Khan', subject: 'Owner request delayed', status: 'Open' },
];

const adminSettings = [
  { title: 'System Settings', description: 'Manage global platform policies, company information, and feature flags.' },
  { title: 'API Settings', description: 'View keys, integrations, and third-party admin API configuration.' },
  { title: 'Notification Settings', description: 'Manage email, SMS, and in-app alert preferences for admin workflows.' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout
      pageTitle="Admin Dashboard"
      pageDescription="Overview of platform health, analytics, and administrative controls."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Platform Analytics</h3>
        <p className="text-sm text-slate-500 mt-1">Track reviews, sentiment, top restaurants, and city-level activity.</p>
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-slate-900">Total Reviews Distribution</h4>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewDistribution} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-slate-900">Sentiment Distribution</h4>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentDistribution} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-slate-900">Top Restaurants</h4>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRestaurants} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-slate-900">Top Cities</h4>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCities} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Feedback Center</h3>
        <p className="text-sm text-slate-500 mt-1">User complaints and moderation tickets that need action.</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="py-2">User</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-3 text-slate-800">{item.user}</td>
                  <td className="py-3 text-slate-700">{item.subject}</td>
                  <td className="py-3 text-slate-600 font-semibold">{item.status}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">Resolve</button>
                      <button type="button" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50">Close</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Admin Settings</h3>
        <p className="text-sm text-slate-500 mt-1">Quick access to system, API, and notification settings.</p>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {adminSettings.map((setting) => (
            <div key={setting.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h4 className="text-base font-semibold text-slate-900">{setting.title}</h4>
              <p className="mt-3 text-sm text-slate-600">{setting.description}</p>
              <button type="button" className="mt-5 inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Recent Activities</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="py-2">Activity</th>
                <th className="py-2">User</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="py-3 text-slate-800">{a.activity}</td>
                  <td className="py-3 text-slate-700">{a.user}</td>
                  <td className="py-3 text-slate-500">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

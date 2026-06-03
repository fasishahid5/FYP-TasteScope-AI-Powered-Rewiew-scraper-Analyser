import React from 'react';
import AdminLayout from '../components/AdminLayout';

const settingsOptions = [
  { title: 'Account Controls', description: 'Manage admin logins, multi-factor authentication, and access requests.' },
  { title: 'Platform Policies', description: 'Configure review moderation, community rules, and trust signals.' },
  { title: 'Alerts & Notifications', description: 'Set up notification channels for incidents and moderation alerts.' },
  { title: 'Data Export', description: 'Download logs, reports, and export user activity data securely.' },
];

const AdminSettings = () => (
  <AdminLayout pageTitle="Admin Settings" pageDescription="Configure the platform, security, and operational workflows.">
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Security & Access</h2>
        <p className="mt-2 text-sm text-slate-500">Review administrative permissions and secure the platform with modern access controls.</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Password policy</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Minimum 10 characters, uppercase, number, symbol</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">MFA status</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Enabled for all admins</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Session timeout</p>
            <p className="mt-2 text-base font-semibold text-slate-900">30 minutes of inactivity</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Settings Overview</h2>
            <p className="mt-2 text-sm text-slate-500">Quick access to core admin configuration areas.</p>
          </div>
          <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Save changes</button>
        </div>

        <div className="mt-6 grid gap-4">
          {settingsOptions.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>

    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Admin Workflow</h2>
      <p className="mt-2 text-sm text-slate-500">Use these tools to manage platform stability, support alerts, and release controls.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Feature flagging</p>
          <p className="mt-3 text-base font-semibold text-slate-900">Release and rollback admin features safely.</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Maintenance mode</p>
          <p className="mt-3 text-base font-semibold text-slate-900">Schedule platform maintenance windows.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">Audit logs</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Enabled</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">API access</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Admin only</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">Data retention</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">18 months</p>
        </div>
      </div>
    </section>
  </AdminLayout>
);

export default AdminSettings;

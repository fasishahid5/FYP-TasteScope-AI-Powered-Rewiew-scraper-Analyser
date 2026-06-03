import React from 'react';
import AdminLayout from '../components/AdminLayout';

const feedbackTickets = [
  { id: 1, user: 'Amna Shah', subject: 'Incorrect restaurant hours', status: 'Open', priority: 'High' },
  { id: 2, user: 'Bilal Ahmed', subject: 'Review moderation delay', status: 'In progress', priority: 'Medium' },
  { id: 3, user: 'Dania Mir', subject: 'Dish rating mismatch', status: 'Resolved', priority: 'Low' },
  { id: 4, user: 'Omar Tariq', subject: 'Verification email issue', status: 'Open', priority: 'High' },
];

const AdminFeedback = () => (
  <AdminLayout pageTitle="Feedback Center" pageDescription="Monitor support tickets, moderation flags, and customer insights.">
    <div className="grid gap-4 lg:grid-cols-1">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ticket Overview</h2>
            <p className="mt-1 text-sm text-slate-500">Summarized support and moderation workload.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">4</span> open tickets
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-500">Urgent</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">2</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">1</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-500">Resolved</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">1</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-500">Average SLA</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">18h</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Latest Feedback Tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Review the latest customer and moderation requests.</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="py-3">User</th>
                <th className="py-3">Subject</th>
                <th className="py-3">Status</th>
                <th className="py-3">Priority</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {feedbackTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-slate-100">
                  <td className="py-3 text-slate-800">{ticket.user}</td>
                  <td className="py-3 text-slate-700">{ticket.subject}</td>
                  <td className="py-3 text-slate-600 font-semibold">{ticket.status}</td>
                  <td className="py-3 text-slate-600">{ticket.priority}</td>
                  <td className="py-3">
                    <button type="button" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Feedback Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Sentiment</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">72% positive</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Response Rate</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">88%</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Escalations</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">6%</p>
          </div>
        </div>
      </section>
    </div>
  </AdminLayout>
);

export default AdminFeedback;

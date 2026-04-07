import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className={`inline-flex p-3 rounded-xl ${colors[color]} text-2xl mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizStatusFilter, setBizStatusFilter] = useState('');
  const [reassignTarget, setReassignTarget] = useState(null);
  const [reassignEmail, setReassignEmail] = useState('');
  const [reassignStatus, setReassignStatus] = useState('');
  const [analyticsPanel, setAnalyticsPanel] = useState(null); // { biz, data }
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data.stats);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get('/admin/users?limit=50');
      setUsers(data.users);
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  };

  const fetchBusinesses = async (statusFilter = bizStatusFilter) => {
    setBizLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/businesses?${params}`);
      setBusinesses(data.businesses);
    } catch { /* ignore */ }
    finally { setBizLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'businesses') fetchBusinesses();
    if (activeTab === 'payments') fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const { data } = await api.get('/admin/revenue');
      setPayments(data.payments);
    } catch { /* ignore */ }
    finally { setPaymentsLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/businesses/${id}/review`, { action: 'approve' });
      setBusinesses((prev) => prev.map((b) => b._id === id ? { ...b, status: 'approved' } : b));
    } catch { /* ignore */ }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    try {
      await api.put(`/admin/businesses/${id}/review`, { action: 'reject', rejectionReason: reason });
      setBusinesses((prev) => prev.map((b) => b._id === id ? { ...b, status: 'rejected' } : b));
    } catch { /* ignore */ }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch { /* ignore */ }
  };

  const handleDeleteBusiness = async (id) => {
    if (!window.confirm('Delete this business?')) return;
    try {
      await api.delete(`/admin/businesses/${id}`);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
    } catch { /* ignore */ }
  };

  const handleReassign = async () => {    if (!reassignTarget || !reassignEmail.trim()) return;
    setReassignStatus('loading');
    try {
      const { data } = await api.put(`/admin/businesses/${reassignTarget._id}/reassign`, { email: reassignEmail.trim() });
      setBusinesses((prev) => prev.map((b) => b._id === reassignTarget._id ? data.business : b));
      setReassignStatus('success');
      setTimeout(() => { setReassignTarget(null); setReassignEmail(''); setReassignStatus(''); }, 1500);
    } catch (err) {
      setReassignStatus(err.response?.data?.message || 'Failed to reassign');
    }
  };

  const loadAdminAnalytics = async (biz) => {
    setAnalyticsPanel({ biz, data: null });
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get(`/enterprise/analytics/${biz._id}`);
      setAnalyticsPanel({ biz, data: data.analytics });
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  };

  const TABS = ['overview', 'businesses', 'users', 'payments'];

  if (loading) return <LoadingSpinner />;

  // Format monthly revenue for chart
  const revenueChart = (stats?.monthlyRevenue || []).map((m) => ({
    name: MONTHS[m._id.month - 1],
    revenue: m.revenue / 100,
  }));

  const categoryChart = (stats?.businessesByCategory || []).map((c, i) => ({
    name: c._id,
    value: c.count,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && stats && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard icon="👥" label="Total Users" value={stats.totalUsers} color="blue" />
            <StatCard icon="🏢" label="Total Businesses" value={stats.totalBusinesses} color="green" />
            <StatCard icon="⏳" label="Pending" value={stats.pendingBusinesses} color="yellow" />
            <StatCard icon="✅" label="Active" value={stats.activeBusinesses} color="green" />
            <StatCard icon="💬" label="Reviews" value={stats.totalReviews} color="blue" />
            <StatCard icon="💰" label="Revenue (₹)" value={`₹${stats.totalRevenue?.toFixed(0)}`} color="green" />
          </div>

          {/* Pending businesses action banner */}
          {stats.pendingBusinesses > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-semibold text-yellow-800">
                    {stats.pendingBusinesses} business{stats.pendingBusinesses > 1 ? 'es are' : ' is'} waiting for review
                  </p>
                  <p className="text-yellow-600 text-xs mt-0.5">Approve or reject them to update their visibility.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('businesses')}
                className="flex-shrink-0 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
              >
                Review Now →
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly revenue chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4">Monthly Revenue (₹)</h2>
              {revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueChart}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `₹${v}`} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-10">No payment data yet</p>
              )}
            </div>

            {/* Category breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4">Businesses by Category</h2>
              {categoryChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {categoryChart.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-10">No data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Businesses tab */}
      {activeTab === 'businesses' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              All Businesses
              <span className="ml-2 text-sm font-normal text-gray-400">({businesses.length} shown)</span>
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={bizStatusFilter}
                onChange={(e) => { setBizStatusFilter(e.target.value); fetchBusinesses(e.target.value); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => fetchBusinesses(bizStatusFilter)}
                className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          {bizLoading ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-gray-600 hidden md:table-cell">Owner</th>
                    <th className="text-left px-4 py-3 text-gray-600 hidden lg:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b) => (
                    <tr key={b._id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell capitalize">{b.category}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{b.owner?.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{b.owner?.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.status === 'approved' ? 'bg-green-100 text-green-700' :
                          b.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(b._id)}
                                className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                              <button onClick={() => handleReject(b._id)}
                                className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Reject</button>
                            </>
                          )}
                          <button onClick={() => { setReassignTarget(b); setReassignEmail(''); setReassignStatus(''); }}
                            className="text-blue-500 hover:text-blue-700 text-xs font-medium">Reassign</button>
                          <button onClick={() => loadAdminAnalytics(b)}
                            className="text-purple-500 hover:text-purple-700 text-xs font-medium">Analytics</button>
                          <button onClick={() => handleDeleteBusiness(b._id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {businesses.length === 0 && (
                <p className="text-center text-gray-400 py-8">No businesses found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">All Users</h2>
          {usersLoading ? <LoadingSpinner /> : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 text-gray-600 hidden md:table-cell">Status</th>
                    <th className="text-right px-4 py-3 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'enterprise' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteUser(u._id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-gray-400 py-8">No users found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payments tab */}
      {activeTab === 'payments' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Payment Transactions</h2>
          {paymentsLoading ? (
            <LoadingSpinner />
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-gray-400">No payments yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Razorpay ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{p.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.user?.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{p.business?.name || '—'}</p>
                        <p className="text-xs text-gray-400 capitalize">{p.business?.category || ''}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">₹{(p.amount / 100).toFixed(0)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.razorpayPaymentId || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'paid' ? 'bg-green-100 text-green-700' :
                          p.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics side panel */}
      {analyticsPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setAnalyticsPanel(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-gray-800">{analyticsPanel.biz.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{analyticsPanel.biz.category} · {analyticsPanel.biz.owner?.name}</p>
              </div>
              <button onClick={() => setAnalyticsPanel(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {analyticsLoading ? (
              <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
            ) : analyticsPanel.data ? (() => {
              const a = analyticsPanel.data;
              const ratingChart = (a.ratingDistribution || []).map((r) => ({ name: `${r._id}★`, count: r.count }));
              return (
                <div className="p-5 space-y-6">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Views', value: a.views, icon: '👁️' },
                      { label: 'Clicks', value: a.clicks, icon: '🖱️' },
                      { label: 'Leads', value: a.leads, icon: '📞' },
                      { label: 'Reviews', value: a.reviewCount, icon: '💬' },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl">{s.icon}</p>
                        <p className="text-xl font-bold text-gray-800">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Avg rating */}
                  <div className="flex items-center gap-2">
                    <StarRating rating={a.avgRating} size="md" />
                    <span className="font-semibold text-gray-700">{a.avgRating?.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm">avg rating</span>
                  </div>

                  {/* Rating distribution chart */}
                  {ratingChart.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Rating Distribution</p>
                      <ResponsiveContainer width="100%" height={110}>
                        <BarChart data={ratingChart}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent reviews */}
                  {a.recentReviews?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-3">Recent Reviews (30 days)</p>
                      <div className="space-y-2">
                        {a.recentReviews.map((r) => (
                          <div key={r._id} className="bg-gray-50 rounded-xl p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700">{r.user?.name}</span>
                              <StarRating rating={r.rating} size="sm" />
                            </div>
                            {r.comment && <p className="text-gray-500 text-xs">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {a.recentReviews?.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">No reviews yet</p>
                  )}
                </div>
              );
            })() : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Failed to load analytics</div>
            )}
          </div>
        </div>
      )}

      {/* Reassign owner modal */}
      {reassignTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Reassign Business Owner</h3>
            <p className="text-sm text-gray-500 mb-4">
              Changing owner of <span className="font-medium text-gray-700">"{reassignTarget.name}"</span>.
              Enter the email of the enterprise user to transfer it to.
            </p>
            <input
              type="email"
              value={reassignEmail}
              onChange={(e) => setReassignEmail(e.target.value)}
              placeholder="enterprise@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && handleReassign()}
            />
            {reassignStatus && reassignStatus !== 'loading' && reassignStatus !== 'success' && (
              <p className="text-xs text-red-500 mb-3">{reassignStatus}</p>
            )}
            {reassignStatus === 'success' && (
              <p className="text-xs text-green-600 mb-3">✅ Owner updated successfully!</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setReassignTarget(null); setReassignEmail(''); setReassignStatus(''); }}
                className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={!reassignEmail.trim() || reassignStatus === 'loading' || reassignStatus === 'success'}
                className="text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {reassignStatus === 'loading' ? 'Saving...' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

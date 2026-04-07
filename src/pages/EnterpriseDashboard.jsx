import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatusBadge({ status, isActive }) {
  if (status === 'pending') return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending Review</span>;
  if (status === 'rejected') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
  if (status === 'approved' && !isActive) return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Activate Listing</span>;
  return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
}

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [payStatus, setPayStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [payHistory, setPayHistory] = useState([]);
  const [payHistoryLoading, setPayHistoryLoading] = useState(false);
  const [showPayHistory, setShowPayHistory] = useState(false);

  const fetchBusinesses = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setFetchError('');
    try {
      const { data } = await api.get('/enterprise/businesses');
      setBusinesses(data.businesses);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load businesses. Check your login session.');
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchPayHistory = async () => {
    setPayHistoryLoading(true);
    try {
      const { data } = await api.get('/enterprise/payments');
      setPayHistory(data.payments);
    } catch { /* ignore */ }
    finally { setPayHistoryLoading(false); }
  };

  const togglePayHistory = () => {
    if (!showPayHistory && payHistory.length === 0) fetchPayHistory();
    setShowPayHistory((v) => !v);
  };

  const loadAnalytics = async (bizId) => {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get(`/enterprise/analytics/${bizId}`);
      setAnalytics(data.analytics);
      setSelectedBiz(bizId);
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  };

  const handlePayment = async (biz) => {
    setPayStatus('');
    if (!window.Razorpay) {
      setPayStatus('❌ Payment SDK not loaded. Please refresh the page and try again.');
      return;
    }
    try {
      // Step 1: create Razorpay order on backend
      const { data } = await api.post('/payment/create-order', { businessId: biz._id });

      // Step 2: open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'NearBy Finder',
        description: `Activate listing: ${biz.name}`,
        order_id: data.orderId,
        handler: async (response) => {
          // Step 3: verify payment on backend
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              businessId: biz._id,
            });
            setPayStatus(`✅ ${biz.name} is now active!`);
            setBusinesses((prev) =>
              prev.map((b) => b._id === biz._id ? { ...b, isActive: true } : b)
            );
          } catch (err) {
            setPayStatus(`❌ ${err.response?.data?.message || 'Payment verification failed'}`);
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => setPayStatus('⚠️ Payment cancelled.'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPayStatus('❌ Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setPayStatus(`❌ ${err.response?.data?.message || 'Could not initiate payment'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this business?')) return;
    try {
      await api.delete(`/businesses/${id}`);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
      if (selectedBiz === id) { setSelectedBiz(null); setAnalytics(null); }
    } catch { /* ignore */ }
  };

  if (loading) return <LoadingSpinner />;

  const ratingChart = (analytics?.ratingDistribution || []).map((r) => ({
    name: `${r._id}★`,
    count: r.count,
  }));

  const pendingCount = businesses.filter((b) => b.status === 'pending').length;
  const awaitingPayment = businesses.filter((b) => b.status === 'approved' && !b.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Enterprise Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Logged in as <span className="font-medium text-gray-600">{user?.name}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span className="text-gray-500">{user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePayHistory}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 font-medium"
            title="Payment history"
          >
            💳 Payments
          </button>
          <button
            onClick={() => fetchBusinesses(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 font-medium disabled:opacity-50"
            title="Refresh list"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {businesses.length > 0 && <span>{businesses.length}</span>}
          </button>
          <Link
            to="/enterprise/add-business"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span>+</span> Add Business
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="rounded-lg px-4 py-3 mb-5 text-sm bg-red-50 text-red-600 border border-red-100">
          ⚠️ {fetchError}
        </div>
      )}

      {payStatus && (
        <div className={`rounded-lg px-4 py-3 mb-5 text-sm ${payStatus.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {payStatus}
        </div>
      )}

      {/* Info banners */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm">
          <span className="text-xl">⏳</span>
          <div>
            <p className="font-medium text-yellow-800">
              {pendingCount} business{pendingCount > 1 ? 'es are' : ' is'} pending admin review
            </p>
            <p className="text-yellow-600 text-xs mt-0.5">
              We'll activate them for listing once approved. This usually takes a few hours.
            </p>
          </div>
        </div>
      )}

      {awaitingPayment.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm">
          <span className="text-xl">💳</span>
          <div>
            <p className="font-medium text-orange-800">
              {awaitingPayment.length} approved business{awaitingPayment.length > 1 ? 'es are' : ' is'} awaiting payment
            </p>
            <p className="text-orange-600 text-xs mt-0.5">
              Pay ₹11 per business to make them visible in search results.
            </p>
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🏢</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No businesses yet</h2>
          <p className="text-gray-400 mb-6">Get started by adding your first business listing.</p>
          <Link to="/enterprise/add-business" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Add Business
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-6">
          {/* Business list */}
          <div className="md:col-span-2 space-y-3">
            {businesses.map((biz) => (
              <div
                key={biz._id}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedBiz === biz._id ? 'border-blue-500 shadow-md' : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => loadAnalytics(biz._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{biz.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{biz.category}</p>
                  </div>
                  <StatusBadge status={biz.status} isActive={biz.isActive} />
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {biz.status === 'approved' && !biz.isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePayment(biz); }}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Pay ₹11 to Activate
                    </button>
                  )}
                  <Link
                    to={`/enterprise/edit-business/${biz._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(biz._id); }}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {biz.status === 'rejected' && biz.rejectionReason && (
                  <p className="text-xs text-red-500 mt-2">Reason: {biz.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>

          {/* Analytics panel */}
          <div className="md:col-span-3">
            {!selectedBiz ? (
              <div className="bg-white rounded-xl border border-gray-100 h-full flex items-center justify-center p-8 text-center">
                <div>
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-gray-400">Select a business to view analytics</p>
                </div>
              </div>
            ) : analyticsLoading ? (
              <LoadingSpinner />
            ) : analytics ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Analytics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Views', value: analytics.views, icon: '👁️' },
                    { label: 'Clicks', value: analytics.clicks, icon: '🖱️' },
                    { label: 'Leads', value: analytics.leads, icon: '📞' },
                    { label: 'Reviews', value: analytics.reviewCount, icon: '💬' },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl">{s.icon}</p>
                      <p className="text-xl font-bold text-gray-800">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Avg rating */}
                <div className="flex items-center gap-2 mb-5">
                  <StarRating rating={analytics.avgRating} size="md" />
                  <span className="font-semibold text-gray-700">{analytics.avgRating?.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">avg rating</span>
                </div>

                {/* Rating distribution */}
                {ratingChart.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Rating Distribution</h3>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={ratingChart}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent reviews */}
                {analytics.recentReviews?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Recent Reviews (30 days)</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {analytics.recentReviews.map((r) => (
                        <div key={r._id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">{r.user?.name}</span>
                            <StarRating rating={r.rating} size="sm" />
                          </div>
                          {r.comment && <p className="text-gray-500 text-xs mt-1">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Payment History slide-in panel */}
      {showPayHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowPayHistory(false)} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-800">Payment History</h3>
              <button onClick={() => setShowPayHistory(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            {payHistoryLoading ? (
              <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
            ) : payHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <p className="text-4xl mb-3">💳</p>
                <p className="text-gray-400">No payments yet</p>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {payHistory.map((p) => (
                  <div key={p._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800">{p.business?.name || '—'}</p>
                        <p className="text-xs text-gray-400 capitalize">{p.business?.category || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{(p.amount / 100).toFixed(0)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'paid' ? 'bg-green-100 text-green-700' :
                          p.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{p.status}</span>
                      </div>
                    </div>
                    {p.razorpayPaymentId && (
                      <p className="text-xs text-gray-400 font-mono mt-2">ID: {p.razorpayPaymentId}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

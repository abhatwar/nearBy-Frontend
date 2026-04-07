import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import MapView from '../components/MapView';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BusinessDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, revRes] = await Promise.all([
          api.get(`/businesses/${id}`),
          api.get(`/reviews/business/${id}`),
        ]);
        setBusiness(bizRes.data.business);
        setReviews(revRes.data.reviews);
        if (user?.savedBusinesses) {
          setIsSaved(user.savedBusinesses.includes(id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Business not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Track click
    api.post(`/businesses/${id}/click`).catch(() => {});
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await api.post(`/auth/save/${id}`);
      setIsSaved((prev) => !prev);
    } catch { /* ignore */ }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) return setReviewError('Please select a rating');
    setReviewLoading(true);
    setReviewError('');
    try {
      const { data } = await api.post('/reviews', { businessId: id, rating, comment });
      setReviews((prev) => [data.review, ...prev]);
      setBusiness((prev) => ({
        ...prev,
        avgRating: ((prev.avgRating * prev.reviewCount) + rating) / (prev.reviewCount + 1),
        reviewCount: prev.reviewCount + 1,
      }));
      setRating(0);
      setComment('');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch { /* ignore */ }
  };

  const handleLeadTrack = () => {
    api.post(`/businesses/${id}/lead`).catch(() => {});
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="max-w-2xl mx-auto text-center py-24 px-4">
      <p className="text-6xl mb-4">😔</p>
      <p className="text-xl text-gray-700">{error}</p>
      <Link to="/" className="text-blue-600 mt-4 block hover:underline">Back to Home</Link>
    </div>
  );

  const [lng, lat] = business.location.coordinates;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 hover:underline flex items-center gap-1 mb-6 text-sm">
        ← Back to search
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Images + Info */}
        <div>
          {/* Image gallery */}
          <div className="rounded-xl overflow-hidden bg-gray-100 h-64 mb-3">
            {business.images?.length > 0 ? (
              <img
                src={business.images[activeImg]}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📍</div>
            )}
          </div>
          {business.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {business.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activeImg === i ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main info */}
          <div className="mt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-blue-500 font-semibold">{business.category}</span>
                <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{business.name}</h1>
              </div>
              {user && (
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-full border transition-colors ${
                    isSaved ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
                  }`}
                  title={isSaved ? 'Unsave' : 'Save'}
                >
                  <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={business.avgRating} size="md" />
              <span className="font-semibold text-gray-700">{business.avgRating?.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({business.reviewCount} reviews)</span>
            </div>

            {business.location?.address && (
              <p className="text-gray-500 text-sm mt-2 flex items-start gap-1">
                <span className="mt-0.5">📍</span> {business.location.address}
              </p>
            )}

            {business.description && (
              <p className="text-gray-600 mt-4 leading-relaxed">{business.description}</p>
            )}

            {/* Contact info */}
            <div className="mt-5 space-y-2">
              {business.contactInfo?.phone && (
                <a
                  href={`tel:${business.contactInfo.phone}`}
                  onClick={handleLeadTrack}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span className="text-lg">📞</span>
                  <span>{business.contactInfo.phone}</span>
                </a>
              )}
              {business.contactInfo?.email && (
                <a
                  href={`mailto:${business.contactInfo.email}`}
                  onClick={handleLeadTrack}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span className="text-lg">✉️</span>
                  <span>{business.contactInfo.email}</span>
                </a>
              )}
              {business.contactInfo?.website && (
                <a
                  href={business.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLeadTrack}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <span className="text-lg">🌐</span>
                  <span>{business.contactInfo.website}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map + Reviews */}
        <div>
          <div style={{ height: 260 }} className="mb-6">
            <MapView
              businesses={[business]}
              userLocation={{ lat, lng }}
            />
          </div>

          {/* Reviews section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Reviews ({reviews.length})
            </h2>

            {/* Add review form */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="bg-blue-50 rounded-xl p-4 mb-5">
                <p className="text-sm font-medium text-gray-700 mb-3">Write a Review</p>
                <div className="mb-3">
                  <StarRating rating={rating} size="lg" interactive onChange={setRating} />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience... (optional)"
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                {reviewError && <p className="text-red-500 text-xs mt-1">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5 text-center">
                <p className="text-gray-500 text-sm">
                  <Link to="/login" className="text-blue-600 hover:underline font-medium">Login</Link>{' '}
                  to write a review
                </p>
              </div>
            )}

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No reviews yet. Be the first!</p>
              ) : (
                reviews.map((r) => (
                  <ReviewCard
                    key={r._id}
                    review={r}
                    onDelete={handleDeleteReview}
                    currentUserId={user?._id}
                    isAdmin={user?.role === 'admin'}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import StarRating from './StarRating';

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function ReviewCard({ review, onDelete, currentUserId, isAdmin }) {
  const { _id, user, rating, comment, createdAt } = review;
  const canDelete = isAdmin || user?._id === currentUserId;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-800 text-sm">{user?.name || 'Anonymous'}</p>
            <p className="text-xs text-gray-400">{timeAgo(createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={rating} />
          {canDelete && (
            <button
              onClick={() => onDelete?.(_id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete review"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {comment && (
        <p className="text-gray-600 text-sm mt-3 leading-relaxed">{comment}</p>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const CATEGORY_COLORS = {
  restaurant: 'bg-orange-50 text-orange-600 border-orange-100',
  hospital: 'bg-red-50 text-red-600 border-red-100',
  hotel: 'bg-purple-50 text-purple-600 border-purple-100',
  gym: 'bg-green-50 text-green-600 border-green-100',
  salon: 'bg-pink-50 text-pink-600 border-pink-100',
  pharmacy: 'bg-blue-50 text-blue-600 border-blue-100',
  grocery: 'bg-lime-50 text-lime-600 border-lime-100',
  bank: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  education: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  entertainment: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
  other: 'bg-gray-50 text-gray-600 border-gray-100',
};

const CATEGORY_ICONS = {
  restaurant: '🍽️', hospital: '🏥', hotel: '🏨', gym: '💪',
  salon: '💇', pharmacy: '💊', grocery: '🛒', bank: '🏦',
  education: '🎓', entertainment: '🎭', other: '📍',
};

const BG_GRADIENTS = [
  'from-blue-400 to-indigo-500',
  'from-orange-400 to-pink-500',
  'from-green-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-yellow-400 to-orange-500',
];

function formatDistance(meters) {
  if (!meters && meters !== 0) return null;
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export default function BusinessCard({ business }) {
  const { _id, name, category, images, avgRating, reviewCount, distance, location } = business;
  const icon = CATEGORY_ICONS[category] || '📍';
  const thumb = images?.[0];
  const tagColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const bgGradient = BG_GRADIENTS[(_id?.charCodeAt(0) || 0) % BG_GRADIENTS.length];

  return (
    <Link
      to={`/business/${_id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
            <span className="text-5xl drop-shadow">{icon}</span>
          </div>
        )}

        {/* Distance badge */}
        {distance != null && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {formatDistance(distance)}
          </div>
        )}

        {/* Category chip */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${tagColor} bg-white/90 backdrop-blur-sm capitalize`}>
          {icon} {category}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug truncate mb-1">{name}</h3>

        {location?.address && (
          <p className="text-xs text-gray-400 truncate mb-2 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location.address}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StarRating rating={avgRating} size="sm" />
            <span className="text-sm font-semibold text-gray-700">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </span>
            {reviewCount > 0 && (
              <span className="text-xs text-gray-400">({reviewCount})</span>
            )}
          </div>
          <span className="text-xs text-blue-600 font-semibold flex items-center gap-0.5 group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

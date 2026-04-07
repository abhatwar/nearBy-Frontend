export default function StarRating({ rating = 0, maxStars = 5, size = 'sm', interactive = false, onChange }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };

  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(i + 1) : undefined}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            aria-label={interactive ? `Rate ${i + 1} stars` : undefined}
          >
            {filled ? (
              <span className="text-yellow-400">★</span>
            ) : half ? (
              <span className="text-yellow-400">½</span>
            ) : (
              <span className="text-gray-300">★</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

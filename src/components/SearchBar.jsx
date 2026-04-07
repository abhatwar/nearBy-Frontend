import { useState } from 'react';

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser'); return; }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocating(false); onSearch({ lat: coords.latitude, lng: coords.longitude, query }); },
      () => { setLocating(false); setLocError('Location access denied. Please allow it in browser settings.'); }
    );
  };

  const handleSubmit = (e) => { e.preventDefault(); handleGeolocate(); };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl">
      <div className="flex items-stretch bg-white rounded-2xl shadow-xl overflow-hidden border border-white/20">
        {/* Search icon */}
        <div className="flex items-center pl-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Restaurants, hospitals, hotels..."
          className="flex-1 px-3 py-4 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none text-base"
        />

        {/* Divider */}
        <div className="w-px bg-gray-200 my-3" />

        {/* Button */}
        <button
          type="submit"
          disabled={loading || locating}
          className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold transition-colors disabled:opacity-60 text-sm"
        >
          {locating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Locating…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Search Nearby</span>
              <span className="sm:hidden">Search</span>
            </>
          )}
        </button>
      </div>
      {locError && (
        <p className="text-red-300 text-sm mt-2 text-center flex items-center justify-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {locError}
        </p>
      )}
    </form>
  );
}

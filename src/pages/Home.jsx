import { useState, useCallback, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import BusinessCard from '../components/BusinessCard';
import MapView from '../components/MapView';
import api from '../api/axios';

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outsideRadius, setOutsideRadius] = useState(false);
  const [usedRadius, setUsedRadius] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ category: '', radius: 5000, minRating: '' });

  const fetchAll = useCallback(async (activeFilters, query = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeFilters.category) params.category = activeFilters.category;
      if (activeFilters.minRating) params.minRating = activeFilters.minRating;
      if (query) params.search = query;
      const { data } = await api.get('/businesses', { params });
      setBusinesses(data.businesses);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNearby = useCallback(async (coords, activeFilters, query = '') => {
    setLoading(true);
    setError('');
    setOutsideRadius(false);
    try {
      const params = {
        lat: coords.lat,
        lng: coords.lng,
        radius: activeFilters.radius || 5000,
      };
      if (activeFilters.category) params.category = activeFilters.category;
      if (activeFilters.minRating) params.minRating = activeFilters.minRating;
      if (query) params.search = query;
      const { data } = await api.get('/businesses/nearby', { params });
      setBusinesses(data.businesses);
      setOutsideRadius(data.outsideRadius || false);
      setUsedRadius(data.radius || activeFilters.radius || 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all businesses on mount
  useEffect(() => { fetchAll({ category: '', radius: 5000, minRating: '' }); }, [fetchAll]);

  const handleSearch = ({ lat, lng, query }) => {
    const coords = { lat, lng };
    const q = query || '';
    setUserLocation(coords);
    setSearchQuery(q);
    fetchNearby(coords, filters, q);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (userLocation) {
      fetchNearby(userLocation, newFilters, searchQuery);
    } else {
      fetchAll(newFilters, searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-16 w-72 h-72 rounded-full bg-indigo-300" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {businesses.length > 0 ? `${businesses.length} active listings` : 'Discover local businesses'}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Find What's{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Around You
            </span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Restaurants, hospitals, hotels and more — discover businesses near you instantly.
          </p>

          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">

        {/* Filters */}
        <div className="mb-6">
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Outside radius banner */}
        {!loading && outsideRadius && userLocation && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 mb-5 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              No businesses within <strong>{usedRadius >= 1000 ? `${usedRadius / 1000} km` : `${usedRadius} m`}</strong>.
              Showing nearest results instead — check the distance badge on each card.
            </span>
          </div>
        )}

        {/* Results bar */}
        {!loading && (
          <div className="flex items-center justify-between mb-5 gap-4">
            <p className="text-gray-500 text-sm">
              {userLocation ? (
                <>Found <span className="font-semibold text-gray-700">{businesses.length}</span> businesses nearby</>
              ) : (
                <>Showing <span className="font-semibold text-gray-700">{businesses.length}</span> active listings</>
              )}
              {filters.category && (
                <span className="ml-1 text-blue-600 font-medium capitalize">· {filters.category}</span>
              )}
            </p>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid view"
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('map')}
                title="Map view"
                className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {viewMode === 'map' ? (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 520 }}>
                <MapView businesses={businesses} userLocation={userLocation} />
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  🔍
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  {userLocation
                    ? 'Try a larger radius or remove filters.'
                    : 'Try clearing filters or check back later.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {businesses.map((b) => (
                  <BusinessCard key={b._id} business={b} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

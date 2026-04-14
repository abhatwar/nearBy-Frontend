import { useState, useCallback, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import BusinessCard from '../components/BusinessCard';
import MapView from '../components/MapView';
import api from '../api/axios';

const LOCATION_DECISION_KEY = 'nf_location_decision';
const STORED_LOCATION_KEY = 'nf_user_location';

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationReady, setLocationReady] = useState(false);
  const [locatingInitial, setLocatingInitial] = useState(false);
  const [locationInitError, setLocationInitError] = useState('');
  const [outsideRadius, setOutsideRadius] = useState(false);
  const [usedRadius, setUsedRadius] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ category: '', radius: 5000, minRating: '', city: '' });

  const fetchAll = useCallback(async (activeFilters, query = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeFilters.category) params.category = activeFilters.category;
      if (activeFilters.minRating) params.minRating = activeFilters.minRating;
      if (activeFilters.city) params.city = activeFilters.city;
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
      if (activeFilters.city) params.city = activeFilters.city;
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

  const continueWithoutLocation = useCallback(() => {
    setUserLocation(null);
    setLocationInitError('');
    setLocationReady(true);
    localStorage.setItem(LOCATION_DECISION_KEY, 'skipped');
    localStorage.removeItem(STORED_LOCATION_KEY);
    fetchAll(filters, searchQuery);
  }, [fetchAll, filters, searchQuery]);

  const requestInitialLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationInitError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingInitial(true);
    setLocationInitError('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordsObj = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(coordsObj);
        setLocatingInitial(false);
        setLocationReady(true);
        localStorage.setItem(LOCATION_DECISION_KEY, 'granted');
        localStorage.setItem(STORED_LOCATION_KEY, JSON.stringify(coordsObj));
        fetchNearby(coordsObj, filters, searchQuery);
      },
      () => {
        setLocatingInitial(false);
        setLocationInitError('Location permission denied. Showing all businesses.');
        localStorage.setItem(LOCATION_DECISION_KEY, 'denied');
        localStorage.removeItem(STORED_LOCATION_KEY);
        setLocationReady(true);
        fetchAll(filters, searchQuery);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchNearby, fetchAll, filters, searchQuery]);

  const handleSearch = ({ lat, lng, query }) => {
    const coords = { lat, lng };
    const q = query || '';
    setUserLocation(coords);
    setSearchQuery(q);
    localStorage.setItem(LOCATION_DECISION_KEY, 'granted');
    localStorage.setItem(STORED_LOCATION_KEY, JSON.stringify(coords));
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

  useEffect(() => {
    const decision = localStorage.getItem(LOCATION_DECISION_KEY);
    const savedLocation = localStorage.getItem(STORED_LOCATION_KEY);

    if (decision === 'granted' && savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed?.lat && parsed?.lng) {
          setUserLocation(parsed);
          setLocationReady(true);
          fetchNearby(parsed, { category: '', radius: 5000, minRating: '', city: '' }, '');
          return;
        }
      } catch (_) {
        localStorage.removeItem(STORED_LOCATION_KEY);
      }
    }

    if (decision === 'skipped' || decision === 'denied') {
      setLocationReady(true);
      fetchAll({ category: '', radius: 5000, minRating: '', city: '' }, '');
      return;
    }

    setLoading(false);
  }, [fetchAll, fetchNearby]);

  if (!locationReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Enable Location</h1>
          <p className="text-sm text-gray-500 mb-6">
            Nearby Finder needs your location to show businesses around you when opening the site.
          </p>

          {locationInitError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm mb-4">
              {locationInitError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={requestInitialLocation}
              disabled={locatingInitial}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-70"
            >
              {locatingInitial ? 'Getting location...' : 'Allow Location'}
            </button>
            <button
              type="button"
              onClick={continueWithoutLocation}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
            >
              Continue without location
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              {filters.city && (
                <span className="ml-1 text-emerald-600 font-medium">· {filters.city}</span>
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

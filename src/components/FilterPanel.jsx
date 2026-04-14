const CATEGORIES = [
  { value: '', label: 'All', icon: '✨' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'salon', label: 'Salon', icon: '💇' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'grocery', label: 'Grocery', icon: '🛒' },
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { value: 'other', label: 'Other', icon: '📍' },
];

const RADII = [
  { value: 1000, label: '1 km' },
  { value: 3000, label: '3 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
];

const MAHARASHTRA_LOCATIONS = [
  'Mumbai',
  'Pune',
  'Nagpur',
  'Nashik',
  'Thane',
  'Aurangabad',
  'Solapur',
  'Kolhapur',
  'Amravati',
  'Nanded',
  'Sangli',
  'Jalgaon',
  'Akola',
  'Latur',
  'Dhule',
  'Ahmednagar',
  'Chandrapur',
  'Parbhani',
  'Satara',
  'Beed',
  'Yavatmal',
  'Panvel',
  'Malegaon',
  'Bhiwandi',
  'Ulhasnagar',
  'Gondia',
  'Bhandara',
  // Common talukas
  'Haveli',
  'Mulshi',
  'Maval',
  'Khed',
  'Junnar',
  'Ambegaon',
  'Baramati',
  'Indapur',
  'Daund',
  'Shirur',
  'Karjat',
  'Panvel Taluka',
  'Alibag',
  'Roha',
  'Mahad',
  'Chiplun',
  'Dapoli',
  'Kankavli',
  'Sawantwadi',
  'Satara Taluka',
  'Wai',
  'Karad',
  'Phaltan',
  'Patan',
  'Miraj',
  'Tasgaon',
  'Kagal',
  'Panhala',
  'Hatkanangale',
  'Niphad',
  'Sinnar',
  'Igatpuri',
  'Yeola',
  'Malegaon Taluka',
  'Parner',
  'Sangamner',
  'Rahata',
  'Shrirampur',
  'Nevasa',
  'Akole',
];

export default function FilterPanel({ filters, onChange, cityOptions = [] }) {
  const update = (key, val) => onChange({ ...filters, [key]: val });
  const locations = cityOptions.length > 0 ? cityOptions : MAHARASHTRA_LOCATIONS;

  return (
    <div className="space-y-3 w-full">
      {/* Category pills — horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.value}
            onClick={() => update('category', c.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filters.category === c.value
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Radius + Rating row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 min-w-[220px]">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            list="mh-location-options"
            type="text"
            value={filters.city || ''}
            onChange={(e) => update('city', e.target.value)}
            placeholder="City or Taluka (Maharashtra)"
            className="text-sm text-gray-700 bg-transparent focus:outline-none font-medium w-full"
          />
          <datalist id="mh-location-options">
            {locations.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <select
            value={filters.radius || 5000}
            onChange={(e) => update('radius', Number(e.target.value))}
            className="text-sm text-gray-700 bg-transparent focus:outline-none pr-1 font-medium cursor-pointer"
          >
            {RADII.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="text-yellow-400 text-sm">★</span>
          <select
            value={filters.minRating || ''}
            onChange={(e) => update('minRating', e.target.value)}
            className="text-sm text-gray-700 bg-transparent focus:outline-none pr-1 font-medium cursor-pointer"
          >
            <option value="">Any Rating</option>
            {[1, 2, 3, 4].map((r) => (
              <option key={r} value={r}>{r}+ Stars</option>
            ))}
          </select>
        </div>

        {/* Active filter indicator */}
        {(filters.category || filters.minRating || filters.city) && (
          <button
            type="button"
            onClick={() => onChange({ category: '', radius: filters.radius, minRating: '', city: '' })}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORIES = [
  'restaurant', 'hospital', 'hotel', 'gym', 'salon',
  'pharmacy', 'grocery', 'bank', 'education', 'entertainment', 'other',
];

// Map click handler component
function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) { onSelect(e.latlng); },
  });
  return null;
}

export default function AddEditBusiness() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    category: 'restaurant',
    description: '',
    lat: '',
    lng: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [images, setImages] = useState([]); // new files
  const [existingImages, setExistingImages] = useState([]);
  const [markerPos, setMarkerPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    if (isEdit) {
      // Use the enterprise endpoint so pending/rejected businesses can also be edited
      api.get(`/enterprise/businesses/${id}`)
        .then(({ data }) => {
          const b = data.business;
          const [lng, lat] = b.location.coordinates;
          setForm({
            name: b.name || '',
            category: b.category || 'restaurant',
            description: b.description || '',
            lat: lat?.toString() || '',
            lng: lng?.toString() || '',
            address: b.location?.address || '',
            phone: b.contactInfo?.phone || '',
            email: b.contactInfo?.email || '',
            website: b.contactInfo?.website || '',
          });
          setMarkerPos({ lat, lng });
          setExistingImages(b.images || []);
        })
        .catch(() => setError('Failed to load business'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleMapSelect = ({ lat, lng }) => {
    setMarkerPos({ lat, lng });
    setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
  };

  const handleGeolocate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      handleMapSelect({ lat: coords.latitude, lng: coords.longitude });
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + images.length + files.length;
    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imgUrl) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await api.delete(`/businesses/${id}/image`, { data: { imageUrl: imgUrl } });
      setExistingImages((prev) => prev.filter((img) => img !== imgUrl));
    } catch {
      setError('Failed to delete image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      return setError('Please select a location on the map or use "Use My Location"');
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
    images.forEach((img) => formData.append('images', img));

    try {
      if (isEdit) {
        await api.put(`/businesses/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Business updated! It will be re-reviewed by admin.');
      } else {
        await api.post('/businesses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Business submitted for admin review!');
        setTimeout(() => navigate('/enterprise'), 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to save business';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <LoadingSpinner />;

  const mapCenter = markerPos
    ? [markerPos.lat, markerPos.lng]
    : [20.5937, 78.9629];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Business' : 'Add New Business'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Business Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g., Sunrise Café"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                maxLength={1000}
                placeholder="Describe your business..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.description.length}/1000</p>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Location *</h2>
            <button
              type="button"
              onClick={handleGeolocate}
              className="text-sm text-blue-600 flex items-center gap-1 hover:underline"
            >
              📍 Use My Location
            </button>
          </div>

          <div style={{ height: 280 }} className="rounded-xl overflow-hidden mb-4 border border-gray-200">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <LocationPicker onSelect={handleMapSelect} />
              {markerPos && <Marker position={[markerPos.lat, markerPos.lng]} />}
            </MapContainer>
          </div>
          <p className="text-xs text-gray-400 mb-3">Click on the map to set your business location</p>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Latitude</label>
              <input
                name="lat"
                value={form.lat}
                onChange={handleChange}
                placeholder="auto-filled from map"
                readOnly
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Longitude</label>
              <input
                name="lng"
                value={form.lng}
                onChange={handleChange}
                placeholder="auto-filled from map"
                readOnly
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, City"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="business@email.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                type="url"
                placeholder="https://yourbusiness.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Business Images (max 5)</h2>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {existingImages.map((img, i) => (
                <div key={i} className="relative w-24 h-20">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New images preview */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {images.map((file, i) => (
                <div key={i} className="relative w-24 h-20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover rounded-lg border-2 border-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
            Upload Images (JPG, PNG – max 5MB each)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              isEdit ? 'Update Business' : 'Submit for Review'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/enterprise')}
            className="px-8 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

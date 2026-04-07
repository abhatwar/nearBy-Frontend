import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix default marker icons for Vite/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Pan map on center change
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapView({ businesses = [], userLocation }) {
  const defaultCenter =
    userLocation
      ? [userLocation.lat, userLocation.lng]
      : [20.5937, 78.9629]; // India center fallback

  return (
    <div className="w-full h-full rounded-xl overflow-hidden" style={{ minHeight: 350 }}>
      <MapContainer center={defaultCenter} zoom={13} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <span className="font-medium">You are here</span>
            </Popup>
          </Marker>
        )}

        {businesses.map((b) => {
          const [lng, lat] = b.location.coordinates;
          return (
            <Marker key={b._id} position={[lat, lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">{b.name}</p>
                  <p className="text-gray-500 capitalize">{b.category}</p>
                  {b.location?.address && (
                    <p className="text-gray-500 text-xs">{b.location.address}</p>
                  )}
                  <Link
                    to={`/business/${b._id}`}
                    className="text-blue-600 text-xs mt-1 block hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <RecenterMap center={userLocation ? [userLocation.lat, userLocation.lng] : null} />
      </MapContainer>
    </div>
  );
}

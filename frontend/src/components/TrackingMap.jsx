import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom SVG Icons for Customer Breakdown & Mechanic Live GPS
const customerIcon = new L.DivIcon({
  className: 'custom-customer-icon',
  html: `
    <div style="
      background-color: #EF4444;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg style="width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const mechanicIcon = new L.DivIcon({
  className: 'custom-mechanic-icon',
  html: `
    <div style="
      background-color: #2563EB;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(37,99,235,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    ">
      <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.6C.4 7 1 10 3 12c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.4-.4.4-1.1 0-1.4z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Component to dynamically fit map bounds to show both customer and mechanic
function AutoFitBounds({ customerPos, mechanicPos }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (customerPos && !isNaN(customerPos[0]) && !isNaN(customerPos[1])) {
      points.push(customerPos);
    }
    if (mechanicPos && !isNaN(mechanicPos[0]) && !isNaN(mechanicPos[1])) {
      points.push(mechanicPos);
    }

    if (points.length === 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [customerPos, mechanicPos, map]);

  return null;
}

export default function TrackingMap({ customerLat, customerLng, mechanicLat, mechanicLng, height = '400px' }) {
  const cLat = parseFloat(customerLat);
  const cLng = parseFloat(customerLng);
  const mLat = parseFloat(mechanicLat);
  const mLng = parseFloat(mechanicLng);

  const hasCustomer = !isNaN(cLat) && !isNaN(cLng);
  const hasMechanic = !isNaN(mLat) && !isNaN(mLng);

  const center = hasCustomer ? [cLat, cLng] : hasMechanic ? [mLat, mLng] : [12.9716, 77.5946];

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasCustomer && (
          <Marker position={[cLat, cLng]} icon={customerIcon}>
            <Popup>
              <div className="text-sm font-medium text-slate-900">Breakdown Location</div>
            </Popup>
          </Marker>
        )}

        {hasMechanic && (
          <Marker position={[mLat, mLng]} icon={mechanicIcon}>
            <Popup>
              <div className="text-sm font-medium text-slate-900">Mechanic Live Location</div>
            </Popup>
          </Marker>
        )}

        <AutoFitBounds 
          customerPos={hasCustomer ? [cLat, cLng] : null} 
          mechanicPos={hasMechanic ? [mLat, mLng] : null} 
        />
      </MapContainer>
    </div>
  );
}

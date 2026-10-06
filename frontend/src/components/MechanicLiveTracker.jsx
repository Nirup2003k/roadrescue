import React, { useEffect, useState, useRef } from 'react';
import { Navigation, AlertTriangle, Radio, CheckCircle, RefreshCw } from 'lucide-react';
import { getSocket } from '../utils/socket';
import Button from './ui/Button';

export default function MechanicLiveTracker({ bookingId, status }) {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const [lastSent, setLastSent] = useState(null);
  const [coords, setCoords] = useState(null);

  const watchIdRef = useRef(null);
  const lastEmittedRef = useRef(0);

  const isActiveStatus = status === 'accepted' || status === 'in_progress';

  useEffect(() => {
    if (!isActiveStatus) {
      stopTracking();
      return;
    }

    // Auto-start location tracking for active job
    startTracking();

    return () => {
      stopTracking();
    };
  }, [bookingId, status]);

  function startTracking() {
    setError(null);

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const socket = getSocket();
    if (!socket) {
      setError('Socket connection failed.');
      return;
    }

    // Join room
    socket.emit('join_booking_room', { bookingId }, (res) => {
      if (res && !res.success) {
        console.warn('[tracker] Could not join room:', res.message);
      }
    });

    setTracking(true);

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ latitude, longitude, accuracy });

        const now = Date.now();
        // Throttle updates: send at most once every 3 seconds
        if (now - lastEmittedRef.current >= 3000) {
          lastEmittedRef.current = now;
          socket.emit('location_update', {
            bookingId,
            latitude,
            longitude,
            accuracy,
          });
          setLastSent(new Date());
        }
      },
      (err) => {
        console.error('[tracker] Geolocation error:', err);
        if (err.code === 1) {
          setError('Location permission denied. Please enable location access in your browser to share live location with customer.');
        } else {
          setError(`Location error: ${err.message}`);
        }
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('leave_booking_room', { bookingId });
    }
    setTracking(false);
  }

  if (!isActiveStatus) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${tracking ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
          <span className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-beacon-600" /> Real-time GPS Location Sharing
          </span>
        </div>

        {tracking ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            <CheckCircle className="h-3.5 w-3.5" /> Sharing Live
          </span>
        ) : (
          <Button variant="outline" size="sm" onClick={startTracking} className="text-xs">
            <RefreshCw className="h-3 w-3" /> Retry GPS
          </Button>
        )}
      </div>

      {error ? (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      ) : coords ? (
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 block">Current Coordinates</span>
            <span className="font-mono text-slate-800">{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Last Sent to Customer</span>
            <span className="font-mono text-slate-800">{lastSent ? lastSent.toLocaleTimeString() : 'Sending...'}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Acquiring GPS location...</p>
      )}
    </div>
  );
}

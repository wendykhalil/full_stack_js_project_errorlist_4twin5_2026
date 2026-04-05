import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin, Navigation, X } from 'lucide-react';

const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const DEFAULT_CENTER = { lat: 36.8065, lng: 10.1815 };

function loadLeafletAssets() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.L) {
      resolve(window.L);
      return;
    }

    if (typeof document !== 'undefined' && !document.querySelector(`link[data-leaflet-css="true"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet-css', 'true');
      document.head.appendChild(link);
    }

    const existing = typeof document !== 'undefined' ? document.querySelector(`script[data-leaflet-js="true"]`) : null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', () => reject(new Error('Unable to load map library')));
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.setAttribute('data-leaflet-js', 'true');
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Unable to load map library'));
    document.body.appendChild(script);
  });
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) throw new Error('Reverse geocoding failed');
  const data = await response.json();
  const address = data?.address || {};
  const city = address.city || address.town || address.village || address.county || '';
  const street = [address.road, address.house_number].filter(Boolean).join(' ').trim();

  return {
    city,
    address: street || data?.display_name || '',
    displayName: data?.display_name || '',
  };
}

export default function MapPickerModal({
  open,
  onClose,
  initialValue,
  onUsePlace,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [selected, setSelected] = useState(() => ({
    lat: initialValue?.latitude || DEFAULT_CENTER.lat,
    lng: initialValue?.longitude || DEFAULT_CENTER.lng,
    city: initialValue?.city || '',
    address: initialValue?.address || '',
  }));
  const [loadingMap, setLoadingMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [mapError, setMapError] = useState('');

  const initialCenter = useMemo(() => ({
    lat: Number.isFinite(Number(initialValue?.latitude)) ? Number(initialValue.latitude) : DEFAULT_CENTER.lat,
    lng: Number.isFinite(Number(initialValue?.longitude)) ? Number(initialValue.longitude) : DEFAULT_CENTER.lng,
  }), [initialValue]);

  const updateSelection = async (lat, lng, options = {}) => {
    const next = {
      lat: Number(lat),
      lng: Number(lng),
      city: options.city ?? selected.city ?? '',
      address: options.address ?? selected.address ?? '',
    };

    setSelected(next);

    if (markerRef.current) {
      markerRef.current.setLatLng([next.lat, next.lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([next.lat, next.lng]);
    }

    if (options.skipReverseGeocode) return;

    try {
      setGeocodeLoading(true);
      const place = await reverseGeocode(next.lat, next.lng);
      setSelected((current) => ({
        ...current,
        city: place.city || current.city,
        address: place.address || place.displayName || current.address,
      }));
    } catch {
      // keep manual coordinates even if reverse geocoding fails
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported on this device.');
      return;
    }

    setMapError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false);
        await updateSelection(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocating(false);
        setMapError(error?.message || 'Unable to access your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    if (!open || !mapRef.current) return undefined;
    let cancelled = false;

    setLoadingMap(true);
    setMapError('');

    loadLeafletAssets()
      .then((L) => {
        if (cancelled || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: 12,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        markerRef.current = L.marker([selected.lat, selected.lng], { draggable: true }).addTo(map);

        map.on('click', (event) => {
          updateSelection(event.latlng.lat, event.latlng.lng);
        });

        markerRef.current.on('dragend', () => {
          const markerLatLng = markerRef.current.getLatLng();
          updateSelection(markerLatLng.lat, markerLatLng.lng);
        });

        window.setTimeout(() => {
          map.invalidateSize();
        }, 150);
      })
      .catch((error) => {
        if (!cancelled) {
          setMapError(error.message || 'Unable to open the map.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMap(false);
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [open, initialCenter.lat, initialCenter.lng]);

  useEffect(() => {
    if (!open) {
      setSelected({
        lat: initialValue?.latitude || DEFAULT_CENTER.lat,
        lng: initialValue?.longitude || DEFAULT_CENTER.lng,
        city: initialValue?.city || '',
        address: initialValue?.address || '',
      });
    }
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Choose project location</h3>
            <p className="mt-1 text-sm text-slate-500">Click on the map or use your current location.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="relative min-h-[420px] bg-slate-100">
            {(loadingMap || geocodeLoading) && (
              <div className="absolute right-4 top-4 z-[400] inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {loadingMap ? 'Loading map...' : 'Finding place details...'}
              </div>
            )}
            <div ref={mapRef} className="h-[420px] w-full" />
          </div>

          <div className="space-y-4 p-6">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {locating ? 'Getting your location...' : 'Use my current place'}
            </button>

            {mapError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{mapError}</div> : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-indigo-600" /> Selected place
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Latitude</div>
                  <div className="mt-1 font-medium text-slate-900">{selected.lat.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Longitude</div>
                  <div className="mt-1 font-medium text-slate-900">{selected.lng.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">City</div>
                  <div className="mt-1 font-medium text-slate-900">{selected.city || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Address</div>
                  <div className="mt-1 text-slate-700">{selected.address || '—'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button
                type="button"
                onClick={() => onUsePlace({
                  latitude: Number(selected.lat.toFixed(6)),
                  longitude: Number(selected.lng.toFixed(6)),
                  city: selected.city,
                  address: selected.address,
                })}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Use this place
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

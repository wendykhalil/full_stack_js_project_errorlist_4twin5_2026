import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { updateUserLocation } from '../auth/api';

const SESSION_KEY = 'artisan_location_prompt_seen';
const LOCATION_STALE_DAYS = 30;

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function isLocationStale(location) {
  if (!location || typeof location !== 'object') return true;
  const hasCoords = Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng));
  if (!hasCoords) return true;
  if (!location.updatedAt) return true;

  const updatedAtMs = new Date(location.updatedAt).getTime();
  if (!Number.isFinite(updatedAtMs)) return true;

  const staleAfterMs = LOCATION_STALE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - updatedAtMs > staleAfterMs;
}

function geolocationErrorMessage(error) {
  if (!error) return 'Impossible de détecter votre position.';
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permission de géolocalisation refusée.';
    case error.POSITION_UNAVAILABLE:
      return 'Position indisponible.';
    case error.TIMEOUT:
      return 'Délai dépassé lors de la détection.';
    default:
      return error.message || 'Impossible de détecter votre position.';
  }
}

export default function ArtisanLocationPromptModal() {
  const { isAuthenticated, token, user, updateSessionUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const shouldPrompt = useMemo(() => {
    if (!isAuthenticated || !token || !user) return false;
    if (normalizeRole(user.role) !== 'ARTISAN') return false;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === '1') return false;
    return isLocationStale(user.location);
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    if (!shouldPrompt) return;
    setOpen(true);
  }, [shouldPrompt]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const closeModal = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    }
    setOpen(false);
    setDetecting(false);
    setSaving(false);
    setError('');
  };

  const detectPosition = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas supportée par ce navigateur.');
      return;
    }

    setError('');
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetecting(false);
        setCoords({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        });
      },
      (geoError) => {
        setDetecting(false);
        setError(geolocationErrorMessage(geoError));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const confirmLocation = async () => {
    if (!coords || !token) return;
    setSaving(true);
    setError('');
    try {
      const response = await updateUserLocation({ token, lat: coords.lat, lng: coords.lng });
      if (response?.user) {
        updateSessionUser(response.user);
      }
      setSuccessMessage('Position mise à jour');
      closeModal();
    } catch (err) {
      setError(err?.message || 'Impossible de sauvegarder la position.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return successMessage ? (
      <div className="fixed right-4 top-4 z-[90] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow">
        {successMessage}
      </div>
    ) : null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Mise a jour de position</h3>
        <p className="mt-2 text-sm text-slate-600">
          Pour améliorer votre expérience, veuillez mettre à jour votre position.
        </p>

        {coords ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <div>Latitude: {coords.lat.toFixed(6)}</div>
            <div>Longitude: {coords.lng.toFixed(6)}</div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Ignorer
          </button>
          {!coords ? (
            <button
              type="button"
              onClick={detectPosition}
              disabled={detecting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {detecting ? 'Détection...' : 'Détecter ma position'}
            </button>
          ) : (
            <button
              type="button"
              onClick={confirmLocation}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Confirmer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

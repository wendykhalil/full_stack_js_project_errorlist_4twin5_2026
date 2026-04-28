import React, { useState } from "react";
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";

export default function LiveLocationSection({
  city, setCity,
  zone, setZone,
  latitude, setLatitude,
  longitude, setLongitude,
  address, setAddress,
  isSupplier,
  onOpenMap,
  onMapSelection,
}) {
  const [detecting, setDetecting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=fr`
      );
      const data = await res.json();
      if (!data?.address) return null;
      const a = data.address;
      return {
        city: a.city || a.town || a.village || a.municipality || a.county || "",
        zone: a.suburb || a.neighbourhood || a.quarter || a.district || "",
        fullAddress: data.display_name || "",
      };
    } catch { return null; }
  };

  const detectLocation = () => {
    setDetecting(true);
    setErr(""); setMsg("");
    if (!navigator.geolocation) {
      setErr("Géolocalisation non supportée par votre navigateur.");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(String(lat));
        setLongitude(String(lng));
        const geo = await reverseGeocode(lat, lng);
        if (geo) {
          if (geo.city) setCity(geo.city);
          if (isSupplier) { if (geo.fullAddress) setAddress(geo.fullAddress); }
          else { if (geo.zone) setZone(geo.zone); }
          setMsg("Position détectée avec succès !");
        } else {
          setMsg(`Coordonnées détectées : ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setDetecting(false);
      },
      (e) => {
        setDetecting(false);
        if (e.code === 1) setErr("Accès refusé. Autorisez la localisation dans votre navigateur.");
        else if (e.code === 2) setErr("Position indisponible.");
        else setErr("Délai dépassé. Réessayez.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="space-y-5">
      {/* Two action buttons */}
      <div className="flex gap-3">
        <button type="button" onClick={detectLocation} disabled={detecting}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50">
          {detecting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Détection...</>
            : <><Zap className="h-4 w-4" /> Détecter ma position</>}
        </button>
        <button type="button" onClick={onOpenMap}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
          <MapPin className="h-4 w-4" /> Choisir sur la carte
        </button>
      </div>

      {/* Feedback */}
      {msg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> {msg}
        </div>
      )}
      {err && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {/* Fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Ville</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Tunis"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            {isSupplier ? "Adresse complète" : "Zone / Quartier"}
          </label>
          <input
            value={isSupplier ? address : zone}
            onChange={(e) => isSupplier ? setAddress(e.target.value) : setZone(e.target.value)}
            placeholder={isSupplier ? "Ex : 123 Avenue Habib Bourguiba" : "Ex : Lac 2"}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Latitude</label>
          <input value={latitude} onChange={(e) => setLatitude(e.target.value)} type="text" placeholder="Ex : 36.8065"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Longitude</label>
          <input value={longitude} onChange={(e) => setLongitude(e.target.value)} type="text" placeholder="Ex : 10.1815"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
        </div>
      </div>

      {/* Coordinates badge */}
      {latitude && longitude && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span><span className="font-bold">Position enregistrée :</span> {parseFloat(latitude).toFixed(6)}°, {parseFloat(longitude).toFixed(6)}°</span>
        </div>
      )}
    </div>
  );
}

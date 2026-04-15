import React, { useState } from "react";
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function LiveLocationSection({
  city,
  setCity,
  zone,
  setZone,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  address,
  setAddress,
  isSupplier,
  onOpenMap,
  onMapSelection
}) {
  const [locationMode, setLocationMode] = useState("manual"); // "manual" or "auto"
  const [detecting, setDetecting] = useState(false);
  const [locationMsg, setLocationMsg] = useState("");
  const [locationErr, setLocationErr] = useState("");

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=fr`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addressComponents = data.address;
        const detectedCity = addressComponents.city || 
                            addressComponents.town || 
                            addressComponents.village || 
                            addressComponents.municipality || 
                            addressComponents.county || "";
        
        const detectedZone = addressComponents.suburb || 
                           addressComponents.neighbourhood || 
                           addressComponents.quarter || 
                           addressComponents.district || "";
        
        const fullAddress = data.display_name || "";
        
        return {
          city: detectedCity,
          zone: detectedZone,
          address: fullAddress
        };
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  };

  // Auto-detect location using browser geolocation
  const detectLocation = async () => {
    setDetecting(true);
    setLocationErr("");
    setLocationMsg("");

    if (!navigator.geolocation) {
      setLocationErr("La géolocalisation n'est pas supportée par votre navigateur.");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Always set coordinates first
          setLatitude(String(lat));
          setLongitude(String(lng));
          
          // Try to get address information
          const locationData = await reverseGeocode(lat, lng);
          
          if (locationData && (locationData.city || locationData.zone || locationData.address)) {
            // Successfully got address data
            if (locationData.city) setCity(locationData.city);
            if (locationData.zone || locationData.address) {
              if (isSupplier && setAddress) {
                setAddress(locationData.address || locationData.zone || "");
              } else {
                setZone(locationData.zone || "");
              }
            }
            setLocationMsg("Localisation détectée automatiquement avec succès !");
          } else {
            // Coordinates detected but no address info
            setLocationMsg(`Position détectée avec succès ! Coordonnées : ${lat.toFixed(6)}, ${lng.toFixed(6)}. Vous pouvez saisir manuellement la ville et la zone.`);
          }
        } catch (error) {
          // Even if reverse geocoding fails, we still have coordinates
          setLocationMsg(`Position détectée avec succès ! Coordonnées : ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}. Impossible de récupérer l'adresse automatiquement.`);
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationErr("Accès à la localisation refusé. Veuillez autoriser l'accès dans votre navigateur.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationErr("Informations de localisation non disponibles.");
            break;
          case error.TIMEOUT:
            setLocationErr("Délai d'attente dépassé pour la détection de localisation.");
            break;
          default:
            setLocationErr("Erreur inconnue lors de la détection de localisation.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="sm:col-span-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Localisation
      </label>
      
      {/* Location Mode Selector */}
      <div className="mt-2 mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setLocationMode("manual");
              setLocationMsg("");
              setLocationErr("");
            }}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              locationMode === "manual"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <MapPin className="mx-auto h-4 w-4 mb-1" />
            Saisie manuelle
          </button>
          <button
            type="button"
            onClick={() => {
              setLocationMode("auto");
              setLocationMsg("");
              setLocationErr("");
            }}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              locationMode === "auto"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <Navigation className="mx-auto h-4 w-4 mb-1" />
            Détection auto
          </button>
        </div>
      </div>

      {/* Messages */}
      {locationMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{locationMsg}</span>
          </div>
        </div>
      )}
      
      {locationErr && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{locationErr}</span>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {locationMode === "manual" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ville
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex : Tunis"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isSupplier ? "Adresse" : "Zone / Quartier"}
              </label>
              <input
                value={isSupplier ? address : zone}
                onChange={(e) => isSupplier ? setAddress(e.target.value) : setZone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder={isSupplier ? "Ex : 123 Avenue Habib Bourguiba" : "Ex : Lac 2"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Latitude
              </label>
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex : 36.8065"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Longitude
              </label>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex : 10.1815"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {city || (isSupplier ? address : zone) 
                  ? `${city || 'Ville sélectionnée'}${(isSupplier ? address : zone) ? ` - ${isSupplier ? address : zone}` : ''}` 
                  : 'Choisissez votre emplacement sur la carte pour une sélection précise.'}
              </div>
              <button
                type="button"
                onClick={onOpenMap}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <MapPin className="h-4 w-4" /> Ouvrir la carte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Mode */}
      {locationMode === "auto" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <Navigation className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Détection automatique de localisation
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Cliquez sur le bouton ci-dessous pour détecter automatiquement votre position actuelle.
              Les champs seront remplis automatiquement et vous pourrez les modifier si nécessaire.
            </p>
            
            <button
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Détection en cours...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Détecter ma position
                </>
              )}
            </button>
          </div>

          {/* Show input fields in auto mode too */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ville
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex : Tunis"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isSupplier ? "Adresse" : "Zone / Quartier"}
              </label>
              <input
                value={isSupplier ? address : zone}
                onChange={(e) => isSupplier ? setAddress(e.target.value) : setZone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder={isSupplier ? "Ex : 123 Avenue Habib Bourguiba" : "Ex : Lac 2"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Latitude
              </label>
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex : 36.8065"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Longitude
              </label>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex : 10.1815"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {city || (isSupplier ? address : zone) 
                  ? `${city || 'Ville sélectionnée'}${(isSupplier ? address : zone) ? ` - ${isSupplier ? address : zone}` : ''}` 
                  : 'Utilisez la détection automatique ou saisissez manuellement. Vous pouvez aussi ouvrir la carte.'}
              </div>
              <button
                type="button"
                onClick={onOpenMap}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <MapPin className="h-4 w-4" /> Ouvrir la carte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
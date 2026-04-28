import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n';
import { apiFetch } from '../auth/api';
import SimpleFooter from '../components/Footer';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge } from 'lucide-react';

const ArtisanWeather = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const pendingCoords = useRef(null);

  const initializeMap = useCallback((lat, lon) => {
    if (!window.L || !mapContainer.current) return;

    setMapLoading(true);

    if (!map.current) {
      map.current = window.L.map(mapContainer.current).setView([lat, lon], 10);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);
    } else {
      map.current.setView([lat, lon], 10);
    }

    if (marker.current) map.current.removeLayer(marker.current);
    marker.current = window.L.marker([lat, lon])
      .addTo(map.current)
      .bindPopup('Your Location')
      .openPopup();

    // invalidateSize fixes tiles when the container was hidden during init
    requestAnimationFrame(() => {
      if (map.current) map.current.invalidateSize();
      setMapLoading(false);
    });
  }, []);

  // ── Load Leaflet CSS + JS (parallel with geolocation) ───────────
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // ── Init map once BOTH weather (→ container rendered) + location are ready ──
  useEffect(() => {
    if (!location || !weather) return;
    if (!window.L) return; // Leaflet not yet loaded; script.onload will handle it via pendingCoords
    if (map.current) return; // already initialized
    initializeMap(location.latitude, location.longitude);
  }, [weather, location, initializeMap]);

  // ── Fallback: Leaflet finished loading after weather+location were set ───────
  useEffect(() => {
    const script = document.getElementById('leaflet-js');
    if (!script) return;
    const handleLoad = () => {
      if (pendingCoords.current && !map.current) {
        initializeMap(pendingCoords.current.latitude, pendingCoords.current.longitude);
        pendingCoords.current = null;
      }
    };
    script.addEventListener('load', handleLoad);
    return () => script.removeEventListener('load', handleLoad);
  }, [initializeMap]);

  useEffect(() => {
    setError(null);
    setWeather(null);
    setLocation(null);
    setLoading(true);
    map.current = null;
    marker.current = null;

    if (!token) {
      setError('Authentication token not available');
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError(t('weather.geolocationNotSupported'));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        pendingCoords.current = { latitude, longitude };

        try {
          const data = await apiFetch(
            `/weather/by-coords?lat=${latitude}&lon=${longitude}`,
            { token }
          );
          setWeather(data.data);
        } catch (err) {
          console.error('Weather error:', err);
          setError(err.message || t('weather.error'));
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError(t('weather.locationDenied'));
        setLoading(false);
      }
    );
  // t is stable; retryKey intentionally triggers a full re-fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, retryKey]);

  const isGoodDayToWork = (weatherData) => {
    if (!weatherData) return null;

    const temp = weatherData.main.temp;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    const humidity = weatherData.main.humidity;

    const badWeather = ['rain', 'snow', 'thunderstorm', 'drizzle'];
    const isBadWeather = badWeather.includes(weatherMain);
    const isTooHot = temp > 35;
    const isTooCold = temp < 5;
    const isTooHumid = humidity > 80;

    if (isBadWeather || isTooHot || isTooCold || isTooHumid) {
      return false;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">{t('weather.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => setRetryKey(k => k + 1)}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {t('weather.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const goodDay = isGoodDayToWork(weather);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex-1">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('weather.title')}</h1>
          {weather && (
            <p className="text-lg text-gray-600">
              {weather.name}, {weather.sys.country}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {weather && (
          <>
            {/* Main Weather Card */}
            <div className={`w-full rounded-2xl shadow-lg p-8 mb-8 text-white ${
              goodDay ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-orange-400 to-red-600'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-lg opacity-90 mb-2">{goodDay ? t('weather.goodDay') : t('weather.notIdeal')}</p>
                  <div className="flex items-baseline">
                    <span className="text-6xl font-bold">{Math.round(weather.main.temp)}</span>
                    <span className="text-3xl ml-2">°C</span>
                  </div>
                </div>
                <div className="text-right">
                  <img
                    src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                    alt={weather.weather[0].description}
                    className="w-24 h-24"
                  />
                  <p className="capitalize text-sm font-semibold">{weather.weather[0].description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm opacity-80">Feels Like</p>
                  <p className="text-2xl font-bold">{Math.round(weather.main.feels_like)}°C</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm opacity-80">Min/Max</p>
                  <p className="text-2xl font-bold">{Math.round(weather.main.temp_min)}° / {Math.round(weather.main.temp_max)}°</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm opacity-80">Humidity</p>
                  <p className="text-2xl font-bold">{weather.main.humidity}%</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm opacity-80">Wind Speed</p>
                  <p className="text-2xl font-bold">{weather.wind.speed} m/s</p>
                </div>
              </div>
            </div>

            {/* Map and Location */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
        <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden relative">
          <div
            ref={mapContainer}
            className="w-full h-96 bg-gray-200"
          />
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('weather.locationInfo')}</h3>
                {location && (
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm text-gray-600">Latitude</p>
                      <p className="text-lg font-semibold text-gray-800">{location.latitude.toFixed(4)}</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <p className="text-sm text-gray-600">Longitude</p>
                      <p className="text-lg font-semibold text-gray-800">{location.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Weather Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center fill-blue-500 mb-2">
                  <Wind className="w-6 h-6 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800">Wind</h4>
                </div>
                <p className="text-2xl font-bold text-gray-800">{weather.wind.speed} m/s</p>
                <p className="text-sm text-gray-600">
                  {weather.wind.deg ? `Direction: ${weather.wind.deg}°` : 'Wind conditions'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-2">
                  <Droplets className="w-6 h-6 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800">Humidity</h4>
                </div>
                <p className="text-2xl font-bold text-gray-800">{weather.main.humidity}%</p>
                <p className="text-sm text-gray-600">Moisture in air</p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-2">
                  <Eye className="w-6 h-6 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800">Visibility</h4>
                </div>
                <p className="text-2xl font-bold text-gray-800">{(weather.visibility / 1000).toFixed(1)} km</p>
                <p className="text-sm text-gray-600">Clear view distance</p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center mb-2">
                  <Gauge className="w-6 h-6 text-blue-500 mr-2" />
                  <h4 className="font-semibold text-gray-800">Pressure</h4>
                </div>
                <p className="text-2xl font-bold text-gray-800">{weather.main.pressure} hPa</p>
                <p className="text-sm text-gray-600">Air pressure</p>
              </div>
            </div>

            {/* Work Assessment */}
            <div className={`w-full rounded-2xl shadow-lg p-8 ${
              goodDay ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
            }`}>
              <h3 className={`text-2xl font-bold mb-3 ${goodDay ? 'text-green-800' : 'text-orange-800'}`}>
                {t('weather.workAssessment')}
              </h3>
              <p className={`text-lg ${goodDay ? 'text-green-700' : 'text-orange-700'}`}>
                {t('weather.assessmentDesc')}
              </p>
              {weather && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${weather.main.temp > 5 && weather.main.temp < 35 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Temperature: {weather.main.temp > 5 && weather.main.temp < 35 ? '✓ Ideal' : '✗ Not ideal'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${!['rain', 'snow', 'thunderstorm', 'drizzle'].includes(weather.weather[0].main.toLowerCase()) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Weather: {!['rain', 'snow', 'thunderstorm', 'drizzle'].includes(weather.weather[0].main.toLowerCase()) ? '✓ Clear' : '✗ Rainy/Stormy'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-4 h-4 rounded-full mr-2 ${weather.main.humidity < 80 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Humidity: {weather.main.humidity < 80 ? '✓ Normal' : '✗ Too humid'}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>{/* end flex-1 */}
      <SimpleFooter />
    </div>
  );
};

export default ArtisanWeather;
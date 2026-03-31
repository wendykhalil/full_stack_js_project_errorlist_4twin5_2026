import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Navigation,
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle,
  User,
  Star,
  Phone
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

const ArtisanCard = ({ artisan, onViewProfile }) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const artisanRating = Number(artisan?.rating ?? artisan?.avgRating ?? 4.8);
  const normalizedArtisanRating = Number.isFinite(artisanRating) ? Math.max(0, Math.min(5, artisanRating)) : 4.8;
  const artisanStarCount = Math.round(normalizedArtisanRating);

  const renderArtisanStars = () => {
    return [0, 1, 2, 3, 4].map((index) => (
      <Star
        key={`prescripteur-artisan-star-${index}`}
        className={`h-4 w-4 ${index < artisanStarCount ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
      />
    ));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 overflow-hidden">
            {artisan.profileImage && !imageError ? (
              <img
                src={artisan.profileImage}
                alt={artisan.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">{artisan.name}</div>
            <div className="mt-1 text-sm text-slate-500">{artisan.trade || 'Profil en cours de completion'}</div>
          </div>
        </div>

        {artisan.distance && (
          <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
            <Navigation className="h-3 w-3" />
            {artisan.distance.text || `${artisan.distance} km`}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="h-4 w-4 text-slate-400" />
        {artisan.region || 'Region non renseignee'}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <div>{artisan.hasCompletedProfile ? t('prescripteurArtisans.projectsCompleted', { count: artisan.totalProjects || 0 }) : 'Compte artisan actif'}</div>
        <div className="flex items-center gap-1">
          {renderArtisanStars()}
          <span>{normalizedArtisanRating.toFixed(1)}</span>
        </div>
      </div>

      <div className="mt-5 h-px w-full bg-slate-200" />

      <div className="mt-5 flex flex-col gap-3">
        {artisan.phone ? (
          <a
            href={`tel:${artisan.phone}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Phone className="h-4 w-4" />
            {t('prescripteurArtisans.contactButton')}
          </a>
        ) : (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3 text-sm font-medium text-slate-500">
            <Phone className="h-4 w-4" />
            Numero non renseigne
          </div>
        )}

        <button
          onClick={() => onViewProfile(artisan._id)}
          className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-700 py-3 text-sm font-semibold text-white hover:bg-indigo-800"
        >
          {t('prescripteurArtisans.viewProfileButton')}
        </button>
      </div>
    </div>
  );
};

export default function PrescripteurArtisans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });

  // Filtres
  const [filters, setFilters] = useState({
    specialty: '',
    region: '',
    distance: 20,
    useLocation: false,
    latitude: null,
    longitude: null
  });

  const [locationStatus, setLocationStatus] = useState('');

  const specialties = [
    'Plombier',
    'Électricien',
    'Maçon',
    'Peintre',
    'Menuisier',
    'Carreleur',
    'Chauffagiste',
    'Climatisation',
    'Jardinier'
  ];

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters(prev => ({
          ...prev,
          useLocation: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLocationStatus('success');
        searchArtisans(1, {
          ...filters,
          useLocation: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationStatus('error');
      }
    );
  };

  const searchArtisans = async (pageNum = 1, searchFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: pagination.limit
      });

      if (searchFilters.specialty) {
        params.append('specialty', searchFilters.specialty);
      }
      if (searchFilters.region) {
        params.append('region', searchFilters.region);
      }
      if (searchFilters.useLocation && searchFilters.latitude && searchFilters.longitude) {
        params.append('lat', searchFilters.latitude);
        params.append('lng', searchFilters.longitude);
        params.append('distance', searchFilters.distance);
      }

      const response = await fetch(`http://localhost:5000/api/search/artisans?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();

      if (data.data) {
        setArtisans(data.data.artisans || []);
        setPagination(data.data.pagination || {
          page: pageNum,
          limit: 12,
          total: data.data.artisans?.length || 0,
          pages: 1
        });
      }
    } catch (err) {
      console.error('Error searching artisans:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchArtisans(1, filters);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    searchArtisans(1, filters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const newFilters = {
      specialty: '',
      region: '',
      distance: 20,
      useLocation: false,
      latitude: null,
      longitude: null
    };
    setFilters(newFilters);
    setLocationStatus('');
    searchArtisans(1, newFilters);
    setShowFilters(false);
  };

  const handleViewProfile = (artisanId) => {
    navigate(`/prescripteur/artisan/${artisanId}`);
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {t('prescripteurArtisans.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('prescripteurArtisans.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {(filters.specialty || filters.region || filters.useLocation) && (
            <span className="ml-1 w-2 h-2 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Filtres rapides */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={t('prescripteurArtisans.searchPlaceholder')}
              value={filters.specialty || filters.region}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, specialty: value, region: value }));
              }}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="w-full md:w-72">
            <select
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{t('prescripteurArtisans.specialtyPlaceholder')}</option>
              {specialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              placeholder={t('prescripteurArtisans.regionPlaceholder')}
              className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => searchArtisans(1)}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : artisans.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Aucun artisan trouvé
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {artisans.map((artisan) => (
              <ArtisanCard
                key={artisan._id}
                artisan={artisan}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => searchArtisans(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {pagination.page} sur {pagination.pages}
              </span>
              <button
                onClick={() => searchArtisans(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal des filtres */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Métier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Métier
                </label>
                <select
                  value={filters.specialty}
                  onChange={(e) => handleFilterChange('specialty', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Tous les métiers</option>
                  {specialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Région */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Région
                </label>
                <input
                  type="text"
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  placeholder="Ex: Tunis, Sousse..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Recherche par proximité */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Recherche par proximité
                  </label>
                  {!filters.useLocation && (
                    <button
                      onClick={getUserLocation}
                      disabled={locationStatus === 'loading'}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Navigation className="h-4 w-4" />
                      {locationStatus === 'loading' ? 'Chargement...' : 'Utiliser ma position'}
                    </button>
                  )}
                </div>

                {filters.useLocation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-xl">
                      <MapPin className="h-4 w-4" />
                      <span>Position utilisée</span>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, useLocation: false }))}
                        className="ml-auto text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Rayon de recherche (km)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={filters.distance}
                        onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{filters.distance} km</span>
                      </div>
                    </div>
                  </div>
                ) : locationStatus === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    Impossible d'obtenir votre position
                  </p>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetFilters}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SimpleFooter />
    </div>
  );
}
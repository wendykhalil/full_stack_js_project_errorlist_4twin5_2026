import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from '../i18n';
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
  Phone,
  ChevronDown,
  Wifi,
  WifiOff,
  MessageCircle
} from 'lucide-react';
import SimpleFooter from '../components/Footer';
import Pagination from '../components/Pagination';
import ArtisanReviewsList from '../components/ArtisanReviewsList';

const ArtisanCard = ({ artisan, onViewProfile }) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [plan, setPlan] = useState(null);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (!artisan._id) return;
    fetch(`http://localhost:5000/api/subscriptions/public/${artisan.userId || artisan._id}`)
      .then(r => r.json()).then(r => setPlan(r?.data?.plan || null)).catch(() => {});
  }, [artisan._id]);

  const rating = Number(artisan?.avgRating ?? artisan?.rating ?? 0);
  const stars = Math.round(rating);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-indigo-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 overflow-hidden">
              {artisan.profileImage && !imageError ? (
                <img src={artisan.profileImage} alt={artisan.name} className="h-full w-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{artisan.name}</h3>
                {plan === 'PRO' && (
                  <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2 py-0.5 text-xs font-bold text-white">PRO</span>
                )}
                {plan === 'BASIC' && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">BASIC</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{artisan.trade || 'Profil en cours'}</p>
            </div>
          </div>
          {artisan.distance && (
            <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <Navigation className="h-3 w-3" />
              {artisan.distance.text || `${artisan.distance} km`}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{artisan.region || 'Région non renseignée'}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {artisan.hasCompletedProfile ? `${artisan.totalProjects || 0} projet(s)` : 'Compte actif'}
          </span>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`h-4 w-4 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
            ))}
            {rating > 0 ? (
              <span className="text-sm font-medium text-slate-700 ml-1">{rating.toFixed(1)}</span>
            ) : (
              <span className="text-xs text-slate-400 ml-1">Nouveau</span>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {showReviews && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <ArtisanReviewsList artisanId={artisan.userId || artisan._id} maxReviews={2} />
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <MessageCircle className="h-4 w-4" />
            {showReviews ? 'Masquer' : 'Avis'}
          </button>
          {artisan.phone ? (
            <a href={`tel:${artisan.phone}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
              <Phone className="h-4 w-4" /> Contacter
            </a>
          ) : (
            <div className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-400">
              <Phone className="h-4 w-4" /> Non disponible
            </div>
          )}
          <button onClick={() => onViewProfile(artisan._id)}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-md">
            Voir profil
          </button>
        </div>
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

  const [filters, setFilters] = useState({
    specialty: '',
    region: '',
    distance: 20,
    useLocation: false,
    latitude: null,
    longitude: null
  });
  const [sortBy, setSortBy] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [locationStatus, setLocationStatus] = useState('');

  const specialties = [
    'Plombier', 'Électricien', 'Maçon', 'Peintre', 'Menuisier',
    'Carreleur', 'Chauffagiste', 'Climatisation', 'Jardinier'
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

      if (searchFilters.specialty) params.append('specialty', searchFilters.specialty);
      if (searchFilters.region) params.append('region', searchFilters.region);
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

  // Dynamic search while typing in the quick search bar
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = searchTerm.trim();
      const nextFilters = { ...filters, specialty: term, region: term };
      setFilters(nextFilters);
      setPagination(prev => ({ ...prev, page: 1 }));
      searchArtisans(1, nextFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    setSearchTerm('');
    setLocationStatus('');
    searchArtisans(1, newFilters);
    setShowFilters(false);
  };

  const handleViewProfile = (artisanId) => {
    navigate(`/prescripteur/artisan/${artisanId}`);
  };

  const hasActiveFilters = filters.specialty || filters.region || filters.useLocation;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('prescripteurArtisans.title', 'Artisans partenaires')}
          </h1>
          <p className="mt-2 text-slate-500">
            {t('prescripteurArtisans.subtitle', 'Trouvez les meilleurs artisans près de chez vous')}
          </p>
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 flex h-2 w-2 rounded-full bg-indigo-600" />
          )}
        </button>
      </div>

      {/* Quick Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={t('prescripteurArtisans.searchPlaceholder', 'Rechercher un artisan...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="relative w-full md:w-64">
            <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 px-4 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Tous les métiers</option>
              {specialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-56">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              placeholder={t('prescripteurArtisans.regionPlaceholder', 'Région...')}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={getUserLocation}
            disabled={locationStatus === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
          >
            {locationStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : filters.useLocation ? (
              <Wifi className="h-4 w-4 text-indigo-600" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {filters.useLocation ? 'Position activée' : 'Près de moi'}
          </button>

          <div className="relative w-full md:w-56">
            <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 px-4 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Trier par...</option>
              <option value="rating-high">⭐ Meilleure note</option>
              <option value="rating-low">⭐ Pire note</option>
              <option value="reviews">📊 Plus d'avis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-slate-500">Recherche d'artisans...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && artisans.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Aucun artisan trouvé
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Essayez de modifier vos critères de recherche
          </p>
          {(filters.specialty || filters.region || filters.useLocation) && (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
            >
              <X className="h-4 w-4" />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && artisans.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              let sortedArtisans = [...artisans];
              
              if (sortBy === 'rating-high') {
                sortedArtisans.sort((a, b) => (b.avgRating || b.rating || 0) - (a.avgRating || a.rating || 0));
              } else if (sortBy === 'rating-low') {
                sortedArtisans.sort((a, b) => (a.avgRating || a.rating || 0) - (b.avgRating || b.rating || 0));
              } else if (sortBy === 'reviews') {
                sortedArtisans.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
              }
              
              return sortedArtisans.map((artisan) => (
                <ArtisanCard
                  key={artisan._id}
                  artisan={artisan}
                  onViewProfile={handleViewProfile}
                />
              ));
            })()}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={(nextPage) => searchArtisans(nextPage)}
              />
            </div>
          )}
        </>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Filtres avancés</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-5 space-y-6">
              {/* Specialty */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Métier
                </label>
                <select
                  value={filters.specialty}
                  onChange={(e) => handleFilterChange('specialty', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Tous les métiers</option>
                  {specialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Région
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    placeholder="Ex: Tunis, Sousse, Sfax..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Proximity Search */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Recherche par proximité
                  </label>
                  {!filters.useLocation && (
                    <button
                      onClick={getUserLocation}
                      disabled={locationStatus === 'loading'}
                      className="flex items-center gap-1 text-sm text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-50"
                    >
                      <Navigation className="h-4 w-4" />
                      {locationStatus === 'loading' ? 'Chargement...' : 'Utiliser ma position'}
                    </button>
                  )}
                </div>

                {filters.useLocation ? (
                  <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-indigo-800">
                      <Wifi className="h-4 w-4" />
                      <span className="flex-1">Position utilisée</span>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, useLocation: false }))}
                        className="rounded-lg p-1 text-indigo-600 transition-colors hover:bg-indigo-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-indigo-700">
                        Rayon de recherche: {filters.distance} km
                      </label>
                      <input
                        type="range"
                        value={filters.distance}
                        onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-indigo-200 accent-indigo-600"
                      />
                      <div className="mt-1 flex justify-between text-xs text-indigo-600">
                        <span>1 km</span>
                        <span>50 km</span>
                        <span>100 km</span>
                      </div>
                    </div>
                  </div>
                ) : locationStatus === 'error' && (
                  <p className="text-xs text-rose-600">
                    Impossible d'obtenir votre position. Vérifiez vos paramètres de localisation.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-md"
                >
                  Appliquer les filtres
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

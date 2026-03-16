import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

import {
  User,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Navigation,
  ChevronLeft
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

export default function ArtisanProfile() {
 
  const navigate = useNavigate();
  const { token, user, refreshMe } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState({
    trade: '',
    region: '',
    phone: user?.phone || '',
    description: '',
    profileImage: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Tunisie'
    },
    location: {
      latitude: 0,
      longitude: 0
    }
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const tradeOptions = [
    'Plombier',
    'Électricien',
    'Maçon',
    'Peintre',
    'Menuisier',
    'Carreleur',
    'Chauffagiste',
    'Climatisation',
    'Jardinier',
    'Autre'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/artisan/profile/my-profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 404) {
          // Profil non trouvé, on utilise les infos de base
          setProfile(prev => ({
            ...prev,
            phone: user?.phone || ''
          }));
          return;
        }

        const data = await response.json();

        if (data.data) {
          const artisanProfile = data.data;
          setProfile({
            trade: artisanProfile.trade || '',
            region: artisanProfile.region || '',
            phone: artisanProfile.phone || user?.phone || '',
            description: artisanProfile.description || '',
            profileImage: artisanProfile.profileImage || '',
            address: artisanProfile.address || {
              street: '',
              city: '',
              postalCode: '',
              country: 'Tunisie'
            },
            location: {
              latitude: artisanProfile.location?.coordinates?.[1] || 0,
              longitude: artisanProfile.location?.coordinates?.[0] || 0
            }
          });
          if (artisanProfile.profileImage) {
            setImagePreview(artisanProfile.profileImage);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, user]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée');
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setProfile(prev => ({
          ...prev,
          location: { latitude, longitude }
        }));

        try {
          await fetch('http://localhost:5000/api/artisan/profile/location', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ latitude, longitude })
          });
          setSuccess('Localisation mise à jour');
        } catch (err) {
          console.error('Error updating location:', err);
        } finally {
          setUpdatingLocation(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Impossible d\'obtenir votre position');
        setUpdatingLocation(false);
      }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image doit être inférieure à 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('trade', profile.trade);
      formData.append('region', profile.region);
      formData.append('phone', profile.phone);
      formData.append('description', profile.description);
      formData.append('address[street]', profile.address.street);
      formData.append('address[city]', profile.address.city);
      formData.append('address[postalCode]', profile.address.postalCode);
      formData.append('address[country]', profile.address.country);
      
      if (profile.location.latitude && profile.location.longitude) {
        formData.append('coordinates', JSON.stringify([
          profile.location.longitude,
          profile.location.latitude
        ]));
      }

      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const response = await fetch('http://localhost:5000/api/artisan/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      await refreshMe();
      setSuccess('Profil mis à jour avec succès !');
      
      setTimeout(() => {
        navigate('/artisan');
      }, 2000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/artisan')}
        className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600"
      >
        <ChevronLeft className="h-5 w-5" />
        Retour au tableau de bord
      </button>

      <h1 className="text-3xl font-semibold text-slate-900 mb-2">
        Mon profil d'artisan
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Complétez votre profil pour être visible par les prescripteurs
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photo de profil
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-12 w-12 text-indigo-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium"
              >
                Choisir une photo
              </button>
              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG, GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={user?.firstName || ''}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={user?.lastName || ''}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Métier *
              </label>
              <select
                value={profile.trade}
                onChange={(e) => setProfile({...profile, trade: e.target.value})}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Sélectionnez un métier</option>
                {tradeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                required
                placeholder="+216 XX XXX XXX"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description / Bio
              </label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({...profile, description: e.target.value})}
                rows="4"
                placeholder="Décrivez votre expérience, vos compétences..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localisation
          </h2>

          <div className="mb-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={updatingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 text-sm font-medium"
            >
              <Navigation className="h-4 w-4" />
              {updatingLocation ? 'Obtention...' : 'Mettre à jour ma position'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Région *
              </label>
              <input
                type="text"
                value={profile.region}
                onChange={(e) => setProfile({...profile, region: e.target.value})}
                required
                placeholder="Ex: Tunis, Sousse, Sfax..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={profile.address.city}
                onChange={(e) => setProfile({
                  ...profile,
                  address: {...profile.address, city: e.target.value}
                })}
                placeholder="Ex: Lac 2"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rue / Quartier
              </label>
              <input
                type="text"
                value={profile.address.street}
                onChange={(e) => setProfile({
                  ...profile,
                  address: {...profile.address, street: e.target.value}
                })}
                placeholder="Ex: Rue de la Liberté"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={profile.address.postalCode}
                onChange={(e) => setProfile({
                  ...profile,
                  address: {...profile.address, postalCode: e.target.value}
                })}
                placeholder="Ex: 1000"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {profile.location.latitude !== 0 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Position:</span>{' '}
                Lat: {profile.location.latitude.toFixed(6)}, 
                Lng: {profile.location.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/artisan')}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 py-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>

      <SimpleFooter />
    </div>
  );
}
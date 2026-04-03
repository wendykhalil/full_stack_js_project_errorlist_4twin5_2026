import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  ChevronLeft,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Navigation,
  Save,
  User,
} from 'lucide-react';
import SimpleFooter from '../components/Footer';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function ArtisanProfile() {
  const navigate = useNavigate();
  const { token, user, refreshMe, changePassword, forgotPassword } = useAuth();
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
      country: 'Tunisie',
    },
    location: { latitude: 0, longitude: 0 },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');

  const tradeOptions = ['Plombier', 'Électricien', 'Maçon', 'Peintre', 'Menuisier', 'Carreleur', 'Chauffagiste', 'Climatisation', 'Jardinier', 'Autre'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/artisan/profile/my-profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
          setProfile((prev) => ({ ...prev, phone: user?.phone || '' }));
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
              country: 'Tunisie',
            },
            location: {
              latitude: artisanProfile.location?.coordinates?.[1] || 0,
              longitude: artisanProfile.location?.coordinates?.[0] || 0,
            },
          });
          if (artisanProfile.profileImage) {
            const image = resolveAssetUrl(artisanProfile.profileImage);
            setImagePreview(image);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token, user]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée");
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setProfile((prev) => ({ ...prev, location: { latitude, longitude } }));

        try {
          await fetch('http://localhost:5000/api/artisan/profile/location', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ latitude, longitude }),
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
        setError("Impossible d'obtenir votre position");
        setUpdatingLocation(false);
      },
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image doit être inférieure à 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
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
        formData.append('coordinates', JSON.stringify([profile.location.longitude, profile.location.latitude]));
      }

      if (imageFile) formData.append('profileImage', imageFile);

      const response = await fetch('http://localhost:5000/api/artisan/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur lors de la sauvegarde');

      await refreshMe();
      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');

    if (!newPassword || newPassword.length < 6) {
      setPwErr('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setPwLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwErr(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPwLoading(false);
    }
  };

  const onSendResetLink = async () => {
    setResetErr('');
    setResetMsg('');
    if (!user?.email) {
      setResetErr('Aucune adresse email disponible pour ce compte.');
      return;
    }
    setResetLoading(true);
    try {
      await forgotPassword({ email: user.email });
      setResetMsg('Un lien de réinitialisation a été envoyé à votre adresse email.');
    } catch (err) {
      setResetErr(err.message || "Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex-1 max-w-6xl">
      <button onClick={() => navigate('/artisan')} className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600">
        <ChevronLeft className="h-5 w-5" /> Retour au tableau de bord
      </button>

      <h1 className="mb-2 text-3xl font-semibold text-slate-900">Mon profil d'artisan</h1>
      <p className="mb-8 text-sm text-slate-500">Complétez votre profil pour être visible par les prescripteurs</p>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5" /><span>{error}</span></div>
        </div>
      ) : null}
      {success ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /><span>{success}</span></div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Camera className="h-5 w-5" /> Photo de profil</h2>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="h-28 w-28 rounded-full border-2 border-indigo-200 object-cover" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-100">
                  <User className="h-14 w-14 text-indigo-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Choisir une photo
              </button>
              <p className="mt-2 text-xs text-slate-500">JPG, PNG, GIF. Max 5MB.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><User className="h-5 w-5" /> Informations personnelles</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
              <input type="text" value={user?.firstName || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <input type="text" value={user?.lastName || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Métier *</label>
              <select value={profile.trade} onChange={(e) => setProfile({ ...profile, trade: e.target.value })} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">Sélectionnez un métier</option>
                {tradeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone *</label>
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required placeholder="+216 XX XXX XXX" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Description / Bio</label>
              <textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows="4" placeholder="Décrivez votre expérience, vos compétences..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><MapPin className="h-5 w-5" /> Localisation</h2>
          <div className="mb-4">
            <button type="button" onClick={getCurrentLocation} disabled={updatingLocation} className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
              <Navigation className="h-4 w-4" /> {updatingLocation ? 'Obtention...' : 'Mettre à jour ma position'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Région *</label>
              <input type="text" value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} required placeholder="Ex: Tunis, Sousse, Sfax..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ville</label>
              <input type="text" value={profile.address.city} onChange={(e) => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })} placeholder="Ex: Lac 2" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Rue / Quartier</label>
              <input type="text" value={profile.address.street} onChange={(e) => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })} placeholder="Ex: Rue de la Liberté" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Code postal</label>
              <input type="text" value={profile.address.postalCode} onChange={(e) => setProfile({ ...profile, address: { ...profile.address, postalCode: e.target.value } })} placeholder="Ex: 1000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          {profile.location.latitude !== 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-medium">Position:</span> Lat: {profile.location.latitude.toFixed(6)}, Lng: {profile.location.longitude.toFixed(6)}
            </div>
          ) : null}
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/artisan')} className="flex-1 rounded-xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">Annuler</button>
          <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</>) : (<><Save className="h-4 w-4" /> Enregistrer</>)}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Lock className="h-5 w-5" /> Reset password</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Votre mot de passe actuel" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Minimum 6 caractères" />
            </div>
            {pwErr ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pwErr}</div> : null}
            {pwMsg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{pwMsg}</div> : null}
            <button type="button" onClick={onChangePassword} disabled={pwLoading} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {pwLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-900"><Mail className="h-4 w-4" /><span className="font-semibold">Lien de réinitialisation</span></div>
            <p className="mt-2 text-sm text-slate-600">Envoyer un email de réinitialisation à <span className="font-medium">{user?.email || 'votre adresse email'}</span>.</p>
            {resetErr ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resetErr}</div> : null}
            {resetMsg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{resetMsg}</div> : null}
            <button type="button" onClick={onSendResetLink} disabled={resetLoading} className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50">
              {resetLoading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
}

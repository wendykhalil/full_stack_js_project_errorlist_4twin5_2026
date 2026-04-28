import React, { useEffect, useRef, useState } from 'react';
import ReadCardButton from '../components/ReadCardButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  AlertCircle, Camera, CheckCircle, ChevronLeft, Loader2, Lock,
  Mail, MapPin, Navigation, Save, User, Phone,
  Key, Send, Shield, Zap,
  UserCircle, ShieldCheck
} from 'lucide-react';
import SimpleFooter from '../components/Footer';
import PageShell from '../components/PageShell';
import MapPickerModal from '../components/MapPickerModal';
import FaceIdSettings from '../components/FaceIdSettings';
import { useFormValidation, rules } from '../hooks/useFormValidation';
import { useServerErrors } from '../hooks/useServerErrors';
import FieldError from '../components/FieldError';
import { useNotification } from '../hooks/useNotification';
import { getCurrentPositionWithAddress, updateLocationOnServer } from '../utils/geolocation';
import { getStoredLocationUpdate, updateProfileLocation, isRecentLocationUpdate } from '../services/profileService';
import Notification from '../components/Notification';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizePlaceData(place = {}) {
  const latitude = Number(place?.latitude || 0);
  const longitude = Number(place?.longitude || 0);
  const city = String(place?.city || '').trim();
  const address = String(place?.address || '').trim();
  const regionFromAddress = address.split(',')[0]?.trim() || '';
  return { latitude, longitude, city, address, region: city || regionFromAddress };
}

const TABS = [
  { id: 'info', label: 'Informations', icon: UserCircle },
  { id: 'location', label: 'Localisation', icon: MapPin },
  { id: 'security', label: 'Sécurité', icon: ShieldCheck },
];

export default function ArtisanProfile() {
  const navigate = useNavigate();
  const { token, user, refreshMe, changePassword, forgotPassword } = useAuth();
  const fileInputRef = useRef(null);
  const { notification, showNotification, hideNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('info');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({
    trade: '', region: '', phone: user?.phone || '', description: '',
    profileImage: '',
    address: { street: '', city: '', postalCode: '', country: 'Tunisia' },
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

  const { errors: profileFormErrors, validate: validateProfile } = useFormValidation({
    trade: [],
    region: [],
    phone: [rules.phone()],
    description: [rules.maxLength(500)],
  });
  const { fieldErrors: profileServerErrors, globalError: profileGlobalError, handleError: handleProfileError, clearErrors: clearProfileErrors } = useServerErrors();
  const { errors: pwFormErrors, validate: validatePw } = useFormValidation({
    currentPassword: [rules.required('Mot de passe actuel requis')],
    newPassword: [rules.required('Nouveau mot de passe requis'), rules.minLength(6, 'Minimum 6 caractères')],
  });
  const { fieldErrors: pwServerErrors, globalError: pwGlobalError, handleError: handlePwError, clearErrors: clearPwErrors } = useServerErrors();

  const tradeOptions = ['Plombier','Électricien','Maçon','Peintre','Menuisier','Carreleur','Chauffagiste','Climatisation','Jardinier','Autre'];

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
          const p = data.data;
          setProfile({
            trade: p.trade || '', region: p.region || '',
            phone: p.phone || user?.phone || '', description: p.description || '',
            profileImage: p.profileImage || '',
            address: p.address || { street: '', city: '', postalCode: '', country: 'Tunisia' },
            location: { latitude: p.location?.coordinates?.[1] || 0, longitude: p.location?.coordinates?.[0] || 0 },
          });
          if (p.profileImage) setImagePreview(resolveAssetUrl(p.profileImage));
        }
      } catch (err) {
        setError('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token, user]);

  useEffect(() => {
    const handleLocationUpdate = (event) => {
      const locationData = event.detail;
      if (locationData && isRecentLocationUpdate(locationData.timestamp)) {
        setProfile((prev) => updateProfileLocation(prev, locationData));
        showNotification('Adresse mise à jour automatiquement !', 'success');
      }
    };
    const storedUpdate = getStoredLocationUpdate();
    if (storedUpdate && isRecentLocationUpdate(storedUpdate.timestamp)) {
      setProfile((prev) => updateProfileLocation(prev, storedUpdate));
    }
    window.addEventListener('locationUpdated', handleLocationUpdate);
    return () => window.removeEventListener('locationUpdated', handleLocationUpdate);
  }, [showNotification]);

  const handleAutoDetectLocation = async () => {
    setAutoDetecting(true);
    try {
      const locationData = await getCurrentPositionWithAddress();
      // Update coordinates in profile state
      setProfile((prev) => ({
        ...prev,
        region: locationData.address?.city || locationData.address?.region || prev.region,
        address: {
          ...prev.address,
          city: locationData.address?.city || prev.address?.city || '',
          street: locationData.address?.street || prev.address?.street || '',
        },
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      }));
      // Also persist to server immediately
      await updateLocationOnServer(locationData.latitude, locationData.longitude, token, 'artisan');
      showNotification('Position mise à jour avec succès !', 'success');
    } catch (error) {
      showNotification(error.message || 'Erreur lors de la détection', 'error');
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleMapPlaceSelect = async (place) => {
    const normalized = normalizePlaceData(place);
    setProfile((prev) => ({
      ...prev,
      region: normalized.region || prev.region,
      address: {
        ...prev.address,
        city: normalized.city || prev.address?.city || '',
        street: normalized.address || prev.address?.street || '',
      },
      location: { latitude: normalized.latitude, longitude: normalized.longitude },
    }));
    setIsMapPickerOpen(false);
    // Persist coordinates immediately
    if (normalized.latitude && normalized.longitude) {
      setUpdatingLocation(true);
      try {
        await fetch('http://localhost:5000/api/artisan/profile/location', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ latitude: normalized.latitude, longitude: normalized.longitude }),
        });
      } catch (err) {
        console.error('Error saving location:', err);
      } finally {
        setUpdatingLocation(false);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("L'image doit être inférieure à 5MB"); setTimeout(() => setError(''), 3000); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearProfileErrors(); setError(''); setSuccess('');

    // Only validate fields that have values — never block a photo-only save
    const fieldsToValidate = {};
    if (profile.phone) fieldsToValidate.phone = profile.phone;
    if (profile.description) fieldsToValidate.description = profile.description;
    if (!validateProfile(fieldsToValidate)) return;

    setSaving(true);
    try {
      const formData = new FormData();
      // Only append non-empty fields so we don't overwrite existing data with blanks
      if (profile.trade)               formData.append('trade', profile.trade);
      if (profile.region)              formData.append('region', profile.region);
      if (profile.phone)               formData.append('phone', profile.phone);
      if (profile.description)         formData.append('description', profile.description);
      if (profile.address.street)      formData.append('address[street]', profile.address.street);
      if (profile.address.city)        formData.append('address[city]', profile.address.city);
      if (profile.address.postalCode)  formData.append('address[postalCode]', profile.address.postalCode);
      formData.append('address[country]', profile.address.country || 'Tunisia');
      if (profile.location.latitude && profile.location.longitude)
        formData.append('coordinates', JSON.stringify([profile.location.longitude, profile.location.latitude]));
      if (imageFile) formData.append('profileImage', imageFile);
      const response = await fetch('http://localhost:5000/api/artisan/profile', {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Impossible d\'enregistrer le profil');
      await refreshMe();
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      handleProfileError(err); setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    clearPwErrors(); setPwErr(''); setPwMsg('');
    if (!validatePw({ currentPassword, newPassword })) return;
    setPwLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg('Mot de passe modifié avec succès');
      setCurrentPassword(''); setNewPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      handlePwError(err); setPwErr(err.message || 'Erreur lors du changement');
      setTimeout(() => setPwErr(''), 3000);
    } finally {
      setPwLoading(false);
    }
  };

  const onSendResetLink = async () => {
    setResetErr(''); setResetMsg('');
    if (!user?.email) { setResetErr('Aucune adresse email disponible.'); return; }
    setResetLoading(true);
    try {
      await forgotPassword({ email: user.email });
      setResetMsg('Lien de réinitialisation envoyé à votre email.');
      setTimeout(() => setResetMsg(''), 3000);
    } catch (err) {
      setResetErr(err.message || "Impossible d'envoyer l'email.");
      setTimeout(() => setResetErr(''), 3000);
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Chargement de votre profil...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const avatarUrl = imagePreview || null;


  return (
    <>
      <Notification notification={notification} onClose={hideNotification} />
      <PageShell>
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">

          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button onClick={() => navigate('/artisan')} className="group mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Retour au tableau de bord
              </button>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mon Profil Artisan</h1>
              <p className="mt-1.5 text-sm text-slate-500">Gérez vos informations et paramètres de compte</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
              <Shield className="h-3.5 w-3.5" /> Artisan vérifié
            </span>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
              <CheckCircle className="h-5 w-5 shrink-0" /> {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">

            {/* SIDEBAR */}
            <aside className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500">
                  <div className="absolute inset-0 opacity-30" style={{backgroundImage:"radial-gradient(circle at 15% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 85% 20%, white 1.5px, transparent 1.5px)",backgroundSize:"28px 28px"}} />
                </div>
                <div className="relative px-7 pb-7">
                  <div className="relative -mt-12 mb-4 inline-block">
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow-xl" />
                      : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 ring-4 ring-white shadow-xl"><User className="h-12 w-12 text-white" /></div>}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white transition hover:bg-indigo-700 hover:scale-110">
                      <Camera className="h-4 w-4" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">{profile.trade || 'Artisan'}</span>
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50"><Mail className="h-4 w-4 text-indigo-500" /></div>
                      <span className="truncate font-medium">{user?.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><Phone className="h-4 w-4 text-emerald-500" /></div>
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile.region && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50"><MapPin className="h-4 w-4 text-amber-500" /></div>
                        <span className="font-medium">{profile.region}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <nav className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                <div className="p-3">
                  <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const desc = { info: 'Métier, téléphone, bio', location: 'Région et position GPS', security: 'Mot de passe et Face ID' };
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                          <Icon style={{width:'18px',height:'18px'}} className={activeTab === tab.id ? 'text-white' : 'text-slate-500'} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${activeTab === tab.id ? 'text-white' : 'text-slate-800'}`}>{tab.label}</p>
                          <p className={`text-xs truncate ${activeTab === tab.id ? 'text-white/70' : 'text-slate-400'}`}>{desc[tab.id]}</p>
                        </div>
                        {activeTab === tab.id && (
                          <svg className="ml-auto h-4 w-4 shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </aside>

            {/* MAIN */}
            <main className="min-w-0">

              {/* INFO TAB */}
              {activeTab === 'info' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100"><UserCircle className="h-6 w-6 text-indigo-600" /></div>
                        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Informations personnelles</h2><ReadCardButton text="Informations personnelles" /></div><p className="text-xs text-slate-500">Visibles par les prescripteurs et clients</p></div>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Prénom</label>
                          <input value={user?.firstName || ''} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm text-slate-400" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nom</label>
                          <input value={user?.lastName || ''} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm text-slate-400" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Métier <span className="text-red-500">*</span></label>
                          <select value={profile.trade} onChange={(e) => setProfile({ ...profile, trade: e.target.value })}
                            className={`w-full rounded-2xl border ${profileFormErrors.trade || profileServerErrors.trade ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`}>
                            <option value="">Sélectionner un métier</option>
                            {tradeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <FieldError error={profileFormErrors.trade || profileServerErrors.trade} />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Téléphone <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+216 XX XXX XXX"
                              className={`w-full rounded-2xl border ${profileFormErrors.phone || profileServerErrors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                          </div>
                          <FieldError error={profileFormErrors.phone || profileServerErrors.phone} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Description / Bio</label>
                          <textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows="4" placeholder="Décrivez votre expérience, vos compétences..."
                            className={`w-full resize-none rounded-2xl border ${profileFormErrors.description || profileServerErrors.description ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                          <FieldError error={profileFormErrors.description || profileServerErrors.description} />
                          <p className="mt-1.5 text-xs text-slate-400">Maximum 500 caractères</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => navigate('/artisan')} className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md">Annuler</button>
                    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50">
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
                    </button>
                  </div>
                </form>
              )}

              {/* LOCATION TAB */}
              {activeTab === 'location' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100"><MapPin className="h-6 w-6 text-indigo-600" /></div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Localisation</h2>
                          <p className="text-xs text-slate-500">Détectez automatiquement ou saisissez manuellement</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 space-y-5">
                      {/* Two action buttons */}
                      <div className="flex gap-3">
                        <button type="button" onClick={handleAutoDetectLocation} disabled={autoDetecting}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50">
                          {autoDetecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Détection...</> : <><Zap className="h-4 w-4" /> Détecter ma position</>}
                        </button>
                        <button type="button" onClick={() => setIsMapPickerOpen(true)} disabled={updatingLocation}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50">
                          <Navigation className="h-4 w-4" />{updatingLocation ? 'Chargement...' : 'Choisir sur la carte'}
                        </button>
                      </div>

                      {/* Fields */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Région</label>
                          <input type="text" value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} placeholder="Ex: Tunis, Sousse..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Ville</label>
                          <input type="text" value={profile.address.city} onChange={(e) => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })} placeholder="Ex: Lac 2"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Rue / Quartier</label>
                          <input type="text" value={profile.address.street} onChange={(e) => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })} placeholder="Ex: Rue de la Liberté"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Code postal</label>
                          <input type="text" value={profile.address.postalCode} onChange={(e) => setProfile({ ...profile, address: { ...profile.address, postalCode: e.target.value } })} placeholder="Ex: 1000"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Latitude</label>
                          <input type="text" value={profile.location.latitude || ''} onChange={(e) => setProfile({ ...profile, location: { ...profile.location, latitude: parseFloat(e.target.value) || 0 } })} placeholder="Ex: 36.8065"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Longitude</label>
                          <input type="text" value={profile.location.longitude || ''} onChange={(e) => setProfile({ ...profile, location: { ...profile.location, longitude: parseFloat(e.target.value) || 0 } })} placeholder="Ex: 10.1815"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                      </div>

                      {profile.location.latitude !== 0 && (
                        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-700">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span><span className="font-bold">Position enregistrée :</span> {profile.location.latitude.toFixed(6)}°, {profile.location.longitude.toFixed(6)}°</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => navigate('/artisan')} className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md">Annuler</button>
                    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50">
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
                    </button>
                  </div>
                </form>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"><Lock className="h-6 w-6 text-slate-600" /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Changer le mot de passe</h2><p className="text-xs text-slate-500">Minimum 6 caractères recommandé</p></div>
                      </div>
                    </div>
                    <div className="p-8">
                      <form onSubmit={onChangePassword} className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Mot de passe actuel</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Votre mot de passe actuel"
                              className={`w-full rounded-2xl border ${pwFormErrors.currentPassword || pwServerErrors.currentPassword ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                          </div>
                          <FieldError error={pwFormErrors.currentPassword || pwServerErrors.currentPassword} />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nouveau mot de passe</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères"
                              className={`w-full rounded-2xl border ${pwFormErrors.newPassword || pwServerErrors.newPassword ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                          </div>
                          <FieldError error={pwFormErrors.newPassword || pwServerErrors.newPassword} />
                        </div>
                        {(pwErr || pwGlobalError) && <div className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pwErr || pwGlobalError}</div>}
                        {pwMsg && <div className="sm:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{pwMsg}</div>}
                        <div className="sm:col-span-2">
                          <button type="submit" disabled={pwLoading} className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50">
                            {pwLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour...</span> : 'Changer le mot de passe'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100"><Mail className="h-6 w-6 text-indigo-600" /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Lien de réinitialisation</h2><p className="text-xs text-slate-500">Recevez un lien de réinitialisation par email</p></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-6 p-8">
                      <div>
                        <p className="text-sm text-slate-600">Envoyer à <span className="font-bold text-slate-900">{user?.email}</span></p>
                        {resetErr && <p className="mt-1.5 text-xs text-red-600">{resetErr}</p>}
                        {resetMsg && <p className="mt-1.5 text-xs text-emerald-600">{resetMsg}</p>}
                      </div>
                      <button type="button" onClick={onSendResetLink} disabled={resetLoading}
                        className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:opacity-50">
                        {resetLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer le lien</>}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100"><ShieldCheck className="h-6 w-6 text-blue-600" /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Authentification biométrique</h2><p className="text-xs text-slate-500">Face ID et sécurité avancée du compte</p></div>
                      </div>
                    </div>
                    <div className="p-8"><FaceIdSettings /></div>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>

        <SimpleFooter />
        <MapPickerModal open={isMapPickerOpen} onClose={() => setIsMapPickerOpen(false)}
          initialValue={{ latitude: profile.location?.latitude, longitude: profile.location?.longitude, city: profile.address?.city || profile.region || '', address: profile.address?.street || '' }}
          onUsePlace={handleMapPlaceSelect} />
      </PageShell>
    </>
  );
}



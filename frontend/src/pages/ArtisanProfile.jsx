import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  AlertCircle, Camera, CheckCircle, ChevronLeft, Loader2, Lock,
  Mail, MapPin, Navigation, Save, User, Briefcase, Phone,
  MapPinned, Building2, Key, Send, Shield, Sparkles, Zap,
  Settings, UserCircle, ShieldCheck
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
    trade: [rules.required('Métier requis')],
    region: [rules.required('Région requise')],
    phone: [rules.required('Téléphone requis'), rules.phone()],
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
      await updateLocationOnServer(locationData.latitude, locationData.longitude, token, 'artisan');
      setProfile((prev) => updateProfileLocation(prev, locationData));
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
      address: { ...prev.address, city: normalized.city || prev.address?.city || '', street: normalized.address || prev.address?.street || '' },
      location: { latitude: normalized.latitude, longitude: normalized.longitude },
    }));
    setIsMapPickerOpen(false);
    setUpdatingLocation(true);
    try {
      await fetch('http://localhost:5000/api/artisan/profile/location', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ latitude: normalized.latitude, longitude: normalized.longitude }),
      });
      setSuccess('Localisation sélectionnée. Enregistrez pour finaliser.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setSuccess('Localisation sélectionnée. Enregistrez pour finaliser.');
      setTimeout(() => setSuccess(''), 4000);
    } finally {
      setUpdatingLocation(false);
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
    if (!validateProfile({ trade: profile.trade, region: profile.region, phone: profile.phone, description: profile.description })) return;
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
        <div className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">

          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/artisan')}
              className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-indigo-600"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour au tableau de bord
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Shield className="h-3 w-3" /> Profil artisan
            </span>
          </div>

          {/* Global alerts */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" /> {success}
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

            {/* ── LEFT SIDEBAR ── */}
            <aside className="space-y-5">
              {/* Identity card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Cover banner */}
                <div className="relative h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500">
                  <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",backgroundSize:"24px 24px"}} />
                </div>
                <div className="relative px-6 pb-6">
                  <div className="relative -mt-10 mb-3 inline-block">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-lg" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 ring-4 ring-white shadow-lg">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md ring-2 ring-white transition hover:bg-indigo-700"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {profile.trade || 'Artisan'}
                  </span>
                  <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="truncate">{user?.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.region && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span>{profile.region}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab navigation */}
              <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-3 py-3">
                  <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                        {tab.label}
                        {activeTab === tab.id && (
                          <svg className="ml-auto h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </aside>

            {/* ── RIGHT MAIN AREA ── */}
            <main className="min-w-0">

              {/* ── TAB: INFORMATIONS ── */}
              {activeTab === 'info' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                          <UserCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Informations personnelles</h2>
                          <p className="text-xs text-slate-500">Visibles par les prescripteurs</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Prénom</label>
                          <input value={user?.firstName || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nom</label>
                          <input value={user?.lastName || ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Métier <span className="text-red-500">*</span></label>
                          <select
                            value={profile.trade}
                            onChange={(e) => setProfile({ ...profile, trade: e.target.value })}
                            className={`w-full rounded-xl border ${profileFormErrors.trade || profileServerErrors.trade ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`}
                          >
                            <option value="">Sélectionner un métier</option>
                            {tradeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <FieldError error={profileFormErrors.trade || profileServerErrors.trade} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Téléphone <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="tel" value={profile.phone}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                              placeholder="+216 XX XXX XXX"
                              className={`w-full rounded-xl border ${profileFormErrors.phone || profileServerErrors.phone ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`}
                            />
                          </div>
                          <FieldError error={profileFormErrors.phone || profileServerErrors.phone} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description / Bio</label>
                          <textarea
                            value={profile.description}
                            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                            rows="4" placeholder="Décrivez votre expérience, vos compétences..."
                            className={`w-full rounded-xl border ${profileFormErrors.description || profileServerErrors.description ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`}
                          />
                          <FieldError error={profileFormErrors.description || profileServerErrors.description} />
                          <p className="mt-1 text-xs text-slate-400">Maximum 500 caractères</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => navigate('/artisan')} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50">
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
                    </button>
                  </div>
                </form>
              )}

              {/* ── TAB: LOCALISATION ── */}
              {activeTab === 'location' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Auto-detect */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                          <Zap className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Détection automatique</h2>
                          <p className="text-xs text-slate-500">Utilisez votre position GPS actuelle</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-6">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Détecter ma position</p>
                        <p className="text-xs text-slate-500">Met à jour automatiquement votre adresse.</p>
                      </div>
                      <button
                        type="button" onClick={handleAutoDetectLocation} disabled={autoDetecting}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {autoDetecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Détection...</> : <><Zap className="h-4 w-4" /> Détecter</>}
                      </button>
                    </div>
                  </div>

                  {/* Manual location */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                          <MapPin className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Adresse manuelle</h2>
                          <p className="text-xs text-slate-500">Saisissez ou choisissez sur la carte</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-5">
                        <button
                          type="button" onClick={() => setIsMapPickerOpen(true)} disabled={updatingLocation}
                          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Navigation className="h-4 w-4" />
                          {updatingLocation ? 'Enregistrement...' : 'Choisir sur la carte'}
                        </button>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Région <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <MapPinned className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text" value={profile.region}
                              onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                              placeholder="Ex: Tunis, Sousse..."
                              className={`w-full rounded-xl border ${profileFormErrors.region || profileServerErrors.region ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`}
                            />
                          </div>
                          <FieldError error={profileFormErrors.region || profileServerErrors.region} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Ville</label>
                          <input type="text" value={profile.address.city}
                            onChange={(e) => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })}
                            placeholder="Ex: Lac 2"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Rue / Quartier</label>
                          <input type="text" value={profile.address.street}
                            onChange={(e) => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })}
                            placeholder="Ex: Rue de la Liberté"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Code postal</label>
                          <input type="text" value={profile.address.postalCode}
                            onChange={(e) => setProfile({ ...profile, address: { ...profile.address, postalCode: e.target.value } })}
                            placeholder="Ex: 1000"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                      {profile.location.latitude !== 0 && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span><span className="font-medium">Position enregistrée:</span> {profile.location.latitude.toFixed(6)}°, {profile.location.longitude.toFixed(6)}°</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => navigate('/artisan')} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50">
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
                    </button>
                  </div>
                </form>
              )}

              {/* ── TAB: SÉCURITÉ ── */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Change password */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                          <Lock className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Changer le mot de passe</h2>
                          <p className="text-xs text-slate-500">Minimum 6 caractères</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <form onSubmit={onChangePassword} className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Votre mot de passe actuel"
                              className={`w-full rounded-xl border ${pwFormErrors.currentPassword || pwServerErrors.currentPassword ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-3 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`} />
                          </div>
                          <FieldError error={pwFormErrors.currentPassword || pwServerErrors.currentPassword} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères"
                              className={`w-full rounded-xl border ${pwFormErrors.newPassword || pwServerErrors.newPassword ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-3 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`} />
                          </div>
                          <FieldError error={pwFormErrors.newPassword || pwServerErrors.newPassword} />
                        </div>
                        {(pwErr || pwGlobalError) && (
                          <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{pwErr || pwGlobalError}</div>
                        )}
                        {pwMsg && (
                          <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{pwMsg}</div>
                        )}
                        <div className="sm:col-span-2">
                          <button type="submit" disabled={pwLoading} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                            {pwLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour...</span> : 'Changer le mot de passe'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Reset link */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                          <Mail className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Lien de réinitialisation</h2>
                          <p className="text-xs text-slate-500">Recevez un lien par email</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-6">
                      <div>
                        <p className="text-sm text-slate-600">Envoyer à <span className="font-medium text-slate-900">{user?.email}</span></p>
                        {resetErr && <p className="mt-1 text-xs text-red-600">{resetErr}</p>}
                        {resetMsg && <p className="mt-1 text-xs text-emerald-600">{resetMsg}</p>}
                      </div>
                      <button type="button" onClick={onSendResetLink} disabled={resetLoading}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                        {resetLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer</>}
                      </button>
                    </div>
                  </div>

                  {/* Face ID */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Authentification biométrique</h2>
                          <p className="text-xs text-slate-500">Face ID et sécurité avancée</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <FaceIdSettings />
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>

        <SimpleFooter />
        <MapPickerModal
          open={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          initialValue={{
            latitude: profile.location?.latitude,
            longitude: profile.location?.longitude,
            city: profile.address?.city || profile.region || '',
            address: profile.address?.street || '',
          }}
          onUsePlace={handleMapPlaceSelect}
        />
      </PageShell>
    </>
  );
}

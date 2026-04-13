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
  Briefcase,
  Phone,
  MapPinned,
  Building2,
  Key,
  Send,
  Shield,
  Sparkles
} from 'lucide-react';
import SimpleFooter from '../components/Footer';
import PageShell from '../components/PageShell';
import MapPickerModal from '../components/MapPickerModal';
import { useFormValidation, rules } from '../hooks/useFormValidation';
import { useServerErrors } from '../hooks/useServerErrors';
import FieldError from '../components/FieldError';

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
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
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
      country: 'Tunisia',
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
              country: 'Tunisia',
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
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token, user]);

  const openMapPicker = () => {
    setError('');
    setIsMapPickerOpen(true);
  };

  const handleMapPlaceSelect = async (place) => {
    const latitude = Number(place?.latitude || 0);
    const longitude = Number(place?.longitude || 0);
    const city = String(place?.city || '').trim();
    const address = String(place?.address || '').trim();

    setProfile((prev) => ({
      ...prev,
      region: city || prev.region,
      address: {
        ...prev.address,
        city: city || prev.address?.city || '',
        street: address || prev.address?.street || '',
      },
      location: { latitude, longitude },
    }));

    setIsMapPickerOpen(false);
    setUpdatingLocation(true);
    try {
      await fetch('http://localhost:5000/api/artisan/profile/location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      setSuccess('Location selected successfully. Save the profile to keep the new address details.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error updating location:', err);
      setSuccess('Location selected. Save the profile to finish updating your profile.');
      setTimeout(() => setSuccess(''), 4000);
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      setTimeout(() => setError(''), 3000);
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
    clearProfileErrors();
    setError('');
    setSuccess('');
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
      if (!response.ok) throw new Error(data.message || 'Unable to save profile');

      await refreshMe();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      handleProfileError(err);
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    clearPwErrors();
    setPwErr('');
    setPwMsg('');
    if (!validatePw({ currentPassword, newPassword })) return;
    setPwLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      handlePwError(err);
      setPwErr(err.message || 'Erreur lors du changement de mot de passe');
      setTimeout(() => setPwErr(''), 3000);
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
      setTimeout(() => setResetMsg(''), 3000);
    } catch (err) {
      setResetErr(err.message || "Impossible d'envoyer l'email de réinitialisation.");
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
            <p className="text-sm text-slate-500">Loading your profile...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
    <div className="mx-auto max-w-none flex-1 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/artisan')}
          className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-indigo-600"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to dashboard
        </button>
        <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
          <Shield className="h-3 w-3" />
          Artisan profile
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My artisan profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Complete your profile to become more visible to prescribers and win more opportunities.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{success}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Camera className="h-5 w-5 text-indigo-600" />
              Profile photo
            </h2>
            <p className="mt-1 text-xs text-slate-500">Add a photo to personalize your profile.</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-28 w-28 rounded-full object-cover ring-4 ring-indigo-100"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50">
                    <User className="h-14 w-14 text-indigo-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                >
                  <Camera className="h-4 w-4" />
                  Choose a photo
                </button>
                <p className="mt-2 text-xs text-slate-400">JPG, PNG, GIF. Max 5MB.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <User className="h-5 w-5 text-indigo-600" />
              Personal information
            </h2>
            <p className="mt-1 text-xs text-slate-500">This information can be seen by prescribers.</p>
          </div>
          <div className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">First name</label>
                <input
                  type="text"
                  value={user?.firstName || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Last name</label>
                <input
                  type="text"
                  value={user?.lastName || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Trade <span className="text-red-500">*</span>
                </label>
                <select
                  value={profile.trade}
                  onChange={(e) => setProfile({ ...profile, trade: e.target.value })}
                  className={`w-full rounded-xl border ${profileFormErrors.trade || profileServerErrors.trade ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                >
                  <option value="">Select a trade</option>
                  {tradeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <FieldError error={profileFormErrors.trade || profileServerErrors.trade} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+216 XX XXX XXX"
                    className={`w-full rounded-xl border ${profileFormErrors.phone || profileServerErrors.phone ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>
                <FieldError error={profileFormErrors.phone || profileServerErrors.phone} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Description / Bio</label>
                <textarea
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows="4"
                  placeholder="Describe your experience, skills, and specialties..."
                  className={`w-full rounded-xl border ${profileFormErrors.description || profileServerErrors.description ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                />
                <FieldError error={profileFormErrors.description || profileServerErrors.description} />
                <p className="mt-1 text-xs text-slate-400">Maximum 500 characters</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Location
            </h2>
            <p className="mt-1 text-xs text-slate-500">Your position helps prescribers find you.</p>
          </div>
          <div className="p-6">
            <div className="mb-5">
              <button
                type="button"
                onClick={openMapPicker}
                disabled={updatingLocation}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100 hover:shadow-sm disabled:opacity-50"
              >
                <Navigation className="h-4 w-4" />
                {updatingLocation ? 'Saving location...' : 'Update my position'}
              </button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Region <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPinned className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={profile.region}
                    onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                    placeholder="Example: Tunis, Sousse, Sfax..."
                    className={`w-full rounded-xl border ${profileFormErrors.region || profileServerErrors.region ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>
                <FieldError error={profileFormErrors.region || profileServerErrors.region} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Ville</label>
                <input
                  type="text"
                  value={profile.address.city}
                  onChange={(e) => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })}
                  placeholder="Ex: Lac 2"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Rue / Quartier</label>
                <input
                  type="text"
                  value={profile.address.street}
                  onChange={(e) => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })}
                  placeholder="Ex: Rue de la Liberté"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Postal code</label>
                <input
                  type="text"
                  value={profile.address.postalCode}
                  onChange={(e) => setProfile({ ...profile, address: { ...profile.address, postalCode: e.target.value } })}
                  placeholder="Ex: 1000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            {profile.location.latitude !== 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Position enregistrée:</span>{' '}
                  {profile.location.latitude.toFixed(6)}°, {profile.location.longitude.toFixed(6)}°
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/artisan')}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-md disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lock className="h-5 w-5 text-indigo-600" />
            Sécurité du compte
          </h2>
          <p className="mt-1 text-xs text-slate-500">Gérez votre mot de passe et la sécurité de votre compte</p>
        </div>
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Change Password Section */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full rounded-xl border ${pwFormErrors.currentPassword || pwServerErrors.currentPassword ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Votre mot de passe actuel"
                  />
                </div>
                <FieldError error={pwFormErrors.currentPassword || pwServerErrors.currentPassword} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full rounded-xl border ${pwFormErrors.newPassword || pwServerErrors.newPassword ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Minimum 6 caractères"
                  />
                </div>
                <FieldError error={pwFormErrors.newPassword || pwServerErrors.newPassword} />
              </div>
              {(pwErr || pwGlobalError) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {pwErr || pwGlobalError}
                </div>
              )}
              {pwMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                  {pwMsg}
                </div>
              )}
              <button
                type="button"
                onClick={onChangePassword}
                disabled={pwLoading}
                className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700 hover:shadow-md disabled:opacity-50"
              >
                {pwLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mise à jour...
                  </span>
                ) : (
                  'Changer le mot de passe'
                )}
              </button>
            </div>

            {/* Reset Password Link Section */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="flex items-center gap-2 text-slate-900">
                <Mail className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold">Lien de réinitialisation</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Envoyer un email de réinitialisation à{' '}
                <span className="font-medium text-indigo-600">{user?.email || 'votre adresse email'}</span>
              </p>
              {resetErr && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {resetErr}
                </div>
              )}
              {resetMsg && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                  {resetMsg}
                </div>
              )}
              <button
                type="button"
                onClick={onSendResetLink}
                disabled={resetLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm disabled:opacity-50"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer le lien
                  </>
                )}
              </button>
            </div>
          </div>
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
    </div>
    </PageShell>
  );
}

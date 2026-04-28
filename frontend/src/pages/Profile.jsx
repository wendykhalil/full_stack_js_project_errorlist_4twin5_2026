import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from '../i18n';
import Footer from "../components/Footer";
import MapPickerModal from "../components/MapPickerModal";
import LiveLocationSection from "../components/LiveLocationSection";
import FaceIdSettings from "../components/FaceIdSettings";
import { useFormValidation, rules } from "../hooks/useFormValidation";
import { useServerErrors } from "../hooks/useServerErrors";
import FieldError from "../components/FieldError";
import { useNotification } from "../hooks/useNotification";
import { getCurrentPositionWithAddress, updateLocationOnServer } from "../utils/geolocation";
import { getStoredLocationUpdate, updateProfileLocation, isRecentLocationUpdate } from "../services/profileService";
import Notification from "../components/Notification";
import {
  Building, MapPin, FileText, Image, Tag, Trash2, Upload,
  Lock, Mail, Key, Send, Loader2, AlertCircle, CheckCircle,
  Zap, User, Phone, UserCircle, ShieldCheck, Navigation, Camera
} from "lucide-react";

const TABS = [
  { id: 'info',     label: 'Informations',  icon: UserCircle  },
  { id: 'location', label: 'Localisation',  icon: MapPin      },
  { id: 'security', label: 'Sécurité',      icon: ShieldCheck },
];

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshMe, updateProfile, changePassword, forgotPassword } = useAuth();
  const { notification, showNotification, hideNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('info');

  const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const fileInputRef = useRef(null);
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [serviceRadius, setServiceRadius] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const logoInputRef = useRef(null);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const { errors: profileFieldErrors, validate: validateProfile } = useFormValidation({
    firstName: [rules.required('Prénom requis'), rules.minLength(2)],
    lastName: [rules.required('Nom requis'), rules.minLength(2)],
  });
  const { errors: profilePhoneErrors, validate: validateProfilePhone } = useFormValidation({
    phone: [rules.phone()],
  });
  const { fieldErrors: profileServerErrors, globalError: profileGlobalError, handleError: handleProfileError, clearErrors: clearProfileErrors } = useServerErrors();
  const { errors: pwFieldErrors, validate: validatePw } = useFormValidation({
    currentPassword: [rules.required('Mot de passe actuel requis')],
    newPassword: [rules.required('Nouveau mot de passe requis'), rules.minLength(6, 'Minimum 6 caractères')],
  });
  const { fieldErrors: pwServerErrors, globalError: pwGlobalError, handleError: handlePwError, clearErrors: clearPwErrors } = useServerErrors();

  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => { setIsInitialized(false); }, [user?.email]);

  const isArtisan  = user?.role?.toLowerCase() === 'artisan';
  const isSupplier = user?.role?.toLowerCase() === 'supplier';
  const isAdmin    = user?.role?.toLowerCase() === 'admin';

  const roleHomePath = (() => {
    const role = (user?.role || "").toUpperCase();
    if (role === "ADMIN")        return "/admin";
    if (role === "ARTISAN")      return "/artisan";
    if (role === "PRESCRIPTEUR") return "/prescripteur";
    if (role === "SUPPLIER")     return "/fournisseur";
    return "/";
  })();

  const roleLabel = (() => {
    const role = (user?.role || "").toUpperCase();
    if (role === "ADMIN")        return "Administrateur";
    if (role === "ARTISAN")      return "Artisan";
    if (role === "PRESCRIPTEUR") return "Prescripteur";
    if (role === "SUPPLIER")     return "Fournisseur";
    return "Utilisateur";
  })();

  const loadUser = useCallback(async () => {
    try { await refreshMe(); } catch (error) { console.error('Error loading user:', error); }
  }, [refreshMe]);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => {
    if (!user || isInitialized) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setPhone(user.phone || "");
    setProfilePicture(user.profilePicture || "");
    setProfilePicturePreview(user.profilePicture || "");
    setCity(user.city || "");
    setZone(user.zone || "");
    setLatitude(user.latitude || "");
    setLongitude(user.longitude || "");
    setYearsOfExperience(user.yearsOfExperience || "");
    setSpecialty(user.specialty || "");
    setServiceRadius(user.serviceRadius || "");
    if (user.supplierProfile) {
      setCompanyName(user.supplierProfile.companyName || "");
      setCompanyPhone(user.supplierProfile.phone || "");
      setAddress(user.supplierProfile.address || "");
      setDescription(user.supplierProfile.description || "");
      setLogo(user.supplierProfile.logo || "");
      setLogoPreview(user.supplierProfile.logo || "");
      setCity(user.supplierProfile.city || user.city || "");
      setLatitude(user.supplierProfile.latitude ?? user.latitude ?? "");
      setLongitude(user.supplierProfile.longitude ?? user.longitude ?? "");
      setSelectedCategories(user.supplierProfile.categories || []);
    }
    setIsInitialized(true);
  }, [user, isInitialized]);

  useEffect(() => {
    if (isSupplier) {
      const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories`);
          const data = await response.json();
          setAllCategories(data.data || []);
        } catch (error) { console.error('Error fetching categories:', error); }
        finally { setLoadingCategories(false); }
      };
      fetchCategories();
    }
  }, [isSupplier]);

  useEffect(() => {
    const handleLocationUpdate = (event) => {
      const locationData = event.detail;
      if (locationData && isRecentLocationUpdate(locationData.timestamp)) {
        setLatitude(String(locationData.latitude || ''));
        setLongitude(String(locationData.longitude || ''));
        if (locationData.address) {
          setCity(locationData.address.city || '');
          if (isSupplier) setAddress(locationData.address.fullAddress || locationData.address.street || '');
          else setZone(locationData.address.suburb || locationData.address.street || '');
        }
        showNotification('Adresse mise à jour automatiquement !', 'success');
      }
    };
    const storedUpdate = getStoredLocationUpdate();
    if (storedUpdate && isRecentLocationUpdate(storedUpdate.timestamp)) {
      setLatitude(String(storedUpdate.latitude || ''));
      setLongitude(String(storedUpdate.longitude || ''));
      if (storedUpdate.address) {
        setCity(storedUpdate.address.city || '');
        if (isSupplier) setAddress(storedUpdate.address.fullAddress || storedUpdate.address.street || '');
        else setZone(storedUpdate.address.suburb || storedUpdate.address.street || '');
      }
    }
    window.addEventListener('locationUpdated', handleLocationUpdate);
    return () => window.removeEventListener('locationUpdated', handleLocationUpdate);
  }, [isSupplier, showNotification]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setProfilePictureFile(null); setProfilePicturePreview(profilePicture); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("L'image doit être inférieure à 5MB"); return; }
    setProfilePictureFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicturePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setLogoFile(null); setLogoPreview(logo); return; }
    if (file.size > 2 * 1024 * 1024) { setErr("Le logo doit être inférieur à 2MB"); return; }
    if (!['image/jpeg','image/png','image/gif'].includes(file.type)) { setErr("Format JPG, PNG ou GIF requis"); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    if (window.confirm("Voulez-vous vraiment supprimer le logo ?")) {
      setLogoFile(null); setLogoPreview(""); setLogo("");
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const applyMapSelection = ({ latitude: nextLat, longitude: nextLng, city: nextCity, address: nextAddress }) => {
    setLatitude(nextLat !== undefined && nextLat !== null ? String(nextLat) : "");
    setLongitude(nextLng !== undefined && nextLng !== null ? String(nextLng) : "");
    if (nextCity) setCity(nextCity);
    if (nextAddress) {
      if (isSupplier) setAddress(nextAddress);
      else setZone(nextAddress.split(',')[0]?.trim() || nextAddress);
    }
    setIsMapPickerOpen(false);
  };

  async function onSave(e) {
    e.preventDefault();
    clearProfileErrors(); setErr(""); setMsg("");
    if (!validateProfile({ firstName, lastName })) return;
    if (phone.trim() && !validateProfilePhone({ phone })) return;
    setSaving(true);
    try {
      let updateData;
      if (isArtisan) {
        if (profilePictureFile) {
          updateData = new FormData();
          ['firstName','lastName','phone','city','zone','latitude','longitude','yearsOfExperience','specialty','serviceRadius'].forEach(k => updateData.append(k, eval(k)));
          updateData.append('profilePicture', profilePictureFile);
        } else {
          updateData = { firstName, lastName, phone, city, zone, latitude, longitude, yearsOfExperience, specialty, serviceRadius, profilePicture };
        }
      } else if (isSupplier) {
        if (logoFile) {
          updateData = new FormData();
          ['firstName','lastName','phone','companyName','companyPhone','address','description','city','latitude','longitude'].forEach(k => updateData.append(k, eval(k)));
          updateData.append('categories', JSON.stringify(selectedCategories));
          updateData.append('logo', logoFile);
        } else {
          updateData = { firstName, lastName, phone, companyName, companyPhone, address, description, city, latitude, longitude, categories: selectedCategories, logo };
        }
      } else {
        if (profilePictureFile) {
          updateData = new FormData();
          ['firstName','lastName','phone','city','zone','latitude','longitude'].forEach(k => updateData.append(k, eval(k)));
          updateData.append('profilePicture', profilePictureFile);
        } else {
          updateData = { firstName, lastName, phone, city, zone, latitude, longitude, profilePicture };
        }
      }
      await updateProfile(updateData);
      await refreshMe();
      setMsg(t('profile.saveSuccess') || 'Profil mis à jour avec succès !');
      setProfilePictureFile(null); setLogoFile(null);
    } catch (e2) {
      handleProfileError(e2);
      setErr(e2.message || t('profile.saveError') || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    clearPwErrors(); setPwErr(""); setPwMsg("");
    if (!validatePw({ currentPassword, newPassword })) return;
    setPwLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg(t('profile.passwordChangeSuccess') || 'Mot de passe modifié avec succès');
      setCurrentPassword(""); setNewPassword("");
    } catch (e2) {
      handlePwError(e2);
      setPwErr(e2.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPwLoading(false);
    }
  }

  async function onSendResetLink() {
    setResetErr(""); setResetMsg("");
    if (!user?.email) { setResetErr("Aucune adresse email disponible."); return; }
    setResetLoading(true);
    try {
      await forgotPassword({ email: user.email });
      setResetMsg("Lien de réinitialisation envoyé à votre email.");
    } catch (e2) {
      setResetErr(e2.message || "Impossible d'envoyer l'email.");
    } finally {
      setResetLoading(false);
    }
  }

  const avatarSrc = profilePicturePreview || null;
  const logoSrc = logoPreview || (logo ? (logo.startsWith('http') ? logo : `${SERVER_URL}${logo}`) : null);

  return (
    <>
      <Notification notification={notification} onClose={hideNotification} />
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t('profile.title') || 'Mon Profil'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('profile.subtitle') || 'Gérez vos informations personnelles'}
          </p>
        </div>

        {/* Global alerts */}
        {err && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {err}
          </div>
        )}
        {msg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" /> {msg}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="space-y-4">
            {/* Identity card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 py-8 text-center">
                <div className="relative mx-auto mb-3 h-24 w-24">
                  {isSupplier ? (
                    logoSrc ? (
                      <img src={logoSrc} alt="Logo" className="h-24 w-24 rounded-full object-cover ring-4 ring-white/40" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40">
                        <Building className="h-12 w-12 text-white" />
                      </div>
                    )
                  ) : (
                    avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-white/40" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40">
                        <User className="h-12 w-12 text-white" />
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => isSupplier ? logoInputRef.current?.click() : fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-indigo-50"
                  >
                    <Camera className="h-3.5 w-3.5 text-indigo-600" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/jpeg,image/png,image/gif" className="hidden" />
                </div>
                <p className="text-base font-semibold text-white">
                  {isSupplier && companyName ? companyName : `${firstName} ${lastName}`}
                </p>
                <p className="mt-0.5 text-xs text-indigo-200">{roleLabel}</p>
              </div>
              <div className="divide-y divide-slate-100 px-4 py-2 text-sm">
                <div className="flex items-center gap-2 py-2.5 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-2 py-2.5 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{phone}</span>
                  </div>
                )}
                {city && (
                  <div className="flex items-center gap-2 py-2.5 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tab navigation */}
            <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {tab.label}
                    {activeTab === tab.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── RIGHT MAIN AREA ── */}
          <main className="min-w-0">

            {/* ── TAB: INFORMATIONS ── */}
            {activeTab === 'info' && (
              <form onSubmit={onSave} className="space-y-5">
                {/* Common info */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <UserCircle className="h-5 w-5 text-indigo-600" /> Informations personnelles
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('profile.firstNameLabel') || 'Prénom'}</label>
                        <input
                          value={firstName} onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Votre prénom"
                          className={`w-full rounded-xl border ${profileFieldErrors.firstName || profileServerErrors.firstName ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                        />
                        <FieldError error={profileFieldErrors.firstName || profileServerErrors.firstName} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('profile.lastNameLabel') || 'Nom'}</label>
                        <input
                          value={lastName} onChange={(e) => setLastName(e.target.value)}
                          placeholder="Votre nom"
                          className={`w-full rounded-xl border ${profileFieldErrors.lastName || profileServerErrors.lastName ? 'border-red-400' : 'border-slate-200'} bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                        />
                        <FieldError error={profileFieldErrors.lastName || profileServerErrors.lastName} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('profile.emailLabel') || 'Email'}</label>
                        <input value={user?.email || ""} disabled className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('profile.phoneLabel') || 'Téléphone'}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="+216 XX XXX XXX"
                            className={`w-full rounded-xl border ${profilePhoneErrors.phone || profileServerErrors.phone ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`}
                          />
                        </div>
                        <FieldError error={profilePhoneErrors.phone || profileServerErrors.phone} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artisan-specific */}
                {isArtisan && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Tag className="h-5 w-5 text-indigo-600" /> Informations métier
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Années d'expérience</label>
                          <input value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} type="text" placeholder="Ex : 5"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Métier / Spécialité</label>
                          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20">
                            <option value="">Sélectionnez votre spécialité</option>
                            {['Maçonnerie','Plomberie','Électricité','Peinture','Carrelage','Menuiserie','Climatisation','Isolation','Toiture','Jardinage','Autre'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Rayon d'intervention (km)</label>
                          <input value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)} type="text" placeholder="Ex : 25"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Supplier-specific */}
                {isSupplier && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Building className="h-5 w-5 text-indigo-600" /> Informations société
                      </h2>
                    </div>
                    <div className="p-6 space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nom de la société</label>
                          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex : BMP Distribution"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Téléphone société</label>
                          <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+216 XX XXX XXX"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description / Bio</label>
                          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="Présentez votre société..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>

                      {/* Logo */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Logo de la société</label>
                        <div className="flex items-center gap-4">
                          {logoSrc && (
                            <div className="relative">
                              <img src={logoSrc} alt="Logo" className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/64x64?text=Logo'; }} />
                              <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <button type="button" onClick={() => logoInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                            <Upload className="h-4 w-4" />
                            {logoFile ? 'Changer le logo' : (logo ? 'Changer le logo' : 'Choisir un logo')}
                          </button>
                          <p className="text-xs text-slate-400">JPG, PNG, GIF (max 2MB)</p>
                        </div>
                      </div>

                      {/* Categories */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Catégories de produits</label>
                        {loadingCategories ? (
                          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {allCategories.map((cat) => (
                                <label key={cat._id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-indigo-50 transition">
                                  <input type="checkbox" checked={selectedCategories.includes(cat._id)} onChange={() => handleCategoryToggle(cat._id)}
                                    className="rounded border-slate-300 text-indigo-600" />
                                  <span className="text-sm text-slate-700">{cat.name}</span>
                                </label>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-slate-400">{selectedCategories.length} catégorie(s) sélectionnée(s)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo for non-supplier */}
                {!isSupplier && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Camera className="h-5 w-5 text-indigo-600" /> Photo de profil
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 p-6">
                      {avatarSrc && <img src={avatarSrc} alt="Avatar" className="h-16 w-16 rounded-full object-cover border border-slate-200" />}
                      <div>
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                          <Camera className="h-4 w-4" />
                          {profilePictureFile ? "Changer l'image" : "Choisir une image"}
                        </button>
                        {profilePictureFile && <span className="ml-2 text-xs text-slate-500">{profilePictureFile.name}</span>}
                        <p className="mt-1 text-xs text-slate-400">JPG, PNG, GIF. Max 5 Mo.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => navigate(roleHomePath)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : t('profile.saveButton') || 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB: LOCALISATION ── */}
            {activeTab === 'location' && (
              <form onSubmit={onSave} className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <MapPin className="h-5 w-5 text-indigo-600" /> Localisation
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">Votre position aide à vous trouver facilement.</p>
                  </div>
                  <div className="p-6">
                    <LiveLocationSection
                      city={city} setCity={setCity}
                      zone={zone} setZone={setZone}
                      latitude={latitude} setLatitude={setLatitude}
                      longitude={longitude} setLongitude={setLongitude}
                      address={address} setAddress={setAddress}
                      isSupplier={isSupplier}
                      onOpenMap={() => setIsMapPickerOpen(true)}
                      onMapSelection={applyMapSelection}
                    />
                    {isSupplier && (
                      <div className="mt-5">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Adresse complète</label>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="3" placeholder="Rue, ville, code postal, pays"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    )}
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Ville</label>
                        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Tunis"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      {!isSupplier && (
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">Zone / Quartier</label>
                          <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex : Lac 2"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      )}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Latitude</label>
                        <input value={latitude} onChange={(e) => setLatitude(e.target.value)} type="text" placeholder="Ex : 36.8065"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Longitude</label>
                        <input value={longitude} onChange={(e) => setLongitude(e.target.value)} type="text" placeholder="Ex : 10.1815"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    </div>
                    {isSupplier && (
                      <div className="mt-4">
                        <button type="button" onClick={() => setIsMapPickerOpen(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100">
                          <MapPin className="h-4 w-4" /> Ouvrir la carte
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => navigate(roleHomePath)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB: SÉCURITÉ ── */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                {/* Change password */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Lock className="h-5 w-5 text-indigo-600" /> Changer le mot de passe
                    </h2>
                  </div>
                  <div className="p-6">
                    <form onSubmit={onChangePassword} className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Votre mot de passe actuel"
                            className={`w-full rounded-xl border ${pwFieldErrors.currentPassword || pwServerErrors.currentPassword ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`} />
                        </div>
                        <FieldError error={pwFieldErrors.currentPassword || pwServerErrors.currentPassword} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères"
                            className={`w-full rounded-xl border ${pwFieldErrors.newPassword || pwServerErrors.newPassword ? 'border-red-400' : 'border-slate-200'} bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20`} />
                        </div>
                        <FieldError error={pwFieldErrors.newPassword || pwServerErrors.newPassword} />
                      </div>
                      {(pwErr || pwGlobalError) && (
                        <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{pwErr || pwGlobalError}</div>
                      )}
                      {pwMsg && (
                        <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{pwMsg}</div>
                      )}
                      <div className="sm:col-span-2">
                        <button type="submit" disabled={pwLoading} className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                          {pwLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour...</span> : 'Changer le mot de passe'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Reset link */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Mail className="h-5 w-5 text-indigo-600" /> Lien de réinitialisation
                    </h2>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-6">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Envoyer un lien par email</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
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
                  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <ShieldCheck className="h-5 w-5 text-blue-600" /> Authentification biométrique
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">Gérez votre Face ID et la sécurité du compte.</p>
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

      <MapPickerModal
        open={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialValue={{ latitude, longitude, city, address: isSupplier ? address : zone }}
        onUsePlace={applyMapSelection}
      />
      <Footer />
    </>
  );
}

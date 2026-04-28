import React, { useEffect, useState, useRef, useCallback } from "react";
import ReadCardButton from '../components/ReadCardButton';
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
    firstName: [rules.minLength(2)],
    lastName: [rules.minLength(2)],
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
    setLatitude(user.location?.lat ? String(user.location.lat) : "");
    setLongitude(user.location?.lng ? String(user.location.lng) : "");
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
    // Only validate non-empty fields — never block a photo/logo-only save
    const toValidate = {};
    if (firstName) toValidate.firstName = firstName;
    if (lastName)  toValidate.lastName  = lastName;
    if (!validateProfile(toValidate)) return;
    if (phone.trim() && !validateProfilePhone({ phone })) return;
    setSaving(true);
    try {
      let updateData;

      // Helper: append only non-empty string values
      const appendIfSet = (fd, key, val) => { if (val !== undefined && val !== null && val !== '') fd.append(key, val); };

      if (isSupplier) {
        if (logoFile) {
          updateData = new FormData();
          appendIfSet(updateData, 'firstName', firstName);
          appendIfSet(updateData, 'lastName', lastName);
          appendIfSet(updateData, 'phone', phone);
          appendIfSet(updateData, 'companyName', companyName);
          appendIfSet(updateData, 'companyPhone', companyPhone);
          appendIfSet(updateData, 'address', address);
          appendIfSet(updateData, 'description', description);
          appendIfSet(updateData, 'city', city);
          if (latitude !== '' && latitude !== null) updateData.append('latitude', latitude);
          if (longitude !== '' && longitude !== null) updateData.append('longitude', longitude);
          updateData.append('categories', JSON.stringify(selectedCategories));
          updateData.append('logo', logoFile);
        } else {
          updateData = {};
          if (firstName)   updateData.firstName   = firstName;
          if (lastName)    updateData.lastName    = lastName;
          if (phone)       updateData.phone       = phone;
          if (companyName) updateData.companyName = companyName;
          if (companyPhone)updateData.companyPhone= companyPhone;
          if (address)     updateData.address     = address;
          if (description) updateData.description = description;
          if (city)        updateData.city        = city;
          if (latitude  !== '') updateData.latitude  = latitude;
          if (longitude !== '') updateData.longitude = longitude;
          updateData.categories = selectedCategories;
          if (logo)        updateData.logo        = logo;
        }
      } else {
        // Artisan or generic (admin/prescripteur)
        if (profilePictureFile) {
          updateData = new FormData();
          appendIfSet(updateData, 'firstName', firstName);
          appendIfSet(updateData, 'lastName', lastName);
          appendIfSet(updateData, 'phone', phone);
          appendIfSet(updateData, 'city', city);
          appendIfSet(updateData, 'zone', zone);
          if (latitude !== '' && latitude !== null) updateData.append('latitude', latitude);
          if (longitude !== '' && longitude !== null) updateData.append('longitude', longitude);
          if (isArtisan) {
            appendIfSet(updateData, 'yearsOfExperience', yearsOfExperience);
            appendIfSet(updateData, 'specialty', specialty);
            appendIfSet(updateData, 'serviceRadius', serviceRadius);
          }
          updateData.append('profilePicture', profilePictureFile);
        } else {
          updateData = {};
          if (firstName)          updateData.firstName          = firstName;
          if (lastName)           updateData.lastName           = lastName;
          if (phone)              updateData.phone              = phone;
          if (city)               updateData.city               = city;
          if (zone)               updateData.zone               = zone;
          if (latitude  !== '')   updateData.latitude           = latitude;
          if (longitude !== '')   updateData.longitude          = longitude;
          if (profilePicture)     updateData.profilePicture     = profilePicture;
          if (isArtisan) {
            if (yearsOfExperience) updateData.yearsOfExperience = yearsOfExperience;
            if (specialty)         updateData.specialty         = specialty;
            if (serviceRadius)     updateData.serviceRadius     = serviceRadius;
          }
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
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('profile.title') || 'Mon Profil'}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{t('profile.subtitle') || 'Gérez vos informations personnelles et paramètres de compte'}</p>
        </div>

        {err && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0" /> {err}
          </div>
        )}
        {msg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
            <CheckCircle className="h-5 w-5 shrink-0" /> {msg}
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
                  {isSupplier ? (
                    logoSrc ? <img src={logoSrc} alt="Logo" className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow-xl" />
                    : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 ring-4 ring-white shadow-xl"><Building className="h-12 w-12 text-white" /></div>
                  ) : (
                    avatarSrc ? <img src={avatarSrc} alt="Avatar" className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow-xl" />
                    : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 ring-4 ring-white shadow-xl"><User className="h-12 w-12 text-white" /></div>
                  )}
                  <button type="button" onClick={() => isSupplier ? logoInputRef.current?.click() : fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white transition hover:bg-indigo-700 hover:scale-110">
                    <Camera className="h-4 w-4" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/jpeg,image/png,image/gif" className="hidden" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{isSupplier && companyName ? companyName : `${firstName} ${lastName}`}</h3>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">{roleLabel}</span>
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50"><Mail className="h-4 w-4 text-indigo-500" /></div>
                    <span className="truncate font-medium">{user?.email}</span>
                  </div>
                  {phone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><Phone className="h-4 w-4 text-emerald-500" /></div>
                      <span className="font-medium">{phone}</span>
                    </div>
                  )}
                  {city && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50"><MapPin className="h-4 w-4 text-amber-500" /></div>
                      <span className="font-medium">{city}</span>
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
                  const desc = { info: 'Nom, email, téléphone', location: 'Adresse et position GPS', security: 'Mot de passe et Face ID' };
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
              <form onSubmit={onSave} className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                  <div className="border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100"><UserCircle className="h-6 w-6 text-indigo-600" /></div>
                      <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Informations personnelles</h2><ReadCardButton text="Informations personnelles" /></div><p className="text-xs text-slate-500">Vos informations de base visibles sur votre profil</p></div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{t('profile.firstNameLabel') || 'Prénom'}</label>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom"
                          className={`w-full rounded-2xl border ${profileFieldErrors.firstName || profileServerErrors.firstName ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                        <FieldError error={profileFieldErrors.firstName || profileServerErrors.firstName} />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{t('profile.lastNameLabel') || 'Nom'}</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Votre nom"
                          className={`w-full rounded-2xl border ${profileFieldErrors.lastName || profileServerErrors.lastName ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                        <FieldError error={profileFieldErrors.lastName || profileServerErrors.lastName} />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{t('profile.emailLabel') || 'Email'}</label>
                        <input value={user?.email || ""} disabled className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-sm text-slate-400" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{t('profile.phoneLabel') || 'Téléphone'}</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 XX XXX XXX"
                            className={`w-full rounded-2xl border ${profilePhoneErrors.phone || profileServerErrors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                        </div>
                        <FieldError error={profilePhoneErrors.phone || profileServerErrors.phone} />
                      </div>
                    </div>
                  </div>
                </div>

                {isArtisan && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100"><Tag className="h-6 w-6 text-amber-600" /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Informations métier</h2><p className="text-xs text-slate-500">Spécialité, expérience et rayon d'intervention</p></div>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Années d'expérience</label>
                          <input value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} type="text" placeholder="Ex : 5"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Métier / Spécialité</label>
                          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10">
                            <option value="">Sélectionnez votre spécialité</option>
                            {['Maçonnerie','Plomberie','Électricité','Peinture','Carrelage','Menuiserie','Climatisation','Isolation','Toiture','Jardinage','Autre'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Rayon d'intervention (km)</label>
                          <input value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)} type="text" placeholder="Ex : 25"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isSupplier && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100"><Building className="h-6 w-6 text-blue-600" /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Informations société</h2><p className="text-xs text-slate-500">Détails de votre entreprise et logo</p></div>
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nom de la société</label>
                          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex : BMP Distribution"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Téléphone société</label>
                          <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+216 XX XXX XXX"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Description / Bio</label>
                          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" placeholder="Présentez votre société, vos services..."
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Logo de la société</label>
                        <div className="flex items-center gap-5">
                          {logoSrc ? (
                            <div className="relative shrink-0">
                              <img src={logoSrc} alt="Logo" className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md" onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Logo'; }} />
                              <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white"><Upload className="h-7 w-7 text-slate-300" /></div>
                          )}
                          <div>
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition">
                              <Upload className="h-4 w-4" />{logoFile ? 'Changer le logo' : (logo ? 'Changer le logo' : 'Choisir un logo')}
                            </button>
                            <p className="mt-1.5 text-xs text-slate-400">JPG, PNG, GIF — max 2 Mo</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-500">Catégories de produits</label>
                        {loadingCategories ? (
                          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                              {allCategories.map((cat) => (
                                <label key={cat._id} className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border p-3.5 transition-all ${selectedCategories.includes(cat._id) ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50'}`}>
                                  <input type="checkbox" checked={selectedCategories.includes(cat._id)} onChange={() => handleCategoryToggle(cat._id)} className="rounded border-slate-300 text-indigo-600" />
                                  <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                </label>
                              ))}
                            </div>
                            <p className="mt-2.5 text-xs text-slate-400">{selectedCategories.length} catégorie(s) sélectionnée(s)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!isSupplier && (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                    <div className="border-b border-slate-100 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100"><Camera className="h-6 w-6 text-violet-600" /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">Photo de profil</h2><p className="text-xs text-slate-500">JPG, PNG, GIF — max 5 Mo</p></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-8">
                      {avatarSrc ? <img src={avatarSrc} alt="Avatar" className="h-20 w-20 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md shrink-0" />
                        : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50"><User className="h-9 w-9 text-slate-300" /></div>}
                      <div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition">
                          <Camera className="h-4 w-4" />{profilePictureFile ? "Changer l'image" : "Choisir une image"}
                        </button>
                        {profilePictureFile && <p className="mt-2 text-xs font-medium text-slate-500">{profilePictureFile.name}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => navigate(roleHomePath)} className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md">Annuler</button>
                  <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><CheckCircle className="h-4 w-4" /> {t('profile.saveButton') || 'Enregistrer les modifications'}</>}
                  </button>
                </div>
              </form>
            )}

            {/* LOCATION TAB */}
            {activeTab === 'location' && (
              <form onSubmit={onSave} className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                  <div className="border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100"><MapPin className="h-6 w-6 text-indigo-600" /></div>
                      <div><h2 className="text-lg font-bold text-slate-900">Localisation</h2><p className="text-xs text-slate-500">Détectez automatiquement ou saisissez manuellement</p></div>
                    </div>
                  </div>
                  <div className="p-8">
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
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => navigate(roleHomePath)} className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md">Annuler</button>
                  <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><CheckCircle className="h-4 w-4" /> Enregistrer les modifications</>}
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
                            className={`w-full rounded-2xl border ${pwFieldErrors.currentPassword || pwServerErrors.currentPassword ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                        </div>
                        <FieldError error={pwFieldErrors.currentPassword || pwServerErrors.currentPassword} />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nouveau mot de passe</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères"
                            className={`w-full rounded-2xl border ${pwFieldErrors.newPassword || pwServerErrors.newPassword ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} pl-11 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10`} />
                        </div>
                        <FieldError error={pwFieldErrors.newPassword || pwServerErrors.newPassword} />
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

      <MapPickerModal open={isMapPickerOpen} onClose={() => setIsMapPickerOpen(false)} initialValue={{ latitude, longitude, city, address: isSupplier ? address : zone }} onUsePlace={applyMapSelection} />
      <Footer />
    </>
  );
}



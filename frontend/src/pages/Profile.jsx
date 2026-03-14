import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";

import { useTranslation } from 'react-i18next';
import Footer from "../components/Footer";
import { 
  Building, 
  MapPin, 
  FileText, 
  Image, 
  Tag,
  Trash2,
  Upload 
} from "lucide-react";

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshMe, updateProfile, changePassword, forgotPassword } = useAuth();

  // Common fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Artisan-specific fields
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

  // Supplier-specific fields
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

  // Determine user role
  const isArtisan = user?.role?.toLowerCase() === 'artisan';
  const isSupplier = user?.role?.toLowerCase() === 'supplier';

  // Initial load - avec useCallback pour éviter les problèmes de dépendances
  const loadUser = useCallback(async () => {
    try {
      await refreshMe();
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, [refreshMe]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Mettre à jour tous les champs quand user change
  useEffect(() => {
    if (user) {
      console.log("Updating form fields with user data:", user);
      
      // Common fields
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      
      // Artisan fields
      setProfilePicture(user.profilePicture || "");
      setProfilePicturePreview(user.profilePicture || "");
      setCity(user.city || "");
      setZone(user.zone || "");
      setLatitude(user.latitude || "");
      setLongitude(user.longitude || "");
      setYearsOfExperience(user.yearsOfExperience || "");
      setSpecialty(user.specialty || "");
      setServiceRadius(user.serviceRadius || "");
      
      // Supplier fields
      if (user.supplierProfile) {
        setCompanyName(user.supplierProfile.companyName || "");
        setCompanyPhone(user.supplierProfile.phone || "");
        setAddress(user.supplierProfile.address || "");
        setDescription(user.supplierProfile.description || "");
        setLogo(user.supplierProfile.logo || "");
        setLogoPreview(user.supplierProfile.logo || "");
        setSelectedCategories(user.supplierProfile.categories || []);
      }
    }
  }, [user]);

  // Load categories for supplier
  useEffect(() => {
    if (isSupplier) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories');
          const data = await response.json();
          setAllCategories(data.data || []);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      fetchCategories();
    }
  }, [isSupplier]);

  // Artisan file handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePictureFile(null);
      setProfilePicturePreview(profilePicture);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Supplier logo handlers
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 2 * 1024 * 1024) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setErr("Logo must be less than 2MB");
    }
  };

  const triggerLogoInput = () => {
    logoInputRef.current.click();
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setLogo("");
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  async function onSave(e) {
    e.preventDefault();
    setErr(""); 
    setMsg("");
    setSaving(true);

    try {
      if (typeof updateProfile !== 'function') {
        throw new Error('updateProfile function is not available');
      }

      let updateData;

      if (isArtisan) {
        if (profilePictureFile) {
          updateData = new FormData();
          updateData.append('firstName', firstName || '');
          updateData.append('lastName', lastName || '');
          updateData.append('phone', phone || '');
          updateData.append('city', city || '');
          updateData.append('zone', zone || '');
          updateData.append('latitude', latitude || '');
          updateData.append('longitude', longitude || '');
          updateData.append('yearsOfExperience', yearsOfExperience || '');
          updateData.append('specialty', specialty || '');
          updateData.append('serviceRadius', serviceRadius || '');
          updateData.append('profilePicture', profilePictureFile);
        } else {
          updateData = {
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || '',
            city: city || '',
            zone: zone || '',
            latitude: latitude || '',
            longitude: longitude || '',
            yearsOfExperience: yearsOfExperience || '',
            specialty: specialty || '',
            serviceRadius: serviceRadius || '',
            profilePicture: profilePicture || '',
          };
        }
      } else if (isSupplier) {
        if (logoFile) {
          updateData = new FormData();
          updateData.append('firstName', firstName || '');
          updateData.append('lastName', lastName || '');
          updateData.append('phone', phone || '');
          updateData.append('companyName', companyName || '');
          updateData.append('companyPhone', companyPhone || '');
          updateData.append('address', address || '');
          updateData.append('description', description || '');
          updateData.append('categories', JSON.stringify(selectedCategories || []));
          updateData.append('logo', logoFile);
        } else {
          updateData = {
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || '',
            companyName: companyName || '',
            companyPhone: companyPhone || '',
            address: address || '',
            description: description || '',
            categories: selectedCategories || [],
            logo: logo || '',
          };
        }
      } else {
        updateData = {
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || '',
        };
      }

      console.log('Sending update data:', updateData);
      
      // Appel de la fonction updateProfile
      const updatedUser = await updateProfile(updateData);
      console.log('Updated user:', updatedUser);
      
      // Rafraîchir les données utilisateur
      await refreshMe();
      
      setMsg(t('profile.saveSuccess'));
      
      // Reset file states
      setProfilePictureFile(null);
      setLogoFile(null);
      
    } catch (e2) {
      console.error('Save error:', e2);
      setErr(e2.message || t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");

    if (!newPassword || newPassword.length < 6) {
      setPwErr(t('profile.passwordMinLengthError'));
      return;
    }

    setPwLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg(t('profile.passwordChangeSuccess'));
      setCurrentPassword("");
      setNewPassword("");
    } catch (e2) {
      setPwErr(e2.message || t('profile.passwordChangeError'));
    } finally {
      setPwLoading(false);
    }
  }

  async function onSendResetLink() {
    setResetErr(""); setResetMsg("");
    if (!user?.email) {
      setResetErr("No email address is available for this account.");
      return;
    }
    setResetLoading(true);
    try {
      await forgotPassword({ email: user.email });
      setResetMsg("A password reset link has been sent to your email address.");
    } catch (e2) {
      setResetErr(e2.message || "Unable to send the password reset email.");
    } finally {
      setResetLoading(false);
    }
  }

  const isGoogle = (user?.authProvider || "").toUpperCase() === "GOOGLE";

  return (
    <>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            {t('profile.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {t('profile.subtitle')}
          </p>
        </div>

        {/* Profile info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 sm:p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('profile.informationSection')}
          </h2>

          <form onSubmit={onSave} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Common fields for all users */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.firstNameLabel')}
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder={t('profile.firstNamePlaceholder')}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.lastNameLabel')}
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder={t('profile.lastNamePlaceholder')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.emailLabel')}
              </label>
              <input
                value={user?.email || ""}
                disabled
                className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.phoneLabel')}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder={t('profile.phonePlaceholder')}
              />
            </div>

            {/* Artisan‑only fields */}
            {isArtisan && (
              <>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Photo de profil
                  </label>
                  <div className="mt-2 flex items-center gap-4">
                    {profilePicturePreview && (
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover border border-slate-200"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {profilePictureFile ? 'Changer l\'image' : 'Choisir une image'}
                      </button>
                      {profilePictureFile && (
                        <span className="ml-2 text-xs text-slate-500">
                          {profilePictureFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Formats acceptés: JPG, PNG, GIF. Taille max: 5 Mo.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ville
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : Tunis"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Zone / Quartier
                  </label>
                  <input
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : Lac 2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Latitude
                  </label>
                  <input
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    type="number"
                    step="any"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : 36.8065"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Longitude
                  </label>
                  <input
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    type="number"
                    step="any"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : 10.1815"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Années d'expérience
                  </label>
                  <input
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : 5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Métier / Spécialité
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Sélectionnez un métier</option>
                    <option value="electricien">Électricien</option>
                    <option value="plombier">Plombier</option>
                    <option value="menuisier">Menuisier</option>
                    <option value="peintre">Peintre</option>
                    <option value="maçon">Maçon</option>
                    <option value="carreleur">Carreleur</option>
                    <option value="chauffagiste">Chauffagiste</option>
                    <option value="climatisation">Climatisation</option>
                    <option value="jardinier">Jardinier</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Rayon de service (km)
                  </label>
                  <input
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : 30"
                  />
                </div>
              </>
            )}

            {/* Supplier‑only fields */}
            {isSupplier && (
              <>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Building className="inline h-4 w-4 mr-1" />
                    Nom de la société
                  </label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Ex : BMP Distribution"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Téléphone société
                  </label>
                  <input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Adresse complète
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows="3"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Rue, ville, code postal, pays"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Description / Bio
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Présentez votre société, vos services, vos points forts..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    <Image className="inline h-4 w-4 mr-1" />
                    Logo de la société
                  </label>
                  <div className="flex items-start gap-4">
                    {(logoPreview || logo) && (
                      <div className="relative">
                        <img
                          src={logoPreview || logo}
                          alt="Company logo"
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoChange}
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={triggerLogoInput}
                        className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {logoFile ? 'Changer le logo' : 'Choisir un logo'}
                      </button>
                      <p className="mt-1 text-xs text-slate-400">
                        JPG, PNG, GIF seulement (max 2MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    <Tag className="inline h-4 w-4 mr-1" />
                    Catégories de produits vendus
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allCategories.map((cat) => (
                      <label key={cat._id} className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat._id)}
                          onChange={() => handleCategoryToggle(cat._id)}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span className="text-sm text-slate-700">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {selectedCategories.length} catégorie(s) sélectionnée(s)
                  </p>
                </div>
              </>
            )}

            {err && (
              <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
            {msg && (
              <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {msg}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto rounded-xl bg-indigo-700 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60 sm:px-8"
              >
                {saving ? t('profile.savingButton') : t('profile.saveButton')}
              </button>
            </div>
          </form>
        </div>

        {/* Password section - same for all roles */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 sm:p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('profile.passwordSection')}
          </h2>

          {isGoogle && (
            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-900/30 dark:text-indigo-200">
              {t('profile.googleInfo')}
            </div>
          )}

          <form onSubmit={onChangePassword} className="mt-4 grid grid-cols-1 gap-4 sm:gap-5">
            {!isGoogle && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('profile.currentPasswordLabel')}
                </label>
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                  placeholder={t('profile.passwordPlaceholder')}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.newPasswordLabel')}
              </label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder={t('profile.passwordPlaceholder')}
              />
            </div>

            {pwErr && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pwErr}
              </div>
            )}
            {pwMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {pwMsg}
              </div>
            )}

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:px-8"
              >
                {pwLoading ? t('profile.changingPasswordButton') : t('profile.changePasswordButton')}
              </button>
              <button
                type="button"
                onClick={onSendResetLink}
                disabled={resetLoading}
                className="w-full sm:w-auto rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 sm:px-8"
              >
                {resetLoading ? "Sending reset email..." : "Send reset link by email"}
              </button>
            </div>

            {resetErr && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {resetErr}
              </div>
            )}
            {resetMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {resetMsg}
              </div>
            )}
          </form>
        </div>

        <Footer />
      </div>
    </>
  );
}
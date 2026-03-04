import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from 'react-i18next';
import Footer from "../components/Footer";

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshMe, updateProfile, changePassword } = useAuth();

  // Common fields
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Artisan-specific fields
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || "");
  const fileInputRef = useRef(null);

  const [city, setCity] = useState(user?.city || "");
  const [zone, setZone] = useState(user?.zone || "");
  const [latitude, setLatitude] = useState(user?.latitude || "");
  const [longitude, setLongitude] = useState(user?.longitude || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(user?.yearsOfExperience || "");
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [serviceRadius, setServiceRadius] = useState(user?.serviceRadius || "");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  // Determine if user is artisan
  const isArtisan = user?.role?.toLowerCase() === 'artisan';

  useEffect(() => {
    refreshMe().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

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

  async function onSave(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    setSaving(true);

    // Prepare update data
    let updateData;

    // If there's a file to upload, use FormData
    if (profilePictureFile) {
      updateData = new FormData();
      updateData.append('firstName', firstName);
      updateData.append('lastName', lastName);
      updateData.append('phone', phone);
      if (isArtisan) {
        updateData.append('city', city);
        updateData.append('zone', zone);
        updateData.append('latitude', latitude);
        updateData.append('longitude', longitude);
        updateData.append('yearsOfExperience', yearsOfExperience);
        updateData.append('specialty', specialty);
        updateData.append('serviceRadius', serviceRadius);
        updateData.append('profilePicture', profilePictureFile);
      }
    } else {
      // No file, send as JSON
      updateData = {
        firstName,
        lastName,
        phone,
      };
      if (isArtisan) {
        Object.assign(updateData, {
          profilePicture, // Keep existing URL if no new file
          city,
          zone,
          latitude,
          longitude,
          yearsOfExperience,
          specialty,
          serviceRadius,
        });
      }
    }

    try {
      await updateProfile(updateData);
      // After successful update, clear the file state and refresh user
      setProfilePictureFile(null);
      // Optionally refresh user data
      await refreshMe();
      setMsg(t('profile.saveSuccess'));
    } catch (e2) {
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

        {/* Password section */}
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

            <div>
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:px-8"
              >
                {pwLoading ? t('profile.changingPasswordButton') : t('profile.changePasswordButton')}
              </button>
            </div>
          </form>
        </div>

        <Footer />
      </div>
    </>
  );
}
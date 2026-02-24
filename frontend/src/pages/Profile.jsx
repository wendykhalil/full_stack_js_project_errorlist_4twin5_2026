import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshMe, updateProfile, changePassword } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    refreshMe().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setPhone(user?.phone || "");
  }, [user]);

  async function onSave(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    setSaving(true);
    try {
      await updateProfile({ firstName, lastName, phone });
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
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('profile.informationSection')}</h2>

        <form onSubmit={onSave} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile.firstNameLabel')}</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              placeholder={t('profile.firstNamePlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile.lastNameLabel')}</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              placeholder={t('profile.lastNamePlaceholder')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile.emailLabel')}</label>
            <input
              value={user?.email || ""}
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile.phoneLabel')}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              placeholder={t('profile.phonePlaceholder')}
            />
          </div>

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
              className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              {saving ? t('profile.savingButton') : t('profile.saveButton')}
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('profile.passwordSection')}</h2>

        {isGoogle && (
          <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-900/30 dark:text-indigo-200">
            {t('profile.googleInfo')}
          </div>
        )}

        <form onSubmit={onChangePassword} className="mt-4 grid grid-cols-1 gap-4">
          {!isGoogle && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile.currentPasswordLabel')}</label>
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
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile.newPasswordLabel')}</label>
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
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {pwLoading ? t('profile.changingPasswordButton') : t('profile.changePasswordButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
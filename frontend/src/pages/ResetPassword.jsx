import React, { useMemo, useState } from "react";
import { HardHat, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from '../i18n';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const q = useQuery();
  const { resetPassword } = useAuth();

  const token = q.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!token) {
      setError(t('resetPassword.tokenMissing'));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError(t('resetPassword.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword });
      setMsg(res?.message || t('resetPassword.success'));
      setTimeout(() => navigate("/login"), 800);
    } catch (e2) {
      setError(e2.message || t('resetPassword.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/60 to-slate-100 px-4">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.18)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-300/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-purple-300/45 blur-3xl" />

        <div className="relative w-full max-w-lg">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-700 text-white shadow-sm">
              <HardHat className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
              {t('resetPassword.title')}
            </h1>
            <p className="mt-2 text-base text-slate-600">
              {t('resetPassword.subtitle')}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('resetPassword.passwordLabel')}</label>
                <input
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                    setMsg("");
                  }}
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('resetPassword.passwordPlaceholder')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {msg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 py-3.5 text-base font-semibold text-white hover:bg-indigo-800 disabled:opacity-60 transition-opacity"
              >
                {loading ? t('resetPassword.updatingButton') : t('resetPassword.updateButton')}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-slate-600">
                <span
                  className="cursor-pointer font-medium text-indigo-600 hover:underline"
                  onClick={() => navigate("/login")}
                >
                  {t('resetPassword.backToLogin')}
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

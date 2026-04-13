import React, { useState } from "react";
import { HardHat, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from '../i18n';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    const value = email.trim();
    if (!value) {
      setError(t('forgotPassword.emailRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword({ email: value });
      setMsg(res?.message || t('forgotPassword.linkSent'));
    } catch (e2) {
      setError(e2.message || t('forgotPassword.sendError'));
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
              {t('forgotPassword.title')}
            </h1>
            <p className="mt-2 text-base text-slate-600">
              {t('forgotPassword.subtitle')}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('forgotPassword.emailLabel')}</label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setMsg("");
                  }}
                  type="email"
                  autoComplete="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
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
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 py-3.5 text-base font-semibold text-white hover:bg-indigo-800 disabled:opacity-60 transition-opacity"
              >
                {loading ? t('forgotPassword.sendingButton') : t('forgotPassword.sendButton')}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-slate-600">
                <span
                  className="cursor-pointer font-medium text-indigo-600 hover:underline"
                  onClick={() => navigate("/login")}
                >
                  {t('forgotPassword.backToLogin')}
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

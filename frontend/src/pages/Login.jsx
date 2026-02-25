import React, { useEffect, useRef, useState } from "react";
import { HardHat, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info] = useState(() => location.state?.info || "");
  const [resendState, setResendState] = useState({ loading: false, message: "" });

  const isPhone =
    /^[+\d\s]{6,}$/.test(emailOrPhone.trim()) && !emailOrPhone.includes("@");

  const googleBtnRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const g = window.google;
    if (!g?.accounts?.id) return;

    try {
      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            setError("");
            setLoading(true);
            const u = await loginWithGoogle(resp.credential);
            navigate(roleToBasePath(u.role), { replace: true });
          } catch (e) {
            setError(e.message || t('login.googleError'));
          } finally {
            setLoading(false);
          }
        },
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        g.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 360,
        });
      }
    } catch {
      // ✅ CORRIGÉ: Supprimé le paramètre '_' inutilisé
      // Ignorer les erreurs d'initialisation de Google
    }
  }, [loginWithGoogle, navigate, t]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const value = emailOrPhone.trim();
    if (!value) {
      setError(t('login.emailPhoneRequired'));
      return;
    }
    if (!password) {
      setError(t('login.passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      const user = await login(value, password);
      navigate(roleToBasePath(user.role), { replace: true });
    } catch (err) {
      setError(err.message || t('login.loginError'));
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendState({ loading: true, message: "" });
    try {
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: { email: emailOrPhone.trim() },
      });
      setResendState({
        loading: false,
        message: t('login.resendSuccess'),
      });
    } catch (e) {
      setResendState({ loading: false, message: e.message || t('login.resendError') });
    }
  }

  const showResend =
    error?.toLowerCase().includes("verif") || error?.toLowerCase().includes("email not");

  return (
    <>
      {/* Language Switcher - fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/60 to-slate-100 px-4">
        {/* Background shapes */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.18)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-300/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-purple-300/45 blur-3xl" />

        <div className="relative w-full max-w-lg">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-700 text-white shadow-sm">
              <HardHat className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
              {t('login.welcomeTitle')}
            </h1>
            <p className="mt-2 text-base text-slate-600">
              {t('login.welcomeSubtitle')}
            </p>
          </div>

          {/* Card */}
          <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
            {info && (
              <div className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-800">
                {info}
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {/* Email or Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t('login.emailPhoneLabel')}
                </label>
                <div className="relative mt-2">
                  <input
                    value={emailOrPhone}
                    onChange={(e) => {
                      setEmailOrPhone(e.target.value);
                      setError("");
                    }}
                    type="text"
                    autoComplete="username"
                    placeholder="mohamed@gmail.com ou +216 22 345 678"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-24 text-base focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  {emailOrPhone.trim().length > 0 && (
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isPhone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {isPhone ? t('login.phoneBadge') : t('login.emailBadge')}
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t('login.passwordLabel')}
                </label>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('login.passwordPlaceholder')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                  {showResend && !isPhone && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={resendVerification}
                        disabled={resendState.loading}
                        className="text-indigo-600 underline text-xs disabled:opacity-50"
                      >
                        {resendState.loading ? t('login.resending') : t('login.resendButton')}
                      </button>
                      {resendState.message && (
                        <p className="mt-1 text-xs text-slate-600">
                          {resendState.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 py-3.5 text-base font-semibold text-white hover:bg-indigo-800 disabled:opacity-60 transition-opacity"
              >
                {loading ? t('login.loggingIn') : t('login.loginButton')}
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Forgot password link - moved below login button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              {/* Google login */}
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <div className="pt-2">
                  <div className="flex justify-center">
                    <div ref={googleBtnRef} />
                  </div>
                  <p className="mt-2 text-center text-xs text-slate-500">
                    {t('login.googleLoginHint')}
                  </p>
                </div>
              )}

              {/* Register link */}
              <p className="text-center text-sm text-slate-600">
                {t('login.noAccount')}{" "}
                <span
                  className="cursor-pointer font-medium text-indigo-600 hover:underline"
                  onClick={() => navigate("/register")}
                >
                  {t('login.signUp')}
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
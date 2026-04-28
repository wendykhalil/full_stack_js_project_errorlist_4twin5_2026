import React, { useEffect, useRef, useState } from "react";
import { 
  Phone, Mail, Lock, Building2,
  Eye, EyeOff, Menu, X, ChevronDown
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";
import FieldError from "../components/FieldError";
import FaceIdLogin from "../components/FaceIdLogin";
import CameraFaceIdLogin from "../components/CameraFaceIdLogin";
import { useServerErrors } from "../hooks/useServerErrors";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, setSession } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberMe") === "true");
  const [loading, setLoading] = useState(false);
  const [info] = useState(() => location.state?.info || "");
  const [resendState, setResendState] = useState({ loading: false, message: "" });
  const [googleWidth, setGoogleWidth] = useState(320);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const googleBtnRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const roles = [
    { name: "Artisan", path: "/register/artisan", icon: "🔨" },
    { name: "Prescripteur", path: "/register/prescripteur", icon: "📐" },
    { name: "Fournisseur", path: "/register/fournisseur", icon: "🏭" }
  ];

  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth < 420) setGoogleWidth(250);
      else if (window.innerWidth < 640) setGoogleWidth(290);
      else setGoogleWidth(360);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    if (!googleInitializedRef.current) {
      googleInitializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            setLoading(true);
            clearErrors();
            const res = await loginWithGoogle(resp.credential);
            if (res?.needsRole) {
              navigate("/register-role", { replace: true, state: { from: "google" } });
              return;
            }
            navigate(roleToBasePath(res.user.role), { replace: true });
          } catch (e) {
            handleError(e);
          } finally {
            setLoading(false);
          }
        },
      });
    }

    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = "";
      const containerWidth = googleBtnRef.current.parentElement?.offsetWidth || googleWidth;
      const btnWidth = Math.min(containerWidth - 16, googleWidth);
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: btnWidth,
      });
    }
  }, [googleWidth, loginWithGoogle, navigate]);

  const { fieldErrors, globalError, handleError, clearErrors } = useServerErrors();

  async function onSubmit(e) {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      const user = await login(emailOrPhone.trim(), password);
      
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
      
      // Get the token from localStorage (it was just set by login/persist)
      const token = localStorage.getItem("bmptn_token");
      
      // Send welcome notification to the backend (always, regardless of rememberMe)
      if (token) {
        try {
          await apiFetch("/notifications/send-welcome", { 
            token,
            method: "POST",
            body: { userName: user.firstName || user.email }
          });
        } catch (e) {
          console.error("Welcome notification failed:", e);
          // Don't fail login if notification fails
        }
      }
      
      navigate(roleToBasePath(user.role), { replace: true });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendState({ loading: true, message: "" });
    try {
      await apiFetch("/auth/resend-verification", { method: "POST", body: { email: emailOrPhone.trim() } });
      setResendState({ loading: false, message: "Email de vérification envoyé." });
    } catch (e) {
      setResendState({ loading: false, message: e.message || "Impossible de renvoyer l'email de vérification" });
    }
  }

  const showResend = globalError?.toLowerCase().includes("verif") || globalError?.toLowerCase().includes("email not");

  const handleFaceIdSuccess = async (result) => {
    try {
      setLoading(true);
      clearErrors();
      if (result.success && result.user && result.token) {
        setSession(result.token, result.user);
        navigate(roleToBasePath(result.user.role), { replace: true });
      } else {
        throw new Error('Invalid Face ID authentication response');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceIdError = (error) => {
    handleError(new Error(error));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative">
                <img src={logo} alt="BMP.tn" className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl shadow-sm transition-transform group-hover:scale-105" />
                <div className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent lg:text-2xl">BMP.tn</span>
            </Link>

            <div className="hidden md:flex md:items-center md:gap-4 lg:gap-6">
              <div className="relative">
                <button onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-blue-600 lg:text-base">
                  <span>rejoindre en tant que</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {roleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRoleDropdownOpen(false)} />
                    <div className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                      {roles.map((role) => (
                        <Link key={role.name} to={role.path}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setRoleDropdownOpen(false)}>
                          <span>{role.icon}</span><span>{role.name}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Link to="/about" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 lg:text-base">À propos</Link>
              <Link to="/contact" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 lg:text-base">Contactez-nous</Link>
              <Link to="/register" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-md lg:px-6 lg:py-2.5 lg:text-base">
Commencer              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="space-y-1 px-4 py-3">
              <div className="border-b border-slate-100 pb-2">
                <p className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Join as</p>
                {roles.map((role) => (
                  <Link key={role.name} to={role.path}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}>
                    <span>{role.icon}</span><span>{role.name}</span>
                  </Link>
                ))}
              </div>
              <Link to="/about" className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>À propos</Link>
              <Link to="/contact" className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Contactez-nous</Link>
              <Link to="/register" className="block rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700" onClick={() => setMobileMenuOpen(false)}>Commencer</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main Content ── */}
      <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center py-8">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40" />
        <div className="pointer-events-none absolute top-10 left-10 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100/40 blur-2xl" />

        <div className="relative w-full max-w-4xl px-4 sm:px-6">
          {/* Two-column card */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* ── LEFT: credentials ── */}
              <div className="p-8 lg:p-10">
                {/* Logo + title */}
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Bon retour 👋</h2>
                  <p className="mt-1.5 text-sm text-slate-500">Connectez-vous à votre compte BMP.tn</p>
                </div>

                {info && (
                  <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm text-emerald-700">{info}</p>
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email ou numéro de téléphone</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                      <input
                        value={emailOrPhone}
                        onChange={(e) => { setEmailOrPhone(e.target.value); clearErrors(); }}
                        type="text" autoComplete="username"
                        placeholder="votre@email.com ou +216..."
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.emailOrPhone ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}
                      />
                    </div>
                    <FieldError error={fieldErrors.emailOrPhone} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mot de passe</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                      <input
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                        type={showPassword ? "text" : "password"} autoComplete="current-password"
                        placeholder="••••••••"
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-12 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.password ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-blue-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError error={fieldErrors.password} />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Se souvenir de moi</span>
                    </label>
                    <button type="button" onClick={() => navigate("/forgot-password")}
                      className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                      Mot de passe oublié ?
                    </button>
                  </div>

                  {globalError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <span className="mt-0.5 text-rose-500">⚠️</span>
                      <p className="text-sm text-rose-700">{globalError}</p>
                    </div>
                  )}

                  {showResend && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-blue-800">Besoin de vérifier votre email ?</span>
                        <button type="button" onClick={resendVerification} disabled={resendState.loading}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-100 disabled:opacity-60">
                          {resendState.loading ? "Envoi..." : "Renvoyer"}
                        </button>
                      </div>
                      {resendState.message && <p className="mt-2 text-sm text-blue-700">{resendState.message}</p>}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Connexion...
                      </div>
                    ) : "Se connecter →"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">Créez-en un</Link>
                  </p>
                </div>

                <p className="mt-3 text-center text-xs text-slate-400">
                  <Link to="/terms" className="hover:text-blue-600 hover:underline">CGU</Link>
                  {' · '}
                  <Link to="/privacy" className="hover:text-blue-600 hover:underline">Confidentialité</Link>
                </p>
              </div>

              {/* ── RIGHT: alternative login options ── */}
              <div className="relative flex flex-col justify-center gap-3 overflow-hidden p-8 lg:p-10">
                {/* Gradient background for right panel */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl" />

                {/* Content over gradient */}
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="mb-1 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Autres méthodes</p>
                    <h3 className="mt-1 text-lg font-bold text-white">Connexion rapide</h3>
                  </div>

                  {/* Face ID buttons — wrapped to show on white bg for contrast */}
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                    <FaceIdLogin
                      onSuccess={handleFaceIdSuccess}
                      onError={handleFaceIdError}
                      disabled={loading}
                    />
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                    <CameraFaceIdLogin
                      onSuccess={handleFaceIdSuccess}
                      onError={handleFaceIdError}
                      disabled={loading}
                      userEmail={emailOrPhone.trim()}
                    />
                  </div>

                  {/* Google */}
                  <div className="flex min-h-[52px] items-center justify-center rounded-2xl bg-white p-2 shadow-md transition-all hover:shadow-lg">
                    <div ref={googleBtnRef} className="flex justify-center" />
                  </div>

                  {/* Phone */}
                  <button type="button" onClick={() => navigate("/login-phone")}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/20">
                    <Phone className="h-4 w-4" />
                    Connexion par téléphone
                  </button>

                  {/* Security badge */}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <img src={logo} alt="BMP.tn" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold text-slate-900">BMP.tn</span>
              </div>
              <p className="mt-4 text-sm text-slate-600 max-w-md">
                La plateforme de référence en Tunisie pour connecter artisans, prescripteurs et fournisseurs.
              </p>
              <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} BMP.tn. Tous droits réservés.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Plateforme</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/about" className="text-sm text-slate-600 transition-colors hover:text-blue-600">À propos</Link></li>
                <li><Link to="/how-it-works" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Comment ça marche</Link></li>
                <li><Link to="/pricing" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Support</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/contact" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Contactez-nous</Link></li>
                <li><Link to="/privacy" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Politique de confidentialité</Link></li>
                <li><Link to="/terms" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Conditions d'utilisation</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

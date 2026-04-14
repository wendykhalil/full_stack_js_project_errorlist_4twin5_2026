import React, { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, ChevronDown, PhoneCall, Smartphone, Shield, CheckCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";
import { useServerErrors } from "../hooks/useServerErrors";
import FieldError from "../components/FieldError";

const COUNTRY_CODES = [
  { code: "+216", label: "Tunisia", flag: "🇹🇳" },
  { code: "+213", label: "Algeria", flag: "🇩🇿" },
  { code: "+212", label: "Morocco", flag: "🇲🇦" },
  { code: "+218", label: "Libya", flag: "🇱🇾" },
  { code: "+20", label: "Egypt", flag: "🇪🇬" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+32", label: "Belgium", flag: "🇧🇪" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "+39", label: "Italy", flag: "🇮🇹" },
  { code: "+34", label: "Spain", flag: "🇪🇸" },
  { code: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", label: "United States / Canada", flag: "🇺🇸" },
  { code: "+971", label: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+966", label: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+974", label: "Qatar", flag: "🇶🇦" },
];

function cleanLocalPhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export default function PhoneLogin() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [step, setStep] = useState("PHONE");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phoneInput, setPhoneInput] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const { fieldErrors: phoneServerErrors, globalError: phoneGlobalError, handleError: handlePhoneError, clearErrors: clearPhoneErrors } = useServerErrors();
  const { fieldErrors: codeServerErrors, globalError: codeGlobalError, handleError: handleCodeError, clearErrors: clearCodeErrors } = useServerErrors();

  const normalizedPhone = useMemo(() => `${countryCode}${cleanLocalPhone(phoneInput)}`, [countryCode, phoneInput]);

  async function sendCode(e) {
    e.preventDefault();
    clearPhoneErrors();
    setMsg("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/phone/start", { method: "POST", body: { phone: normalizedPhone } });
      setMsg(res.message || "Verification code sent.");
      setStep("CODE");
    } catch (err) {
      handlePhoneError(err);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    clearCodeErrors();
    setMsg("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/phone/verify", { method: "POST", body: { phone: normalizedPhone, code: code.trim() } });
      setSession(res.token, res.user);
      if (res.needsRole) {
        navigate("/register-role", { replace: true, state: { from: "sms" } });
        return;
      }
      navigate(roleToBasePath(res.user.role), { replace: true });
    } catch (err) {
      handleCodeError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Professional Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="BMP.tn" 
                  className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl shadow-sm transition-transform group-hover:scale-105" 
                />
                <div className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent lg:text-2xl">
                BMP.tn
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-4 lg:gap-6">
              <Link to="/about" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 lg:text-base">
                About
              </Link>
              <Link to="/contact" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 lg:text-base">
                Contact
              </Link>
              <Link 
                to="/register" 
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-md lg:px-6 lg:py-2.5 lg:text-base"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button - Simple for now */}
            <div className="flex items-center gap-2 md:hidden">
              <Link 
                to="/register" 
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
              >
                S’inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-orange-50/20" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-md">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour à la connexion
            </button>

            {/* Phone Login Card */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
                    <Smartphone className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Connexion par téléphone</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {step === "PHONE" 
                      ? "Saisissez votre numéro de téléphone pour recevoir un code de vérification"
                      : "Saisissez le code à 6 chiffres envoyé sur votre téléphone"
                    }
                  </p>
                </div>

                {/* Error Message */}
                {(step === "PHONE" ? phoneGlobalError : codeGlobalError) && (
                  <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm text-rose-700">{step === "PHONE" ? phoneGlobalError : codeGlobalError}</p>
                  </div>
                )}

                {/* Success Message */}
                {msg && (
                  <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700">{msg}</p>
                    </div>
                  </div>
                )}

                {/* Phone Number Form */}
                {step === "PHONE" ? (
                  <form onSubmit={sendCode} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Numéro de téléphone
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[200px,1fr]">
                        {/* Country Code Select */}
                        <div className="relative">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                          >
                            {COUNTRY_CODES.map((item) => (
                              <option key={`${item.code}-${item.label}`} value={item.code}>
                                {item.flag} {item.code}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Phone Input */}
                        <input
                          value={phoneInput}
                          onChange={(e) => {
                            setPhoneInput(e.target.value);
                            clearPhoneErrors();
                          }}
                          placeholder="22 345 678"
                          inputMode="numeric"
                          className={`w-full rounded-xl border ${phoneServerErrors.phoneInput ? 'border-red-400' : 'border-slate-300'} bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                        />
                      </div>
                      <FieldError error={phoneServerErrors.phoneInput} />

                      {/* Full Number Preview */}
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500">Votre numéro complet :</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{normalizedPhone}</p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      disabled={loading} 
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-xl disabled:opacity-60 disabled:hover:from-blue-600"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Envoi...
                        </div>
                      ) : (
                        <>
                          Envoyer le code de vérification
                          <PhoneCall className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {/* Security Note */}
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Shield className="h-3 w-3" />
                      <span>Nous enverrons un code à 6 chiffres par SMS</span>
                    </div>
                  </form>
                ) : (
                  /* Verification Code Form */
                  <form onSubmit={verifyCode} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Code de vérification
                      </label>
                      <input
                        value={code}
                        onChange={(e) => { setCode(e.target.value); clearCodeErrors(); }}
                        placeholder="Saisissez le code à 6 chiffres"
                        inputMode="numeric"
                        maxLength="6"
                        className={`w-full rounded-xl border ${codeServerErrors.code ? 'border-red-400' : 'border-slate-300'} bg-white px-4 py-3 text-center text-2xl font-semibold tracking-wider text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <FieldError error={codeServerErrors.code} />
                      
                      {/* Phone Number Reference */}
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500">Vérification pour :</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{normalizedPhone}</p>
                      </div>
                    </div>

                    {/* Verify Button */}
                    <button 
                      disabled={loading} 
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-xl disabled:opacity-60"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Vérification...
                        </div>
                      ) : (
                        <>
                          Vérifier et se connecter
                          <BadgeCheck className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {/* Edit Phone Number Button */}
                    <button 
                      type="button" 
                      onClick={() => {
                        setStep("PHONE");
                        setCode("");
                        setMsg("");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      ← Modifier le numéro
                    </button>

                    {/* Resend Hint */}
                    <p className="text-center text-xs text-slate-500">
                      Vous n’avez pas reçu le code ? Vérifiez vos SMS ou réessayez
                    </p>
                  </form>
                )}

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase text-slate-400">ou</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Back to Email Login */}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Se connecter avec l’email
                </button>

                {/* Sign Up Link */}
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <p className="text-center text-sm text-slate-600">
                    Vous n’avez pas de compte ?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Créez-en un maintenant
                    </Link>
                  </p>
                </div>

                {/* Terms */}
                <p className="mt-4 text-center text-xs text-slate-500">
                  En vous connectant, vous acceptez les{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">
                    Conditions d’utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">
                    Politique de confidentialité
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <img src={logo} alt="BMP.tn" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold text-slate-900">BMP.tn</span>
              </div>
              <p className="mt-4 text-sm text-slate-600 max-w-md">
                La plateforme de référence en Tunisie pour connecter les professionnels du bâtiment en Afrique du Nord et au-delà.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                © {new Date().getFullYear()} BMP.tn. Tous droits réservés.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Plateforme
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Comment ça marche
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Support
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/contact" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Conditions d’utilisation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>

  );
}
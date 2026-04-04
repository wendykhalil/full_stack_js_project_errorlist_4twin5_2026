import React, { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, ChevronDown, PhoneCall, Smartphone, Shield, CheckCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";

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
  const [error, setError] = useState("");

  const normalizedPhone = useMemo(() => `${countryCode}${cleanLocalPhone(phoneInput)}`, [countryCode, phoneInput]);

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!cleanLocalPhone(phoneInput)) return setError("Please enter your phone number.");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/phone/start", { method: "POST", body: { phone: normalizedPhone } });
      setMsg(res.message || "Verification code sent.");
      setStep("CODE");
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError("");
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
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
            <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
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
            <div className="md:hidden">
              <Link 
                to="/register" 
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
              >
                Sign Up
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
              Back to login
            </button>

            {/* Phone Login Card */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
                    <Smartphone className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Phone Sign In</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {step === "PHONE" 
                      ? "Enter your phone number to receive a verification code"
                      : "Enter the 6-digit code sent to your phone"
                    }
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-sm text-rose-700">{error}</p>
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
                        Phone Number
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
                            setError("");
                          }}
                          placeholder="22 345 678"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Full Number Preview */}
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500">Your full number:</p>
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
                          Sending...
                        </div>
                      ) : (
                        <>
                          Send verification code
                          <PhoneCall className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {/* Security Note */}
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Shield className="h-3 w-3" />
                      <span>We'll send a 6-digit code via SMS</span>
                    </div>
                  </form>
                ) : (
                  /* Verification Code Form */
                  <form onSubmit={verifyCode} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Verification Code
                      </label>
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        inputMode="numeric"
                        maxLength="6"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-wider text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      
                      {/* Phone Number Reference */}
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <p className="text-xs text-slate-500">Verifying for:</p>
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
                          Verifying...
                        </div>
                      ) : (
                        <>
                          Verify & Sign In
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
                        setError("");
                        setMsg("");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      ← Edit phone number
                    </button>

                    {/* Resend Hint */}
                    <p className="text-center text-xs text-slate-500">
                      Didn't receive the code? Check your SMS or try again
                    </p>
                  </form>
                )}

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Back to Email Login */}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Sign in with email instead
                </button>

                {/* Sign Up Link */}
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <p className="text-center text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Create one now
                    </Link>
                  </p>
                </div>

                {/* Terms */}
                <p className="mt-4 text-center text-xs text-slate-500">
                  By signing in, you agree to BMP.tn's{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
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
                Tunisia's leading construction and engineering platform connecting professionals across North Africa and beyond.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                © {new Date().getFullYear()} BMP.tn. All rights reserved.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Platform
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Pricing
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
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import React, { useEffect, useRef, useState } from "react";
import { 
  ArrowLeft, 
  Phone, 
  UserPlus, 
  Mail, 
  Lock, 
  Building2,
  Eye,
  EyeOff,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info] = useState(() => location.state?.info || "");
  const [resendState, setResendState] = useState({ loading: false, message: "" });
  const [googleWidth, setGoogleWidth] = useState(320);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const googleBtnRef = useRef(null);

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
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp) => {
        try {
          setLoading(true);
          setError("");
          const res = await loginWithGoogle(resp.credential);
          if (res?.needsRole) {
            navigate("/register-role", { replace: true, state: { from: "google" } });
            return;
          }
          navigate(roleToBasePath(res.user.role), { replace: true });
        } catch (e) {
          setError(e.message || "Google login failed");
        } finally {
          setLoading(false);
        }
      },
    });
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: googleWidth,
      });
    }
  }, [googleWidth, loginWithGoogle, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const value = emailOrPhone.trim();
    if (!value) return setError("Email or phone number is required");
    if (!password) return setError("Password is required");
    setLoading(true);
    try {
      const user = await login(value, password);
      navigate(roleToBasePath(user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendState({ loading: true, message: "" });
    try {
      await apiFetch("/auth/resend-verification", { method: "POST", body: { email: emailOrPhone.trim() } });
      setResendState({ loading: false, message: "Verification email sent." });
    } catch (e) {
      setResendState({ loading: false, message: e.message || "Unable to resend verification" });
    }
  }

  const showResend = error?.toLowerCase().includes("verif") || error?.toLowerCase().includes("email not");

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Professional Navbar with Role Dropdown */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
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
              <LanguageSwitcher />
              {/* Role Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-blue-600 lg:text-base"
                >
                  <span>Join as</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {roleDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setRoleDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                      {roles.map((role) => (
                        <Link
                          key={role.name}
                          to={role.path}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setRoleDropdownOpen(false)}
                        >
                          <span>{role.icon}</span>
                          <span>{role.name}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

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

            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="space-y-1 px-4 py-3">
              <div className="border-b border-slate-100 pb-2">
                <p className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Join as</p>
                {roles.map((role) => (
                  <Link
                    key={role.name}
                    to={role.path}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{role.icon}</span>
                    <span>{role.name}</span>
                  </Link>
                ))}
              </div>
              <Link 
                to="/about" 
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                to="/register" 
                className="block rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-orange-50/20" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-md">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="group mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>

            {/* Login Card */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl">
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Sign in to your BMP.tn account
                  </p>
                </div>

                {/* Info Message */}
                {info && (
                  <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm text-emerald-700">{info}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Email/Phone Field */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={emailOrPhone}
                        onChange={(e) => {
                          setEmailOrPhone(e.target.value);
                          setError("");
                        }}
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your email or phone"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field with Show/Hide */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 py-3 text-base text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-blue-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  )}

                  {/* Resend Verification */}
                  {showResend && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-blue-800">
                          Need to verify your email?
                        </span>
                        <button
                          type="button"
                          onClick={resendVerification}
                          disabled={resendState.loading}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-100 disabled:opacity-60"
                        >
                          {resendState.loading ? "Sending..." : "Resend verification"}
                        </button>
                      </div>
                      {resendState.message && (
                        <p className="mt-2 text-sm text-blue-700">{resendState.message}</p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase text-slate-400">Or continue with</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Alternative Login Methods */}
                <div className="space-y-3">
                  {/* Google Button */}
                  <div className="flex min-h-[54px] items-center justify-center rounded-xl border border-slate-200 bg-white p-2 transition-all hover:border-blue-300 hover:shadow-md">
                    <div ref={googleBtnRef} />
                  </div>

                  {/* Phone Login Button */}
                  <button
                    type="button"
                    onClick={() => navigate("/login-phone")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Phone className="h-4 w-4" />
                    Sign in with phone number
                  </button>
                </div>

                {/* Sign Up Section */}
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
                Tunisia's leading construction and engineering platform connecting artisans, prescripteurs, and suppliers.
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
    </>

  );
}
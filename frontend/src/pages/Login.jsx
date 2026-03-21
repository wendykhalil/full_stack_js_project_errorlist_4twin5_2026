import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, UserPlus } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info] = useState(() => location.state?.info || "");
  const [resendState, setResendState] = useState({ loading: false, message: "" });
  const [googleWidth, setGoogleWidth] = useState(320);
  const googleBtnRef = useRef(null);

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
    if (!value) return setError("Username or email is required");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_25%)]" />

        <div className="relative z-10 w-full max-w-[32rem]">
          <div className="mb-4 text-center">
            <img src={logo} alt="BMP.tn logo" className="mx-auto h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm ring-1 ring-blue-100" />
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Sign in</p>
            <p className="mt-2 text-sm text-slate-500">Simple, secure and centered access to your BMP.tn workspace.</p>
          </div>

          <div className="rounded-[1.9rem] border border-slate-200 bg-white px-5 py-5 shadow-2xl shadow-slate-200/70 sm:px-7 sm:py-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {info && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email or mobile phone number</label>
                <input
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    setError("");
                  }}
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or phone"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password</label>
                  <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm font-medium text-slate-700 transition hover:text-blue-700">Forgot password?</button>
                </div>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

              {showResend && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>Your email address may still need verification.</span>
                    <button
                      type="button"
                      onClick={resendVerification}
                      disabled={resendState.loading}
                      className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-4 py-2 font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                    >
                      {resendState.loading ? "Sending..." : "Resend verification"}
                    </button>
                  </div>
                  {resendState.message && <div className="mt-2 text-sm">{resendState.message}</div>}
                </div>
              )}

              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Continue"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-3">
              <div className="flex min-h-[54px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <div ref={googleBtnRef} />
              </div>
              <button
                type="button"
                onClick={() => navigate("/login-phone")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Phone className="h-4 w-4" />
                Sign in with phone
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-center text-sm text-slate-500">New to BMP.tn?</p>
              <Link
                to="/register"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4" />
                Create your BMP account
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              By continuing, you agree to BMP.tn account access policies and secure authentication rules.
            </p>
          </div>
        </div>
      </main>

      <Footer compact />
    </div>
  );
}

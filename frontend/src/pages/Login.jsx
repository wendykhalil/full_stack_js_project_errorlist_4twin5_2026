import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";
import AuthShowcasePanel from "../components/AuthShowcasePanel";

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
      if (window.innerWidth < 640) setGoogleWidth(220);
      else if (window.innerWidth < 1024) setGoogleWidth(250);
      else setGoogleWidth(280);
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 lg:min-h-[calc(100vh-12rem)] lg:max-h-[760px] lg:grid-cols-[0.96fr,1.04fr]">
          <section className="relative flex flex-col bg-white px-5 py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-7">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 shadow-sm">
                  <img src={logo} alt="BMP.tn logo" className="h-10 w-10" />
                </div>
                <p className="text-2xl font-semibold tracking-tight text-indigo-700">BMP.tn</p>
                <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-[1.75rem]">Sign in to your account</h1>
                <p className="mt-2 text-sm leading-5 text-slate-500">Use your approved credentials to access the BMP.tn workspace.</p>
              </div>

              {info && <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{info}</div>}

              <form onSubmit={onSubmit} noValidate className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Username or email</label>
                  <input value={emailOrPhone} onChange={(e) => { setEmailOrPhone(e.target.value); setError(""); }} type="text" autoComplete="username" placeholder="Enter your email or phone" className="w-full rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" required />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Password</label>
                    <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm font-medium text-indigo-700 transition hover:text-indigo-800">Forgot password?</button>
                  </div>
                  <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" required />
                </div>

                {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

                {showResend && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>Your email address may still need verification.</span>
                      <button type="button" onClick={resendVerification} disabled={resendState.loading} className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-60">
                        {resendState.loading ? "Sending..." : "Resend verification"}
                      </button>
                    </div>
                    {resendState.message && <div className="mt-2 text-sm">{resendState.message}</div>}
                  </div>
                )}

                <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                  {loading ? "Loading..." : "Login"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="my-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-indigo-100" />
                <span className="text-xs font-semibold text-indigo-400">or sign in with</span>
                <div className="h-px flex-1 bg-indigo-100" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-center rounded-xl border border-indigo-100 bg-white px-3 py-2.5 sm:col-span-2 min-h-[52px]">
                  <div ref={googleBtnRef} />
                </div>
                <button type="button" onClick={() => navigate("/login-phone")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:col-span-2">
                  <Phone className="h-4 w-4" />
                  Sign in with phone
                </button>
              </div>
            </div>
          </section>

          <AuthShowcasePanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}

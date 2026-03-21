import React, { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, ChevronDown, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import { roleToBasePath } from "../auth/role";
import logo from "../assets/bmp-logo.svg";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";

const COUNTRY_CODES = [
  { code: "+216", label: "Tunisia" },
  { code: "+213", label: "Algeria" },
  { code: "+212", label: "Morocco" },
  { code: "+218", label: "Libya" },
  { code: "+20", label: "Egypt" },
  { code: "+33", label: "France" },
  { code: "+32", label: "Belgium" },
  { code: "+49", label: "Germany" },
  { code: "+39", label: "Italy" },
  { code: "+34", label: "Spain" },
  { code: "+44", label: "United Kingdom" },
  { code: "+1", label: "United States / Canada" },
  { code: "+971", label: "United Arab Emirates" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+974", label: "Qatar" },
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),_transparent_25%)]" />

        <div className="relative z-10 w-full max-w-[34rem]">
          <div className="mb-4 text-center">
            <img src={logo} alt="BMP.tn logo" className="mx-auto h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm ring-1 ring-blue-100" />
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Phone sign in</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use your account phone number to receive a secure one-time verification code.</p>
          </div>

          <section className="rounded-[1.9rem] border border-slate-200 bg-white px-5 py-5 shadow-2xl shadow-slate-200/70 sm:px-7 sm:py-6">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {msg && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

            {step === "PHONE" ? (
              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone number</label>
                  <div className="grid gap-3 sm:grid-cols-[190px,1fr]">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        {COUNTRY_CODES.map((item) => (
                          <option key={`${item.code}-${item.label}`} value={item.code}>{item.label} ({item.code})</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <input
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value);
                        setError("");
                      }}
                      placeholder="22 345 678"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Full number: <span className="font-semibold text-slate-900">{normalizedPhone}</span></div>
                </div>

                <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
                  {loading ? "Sending..." : "Send code"}
                  <PhoneCall className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Verification code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Verification number: <span className="font-semibold text-slate-900">{normalizedPhone}</span></div>
                </div>

                <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
                  {loading ? "Verifying..." : "Verify"}
                  <BadgeCheck className="h-4 w-4" />
                </button>

                <button type="button" onClick={() => setStep("PHONE")} className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-base font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">Edit phone number</button>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}

import React, { useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { roleToBasePath } from "../auth/role";

export default function PhoneLogin() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [step, setStep] = useState("PHONE"); // PHONE | CODE
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/phone/start", { method: "POST", body: { phone: phone.trim() } });
      setMsg(res.message || "SMS sent");
      setStep("CODE");
    } catch (err) {
      setError(err.message || "Failed to send SMS");
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
      const res = await apiFetch("/auth/phone/verify", { method: "POST", body: { phone: phone.trim(), code: code.trim() } });

      // Persist token/user in AuthContext (and localStorage) immediately
      setSession(res.token, res.user);

      // force refresh context (simple way: reload)
      if (res.needsRole) {
        navigate("/register-role", { replace: true, state: { from: 'sms' } });
        return;
      }

      navigate(roleToBasePath(res.user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">Login by SMS</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Enter your phone and confirm the code.</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 text-rose-700 px-4 py-3 text-sm border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
            {error}
          </div>
        )}
        {msg && (
          <div className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200">
            {msg}
          </div>
        )}

        {step === "PHONE" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                This works only if the phone already exists in the database.
              </p>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 text-white px-4 py-3 font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send code"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/40"
            >
              Back to email login
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">SMS code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Phone: <span className="font-medium">{phone}</span>
              </p>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 text-white px-4 py-3 font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Verifying..." : "Verify & login"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/40"
            >
              Change phone
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

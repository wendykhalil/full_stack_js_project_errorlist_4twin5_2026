import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../auth/api";
import { Roles, roleToBasePath } from "../auth/role";
import { useAuth } from "../auth/AuthContext";
import { UserCheck } from "lucide-react";

const roles = [
  { key: Roles.ARTISAN, label: "Artisan", desc: "Projects, quotes, invoices..." },
  { key: Roles.PRESCRIPTEUR, label: "Prescripteur", desc: "Browse products & artisans" },
  { key: Roles.SUPPLIER, label: "Fournisseur", desc: "Manage products & sales" },
];

export default function RegisterRoleSms() {
  const navigate = useNavigate();
  const { token, setSession } = useAuth();
  const [selected, setSelected] = useState(Roles.PRESCRIPTEUR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/set-role", { method: "POST", token, body: { role: selected } });
      setSession(res.token, res.user);
      navigate(roleToBasePath(res.user.role), { replace: true });
    } catch (e) {
      setError(e.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 dark:bg-slate-900">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">Choose your role</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">One-time setup after SMS login.</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 text-rose-700 px-4 py-3 text-sm border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelected(r.key)}
              className={[
                "text-left rounded-2xl border px-4 py-4 transition",
                selected === r.key
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-600"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40",
              ].join(" ")}
            >
              <div className="font-semibold text-slate-900 dark:text-white">{r.label}</div>
              <div className="text-xs text-slate-500 mt-1 dark:text-slate-400">{r.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            disabled={loading}
            onClick={submit}
            className="flex-1 rounded-xl bg-indigo-600 text-white px-4 py-3 font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/40"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

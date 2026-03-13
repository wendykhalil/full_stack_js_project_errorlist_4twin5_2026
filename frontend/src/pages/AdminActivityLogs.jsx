import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { Activity, RefreshCw, Search, Filter, Info, X, MonitorSmartphone, Globe2, UserCircle2, ShieldCheck } from "lucide-react";
import Footer from "../components/Footer";

function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return String(dt || ""); }
}

function badge(action) {
  const map = {
    PROFILE_UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
    PASSWORD_CHANGE: "bg-amber-50 text-amber-800 border-amber-200",
    LOGIN_SMS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    LOGIN_GOOGLE: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SET_ROLE: "bg-purple-50 text-purple-700 border-purple-200",
    LOGOUT: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return map[action] || "bg-slate-50 text-slate-700 border-slate-200";
}

function actionLabel(action) {
  const labels = {
    PROFILE_UPDATE: "Profile update",
    PASSWORD_CHANGE: "Password change",
    LOGIN_SMS: "Phone sign in",
    LOGIN_GOOGLE: "Google sign in",
    SET_ROLE: "Role assignment",
    LOGOUT: "Logout",
  };
  return labels[action] || action;
}

function detailEntries(it) {
  const d = it.details || {};
  switch (it.action) {
    case "PROFILE_UPDATE":
      return Object.entries(d).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
    case "LOGIN_SMS":
      return [["Phone", d.phone || it.user?.phone || "—"]];
    case "SET_ROLE":
      return [["Role", d.role || "—"]];
    case "PASSWORD_CHANGE":
      return [["Status", "Password updated"]];
    case "LOGOUT":
      return [["Status", "User signed out"]];
    default:
      return [];
  }
}

function RawViewModal({ item, onClose }) {
  if (!item) return null;
  const entries = detailEntries(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Activity details
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">{actionLabel(item.action)}</h2>
            <p className="mt-1 text-sm text-slate-500">Structured administrative view for audit information.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr,1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><UserCircle2 className="h-4 w-4 text-indigo-600" /> User information</div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="w-40 bg-slate-50 px-4 py-3 font-medium text-slate-600">Name</td><td className="px-4 py-3 text-slate-900">{item.user ? `${item.user.firstName} ${item.user.lastName}` : "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Email</td><td className="px-4 py-3 text-slate-900">{item.user?.email || "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Phone</td><td className="px-4 py-3 text-slate-900">{item.user?.phone || "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Role</td><td className="px-4 py-3 text-slate-900">{item.user?.role || "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Internal ID</td><td className="px-4 py-3 text-slate-500">Hidden</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Globe2 className="h-4 w-4 text-indigo-600" /> Session metadata</div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="w-40 bg-slate-50 px-4 py-3 font-medium text-slate-600">Date</td><td className="px-4 py-3 text-slate-900">{fmt(item.createdAt)}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">IP address</td><td className="px-4 py-3 text-slate-900">{item.ip || "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Country</td><td className="px-4 py-3 text-slate-900">{item.country || "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Country code</td><td className="px-4 py-3 text-slate-900">{item.countryCode || "—"}</td></tr>
                  <tr><td className="bg-slate-50 px-4 py-3 font-medium text-slate-600">Action</td><td className="px-4 py-3 text-slate-900">{actionLabel(item.action)}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Info className="h-4 w-4 text-indigo-600" /> Action details</div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Field</th>
                    <th className="px-4 py-3 text-left font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {entries.length ? entries.map(([key, value]) => (
                    <tr key={key}>
                      <td className="px-4 py-3 font-medium text-slate-600">{key}</td>
                      <td className="px-4 py-3 text-slate-900">{String(value)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-5 text-center text-slate-500">No additional details for this activity.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><MonitorSmartphone className="h-4 w-4 text-indigo-600" /> User agent</div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">{item.userAgent || "—"}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminActivityLogs() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ page: 1, limit: 50, total: 0, items: [] });
  const [q, setQ] = useState("");
  const [action, setAction] = useState("ALL");
  const [open, setOpen] = useState(null);

  const pages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / (data.limit || 50))), [data.total, data.limit]);

  async function load(page = data.page) {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/admin/activity-logs?page=${page}&limit=${data.limit}`, { token });
      setData(res);
    } catch (e) {
      setError(e.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  const filtered = useMemo(() => {
    const items = data.items || [];
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      if (action !== "ALL" && it.action !== action) return false;
      if (!qq) return true;
      const name = `${it.user?.firstName || ""} ${it.user?.lastName || ""}`.toLowerCase();
      const email = String(it.user?.email || "").toLowerCase();
      const phone = String(it.user?.phone || "").toLowerCase();
      const det = JSON.stringify(it.details || {}).toLowerCase();
      return name.includes(qq) || email.includes(qq) || phone.includes(qq) || String(it.action).toLowerCase().includes(qq) || det.includes(qq);
    });
  }, [data.items, q, action]);

  return (
    <>
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">Activity logs</h1>
            </div>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">Administrative history for profile updates, access events, role changes and account actions.</p>
          </div>

          <button onClick={() => load(data.page)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, action or details..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <option value="ALL">All actions</option>
                  <option value="PROFILE_UPDATE">Profile updates</option>
                  <option value="PASSWORD_CHANGE">Password changes</option>
                  <option value="LOGIN_SMS">Phone sign in</option>
                  <option value="LOGIN_GOOGLE">Google sign in</option>
                  <option value="SET_ROLE">Role assignment</option>
                  <option value="LOGOUT">Logout</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500">Showing <b>{filtered.length}</b> of <b>{(data.items || []).length}</b> on this page</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((it) => (
                  <tr key={it._id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">{fmt(it.createdAt)}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div className="font-medium">{it.user ? `${it.user.firstName} ${it.user.lastName}` : "—"}</div>
                      <div className="text-xs text-slate-500">{it.user?.email || it.user?.phone || ""}</div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge(it.action)}`}>{actionLabel(it.action)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {detailEntries(it).slice(0, 2).map(([key, value]) => (
                          <span key={key} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"><b className="mr-1">{key}:</b>{String(value)}</span>
                        ))}
                        {!detailEntries(it).length && <span className="text-xs text-slate-500">No additional details</span>}
                      </div>
                      <button type="button" onClick={() => setOpen(it)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        <Info className="h-3.5 w-3.5" /> View details
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <div><b>IP:</b> {it.ip || "—"}</div>
                      <div><b>Country:</b> {it.country || "—"}</div>
                      <div className="max-w-[360px] truncate" title={it.userAgent || ""}><b>Agent:</b> {it.userAgent || "—"}</div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No activity yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">Page <b>{data.page}</b> of <b>{pages}</b></div>
            <div className="flex items-center gap-2">
              <button disabled={data.page <= 1 || loading} onClick={() => load(data.page - 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Previous</button>
              <button disabled={data.page >= pages || loading} onClick={() => load(data.page + 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      <RawViewModal item={open} onClose={() => setOpen(null)} />
      <Footer />
    </>
  );
}

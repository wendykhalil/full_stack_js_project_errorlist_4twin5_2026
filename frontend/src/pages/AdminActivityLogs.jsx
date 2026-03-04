import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { Activity, RefreshCw, Search, Filter, Info } from "lucide-react";
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

function renderDetails(it) {
  const d = it.details || {};
  switch (it.action) {
    case 'PROFILE_UPDATE': {
      const entries = Object.entries(d).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');
      if (!entries.length) return <span className="text-slate-500">—</span>;
      return (
        <div className="flex flex-wrap gap-2">
          {entries.map(([k, v]) => (
            <span key={k} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
              <b className="mr-1">{k}:</b>{String(v)}
            </span>
          ))}
        </div>
      );
    }
    case 'LOGIN_SMS':
      return <span className="text-xs text-slate-700"><b>phone:</b> {d.phone || it.user?.phone || '—'}</span>;
    case 'SET_ROLE':
      return <span className="text-xs text-slate-700"><b>role:</b> {d.role || '—'}</span>;
    case 'PASSWORD_CHANGE':
      return <span className="text-xs text-slate-600">Password changed</span>;
    case 'LOGOUT':
      return <span className="text-xs text-slate-600">User logged out</span>;
    default:
      return <span className="text-xs text-slate-600">—</span>;
  }
}

export default function AdminActivityLogs() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ page: 1, limit: 50, total: 0, items: [] });
  const [q, setQ] = useState("");
  const [action, setAction] = useState("ALL");
  const [open, setOpen] = useState(null);

  const pages = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 50)));
    return totalPages;
  }, [data.total, data.limit]);

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

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const items = data.items || [];
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      if (action !== 'ALL' && it.action !== action) return false;
      if (!qq) return true;
      const name = `${it.user?.firstName || ''} ${it.user?.lastName || ''}`.toLowerCase();
      const email = String(it.user?.email || '').toLowerCase();
      const phone = String(it.user?.phone || '').toLowerCase();
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
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-4xl">
                Activity logs
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Profile updates, password changes, SMS logins, logout, role changes...
            </p>
          </div>

          <button
            onClick={() => load(data.page)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search user / action / details..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="ALL">All actions</option>
                  <option value="PROFILE_UPDATE">PROFILE_UPDATE</option>
                  <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
                  <option value="LOGIN_SMS">LOGIN_SMS</option>
                  <option value="LOGIN_GOOGLE">LOGIN_GOOGLE</option>
                  <option value="SET_ROLE">SET_ROLE</option>
                  <option value="LOGOUT">LOGOUT</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing <b>{filtered.length}</b> of <b>{(data.items || []).length}</b> on this page
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filtered || []).map((it) => (
                  <tr key={it._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{fmt(it.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="font-medium">
                        {it.user ? `${it.user.firstName} ${it.user.lastName}` : "—"}
                      </div>
                      <div className="text-xs text-slate-500">{it.user?.email || it.user?.phone || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge(it.action)}`}>
                        {it.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {renderDetails(it)}
                      <button
                        type="button"
                        onClick={() => setOpen(it)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <Info className="h-3.5 w-3.5" /> View raw
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div><b>IP:</b> {it.ip || '—'}</div>
                      <div><b>Country:</b> {it.country || '—'}</div>
                      <div className="max-w-[360px] truncate" title={it.userAgent || ''}><b>UA:</b> {it.userAgent || '—'}</div>
                    </td>
                  </tr>
                ))}

                {!loading && (filtered || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      No activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Page <b>{data.page}</b> / {pages} • Total: <b>{data.total}</b>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={data.page <= 1 || loading}
                onClick={() => load(data.page - 1)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={data.page >= pages || loading}
                onClick={() => load(data.page + 1)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Raw details modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl border border-slate-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{open.action}</div>
                  <div className="text-xs text-slate-500">{fmt(open.createdAt)} • {open.user?.email || open.user?.phone || '—'}</div>
                </div>
                <button onClick={() => setOpen(null)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
              </div>
              <div className="p-6">
                <pre className="whitespace-pre-wrap break-words rounded-2xl bg-slate-900 text-slate-100 p-4 text-xs overflow-auto max-h-[60vh]">
{JSON.stringify({
  id: open._id,
  createdAt: open.createdAt,
  action: open.action,
  user: open.user,
  details: open.details,
  ip: open.ip,
  country: open.country,
  countryCode: open.countryCode,
  userAgent: open.userAgent,
}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

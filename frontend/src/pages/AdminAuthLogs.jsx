import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { History, RefreshCw } from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt || "");
  }
}

export default function AdminAuthLogs() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ page: 1, limit: 50, total: 0, items: [] });

  const pages = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 50)));
    return totalPages;
  }, [data.total, data.limit]);

  async function load(page = data.page) {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/admin/auth-logs?page=${page}&limit=${data.limit}`, { token });
      setData(res);
    } catch (e) {
      setError(e.message || t('adminLogs.loadError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-semibold text-slate-900">{t('adminLogs.title')}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {t('adminLogs.subtitle')}
          </p>
        </div>

        <button
          onClick={() => load(data.page)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t('adminLogs.refreshButton')}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('adminLogs.table.date')}</th>
                <th className="px-4 py-3 font-semibold">{t('adminLogs.table.user')}</th>
                <th className="px-4 py-3 font-semibold">{t('adminLogs.table.role')}</th>
                <th className="px-4 py-3 font-semibold">{t('adminLogs.table.action')}</th>
                <th className="px-4 py-3 font-semibold">{t('adminLogs.table.ip')}</th>
                <th className="px-4 py-3 font-semibold">{t('adminLogs.table.userAgent')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    {t('adminLogs.loading')}
                  </td>
                </tr>
              ) : data.items?.length ? (
                data.items.map((it) => (
                  <tr key={it._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{fmt(it.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-900">
                      <div className="font-medium">
                        {[it.user?.firstName, it.user?.lastName].filter(Boolean).join(" ") || "—"}
                      </div>
                      <div className="text-xs text-slate-500">{it.user?.email || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{it.user?.role || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          it.action === "LOGIN"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {it.action === "LOGIN" ? t('adminLogs.action.login') : t('adminLogs.action.logout')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{it.ip || "—"}</td>
                    <td className="px-4 py-3 max-w-[360px] truncate text-slate-500" title={it.userAgent || ""}>
                      {it.userAgent || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    {t('adminLogs.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <div className="text-xs text-slate-500">
            {t('adminLogs.totalLabel')} <span className="font-semibold text-slate-700">{data.total || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={loading || data.page <= 1}
              onClick={() => load(Math.max(1, data.page - 1))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              {t('adminLogs.previous')}
            </button>
            <div className="text-xs text-slate-600">
              {t('adminLogs.pageLabel')} <span className="font-semibold">{data.page}</span> / {pages}
            </div>
            <button
              disabled={loading || data.page >= pages}
              onClick={() => load(Math.min(pages, data.page + 1))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              {t('adminLogs.next')}
            </button>
          </div>
        </div>
      </div>
      <SimpleFooter />
    </div>
  );
}
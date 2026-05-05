import React, { useEffect, useMemo, useState, useCallback } from "react";
import ReadCardButton from '../components/ReadCardButton';
import { Search, ChevronDown, Loader2, ShieldOff, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { setUserSubscription } from '../auth/api';
import { useTranslation } from '../i18n';
import { Hint } from "../components/MouseTooltip";

// Les constantes de durée restent inchangées
const DURATIONS = [
  { value: "1h", labelKey: "1h" },
  { value: "3h", labelKey: "3h" },
  { value: "1d", labelKey: "1d" },
  { value: "3d", labelKey: "3d" },
  { value: "1w", labelKey: "1w" },
  { value: "1m", labelKey: "1m" },
];

const TONE = {
  slate:  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  green:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  red:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const Pill = ({ children, tone = "slate" }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${TONE[tone] ?? TONE.slate}`}>
    {children}
  </span>
);

function formatDate(iso) {
  if (!iso) return "â€”";
  return new Date(iso).toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatBlockedUntil(iso) {
  if (!iso) return "â€”";
  return new Date(iso).toLocaleString("fr-TN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function BlockModal({ user, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  const [duration, setDuration] = useState("1d");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 dark:border dark:border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 text-lg dark:text-white">{t('adminUsers.blockModal.title')}</h2>
            <p className="text-sm text-slate-500 mt-0.5 dark:text-slate-400" data-no-translate>{user.firstName} {user.lastName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">{t('adminUsers.blockModal.durationLabel')}</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                duration === d.value
                  ? "border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/40 dark:text-red-400"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700/50"
              }`}
            >
              {t(`adminUsers.blockModal.durations.${d.labelKey}`)}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {t('adminUsers.blockModal.cancelButton')}
          </button>
          <button
            onClick={() => onConfirm(duration)}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
            {t('adminUsers.blockModal.blockButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Use useCallback to memoize the fetchUsers function
  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/users?limit=200", { headers: authHeader })
      .then((r) => { if (!r.ok) throw new Error(`Erreur ${r.status}`); return r.json(); })
      .then((d) => { setUsers(d.users ?? []); setTotal(d.total ?? 0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authHeader]);

  // Now useEffect has fetchUsers as a dependency
  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers]);

  async function handleBlock(duration) {
    setBlockLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${blockTarget._id}/block`, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });
      if (!r.ok) throw new Error(`Erreur ${r.status}`);
      const data = await r.json();
      setUsers((prev) => prev.map((u) => u._id === data.user._id ? { ...u, ...data.user } : u));
      setBlockTarget(null);
    } catch (e) { alert(e.message); }
    finally { setBlockLoading(false); }
  }

  async function handleUnblock(userId) {
    try {
      const r = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: "PATCH",
        headers: authHeader,
      });
      if (!r.ok) throw new Error(`Erreur ${r.status}`);
      const data = await r.json();
      setUsers((prev) => prev.map((u) => u._id === data.user._id ? { ...u, ...data.user } : u));
    } catch (e) {
      alert(e.message);
    }
  }

  const [subLoading, setSubLoading] = useState(null);

  async function handleSubscriptionChange(user) {
    if (user.role !== 'ARTISAN') {
      alert('Abonnement applicable seulement aux artisans');
      return;
    }

    setSubLoading(user._id);
    try {
      const target = user.subscriptionStatus === 'ACTIVE' ? { plan: 'FREE', status: 'CANCELED' } : { plan: 'PRO', status: 'ACTIVE' };
      await setUserSubscription({ token, userId: user._id, ...target });
      await fetchUsers();
      alert(`Abonnement mis à jour pour ${user.firstName} ${user.lastName}`);
    } catch (e) {
      console.error('Erreur mise à jour abonnement', e);
      alert(e.message);
    } finally {
      setSubLoading(null);
    }
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchQ = !query || name.includes(query) || (u.email ?? "").toLowerCase().includes(query) || (u.phone ?? "").includes(query);
      const matchR = roleFilter === "ALL" || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [q, roleFilter, users]);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900">
      {blockTarget && (
        <BlockModal
          user={blockTarget}
          onClose={() => setBlockTarget(null)}
          onConfirm={handleBlock}
          loading={blockLoading}
        />
      )}

      {/* Full width container with responsive padding */}
      <div className="w-full h-full px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 py-4 sm:py-6 md:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {t('adminUsers.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('adminUsers.totalUsers', { count: total })}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row">
          <Hint text="Rechercher par nom, email ou téléphone">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('adminUsers.searchPlaceholder')}
              className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-white py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          </Hint>
          <Hint text="Filtrer les utilisateurs par rôle">
          <div className="relative w-full sm:w-56 md:w-64 lg:w-72">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full appearance-none rounded-lg sm:rounded-xl border border-slate-200 bg-white py-2.5 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">{t('adminUsers.roleFilter.all')}</option>
              <option value="ARTISAN">{t('adminUsers.roles.artisan')}</option>
              <option value="PRESCRIPTEUR">{t('adminUsers.roles.prescripteur')}</option>
              <option value="SUPPLIER">{t('adminUsers.roles.supplier')}</option>
              <option value="ADMIN">{t('adminUsers.roles.admin')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          </Hint>
        </div>

        {/* Table Card - Full width with responsive table layout */}
        <div className="rounded-lg sm:rounded-xl lg:rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 w-full overflow-hidden">
          {/* Table Header with count */}
          <div className="border-b border-slate-100 px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('adminUsers.tableTitle')}
              <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                {t('adminUsers.displayedCount', { count: filtered.length })}
              </span>
            </span>
            <ReadCardButton text={`${t('adminUsers.tableTitle')} - ${filtered.length} utilisateurs`} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12 sm:py-16 md:py-20 text-slate-400 dark:text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> 
              <span className="text-xs sm:text-sm">{t('adminUsers.loading')}</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="py-12 sm:py-16 text-center text-red-500 font-medium dark:text-red-400 text-xs sm:text-sm">{error}</div>
          )}

          {/* Table - Responsive with breakpoint at 1267px */}
          {!loading && !error && (
            <>
              {/* Mobile/Tablet view - Stacked cards (below 1267px) */}
              <div className="block 2xl:hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((u) => {
                    const isBlocked = u.status === "BLOCKED";
                    const isAdmin = u.role === "ADMIN";
                    return (
                      <div key={u._id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-slate-800 dark:text-white" data-no-translate>
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{u.email}</div>
                          </div>
                          <Pill>{t(`adminUsers.roles.${u.role?.toLowerCase()}`)}</Pill>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Téléphone:</span>
                            <span className="ml-1 text-slate-700 dark:text-slate-300">{u.phone || "â€”"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Abonnement:</span>
                            <span className="ml-1">
                              <Pill tone={u.subscriptionStatus === 'ACTIVE' ? 'green' : 'slate'}>
                                {u.subscriptionPlan || 'FREE'} / {u.subscriptionStatus || 'INACTIVE'}
                              </Pill>
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Statut:</span>
                            <span className="ml-1">
                              <Pill tone={u.status === "ACTIVE" ? "green" : u.status === "INACTIVE" ? "slate" : "red"}>
                                {t(`adminUsers.status.${u.status?.toLowerCase()}`)}
                              </Pill>
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Vérifié:</span>
                            <span className="ml-1">
                              <Pill tone={u.emailVerified ? "green" : "orange"}>
                                {u.emailVerified ? t('adminUsers.emailVerified.verified') : t('adminUsers.emailVerified.pending')}
                              </Pill>
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Inscrit:</span>
                            <span className="ml-1 text-slate-700 dark:text-slate-300">{formatDate(u.createdAt)}</span>
                          </div>
                          {isBlocked && u.blockedUntil && (
                            <div className="col-span-2">
                              <span className="text-slate-500 dark:text-slate-400">Bloqué jusqu'à:</span>
                              <span className="ml-1 text-slate-700 dark:text-slate-300">{formatBlockedUntil(u.blockedUntil)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {isAdmin ? (
                            <span className="text-xs text-slate-300 dark:text-slate-600">Admin - actions désactivées</span>
                          ) : (
                            <>
                              {isBlocked ? (
                                <Hint text="Rétablir l'accès de cet utilisateur">
                                <button
                                  onClick={() => handleUnblock(u._id)}
                                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  {t('adminUsers.actions.unblock')}
                                </button>
                                </Hint>
                              ) : (
                                <Hint text="Bloquer temporairement l'accès de cet utilisateur">
                                <button
                                  onClick={() => setBlockTarget(u)}
                                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors dark:border-red-800 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                                >
                                  <ShieldOff className="h-3.5 w-3.5" />
                                  {t('adminUsers.actions.block')}
                                </button>
                                </Hint>
                              )}
                              <Hint text="Activer ou modifier l'abonnement de cet utilisateur">
                              <button
                                onClick={() => handleSubscriptionChange(u)}
                                disabled={subLoading === u._id}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                              >
                                {subLoading === u._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : u.subscriptionStatus === 'ACTIVE' ? (
                                  'Désactiver'
                                ) : (
                                  'Activer abonnement'
                                )}
                              </button>
                              </Hint>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                      {t('adminUsers.noUsersFound')}
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop view - Normal table for 1267px and above */}
              <div className="hidden 2xl:block overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-700/50 dark:text-slate-400">
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.name')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.email')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.phone')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.role')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">Abonnement</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.status')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.blockedUntil')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.emailVerified')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('adminUsers.table.registered')}</th>
                      <th className="px-4 py-3 whitespace-nowrap w-36">{t('adminUsers.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, index) => {
                      const isBlocked = u.status === "BLOCKED";
                      const isAdmin = u.role === "ADMIN";
                      return (
                        <tr 
                          key={u._id} 
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-700/50 ${
                            index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap dark:text-white text-sm">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap dark:text-slate-300 text-sm">
                            {u.email}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap dark:text-slate-300 text-sm">
                            {u.phone || "â€”"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Pill>{t(`adminUsers.roles.${u.role?.toLowerCase()}`)}</Pill>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Pill tone={u.subscriptionStatus === 'ACTIVE' ? 'green' : 'slate'}>
                              {u.subscriptionPlan || 'FREE'} / {u.subscriptionStatus || 'INACTIVE'}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Pill tone={u.status === "ACTIVE" ? "green" : u.status === "INACTIVE" ? "slate" : "red"}>
                              {t(`adminUsers.status.${u.status?.toLowerCase()}`)}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap dark:text-slate-400">
                            {isBlocked && u.blockedUntil ? formatBlockedUntil(u.blockedUntil) : "â€”"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Pill tone={u.emailVerified ? "green" : "orange"}>
                              {u.emailVerified ? t('adminUsers.emailVerified.verified') : t('adminUsers.emailVerified.pending')}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap dark:text-slate-400 text-xs">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isAdmin ? (
                              <span className="text-xs text-slate-300 dark:text-slate-600">â€”</span>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {isBlocked ? (
                                  <Hint text="Rétablir l'accès de cet utilisateur">
                                  <button
                                    onClick={() => handleUnblock(u._id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {t('adminUsers.actions.unblock')}
                                  </button>
                                  </Hint>
                                ) : (
                                  <Hint text="Bloquer temporairement l'accès de cet utilisateur">
                                  <button
                                    onClick={() => setBlockTarget(u)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors dark:border-red-800 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                                  >
                                    <ShieldOff className="h-3.5 w-3.5" />
                                    {t('adminUsers.actions.block')}
                                  </button>
                                  </Hint>
                                )}

                                <Hint text="Activer ou modifier l'abonnement de cet utilisateur">
                                <button
                                  onClick={() => handleSubscriptionChange(u)}
                                  disabled={subLoading === u._id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                                >
                                  {subLoading === u._id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : u.subscriptionStatus === 'ACTIVE' ? (
                                    'Désactiver abonnement'
                                  ) : (
                                    'Activer abonnement'
                                  )}
                                </button>
                                </Hint>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                          {t('adminUsers.noUsersFound')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



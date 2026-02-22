import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Loader2, ShieldOff, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const ROLE_LABELS = {
  ARTISAN: "Artisan", PRESCRIPTEUR: "Prescripteur",
  SUPPLIER: "Supplier", ADMIN: "Admin",
};

const STATUS_META = {
  ACTIVE:   { label: "Actif",   tone: "green" },
  INACTIVE: { label: "Inactif", tone: "slate" },
  BLOCKED:  { label: "Bloqué",  tone: "red"   },
};

const TONE = {
  slate:  "bg-slate-100 text-slate-700",
  green:  "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  red:    "bg-red-100 text-red-700",
};

const DURATIONS = [
  { value: "1h", label: "1 heure"   },
  { value: "3h", label: "3 heures"  },
  { value: "1d", label: "1 jour"    },
  { value: "3d", label: "3 jours"   },
  { value: "1w", label: "1 semaine" },
  { value: "1m", label: "1 mois"    },
];

const Pill = ({ children, tone = "slate" }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone] ?? TONE.slate}`}>
    {children}
  </span>
);

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatBlockedUntil(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-TN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function BlockModal({ user, onClose, onConfirm, loading }) {
  const [duration, setDuration] = useState("1d");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">Bloquer l'utilisateur</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user.firstName} {user.lastName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-2">Durée du blocage</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                duration === d.value
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(duration)}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
            Bloquer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { token } = useAuth();
  const [users,        setUsers]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [q,            setQ]            = useState("");
  const [roleFilter,   setRoleFilter]   = useState("ALL");
  const [blockTarget,  setBlockTarget]  = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  function fetchUsers() {
    setLoading(true);
    setError(null);
    fetch("/api/admin/users?limit=200", { headers: authHeader })
      .then((r) => { if (!r.ok) throw new Error(`Erreur ${r.status}`); return r.json(); })
      .then((d)  => { setUsers(d.users ?? []); setTotal(d.total ?? 0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []);

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
    } catch (e) { alert(e.message); }
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      {blockTarget && (
        <BlockModal
          user={blockTarget}
          onClose={() => setBlockTarget(null)}
          onConfirm={handleBlock}
          loading={blockLoading}
        />
      )}

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-500">{total} utilisateur{total !== 1 ? "s" : ""} au total</p>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone…"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="relative w-full sm:w-52">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="ARTISAN">Artisan</option>
              <option value="PRESCRIPTEUR">Prescripteur</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* ✅ No overflow-hidden on the card — fixes button clipping */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <span className="font-semibold text-slate-700">
              Utilisateurs
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({filtered.length} affiché{filtered.length !== 1 ? "s" : ""})
              </span>
            </span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
            </div>
          )}
          {!loading && error && (
            <div className="py-16 text-center text-red-500 font-medium">{error}</div>
          )}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 whitespace-nowrap">Nom</th>
                    <th className="px-5 py-3 whitespace-nowrap">Email</th>
                    <th className="px-5 py-3 whitespace-nowrap">Téléphone</th>
                    <th className="px-5 py-3 whitespace-nowrap">Rôle</th>
                    <th className="px-5 py-3 whitespace-nowrap">Statut</th>
                    <th className="px-5 py-3 whitespace-nowrap">Bloqué jusqu'au</th>
                    <th className="px-5 py-3 whitespace-nowrap">Email vérifié</th>
                    <th className="px-5 py-3 whitespace-nowrap">Inscription</th>
                    <th className="px-5 py-3 whitespace-nowrap w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const sm        = STATUS_META[u.status] ?? { label: u.status, tone: "slate" };
                    const isBlocked = u.status === "BLOCKED";
                    const isAdmin   = u.role === "ADMIN";
                    return (
                      <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{u.email}</td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{u.phone || "—"}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap"><Pill>{ROLE_LABELS[u.role] ?? u.role}</Pill></td>
                        <td className="px-5 py-3.5 whitespace-nowrap"><Pill tone={sm.tone}>{sm.label}</Pill></td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                          {isBlocked && u.blockedUntil ? formatBlockedUntil(u.blockedUntil) : "—"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <Pill tone={u.emailVerified ? "green" : "orange"}>
                            {u.emailVerified ? "Vérifié" : "En attente"}
                          </Pill>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap w-36">
                          {isAdmin ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : isBlocked ? (
                            <button
                              onClick={() => handleUnblock(u._id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                              Débloquer
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockTarget(u)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                            >
                              <ShieldOff className="h-3.5 w-3.5 shrink-0" />
                              Bloquer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">Aucun utilisateur trouvé.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
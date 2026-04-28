import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../auth/api";
import {
  ShoppingCart, CreditCard, Receipt, TrendingUp,
  Search, ChevronDown, Download
} from "lucide-react";
import { Hint } from "../components/MouseTooltip";
import ReadCardButton from '../components/ReadCardButton';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TYPE_META = {
  order:        { label: "Commande",    color: "bg-indigo-100 text-indigo-700" },
  subscription: { label: "Abonnement",  color: "bg-purple-100 text-purple-700" },
  invoice:      { label: "Facture",     color: "bg-emerald-100 text-emerald-700" },
};

const STATUS_META = {
  DELIVERED: { label: "Livré",     color: "bg-emerald-100 text-emerald-700" },
  PAID:      { label: "Payé",      color: "bg-emerald-100 text-emerald-700" },
  ACTIVE:    { label: "Actif",     color: "bg-emerald-100 text-emerald-700" },
  PENDING:   { label: "En attente",color: "bg-orange-100 text-orange-700" },
  SENT:      { label: "Envoyé",    color: "bg-blue-100 text-blue-700" },
  ACCEPTED:  { label: "Accepté",   color: "bg-blue-100 text-blue-700" },
  SHIPPED:   { label: "Expédié",   color: "bg-blue-100 text-blue-700" },
  REFUSED:   { label: "Refusé",    color: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Annulé",    color: "bg-red-100 text-red-600" },
  CANCELED:  { label: "Annulé",    color: "bg-red-100 text-red-600" },
  DRAFT:     { label: "Brouillon", color: "bg-slate-100 text-slate-500" },
  EXPIRED:   { label: "Expiré",    color: "bg-red-100 text-red-600" },
};

function StatCard({ icon, label, value, sub, color }) {
  const ref = useRef();
  return (
    <div ref={ref} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`inline-flex rounded-xl p-2.5 ${color}`}>{icon}</div>
        <ReadCardButton targetRef={ref} />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Pill({ status }) {
  const meta = STATUS_META[status] || { label: status, color: "bg-slate-100 text-slate-500" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>;
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || { label: type, color: "bg-slate-100 text-slate-500" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>;
}

export default function AdminTransactions() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    apiFetch("/admin/transactions", { token })
      .then(res => setData(res))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    if (!data?.transactions) return [];
    const qq = q.trim().toLowerCase();
    return data.transactions.filter(t => {
      const matchQ = !qq || [t.ref, t.user, t.description].join(" ").toLowerCase().includes(qq);
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchQ && matchType && matchStatus;
    });
  }, [data, q, typeFilter, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function exportCSV() {
    const rows = [
      ["Référence", "Type", "Utilisateur", "Description", "Montant", "Statut", "Date"],
      ...filtered.map(t => [
        t.ref, t.type, t.user, t.description,
        t.amount ? `${t.amount} TND` : "—",
        t.status, new Date(t.date).toLocaleDateString("fr-TN"),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Chargement…</div>;
  if (err) return <div className="py-20 text-center text-red-500">{err}</div>;

  const stats = data?.stats || {};

  return (
    <div className="mx-auto max-w-none space-y-7 p-5 sm:p-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1.5 text-base text-slate-500">Vue globale des flux financiers de la plateforme</p>
        </div>
        <Hint text="Télécharger toutes les transactions au format CSV">
        <button onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Exporter CSV
        </button>
        </Hint>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Hint text="Nombre total de commandes passées sur la plateforme">
        <StatCard icon={<ShoppingCart className="h-5 w-5 text-indigo-600" />}
          label="Commandes" value={stats.totalOrders || 0}
          sub={`${stats.deliveredOrders || 0} livrées`} color="bg-indigo-50" />
        </Hint>
        <Hint text="Revenus cumulés des commandes livrées">
        <StatCard icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          label="Revenu commandes" value={`${(stats.ordersRevenue || 0).toLocaleString()} TND`}
          sub="Commandes livrées" color="bg-emerald-50" />
        </Hint>
        <Hint text="Nombre d'abonnements actifs en ce moment">
        <StatCard icon={<CreditCard className="h-5 w-5 text-purple-600" />}
          label="Abonnements actifs" value={stats.activeSubscriptions || 0}
          sub={`${stats.totalSubscriptions || 0} au total`} color="bg-purple-50" />
        </Hint>
        <Hint text="Revenus cumulés des factures payées">
        <StatCard icon={<Receipt className="h-5 w-5 text-orange-600" />}
          label="Factures payées" value={`${(stats.invoicesRevenue || 0).toLocaleString()} TND`}
          sub={`${stats.paidInvoices || 0} factures`} color="bg-orange-50" />
        </Hint>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Hint text="Rechercher une transaction par référence ou utilisateur">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Rechercher par référence, utilisateur…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        </Hint>
        <Hint text="Filtrer par type : commande, abonnement ou facture">
        <div className="relative">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">Tous les types</option>
            <option value="order">Commandes</option>
            <option value="subscription">Abonnements</option>
            <option value="invoice">Factures</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        </Hint>
        <Hint text="Filtrer par statut de la transaction">
        <div className="relative">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">Tous les statuts</option>
            <option value="DELIVERED">Livré</option>
            <option value="PAID">Payé</option>
            <option value="ACTIVE">Actif</option>
            <option value="PENDING">En attente</option>
            <option value="REFUSED">Refusé</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        </Hint>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {filtered.length} transaction(s)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3.5 text-left">Référence</th>
                <th className="px-5 py-3.5 text-left">Type</th>
                <th className="px-5 py-3.5 text-left">Utilisateur</th>
                <th className="px-5 py-3.5 text-left">Description</th>
                <th className="px-5 py-3.5 text-right">Montant</th>
                <th className="px-5 py-3.5 text-left">Statut</th>
                <th className="px-5 py-3.5 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Aucune transaction trouvée</td></tr>
              ) : paginated.map(t => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{t.ref || "—"}</td>
                  <td className="px-5 py-4"><TypeBadge type={t.type} /></td>
                  <td className="px-5 py-4 text-slate-700">{t.user || "—"}</td>
                  <td className="px-5 py-4 text-slate-600 max-w-sm truncate">{t.description || "—"}</td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900">
                    {t.amount ? `${Number(t.amount).toLocaleString()} TND` : "—"}
                  </td>
                  <td className="px-5 py-4"><Pill status={t.status} /></td>
                  <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">Page {page} / {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                Précédent
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Ban, CheckCircle, Clock, Eye, Flag,
  Search, ShieldCheck, X, Filter, User, FileText,
  ChevronRight, Loader2, AlertCircle, TrendingUp
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../auth/api';
import { Hint } from '../components/MouseTooltip';

const STATUS = {
  PENDING:      { label: 'En attente',  color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500'   },
  UNDER_REVIEW: { label: 'En cours',    color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500'    },
  RESOLVED:     { label: 'Résolu',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED:     { label: 'Rejeté',      color: 'bg-slate-100 text-slate-600 border-slate-200',    dot: 'bg-slate-400'   },
};

const SEVERITY = {
  LOW:      { label: 'Faible',   color: 'bg-slate-100 text-slate-600'   },
  MEDIUM:   { label: 'Moyen',    color: 'bg-amber-100 text-amber-700'   },
  HIGH:     { label: 'Élevé',    color: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critique', color: 'bg-red-100 text-red-700'       },
};

const ACTIONS = [
  { value: 'REVIEW',  label: 'Mettre en revue',  icon: Clock,         color: 'border-blue-200 bg-blue-50 text-blue-700'     },
  { value: 'WARN',    label: 'Avertir',           icon: AlertTriangle, color: 'border-amber-200 bg-amber-50 text-amber-700'  },
  { value: 'BAN',     label: 'Bannir',            icon: Ban,           color: 'border-red-200 bg-red-50 text-red-700'        },
  { value: 'REJECT',  label: 'Rejeter',           icon: X,             color: 'border-slate-200 bg-slate-100 text-slate-700' },
];

function Avatar({ name, size = 8 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-500','bg-violet-500','bg-pink-500','bg-rose-500','bg-amber-500','bg-emerald-500','bg-cyan-500'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>
      {initials}
    </div>
  );
}

export default function AdminReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchReports() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      const data = await apiFetch(`/reports/admin/reports?${params.toString()}`, { token });
      setReports(data.data || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) fetchReports(); }, [token, filterStatus]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      (r.reportedUser?.name || '').toLowerCase().includes(q) ||
      (r.reportedBy?.name || '').toLowerCase().includes(q) ||
      String(r.reason || '').toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total:    reports.length,
    pending:  reports.filter(r => r.status === 'PENDING').length,
    review:   reports.filter(r => r.status === 'UNDER_REVIEW').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
  }), [reports]);

  async function applyAction() {
    if (!selectedReport || !actionType) return;
    if ((actionType === 'WARN' || actionType === 'BAN') && !actionReason.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/reports/admin/reports/${selectedReport._id}/action`, {
        token, method: 'PATCH',
        body: { action: actionType, reason: actionReason, note: adminNote },
      });
      setActionType(''); setActionReason(''); setAdminNote(''); setSelectedReport(null);
      await fetchReports();
    } catch (err) {
      setError(err.message || 'Impossible d\'appliquer l\'action');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Signalements</h1>
              <p className="text-sm text-slate-500">Modération et gestion des signalements utilisateurs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',       value: stats.total,    icon: Flag,         bg: 'bg-slate-100',   text: 'text-slate-600'  },
          { label: 'En attente',  value: stats.pending,  icon: Clock,        bg: 'bg-amber-100',   text: 'text-amber-600'  },
          { label: 'En cours',    value: stats.review,   icon: TrendingUp,   bg: 'bg-blue-100',    text: 'text-blue-600'   },
          { label: 'Résolus',     value: stats.resolved, icon: CheckCircle,  bg: 'bg-emerald-100', text: 'text-emerald-600'},
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-5 w-5 ${text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, raison..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-8 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 appearance-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="UNDER_REVIEW">En cours</option>
            <option value="RESOLVED">Résolu</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Flag className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Aucun signalement trouvé</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden border-b border-slate-100 bg-slate-50 px-6 py-3 sm:grid sm:grid-cols-[1fr_1fr_120px_100px_80px] sm:gap-4">
              {['Signalé', 'Signalé par', 'Raison', 'Statut', ''].map(h => (
                <span key={h} className="text-xs font-bold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                const st = STATUS[report.status] || STATUS.PENDING;
                const sv = SEVERITY[report.severity] || SEVERITY.LOW;
                return (
                  <div key={report._id}
                    className="grid grid-cols-1 gap-3 px-6 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_1fr_120px_100px_80px] sm:items-center sm:gap-4">
                    {/* Reported user */}
                    <div className="flex items-center gap-3">
                      <Avatar name={report.reportedUser?.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{report.reportedUser?.name || 'Utilisateur'}</p>
                        <p className="text-xs text-slate-400">{report.reportedUser?.role || ''}</p>
                      </div>
                    </div>
                    {/* Reported by */}
                    <div className="flex items-center gap-3">
                      <Avatar name={report.reportedBy?.name} size={7} />
                      <p className="truncate text-sm text-slate-600">{report.reportedBy?.name || 'Utilisateur'}</p>
                    </div>
                    {/* Reason */}
                    <div>
                      <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold ${sv.color}`}>
                        {report.reason || '—'}
                      </span>
                    </div>
                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold ${st.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    {/* Action */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => { setSelectedReport(report); setActionType(''); }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100">
                  <Flag className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Détail du signalement</h2>
                  <p className="text-xs text-slate-400">#{selectedReport._id?.slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedReport(null); setActionType(''); }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-7 space-y-6">

              {/* Parties */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Utilisateur signalé</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedReport.reportedUser?.name} size={10} />
                    <div>
                      <p className="font-semibold text-slate-900">{selectedReport.reportedUser?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{selectedReport.reportedUser?.role || ''}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Signalé par</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedReport.reportedBy?.name} size={10} />
                    <div>
                      <p className="font-semibold text-slate-900">{selectedReport.reportedBy?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{selectedReport.reportedBy?.role || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Statut',    value: STATUS[selectedReport.status]?.label || selectedReport.status },
                  { label: 'Sévérité',  value: SEVERITY[selectedReport.severity]?.label || selectedReport.severity || '—' },
                  { label: 'Date',      value: new Date(selectedReport.createdAt).toLocaleDateString('fr-FR') },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedReport.description}</p>
                </div>
              )}

              {/* Admin note */}
              {selectedReport.adminNote && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-400">Note admin</p>
                  <p className="text-sm text-indigo-800">{selectedReport.adminNote}</p>
                </div>
              )}

              {/* Action history */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Historique des actions</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {(selectedReport.actionHistory || []).length === 0 ? (
                    <p className="px-5 py-4 text-sm text-slate-400">Aucune action enregistrée.</p>
                  ) : (
                    selectedReport.actionHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-5 py-3">
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {item.action} <span className="font-normal text-slate-400">·</span> {item.fromStatus} → {item.toStatus}
                          </p>
                          {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
                        </div>
                        <p className="ml-auto shrink-0 text-xs text-slate-400">
                          {item.performedAt ? new Date(item.performedAt).toLocaleDateString('fr-FR') : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <p className="text-sm font-bold text-slate-900">Prendre une action</p>

                {/* Quick action buttons */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ACTIONS.map(({ value, label, icon: Icon, color }) => (
                    <button key={value} onClick={() => setActionType(value)}
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${color} ${actionType === value ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}>
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                      Raison {(actionType === 'WARN' || actionType === 'BAN') && <span className="text-red-500">*</span>}
                    </label>
                    <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} rows={3}
                      placeholder="Décrivez la raison de cette action..."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Note interne</label>
                    <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2}
                      placeholder="Note visible uniquement par les admins..."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setSelectedReport(null); setActionType(''); }}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Annuler
                  </button>
                  <button onClick={applyAction}
                    disabled={!actionType || actionLoading || ((actionType === 'WARN' || actionType === 'BAN') && !actionReason.trim())}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50">
                    {actionLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Traitement...</> : <><ShieldCheck className="h-4 w-4" /> Confirmer l'action</>}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

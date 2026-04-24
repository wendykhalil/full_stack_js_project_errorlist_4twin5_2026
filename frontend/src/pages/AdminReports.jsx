import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, CheckCircle, Clock, Eye, Flag, Search, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../auth/api';

const STATUS = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  UNDER_REVIEW: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'Résolu', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejeté', color: 'bg-slate-100 text-slate-700' },
};

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
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      const data = await apiFetch(`/reports/admin/reports?${params.toString()}`, { token });
      setReports(data.data || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterStatus]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((report) => {
      const reportedUserName = report.reportedUser?.name || '';
      const reportedByName = report.reportedBy?.name || '';
      return (
        reportedUserName.toLowerCase().includes(q) ||
        reportedByName.toLowerCase().includes(q) ||
        String(report.reason || '').toLowerCase().includes(q)
      );
    });
  }, [reports, searchQuery]);

  async function applyAction() {
    if (!selectedReport) return;
    if ((actionType === 'WARN' || actionType === 'BAN') && !actionReason.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/reports/admin/reports/${selectedReport._id}/action`, {
        token,
        method: 'PATCH',
        body: {
          action: actionType,
          reason: actionReason,
          note: adminNote,
        },
      });
      setActionType('');
      setActionReason('');
      setAdminNote('');
      setSelectedReport(null);
      await fetchReports();
    } catch (err) {
      setError(err.message || 'Impossible d’appliquer l’action');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="py-14 text-center text-slate-500">Chargement des signalements...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestion des Signalements</h1>
        <p className="mt-2 text-slate-600">Workflow modération: PENDING → UNDER_REVIEW → RESOLVED / REJECTED</p>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un signalement..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="PENDING">PENDING</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filteredReports.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Aucun signalement trouvé.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <div key={report._id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">
                      Signalé par {report.reportedBy?.name || 'Utilisateur'}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {report.reportedUser?.name || 'Utilisateur'} — {report.reason}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{report.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[report.status]?.color || 'bg-slate-100 text-slate-700'}`}>
                      {STATUS[report.status]?.label || report.status}
                    </span>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Signalement #{selectedReport._id}</h2>
              <button onClick={() => { setSelectedReport(null); setActionType(''); }}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div><b>Statut:</b> {selectedReport.status}</div>
              <div><b>Sévérité:</b> {selectedReport.severity}</div>
              <div><b>Description:</b> {selectedReport.description}</div>
              <div><b>Créé le:</b> {new Date(selectedReport.createdAt).toLocaleString('fr-FR')}</div>
              {selectedReport.adminNote ? <div><b>Dernière note admin:</b> {selectedReport.adminNote}</div> : null}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Historique d'actions</h3>
              <div className="mt-2 space-y-2">
                {(selectedReport.actionHistory || []).length === 0 ? (
                  <div className="text-sm text-slate-500">Aucune action enregistrée.</div>
                ) : (
                  selectedReport.actionHistory.map((item, idx) => (
                    <div key={`${item.performedAt}-${idx}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      {item.action} - {item.fromStatus} → {item.toStatus} - {item.note || 'sans note'}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Choisir une action</option>
                <option value="REVIEW">Passer en revue (UNDER_REVIEW)</option>
                <option value="WARN">Avertir (RESOLVED)</option>
                <option value="BAN">Bannir (RESOLVED)</option>
                <option value="REJECT">Rejeter (REJECTED)</option>
              </select>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                placeholder="Raison de l'action (obligatoire pour WARN/BAN)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Note admin"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={applyAction} disabled={!actionType || actionLoading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {actionLoading ? 'Traitement...' : 'Confirmer action'}
                </button>
                <button onClick={() => { setActionType('REVIEW'); }} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                  <Clock className="h-3.5 w-3.5" /> UNDER_REVIEW
                </button>
                <button onClick={() => { setActionType('WARN'); }} className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> WARN
                </button>
                <button onClick={() => { setActionType('BAN'); }} className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  <Ban className="h-3.5 w-3.5" /> BAN
                </button>
                <button onClick={() => { setActionType('REJECT'); }} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                  <X className="h-3.5 w-3.5" /> REJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
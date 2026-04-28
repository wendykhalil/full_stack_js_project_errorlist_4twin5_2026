import React, { useEffect, useState } from 'react';
import { X, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import ReadCardButton from '../components/ReadCardButton';
import { getAdminDisputes, adminResolveDispute } from '../auth/api';
import { Hint } from '../components/MouseTooltip';

const STATUS_STYLE = {
  OPEN:                  'bg-orange-100 text-orange-700',
  IN_PROGRESS:           'bg-blue-100 text-blue-700',
  RESOLVED_FOR_OPENER:   'bg-emerald-100 text-emerald-700',
  RESOLVED_FOR_OPPONENT: 'bg-slate-100 text-slate-600',
  CLOSED:                'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = {
  OPEN: 'Ouvert', IN_PROGRESS: 'En cours',
  RESOLVED_FOR_OPENER: 'Résolu (ouvreur)',
  RESOLVED_FOR_OPPONENT: 'Résolu (autre partie)',
  CLOSED: 'Clôturé',
};

export default function AdminDisputes() {
  const { token } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getAdminDisputes({ token, status: statusFilter });
      setDisputes(res.disputes || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleResolve() {
    if (!resolution) return;
    try {
      setResolving(true);
      await adminResolveDispute({ token, id: selected._id, resolution, adminNote });
      setSelected(null);
      setResolution('');
      setAdminNote('');
      load();
    } catch (e) { setErr(e.message); }
    finally { setResolving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestion des Litiges</h1>
        <p className="mt-2 text-slate-500">Médiez les conflits entre utilisateurs</p>
      </div>

      {err && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

      <div className="flex gap-3">
        <Hint text="Filtrer les litiges par statut">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none">
          <option value="ALL">Tous les statuts</option>
          <option value="OPEN">Ouvert</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLVED_FOR_OPENER">Résolu (ouvreur)</option>
          <option value="RESOLVED_FOR_OPPONENT">Résolu (autre)</option>
          <option value="CLOSED">Clôturé</option>
        </select>
        </Hint>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Chargement…</div>
      ) : disputes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-500">Aucun litige trouvé.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Ouvert par</th>
                <th className="px-4 py-3 text-left">Contre</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Raison</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disputes.map(d => (
                <tr key={d._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.openedBy?.firstName} {d.openedBy?.lastName}</td>
                  <td className="px-4 py-3 text-slate-600">{d.againstId?.firstName} {d.againstId?.lastName}</td>
                  <td className="px-4 py-3 text-slate-500">{d.sourceType}</td>
                  <td className="px-4 py-3 text-slate-500">{d.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status]}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString('fr-TN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ReadCardButton text={`Litige de ${d.openedBy?.firstName} ${d.openedBy?.lastName} contre ${d.againstId?.firstName} ${d.againstId?.lastName}. Type: ${d.sourceType}. Raison: ${d.reason}. Statut: ${STATUS_LABEL[d.status]}.`} />
                    <Hint text="Ouvrir le détail du litige et prendre une décision">
                    <button onClick={() => setSelected(d)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      Gérer
                    </button>
                    </Hint>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Litige — {selected.reason}</h3>
              <button onClick={() => setSelected(null)} className="rounded-xl p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Ouvert par</p>
                  <p className="font-medium text-slate-900">{selected.openedBy?.firstName} {selected.openedBy?.lastName}</p>
                  <p className="text-xs text-slate-500">{selected.openedBy?.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Contre</p>
                  <p className="font-medium text-slate-900">{selected.againstId?.firstName} {selected.againstId?.lastName}</p>
                  <p className="text-xs text-slate-500">{selected.againstId?.email}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-700 mb-1">Description</p>
                <p className="text-slate-600">{selected.description}</p>
              </div>

              {/* Messages */}
              <div>
                <p className="font-semibold text-slate-800 mb-2">Messages ({selected.messages?.length || 0})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(selected.messages || []).map((m, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-700">{m.authorId?.firstName || 'Admin'}: </span>
                      <span className="text-slate-600">{m.content}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              {!['RESOLVED_FOR_OPENER','RESOLVED_FOR_OPPONENT','CLOSED'].includes(selected.status) && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <p className="font-semibold text-slate-800">Résoudre le litige</p>
                  <Hint text="Choisir en faveur de qui résoudre ce litige">
                  <select value={resolution} onChange={e => setResolution(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Choisir une résolution…</option>
                    <option value="RESOLVED_FOR_OPENER">En faveur de l'ouvreur</option>
                    <option value="RESOLVED_FOR_OPPONENT">En faveur de l'autre partie</option>
                    <option value="CLOSED">Clôturer sans résolution</option>
                  </select>
                  </Hint>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Note admin (optionnel)…" />
                  <div className="flex gap-2">
                    <Hint text="Enregistrer la décision et clôturer ce litige">
                    <button onClick={handleResolve} disabled={!resolution || resolving}
                      className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                      {resolving ? 'Traitement…' : 'Confirmer la résolution'}
                    </button>
                    </Hint>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

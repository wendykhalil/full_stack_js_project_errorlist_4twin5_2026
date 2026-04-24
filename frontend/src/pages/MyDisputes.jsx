import React, { useEffect, useState } from 'react';
import { Plus, X, MessageSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import PageShell from '../components/PageShell';
import FieldError from '../components/FieldError';
import { useFormValidation, rules } from '../hooks/useFormValidation';
import { useServerErrors } from '../hooks/useServerErrors';
import { createDispute, getMyDisputes, getDispute, addDisputeMessage, apiFetch } from '../auth/api';
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
  RESOLVED_FOR_OPENER: 'Résolu (en votre faveur)',
  RESOLVED_FOR_OPPONENT: 'Résolu (en faveur de l\'autre partie)',
  CLOSED: 'Clôturé',
};

const REASONS = [
  { value: 'NOT_DELIVERED', label: 'Commande non livrée' },
  { value: 'WRONG_PRODUCT', label: 'Mauvais produit reçu' },
  { value: 'NO_SHOW', label: 'Artisan absent' },
  { value: 'PAYMENT_ISSUE', label: 'Problème de paiement' },
  { value: 'QUALITY_ISSUE', label: 'Problème de qualité' },
  { value: 'OTHER', label: 'Autre' },
];

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function MyDisputes() {
  const { token, user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Source data for dropdowns
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  const [form, setForm] = useState({ againstId: '', sourceType: 'ORDER', sourceId: '', reason: '', description: '' });

  const { errors: formErrors, validate } = useFormValidation({
    againstId: [rules.required('L\'utilisateur concerné est requis')],
    sourceId:  [rules.required('L\'identifiant de la commande/demande est requis')],
    reason:    [rules.required('La raison est requise')],
    description: [rules.required('La description est requise'), rules.minLength(10, 'Minimum 10 caractères')],
  });
  const { globalError, handleError, clearErrors } = useServerErrors();

  async function load() {
    try {
      setLoading(true);
      const res = await getMyDisputes({ token });
      setDisputes(res.disputes || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function loadSources(sourceType) {
    try {
      setSourcesLoading(true);
      if (sourceType === 'ORDER') {
        const res = await apiFetch('/orders/my-orders?limit=20', { token });
        setOrders(res.data?.orders || res.orders || []);
      } else {
        const res = await apiFetch('/service-requests/my-applications', { token });
        setServiceRequests(res.items || []);
      }
    } catch {}
    finally { setSourcesLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // When modal opens or sourceType changes, load the relevant sources
  useEffect(() => {
    if (createOpen) loadSources(form.sourceType);
  }, [createOpen, form.sourceType]);

  async function handleCreate(e) {
    e.preventDefault();
    clearErrors();
    if (!validate(form)) return;
    try {
      setSaving(true);
      await createDispute({ token, data: form });
      setCreateOpen(false);
      setForm({ againstId: '', sourceType: 'ORDER', sourceId: '', reason: '', description: '' });
      load();
    } catch (e) { handleError(e); }
    finally { setSaving(false); }
  }

  async function openDetail(id) {
    try {
      setDetailLoading(true);
      const res = await getDispute({ token, id });
      setDetail(res.dispute);
    } catch (e) { setErr(e.message); }
    finally { setDetailLoading(false); }
  }

  async function handleSendMsg(e) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      setSendingMsg(true);
      await addDisputeMessage({ token, id: detail._id, content: newMsg });
      setNewMsg('');
      const res = await getDispute({ token, id: detail._id });
      setDetail(res.dispute);
    } catch (e) { setErr(e.message); }
    finally { setSendingMsg(false); }
  }

  const isClosed = d => ['RESOLVED_FOR_OPENER','RESOLVED_FOR_OPPONENT','CLOSED'].includes(d?.status);

  return (
    <PageShell title="Mes litiges">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mes litiges</h1>
            <p className="mt-1 text-sm text-slate-500">Ouvrez un litige en cas de problème avec une commande ou une demande</p>
          </div>
          <Hint text="Ouvrir un nouveau litige concernant une commande ou une demande de service.">
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            <Plus className="h-4 w-4" /> Nouveau litige
          </button>
          </Hint>
        </div>

        {err && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

        {loading ? (
          <div className="py-16 text-center text-slate-400">Chargement…</div>
        ) : disputes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">Aucun litige pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map(d => (
              <div key={d._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status]}`}>
                        {STATUS_LABEL[d.status] || d.status}
                      </span>
                      <span className="text-xs text-slate-400">{d.sourceType}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-900">{d.description?.slice(0, 80)}…</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Contre: {d.againstId?.firstName} {d.againstId?.lastName} ·
                      {new Date(d.createdAt).toLocaleDateString('fr-TN')}
                    </p>
                  </div>
                  <Hint text="Voir l'historique complet des messages et l'état de ce litige.">
                  <button onClick={() => openDetail(d._id)}
                    className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50">
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                  </Hint>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} title="Ouvrir un litige" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Type de source *</label>
            <select value={form.sourceType} onChange={e => {
              setForm(s => ({ ...s, sourceType: e.target.value, sourceId: '', againstId: '' }));
            }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500">
              <option value="ORDER">Commande</option>
              <option value="SERVICE_REQUEST">Demande de service</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              {form.sourceType === 'ORDER' ? 'Commande concernée *' : 'Demande de service concernée *'}
            </label>
            <select value={form.sourceId} onChange={e => {
              const selected = form.sourceType === 'ORDER'
                ? orders.find(o => o._id === e.target.value)
                : serviceRequests.find(s => s._id === e.target.value);
              // Auto-fill againstId from the selected source
              const againstId = form.sourceType === 'ORDER'
                ? selected?.supplierId?._id || selected?.supplierId || ''
                : selected?.prescripteur?._id || selected?.prescripteur || '';
              setForm(s => ({ ...s, sourceId: e.target.value, againstId: String(againstId) }));
            }}
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 ${formErrors.sourceId ? 'border-red-400' : 'border-slate-200'}`}
              disabled={sourcesLoading}>
              <option value="">{sourcesLoading ? 'Chargement…' : 'Choisir…'}</option>
              {form.sourceType === 'ORDER'
                ? orders.map(o => (
                    <option key={o._id} value={o._id}>
                      {o.orderNumber || o._id.slice(-8)} — {o.productId?.name || 'Produit'}
                    </option>
                  ))
                : serviceRequests.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.title} ({s.status})
                    </option>
                  ))
              }
            </select>
            <FieldError error={formErrors.sourceId} />
          </div>

          {form.againstId && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
              Litige contre: <span className="font-medium text-slate-900">
                {form.sourceType === 'ORDER'
                  ? orders.find(o => o._id === form.sourceId)?.supplierId?.firstName + ' ' + orders.find(o => o._id === form.sourceId)?.supplierId?.lastName
                  : serviceRequests.find(s => s._id === form.sourceId)?.prescripteur?.firstName + ' ' + serviceRequests.find(s => s._id === form.sourceId)?.prescripteur?.lastName
                }
              </span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Raison *</label>
            <select value={form.reason} onChange={e => setForm(s => ({ ...s, reason: e.target.value }))}
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 ${formErrors.reason ? 'border-red-400' : 'border-slate-200'}`}>
              <option value="">Choisir une raison…</option>
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <FieldError error={formErrors.reason} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description *</label>
            <textarea value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} rows={4}
              className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 ${formErrors.description ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="Décrivez le problème en détail…" />
            <FieldError error={formErrors.description} />
          </div>
          {globalError && <p className="text-sm text-red-600">{globalError}</p>}
          <button type="submit" disabled={saving || !form.sourceId || !form.againstId}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {saving ? 'Envoi…' : 'Ouvrir le litige'}
          </button>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail} title="Détail du litige" onClose={() => setDetail(null)}>
        {detailLoading ? <div className="py-8 text-center text-slate-400">Chargement…</div> : detail ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[detail.status]}`}>
                  {STATUS_LABEL[detail.status]}
                </span>
                <span className="text-slate-400">{detail.sourceType}</span>
              </div>
              <p className="font-medium text-slate-900 mt-2">{detail.description}</p>
              {detail.adminNote && (
                <div className="mt-2 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-700">
                  <b>Note admin:</b> {detail.adminNote}
                </div>
              )}
            </div>

            {/* Messages */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Messages ({detail.messages?.length || 0})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(detail.messages || []).map((m, i) => {
                  const isMe = String(m.authorId?._id || m.authorId) === String(user?._id || user?.id);
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{m.authorId?.firstName} {m.authorId?.lastName}</p>}
                        <p>{m.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!isClosed(detail) && (
              <form onSubmit={handleSendMsg} className="flex gap-2">
                <Hint text="Envoyer un message dans le fil de discussion de ce litige.">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Votre message…" />
                </Hint>
                <button type="submit" disabled={sendingMsg || !newMsg.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  <MessageSquare className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        ) : null}
      </Modal>
    </PageShell>
  );
}

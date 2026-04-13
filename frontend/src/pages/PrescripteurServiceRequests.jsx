import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ChevronDown, Eye, Pencil, Trash2, CheckCircle, XCircle, UserCircle2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import PageShell from "../components/PageShell";
import ReviewModal from "../components/ReviewModal";
import { Stars } from "../components/StarRating";
import FieldError from "../components/FieldError";
import { useFormValidation, rules } from "../hooks/useFormValidation";
import {
  createServiceRequest, getMyServiceRequests, updateServiceRequest,
  deleteServiceRequest, changeServiceRequestStatus,
  acceptApplication, rejectApplication, getMyServiceRequest,
  getReviewsForUser,
} from "../auth/api";

const TRADES = ["Plombier","Électricien","Maçon","Peintre","Menuisier","Carreleur","Chauffagiste","Climatisation","Jardinier","Autre"];
const TUNISIA_CITIES = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Sousse","Monastir","Mahdia","Sfax","Kairouan","Bizerte","Beja","Jendouba","Le Kef","Siliana","Zaghouan","Kasserine","Sidi Bouzid","Gabès","Gafsa","Tozeur","Kébili","Medenine","Tataouine"];

// Inline rating fetcher for an artisan
function ArtisanRating({ userId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!userId) return;
    getReviewsForUser({ userId: String(userId) })
      .then(r => setData({ avg: r.avgRating, total: r.total }))
      .catch(() => {});
  }, [userId]);
  if (!data || data.total === 0) return <p className="text-xs text-slate-400">Pas encore d'avis</p>;
  return <Stars rating={data.avg} total={data.total} />;
}

const STATUS_STYLE = {
  OPEN: "bg-emerald-100 text-emerald-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const APP_STATUS_STYLE = {
  PENDING: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

const emptyForm = { title: "", description: "", trade: "", city: "", budgetTND: "", deadline: "" };

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function RequestForm({ form, setForm, onSubmit, loading, submitLabel }) {
  const { errors, validate, clearError } = useFormValidation({
    title: [rules.required('Le titre est requis'), rules.minLength(3, 'Minimum 3 caractères'), rules.maxLength(120)],
    trade: [rules.required('Le métier est requis')],
    budgetTND: [rules.positiveNumber('Budget doit être positif')],
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate({ title: form.title, trade: form.trade, budgetTND: form.budgetTND || 0 })) return;
    onSubmit(e);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Titre *</label>
        <input value={form.title} onChange={e => { setForm(s => ({ ...s, title: e.target.value })); clearError('title'); }}
          className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-400' : 'border-slate-200'}`}
          placeholder="Ex: Besoin d'un plombier pour rénovation salle de bain" />
        <FieldError error={errors.title} />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
          rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Décrivez le travail à effectuer..." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Métier requis *</label>
          <select value={form.trade} onChange={e => { setForm(s => ({ ...s, trade: e.target.value })); clearError('trade'); }}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.trade ? 'border-red-400' : 'border-slate-200'}`}>
            <option value="">Choisir un métier…</option>
            {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <FieldError error={errors.trade} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Ville</label>
          <input value={form.city} onChange={e => setForm(s => ({ ...s, city: e.target.value }))}
            list="cities-list" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Choisir une ville…" />
          <datalist id="cities-list">{TUNISIA_CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Budget (TND)</label>
          <input value={form.budgetTND} onChange={e => { setForm(s => ({ ...s, budgetTND: e.target.value })); clearError('budgetTND'); }}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.budgetTND ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="Ex: 3000" />
          <FieldError error={errors.budgetTND} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Date limite</label>
          <input value={form.deadline} onChange={e => setForm(s => ({ ...s, deadline: e.target.value }))}
            type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {loading ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}

export default function PrescripteurServiceRequests() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSourceId, setReviewSourceId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await getMyServiceRequests({ token });
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openDetail(id) {
    try {
      setDetailLoading(true);
      const res = await getMyServiceRequest({ token, id });
      setDetailItem(res.serviceRequest);
    } catch (e) {
      setErr(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await createServiceRequest({ token, data: form });
      setCreateOpen(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      setErr(e.data?.errors?.map(x => x.message).join(', ') || e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await updateServiceRequest({ token, id: editItem._id, data: form });
      setEditItem(null);
      setForm(emptyForm);
      load();
    } catch (e) {
      setErr(e.data?.errors?.map(x => x.message).join(', ') || e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer cette demande ?")) return;
    try {
      await deleteServiceRequest({ token, id });
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await changeServiceRequestStatus({ token, id, status });
      load();
      if (detailItem?._id === id) openDetail(id);
      // Prompt review when marking completed
      if (status === "COMPLETED") {
        const item = items.find(i => i._id === id);
        if (item?.assignedArtisanId) {
          setReviewSourceId(id);
          setReviewTarget({ ...item.assignedArtisanId, targetType: "ARTISAN" });
        }
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleAccept(requestId, appId) {
    try {
      await acceptApplication({ token, requestId, appId });
      openDetail(requestId);
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleReject(requestId, appId) {
    try {
      await rejectApplication({ token, requestId, appId });
      openDetail(requestId);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <PageShell title="Demandes de service">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Demandes de service</h1>
            <p className="mt-1 text-sm text-slate-500">Publiez des offres et recevez des candidatures d'artisans</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Nouvelle demande
          </button>
        </div>

        {err && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

        {/* List */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">Aucune demande pour l'instant.</p>
            <button onClick={() => setCreateOpen(true)} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Créer ma première demande
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{item.trade}</span>
                      {item.city && <span>📍 {item.city}</span>}
                      {item.budgetTND > 0 && <span>💰 {item.budgetTND.toLocaleString()} TND</span>}
                      {item.deadline && <span>📅 {new Date(item.deadline).toLocaleDateString()}</span>}
                      <span>{item.applications?.length || 0} candidature(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openDetail(item._id)}
                      className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50" title="Voir détails">
                      <Eye className="h-4 w-4 text-slate-500" />
                    </button>
                    {item.status === "OPEN" && (
                      <button onClick={() => { setEditItem(item); setForm({ title: item.title, description: item.description || "", trade: item.trade, city: item.city || "", budgetTND: item.budgetTND || "", deadline: item.deadline ? item.deadline.slice(0, 10) : "" }); }}
                        className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50" title="Modifier">
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </button>
                    )}
                    {item.status === "ASSIGNED" && (
                      <button onClick={() => handleStatusChange(item._id, "COMPLETED")}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                        Marquer terminé
                      </button>
                    )}
                    {["OPEN", "ASSIGNED"].includes(item.status) && (
                      <button onClick={() => handleStatusChange(item._id, "CANCELLED")}
                        className="rounded-xl border border-red-200 bg-red-50 p-2 hover:bg-red-100" title="Annuler">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(item._id)}
                      className="rounded-xl border border-slate-200 p-2 hover:bg-red-50" title="Supprimer">
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} title="Nouvelle demande de service" onClose={() => setCreateOpen(false)}>
        <RequestForm form={form} setForm={setForm} onSubmit={handleCreate} loading={saving} submitLabel="Publier la demande" />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} title="Modifier la demande" onClose={() => setEditItem(null)}>
        <RequestForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={saving} submitLabel="Enregistrer" />
      </Modal>

      {/* Detail / Applications Modal */}
      <Modal open={!!detailItem} title="Détails & Candidatures" onClose={() => setDetailItem(null)}>
        {detailLoading ? (
          <div className="py-8 text-center text-slate-400">Chargement…</div>
        ) : detailItem ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm space-y-1">
              <p className="font-semibold text-slate-900 text-base">{detailItem.title}</p>
              {detailItem.description && <p className="text-slate-600">{detailItem.description}</p>}
              <div className="flex flex-wrap gap-3 pt-1 text-slate-500">
                <span>{detailItem.trade}</span>
                {detailItem.city && <span>📍 {detailItem.city}</span>}
                {detailItem.budgetTND > 0 && <span>💰 {detailItem.budgetTND.toLocaleString()} TND</span>}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Candidatures ({detailItem.applications?.length || 0})</h4>
              {!detailItem.applications?.length ? (
                <p className="text-sm text-slate-400">Aucune candidature pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {detailItem.applications.map(app => (
                    <div key={app._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserCircle2 className="h-9 w-9 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {app.artisanId?.firstName} {app.artisanId?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{app.artisanId?.email}</p>
                            <ArtisanRating userId={app.artisanId?._id} />
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${APP_STATUS_STYLE[app.status]}`}>{app.status}</span>
                      </div>
                      {app.message && <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{app.message}</p>}
                      {app.proposedPrice && <p className="mt-1 text-xs text-slate-500">Prix proposé: {app.proposedPrice.toLocaleString()} TND</p>}
                      {app.status === "PENDING" && detailItem.status === "OPEN" && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => handleAccept(detailItem._id, app._id)}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" /> Accepter
                          </button>
                          <button onClick={() => handleReject(detailItem._id, app._id)}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                            <XCircle className="h-3.5 w-3.5" /> Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onDone={() => load()}
        target={reviewTarget}
        sourceId={reviewSourceId}
      />
    </PageShell>
  );
}

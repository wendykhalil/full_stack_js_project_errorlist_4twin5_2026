import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, X, Eye, Pencil, Trash2, CheckCircle, XCircle,
  ExternalLink, CalendarCheck, CalendarX, CalendarMinus, RotateCcw,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import PageShell from "../components/PageShell";
import SimpleFooter from "../components/Footer";
import ReviewModal from "../components/ReviewModal";
import { Stars } from "../components/StarRating";
import FieldError from "../components/FieldError";
import { useFormValidation, rules } from "../hooks/useFormValidation";
import {
  createServiceRequest, getMyServiceRequests, updateServiceRequest,
  deleteServiceRequest, changeServiceRequestStatus, reopenServiceRequest,
  acceptApplication, rejectApplication, getMyServiceRequest,
  getReviewsForUser, getArtisanAvailability,
} from "../auth/api";

// ── Shared Avatar ─────────────────────────────────────────────────────────────
function Avatar({ src, name, size = "md" }) {
  const [broken, setBroken] = useState(false);
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const initials = (name || "?")
    .split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className={`${dim} rounded-full object-cover shrink-0 border border-slate-200`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600 shrink-0`}>
      {initials}
    </div>
  );
}

const TRADES = ["Plombier","Électricien","Maçon","Peintre","Menuisier","Carreleur","Chauffagiste","Climatisation","Jardinier","Autre"];
const TUNISIA_CITIES = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Sousse","Monastir","Mahdia","Sfax","Kairouan","Bizerte","Beja","Jendouba","Le Kef","Siliana","Zaghouan","Kasserine","Sidi Bouzid","Gabès","Gafsa","Tozeur","Kébili","Medenine","Tataouine"];

const STATUS_STYLE = {
  OPEN:      "bg-emerald-100 text-emerald-700",
  ASSIGNED:  "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-600",
};
const STATUS_LABEL = {
  OPEN:      "Ouverte",
  ASSIGNED:  "Assignée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const APP_STATUS_STYLE = {
  PENDING:  "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};
const APP_STATUS_LABEL = {
  PENDING:  "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Non retenue",
};

const emptyForm = { title: "", description: "", trade: "", city: "", budgetTND: "", deadline: "", maxApplicants: "" };

// ── Inline artisan rating ─────────────────────────────────────────────────────
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

// ── Artisan availability badge (today's status) ───────────────────────────────
const AVAIL_CONFIG = {
  AVAILABLE:    { icon: CalendarCheck, label: "Disponible",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BUSY:         { icon: CalendarMinus, label: "Occupé",          cls: "bg-orange-50  text-orange-700  border-orange-200"  },
  BOOKED:       { icon: CalendarX,     label: "Non disponible",  cls: "bg-red-50     text-red-600     border-red-200"     },
  NOT_SET:      { icon: CalendarMinus, label: "Non renseigné",   cls: "bg-slate-100  text-slate-500   border-slate-200"   },
};

function ArtisanAvailabilityBadge({ artisanId }) {
  const [status, setStatus] = useState(null); // null = loading

  useEffect(() => {
    if (!artisanId) return;
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    getArtisanAvailability({ artisanId: String(artisanId), month })
      .then(res => {
        const todayStr = today.toISOString().slice(0, 10);
        const entry = (res.items || []).find(i => i.date?.slice(0, 10) === todayStr);
        setStatus(entry?.status || "NOT_SET");
      })
      .catch(() => setStatus("NOT_SET"));
  }, [artisanId]);

  if (status === null) return <span className="text-xs text-slate-300">…</span>;

  const cfg = AVAIL_CONFIG[status] || AVAIL_CONFIG.NOT_SET;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full ${wide ? "max-w-2xl" : "max-w-xl"} flex-col overflow-hidden rounded-3xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Request form ──────────────────────────────────────────────────────────────
function RequestForm({ form, setForm, onSubmit, loading, submitLabel }) {
  const { errors, validate, clearError } = useFormValidation({
    title:    [rules.required("Le titre est requis"), rules.minLength(3, "Minimum 3 caractères"), rules.maxLength(120)],
    trade:    [rules.required("Le métier est requis")],
    budgetTND:[rules.positiveNumber("Budget doit être positif")],
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
        <input
          value={form.title}
          onChange={e => { setForm(s => ({ ...s, title: e.target.value })); clearError("title"); }}
          className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? "border-red-400" : "border-slate-200"}`}
          placeholder="Ex: Besoin d'un plombier pour rénovation salle de bain"
        />
        <FieldError error={errors.title} />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Décrivez le travail à effectuer..."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Métier requis *</label>
          <select
            value={form.trade}
            onChange={e => { setForm(s => ({ ...s, trade: e.target.value })); clearError("trade"); }}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.trade ? "border-red-400" : "border-slate-200"}`}
          >
            <option value="">Choisir un métier…</option>
            {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <FieldError error={errors.trade} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Ville</label>
          <input
            value={form.city}
            onChange={e => setForm(s => ({ ...s, city: e.target.value }))}
            list="cities-list"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Choisir une ville…"
          />
          <datalist id="cities-list">{TUNISIA_CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Budget (TND)</label>
          <input
            value={form.budgetTND}
            onChange={e => { setForm(s => ({ ...s, budgetTND: e.target.value })); clearError("budgetTND"); }}
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.budgetTND ? "border-red-400" : "border-slate-200"}`}
            placeholder="Ex: 3000"
          />
          <FieldError error={errors.budgetTND} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Nombre max de candidats</label>
          <input
            value={form.maxApplicants}
            onChange={e => setForm(s => ({ ...s, maxApplicants: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Illimité si vide"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Nombre max de candidats</label>
          <input value={form.maxApplicants} onChange={e => setForm(s => ({ ...s, maxApplicants: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Illimité si vide (ex: 5)" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Date limite</label>
          <input
            value={form.deadline}
            onChange={e => setForm(s => ({ ...s, deadline: e.target.value }))}
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PrescripteurServiceRequests() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // #3 — Status filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSourceId, setReviewSourceId] = useState(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyServiceRequests({ token });
      setAllItems(res.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // #3 — Filtered list
  const items = statusFilter === "ALL"
    ? allItems
    : allItems.filter(i => i.status === statusFilter);

  // Counts per status for filter badges
  const counts = allItems.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {});

  // ── Detail ──────────────────────────────────────────────────────────────────
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

  // ── CRUD ────────────────────────────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await createServiceRequest({ token, data: form });
      setCreateOpen(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      setErr(e.data?.errors?.map(x => x.message).join(", ") || e.message);
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
      setErr(e.data?.errors?.map(x => x.message).join(", ") || e.message);
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
      if (status === "COMPLETED") {
        const item = allItems.find(i => i._id === id);
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

  async function handleReopen(id) {
    try {
      await reopenServiceRequest({ token, id });
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const pendingAppsCount = allItems.reduce((n, i) =>
    n + (i.applications?.filter(a => a.status === "PENDING").length || 0), 0);

  return (
    <PageShell title="Demandes de service">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Demandes de service</h1>
            <p className="mt-1 text-sm text-slate-500">
              Publiez des offres et recevez des candidatures d'artisans
              {pendingAppsCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {pendingAppsCount} candidature{pendingAppsCount > 1 ? "s" : ""} en attente
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Nouvelle demande
          </button>
        </div>

        {err && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            {err}
            <button onClick={() => setErr("")}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* #3 — Status filter pills */}
        {allItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "ALL", label: "Toutes", count: allItems.length },
              { key: "OPEN",      label: STATUS_LABEL.OPEN,      count: counts.OPEN      || 0 },
              { key: "ASSIGNED",  label: STATUS_LABEL.ASSIGNED,  count: counts.ASSIGNED  || 0 },
              { key: "COMPLETED", label: STATUS_LABEL.COMPLETED, count: counts.COMPLETED || 0 },
              { key: "CANCELLED", label: STATUS_LABEL.CANCELLED, count: counts.CANCELLED || 0 },
            ].filter(f => f.key === "ALL" || f.count > 0).map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  statusFilter === f.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">Chargement…</div>
        ) : allItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">Aucune demande pour l'instant.</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Créer ma première demande
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 py-10 text-center">
            <p className="text-slate-400 text-sm">Aucune demande avec ce statut.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{item.trade}</span>
                      {item.city && <span>📍 {item.city}</span>}
                      {item.budgetTND > 0 && <span>💰 {item.budgetTND.toLocaleString()} TND</span>}
                      {item.deadline && <span>📅 {new Date(item.deadline).toLocaleDateString()}</span>}
                        <span className={`font-medium ${(item.applications?.length || 0) > 0 ? "text-indigo-600" : ""}`}>
                        {item.applications?.length || 0} candidature(s)
                      </span>
                      {item.maxApplicants && (
                        <span className="text-xs text-slate-400">
                          (max {item.maxApplicants})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openDetail(item._id)}
                      className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                      title="Voir détails & candidatures"
                    >
                      <Eye className="h-4 w-4 text-slate-500" />
                    </button>
                    {item.status === "OPEN" && (
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setForm({
                            title: item.title,
                            description: item.description || "",
                            trade: item.trade,
                            city: item.city || "",
                            budgetTND: item.budgetTND || "",
                            deadline: item.deadline ? item.deadline.slice(0, 10) : "",
                            maxApplicants: item.maxApplicants || "",
                          });
                        }}
                        className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </button>
                    )}
                    {item.status === "ASSIGNED" && (
                      <button
                        onClick={() => handleStatusChange(item._id, "COMPLETED")}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Marquer terminé
                      </button>
                    )}
                    {["OPEN", "ASSIGNED"].includes(item.status) && (
                      <button
                        onClick={() => handleStatusChange(item._id, "CANCELLED")}
                        className="rounded-xl border border-red-200 bg-red-50 p-2 hover:bg-red-100"
                        title="Annuler"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                    {item.status === "CANCELLED" && !item.assignedArtisanId && (
                      <button
                        onClick={() => handleReopen(item._id)}
                        className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 hover:bg-indigo-100"
                        title="Ré-ouvrir"
                      >
                        <RotateCcw className="h-4 w-4 text-indigo-500" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-xl border border-slate-200 p-2 hover:bg-red-50"
                      title="Supprimer"
                    >
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
      <Modal open={createOpen} title="Nouvelle demande de service" onClose={() => setCreateOpen(false)} wide>
        <RequestForm form={form} setForm={setForm} onSubmit={handleCreate} loading={saving} submitLabel="Publier la demande" />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} title="Modifier la demande" onClose={() => setEditItem(null)} wide>
        <RequestForm form={form} setForm={setForm} onSubmit={handleUpdate} loading={saving} submitLabel="Enregistrer" />
      </Modal>

      {/* Detail / Applications Modal */}
      <Modal open={!!detailItem} title="Détails & Candidatures" onClose={() => setDetailItem(null)} wide>
        {detailLoading ? (
          <div className="py-8 text-center text-slate-400">Chargement…</div>
        ) : detailItem ? (
          <div className="space-y-5">

            {/* Request summary */}
            <div className="rounded-2xl bg-slate-50 p-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-base flex-1">{detailItem.title}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[detailItem.status]}`}>
                  {STATUS_LABEL[detailItem.status]}
                </span>
              </div>
              {detailItem.description && <p className="text-slate-600">{detailItem.description}</p>}
              <div className="flex flex-wrap gap-3 pt-1 text-slate-500">
                <span>{detailItem.trade}</span>
                {detailItem.city && <span>📍 {detailItem.city}</span>}
                {detailItem.budgetTND > 0 && <span>💰 {detailItem.budgetTND.toLocaleString()} TND</span>}
                {detailItem.maxApplicants && <span className="inline-flex items-center gap-1"><span>📊</span>Max {detailItem.maxApplicants} candidat(s)</span>}
              </div>
            </div>

            {/* Applications */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">
                Candidatures ({detailItem.applications?.length || 0})
              </h4>
              {!detailItem.applications?.length ? (
                <p className="text-sm text-slate-400">Aucune candidature pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {detailItem.applications.map(app => (
                    <div key={app._id} className="rounded-2xl border border-slate-200 p-4 space-y-3">

                      {/* Artisan header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={app.artisanId?.profilePicture}
                            name={`${app.artisanId?.firstName || ""} ${app.artisanId?.lastName || ""}`}
                          />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {app.artisanId?.firstName} {app.artisanId?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{app.artisanId?.email}</p>
                            <ArtisanRating userId={app.artisanId?._id} />
                            <div className="mt-1">
                              <ArtisanAvailabilityBadge artisanId={app.artisanId?._id} />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${APP_STATUS_STYLE[app.status]}`}>
                            {APP_STATUS_LABEL[app.status]}
                          </span>
                          {/* #4 — View artisan profile link */}
                          {app.artisanId?._id && (
                            <button
                              onClick={() => navigate(`/prescripteur/artisan/${app.artisanId._id}`)}
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Voir le profil
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Message & price */}
                      {app.message && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 italic">
                          "{app.message}"
                        </p>
                      )}
                      {app.proposedPrice && (
                        <p className="text-xs text-slate-500">
                          Prix proposé : <span className="font-semibold text-slate-700">{app.proposedPrice.toLocaleString()} TND</span>
                        </p>
                      )}

                      {/* Accept / Reject */}
                      {app.status === "PENDING" && detailItem.status === "OPEN" && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAccept(detailItem._id, app._id)}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Accepter
                          </button>
                          <button
                            onClick={() => handleReject(detailItem._id, app._id)}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
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


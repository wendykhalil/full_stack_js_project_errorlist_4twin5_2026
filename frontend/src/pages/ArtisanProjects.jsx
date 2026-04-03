import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Calendar,
  ChevronDown,
  Eye,
  FileSignature,
  Image as ImageIcon,
  Layers3,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SimpleFooter from "../components/Footer";
import { apiFetch, getMySubscription } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import SubscriptionAlert from "../components/SubscriptionAlert";
import AIAssistantModal from "../components/ai-assistant/AIAssistantModal";
import Pagination from "../components/Pagination";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

const STATUS_META = {
  ACTIVE: { tone: "bg-indigo-100 text-indigo-700", key: "artisanProjects.status.active" },
  PENDING: { tone: "bg-orange-100 text-orange-700", key: "artisanProjects.status.pending" },
  COMPLETED: { tone: "bg-emerald-100 text-emerald-700", key: "artisanProjects.status.completed" },
};

const TUNISIA_CITIES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Sousse", "Monastir", "Mahdia", "Sfax", "Kairouan", "Bizerte", "Beja", "Jendouba", "Le Kef", "Siliana", "Zaghouan", "Kasserine", "Sidi Bouzid", "Gabès", "Gafsa", "Tozeur", "Kébili", "Medenine", "Tataouine",
];

const PROJECT_CATEGORIES = [
  "Villa", "Appartement", "Bureau", "Magasin", "Restaurant", "Immeuble", "Entrepôt", "Usine",
  "Rénovation", "Construction neuve", "Extension", "Aménagement intérieur", "Façade", "Toiture",
  "Peinture", "Plomberie", "Électricité", "Carrelage", "Menuiserie", "Climatisation", "Isolation", "Piscine/Jardin",
];

const MATERIAL_SUGGESTIONS = [
  "Ciment", "Sable", "Gravier", "Brique", "Parpaing", "Fer", "Béton", "Plâtre", "Peinture", "Carrelage",
  "Bois", "Aluminium", "PVC", "Verre", "Isolation (laine de roche)", "Isolation (polystyrène)",
  "Câble électrique", "Tuyaux PVC", "Tuyaux cuivre", "Robinetterie", "Sanitaires",
];

function SuggestInput({ label, value, onChange, placeholder, listId, options = [], required = false }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={onChange}
        list={listId}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2"
        placeholder={placeholder}
        required={required}
      />
      <datalist id={listId}>
        {options.map((opt) => <option key={opt} value={opt} />)}
      </datalist>
    </div>
  );
}

function MaterialsPicker({ value = [], onChange }) {
  const [input, setInput] = useState("");

  const add = (raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    if (value.map((x) => x.toLowerCase()).includes(v.toLowerCase())) return;
    onChange([...(value || []), v].slice(0, 12));
    setInput("");
  };

  const remove = (idx) => onChange((value || []).filter((_, i) => i !== idx));

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">Matériaux</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {(value || []).map((m, idx) => (
          <span key={m + idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            {m}
            <button type="button" onClick={() => remove(idx)} className="rounded-full p-0.5 text-slate-500 hover:text-slate-700" aria-label="Remove">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          list="materials-datalist"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2"
          placeholder="Rechercher un matériau…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <button type="button" onClick={() => add(input)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Ajouter
        </button>
      </div>
      <datalist id="materials-datalist">
        {MATERIAL_SUGGESTIONS.map((opt) => <option key={opt} value={opt} />)}
      </datalist>
    </div>
  );
}

const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{t(meta.key)}</span>;
};

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
}

function Modal({ open, title, children, onClose, size = "md" }) {
  if (!open) return null;
  const maxWidth = size === "xl" ? "max-w-6xl" : size === "lg" ? "max-w-4xl" : "max-w-2xl";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl bg-white shadow-xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 pb-4 pt-6">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 pt-5">{children}</div>
      </div>
    </div>
  );
}

function ProjectFormFields({ mode, form, setForm, images, setImages, editing, t }) {
  const isEdit = mode === "edit";
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-base font-semibold text-slate-900">Informations du projet</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2"
                placeholder="e.g., Villa Ben Arous"
                required
              />
            </div>
            <SuggestInput label="Category" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} placeholder="Choisir une catégorie…" listId="project-categories" options={PROJECT_CATEGORIES} />
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2">
                <option value="ACTIVE">{t("artisanProjects.status.active")}</option>
                <option value="PENDING">{t("artisanProjects.status.pending")}</option>
                <option value="COMPLETED">{t("artisanProjects.status.completed")}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2" placeholder="What needs to be done? Requirements, constraints, style..." />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-base font-semibold text-slate-900">Dates et contact</h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Start date</label>
              <input value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2" type="date" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">End date</label>
              <input value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2" type="date" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone number</label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={form.phoneNumber} onChange={(e) => setForm((s) => ({ ...s, phoneNumber: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-indigo-500 focus:ring-2" placeholder="+216 XX XXX XXX" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-base font-semibold text-slate-900">Budget et localisation</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SuggestInput label="City" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} placeholder="Choisir une ville…" listId="tunisia-cities" options={TUNISIA_CITIES} />
            <div>
              <label className="text-sm font-medium text-slate-700">Address</label>
              <input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2" placeholder="Street / neighborhood" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Budget (TND)</label>
              <input value={form.budgetTND} onChange={(e) => setForm((s) => ({ ...s, budgetTND: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2" type="number" min="0" placeholder="e.g., 15000" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Surface (m²)</label>
              <input value={form.surfaceM2} onChange={(e) => setForm((s) => ({ ...s, surfaceM2: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-indigo-500 focus:ring-2" type="number" min="0" placeholder="e.g., 120" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h4 className="text-base font-semibold text-slate-900">Images</h4>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600"><ImageIcon className="h-4 w-4" /><span>{isEdit ? "Add images" : "Images"} (max 6)</span></div>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} className="mt-3 block w-full text-sm" />
            {images.length ? <div className="mt-3 text-xs text-slate-500">Selected: {images.length} file(s)</div> : isEdit && editing?.images?.length ? <div className="mt-3 text-xs text-slate-500">Existing images: {editing.images.length} (new uploads will be added)</div> : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h4 className="text-base font-semibold text-slate-900">Matériaux</h4>
        <div className="mt-4"><MaterialsPicker value={form.materials} onChange={(arr) => setForm((s) => ({ ...s, materials: arr }))} /></div>
      </div>
    </div>
  );
}

function ProjectDetails({ project }) {
  if (!project) return null;
  const gallery = (project.images || []).map((image) => image?.url).filter(Boolean);
  const cover = gallery[0] ? `${ASSET_BASE}${gallery[0]}` : null;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            {cover ? <img src={cover} alt={project.title} className="h-full min-h-[320px] w-full object-cover" /> : <div className="flex min-h-[320px] items-center justify-center"><ImageIcon className="h-10 w-10 text-slate-400" /></div>}
          </div>
          {gallery.length > 1 ? (
            <div className="grid grid-cols-3 gap-3">
              {gallery.slice(0, 6).map((url, idx) => (
                <div key={url + idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img src={`${ASSET_BASE}${url}`} alt={`${project.title} ${idx + 1}`} className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-3xl font-semibold text-slate-900">{project.title}</h4>
                <p className="mt-2 text-sm text-slate-500">Detailed project overview</p>
              </div>
              <StatusPill status={project.status} />
            </div>
            {project.description ? <p className="mt-5 text-[15px] leading-8 text-slate-600">{project.description}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"><div className="text-slate-400">Category</div><div className="mt-1 font-medium text-slate-900">{project.category || '—'}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"><div className="text-slate-400">Budget</div><div className="mt-1 font-medium text-slate-900">{project.budgetTND ? `${Number(project.budgetTND).toLocaleString()} TND` : '—'}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"><div className="text-slate-400">Surface</div><div className="mt-1 font-medium text-slate-900">{project.surfaceM2 ? `${project.surfaceM2} m²` : '—'}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"><div className="text-slate-400">Start date</div><div className="mt-1 font-medium text-slate-900">{formatDate(project.startDate || project.createdAt) || '—'}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"><div className="text-slate-400">End date</div><div className="mt-1 font-medium text-slate-900">{formatDate(project.endDate) || '—'}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"><div className="text-slate-400">Phone</div><div className="mt-1 font-medium text-slate-900">{project.phoneNumber || '—'}</div></div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Location</h5>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div><div className="text-sm text-slate-400">City</div><div className="mt-1 font-medium text-slate-900">{project.location?.city || '—'}</div></div>
              <div><div className="text-sm text-slate-400">Address</div><div className="mt-1 font-medium text-slate-900">{project.location?.address || '—'}</div></div>
            </div>
          </div>
        </div>
      </div>
      {project.materials?.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <h5 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Materials</h5>
          <div className="flex flex-wrap gap-2">{project.materials.map((m, idx) => <span key={m + idx} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{m}</span>)}</div>
        </div>
      ) : null}
    </div>
  );
}

const emptyForm = {
  title: "",
  status: "PENDING",
  category: "",
  description: "",
  city: "",
  address: "",
  budgetTND: "",
  surfaceM2: "",
  startDate: "",
  endDate: "",
  phoneNumber: "",
  materials: [],
};

function toFormData(values, files) {
  const fd = new FormData();
  Object.entries(values || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((entry) => fd.append(k, entry));
      return;
    }
    const s = String(v);
    if (s.trim() === "") return;
    fd.append(k, s);
  });
  (files || []).forEach((f) => fd.append("images", f));
  return fd;
}

export default function ArtisanProjects() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [subscription, setSubscription] = useState({ plan: 'FREE', status: 'INACTIVE' });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const isSubscribed = subscription?.plan && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE';

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const data = await apiFetch("/projects/my", { token });
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!token) {
        setCheckingSubscription(false);
        return;
      }
      try {
        const res = await getMySubscription({ token });
        setSubscription(res?.data || { plan: 'FREE', status: 'INACTIVE' });
      } catch (e) {
        console.error('Erreur récupération abonnement:', e);
        setSubscription({ plan: 'FREE', status: 'INACTIVE' });
      } finally {
        setCheckingSubscription(false);
      }
    };
    loadSubscription();
  }, [token]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (items || []).filter((p) => {
      const haystack = [p.title, p.category, p.location?.city, p.location?.address, p.description, ...(p.materials || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const okQ = !qq || haystack.includes(qq);
      const okS = statusFilter === 'ALL' || p.status === statusFilter;
      return okQ && okS;
    });
  }, [items, q, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  const guardSubscription = (callback) => {
    if (!isSubscribed) {
      setShowSubscriptionAlert(true);
      return;
    }
    callback();
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title || '',
      status: p.status || 'PENDING',
      category: p.category || '',
      description: p.description || '',
      city: p.location?.city || '',
      address: p.location?.address || '',
      budgetTND: p.budgetTND ?? '',
      surfaceM2: p.surfaceM2 ?? '',
      startDate: p.startDate ? String(p.startDate).slice(0, 10) : '',
      endDate: p.endDate ? String(p.endDate).slice(0, 10) : '',
      phoneNumber: p.contactPhone || p.client?.phone || '',
      materials: p.materials || [],
    });
    setImages([]);
    setIsEditOpen(true);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = toFormData(form, images);
      await apiFetch('/projects', { token, method: 'POST', body: fd });
      setIsCreateOpen(false);
      setForm(emptyForm);
      setImages([]);
      await load();
    } catch (e2) {
      setErr(e2.message || 'Create failed');
    }
  };

  const onEdit = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      const fd = toFormData(form, images);
      await apiFetch(`/projects/${editing._id}`, { token, method: 'PUT', body: fd });
      setIsEditOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setImages([]);
      await load();
    } catch (e2) {
      setErr(e2.message || 'Update failed');
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this project?')) return;
    try {
      await apiFetch(`/projects/${id}`, { token, method: 'DELETE' });
      setOpenMenuId(null);
      await load();
    } catch (e2) {
      setErr(e2.message || 'Delete failed');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t('artisanProjects.title')}</h1>
            <p className="mt-1 text-slate-600">{t('artisanProjects.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => guardSubscription(() => setIsCreateOpen(true))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={checkingSubscription}>
              <Plus className="h-4 w-4" /> {t('artisanProjects.newProjectButton')}
            </button>
            <button onClick={() => guardSubscription(() => setIsAIOpen(true))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50" disabled={checkingSubscription}>
              <Bot className="h-4 w-4" /> Assistant IA
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('artisanProjects.searchPlaceholder')} className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none ring-indigo-500 focus:ring-2" />
          </div>
          <div className="relative">
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none ring-indigo-500 focus:ring-2">
              <option value="ALL">{t('artisanProjects.filterAllStatuses')}</option>
              <option value="ACTIVE">{t('artisanProjects.status.active')}</option>
              <option value="PENDING">{t('artisanProjects.status.pending')}</option>
              <option value="COMPLETED">{t('artisanProjects.status.completed')}</option>
            </select>
          </div>
        </div>

        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

        <div className="mt-8 space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No projects yet.</div>
          ) : (
            paginated.map((p) => {
              const cover = p.images?.[0]?.url ? `${ASSET_BASE}${p.images[0].url}` : null;
              return (
                <div key={p._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[360px,1fr]">
                    <div className="relative min-h-[260px] bg-slate-100">
                      {cover ? <img src={cover} alt={p.title} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-[260px] items-center justify-center"><ImageIcon className="h-10 w-10 text-slate-400" /></div>}
                    </div>

                    <div className="relative p-6 lg:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-semibold text-slate-900">{p.title}</h3>
                            <StatusPill status={p.status} />
                          </div>
                          {p.description ? <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{p.description}</p> : null}
                        </div>

                        <div className="relative">
                          <button type="button" onClick={() => setOpenMenuId((current) => (current === p._id ? null : p._id))} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {openMenuId === p._id ? (
                            <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                              <button type="button" onClick={() => { setViewing(p); setIsViewOpen(true); setOpenMenuId(null); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" /> View project</button>
                              <button type="button" onClick={() => guardSubscription(() => { openEdit(p); setOpenMenuId(null); })} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /> Edit project</button>
                              <button type="button" onClick={() => guardSubscription(() => { navigate('/artisan/devis/create', { state: { projectId: p._id, projectTitle: p.title } }); setOpenMenuId(null); })} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"><FileSignature className="h-4 w-4" /> Generate quote</button>
                              <button type="button" onClick={() => guardSubscription(() => { navigate('/artisan/factures/new', { state: { projectId: p._id, projectTitle: p.title } }); setOpenMenuId(null); })} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"><Receipt className="h-4 w-4" /> Generate invoice</button>
                              <button type="button" onClick={() => onDelete(p._id)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete project</button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><Calendar className="h-4 w-4" /> Start</div>
                          <div className="mt-2 text-sm font-medium text-slate-900">{formatDate(p.startDate || p.createdAt) || '—'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><MapPin className="h-4 w-4" /> Location</div>
                          <div className="mt-2 text-sm font-medium text-slate-900">{[p.location?.city, p.location?.address].filter(Boolean).join(' • ') || '—'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><Wallet className="h-4 w-4" /> Budget</div>
                          <div className="mt-2 text-sm font-medium text-slate-900">{p.budgetTND ? `${Number(p.budgetTND).toLocaleString()} TND` : '—'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><Layers3 className="h-4 w-4" /> Category</div>
                          <div className="mt-2 text-sm font-medium text-slate-900">{p.category || '—'}</div>
                        </div>
                      </div>

                      {p.materials?.length ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {p.materials.slice(0, 6).map((material, idx) => <span key={material + idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{material}</span>)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )} 
          {!loading && filtered.length > 0 ? <Pagination page={page} pages={pages} onPageChange={setPage} /> : null}
        </div>

        <Modal open={isCreateOpen} title={t('artisanProjects.newProjectButton')} onClose={() => setIsCreateOpen(false)} size="xl">
          <form onSubmit={onCreate} className="space-y-6">
            <ProjectFormFields mode="create" form={form} setForm={setForm} images={images} setImages={setImages} editing={editing} t={t} />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setIsCreateOpen(false); setForm(emptyForm); setImages([]); }} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Create</button>
            </div>
          </form>
        </Modal>

        <Modal open={isEditOpen} title="Edit project" onClose={() => setIsEditOpen(false)} size="xl">
          <form onSubmit={onEdit} className="space-y-6">
            <ProjectFormFields mode="edit" form={form} setForm={setForm} images={images} setImages={setImages} editing={editing} t={t} />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setIsEditOpen(false); setEditing(null); setForm(emptyForm); setImages([]); }} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Save</button>
            </div>
          </form>
        </Modal>

        <Modal open={isViewOpen} title={viewing?.title || 'Project details'} onClose={() => setIsViewOpen(false)} size="lg">
          <ProjectDetails project={viewing} />
        </Modal>
      </main>

      <SimpleFooter />

      <SubscriptionAlert
        isVisible={showSubscriptionAlert}
        onClose={() => setShowSubscriptionAlert(false)}
        title="Abonnement requis"
        message="Pour créer et modifier des projets, vous devez avoir un abonnement actif."
        actionText="Voir les abonnements"
        onAction={() => {
          setShowSubscriptionAlert(false);
          navigate('/artisan/subscription');
        }}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSubmit={async (projectData) => {
          try {
            const fd = new FormData();
            Object.entries(projectData).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                if (key === 'materials' && Array.isArray(value)) value.forEach((m) => fd.append('materials', m));
                else if (key === 'images' && Array.isArray(value)) value.forEach((file) => fd.append('images', file));
                else fd.append(key, value);
              }
            });
            await apiFetch('/projects', { token, method: 'POST', body: fd });
            setIsAIOpen(false);
            await load();
            return { success: true };
          } catch (error) {
            throw new Error(error.message || 'Failed to create project');
          }
        }}
      />
    </div>
  );
}

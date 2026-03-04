<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Wallet,
  Image as ImageIcon,
  Phone,
  Layers3,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

const STATUS_META = {
  ACTIVE: { tone: "bg-indigo-100 text-indigo-700", key: "artisanProjects.status.active" },
  PENDING: { tone: "bg-orange-100 text-orange-700", key: "artisanProjects.status.pending" },
  COMPLETED: { tone: "bg-emerald-100 text-emerald-700", key: "artisanProjects.status.completed" },
};

const TUNISIA_CITIES = [
  "Tunis","Ariana","Ben Arous","Manouba","Nabeul","Sousse","Monastir","Mahdia","Sfax","Kairouan","Bizerte","Beja","Jendouba","Le Kef","Siliana","Zaghouan","Kasserine","Sidi Bouzid","Gabès","Gafsa","Tozeur","Kébili","Medenine","Tataouine"
];

const PROJECT_CATEGORIES = [
  "Villa","Appartement","Bureau","Magasin","Restaurant","Immeuble","Entrepôt","Usine",
  "Rénovation","Construction neuve","Extension","Aménagement intérieur","Façade","Toiture",
  "Peinture","Plomberie","Électricité","Carrelage","Menuiserie","Climatisation","Isolation","Piscine/Jardin"
];

const MATERIAL_SUGGESTIONS = [
  "Ciment","Sable","Gravier","Brique","Parpaing","Fer","Béton","Plâtre","Peinture","Carrelage",
  "Bois","Aluminium","PVC","Verre","Isolation (laine de roche)","Isolation (polystyrène)",
  "Câble électrique","Tuyaux PVC","Tuyaux cuivre","Robinetterie","Sanitaires"
];

function SuggestInput({ label, value, onChange, placeholder, listId, options = [], required = false }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={onChange}
        list={listId}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
        placeholder={placeholder}
        required={required}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

function MaterialsPicker({ value = [], onChange, t }) {
  const [input, setInput] = useState("");

  const add = (raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    if (value.map((x) => x.toLowerCase()).includes(v.toLowerCase())) return;
    onChange([...(value || []), v].slice(0, 12));
    setInput("");
  };

  const remove = (idx) => {
    const next = (value || []).filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">Matériaux</label>

      <div className="mt-2 flex flex-wrap gap-2">
        {(value || []).map((m, idx) => (
          <span
            key={m + idx}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {m}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="rounded-full p-0.5 text-slate-500 hover:text-slate-700"
              aria-label="Remove"
            >
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
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
          placeholder="Rechercher un matériau… (Entrée pour ajouter)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Ajouter
        </button>
      </div>

      <datalist id="materials-datalist">
        {MATERIAL_SUGGESTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>

      <p className="mt-2 text-xs text-slate-500">"Vous pouvez ajouter jusqu’à 12 matériaux."</p>
    </div>
  );
}


const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>
      {t(meta.key)}
=======
import React from "react";
import {
  Search,
  MapPin,
  Calendar,
  ChevronDown,
  Plus,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from 'react-i18next';

// Composant StatusPill
const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  
  const statusConfig = {
    "Actif": {
      style: "bg-indigo-100 text-indigo-700",
      translationKey: "artisanProjects.status.active"
    },
    "En attente": {
      style: "bg-orange-100 text-orange-700",
      translationKey: "artisanProjects.status.pending"
    },
    "Terminé": {
      style: "bg-emerald-100 text-emerald-700",
      translationKey: "artisanProjects.status.completed"
    }
  };

  const config = statusConfig[status] || statusConfig["En attente"];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.style}`}>
      {t(config.translationKey)}
>>>>>>> 647f7778898b6e789d224d02d48bccf97d15a8c9
    </span>
  );
};

<<<<<<< HEAD
function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return "";
  }
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 px-6 pb-0 pt-6">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// IMPORTANT: keep this component OUTSIDE ArtisanProjects.
// If it's defined inside, React treats it as a new component on every keystroke,
// which causes inputs to unmount/remount -> focus loss ("buggy typing").
function ProjectFormFields({ mode, form, setForm, images, setImages, editing, t }) {
  const isEdit = mode === "edit";

  return (
    <>
      <div>
        <label className="text-sm font-medium text-slate-700">Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
          placeholder="e.g., Villa Ben Arous"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SuggestInput
            label="Category"
            value={form.category}
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            placeholder="Choisir une catégorie…"
            listId="project-categories"
            options={PROJECT_CATEGORIES}
          />
        <div>
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
          >
            <option value="ACTIVE">{t("artisanProjects.status.active")}</option>
            <option value="PENDING">{t("artisanProjects.status.pending")}</option>
            <option value="COMPLETED">{t("artisanProjects.status.completed")}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
          rows={4}
          placeholder="What needs to be done? Requirements, constraints, style..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SuggestInput
            label="City"
            value={form.city}
            onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
            placeholder="Choisir une ville…"
            listId="tunisia-cities"
            options={TUNISIA_CITIES}
          />
        <div>
          <label className="text-sm font-medium text-slate-700">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            placeholder="Street / neighborhood"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Budget (TND)</label>
          <input
            value={form.budgetTND}
            onChange={(e) => setForm((s) => ({ ...s, budgetTND: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            type="number"
            min="0"
            placeholder="e.g., 15000"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Surface (m²)</label>
          <input
            value={form.surfaceM2}
            onChange={(e) => setForm((s) => ({ ...s, surfaceM2: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            type="number"
            min="0"
            placeholder="e.g., 120"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Start date</label>
          <input
            value={form.startDate}
            onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            type="date"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">End date</label>
          <input
            value={form.endDate}
            onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-500 focus:ring-2"
            type="date"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Phone number</label>
        <div className="relative mt-2">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm((s) => ({ ...s, phoneNumber: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-indigo-500 focus:ring-2"
            placeholder="+216 XX XXX XXX"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">Numéro à partager avec le prescripteur pour être contacté.</p>
      </div>

      <MaterialsPicker
        value={form.materials}
        onChange={(arr) => setForm((s) => ({ ...s, materials: arr }))}
        t={t}
      />

      <div>
        <label className="text-sm font-medium text-slate-700">{isEdit ? "Add images" : "Images"} (max 6)</label>
        <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ImageIcon className="h-4 w-4" />
            <span>Upload reference photos, plans, inspiration…</span>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files || []))}
            className="mt-3 block w-full text-sm"
          />
          {images.length ? (
            <div className="mt-3 text-xs text-slate-500">Selected: {images.length} file(s)</div>
          ) : isEdit && editing?.images?.length ? (
            <div className="mt-3 text-xs text-slate-500">Existing images: {editing.images.length} (new uploads will be added)</div>
          ) : null}
        </div>
      </div>
    </>
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

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (items || []).filter((p) => {
      const okQ =
        !qq ||
        (p.title || "").toLowerCase().includes(qq) ||
        (p.category || "").toLowerCase().includes(qq) ||
        (p.location?.city || "").toLowerCase().includes(qq);
      const okS = statusFilter === "ALL" || p.status === statusFilter;
      return okQ && okS;
    });
  }, [items, q, statusFilter]);

  async function onCreate(e) {
    e.preventDefault();
    try {
      setErr("");
      const fd = toFormData(form, images);
      await apiFetch("/projects", { token, method: "POST", body: fd });
      setIsCreateOpen(false);
      setForm(emptyForm);
      setImages([]);
      await load();
    } catch (e2) {
      setErr(e2.message || "Create failed");
    }
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      title: p.title || "",
      status: p.status || "PENDING",
      category: p.category || "",
      description: p.description || "",
      city: p.location?.city || "",
      address: p.location?.address || "",
      budgetTND: p.budgetTND ?? "",
      surfaceM2: p.surfaceM2 ?? "",
      startDate: p.startDate ? String(p.startDate).slice(0, 10) : "",
      endDate: p.endDate ? String(p.endDate).slice(0, 10) : "",
      phoneNumber: p.contactPhone || p.client?.phone || "",
      materials: (p.materials || []),
    });
    setImages([]);
    setIsEditOpen(true);
  }

  async function onEdit(e) {
    e.preventDefault();
    if (!editing?._id) return;
    try {
      setErr("");
      const fd = toFormData(form, images);
      await apiFetch(`/projects/${editing._id}`, { token, method: "PUT", body: fd });
      setIsEditOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setImages([]);
      await load();
    } catch (e2) {
      setErr(e2.message || "Update failed");
    }
  }

  async function onDelete(id) {
    if (!id) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this project?");
    if (!ok) return;

    try {
      setErr("");
      await apiFetch(`/projects/${id}`, { token, method: "DELETE" });
      await load();
    } catch (e2) {
      setErr(e2.message || "Delete failed");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t("artisanProjects.title")}</h1>
            <p className="mt-1 text-slate-600">{t("artisanProjects.subtitle")}</p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t("artisanProjects.newProjectButton")}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("artisanProjects.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </div>

          <div className="relative">
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-indigo-500 focus:ring-2"
            >
              <option value="ALL">{t("artisanProjects.filterAllStatuses")}</option>
              <option value="ACTIVE">{t("artisanProjects.status.active")}</option>
              <option value="PENDING">{t("artisanProjects.status.pending")}</option>
              <option value="COMPLETED">{t("artisanProjects.status.completed")}</option>
            </select>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No projects yet.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const cover = p.images?.[0]?.url ? `${ASSET_BASE}${p.images[0].url}` : null;
                return (
                  <div
                    key={p._id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-36 w-full bg-slate-100">
                      {cover ? (
                        <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ImageIcon className="h-7 w-7" />
                        </div>
                      )}
                      <div className="absolute right-3 top-3">
                        <StatusPill status={p.status} />
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{p.title}</h3>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{t("artisanProjects.startLabel")}: {formatDate(p.startDate || p.createdAt)}</span>
                        </div>

                        {(p.location?.city || p.location?.address) ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">
                              {[p.location?.city, p.location?.address].filter(Boolean).join(" • ")}
                            </span>
                          </div>
                        ) : null}

                        {(p.budgetTND || 0) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            <span>{Number(p.budgetTND).toLocaleString()} TND</span>
                          </div>
                        ) : null}

                        {p.category ? (
                          <div className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4" />
                            <span className="line-clamp-1">{p.category}</span>
                          </div>
                        ) : null}
                      </div>

                      {p.description ? (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                      ) : null}

                      <div className="mt-5 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(p._id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Modal open={isCreateOpen} title={t("artisanProjects.newProjectButton")} onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={onCreate} className="space-y-4">
            <ProjectFormFields
              mode="create"
              form={form}
              setForm={setForm}
              images={images}
              setImages={setImages}
              editing={editing}
              t={t}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setForm(emptyForm);
                  setImages([]);
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </form>
        </Modal>

        <Modal open={isEditOpen} title="Edit project" onClose={() => setIsEditOpen(false)}>
          <form onSubmit={onEdit} className="space-y-4">
            <ProjectFormFields
              mode="edit"
              form={form}
              setForm={setForm}
              images={images}
              setImages={setImages}
              editing={editing}
              t={t}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditing(null);
                  setForm(emptyForm);
                  setImages([]);
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      </main>

      <SimpleFooter />
    </div>
  );
}
=======
// Composant BudgetBar
const BudgetBar = ({ used, total, color }) => {
  const { t } = useTranslation();
  const pct = Math.round((used / total) * 100) || 0;

  const getColorClass = () => {
    switch(color) {
      case 'completed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-slate-300';
      default:
        return 'bg-indigo-600';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">{t('artisanProjects.budgetLabel')}</span>
        <span className="text-slate-900 font-medium">
          {used.toLocaleString()} / {total.toLocaleString()} TND
        </span>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full ${getColorClass()}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <span className="text-emerald-600 font-medium">
          +{(total - used).toLocaleString()} TND
        </span>
        <span className="text-slate-500">{pct}% {t('artisanProjects.usedLabel')}</span>
      </div>
    </div>
  );
};

// Composant ProjectCard
const ProjectCard = ({ title, client, location, start, status, used, total }) => {
  const { t } = useTranslation();
  
  const getStatusColor = () => {
    switch(status) {
      case "Terminé":
        return 'completed';
      case "En attente":
        return 'pending';
      default:
        return 'active';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{client}</p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> 
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" /> 
          <span>{t('artisanProjects.startLabel')}: {start}</span>
        </div>
      </div>

      <BudgetBar used={used} total={total} color={getStatusColor()} />
    </div>
  );
};

// Composant principal
export default function ArtisanProjects() {
  const { t } = useTranslation();

  const projects = [
    {
      id: 1,
      title: "Villa Ben Arous",
      client: "Mohammed Ahmed",
      location: "Ben Arous",
      start: "15/01/2026",
      status: "Actif",
      used: 28500,
      total: 45000
    },
    {
      id: 2,
      title: "Appartement Tunis",
      client: "Fatima Ben Ali",
      location: "Tunis Centre",
      start: "01/02/2026",
      status: "Actif",
      used: 12000,
      total: 18000
    },
    {
      id: 3,
      title: "Bureau Ariana",
      client: "Tech Solutions SARL",
      location: "Ariana",
      start: "01/03/2026",
      status: "En attente",
      used: 0,
      total: 35000
    },
    {
      id: 4,
      title: "Maison Manouba",
      client: "Karim Trabelsi",
      location: "Manouba",
      start: "10/09/2025",
      status: "Terminé",
      used: 49800,
      total: 52000
    }
  ];

  return (
    <>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {t('artisanProjects.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              {t('artisanProjects.subtitle')}
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> 
            {t('artisanProjects.newProjectButton')}
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('artisanProjects.searchPlaceholder')}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="relative w-full md:w-60">
              <select className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">{t('artisanProjects.filterAllStatuses')}</option>
                <option value="Actif">{t('artisanProjects.status.active')}</option>
                <option value="En attente">{t('artisanProjects.status.pending')}</option>
                <option value="Terminé">{t('artisanProjects.status.completed')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                client={project.client}
                location={project.location}
                start={project.start}
                status={project.status}
                used={project.used}
                total={project.total}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">Aucun projet trouvé</p>
          </div>
        )}
        
        {/* Footer */}
        <SimpleFooter />
      </div>
    </>
  );
}
>>>>>>> 647f7778898b6e789d224d02d48bccf97d15a8c9

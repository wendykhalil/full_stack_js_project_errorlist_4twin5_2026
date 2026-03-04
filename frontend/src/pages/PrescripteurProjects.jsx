import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Calendar,
  User2,
  MapPin,
  Wallet,
  Image as ImageIcon,
  Layers3,
  Eye,
  PhoneCall,
  X,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

const STATUS_META = {
  ACTIVE: { tone: "bg-indigo-100 text-indigo-700", key: "artisanProjects.status.active", fallback: "Active" },
  PENDING: { tone: "bg-orange-100 text-orange-700", key: "artisanProjects.status.pending", fallback: "Pending" },
  COMPLETED: { tone: "bg-emerald-100 text-emerald-700", key: "artisanProjects.status.completed", fallback: "Completed" },
};

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  const label = (() => {
    const v = t(meta.key);
    return v && v !== meta.key ? v : meta.fallback;
  })();

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>
      {label}
    </span>
  );
};

function DetailsModal({ open, onClose, project }) {
  const { t } = useTranslation();
  if (!open || !project) return null;

  // Translation fallback helper: if key missing, show fallback
  const tt = (key, fallback) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  const cover = project.images?.[0]?.url ? `${ASSET_BASE}${project.images[0].url}` : null;

  const artisanFullName =
    `${project.artisanId?.firstName || ""} ${project.artisanId?.lastName || ""}`.trim() ||
    project.artisanName ||
    project.artisan?.name ||
    "—";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6">
      <div className="mt-6 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{project.title || "—"}</h3>
            <p className="text-sm text-slate-500">
              {project.category || "—"} • {project.location?.city || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5">
          {cover ? (
            <img
              src={cover}
              alt="cover"
              className="mb-4 max-h-64 w-full rounded-2xl object-contain bg-slate-50"
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.statusLabel", "Status")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{project.status || "—"}</p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.budget", "Budget")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {project.budgetTND ? `${Number(project.budgetTND).toLocaleString()} TND` : "—"}
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.surface", "Surface")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {project.surfaceM2 ? `${project.surfaceM2} m²` : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.artisan", "Artisan")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{artisanFullName}</p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.dates", "Dates")}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.address", "Address")}
              </p>
              <p className="mt-1 text-sm text-slate-700">{project.location?.address || "—"}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tt("artisanProjects.description", "Description")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {project.description || "—"}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {tt("artisanProjects.materials", "Materials")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(project.materials || []).length ? (
                project.materials.map((m, idx) => (
                  <span
                    key={`${m}-${idx}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                  >
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </div>
          </div>

          {(project.images || []).length > 1 ? (
            <div className="mt-4 rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tt("artisanProjects.images", "Images")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.images.slice(0, 6).map((img, idx) => (
                  <img
                    key={`${img.url || "img"}-${idx}`}
                    src={`${ASSET_BASE}${img.url}`}
                    alt={img.originalName || "project"}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-end">
          <a
            href={project.contactPhone ? `tel:${project.contactPhone}` : undefined}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              project.contactPhone
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-400"
            }`}
            onClick={(e) => {
              if (!project.contactPhone) e.preventDefault();
            }}
          >
            <PhoneCall className="h-4 w-4" />
            Contacter
          </a>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PrescripteurProjects() {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const data = await apiFetch("/projects", { token });
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
      if (!qq) return true;
      const title = (p.title || "").toLowerCase();
      const artisanName = `${p.artisanId?.firstName || ""} ${p.artisanId?.lastName || ""}`.trim().toLowerCase();
      const city = (p.location?.city || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return title.includes(qq) || artisanName.includes(qq) || city.includes(qq) || category.includes(qq);
    });
  }, [items, q]);

  const openDetails = (project) => {
    setSelected(project);
    setDetailsOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projets</h1>
          <p className="mt-1 text-slate-600">Tous les projets créés par les artisans.</p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par titre, artisan, ville, catégorie..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No projects found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const name =
                  `${p.artisanId?.firstName || ""} ${p.artisanId?.lastName || ""}`.trim() || "—";
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
                      <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
                        {p.title}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User2 className="h-4 w-4" />
                          <span className="line-clamp-1">{name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {t("artisanProjects.startLabel")}: {formatDate(p.startDate || p.createdAt)}
                          </span>
                        </div>

                        {p.location?.city ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{p.location.city}</span>
                          </div>
                        ) : null}

                        {p.category ? (
                          <div className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4" />
                            <span className="line-clamp-1">{p.category}</span>
                          </div>
                        ) : null}

                        {/* ✅ FIXED budget conditional */}
                        {(Number(p.budgetTND) || 0) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            <span>{Number(p.budgetTND).toLocaleString()} TND</span>
                          </div>
                        ) : null}
                      </div>

                      {p.description ? (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                      ) : null}

                      {/* ✅ Action buttons */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => openDetails(p)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          <Eye className="h-4 w-4" />
                          Voir détails
                        </button>

                        <a
                          href={p.contactPhone ? `tel:${p.contactPhone}` : undefined}
                          onClick={(e) => {
                            if (!p.contactPhone) e.preventDefault();
                          }}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                            p.contactPhone
                              ? "bg-slate-900 text-white hover:bg-slate-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <PhoneCall className="h-4 w-4" />
                          Contacter
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <DetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} project={selected} />

      <SimpleFooter />
    </div>
  );
}
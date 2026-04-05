import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  MessageCircle,
  MoreVertical,
  X,
  ArrowRight,
} from "lucide-react";
import SimpleFooter from "../components/Footer";
import Pagination from "../components/Pagination";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import PageShell from '../components/PageShell';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");


function resolveAssetUrl(path) {
  if (!path) return "";
  const value = String(path).trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return value.startsWith("/") ? `${ASSET_BASE}${value}` : `${ASSET_BASE}/${value}`;
}

function normalizeImageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") return resolveAssetUrl(image);
  return resolveAssetUrl(image.url || image.path || image.secure_url || "");
}

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

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{label}</span>;
};

function ActionMenu({ open, onToggle, onView, onMessage, onCall, canMessage, canCall }) {
  return (
    <PageShell>
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
        aria-label="Project actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button onClick={(e) => { e.stopPropagation(); onView(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Eye className="h-4 w-4" />
            Voir détails
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMessage(); }}
            disabled={!canMessage}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
              canMessage ? "text-slate-700 hover:bg-slate-50" : "cursor-not-allowed text-slate-400"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCall(); }}
            disabled={!canCall}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
              canCall ? "text-slate-700 hover:bg-slate-50" : "cursor-not-allowed text-slate-400"
            }`}
          >
            <PhoneCall className="h-4 w-4" />
            Contacter
          </button>
        </div>
      ) : null}
    </div>
    </PageShell>
  );
}

function DetailsModal({ open, onClose, project, onMessage }) {
  const { t } = useTranslation();
  if (!open || !project) return null;

  const tt = (key, fallback) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
  const cover = normalizeImageUrl(images[0]);
  const artisanFullName =
    `${project.artisanId?.firstName || ""} ${project.artisanId?.lastName || ""}`.trim() ||
    project.artisanName ||
    project.artisan?.name ||
    "—";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6">
      <div className="mt-4 w-full max-w-none overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusPill status={project.status} />
              {project.category ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{project.category}</span> : null}
            </div>
            <h3 className="text-2xl font-semibold text-slate-900">{project.title || "—"}</h3>
            <p className="mt-1 text-sm text-slate-500">{project.location?.city || "—"} • {artisanFullName}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6">
          <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
            <div>
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                {cover ? (
                  <img src={cover} alt="cover" className="h-[360px] w-full object-cover" />
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-slate-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              {images.length > 1 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.slice(0, 8).map((img, idx) => (
                    <div key={`${img.url || "img"}-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <img src={normalizeImageUrl(img)} alt={img.originalName || "project"} className="h-28 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Overview</h4>
                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tt("artisanProjects.budget", "Budget")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{project.budgetTND ? `${Number(project.budgetTND).toLocaleString()} TND` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tt("artisanProjects.surface", "Surface")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{project.surfaceM2 ? `${project.surfaceM2} m²` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tt("artisanProjects.dates", "Dates")}</p>
                    <p className="mt-1 text-sm text-slate-700">{formatDate(project.startDate)} → {formatDate(project.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tt("artisanProjects.address", "Address")}</p>
                    <p className="mt-1 text-sm text-slate-700">{project.location?.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tt("artisanProjects.artisan", "Artisan")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{artisanFullName}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Materials</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(project.materials || []).length ? (
                    project.materials.map((m, idx) => (
                      <span key={`${m}-${idx}`} className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200">
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3">
                  <a
                    href={project.contactPhone ? `tel:${project.contactPhone}` : undefined}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                      project.contactPhone ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-400"
                    }`}
                    onClick={(e) => {
                      if (!project.contactPhone) e.preventDefault();
                    }}
                  >
                    <PhoneCall className="h-4 w-4" />
                    Contacter
                  </a>
                  <button
                    type="button"
                    onClick={onMessage}
                    disabled={!project.artisanId?._id}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                      project.artisanId?._id ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-100 text-indigo-300"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{tt("artisanProjects.description", "Description")}</h4>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{project.description || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onView, onMessage, activeMenuId, setActiveMenuId }) {
  const { t } = useTranslation();
  const name = `${project.artisanId?.firstName || ""} ${project.artisanId?.lastName || ""}`.trim() || "—";
  const cover = normalizeImageUrl(project.images?.[0]);
  const menuOpen = activeMenuId === project._id;

  return (
    <div className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-52 w-full bg-slate-100">
        {cover ? (
          <img src={cover} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-4 top-4">
          <StatusPill status={project.status} />
        </div>
        <div className="absolute right-4 top-4">
          <ActionMenu
            open={menuOpen}
            onToggle={() => setActiveMenuId(menuOpen ? null : project._id)}
            onView={() => {
              setActiveMenuId(null);
              onView(project);
            }}
            onMessage={() => {
              setActiveMenuId(null);
              onMessage(project);
            }}
            onCall={() => {
              setActiveMenuId(null);
              if (project.contactPhone) window.location.href = `tel:${project.contactPhone}`;
            }}
            canMessage={Boolean(project.artisanId?._id)}
            canCall={Boolean(project.contactPhone)}
          />
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-1 text-xl font-semibold text-slate-900">{project.title}</h3>
            {project.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <User2 className="h-4 w-4" />
            <span className="line-clamp-1">{name}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.startDate || project.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{project.location?.city || "—"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <Layers3 className="h-4 w-4" />
            <span className="line-clamp-1">{project.category || "—"}</span>
          </div>
          {(Number(project.budgetTND) || 0) > 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-2">
              <Wallet className="h-4 w-4" />
              <span>{Number(project.budgetTND).toLocaleString()} TND</span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end">
          <div className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
            Ouvrir le menu
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrescripteurProjects() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 6;

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const data = await apiFetch("/projects", { token });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const close = () => setActiveMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
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

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const openDetails = (project) => {
    setSelected(project);
    setDetailsOpen(true);
  };

  const handleMessage = (project) => {
    const artisanId = project?.artisanId?._id;
    if (!artisanId) return;
    navigate(`/prescripteur/messages/${artisanId}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="mx-auto w-full max-w-none flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projets</h1>
          <p className="mt-1 text-slate-600">Tous les projets créés par les artisans, avec plus de détails pour une lecture plus facile.</p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par titre, artisan, ville, catégorie..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
          </div>
        </div>

        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No projects found.</div>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                {paginated.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onView={openDetails}
                    onMessage={handleMessage}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                  />
                ))}
              </div>
              <Pagination page={page} pages={pages} onPageChange={setPage} />
            </>
          )}
        </div>
      </main>

      <DetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        project={selected}
        onMessage={() => handleMessage(selected)}
      />

      <SimpleFooter />
    </div>
  );
}
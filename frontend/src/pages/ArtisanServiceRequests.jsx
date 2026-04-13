import React, { useEffect, useState } from "react";
import { Briefcase, MapPin, Wallet, Calendar, X, ChevronRight, Clock, UserCircle2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import PageShell from "../components/PageShell";
import ReviewModal from "../components/ReviewModal";
import { Stars } from "../components/StarRating";
import ReviewsList from "../components/ReviewsList";
import {
  getOpenServiceRequests, getOpenServiceRequest,
  applyToServiceRequest, getMyApplications,
  getReviewsForUser,
} from "../auth/api";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function resolveAvatar(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function Avatar({ src, name, size = "md" }) {
  const [broken, setBroken] = useState(false);
  const url = resolveAvatar(src);
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  if (url && !broken) {
    return (
      <img src={url} alt={name} onError={() => setBroken(true)}
        className={`${dim} rounded-full object-cover shrink-0 border border-slate-200`} />
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

const APP_STATUS_STYLE = {
  PENDING: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function RequestCard({ item, onView }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar src={item.prescripteur?.profilePicture} name={`${item.prescripteur?.firstName} ${item.prescripteur?.lastName}`} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
              {item.hasApplied && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Candidature envoyée</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{item.prescripteur?.firstName} {item.prescripteur?.lastName}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{item.trade}</span>
              {item.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.city}</span>}
              {item.budgetTND > 0 && <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{item.budgetTND.toLocaleString()} TND</span>}
              {item.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(item.deadline).toLocaleDateString()}</span>}
            </div>
            {item.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.description}</p>}
            <p className="mt-2 text-xs text-slate-400">{item.applicationsCount} candidature(s)</p>
          </div>
        </div>
        <button onClick={() => onView(item._id)}
          className="shrink-0 rounded-xl border border-slate-200 p-2 hover:bg-indigo-50 hover:border-indigo-200">
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

export default function ArtisanServiceRequests() {
  const { token } = useAuth();
  const [tab, setTab] = useState("browse"); // browse | applications
  const [items, setItems] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyPrice, setApplyPrice] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSourceId, setReviewSourceId] = useState(null);
  const [prescripteurRating, setPrescripteurRating] = useState(null);

  async function loadOpen() {
    try {
      setLoading(true);
      const res = await getOpenServiceRequests({ token, trade: tradeFilter, city: cityFilter });
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyApps() {
    try {
      setLoading(true);
      const res = await getMyApplications({ token });
      setMyApps(res.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "browse") loadOpen();
    else loadMyApps();
  }, [tab, tradeFilter, cityFilter]);

  async function openDetail(id) {
    try {
      setDetailLoading(true);
      setApplySuccess(false);
      setApplyMsg("");
      setApplyPrice("");
      setPrescripteurRating(null);
      const res = await getOpenServiceRequest({ token, id });
      setDetail(res.serviceRequest);
      // Fetch prescripteur rating
      if (res.serviceRequest?.prescripteur?._id) {
        getReviewsForUser({ userId: String(res.serviceRequest.prescripteur._id) })
          .then(r => setPrescripteurRating({ avg: r.avgRating, total: r.total }))
          .catch(() => {});
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleApply(e) {
    e.preventDefault();
    try {
      setApplying(true);
      await applyToServiceRequest({ token, id: detail._id, message: applyMsg, proposedPrice: applyPrice ? Number(applyPrice) : undefined });
      setApplySuccess(true);
      loadOpen();
    } catch (e) {
      setErr(e.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <PageShell title="Demandes de service">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandes de service</h1>
          <p className="mt-1 text-sm text-slate-500">Trouvez des missions publiées par des prescripteurs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
          {[{ key: "browse", label: "Offres disponibles" }, { key: "applications", label: "Mes candidatures" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {err && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>}

        {tab === "browse" && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select value={tradeFilter} onChange={e => setTradeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Tous les métiers</option>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                list="cities-filter" placeholder="Filtrer par ville…"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              <datalist id="cities-filter">{TUNISIA_CITIES.map(c => <option key={c} value={c} />)}</datalist>
              {(tradeFilter || cityFilter) && (
                <button onClick={() => { setTradeFilter(""); setCityFilter(""); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
                  Réinitialiser
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400">Chargement…</div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
                <p className="text-slate-500">Aucune demande disponible pour votre profil.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => <RequestCard key={item._id} item={item} onView={openDetail} />)}
              </div>
            )}
          </>
        )}

        {tab === "applications" && (
          loading ? (
            <div className="py-16 text-center text-slate-400">Chargement…</div>
          ) : myApps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
              <p className="text-slate-500">Vous n'avez pas encore postulé à des demandes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map(item => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{item.trade}</span>
                        {item.city && <span>📍 {item.city}</span>}
                        {item.budgetTND > 0 && <span>💰 {item.budgetTND.toLocaleString()} TND</span>}
                      </div>
                      {item.application?.message && (
                        <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{item.application.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${APP_STATUS_STYLE[item.application?.status]}`}>
                        {item.application?.status}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{new Date(item.application?.appliedAt).toLocaleDateString()}
                      </span>
                      {item.status === "COMPLETED" && item.application?.status === "ACCEPTED" && (
                        <button
                          onClick={() => {
                            setReviewSourceId(item._id);
                            setReviewTarget({ ...item.prescripteur, targetType: "PRESCRIPTEUR" });
                          }}
                          className="mt-1 rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100">
                          ⭐ Laisser un avis
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Detail & Apply Modal */}
      <Modal open={!!detail} title="Détail de la demande" onClose={() => setDetail(null)}>
        {detailLoading ? (
          <div className="py-8 text-center text-slate-400">Chargement…</div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Avatar src={detail.prescripteur?.profilePicture} name={`${detail.prescripteur?.firstName} ${detail.prescripteur?.lastName}`} size="md" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">{detail.prescripteur?.firstName} {detail.prescripteur?.lastName}</p>
                  <p className="text-xs text-slate-400">Prescripteur</p>
                  {prescripteurRating?.total > 0 ? (
                    <Stars rating={prescripteurRating.avg} total={prescripteurRating.total} />
                  ) : (
                    <p className="text-xs text-slate-400">Pas encore d'avis</p>
                  )}
                </div>
              </div>
              <h4 className="font-semibold text-slate-900 text-base">{detail.title}</h4>
              {detail.description && <p className="text-sm text-slate-600">{detail.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{detail.trade}</span>
                {detail.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{detail.city}</span>}
                {detail.budgetTND > 0 && <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{detail.budgetTND.toLocaleString()} TND</span>}
                {detail.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(detail.deadline).toLocaleDateString()}</span>}
              </div>
            </div>

            {applySuccess ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-center">
                <p className="font-semibold text-emerald-700">Candidature envoyée avec succès !</p>
                <p className="text-sm text-emerald-600 mt-1">Le prescripteur examinera votre profil.</p>
              </div>
            ) : detail.hasApplied ? (
              <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-700">
                Vous avez déjà postulé à cette demande.
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <h4 className="font-semibold text-slate-800">Postuler</h4>
                <div>
                  <label className="text-sm font-medium text-slate-700">Message (optionnel)</label>
                  <textarea value={applyMsg} onChange={e => setApplyMsg(e.target.value)} rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Présentez-vous et expliquez pourquoi vous êtes le bon choix…" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Prix proposé (TND, optionnel)</label>
                  <input value={applyPrice} onChange={e => setApplyPrice(e.target.value)} type="number" min="0"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: 2500" />
                </div>
                <button type="submit" disabled={applying}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {applying ? "Envoi…" : "Envoyer ma candidature"}
                </button>
              </form>
            )}
          </div>
        ) : null}
      </Modal>

      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onDone={() => loadMyApps()}
        target={reviewTarget}
        sourceId={reviewSourceId}
      />
    </PageShell>
  );
}

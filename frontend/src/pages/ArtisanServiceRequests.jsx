import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, Wallet, Calendar, X, ChevronRight, Clock, ExternalLink, Undo2, CheckCircle2, XCircle } from "lucide-react";
import ReadCardButton from '../components/ReadCardButton';
import { useAuth } from "../auth/AuthContext";
import PageShell from "../components/PageShell";
import SimpleFooter from "../components/Footer";
import ReviewModal from "../components/ReviewModal";
import { Stars } from "../components/StarRating";
import { getOpenServiceRequests, getOpenServiceRequest, applyToServiceRequest, withdrawApplication, getMyApplications, getReviewsForUser } from "../auth/api";
import { useFormValidation, rules } from "../hooks/useFormValidation";
import { useServerErrors } from "../hooks/useServerErrors";
import FieldError from "../components/FieldError";
import { Hint } from "../components/MouseTooltip";

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
  const initials = (name || "")
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  if (url && !broken) {
    return <img src={url} alt={name} onError={() => setBroken(true)}
      className={`${dim} rounded-full object-cover shrink-0 border border-slate-200`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600 shrink-0`}>
      {initials}
    </div>
  );
}

const TRADES = ["Plombier","ï¿½lectricien","Maï¿½on","Peintre","Menuisier","Carreleur","Chauffagiste","Climatisation","Jardinier","Autre"];
const TUNISIA_CITIES = ["Tunis","Ariana","Ben Arous","Manouba","Nabeul","Sousse","Monastir","Mahdia","Sfax","Kairouan","Bizerte","Beja","Jendouba","Le Kef","Siliana","Zaghouan","Kasserine","Sidi Bouzid","Gabï¿½s","Gafsa","Tozeur","Kï¿½bili","Medenine","Tataouine"];

const APP_STATUS_STYLE = {
  PENDING:  "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

const APP_STATUS_LABEL = {
  PENDING:  "En attente",
  ACCEPTED: "Acceptï¿½e",
  REJECTED: "Non retenue",
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
          <Avatar
            src={item.prescripteur?.profilePicture}
            name={`${item.prescripteur?.firstName} ${item.prescripteur?.lastName}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
              {item.hasApplied && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  Candidature envoyï¿½e
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {item.prescripteur?.firstName} {item.prescripteur?.lastName}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{item.trade}</span>
              {item.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.city}</span>}
              {item.budgetTND > 0 && <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{item.budgetTND.toLocaleString()} TND</span>}
              {item.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(item.deadline).toLocaleDateString()}</span>}
            </div>
            {item.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.description}</p>}
            <p className="mt-2 text-xs text-slate-400">{item.applicationsCount} candidat(s){item.maxApplicants ? <span className="ml-1 font-medium text-indigo-600">/ {item.maxApplicants} max{item.applicationsCount >= item.maxApplicants ? " ï¿½ Complet" : ""}</span> : ""}</p>
          </div>
        </div>
        <button
          onClick={() => onView(item._id)}
          className="shrink-0 rounded-xl border border-slate-200 p-2 hover:bg-indigo-50 hover:border-indigo-200"
        >
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

export default function ArtisanServiceRequests() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("browse");
  const [items, setItems] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // -- #5 Pagination ----------------------------------------------------------
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyPrice, setApplyPrice] = useState("");
  const [applying, setApplying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyWarning, setApplyWarning] = useState(null);
  const [prescripteurRating, setPrescripteurRating] = useState(null);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSourceId, setReviewSourceId] = useState(null);

  const { errors: applyFormErrors, validate: validateApply } = useFormValidation({
    applyPrice: [rules.required("Le prix proposï¿½ est obligatoire"), rules.positiveNumber("Doit ï¿½tre un nombre positif")],
    applyMsg: [rules.maxLength(500)],
  });
  const {
    fieldErrors: applyServerErrors,
    globalError: applyGlobalError,
    handleError: handleApplyError,
    clearErrors: clearApplyErrors,
  } = useServerErrors();

  // -- Loaders ----------------------------------------------------------------

  const loadOpen = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOpenServiceRequests({ token, trade: tradeFilter, city: cityFilter, page, limit: LIMIT });
      setItems(res.items || []);
      const tp = res.total ? Math.ceil(res.total / LIMIT) : 1;
      setTotalPages(Math.max(1, tp));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, tradeFilter, cityFilter, page]);

  const loadMyApps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyApplications({ token });
      setMyApps(res.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "browse") loadOpen();
    else loadMyApps();
  }, [tab, loadOpen, loadMyApps]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [tradeFilter, cityFilter, tab]);

  // -- #2 Real-time refresh: listen for notification events ----------------------------------------------------------------
  useEffect(() => {
    function handleNotif(e) {
      const type = e?.detail?.type || "";
      if (["APPLICATION_ACCEPTED", "APPLICATION_REJECTED"].includes(type)) {
        // Refresh whichever tab is active
        if (tab === "browse") loadOpen();
        else loadMyApps();
      }
    }
    window.addEventListener("notif:refresh", handleNotif);
    return () => window.removeEventListener("notif:refresh", handleNotif);
  }, [tab, loadOpen, loadMyApps]);

  // -- Detail modal ----------------------------------------------------------------

  async function openDetail(id) {
    try {
      setDetailLoading(true);
      setApplySuccess(false);
      setApplyMsg("");
      setApplyPrice("");
      setApplyWarning(null);
      setPrescripteurRating(null);
      clearApplyErrors();
      const res = await getOpenServiceRequest({ token, id });
      setDetail(res.serviceRequest);
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

  // -- Apply ----------------------------------------------------------------

  async function handleApply(e) {
    e.preventDefault();
    clearApplyErrors();
    if (!validateApply({ applyPrice, applyMsg })) return;
    try {
      setApplying(true);
      const res = await applyToServiceRequest({
        token, id: detail._id,
        message: applyMsg,
        proposedPrice: Number(applyPrice),
      });
      setApplySuccess(true);
      setApplyWarning(res?.availabilityWarning || null);
      // Update hasApplied in the list immediately (#5 duplicate guard)
      setItems(prev => prev.map(i => i._id === detail._id ? { ...i, hasApplied: true } : i));
      setDetail(prev => ({ ...prev, hasApplied: true }));
    } catch (e) {
      handleApplyError(e);
    } finally {
      setApplying(false);
    }
  }

  // -- #1 Withdraw ----------------------------------------------------------------

  async function handleWithdraw() {
    if (!window.confirm("Retirer votre candidature pour cette demande ?")) return;
    try {
      setWithdrawing(true);
      await withdrawApplication({ token, id: detail._id });
      // Update list and detail immediately
      setItems(prev => prev.map(i => i._id === detail._id ? { ...i, hasApplied: false, applicationsCount: Math.max(0, (i.applicationsCount || 1) - 1) } : i));
      setDetail(prev => ({ ...prev, hasApplied: false, myApplication: null }));
      setApplySuccess(false);
      loadMyApps();
    } catch (e) {
      setErr(e.message);
    } finally {
      setWithdrawing(false);
    }
  }

  // -- Render ----------------------------------------------------------------

  const pendingCount = myApps.filter(a => a.application?.status === "PENDING").length;

  return (
    <PageShell title="Demandes de service">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandes de service</h1>
          <p className="mt-1 text-sm text-slate-500">Trouvez des missions publiï¿½es par des prescripteurs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
          {[
            { key: "browse", label: "Offres disponibles" },
            { key: "applications", label: "Mes candidatures", badge: pendingCount },
          ].map(t => (
            <Hint key={t.key} text={t.key === 'browse' ? 'Parcourir les missions disponibles correspondant ï¿½ votre mï¿½tier.' : 'Voir l\'\u00e9tat de vos candidatures envoy\u00e9es aux prescripteurs.'}>
            <button
              onClick={() => setTab(t.key)}
              className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              )}
            </button>
            </Hint>
          ))}
        </div>

        {err && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            {err}
            <button onClick={() => setErr("")}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* -- Browse tab -- */}
        {tab === "browse" && (
          <>
            <div className="flex flex-wrap gap-3">
              <Hint text="Filtrer les missions par corps de mï¿½tier (plombier, ï¿½lectricien, maï¿½on...).">
              <select
                value={tradeFilter}
                onChange={e => setTradeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les mï¿½tiers</option>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              </Hint>
              <Hint text="Filtrer les missions par ville ou rï¿½gion en Tunisie.">
              <input
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                list="cities-filter"
                placeholder="Filtrer par villeï¿½"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              </Hint>
              <datalist id="cities-filter">{TUNISIA_CITIES.map(c => <option key={c} value={c} />)}</datalist>
              {(tradeFilter || cityFilter) && (
                <Hint text="Effacer tous les filtres actifs et afficher toutes les missions.">
                <button
                  onClick={() => { setTradeFilter(""); setCityFilter(""); }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
                >
                  Rï¿½initialiser
                </button>
                </Hint>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400">Chargementï¿½</div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
                <p className="text-slate-500">Aucune demande disponible pour votre profil.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => <RequestCard key={item._id} item={item} onView={openDetail} />)}
                {/* -- #5 Pagination -- */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Prï¿½cï¿½dent
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* -- My applications tab -- */}
        {tab === "applications" && (
          loading ? (
            <div className="py-16 text-center text-slate-400">Chargementï¿½</div>
          ) : myApps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center">
              <p className="text-slate-500">Vous n'avez pas encore postulï¿½ ï¿½ des demandes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map(item => (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <ReadCardButton />
                      </div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{item.trade}</span>
                        {item.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>}
                        {item.budgetTND > 0 && <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />{item.budgetTND.toLocaleString()} TND</span>}
                      </div>
                      {item.application?.message && (
                        <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 italic">
                          "{item.application.message}"
                        </p>
                      )}
                      {item.application?.proposedPrice && (
                        <p className="mt-1 text-xs text-slate-500">
                          Prix proposï¿½ : <span className="font-semibold">{item.application.proposedPrice.toLocaleString()} TND</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${APP_STATUS_STYLE[item.application?.status]}`}>
                        {APP_STATUS_LABEL[item.application?.status] || item.application?.status}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.application?.appliedAt).toLocaleDateString()}
                      </span>
                      {/* Review button */}
                      {(item.status === "COMPLETED" || item.status === "ASSIGNED") &&
                        item.application?.status === "ACCEPTED" &&
                        !item.alreadyReviewed && (
                          <button
                            onClick={() => {
                              setReviewSourceId(item._id);
                              setReviewTarget({ ...item.prescripteur, targetType: "PRESCRIPTEUR" });
                            }}
                            className="rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                          >
                            ? Laisser un avis
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

      {/* -- Detail & Apply Modal -- */}
      <Modal open={!!detail} title="Dï¿½tail de la demande" onClose={() => setDetail(null)}>
        {detailLoading ? (
          <div className="py-8 text-center text-slate-400">Chargementï¿½</div>
        ) : detail ? (
          <div className="space-y-5">

            {/* Prescripteur info */}
            <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={detail.prescripteur?.profilePicture}
                  name={`${detail.prescripteur?.firstName} ${detail.prescripteur?.lastName}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">
                    {detail.prescripteur?.firstName} {detail.prescripteur?.lastName}
                  </p>
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

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{detail.trade}</span>
                {detail.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{detail.city}</span>}
                {detail.budgetTND > 0 && <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{detail.budgetTND.toLocaleString()} TND</span>}
                {detail.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(detail.deadline).toLocaleDateString()}</span>}
                {detail.maxApplicants && <span className="ml-1 text-indigo-600">(max {detail.maxApplicants})</span>}
              </div>
            </div>

            {/* -- Apply / already applied / success -- */}
            {applySuccess ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-center space-y-1">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="font-semibold text-emerald-700">Candidature envoyï¿½e !</p>
                  <p className="text-sm text-emerald-600">Le prescripteur examinera votre profil.</p>
                </div>
                {applyWarning && (
                  <div className="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700 flex items-start gap-2">
                    <span className="text-lg leading-none">??</span>
                    <span>{applyWarning}</span>
                  </div>
                )}
              </div>

            ) : detail.hasApplied ? (
              /* #1 -- Already applied: show withdraw option */
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">Vous avez dï¿½jï¿½ postulï¿½ ï¿½ cette demande.</p>
                </div>
                {detail.myApplication?.message && (
                  <p className="text-sm text-slate-600 italic bg-white rounded-xl px-3 py-2">
                    "{detail.myApplication.message}"
                  </p>
                )}
                {detail.myApplication?.proposedPrice && (
                  <p className="text-xs text-slate-500">
                    Prix proposï¿½ : <span className="font-semibold">{detail.myApplication.proposedPrice.toLocaleString()} TND</span>
                  </p>
                )}
                {detail.myApplication?.status === "PENDING" && (
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Undo2 className="h-4 w-4" />
                    {withdrawing ? "Retraitï¿½" : "Retirer ma candidature"}
                  </button>
                )}
              </div>

            ) : (
              /* Apply form */
              <form onSubmit={handleApply} className="space-y-4">
                <h4 className="font-semibold text-slate-800">Postuler</h4>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Prix proposï¿½ (TND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={applyPrice}
                    onChange={e => setApplyPrice(e.target.value)}
                    className={`mt-1 w-full rounded-xl border ${
                      applyFormErrors.applyPrice || applyServerErrors.applyPrice ? "border-red-400" : "border-slate-200"
                    } px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Ex: 2500"
                  />
                  <FieldError error={applyFormErrors.applyPrice || applyServerErrors.applyPrice} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Message (optionnel)</label>
                  <textarea
                    value={applyMsg}
                    onChange={e => setApplyMsg(e.target.value)}
                    rows={3}
                    className={`mt-1 w-full rounded-xl border ${
                      applyFormErrors.applyMsg || applyServerErrors.applyMsg ? "border-red-400" : "border-slate-200"
                    } px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Prï¿½sentez-vous et expliquez pourquoi vous ï¿½tes le bon choixï¿½"
                  />
                  <FieldError error={applyFormErrors.applyMsg || applyServerErrors.applyMsg} />
                </div>
                {applyGlobalError && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{applyGlobalError}</div>
                )}
                <button
                  type="submit"
                  disabled={applying}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {applying ? "Envoiï¿½" : "Envoyer ma candidature"}
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







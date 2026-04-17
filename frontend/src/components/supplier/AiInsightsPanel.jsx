import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  WifiOff,
  X,
} from 'lucide-react';
import { getSupplierAiInsights, postSupplierAiRetrain } from '../../auth/api';

// ── Label config ──────────────────────────────────────────────────────────────
const LABEL_META = {
  BEST_SELLER: {
    icon:   <TrendingUp className="h-4 w-4" />,
    color:  'text-emerald-700',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
    badge:  'bg-emerald-100 text-emerald-700',
    title:  '🔥 Meilleurs produits',
    empty:  'Aucun best-seller détecté pour le moment.',
  },
  RESTOCK: {
    icon:   <AlertTriangle className="h-4 w-4" />,
    color:  'text-amber-700',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
    badge:  'bg-amber-100 text-amber-700',
    title:  '⚠️ À réapprovisionner',
    empty:  'Aucun produit en rupture imminente.',
  },
  UNDERPERFORMING: {
    icon:   <TrendingDown className="h-4 w-4" />,
    color:  'text-red-700',
    bg:     'bg-red-50',
    border: 'border-red-200',
    badge:  'bg-red-100 text-red-700',
    title:  '📉 Sous-performants',
    empty:  'Tous vos produits performent correctement.',
  },
  NORMAL: {
    icon:   <CheckCircle2 className="h-4 w-4" />,
    color:  'text-slate-600',
    bg:     'bg-slate-50',
    border: 'border-slate-200',
    badge:  'bg-slate-100 text-slate-600',
    title:  '✅ Stables',
    empty:  'Aucun produit dans cette catégorie.',
  },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const styles = {
    success: 'bg-emerald-600 text-white',
    error:   'bg-red-600 text-white',
    info:    'bg-indigo-600 text-white',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl ${styles[toast.type] ?? styles.info}`}>
      {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
      {toast.type === 'error'   && <X className="h-4 w-4 shrink-0" />}
      {toast.type === 'info'    && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const pct   = Math.round(value * 100);
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-400' : 'bg-slate-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">{pct}%</span>
    </div>
  );
}

// ── Product row ───────────────────────────────────────────────────────────────
function ProductRow({ item, meta }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border ${meta.border} ${meta.bg} p-3`}>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">?</div>
        }
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{item.productName}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.badge}`}>{item.label}</span>
        </div>

        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>💰 {item.price?.toFixed(2)} TND</span>
          <span>📦 Stock: {item.stock}</span>
          <span>🛒 Commandes: {item.orders}</span>
          {item.rating > 0 && <span>⭐ {item.rating?.toFixed(1)}</span>}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-xs text-slate-400">Confiance :</span>
          <ConfidenceBar value={item.confidence} />
        </div>

        <p className={`mt-1.5 text-xs leading-relaxed ${meta.color}`}>{item.recommendation}</p>
      </div>
    </div>
  );
}

// ── Label section ─────────────────────────────────────────────────────────────
function LabelSection({ label, items }) {
  const meta = LABEL_META[label];
  const [open, setOpen] = useState(label !== 'NORMAL');

  return (
    <div className={`overflow-hidden rounded-2xl border ${meta.border}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between px-5 py-3.5 ${meta.bg} transition-opacity hover:opacity-90`}
      >
        <div className="flex items-center gap-2">
          <span className={meta.color}>{meta.icon}</span>
          <span className={`text-sm font-semibold ${meta.color}`}>{meta.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.badge}`}>{items.length}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-2 bg-white px-4 py-3">
          {items.length === 0
            ? <p className="py-3 text-center text-sm text-slate-400">{meta.empty}</p>
            : items.map(item => <ProductRow key={item.productId} item={item} meta={meta} />)
          }
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AiInsightsPanel({ token }) {
  const [state,    setState]    = useState('idle'); // idle|loading|ready|error|unavailable
  const [data,     setData]     = useState(null);
  const [error,    setError]    = useState('');
  const [training, setTraining] = useState(false);
  const [trainMeta, setTrainMeta] = useState(null); // { lastTrainedAt, samplesUsed, accuracy }
  const [toast,    setToast]    = useState(null);   // { type, message }
  const cacheRef = useRef({ data: null, expiresAt: 0 });

  const showToast = useCallback((type, message) => setToast({ type, message }), []);

  // ── Load insights ───────────────────────────────────────────────────────────
  const load = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cacheRef.current.data && now < cacheRef.current.expiresAt) {
      setData(cacheRef.current.data);
      setState('ready');
      return;
    }

    setState('loading');
    setError('');
    try {
      const res = await getSupplierAiInsights({ token, refresh: forceRefresh });
      if (!res.ok) {
        setState('unavailable');
        setError(res.message || 'ML service unavailable');
        return;
      }
      setData(res);
      cacheRef.current = { data: res, expiresAt: now + 5 * 60 * 1000 };
      setState('ready');
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setState('error');
    }
  }, [token]);

  useEffect(() => { if (token) load(); }, [load, token]);

  // ── Retrain ─────────────────────────────────────────────────────────────────
  const handleRetrain = useCallback(async () => {
    if (training) return;
    setTraining(true);
    showToast('info', 'Entraînement du modèle en cours…');

    try {
      const res = await postSupplierAiRetrain({ token });

      if (!res.ok) {
        showToast('error', res.message || 'Échec du ré-entraînement');
        return;
      }

      // Store training metadata for display
      setTrainMeta({
        lastTrainedAt: res.lastTrainedAt,
        samplesUsed:   res.samplesUsed,
        accuracy:      res.accuracy,
      });

      showToast('success', `Modèle IA mis à jour avec succès · ${res.samplesUsed} échantillons · précision ${res.accuracy != null ? Math.round(res.accuracy * 100) + '%' : 'N/A'}`);

      // Invalidate client cache and reload insights with fresh model
      cacheRef.current = { data: null, expiresAt: 0 };
      await load(true);
    } catch (err) {
      showToast('error', err.message || 'Échec du ré-entraînement');
    } finally {
      setTraining(false);
    }
  }, [token, training, load, showToast]);

  const busy = state === 'loading' || training;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-800">🤖 AI Insights</h3>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              ML · RandomForest
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Last generated time */}
            {data?.generatedAt && state === 'ready' && (
              <span className="text-xs text-slate-400">
                {data.cached ? 'Cache · ' : ''}
                {new Date(data.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}

            {/* Refresh insights */}
            <button
              type="button"
              onClick={() => load(true)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {state === 'loading' && !training
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />
              }
              Actualiser
            </button>

            {/* Retrain button */}
            <button
              type="button"
              onClick={handleRetrain}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {training
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <BrainCircuit className="h-3.5 w-3.5" />
              }
              {training ? 'Entraînement…' : '🔁 Ré-entraîner le modèle'}
            </button>
          </div>
        </div>

        {/* ── Retrain metadata strip ── */}
        {trainMeta && (
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-indigo-50 px-6 py-2.5 text-xs text-indigo-700">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Dernier entraînement : {new Date(trainMeta.lastTrainedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>📊 {trainMeta.samplesUsed} échantillons</span>
            {trainMeta.accuracy != null && (
              <span>🎯 Précision : {Math.round(trainMeta.accuracy * 100)}%</span>
            )}
          </div>
        )}

        {/* ── Retrain hint ── */}
        <div className="border-b border-slate-50 bg-slate-50 px-6 py-2 text-xs text-slate-400">
          Le bouton "Ré-entraîner" met à jour les prédictions IA en utilisant vos dernières commandes et données produits.
        </div>

        {/* ── Body ── */}
        <div className="p-5">

          {/* Loading */}
          {state === 'loading' && !training && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm">Analyse ML en cours…</p>
            </div>
          )}

          {/* Training overlay */}
          {training && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <BrainCircuit className="h-10 w-10 animate-pulse text-indigo-500" />
              <p className="text-sm font-medium text-indigo-700">Entraînement du modèle RandomForest…</p>
              <p className="text-xs text-slate-400">Cela peut prendre quelques secondes</p>
            </div>
          )}

          {/* ML service unavailable */}
          {state === 'unavailable' && !training && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <WifiOff className="mx-auto h-10 w-10 text-amber-400" />
              <p className="text-sm font-semibold text-amber-800">Service ML hors ligne</p>
              <p className="mx-auto max-w-sm text-xs text-amber-700">
                Le microservice Python n'est pas démarré. Lancez-le avec :
              </p>
              <code className="block rounded-lg bg-amber-100 px-4 py-2 font-mono text-xs text-amber-900">
                cd ml-service &amp;&amp; python app.py
              </code>
              <button
                onClick={() => load(true)}
                className="mt-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Generic error */}
          {state === 'error' && !training && (
            <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => load(true)} className="text-xs text-red-600 underline">Réessayer</button>
            </div>
          )}

          {/* No products */}
          {state === 'ready' && !training && data?.totalProducts === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Bot className="mx-auto mb-3 h-10 w-10" />
              <p className="text-sm">Ajoutez des produits pour obtenir des insights ML.</p>
            </div>
          )}

          {/* Results */}
          {state === 'ready' && !training && data?.totalProducts > 0 && (
            <div className="space-y-4">
              {/* Summary strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['BEST_SELLER', 'RESTOCK', 'UNDERPERFORMING', 'NORMAL'].map(label => {
                  const meta  = LABEL_META[label];
                  const count = data.summary?.[label]?.length ?? 0;
                  return (
                    <div key={label} className={`rounded-xl border ${meta.border} ${meta.bg} px-4 py-3 text-center`}>
                      <p className={`text-2xl font-bold ${meta.color}`}>{count}</p>
                      <p className={`mt-0.5 text-xs font-medium ${meta.color}`}>{label.replace('_', ' ')}</p>
                    </div>
                  );
                })}
              </div>

              {/* Sections */}
              {['BEST_SELLER', 'RESTOCK', 'UNDERPERFORMING', 'NORMAL'].map(label => (
                <LabelSection key={label} label={label} items={data.summary?.[label] ?? []} />
              ))}

              <p className="text-center text-xs text-slate-400">
                {data.totalProducts} produit{data.totalProducts > 1 ? 's' : ''} analysé{data.totalProducts > 1 ? 's' : ''} · RandomForestClassifier (scikit-learn)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

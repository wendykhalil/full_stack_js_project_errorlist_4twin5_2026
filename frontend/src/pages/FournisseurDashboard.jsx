import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getSupplierStats, getSupplierOrders, getMyProducts } from '../auth/api';
import {
  TrendingUp, TrendingDown, Package, ShoppingBag,
  DollarSign, BarChart2, Lightbulb, AlertCircle, CheckCircle,
  Minus, ArrowUpRight, ArrowDownRight, Star, AlertTriangle,
} from 'lucide-react';
import AiInsightsPanel from '../components/supplier/AiInsightsPanel';

/* ─────────────────────────── helpers ─────────────────────────── */

function fmt(n) {
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(n ?? 0);
}

function pct(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getLastNMonths(n) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('fr-FR', { month: 'short' }),
    });
  }
  return result;
}

function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const { sumX, sumY, sumXY, sumX2 } = values.reduce(
    (a, v, i) => ({ sumX: a.sumX + i, sumY: a.sumY + v, sumXY: a.sumXY + i * v, sumX2: a.sumX2 + i * i }),
    { sumX: 0, sumY: 0, sumXY: 0, sumX2: 0 }
  );
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/* ──────────────────────── chart primitives ───────────────────── */

const CHART = { W: 520, H: 190, P: { t: 12, r: 12, b: 32, l: 50 } };

function yGrid(max) {
  return [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    pct, y: CHART.P.t + (CHART.H - CHART.P.t - CHART.P.b) * (1 - pct),
    val: Math.round(max * pct),
  }));
}

function BarChart({ data, color, valueFormatter = v => v }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const cW = CHART.W - CHART.P.l - CHART.P.r;
  const cH = CHART.H - CHART.P.t - CHART.P.b;
  const bW = cW / data.length;
  const gap = bW * 0.18;
  return (
    <svg viewBox={`0 0 ${CHART.W} ${CHART.H}`} className="w-full" aria-hidden="true">
      {yGrid(max).map(({ pct, y, val }) => (
        <g key={pct}>
          <line x1={CHART.P.l} y1={y} x2={CHART.W - CHART.P.r} y2={y} stroke="#e2e8f0" strokeWidth="1" />
          <text x={CHART.P.l - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{val}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const bH = Math.max((d.value / max) * cH, d.value > 0 ? 3 : 0);
        const x = CHART.P.l + i * bW + gap;
        const w = bW - gap * 2;
        return (
          <g key={i}>
            <rect x={x} y={CHART.P.t + cH - bH} width={w} height={bH}
              fill={color} rx="3" opacity={d.forecast ? 0.38 : 1} />
            {d.forecast && (
              <rect x={x} y={CHART.P.t + cH - bH} width={w} height={bH}
                fill="none" stroke={color} strokeWidth="1.5" rx="3" strokeDasharray="3,2" />
            )}
            <text x={x + w / 2} y={CHART.H - CHART.P.b + 14} textAnchor="middle" fontSize="9" fill="#64748b">
              {d.label}
            </text>
            {d.value > 0 && <title>{d.label}: {valueFormatter(d.value)}</title>}
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, color, valueFormatter = v => v }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const cW = CHART.W - CHART.P.l - CHART.P.r;
  const cH = CHART.H - CHART.P.t - CHART.P.b;
  const n = data.length;
  const pts = data.map((d, i) => ({
    x: CHART.P.l + (n === 1 ? cW / 2 : (i / (n - 1)) * cW),
    y: CHART.P.t + cH - (d.value / max) * cH,
    ...d,
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${pts[0].x},${CHART.P.t + cH} ${poly} ${pts[pts.length - 1].x},${CHART.P.t + cH}`;
  return (
    <svg viewBox={`0 0 ${CHART.W} ${CHART.H}`} className="w-full" aria-hidden="true">
      {yGrid(max).map(({ pct, y, val }) => (
        <g key={pct}>
          <line x1={CHART.P.l} y1={y} x2={CHART.W - CHART.P.r} y2={y} stroke="#e2e8f0" strokeWidth="1" />
          <text x={CHART.P.l - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{val}</text>
        </g>
      ))}
      <polygon points={area} fill={color} fillOpacity="0.08" />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={p.forecast ? 'white' : color} stroke={color} strokeWidth="1.5" />
          <text x={p.x} y={CHART.H - CHART.P.b + 14} textAnchor="middle" fontSize="9" fill="#64748b">{p.label}</text>
          <title>{p.label}: {valueFormatter(p.value)}</title>
        </g>
      ))}
    </svg>
  );
}

/* Horizontal bar for product performance */
function HBarChart({ data, color, valueFormatter = v => v }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="max-w-[60%] truncate font-medium text-slate-700">{d.label}</span>
            <span className="font-semibold text-slate-600">{valueFormatter(d.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────── sub-components ─────────────────────── */

function KpiCard({ icon, label, value, sub, trend, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red:    'bg-red-50 text-red-600 border-red-100',
  };
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400';
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${colors[color]}`}>
          {icon}
        </span>
        {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function AdviceCard({ icon, title, description, type = 'info' }) {
  const styles = {
    success: { wrap: 'border-green-100 bg-green-50',   icon: 'bg-green-100 text-green-600',  title: 'text-green-800',  text: 'text-green-700'  },
    warning: { wrap: 'border-orange-100 bg-orange-50', icon: 'bg-orange-100 text-orange-600', title: 'text-orange-800', text: 'text-orange-700' },
    info:    { wrap: 'border-blue-100 bg-blue-50',     icon: 'bg-blue-100 text-blue-600',     title: 'text-blue-800',   text: 'text-blue-700'   },
    danger:  { wrap: 'border-red-100 bg-red-50',       icon: 'bg-red-100 text-red-600',       title: 'text-red-800',    text: 'text-red-700'    },
  };
  const s = styles[type] ?? styles.info;
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${s.wrap}`}>
      <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${s.icon}`}>
        {icon}
      </span>
      <div>
        <p className={`text-sm font-semibold ${s.title}`}>{title}</p>
        <p className={`mt-0.5 text-xs leading-relaxed ${s.text}`}>{description}</p>
      </div>
    </div>
  );
}

function DeltaBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-xs text-slate-400">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function CompareRow({ label, current, previous, formatter = v => v }) {
  const delta = pct(current, previous);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-slate-400">Période préc.</p>
          <p className="text-sm font-medium text-slate-500">{formatter(previous)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Période act.</p>
          <p className="text-sm font-bold text-slate-800">{formatter(current)}</p>
        </div>
        <div className="w-16 text-right"><DeltaBadge value={delta} /></div>
      </div>
    </div>
  );
}

/* ──────────────────────── main page ─────────────────────────── */

export default function FournisseurDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, ordersRes, prodsRes] = await Promise.all([
          getSupplierStats({ token }),
          getSupplierOrders({ token, limit: 1000, status: 'DELIVERED' }),
          getMyProducts({ token, limit: 200 }),
        ]);
        if (cancelled) return;
        setStats(statsRes?.data ?? statsRes);
        setOrders(ordersRes?.orders ?? ordersRes?.data?.orders ?? []);
        setProducts(prodsRes?.products ?? prodsRes?.data?.products ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  /* ── single-pass aggregation over all orders ──────────────── */
  const months12 = useMemo(() => getLastNMonths(12), []);

  const agg = useMemo(() => {
    const revenueByMonth = {}, countByMonth = {}, revenueByYear = {}, countByYear = {}, productMap = {};
    orders.forEach(o => {
      const dateStr = o.deliveredDate || o.createdAt;
      const mKey = getMonthKey(dateStr);
      const year = new Date(dateStr).getFullYear();
      const rev  = o.lineTotal ?? 0;
      const pid  = o.productId?._id ?? o.productId ?? 'unknown';
      const name = o.product?.name ?? o.productId?.name ?? `Produit #${String(pid).slice(-4)}`;
      revenueByMonth[mKey] = (revenueByMonth[mKey] ?? 0) + rev;
      countByMonth[mKey]   = (countByMonth[mKey]   ?? 0) + 1;
      revenueByYear[year]  = (revenueByYear[year]  ?? 0) + rev;
      countByYear[year]    = (countByYear[year]    ?? 0) + 1;
      if (!productMap[pid]) productMap[pid] = { label: name, revenue: 0, count: 0 };
      productMap[pid].revenue += rev;
      productMap[pid].count   += 1;
    });
    return { revenueByMonth, countByMonth, revenueByYear, countByYear, productMap };
  }, [orders]);

  const monthlyRevenue = useMemo(
    () => months12.map(m => ({ ...m, value: agg.revenueByMonth[m.key] ?? 0 })),
    [months12, agg]
  );

  const monthlyOrders = useMemo(
    () => months12.map(m => ({ ...m, value: agg.countByMonth[m.key] ?? 0 })),
    [months12, agg]
  );

  /* ── forecast ─────────────────────────────────────────────── */
  const { forecastMonthly, forecastYearly, trend } = useMemo(() => {
    const recent = monthlyRevenue.slice(-6).map(m => m.value);
    const { slope, intercept } = linearRegression(recent);
    const now = new Date();
    const nextMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      return {
        key: getMonthKey(d),
        label: d.toLocaleString('fr-FR', { month: 'short' }),
        value: Math.max(0, Math.round(intercept + slope * (recent.length + i))),
        forecast: true,
      };
    });
    const projected12 = Array.from({ length: 12 }, (_, i) =>
      Math.max(0, intercept + slope * (recent.length + i))
    ).reduce((s, v) => s + v, 0);
    return {
      forecastMonthly: nextMonths,
      forecastYearly: Math.round(projected12),
      trend: slope > 50 ? 'up' : slope < -50 ? 'down' : 'flat',
    };
  }, [monthlyRevenue]);

  const combinedRevChart = useMemo(
    () => [...monthlyRevenue.slice(-6), ...forecastMonthly],
    [monthlyRevenue, forecastMonthly]
  );

  /* ── comparison (derived from agg) ────────────────────────── */
  const comparison = useMemo(() => {
    const now = new Date();
    const thisMonthKey = getMonthKey(now);
    const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;
    return {
      revenueThisMonth: agg.revenueByMonth[thisMonthKey] ?? 0,
      revenueLastMonth: agg.revenueByMonth[lastMonthKey] ?? 0,
      ordersThisMonth:  agg.countByMonth[thisMonthKey]   ?? 0,
      ordersLastMonth:  agg.countByMonth[lastMonthKey]   ?? 0,
      revenueThisYear:  agg.revenueByYear[thisYear]      ?? 0,
      revenueLastYear:  agg.revenueByYear[lastYear]      ?? 0,
      ordersThisYear:   agg.countByYear[thisYear]        ?? 0,
      ordersLastYear:   agg.countByYear[lastYear]        ?? 0,
    };
  }, [agg]);

  /* ── product performance (derived from agg) ────────────────── */
  const { topByRevenue, topByOrders } = useMemo(() => {
    const list = Object.values(agg.productMap);
    return {
      topByRevenue: list.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => ({ label: p.label, value: p.revenue })),
      topByOrders:  list.slice().sort((a, b) => b.count  - a.count ).slice(0, 5).map(p => ({ label: p.label, value: p.count  })),
    };
  }, [agg]);

  /* ── stock alerts ─────────────────────────────────────────── */
  const { outOfStock, lowStock } = useMemo(() => ({
    outOfStock: products.filter(p => p.stock === 0),
    lowStock:   products.filter(p => p.stock > 0 && p.stock <= 10),
  }), [products]);

  /* ── advice ───────────────────────────────────────────────── */
  const avgOrderValue = useMemo(() =>
    orders.length ? orders.reduce((s, o) => s + (o.lineTotal ?? 0), 0) / orders.length : 0,
    [orders]
  );

  const advice = useMemo(() => {
    const tips = [];
    if (trend === 'up')   tips.push({ type: 'success', icon: <TrendingUp className="h-4 w-4" />,   title: 'Croissance positive',      description: "Votre chiffre d'affaires est en hausse. Maintenez la qualité et la rapidité de livraison." });
    if (trend === 'down') tips.push({ type: 'warning', icon: <TrendingDown className="h-4 w-4" />,  title: 'Tendance à la baisse',     description: "Vos revenus diminuent. Envisagez des promotions, de nouveaux produits ou d'améliorer vos descriptions." });
    if (outOfStock.length > 0) tips.push({ type: 'danger',  icon: <AlertTriangle className="h-4 w-4" />, title: `${outOfStock.length} produit(s) épuisé(s)`, description: "Réapprovisionnez ces produits rapidement pour ne pas manquer de commandes." });
    if (lowStock.length  > 0)  tips.push({ type: 'warning', icon: <AlertTriangle className="h-4 w-4" />, title: `${lowStock.length} produit(s) en stock faible`, description: "Anticipez les réapprovisionnements avant d'être en rupture de stock." });
    if ((stats?.activeProducts ?? 0) < 5) tips.push({ type: 'warning', icon: <Package className="h-4 w-4" />,    title: 'Catalogue limité',         description: "Enrichissez votre catalogue pour attirer plus d'artisans et augmenter vos ventes." });
    if ((stats?.activeOrders ?? 0) > 10)  tips.push({ type: 'info',    icon: <ShoppingBag className="h-4 w-4" />, title: 'Forte demande en cours',   description: `${stats.activeOrders} commandes actives. Traitez-les rapidement pour améliorer votre réputation.` });
    if (avgOrderValue < 100 && orders.length > 0) tips.push({ type: 'info', icon: <DollarSign className="h-4 w-4" />, title: 'Panier moyen faible',  description: "Proposez des packs ou remises sur grandes quantités pour augmenter la valeur des commandes." });
    if (monthlyRevenue.filter(m => m.value > 0).length >= 3 && trend !== 'down') tips.push({ type: 'success', icon: <CheckCircle className="h-4 w-4" />, title: 'Activité régulière', description: "Vous êtes actif depuis plusieurs mois consécutifs. Cela renforce la confiance des artisans." });
    if (tips.length === 0) tips.push({ type: 'info', icon: <Lightbulb className="h-4 w-4" />, title: 'Commencez à vendre', description: "Ajoutez vos premiers produits et commencez à recevoir des commandes." });
    return tips;
  }, [trend, outOfStock.length, lowStock.length, stats, avgOrderValue, orders.length, monthlyRevenue]);

  /* ── render ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm">Erreur lors du chargement : {error}</p>
      </div>
    );
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.lineTotal ?? 0), 0);
  const trendLabel   = trend === 'up' ? '↑ En hausse' : trend === 'down' ? '↓ En baisse' : '→ Stable';
  const now = new Date();
  const thisMonthLabel = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const lastMonthLabel = new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bonjour {user?.supplierProfile?.companyName || user?.firstName || 'Fournisseur'} — voici un aperçu complet de votre activité
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={<DollarSign className="h-5 w-5" />}  label="Chiffre d'affaires total" value={fmt(totalRevenue)}           sub={`${orders.length} commandes livrées`}  trend={trend === 'flat' ? null : trend} color="green"  />
        <KpiCard icon={<ShoppingBag className="h-5 w-5" />} label="Commandes actives"        value={stats?.activeOrders ?? '—'} sub="En cours de traitement"               color="blue"   />
        <KpiCard icon={<Package className="h-5 w-5" />}     label="Produits actifs"          value={stats?.activeProducts ?? '—'} sub="Dans votre catalogue"               color="purple" />
        <KpiCard icon={<BarChart2 className="h-5 w-5" />}   label="Panier moyen"             value={fmt(avgOrderValue)}          sub="Par commande livrée"                  color="orange" />
      </div>

      {/* ── Stock alerts ── */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-semibold text-slate-800">Alertes de stock</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {outOfStock.map(p => (
              <div key={p._id} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-red-800">{p.name}</p>
                  <p className="text-xs text-red-500">Rupture de stock</p>
                </div>
                <span className="ml-3 flex-shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">0 unité</span>
              </div>
            ))}
            {lowStock.map(p => (
              <div key={p._id} className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-orange-800">{p.name}</p>
                  <p className="text-xs text-orange-500">Stock faible</p>
                </div>
                <span className="ml-3 flex-shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">{p.stock} unité{p.stock > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Volume des ventes (12 mois)" subtitle="Commandes livrées par mois">
          <LineChart data={monthlyOrders} color="#2563eb" valueFormatter={v => `${v} commande${v !== 1 ? 's' : ''}`} />
        </ChartCard>
        <ChartCard title="Revenus mensuels + prévisions" subtitle="Derniers 6 mois (plein) · 6 mois projetés (hachuré)">
          <BarChart data={combinedRevChart} color="#16a34a" valueFormatter={fmt} />
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-sm bg-green-600" /> Réalisé</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-sm border border-dashed border-green-600 bg-green-200" /> Prévision</span>
          </div>
        </ChartCard>
      </div>

      {/* ── Comparison ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Comparaison mensuelle" subtitle={`${lastMonthLabel} vs ${thisMonthLabel}`}>
          <CompareRow label="Revenu"     current={comparison.revenueThisMonth} previous={comparison.revenueLastMonth} formatter={fmt} />
          <CompareRow label="Commandes"  current={comparison.ordersThisMonth}  previous={comparison.ordersLastMonth}  />
        </ChartCard>
        <ChartCard title="Comparaison annuelle" subtitle={`${now.getFullYear() - 1} vs ${now.getFullYear()}`}>
          <CompareRow label="Revenu"     current={comparison.revenueThisYear}  previous={comparison.revenueLastYear}  formatter={fmt} />
          <CompareRow label="Commandes"  current={comparison.ordersThisYear}   previous={comparison.ordersLastYear}   />
        </ChartCard>
      </div>

      {/* ── Product performance ── */}
      {(topByRevenue.length > 0 || topByOrders.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Top produits — Revenu" subtitle="Revenus générés par produit (commandes livrées)">
            {topByRevenue.length > 0
              ? <HBarChart data={topByRevenue} color="#2563eb" valueFormatter={fmt} />
              : <p className="text-sm text-slate-400">Aucune donnée disponible</p>}
          </ChartCard>
          <ChartCard title="Top produits — Nombre de commandes" subtitle="Produits les plus commandés">
            {topByOrders.length > 0
              ? <HBarChart data={topByOrders} color="#7c3aed" valueFormatter={v => `${v} cmd`} />
              : <p className="text-sm text-slate-400">Aucune donnée disponible</p>}
          </ChartCard>
        </div>
      )}

      {/* ── Product ratings from catalogue ── */}
      {products.filter(p => p.ratingCount > 0).length > 0 && (
        <ChartCard title="Évaluations des produits" subtitle="Note moyenne attribuée par les artisans">
          <div className="divide-y divide-slate-50">
            {products
              .filter(p => p.ratingCount > 0)
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 6)
              .map(p => (
                <div key={p._id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-700 truncate max-w-[55%]">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(p.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{p.rating?.toFixed(1)} ({p.ratingCount})</span>
                  </div>
                </div>
              ))}
          </div>
        </ChartCard>
      )}

      {/* ── Forecast banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">Projection annuelle (12 prochains mois)</p>
            <p className="mt-1 text-4xl font-bold">{fmt(forecastYearly)}</p>
            <p className="mt-1 text-sm text-blue-100">
              Tendance :{' '}
              <span className={`font-semibold ${trend === 'up' ? 'text-green-300' : trend === 'down' ? 'text-red-300' : 'text-blue-200'}`}>
                {trendLabel}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {forecastMonthly.slice(0, 3).map(m => (
              <div key={m.key} className="rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-xs font-medium text-blue-200">{m.label}</p>
                <p className="mt-1 text-lg font-bold">{fmt(m.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Insights ── */}
      <AiInsightsPanel token={token} />

      {/* ── Advice ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold text-slate-800">Conseils pour améliorer vos revenus</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {advice.map((tip, i) => <AdviceCard key={i} {...tip} />)}
        </div>
      </div>

    </div>
  );
}

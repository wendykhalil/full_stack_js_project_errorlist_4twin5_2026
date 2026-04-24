import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Scan,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Footer from '../components/Footer';
import { Hint } from '../components/MouseTooltip';

/* ─── Small reusable primitives ─────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, helper }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
        {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
      </div>
      <div className="ml-4 flex-shrink-0 rounded-lg bg-gray-50 p-2 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default:   'bg-blue-50 text-blue-700',
    success:   'bg-green-50 text-green-700',
    warning:   'bg-yellow-50 text-yellow-700',
    danger:    'bg-red-50 text-red-700',
    secondary: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }) => {
  const v = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-400',
    danger:  'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-gray-400',
  };
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${v[variant]} ${s[size]} ${className}`}
    >
      {children}
    </button>
  );
};

/* ─── Tabs config ────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'overview',   label: 'Overview',         icon: Activity  },
  { id: 'fraud',      label: 'Fraud Detection',  icon: Shield    },
  { id: 'analytics',  label: 'AI Smart Analytics', icon: BarChart3 },
];

/* ─── Main component ─────────────────────────────────────────────────────── */

const AdminFraudAnalytics = () => {
  const { token } = useAuth();
  const [fraudStats,    setFraudStats]    = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedTab,   setSelectedTab]   = useState('overview');
  const [scanResults,   setScanResults]   = useState(null);
  const [scanning,      setScanning]      = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [fraudRes, analyticsRes] = await Promise.all([
        fetch('/api/fraud/dashboard',    { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analytics/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (fraudRes.ok)     setFraudStats(await fraudRes.json());
      if (analyticsRes.ok) setAnalyticsData(await analyticsRes.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const scanArtisan = async (artisanId) => {
    try {
      setScanning(true);
      const res = await fetch(`/api/fraud/scan/artisan/${artisanId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setScanResults({ type: 'artisan', data: await res.json() });
    } catch (err) {
      console.error('Error scanning artisan:', err);
    } finally {
      setScanning(false);
    }
  };

  const performBatchScan = async (scanType) => {
    try {
      setScanning(true);
      const res = await fetch('/api/fraud/scan/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType, limit: 20 }),
      });
      setScanResults({ type: 'batch', scanType, data: await res.json() });
    } catch (err) {
      console.error('Error performing batch scan:', err);
    } finally {
      setScanning(false);
    }
  };

  /* ── Loading state ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">Loading fraud detection and analytics…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Page ────────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      {/* ── Main scrollable area ── */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Fraud Detection &amp; Smart Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              AI-powered fraud detection and business intelligence dashboard
            </p>

            {/* Tab bar */}
            <div className="mt-6 border-b border-gray-200">
              <nav className="-mb-px flex gap-6">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const tabTooltips = {
                    overview: "Vue d'ensemble des statistiques de la plateforme",
                    fraud: "Analyse des comportements suspects et scores de risque",
                    analytics: "Analyses avancées par intelligence artificielle",
                  };
                  return (
                  <Hint key={id} text={tabTooltips[id] || label}>
                  <button
                    onClick={() => setSelectedTab(id)}
                    className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                      selectedTab === id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                  </Hint>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">

              {/* Metrics */}
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Metrics
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    icon={Users}
                    label="Total Artisans"
                    value={fraudStats?.fraudStats?.totalArtisans ?? 0}
                    helper={`${fraudStats?.fraudStats?.flaggedUsers ?? 0} flagged`}
                  />
                  <StatCard
                    icon={Activity}
                    label="Total Projects"
                    value={fraudStats?.fraudStats?.totalProjects ?? 0}
                    helper="Active projects"
                  />
                  <StatCard
                    icon={DollarSign}
                    label="Market Value"
                    value={`${(analyticsData?.pricing_analysis?.overall_stats?.total_market_value ?? 0).toLocaleString()} TND`}
                    helper="Total project value"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Avg Project Budget"
                    value={`${(analyticsData?.pricing_analysis?.overall_stats?.avg_project_budget ?? 0).toLocaleString()} TND`}
                    helper="Average budget"
                  />
                </div>
              </section>

              {/* Quick Actions */}
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Btn onClick={() => performBatchScan('artisans')} disabled={scanning} className="w-full">
                    <Scan className="h-4 w-4" />
                    {scanning ? 'Scanning…' : 'Scan All Artisans'}
                  </Btn>
                  <Btn onClick={() => performBatchScan('projects')} disabled={scanning} className="w-full">
                    <Eye className="h-4 w-4" />
                    {scanning ? 'Scanning…' : 'Scan All Projects'}
                  </Btn>
                  <Btn onClick={fetchDashboardData} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                  </Btn>
                </div>
              </section>

              {/* Scan results */}
              {scanResults && (
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    {scanResults.type === 'batch' ? 'Batch Scan Results' : 'Individual Scan Results'}
                  </h2>

                  {scanResults.type === 'batch' && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        { label: 'Total Scanned', value: scanResults.data.total_scanned,              bg: 'bg-gray-50',   text: 'text-gray-900'   },
                        { label: 'High Risk',     value: scanResults.data.summary?.high_risk   ?? 0,  bg: 'bg-red-50',    text: 'text-red-600'    },
                        { label: 'Medium Risk',   value: scanResults.data.summary?.medium_risk ?? 0,  bg: 'bg-yellow-50', text: 'text-yellow-600' },
                        { label: 'Low Risk',      value: scanResults.data.summary?.low_risk    ?? 0,  bg: 'bg-green-50',  text: 'text-green-600'  },
                      ].map(({ label, value, bg, text }) => (
                        <div key={label} className={`rounded-lg p-4 text-center ${bg}`}>
                          <p className={`text-2xl font-bold ${text}`}>{value}</p>
                          <p className="mt-1 text-xs text-gray-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {scanResults.type === 'artisan' && scanResults.data.fraudAnalysis && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          Artisan: {scanResults.data.artisan?.name}
                        </p>
                        <Badge variant={
                          scanResults.data.fraudAnalysis.risk_level === 'HIGH'   ? 'danger'  :
                          scanResults.data.fraudAnalysis.risk_level === 'MEDIUM' ? 'warning' : 'success'
                        }>
                          {scanResults.data.fraudAnalysis.risk_level} RISK
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Confidence: {scanResults.data.fraudAnalysis.confidence}%
                      </p>
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Risk Factors</p>
                        <ul className="space-y-1">
                          {scanResults.data.fraudAnalysis.risk_factors?.map((factor, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* ══ FRAUD DETECTION TAB ═══════════════════════════════════════ */}
          {selectedTab === 'fraud' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                {/* Stats */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                      Fraud Detection
                    </h2>
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Suspicious Artisans', value: fraudStats?.fraudStats?.suspiciousArtisans ?? 0, v: 'danger'    },
                      { label: 'Suspicious Projects', value: fraudStats?.fraudStats?.suspiciousProjects ?? 0, v: 'danger'    },
                      { label: 'Flagged Users',        value: fraudStats?.fraudStats?.flaggedUsers       ?? 0, v: 'secondary' },
                    ].map(({ label, value, v }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{label}</span>
                        <Badge variant={v}>{value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Batch scanning */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Batch Scanning
                  </h2>
                  <div className="space-y-3">
                    <Btn onClick={() => performBatchScan('artisans')} disabled={scanning} variant="outline" className="w-full">
                      <Users className="h-4 w-4" />
                      Scan All Artisans
                    </Btn>
                    <Btn onClick={() => performBatchScan('projects')} disabled={scanning} variant="outline" className="w-full">
                      <Activity className="h-4 w-4" />
                      Scan All Projects
                    </Btn>
                  </div>
                </div>

                {/* Recent alerts */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Recent Alerts
                  </h2>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Suspicious pricing detected</p>
                          <p className="text-xs text-red-500">3 projects flagged</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">New artisan profile</p>
                          <p className="text-xs text-yellow-600">Unusual activity pattern</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent artisans table */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Recent Artisans — Fraud Scan
                </h2>
                <div className="divide-y divide-gray-100">
                  {fraudStats?.recentArtisans?.slice(0, 5).map((artisan) => (
                    <div key={artisan._id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {artisan.firstName} {artisan.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{artisan.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined {new Date(artisan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={artisan.status === 'SUSPENDED' ? 'danger' : 'success'}>
                          {artisan.status || 'ACTIVE'}
                        </Badge>
                        <Btn size="sm" variant="outline" onClick={() => scanArtisan(artisan._id)} disabled={scanning}>
                          <Shield className="h-3.5 w-3.5" />
                          Scan
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ AI SMART ANALYTICS TAB ════════════════════════════════════ */}
          {selectedTab === 'analytics' && analyticsData && (
            <div className="space-y-6">

              {/* Service demand trends */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Service Demand Trends
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {analyticsData.demand_analysis?.demand_trends?.slice(0, 6).map((trend) => (
                    <div key={trend.service} className="rounded-lg border border-gray-100 p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{trend.service}</p>
                        <Badge variant={
                          trend.trend === 'increasing' ? 'success' :
                          trend.trend === 'decreasing' ? 'danger'  : 'secondary'
                        }>
                          {trend.growth_rate > 0 ? '+' : ''}{trend.growth_rate}%
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">Current: {trend.current_demand} projects</p>
                      <p className="text-xs text-gray-500">Market share: {trend.market_share}%</p>
                      <p className="text-xs text-gray-400">Next week: {trend.predicted_next_week}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing + regional */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Service Pricing Analysis
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {analyticsData.pricing_analysis?.service_pricing?.slice(0, 5).map((service) => (
                      <div key={service.service} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.service}</p>
                          <p className="text-xs text-gray-400">{service.project_count} projects</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{service.avg_price?.toLocaleString()} TND</p>
                          <p className="text-xs text-gray-400">{service.avg_price_per_sqm} TND/m²</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Regional Analysis
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {analyticsData.pricing_analysis?.regional_pricing?.slice(0, 5).map((region) => (
                      <div key={region.region} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{region.region}</p>
                          <p className="text-xs text-gray-400">{region.most_common_service}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{region.avg_price?.toLocaleString()} TND</p>
                          <p className="text-xs text-gray-400">{region.project_count} projects</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    AI Insights
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">Demand Insights</p>
                    <ul className="space-y-2">
                      {analyticsData.demand_analysis?.insights?.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-medium text-gray-700">Pricing Insights</p>
                    <ul className="space-y-2">
                      {analyticsData.pricing_analysis?.insights?.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminFraudAnalytics;

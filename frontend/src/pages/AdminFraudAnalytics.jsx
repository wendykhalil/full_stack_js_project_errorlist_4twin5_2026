import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Scan,
  Eye,
  Ban,
  Flag
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Footer from '../components/Footer';

const AdminFraudAnalytics = () => {
  const { token } = useAuth();
  const [fraudStats, setFraudStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [scanResults, setScanResults] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch fraud dashboard data
      const fraudResponse = await fetch('/api/fraud/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (fraudResponse.ok) {
        const fraudData = await fraudResponse.json();
        setFraudStats(fraudData);
      }

      // Fetch smart analytics data
      const analyticsResponse = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        setAnalyticsData(analytics);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanArtisan = async (artisanId) => {
    try {
      setScanning(true);
      const response = await fetch(`/api/fraud/scan/artisan/${artisanId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      setScanResults({
        type: 'artisan',
        data: result
      });
      
    } catch (error) {
      console.error('Error scanning artisan:', error);
      alert('Error performing fraud scan');
    } finally {
      setScanning(false);
    }
  };

  const performBatchScan = async (scanType) => {
    try {
      setScanning(true);
      const response = await fetch('/api/fraud/scan/batch', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scanType, limit: 20 })
      });
      const result = await response.json();
      
      setScanResults({
        type: 'batch',
        scanType,
        data: result
      });
      
    } catch (error) {
      console.error('Error performing batch scan:', error);
      alert('Error performing batch scan');
    } finally {
      setScanning(false);
    }
  };

  const StatCard = ({ icon, label, value, helper, bgColor = "bg-white", textColor = "text-gray-900" }) => (
    <div className={`rounded-xl border border-gray-200 ${bgColor} p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          {helper && <p className="text-sm text-gray-500 mt-1">{helper}</p>}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );

  const Badge = ({ children, variant = 'default' }) => {
    const variants = {
      default: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      secondary: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
        {children}
      </span>
    );
  };

  const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }) => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fraud detection and analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚨📊 Fraud Detection & Smart Analytics</h1>
          <p className="mt-2 text-gray-600">AI-powered fraud detection and business intelligence dashboard</p>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'fraud', label: 'Fraud Detection', icon: Shield },
                { id: 'analytics', label: 'Smart Analytics', icon: BarChart3 }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedTab(id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Total Artisans"
                value={fraudStats?.fraudStats?.totalArtisans || 0}
                helper={`${fraudStats?.fraudStats?.flaggedUsers || 0} flagged`}
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Total Projects"
                value={fraudStats?.fraudStats?.totalProjects || 0}
                helper="Active projects"
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="Market Value"
                value={`${analyticsData?.pricing_analysis?.overall_stats?.total_market_value?.toLocaleString() || 0} TND`}
                helper="Total project value"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Avg Project Budget"
                value={`${analyticsData?.pricing_analysis?.overall_stats?.avg_project_budget?.toLocaleString() || 0} TND`}
                helper="Average budget"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => performBatchScan('artisans')}
                  disabled={scanning}
                  className="w-full"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  {scanning ? 'Scanning...' : 'Scan All Artisans'}
                </Button>
                <Button
                  onClick={() => performBatchScan('projects')}
                  disabled={scanning}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {scanning ? 'Scanning...' : 'Scan All Projects'}
                </Button>
                <Button
                  onClick={fetchDashboardData}
                  variant="outline"
                  className="w-full"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>

            {/* Scan Results */}
            {scanResults && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {scanResults.type === 'batch' ? 'Batch Scan Results' : 'Individual Scan Results'}
                </h3>
                
                {scanResults.type === 'batch' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{scanResults.data.total_scanned}</p>
                      <p className="text-sm text-gray-600">Total Scanned</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{scanResults.data.summary?.high_risk || 0}</p>
                      <p className="text-sm text-gray-600">High Risk</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{scanResults.data.summary?.medium_risk || 0}</p>
                      <p className="text-sm text-gray-600">Medium Risk</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{scanResults.data.summary?.low_risk || 0}</p>
                      <p className="text-sm text-gray-600">Low Risk</p>
                    </div>
                  </div>
                )}

                {scanResults.type === 'artisan' && scanResults.data.fraudAnalysis && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Artisan: {scanResults.data.artisan?.name}</h4>
                      <Badge variant={
                        scanResults.data.fraudAnalysis.risk_level === 'HIGH' ? 'danger' :
                        scanResults.data.fraudAnalysis.risk_level === 'MEDIUM' ? 'warning' : 'success'
                      }>
                        {scanResults.data.fraudAnalysis.risk_level} RISK
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Confidence: {scanResults.data.fraudAnalysis.confidence}%
                    </p>
                    <div>
                      <p className="font-medium text-sm mb-2">Risk Factors:</p>
                      <ul className="space-y-1">
                        {scanResults.data.fraudAnalysis.risk_factors?.map((factor, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fraud Detection Tab */}
        {selectedTab === 'fraud' && (
          <div className="space-y-6">
            {/* Fraud Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fraud Detection</h3>
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Suspicious Artisans:</span>
                    <Badge variant="danger">{fraudStats?.fraudStats?.suspiciousArtisans || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Suspicious Projects:</span>
                    <Badge variant="danger">{fraudStats?.fraudStats?.suspiciousProjects || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Flagged Users:</span>
                    <Badge variant="secondary">{fraudStats?.fraudStats?.flaggedUsers || 0}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Scanning</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => performBatchScan('artisans')}
                    disabled={scanning}
                    className="w-full"
                    variant="outline"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Scan All Artisans
                  </Button>
                  <Button
                    onClick={() => performBatchScan('projects')}
                    disabled={scanning}
                    className="w-full"
                    variant="outline"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Scan All Projects
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Suspicious pricing detected</p>
                      <p className="text-xs text-red-600">3 projects flagged</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">New artisan profile</p>
                      <p className="text-xs text-yellow-600">Unusual activity pattern</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Artisans */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Artisans - Fraud Scan</h3>
              <div className="space-y-4">
                {fraudStats?.recentArtisans?.slice(0, 5).map((artisan) => (
                  <div key={artisan._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{artisan.firstName} {artisan.lastName}</p>
                      <p className="text-sm text-gray-500">{artisan.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined: {new Date(artisan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={artisan.status === 'SUSPENDED' ? 'danger' : 'success'}>
                        {artisan.status || 'ACTIVE'}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => scanArtisan(artisan._id)}
                        disabled={scanning}
                        variant="outline"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Scan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Smart Analytics Tab */}
        {selectedTab === 'analytics' && analyticsData && (
          <div className="space-y-6">
            {/* Service Demand Trends */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Service Demand Trends</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.demand_analysis?.demand_trends?.slice(0, 6).map((trend) => (
                  <div key={trend.service} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{trend.service}</h4>
                      <Badge variant={
                        trend.trend === 'increasing' ? 'success' : 
                        trend.trend === 'decreasing' ? 'danger' : 'secondary'
                      }>
                        {trend.growth_rate > 0 ? '+' : ''}{trend.growth_rate}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Current: {trend.current_demand} projects
                    </p>
                    <p className="text-sm text-gray-600">
                      Market Share: {trend.market_share}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Predicted next week: {trend.predicted_next_week}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Pricing Analysis</h3>
                <div className="space-y-3">
                  {analyticsData.pricing_analysis?.service_pricing?.slice(0, 5).map((service) => (
                    <div key={service.service} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{service.service}</p>
                        <p className="text-sm text-gray-500">{service.project_count} projects</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{service.avg_price?.toLocaleString()} TND</p>
                        <p className="text-sm text-gray-500">{service.avg_price_per_sqm} TND/m²</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Analysis</h3>
                <div className="space-y-3">
                  {analyticsData.pricing_analysis?.regional_pricing?.slice(0, 5).map((region) => (
                    <div key={region.region} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{region.region}</p>
                        <p className="text-sm text-gray-500">{region.most_common_service}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{region.avg_price?.toLocaleString()} TND</p>
                        <p className="text-sm text-gray-500">{region.project_count} projects</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <PieChart className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Demand Insights</h4>
                  <ul className="space-y-2">
                    {analyticsData.demand_analysis?.insights?.map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Insights</h4>
                  <ul className="space-y-2">
                    {analyticsData.pricing_analysis?.insights?.map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
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
      <Footer />
    </div>
  );
};

export default AdminFraudAnalytics;
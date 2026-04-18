import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
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
  Activity
} from 'lucide-react';

const AdminDashboard = () => {
  const [fraudStats, setFraudStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch fraud dashboard data
      const fraudResponse = await fetch('/api/fraud/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const fraudData = await fraudResponse.json();
      setFraudStats(fraudData);

      // Fetch smart analytics data
      const analyticsResponse = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const analytics = await analyticsResponse.json();
      setAnalyticsData(analytics);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanArtisan = async (artisanId) => {
    try {
      const response = await fetch(`/api/fraud/scan/artisan/${artisanId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      alert(`Fraud Analysis Result:
Risk Level: ${result.fraudAnalysis.risk_level}
Confidence: ${result.fraudAnalysis.confidence}%
Reasons: ${result.fraudAnalysis.risk_factors.join(', ')}`);
    } catch (error) {
      console.error('Error scanning artisan:', error);
      alert('Error performing fraud scan');
    }
  };

  const performBatchScan = async (scanType) => {
    try {
      const response = await fetch('/api/fraud/scan/batch', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scanType, limit: 20 })
      });
      const result = await response.json();
      
      alert(`Batch Scan Complete:
Total Scanned: ${result.total_scanned}
High Risk: ${result.summary.high_risk}
Medium Risk: ${result.summary.medium_risk}
Low Risk: ${result.summary.low_risk}
Fraud Rate: ${result.summary.fraud_rate}%`);
    } catch (error) {
      console.error('Error performing batch scan:', error);
      alert('Error performing batch scan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant={selectedTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </Button>
          <Button 
            variant={selectedTab === 'fraud' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('fraud')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Fraud Detection
          </Button>
          <Button 
            variant={selectedTab === 'analytics' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('analytics')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Smart Analytics
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Artisans</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fraudStats?.fraudStats?.totalArtisans || 0}</div>
              <p className="text-xs text-muted-foreground">
                {fraudStats?.fraudStats?.flaggedUsers || 0} flagged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fraudStats?.fraudStats?.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.pricing_analysis?.overall_stats?.total_market_value?.toLocaleString() || 0} TND
              </div>
              <p className="text-xs text-muted-foreground">
                Total project value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Project Budget</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.pricing_analysis?.overall_stats?.avg_project_budget?.toLocaleString() || 0} TND
              </div>
              <p className="text-xs text-muted-foreground">
                Average budget
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fraud Detection Tab */}
      {selectedTab === 'fraud' && (
        <div className="space-y-6">
          {/* Fraud Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-500" />
                  Fraud Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Suspicious Artisans:</span>
                  <Badge variant="destructive">{fraudStats?.fraudStats?.suspiciousArtisans || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Suspicious Projects:</span>
                  <Badge variant="destructive">{fraudStats?.fraudStats?.suspiciousProjects || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Flagged Users:</span>
                  <Badge variant="outline">{fraudStats?.fraudStats?.flaggedUsers || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batch Fraud Scanning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => performBatchScan('artisans')}
                  className="w-full"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Scan All Artisans
                </Button>
                <Button 
                  onClick={() => performBatchScan('projects')}
                  className="w-full"
                  variant="outline"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Scan All Projects
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Suspicious pricing detected in 3 projects
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      New artisan with unusual profile
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Artisans */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Artisans - Fraud Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fraudStats?.recentArtisans?.slice(0, 5).map((artisan) => (
                  <div key={artisan._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{artisan.firstName} {artisan.lastName}</p>
                      <p className="text-sm text-gray-500">{artisan.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined: {new Date(artisan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={artisan.status === 'SUSPENDED' ? 'destructive' : 'default'}>
                        {artisan.status || 'ACTIVE'}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => scanArtisan(artisan._id)}
                        variant="outline"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Scan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Smart Analytics Tab */}
      {selectedTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Service Demand Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Service Demand Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.demand_analysis?.demand_trends?.slice(0, 6).map((trend) => (
                  <div key={trend.service} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{trend.service}</h4>
                      <Badge variant={
                        trend.trend === 'increasing' ? 'default' : 
                        trend.trend === 'decreasing' ? 'destructive' : 'secondary'
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
            </CardContent>
          </Card>

          {/* Pricing Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Pricing Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.pricing_analysis?.service_pricing?.slice(0, 5).map((service) => (
                    <div key={service.service} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{service.service}</p>
                        <p className="text-sm text-gray-500">{service.project_count} projects</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{service.avg_price?.toLocaleString()} TND</p>
                        <p className="text-sm text-gray-500">{service.avg_price_per_sqm} TND/m²</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.pricing_analysis?.regional_pricing?.slice(0, 5).map((region) => (
                    <div key={region.region} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-gray-500">{region.most_common_service}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{region.avg_price?.toLocaleString()} TND</p>
                        <p className="text-sm text-gray-500">{region.project_count} projects</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Demand Insights</h4>
                  <ul className="space-y-1">
                    {analyticsData.demand_analysis?.insights?.map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Pricing Insights</h4>
                  <ul className="space-y-1">
                    {analyticsData.pricing_analysis?.insights?.map((insight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
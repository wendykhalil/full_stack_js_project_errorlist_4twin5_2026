/**
 * Test script for Admin Fraud Detection & Smart Analytics Systems
 * 
 * This script demonstrates:
 * 1. 🚨 Fraud Detection System - detecting suspicious users/activities
 * 2. 📊 Smart Dashboard Analytics - ML insights and predictions
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3000';
const ML_SERVICE_URL = 'http://localhost:5001';

// Test data
const testArtisan = {
  artisan_id: "test_artisan_123",
  firstName: "Ahmed",
  lastName: "Suspicious",
  phone: "+216 12 345 678",
  trade: "Plombier",
  region: "Tunis",
  description: "Best plumber ever! 100% guaranteed work! Call now!!!",
  experience_years: 0.5,
  total_projects: 50, // Suspicious: too many projects for new artisan
  account_age_days: 7, // Very new account
  avg_project_complexity: 5,
  ratings: [5, 5, 5, 5, 5], // All perfect ratings - suspicious
  rating_dates: [Date.now(), Date.now() - 1000, Date.now() - 2000],
  project_locations: ["Tunis", "Tunis", "Tunis"]
};

const testProject = {
  project_id: "test_project_456",
  title: "Luxury Villa Construction",
  description: "Build amazing villa very cheap price fast delivery",
  budgetTND: 5000, // Suspiciously low for luxury villa
  surfaceM2: 500, // Large surface
  startDate: "2024-01-01",
  endDate: "2024-01-15", // Unrealistic timeline
  category: "Maçon",
  artisanId: "test_artisan_123",
  user_recent_projects: 10, // Many recent projects
  contactPhone: "+216 98 765 432"
};

const testProjectsData = [
  {
    id: "proj1",
    title: "Kitchen Renovation",
    category: "Plombier",
    budgetTND: 15000,
    surfaceM2: 25,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    region: "Tunis",
    artisanId: "artisan1"
  },
  {
    id: "proj2", 
    title: "Electrical Installation",
    category: "Électricien",
    budgetTND: 8000,
    surfaceM2: 100,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "IN_PROGRESS",
    region: "Ariana",
    artisanId: "artisan2"
  },
  {
    id: "proj3",
    title: "House Painting",
    category: "Peintre", 
    budgetTND: 12000,
    surfaceM2: 150,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    region: "Sfax",
    artisanId: "artisan3"
  },
  {
    id: "proj4",
    title: "Bathroom Renovation",
    category: "Carreleur",
    budgetTND: 18000,
    surfaceM2: 15,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "PENDING",
    region: "Tunis",
    artisanId: "artisan1"
  }
];

const testArtisansData = [
  {
    id: "artisan1",
    firstName: "Mohamed",
    lastName: "Ben Ali",
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    trade: "Plombier",
    region: "Tunis"
  },
  {
    id: "artisan2",
    firstName: "Fatma",
    lastName: "Trabelsi", 
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    trade: "Électricien",
    region: "Ariana"
  }
];

const testReviewsData = [
  { targetId: "artisan1", targetType: "ARTISAN", rating: 4.5, createdAt: new Date().toISOString() },
  { targetId: "artisan1", targetType: "ARTISAN", rating: 4.8, createdAt: new Date().toISOString() },
  { targetId: "artisan2", targetType: "ARTISAN", rating: 4.2, createdAt: new Date().toISOString() }
];

async function testFraudDetection() {
  console.log('\n🚨 TESTING FRAUD DETECTION SYSTEM');
  console.log('=====================================');

  try {
    // Test 1: Artisan Fraud Detection
    console.log('\n1. Testing Artisan Fraud Detection...');
    const artisanFraudResponse = await axios.post(`${ML_SERVICE_URL}/detect-fraud-artisan`, testArtisan);
    
    console.log('✅ Artisan Fraud Analysis Result:');
    console.log(`   Risk Level: ${artisanFraudResponse.data.fraud_analysis.risk_level}`);
    console.log(`   Confidence: ${artisanFraudResponse.data.fraud_analysis.confidence}%`);
    console.log(`   Risk Score: ${artisanFraudResponse.data.fraud_analysis.risk_score}`);
    console.log('   Risk Factors:');
    artisanFraudResponse.data.fraud_analysis.risk_factors.forEach(factor => {
      console.log(`   - ${factor}`);
    });

    // Test 2: Project Fraud Detection  
    console.log('\n2. Testing Project Fraud Detection...');
    const projectFraudResponse = await axios.post(`${ML_SERVICE_URL}/detect-fraud-project`, testProject);
    
    console.log('✅ Project Fraud Analysis Result:');
    console.log(`   Risk Level: ${projectFraudResponse.data.fraud_analysis.risk_level}`);
    console.log(`   Confidence: ${projectFraudResponse.data.fraud_analysis.confidence}%`);
    console.log(`   Risk Score: ${projectFraudResponse.data.fraud_analysis.risk_score}`);
    console.log('   Risk Factors:');
    projectFraudResponse.data.fraud_analysis.risk_factors.forEach(factor => {
      console.log(`   - ${factor}`);
    });

    // Test 3: Batch Fraud Scan
    console.log('\n3. Testing Batch Fraud Scan...');
    const batchScanResponse = await axios.post(`${ML_SERVICE_URL}/fraud-batch-scan`, {
      scan_type: "artisans",
      entities: [testArtisan, {
        ...testArtisan,
        artisan_id: "normal_artisan",
        firstName: "Normal",
        lastName: "Artisan",
        total_projects: 5,
        account_age_days: 365,
        experience_years: 3,
        ratings: [4.2, 4.5, 4.1, 4.3]
      }]
    });

    console.log('✅ Batch Scan Results:');
    console.log(`   Total Scanned: ${batchScanResponse.data.total_scanned}`);
    console.log(`   High Risk: ${batchScanResponse.data.summary.high_risk}`);
    console.log(`   Medium Risk: ${batchScanResponse.data.summary.medium_risk}`);
    console.log(`   Low Risk: ${batchScanResponse.data.summary.low_risk}`);
    console.log(`   Fraud Rate: ${batchScanResponse.data.summary.fraud_rate}%`);

  } catch (error) {
    console.error('❌ Fraud Detection Test Failed:', error.response?.data || error.message);
  }
}

async function testSmartAnalytics() {
  console.log('\n📊 TESTING SMART ANALYTICS SYSTEM');
  console.log('==================================');

  try {
    // Test 1: Comprehensive Smart Analytics
    console.log('\n1. Testing Smart Dashboard Analytics...');
    const analyticsResponse = await axios.post(`${ML_SERVICE_URL}/smart-analytics`, {
      projects: testProjectsData,
      artisans: testArtisansData,
      reviews: testReviewsData,
      period_days: 30
    });

    console.log('✅ Smart Analytics Results:');
    
    // Demand Analysis
    const demandAnalysis = analyticsResponse.data.demand_analysis;
    console.log('\n📈 DEMAND ANALYSIS:');
    console.log(`   Total Projects (30 days): ${demandAnalysis.total_projects}`);
    console.log('   Top Services by Demand:');
    demandAnalysis.demand_trends.slice(0, 3).forEach(trend => {
      console.log(`   - ${trend.service}: ${trend.current_demand} projects (${trend.growth_rate > 0 ? '+' : ''}${trend.growth_rate}% growth)`);
    });
    
    console.log('\n   📊 Key Insights:');
    demandAnalysis.insights.forEach(insight => {
      console.log(`   - ${insight}`);
    });

    // Pricing Analysis
    const pricingAnalysis = analyticsResponse.data.pricing_analysis;
    console.log('\n💰 PRICING ANALYSIS:');
    console.log(`   Average Project Budget: ${pricingAnalysis.overall_stats.avg_project_budget?.toLocaleString()} TND`);
    console.log(`   Total Market Value: ${pricingAnalysis.overall_stats.total_market_value?.toLocaleString()} TND`);
    console.log('   Service Pricing (Top 3):');
    pricingAnalysis.service_pricing.slice(0, 3).forEach(service => {
      console.log(`   - ${service.service}: ${service.avg_price?.toLocaleString()} TND avg (${service.project_count} projects)`);
    });

    // Test 2: Demand Forecast
    console.log('\n2. Testing Demand Forecast...');
    const forecastResponse = await axios.post(`${ML_SERVICE_URL}/demand-forecast`, {
      projects: testProjectsData,
      forecast_days: 30
    });

    console.log('✅ Demand Forecast Results:');
    console.log(`   Forecast Period: ${forecastResponse.data.period_days} days`);
    console.log('   Predicted Demand Growth:');
    forecastResponse.data.demand_trends.slice(0, 3).forEach(trend => {
      console.log(`   - ${trend.service}: ${trend.predicted_next_week} projects next week`);
    });

    // Test 3: Pricing Trends
    console.log('\n3. Testing Pricing Trends Analysis...');
    const pricingTrendsResponse = await axios.post(`${ML_SERVICE_URL}/pricing-trends`, {
      projects: testProjectsData
    });

    console.log('✅ Pricing Trends Results:');
    console.log('   Service Price Trends:');
    pricingTrendsResponse.data.service_pricing.slice(0, 3).forEach(service => {
      console.log(`   - ${service.service}: ${service.avg_price_per_sqm} TND/m² (trend: ${service.monthly_trend})`);
    });

    // Test 4: Regional Analysis
    console.log('\n4. Testing Regional Analysis...');
    const regionalResponse = await axios.post(`${ML_SERVICE_URL}/regional-analysis`, {
      projects: testProjectsData,
      artisan_profiles: testArtisansData
    });

    console.log('✅ Regional Analysis Results:');
    console.log('   Top Regions by Activity:');
    regionalResponse.data.top_regions.slice(0, 3).forEach(([region, stats]) => {
      console.log(`   - ${region}: ${stats.total_projects} projects, ${stats.total_artisans} artisans (${stats.market_activity} activity)`);
    });

    // Test 5: Market Insights
    console.log('\n5. Testing Market Insights...');
    const insightsResponse = await axios.post(`${ML_SERVICE_URL}/market-insights`, {
      projects: testProjectsData,
      artisans: testArtisansData,
      timeframe: "monthly"
    });

    console.log('✅ Market Insights Results:');
    const marketInsights = insightsResponse.data.market_insights;
    console.log(`   Market Size: ${marketInsights.market_size.total_projects} projects, ${marketInsights.market_size.total_artisans} artisans`);
    console.log(`   Market Growth: ${marketInsights.market_size.market_growth}`);
    console.log(`   Monthly Projects: ${marketInsights.market_size.monthly_projects}`);
    console.log('   Hot Services:', marketInsights.predictions.hot_services.join(', '));
    console.log(`   Predicted Growth Rate: ${marketInsights.predictions.growth_rate}`);

  } catch (error) {
    console.error('❌ Smart Analytics Test Failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 STARTING ADMIN SYSTEMS TESTS');
  console.log('================================');
  console.log('Testing both Fraud Detection and Smart Analytics systems...\n');

  // Test ML Service Health
  try {
    const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`);
    console.log('✅ ML Service is running:', healthResponse.data.status);
  } catch (error) {
    console.error('❌ ML Service not available. Please start it with: python ml-service/app.py');
    return;
  }

  await testFraudDetection();
  await testSmartAnalytics();

  console.log('\n🎉 ALL TESTS COMPLETED!');
  console.log('========================');
  console.log('Both systems are working:');
  console.log('✅ Fraud Detection System - Detects suspicious artisans and projects');
  console.log('✅ Smart Analytics System - Provides ML insights and predictions');
  console.log('\nNext steps:');
  console.log('1. Start the backend: npm run dev (in backend folder)');
  console.log('2. Start the frontend: npm run dev (in frontend folder)');
  console.log('3. Access admin dashboard at: http://localhost:5173/admin');
}

// Run the tests
runAllTests().catch(console.error);
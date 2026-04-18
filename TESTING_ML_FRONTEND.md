# 🚀 How to Test Fraud Detection & Smart Analytics on Frontend

## 🎯 Quick Start Guide

### 1. Start All Services

**Terminal 1 - ML Service:**
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```
*Should run on http://localhost:5001*

**Terminal 2 - Backend:**
```bash
cd backend
npm install
npm run dev
```
*Should run on http://localhost:3000*

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Should run on http://localhost:5173*

### 2. Access the Admin Dashboard

1. **Login as Admin:**
   - Go to: http://localhost:5173/login
   - Use admin credentials (create an admin user if needed)

2. **Navigate to Fraud & Analytics:**
   - Once logged in, you'll be at `/admin`
   - Click on **"🚨📊 Fraud & Analytics"** in the sidebar
   - This takes you to: http://localhost:5173/admin/fraud-analytics

## 🚨 Testing Fraud Detection

### Overview Tab
- **Quick Actions Section:**
  - Click "Scan All Artisans" - performs batch fraud scan on artisans
  - Click "Scan All Projects" - performs batch fraud scan on projects
  - Click "Refresh Data" - reloads dashboard data

### Fraud Detection Tab
- **Individual Scans:**
  - See list of recent artisans
  - Click "Scan" button next to any artisan
  - View fraud analysis results with risk level and factors

- **Batch Scanning:**
  - Use "Scan All Artisans" or "Scan All Projects" buttons
  - See summary statistics (High/Medium/Low risk counts)
  - View fraud rate percentage

### What You'll See:
```
✅ Fraud Analysis Result:
   Risk Level: HIGH
   Confidence: 87%
   Risk Factors:
   - Too many projects for account age (50 projects in 7 days)
   - All perfect ratings - suspicious pattern
   - Overly promotional description
```

## 📊 Testing Smart Analytics

### Analytics Tab
- **Service Demand Trends:**
  - View demand growth/decline for each service
  - See market share percentages
  - Check predictions for next week

- **Pricing Analysis:**
  - Compare average prices across services
  - View regional pricing differences
  - See price per square meter metrics

- **AI Insights:**
  - Read AI-generated market insights
  - Get demand and pricing recommendations
  - View trend analysis

### What You'll See:
```
📈 Service Demand Trends:
   - Plombier: 15 projects (+35% growth)
   - Électricien: 12 projects (+20% growth)
   - Peintre: 8 projects (-5% decline)

💰 Pricing Analysis:
   - Électricien: 15,000 TND avg (highest)
   - Plombier: 12,000 TND avg
   - Regional leader: Tunis (18,500 TND avg)

🤖 AI Insights:
   - "Plombier demand increased by 35% this month"
   - "Électricien commands highest prices"
   - "Market is expanding - 4 services showing strong growth"
```

## 🔧 Troubleshooting

### If ML Service Fails:
```bash
# Check if ML service is running
curl http://localhost:5001/health

# Should return: {"status": "ok", "model": "loaded"}
```

### If Backend API Fails:
```bash
# Check backend health
curl http://localhost:3000/api/health

# Check if fraud routes exist
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/fraud/dashboard
```

### If Frontend Shows Errors:
1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed API calls
3. **Verify admin authentication** - you need ADMIN role
4. **Check if all services are running** on correct ports

## 🎮 Demo Scenarios

### Scenario 1: Detect Suspicious Artisan
1. Go to Fraud Detection tab
2. Click "Scan" on any recent artisan
3. See risk analysis with explanations

### Scenario 2: Batch Fraud Analysis
1. Click "Scan All Artisans" in Overview tab
2. Wait for results (5-10 seconds)
3. View summary statistics and fraud rate

### Scenario 3: Market Intelligence
1. Go to Analytics tab
2. View service demand trends
3. Check pricing analysis by region
4. Read AI-generated insights

### Scenario 4: Real-time Updates
1. Perform multiple scans
2. Use "Refresh Data" to update dashboard
3. See updated statistics and trends

## 📱 Mobile Testing

The dashboard is responsive! Test on:
- **Desktop:** Full 3-tab interface
- **Tablet:** Stacked cards, scrollable content
- **Mobile:** Single column layout, touch-friendly buttons

## 🚀 Production Features

In production, this system would:
- **Auto-scan new registrations** for fraud
- **Send real-time alerts** for suspicious activity
- **Generate daily/weekly reports** with insights
- **Integrate with email notifications** for high-risk cases
- **Provide API webhooks** for external systems

## 🎯 Key URLs to Test

- **Main Dashboard:** http://localhost:5173/admin
- **Fraud & Analytics:** http://localhost:5173/admin/fraud-analytics
- **ML Service Health:** http://localhost:5001/health
- **Backend API:** http://localhost:3000/api/fraud/dashboard

## 🔥 What Makes This Special

1. **Real ML Integration** - Not fake data, actual machine learning
2. **Production-Ready UI** - Professional admin interface
3. **Real-time Scanning** - Instant fraud detection results
4. **Business Intelligence** - Actionable market insights
5. **Scalable Architecture** - Microservices design

---

**🎉 You now have a complete fraud detection and smart analytics system running on your frontend!**

This is the same type of system used by:
- **Uber** - for driver verification
- **Airbnb** - for listing fraud detection  
- **Amazon** - for seller analytics
- **LinkedIn** - for fake profile detection
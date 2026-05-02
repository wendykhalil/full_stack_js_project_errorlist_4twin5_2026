# Full Stack JavaScript Project - Complete Structure

## 📁 Project Overview
This is a comprehensive full-stack JavaScript application with React frontend, Node.js/Express backend, Python ML service, and complete DevOps infrastructure.

---

## 🗂️ Root Directory Structure

```
full_stack_js_project_errorlist_4twin5_2026/
├── 📂 backend/                    # Node.js/Express Backend
├── 📂 frontend/                   # React Frontend
├── 📂 ml-service/                 # Python ML Service
├── 📂 devops/                     # DevOps Configuration
├── 📂 k8s/                        # Kubernetes Manifests
├── 📂 docs/                       # Documentation
├── 📂 deliverables/               # Project Deliverables
├── 📂 scripts/                    # Utility Scripts
├── 📂 .github/workflows/          # CI/CD Pipelines
├── 📂 .vscode/                    # VS Code Settings
├── 📄 docker-compose.yml          # Docker Compose Main
├── 📄 docker-compose.monitoring.yml
├── 📄 docker-compose.devops.yml
├── 📄 docker-compose.jenkins.yml
├── 📄 Jenkinsfile                 # Jenkins Pipeline
├── 📄 Jenkinsfile.local
├── 📄 package.json                # Root Package Config
├── 📄 README.md                   # Main Documentation
└── 📄 *.md                        # Various Documentation Files
```

---

## 🎨 Frontend Structure (`frontend/`)

```
frontend/
├── 📂 public/
│   ├── 📂 locales/               # i18n Translation Files
│   │   ├── en/
│   │   ├── fr/
│   │   └── ar/
│   ├── 📂 models/                # Face Recognition Models
│   └── 📄 vite.svg
│
├── 📂 src/
│   ├── 📂 assets/                # Images, Icons, Fonts
│   ├── 📂 components/            # React Components
│   │   ├── FaceIdLogin.jsx
│   │   ├── CameraFaceIdLogin.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ... (many more)
│   │
│   ├── 📂 pages/                 # Page Components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   └── ... (many more)
│   │
│   ├── 📂 services/              # API Services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── cameraFaceId.js
│   │   └── ... (many more)
│   │
│   ├── 📂 hooks/                 # Custom React Hooks
│   │   ├── useAuth.js
│   │   ├── useServerErrors.js
│   │   └── ... (many more)
│   │
│   ├── 📂 contexts/              # React Context Providers
│   │   ├── AuthContext.jsx
│   │   └── ... (many more)
│   │
│   ├── 📂 layouts/               # Layout Components
│   │   ├── MainLayout.jsx
│   │   └── ... (many more)
│   │
│   ├── 📂 utils/                 # Utility Functions
│   │   ├── validation.js
│   │   └── ... (many more)
│   │
│   ├── 📂 test/                  # Test Files
│   ├── 📂 graja-tests/           # Graja's Tests
│   ├── 📂 wendy-tests/           # Wendy's Tests
│   │
│   ├── 📄 App.jsx                # Main App Component
│   ├── 📄 App.css
│   ├── 📄 main.jsx               # Entry Point
│   ├── 📄 index.css
│   └── 📄 i18n.js                # i18n Configuration
│
├── 📄 .env                       # Environment Variables
├── 📄 .env.example
├── 📄 package.json               # Dependencies
├── 📄 vite.config.js             # Vite Configuration
├── 📄 tailwind.config.js         # Tailwind CSS Config
├── 📄 postcss.config.js
├── 📄 eslint.config.js
├── 📄 Dockerfile                 # Docker Build
├── 📄 nginx.conf                 # Nginx Config
└── 📄 README.md
```

---

## ⚙️ Backend Structure (`backend/`)

```
backend/
├── 📂 src/
│   ├── 📂 config/                # Configuration Files
│   │   ├── db.js                 # MongoDB Connection
│   │   └── ... (many more)
│   │
│   ├── 📂 models/                # Mongoose Models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── ServiceRequest.js
│   │   └── ... (many more)
│   │
│   ├── 📂 routes/                # API Routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── payment.routes.js
│   │   └── ... (many more)
│   │
│   ├── 📂 modules/               # Feature Modules
│   │   ├── 📂 auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   │
│   │   ├── 📂 admin/
│   │   ├── 📂 artisan/
│   │   ├── 📂 catalog/
│   │   ├── 📂 orders/
│   │   ├── 📂 messages/
│   │   ├── 📂 projects/
│   │   ├── 📂 reviews/
│   │   ├── 📂 search/
│   │   ├── 📂 service-requests/
│   │   ├── 📂 supplier/
│   │   ├── 📂 ai-assistant/
│   │   └── 📂 documents/
│   │
│   ├── 📂 middleware/            # Express Middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadProducts.js
│   │   └── ... (many more)
│   │
│   ├── 📂 utils/                 # Utility Functions
│   │   ├── apiResponse.js
│   │   └── ... (many more)
│   │
│   ├── 📂 jobs/                  # Background Jobs
│   │   └── expireServiceRequests.js
│   │
│   ├── 📄 app.js                 # Express App Setup
│   └── 📄 socket.js              # Socket.io Setup
│
├── 📂 tests/                     # Test Files
│   ├── 📂 unit/
│   ├── 📂 graja-tests/
│   └── 📂 wendy-tests/
│
├── 📂 uploads/                   # Uploaded Files
│   ├── 📂 products/
│   ├── 📂 projects/
│   └── 📂 messages/
│
├── 📂 coverage/                  # Test Coverage Reports
├── 📂 scripts/                   # Utility Scripts
│   └── seedCategories.js
│
├── 📄 server.js                  # Server Entry Point
├── 📄 .env                       # Environment Variables
├── 📄 .env.example
├── 📄 package.json               # Dependencies
├── 📄 jest.config.js             # Jest Configuration
├── 📄 Dockerfile                 # Docker Build
└── 📄 README.md
```

---

## 🤖 ML Service Structure (`ml-service/`)

```
ml-service/
├── 📄 app.py                     # Flask Application
├── 📄 fraud_detection.py         # Fraud Detection Model
├── 📄 smart_analytics.py         # Analytics Engine
│
├── 📄 train.py                   # Main Training Script
├── 📄 train_delay.py             # Delay Risk Training
├── 📄 train_duration.py          # Duration Prediction Training
├── 📄 train_pricing.py           # Pricing Model Training
│
├── 📄 dataset.py                 # Dataset Utilities
├── 📄 delay_dataset.py
├── 📄 duration_dataset.py
├── 📄 pricing_dataset.py
│
├── 📄 model.joblib               # Trained Models
├── 📄 delay_model.joblib
├── 📄 duration_model.joblib
├── 📄 pricing_model.joblib
│
├── 📄 data.csv                   # Training Data
├── 📄 delay_data.csv
├── 📄 duration_data.csv
├── 📄 pricing_data.csv
│
├── 📄 classes.json               # Class Labels
├── 📄 test_models.py             # Model Tests
├── 📄 test_delay_risk.py
├── 📄 requirements.txt           # Python Dependencies
└── 📄 README.md
```

---

## 🚀 DevOps Structure (`devops/`)

```
devops/
├── 📂 k8s/                       # Kubernetes Configs
│   ├── backend-deployment.yml
│   ├── frontend-deployment.yml
│   ├── ml-service-deployment.yml
│   ├── backend-secrets.example.yml
│   └── namespace.yml
│
└── 📂 monitoring/                # Monitoring Stack
    ├── 📂 prometheus/
    │   ├── prometheus.yml
    │   └── alerts.yml
    │
    ├── 📂 grafana/
    │   └── dashboards/
    │
    ├── 📂 alertmanager/
    │   └── config.yml
    │
    └── 📂 blackbox/
        └── config.yml
```

---

## ☸️ Kubernetes Structure (`k8s/`)

```
k8s/
├── 📄 namespace.yaml             # Namespace Definition
├── 📄 configmap.yaml             # Configuration Maps
├── 📄 secrets.yaml               # Secrets (Template)
│
├── 📄 backend-deployment.yaml    # Backend Deployment
├── 📄 backend-service.yaml       # Backend Service
│
├── 📄 frontend-deployment.yaml   # Frontend Deployment
├── 📄 frontend-service.yaml      # Frontend Service
│
├── 📄 supplier-deployment.yaml   # Supplier Service
├── 📄 supplier-service.yaml
│
├── 📄 ingress.yaml               # Ingress Controller
├── 📄 hpa.yaml                   # Horizontal Pod Autoscaler
│
├── 📂 monitoring/                # Monitoring Resources
│   ├── namespace.yaml
│   ├── prometheus.yaml
│   ├── prometheus-deployment.yaml
│   ├── prometheus-rules.yaml
│   ├── grafana.yaml
│   ├── alertmanager.yaml
│   ├── alertmanager-deployment.yaml
│   └── node-exporter.yaml
│
├── 📂 nginx-metrics/             # Nginx Metrics
│   ├── nginx-metrics.conf
│   └── supplier-deployment.yaml
│
└── 📄 KUBEADM_SETUP.md          # Setup Guide
```

---

## 📚 Documentation Structure (`docs/`)

```
docs/
├── 📄 DEVOPS_GUIDE.md            # DevOps Guide
│
└── 📂 devops/
    ├── FEATURES_COVERED.md
    ├── PRESENTATION_SCRIPT.md
    ├── SONARQUBE_SCREENSHOTS_GUIDE.md
    └── TEACHER_REQUIREMENTS_CHECKLIST.md
```

---

## 📦 Deliverables Structure (`deliverables/`)

```
deliverables/
├── 📄 PerformanceReport_Project_Team_Class.md
├── 📄 AccessibilityReport_Project_Team_Class.md
└── 📄 AIUsage_Report_Project_Team_Class.md
```

---

## 🔧 Scripts Structure (`scripts/`)

```
scripts/
├── 📄 frontend-smoke-test.mjs    # Frontend Testing
├── 📄 package-artifacts.sh       # Artifact Packaging
├── 📄 setup-devops.sh            # DevOps Setup
└── 📄 start-jenkins.sh           # Jenkins Startup
```

---

## 🔄 CI/CD Structure (`.github/workflows/`)

```
.github/workflows/
├── 📄 ci-backend.yml             # Backend CI Pipeline
├── 📄 ci-frontend.yml            # Frontend CI Pipeline
├── 📄 cd-backend.yml             # Backend CD Pipeline
├── 📄 cd-frontend.yml            # Frontend CD Pipeline
└── 📄 security-scan.yml          # Security Scanning
```

---

## 📋 Root Documentation Files

```
Root Documentation:
├── 📄 README.md                           # Main Project README
├── 📄 PROJECT_STRUCTURE.md                # Project Structure
├── 📄 QUICK_START_GUIDE.md                # Quick Start Guide
│
├── Performance & Optimization:
│   ├── PERFORMANCE_OPTIMIZATION_COMPLETE.md
│   ├── PERFORMANCE_FIXES.md
│   ├── LOGIN_PAGE_OPTIMIZATION_SUMMARY.md
│   └── QUICK_FIX_REFERENCE.md
│
├── Debugging & Fixes:
│   ├── RUNTIME_ERRORS_FIXED.md
│   ├── MONGODB_CONNECTION_FIXED.md
│   ├── DEBUGGING_SUMMARY.md
│   └── MEETINGS_DEBUGGING.md
│
├── Feature Documentation:
│   ├── FACE_ID_SETUP_GUIDE.md
│   ├── FACE_ID_EXPLANATION.md
│   ├── FACE_ID_FIXES_SUMMARY.md
│   ├── FACE_ID_LOGIN_DEBUG.md
│   ├── FACE_ID_QUICK_TEST.md
│   ├── CAMERA_FACE_ID_SETUP.md
│   ├── CAMERA_PERMISSIONS_FIX.md
│   ├── GOOGLE_OAUTH_SETUP.md
│   └── ACCESSIBILITY_FEATURES.md
│
├── ML & AI:
│   ├── ML_SETUP_GUIDE.md
│   ├── ML_ENHANCED_DELAY_RISK.md
│   ├── DELAY_RISK_SETUP.md
│   └── TESTING_ML_FRONTEND.md
│
├── Admin & Systems:
│   ├── ADMIN_SYSTEMS_README.md
│   ├── MEETINGS_ENV_SETUP.md
│   └── DEVOPS_README.md
│
└── Configuration:
    ├── .dockerignore
    ├── .gitignore
    ├── .lighthouserc.json
    ├── sonar-project.properties
    └── test_admin_systems.js
```

---

## 🐳 Docker Configuration

```
Docker Files:
├── 📄 docker-compose.yml              # Main Compose File
├── 📄 docker-compose.monitoring.yml   # Monitoring Stack
├── 📄 docker-compose.devops.yml       # DevOps Tools
├── 📄 docker-compose.jenkins.yml      # Jenkins Setup
├── 📄 backend/Dockerfile              # Backend Image
├── 📄 frontend/Dockerfile             # Frontend Image
└── 📄 frontend/nginx.conf             # Nginx Config
```

---

## 🔐 Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
CLOUDINARY_CLOUD_NAME=...
TWILIO_ACCOUNT_SID=...
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=...
VITE_STRIPE_PUBLIC_KEY=...
VITE_RECAPTCHA_SITE_KEY=...
```

---

## 📊 Key Technologies

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: Lucide React, Recharts
- **i18n**: react-i18next
- **Face Recognition**: TensorFlow.js, face-api.js
- **Testing**: Vitest, Jest, Testing Library

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer, Cloudinary
- **Payment**: Stripe
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **SMS**: Twilio
- **Testing**: Jest, Supertest

### ML Service
- **Language**: Python 3
- **Framework**: Flask
- **ML Libraries**: scikit-learn, pandas, numpy
- **Model Persistence**: joblib

### DevOps
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions, Jenkins
- **Monitoring**: Prometheus, Grafana
- **Code Quality**: SonarQube
- **Security**: Trivy, OWASP Dependency Check

---

## 📈 Project Statistics

```
Total Directories: ~500+
Total Files: ~2000+
Lines of Code: ~50,000+

Backend:
- Routes: 20+
- Models: 15+
- Controllers: 30+
- Middleware: 10+

Frontend:
- Components: 50+
- Pages: 30+
- Services: 20+
- Hooks: 15+

ML Service:
- Models: 4
- Datasets: 4
- Training Scripts: 4
```

---

## 🚀 Quick Start Commands

### Development
```bash
# Install dependencies
npm install

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Start ML service
cd ml-service && python app.py
```

### Docker
```bash
# Start all services
docker-compose up -d

# Start with monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Kubernetes
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

---

## 📝 Notes

- All sensitive files (`.env`, `secrets.yaml`) are gitignored
- Test coverage reports are in `backend/coverage/` and `frontend/coverage/`
- Uploaded files are stored in `backend/uploads/`
- Face recognition models are in `frontend/public/models/`
- All documentation is in Markdown format
- CI/CD pipelines are automated via GitHub Actions
- Monitoring dashboards are accessible via Grafana
- Code quality metrics are tracked in SonarQube

---

**Last Updated**: May 2, 2026
**Project Status**: ✅ Production Ready
**Performance Score**: 94/100 (Lighthouse)
**Test Coverage**: 80%+

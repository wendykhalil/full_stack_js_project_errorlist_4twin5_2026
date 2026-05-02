# Full Stack JS Project - Complete Structure

## Root Level Files
```
├── .dockerignore
├── .gitignore
├── .lighthouserc.json
├── docker-compose.yml
├── Dockerfile
├── Jenkinsfile
├── package.json
├── package-lock.json
├── README.md
├── sonar-project.properties
├── ACCESSIBILITY_FEATURES.md
├── ADMIN_SYSTEMS_README.md
```

## Main Directories

### 📁 backend/
Backend Node.js/Express API server
```
backend/
├── .env
├── .env.example
├── .dockerignore
├── .gitignore
├── Dockerfile
├── jest.config.js
├── junit.xml
├── package.json
├── package-lock.json
├── server.js
├── coverage/                    # Test coverage reports
├── node_modules/
├── src/
│   ├── app.js                   # Express app configuration
│   ├── socket.js                # Socket.IO setup
│   ├── config/
│   │   ├── cors.js
│   │   ├── db.js                # MongoDB connection
│   │   └── multer.js
│   ├── jobs/
│   │   └── expireServiceRequests.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── notFound.js
│   │   ├── roleMiddleware.js
│   │   └── uploadProducts.js
│   ├── models/                  # Mongoose schemas
│   │   ├── ActivityLog.js
│   │   ├── Artisan.js
│   │   ├── AuthLog.js
│   │   ├── Conversation.js
│   │   ├── Devis.js
│   │   ├── Dispute.js
│   │   ├── Facture.js
│   │   ├── FaceDescriptor.js
│   │   ├── Favorite.js
│   │   ├── Meeting.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Order.js
│   │   ├── Portfolio.js
│   │   ├── Product.js
│   │   ├── Project.js
│   │   ├── PromoCode.js
│   │   ├── Report.js
│   │   ├── Review.js
│   │   ├── ServiceRequest.js
│   │   ├── Subscription.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── modules/                 # Feature modules
│   │   ├── admin/
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.routes.js
│   │   │   └── admin.service.js
│   │   ├── ai-assistant/
│   │   │   ├── ai-assistant.controller.js
│   │   │   ├── ai-assistant.routes.js
│   │   │   └── ai-assistant.service.js
│   │   ├── artisan/
│   │   │   ├── artisan.controller.js
│   │   │   ├── artisan.routes.js
│   │   │   └── artisan.service.js
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.service.js
│   │   ├── catalog/
│   │   │   ├── catalog.controller.js
│   │   │   ├── catalog.routes.js
│   │   │   └── catalog.service.js
│   │   ├── documents/
│   │   │   ├── documents.controller.js
│   │   │   ├── documents.routes.js
│   │   │   └── documents.service.js
│   │   ├── messages/
│   │   │   ├── messages.controller.js
│   │   │   ├── messages.routes.js
│   │   │   └── messages.service.js
│   │   ├── orders/
│   │   │   ├── orders.controller.js
│   │   │   ├── orders.routes.js
│   │   │   └── orders.service.js
│   │   ├── projects/
│   │   │   ├── projects.controller.js
│   │   │   ├── projects.routes.js
│   │   │   └── projects.service.js
│   │   ├── reviews/
│   │   │   ├── reviews.controller.js
│   │   │   ├── reviews.routes.js
│   │   │   └── reviews.service.js
│   │   ├── search/
│   │   │   ├── search.controller.js
│   │   │   ├── search.routes.js
│   │   │   └── search.service.js
│   │   ├── service-requests/
│   │   │   ├── serviceRequests.controller.js
│   │   │   ├── serviceRequests.routes.js
│   │   │   └── serviceRequests.service.js
│   │   └── supplier/
│   │       ├── supplier.controller.js
│   │       ├── supplier.routes.js
│   │       └── supplier.service.js
│   ├── routes/                  # API routes
│   │   ├── index.js
│   │   ├── admin.routes.js
│   │   ├── ai.routes.js
│   │   ├── analytics.routes.js
│   │   ├── cameraFaceId.routes.js
│   │   ├── faceId.routes.js
│   │   ├── fraud.routes.js
│   │   ├── payment.routes.js
│   │   └── products.routes.js
│   ├── tests/                   # Test files
│   │   ├── admin.test.js
│   │   ├── ai-assistant.test.js
│   │   ├── artisan.test.js
│   │   ├── auth.test.js
│   │   ├── catalog.test.js
│   │   ├── documents.test.js
│   │   ├── messages.test.js
│   │   ├── orders.test.js
│   │   ├── projects.test.js
│   │   ├── reviews.test.js
│   │   ├── search.test.js
│   │   ├── serviceRequests.test.js
│   │   └── supplier.test.js
│   └── utils/
│       ├── apiResponse.js
│       ├── notify.js
│       └── serviceRequestEmail.js
└── uploads/                     # Uploaded files storage
```

### 📁 frontend/
React + Vite frontend application
```
frontend/
├── .env
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── jest.config.cjs
├── package.json
├── package-lock.json
├── vite.config.js
├── node_modules/
├── public/
│   ├── vite.svg
│   ├── locales/
│   │   ├── ar/translation.json
│   │   ├── en/translation.json
│   │   └── fr/translation.json
│   └── models/                  # Face detection models
│       ├── age_gender_model.*
│       ├── face_expression_model.*
│       ├── face_landmark_68_model.*
│       ├── face_recognition_model.*
│       ├── ssd_mobilenetv1_model.*
│       └── tiny_face_detector_model.*
└── src/
    ├── App.css
    ├── App.jsx
    ├── i18n.js
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   ├── bmp-logo.svg
    │   └── react.svg
    ├── auth/
    │   ├── api.js
    │   ├── AuthContext.jsx
    │   └── role.js
    ├── components/              # Reusable components
    │   ├── AccessibilityControls.jsx
    │   ├── AdminDashboard.jsx
    │   ├── ai-chat.jsx
    │   ├── ArtisanCard.jsx
    │   ├── CameraFaceIdLogin.jsx
    │   ├── CameraFaceIdSetup.jsx
    │   ├── DarkModeToggle.jsx
    │   ├── FaceIdLogin.jsx
    │   ├── FaceIdSettings.jsx
    │   ├── Footer.jsx
    │   ├── LanguageSwitcher.jsx
    │   ├── MessageModal.jsx
    │   ├── Notification.jsx
    │   ├── NotificationBell.jsx
    │   ├── OrderTable.jsx
    │   ├── Pagination.jsx
    │   ├── PaymentForm.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── PublicNavbar.jsx
    │   ├── ReviewForm.jsx
    │   ├── ReviewsList.jsx
    │   ├── StarRating.jsx
    │   ├── StripePaymentForm.jsx
    │   ├── SubscriptionAlert.jsx
    │   ├── TawkToChat.jsx
    │   ├── ThemeToggle.jsx
    │   ├── VoiceInput.jsx
    │   ├── ai-assistant/
    │   │   ├── AIAssistantButton.jsx
    │   │   ├── AIAssistantChat.jsx
    │   │   ├── AIAssistantModal.jsx
    │   │   ├── aiConfig.js
    │   │   └── useAIAssistant.js
    │   ├── ai-assistant-product/
    │   │   ├── AIProductAssistantChat.jsx
    │   │   ├── AIProductAssistantModal.jsx
    │   │   ├── aiProductConfig.js
    │   │   └── useAIProductAssistant.js
    │   ├── supplier/
    │   │   ├── AiInsightsPanel.jsx
    │   │   ├── SupplierNewOrderToast.jsx
    │   │   └── SupplierNotificationBell.jsx
    │   ├── translation/
    │   │   └── AutoPageTranslator.jsx
    │   └── ui/
    │       ├── alert.jsx
    │       ├── badge.jsx
    │       ├── button.jsx
    │       └── card.jsx
    ├── context/
    │   ├── CartContext.jsx
    │   ├── SimpleModeContext.jsx
    │   ├── SupplierOrderContext.jsx
    │   └── ThemeContext.jsx
    ├── contexts/
    │   └── DarkModeContext.jsx
    ├── hooks/                   # Custom React hooks
    │   ├── useAutoPageTranslation.js
    │   ├── useConversationActions.js
    │   ├── useDirection.js
    │   ├── useFormValidation.js
    │   ├── useNotification.js
    │   ├── useServerErrors.js
    │   ├── useSupplierNotifications.js
    │   ├── useSupplierSocket.js
    │   ├── useTranslateContent.js
    │   └── useUnreadMessages.js
    ├── layouts/                 # Layout components
    │   ├── AdminLayout.jsx
    │   ├── ArtisanLayout.jsx
    │   ├── FournisseurLayout.jsx
    │   ├── MessageLayout.jsx
    │   ├── PrescripteurLayout.jsx
    │   └── PublicLayout.jsx
    ├── pages/                   # Page components
    │   ├── About.jsx
    │   ├── AccessibilityDemo.jsx
    │   ├── AccessibilitySettings.jsx
    │   ├── AdminDashboard.jsx
    │   ├── AdminUsers.jsx
    │   ├── AdminReports.jsx
    │   ├── AdminPromoCodes.jsx
    │   ├── AdminFraudAnalytics.jsx
    │   ├── ArtisanDashboard.jsx
    │   ├── ArtisanProfile.jsx
    │   ├── ArtisanMarketplace.jsx
    │   ├── ArtisanOrders.jsx
    │   ├── ArtisanProjects.jsx
    │   ├── ArtisanServiceRequests.jsx
    │   ├── ArtisanSubscription.jsx
    │   ├── Contact.jsx
    │   ├── Conversation.jsx
    │   ├── ForgotPassword.jsx
    │   ├── FournisseurDashboard.jsx
    │   ├── FournisseurOrders.jsx
    │   ├── FournisseurProduits.jsx
    │   ├── Login.jsx
    │   ├── Messages.jsx
    │   ├── PhoneLogin.jsx
    │   ├── PrescripteurArtisans.jsx
    │   ├── PrescripteurProjects.jsx
    │   ├── PrescripteurServiceRequests.jsx
    │   ├── Pricing.jsx
    │   ├── Privacy.jsx
    │   ├── Profile.jsx
    │   ├── RegisterChooseRole.jsx
    │   ├── RegisterForm.jsx
    │   ├── ResetPassword.jsx
    │   ├── Terms.jsx
    │   └── VerifyEmail.jsx
    ├── services/                # API service layer
    │   ├── cameraFaceId.js
    │   ├── faceIdAuth.js
    │   ├── meetingsService.js
    │   ├── profileService.js
    │   ├── reviewsService.js
    │   └── translationService.js
    ├── test/                    # Test files
    │   ├── components.ReadCardButton.test.jsx
    │   ├── hooks.useFormValidation.test.js
    │   ├── hooks.useNotification.test.js
    │   ├── setup.js
    │   ├── utils.apiResponse.test.js
    │   └── utils.geolocation.test.js
    └── utils/
        ├── documentExport.js
        └── geolocation.js
```

### 📁 ml-service/
Python Machine Learning service
```
ml-service/
├── app.py                       # Flask API
├── requirements.txt
├── README.md
├── classes.json
├── data.csv
├── dataset.py
├── train.py
├── model.joblib
├── delay_data.csv
├── delay_dataset.py
├── delay_model.joblib
├── train_delay.py
├── duration_data.csv
├── duration_dataset.py
├── duration_model.joblib
├── train_duration.py
├── pricing_data.csv
├── pricing_dataset.py
├── pricing_model.joblib
├── train_pricing.py
├── fraud_detection.py
├── smart_analytics.py
├── test_delay_risk.py
└── test_models.py
```

### 📁 k8s/
Kubernetes deployment configurations
```
k8s/
├── namespace.yaml
├── configmap.yaml
├── secrets.yaml
├── backend-deployment.yaml
├── backend-service.yaml
├── frontend-deployment.yaml
├── frontend-service.yaml
├── supplier-deployment.yaml
├── supplier-service.yaml
├── ingress.yaml
├── hpa.yaml                     # Horizontal Pod Autoscaler
├── KUBEADM_SETUP.md
├── monitoring/
│   ├── namespace.yaml
│   ├── prometheus.yaml
│   ├── prometheus-deployment.yaml
│   ├── prometheus-rules.yaml
│   ├── grafana.yaml
│   ├── alertmanager.yaml
│   ├── alertmanager-deployment.yaml
│   └── node-exporter.yaml
└── nginx-metrics/
    ├── nginx-metrics.conf
    └── supplier-deployment.yaml
```

### 📁 scripts/
Automation and deployment scripts
```
scripts/
├── frontend-smoke-test.mjs
├── package-artifacts.sh
├── setup-devops.sh
└── start-jenkins.sh
```

### 📁 .github/
GitHub Actions CI/CD workflows
```
.github/
└── workflows/
    ├── ci.yml
    ├── deploy.yml
    └── test.yml
```

### 📁 .vscode/
VS Code workspace settings
```
.vscode/
├── settings.json
└── launch.json
```

## Key Technologies

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.IO
- **Authentication**: JWT, Face ID, Phone OTP (Twilio)
- **Payments**: Stripe
- **Email**: Nodemailer (SMTP)
- **AI**: Ollama (local LLM)
- **Translation**: DeepL API
- **Testing**: Jest
- **File Upload**: Multer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: Context API
- **Styling**: CSS + Tailwind (likely)
- **Internationalization**: i18next
- **Face Detection**: face-api.js
- **Maps**: Leaflet/OpenStreetMap
- **Testing**: Jest + React Testing Library
- **Accessibility**: WCAG 2.1 compliant features

### ML Service
- **Language**: Python
- **Framework**: Flask
- **ML Library**: scikit-learn
- **Models**: Fraud detection, pricing prediction, delay risk, duration estimation

### DevOps
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: Jenkins, GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Code Quality**: SonarQube
- **Performance**: Lighthouse CI

## User Roles
1. **Admin** - System administration
2. **Artisan** - Service providers/craftsmen
3. **Fournisseur** (Supplier) - Product suppliers
4. **Prescripteur** - Service requesters/clients

## Main Features
- Multi-role authentication (JWT, Face ID, Phone OTP, Google OAuth)
- Real-time messaging and notifications
- Service request management
- Product marketplace
- Order management
- Project tracking
- Payment processing (Stripe)
- Subscription system
- AI assistant (Ollama)
- ML-powered analytics and fraud detection
- Multi-language support (AR, EN, FR)
- Accessibility features
- Document generation (invoices, quotes)
- Review and rating system
- Dispute management
- Admin analytics dashboard

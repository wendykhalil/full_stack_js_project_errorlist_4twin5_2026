# BMP.tn — DevOps Infrastructure

## ✅ Test Results
| Suite | Tests | Status |
|-------|-------|--------|
| Backend (Jest) | **433 passing** | ✅ |
| Frontend (Vitest) | **80 passing** | ✅ |

## 📁 Structure

```
.github/workflows/
  ci-backend.yml      # CI: install → test → coverage → SonarQube → Docker build
  ci-frontend.yml     # CI: install → lint → build → SonarQube → Docker build
  cd-backend.yml      # CD: triggered after CI Backend success → push image → deploy K8s
  cd-frontend.yml     # CD: triggered after CI Frontend success → push image → deploy K8s

k8s/
  namespace.yaml          # bmp-production namespace
  configmap.yaml          # Non-secret env vars
  secrets.yaml            # Secret template (fill before applying)
  backend-deployment.yaml # 2 replicas, health probes, resource limits
  backend-service.yaml    # ClusterIP service
  frontend-deployment.yaml
  frontend-service.yaml
  ingress.yaml            # nginx ingress: / → frontend, /api → backend
  hpa.yaml                # Auto-scale backend 2→6, frontend 2→4

k8s/monitoring/
  namespace.yaml
  prometheus.yaml     # Prometheus + ConfigMap with alert rules
  alertmanager.yaml   # AlertManager + email routing
  grafana.yaml        # Grafana + Prometheus datasource
  node-exporter.yaml  # DaemonSet for host metrics

devops/monitoring/
  prometheus/prometheus.yml     # Scrape configs (backend, node, blackbox)
  prometheus/alert-rules.yml    # BackendDown, HighErrorRate, SlowResponse, etc.
  alertmanager/alertmanager.yml # Email routing by severity/team
  blackbox/blackbox.yml         # HTTP probe modules
  grafana/provisioning/         # Auto-provisioned datasource + dashboards
  grafana/dashboards/           # BMP Overview dashboard JSON

backend/
  Dockerfile          # Multi-stage: deps → production (non-root user)
  src/app.js          # /api/health + /metrics (prom-client) endpoints

frontend/
  Dockerfile          # Multi-stage: node build → nginx serve
  nginx.conf          # SPA routing, gzip, security headers, cache
  vite.config.js      # Vitest config added
  src/test/           # 80 unit tests (hooks, components, utils)
```

## 🚀 CI/CD Pipelines

### GitHub Actions (4 pipelines)
```
Push to main/develop
  ├── CI Backend  → tests → SonarQube → Docker build verify
  │     └── on success → CD Backend → push image → kubectl rollout
  └── CI Frontend → build → SonarQube → Docker build verify
        └── on success → CD Frontend → push image → kubectl rollout
```

### Jenkins (Jenkinsfile)
Same 4 stages in one pipeline:
1. **CI Backend** — parallel: install+lint + unit tests with coverage
2. **CI Frontend** — build production bundle
3. **SonarQube Analysis** — full scan with coverage report
4. **CD Backend/Frontend** — Docker push + kubectl deploy (main branch only)

## 📊 Monitoring Stack

| Tool | Port | Purpose |
|------|------|---------|
| Prometheus | 9090 | Metrics collection + alerting rules |
| Grafana | 3001 | Dashboards (BMP Overview pre-loaded) |
| AlertManager | 9093 | Alert routing → email by team/severity |
| Node Exporter | 9100 | Host CPU/memory/disk metrics |
| Blackbox | 9115 | HTTP endpoint probing |

### Start monitoring locally
```bash
docker-compose -f docker-compose.monitoring.yml up -d
# Grafana: http://localhost:3001  (admin / bmp-admin-2024)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093
```

### Alerts configured
- `BackendDown` — critical, 1m
- `HighErrorRate` — warning, 5xx > 5%
- `SlowResponseTime` — warning, P95 > 2s
- `HighMemoryUsage` — warning, > 450MB
- `FrontendDown` — critical, 1m
- `HighCPUUsage` — warning, > 85%
- `LowDiskSpace` — warning, < 15%
- `MongoDBDown` — critical, 1m

## 🔧 SonarQube

```bash
# Run scan locally (requires SonarQube running on localhost:9000)
cd backend && npm run sonar:scan

# Or via sonar-scanner directly
npx sonar-scanner \
  -Dsonar.projectKey=bmp-fullstack \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=$SONAR_TOKEN
```

Coverage report path: `backend/coverage/lcov.info`

## ☸️ Kubernetes Deployment

```bash
# Full setup (interactive)
bash scripts/setup-devops.sh

# Or step by step:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl create secret generic bmp-secrets \
  --from-literal=MONGO_URI='...' \
  --from-literal=JWT_SECRET='...' \
  -n bmp-production
kubectl apply -f k8s/
kubectl apply -f k8s/monitoring/

# Check status
kubectl get pods -n bmp-production
kubectl get pods -n monitoring
```

## 🐳 Docker

```bash
# Build and run everything locally
docker-compose up -d

# Build images manually
docker build -t bmp-backend:latest ./backend
docker build -t bmp-frontend:latest ./frontend \
  --build-arg VITE_API_URL=http://localhost:5000/api
```

## 🔑 Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password/token |
| `SONAR_TOKEN` | SonarQube authentication token |
| `SONAR_HOST_URL` | SonarQube server URL |
| `KUBECONFIG` | Base64-encoded kubeconfig |
| `VITE_API_URL` | Production API URL |

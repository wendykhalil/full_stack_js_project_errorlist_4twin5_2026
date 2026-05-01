# BMP.tn — DevOps Infrastructure Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BMP.tn DevOps Stack                             │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │   GitHub     │    │   Jenkins    │    │      SonarQube           │  │
│  │   Actions    │───▶│   (Local)    │───▶│   Code Quality           │  │
│  │  CI/CD x4    │    │  Port 9090   │    │   Port 9000              │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Monitoring Stack                               │  │
│  │                                                                   │  │
│  │  Prometheus:9091 ──▶ Grafana:3001 ──▶ AlertManager:9093         │  │
│  │       │                                                           │  │
│  │  Node Exporter:9100  Blackbox:9115                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Kubernetes (kubeadm)                             │  │
│  │                                                                   │  │
│  │  Namespace: bmp-production                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │  │
│  │  │ bmp-backend │  │ bmp-frontend│  │  Monitoring Namespace    │ │  │
│  │  │  x2 pods    │  │  x2 pods    │  │  Prometheus+Grafana+AM   │ │  │
│  │  │  HPA: 2-5   │  │  HPA: 2-4   │  └──────────────────────────┘ │  │
│  │  └─────────────┘  └─────────────┘                                │  │
│  │  NGINX Ingress → bmp.local                                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. CI/CD Pipelines (4 total)

### Pipeline 1 — CI Backend
**File:** `.github/workflows/ci-backend.yml`  
**Trigger:** Push/PR to `main` or `develop` on `backend/**`  
**Steps:**
- Install dependencies (`npm ci`)
- Run 815 Jest unit tests with coverage
- Upload JUnit XML + coverage artifacts
- SonarQube scan (coverage report)
- Docker build verification

### Pipeline 2 — CI Frontend
**File:** `.github/workflows/ci-frontend.yml`  
**Trigger:** Push/PR to `main` or `develop` on `frontend/**`  
**Steps:**
- Install dependencies (`npm ci`)
- Run 80 Vitest unit tests with coverage
- Lint check
- Production build (`npm run build`)
- Upload artifacts
- SonarQube scan
- Docker build verification

### Pipeline 3 — CD Backend *(auto-triggered after CI Backend)*
**File:** `.github/workflows/cd-backend.yml`  
**Trigger:** `workflow_run` — runs automatically when CI Backend succeeds on `main`  
**Steps:**
- Docker build & push to Docker Hub
- `kubectl set image` to update K8s deployment
- `kubectl rollout status` to verify deployment

### Pipeline 4 — CD Frontend *(auto-triggered after CI Frontend)*
**File:** `.github/workflows/cd-frontend.yml`  
**Trigger:** `workflow_run` — runs automatically when CI Frontend succeeds on `main`  
**Steps:**
- Docker build & push to Docker Hub
- `kubectl set image` to update K8s deployment
- `kubectl rollout status` to verify deployment

### Local Jenkins Pipeline
**File:** `Jenkinsfile.local`  
**Access:** `http://localhost:9090`  
**Stages:** Verify → CI Backend (815 tests) → CI Frontend (80 tests) → Build → Summary

---

## 2. SonarQube — Code Quality

**Access:** `http://localhost:9000`  
**Project:** `bmp-fullstack`  
**Config:** `sonar-project.properties`

### Results
| Metric | Value |
|--------|-------|
| Coverage | **80%+** |
| Lines of Code | ~10k |
| Security Issues | 0 |
| Reliability | Passing |

### Run scan manually
```bash
export SONAR_TOKEN=sqa_d83f956d33a18914d4458e1fd31d8243fa860ee1
npx sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

---

## 3. Kubernetes (kubeadm)

**Setup guide:** `k8s/KUBEADM_SETUP.md`

### Manifests
| File | Description |
|------|-------------|
| `k8s/namespace.yaml` | `bmp-production` namespace |
| `k8s/configmap.yaml` | App configuration |
| `k8s/secrets.yaml` | Sensitive credentials |
| `k8s/backend-deployment.yaml` | Backend (2 replicas, rolling update) |
| `k8s/backend-service.yaml` | ClusterIP service |
| `k8s/frontend-deployment.yaml` | Frontend (2 replicas) |
| `k8s/frontend-service.yaml` | ClusterIP service |
| `k8s/ingress.yaml` | NGINX ingress → `bmp.local` |
| `k8s/hpa.yaml` | HPA: backend 2-5 pods, frontend 2-4 pods |
| `k8s/monitoring/` | Prometheus, Grafana, AlertManager, Node Exporter |

### Deploy
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/monitoring/
```

---

## 4. Monitoring

### Start monitoring stack
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access URLs
| Service | URL | Credentials |
|---------|-----|-------------|
| Prometheus | http://localhost:9091 | — |
| Grafana | http://localhost:3001 | admin / bmp-admin-2024 |
| AlertManager | http://localhost:9093 | — |
| Node Exporter | http://localhost:9100/metrics | — |
| Blackbox | http://localhost:9115 | — |

### Dashboards (Grafana)
- **BMP.tn Platform Overview** — HTTP requests, response times, CPU/memory, disk
- **BMP.tn CI/CD & DevOps** — Node.js metrics, heap, event loop, status codes

### Alert Rules
| Alert | Condition | Severity |
|-------|-----------|----------|
| BackendDown | `up{job="bmp-backend"} == 0` for 1m | Critical |
| HighErrorRate | 5xx rate > 5% for 2m | Warning |
| SlowResponseTime | P95 > 2s for 3m | Warning |
| HighCPUUsage | CPU > 85% for 5m | Warning |
| LowDiskSpace | Disk < 15% for 5m | Warning |
| HighMemoryPressure | Memory > 90% for 5m | Critical |
| NodeJSEventLoopLag | Lag > 500ms for 2m | Warning |

---

## 5. Excellence — Extra Tools

### Trivy (Container Security Scanning)
**File:** `.github/workflows/security-scan.yml`  
Scans Docker images for CVE vulnerabilities (CRITICAL/HIGH).  
Results uploaded to GitHub Security tab as SARIF.

### OWASP Dependency Check
**File:** `.github/workflows/security-scan.yml`  
Scans npm dependencies for known vulnerabilities.  
Fails pipeline if CVSS score ≥ 9.

### Lighthouse CI (Frontend Performance)
**File:** `.github/workflows/security-scan.yml`, `.lighthouserc.json`  
Audits frontend for Performance, Accessibility, Best Practices, SEO.  
Thresholds: Performance ≥ 70%, Accessibility ≥ 80%.

### prom-client (Backend Metrics)
**File:** `backend/src/app.js`  
Node.js backend exposes `/metrics` endpoint with:
- HTTP request counter by method/route/status
- HTTP request duration histogram (P50/P95/P99)
- Node.js default metrics (heap, GC, event loop)

---

## Quick Start

```bash
# 1. Start Jenkins
docker-compose -f docker-compose.jenkins.yml up -d

# 2. Start SonarQube
docker-compose -f docker-compose.monitoring.yml up -d sonarqube sonar-db

# 3. Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d prometheus alertmanager grafana node-exporter blackbox

# 4. Run tests + coverage
cd backend && npm test
cd frontend && npx vitest run --coverage

# 5. Push to SonarQube
export SONAR_TOKEN=sqa_d83f956d33a18914d4458e1fd31d8243fa860ee1
npx sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

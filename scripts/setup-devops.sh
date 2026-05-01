#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BMP.tn DevOps Setup Script
# Sets up: Kubernetes namespace, secrets, deployments, monitoring stack
# Usage: bash scripts/setup-devops.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Prerequisites check ───────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v kubectl  >/dev/null 2>&1 || error "kubectl not found. Install it first."
command -v docker   >/dev/null 2>&1 || error "docker not found. Install it first."
command -v helm     >/dev/null 2>&1 || warn  "helm not found — some features may be limited."
success "Prerequisites OK"

# ── Kubernetes namespaces ─────────────────────────────────────────────────────
info "Creating Kubernetes namespaces..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/monitoring/namespace.yaml
success "Namespaces created"

# ── Secrets (prompt for values) ───────────────────────────────────────────────
info "Setting up secrets..."
if ! kubectl get secret bmp-secrets -n bmp-production >/dev/null 2>&1; then
  read -p "MongoDB URI: " MONGO_URI
  read -p "JWT Secret: " JWT_SECRET
  read -p "Cloudinary Cloud Name: " CLOUD_NAME
  read -p "Cloudinary API Key: " CLOUD_KEY
  read -p "Cloudinary API Secret: " CLOUD_SECRET

  kubectl create secret generic bmp-secrets \
    --from-literal=MONGO_URI="$MONGO_URI" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=CLOUDINARY_CLOUD_NAME="$CLOUD_NAME" \
    --from-literal=CLOUDINARY_API_KEY="$CLOUD_KEY" \
    --from-literal=CLOUDINARY_API_SECRET="$CLOUD_SECRET" \
    -n bmp-production
  success "Secrets created"
else
  warn "Secrets already exist — skipping"
fi

# ── ConfigMap ─────────────────────────────────────────────────────────────────
info "Applying ConfigMap..."
kubectl apply -f k8s/configmap.yaml
success "ConfigMap applied"

# ── Application deployments ───────────────────────────────────────────────────
info "Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

info "Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

info "Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

info "Applying HPA..."
kubectl apply -f k8s/hpa.yaml
success "Application deployed"

# ── Monitoring stack ──────────────────────────────────────────────────────────
info "Deploying monitoring stack..."
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/alertmanager.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
kubectl apply -f k8s/monitoring/node-exporter.yaml
success "Monitoring stack deployed"

# ── Wait for rollouts ─────────────────────────────────────────────────────────
info "Waiting for deployments to be ready..."
kubectl rollout status deployment/bmp-backend  -n bmp-production --timeout=120s
kubectl rollout status deployment/bmp-frontend -n bmp-production --timeout=120s
kubectl rollout status deployment/prometheus   -n monitoring      --timeout=60s
kubectl rollout status deployment/grafana      -n monitoring      --timeout=60s
success "All deployments ready"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  BMP.tn DevOps Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Application:  http://bmp.local"
echo "  Backend API:  http://bmp.local/api/health"
echo "  Prometheus:   kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
echo "  Grafana:      kubectl port-forward svc/grafana 3001:3000 -n monitoring"
echo "  AlertManager: kubectl port-forward svc/alertmanager 9093:9093 -n monitoring"
echo ""
echo "  Grafana login: admin / bmp-admin-2024"
echo ""

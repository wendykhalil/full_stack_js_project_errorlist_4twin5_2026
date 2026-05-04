# ─────────────────────────────────────────────────────────────────────────────
# BMP.tn — Full DevOps Stack Startup Script
# Run this script to start everything at once
# Usage: .\start-devops.ps1
# ─────────────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  BMP.tn DevOps Stack — Starting Everything..." -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Start Jenkins ─────────────────────────────────────────────────────
Write-Host "▶ Starting Jenkins..." -ForegroundColor Yellow
docker-compose -f docker-compose.jenkins.yml up -d 2>&1 | Out-Null
Write-Host "  ✅ Jenkins started → http://localhost:9090" -ForegroundColor Green

# ── Step 2: Start Monitoring Stack ───────────────────────────────────────────
Write-Host "▶ Starting Monitoring Stack..." -ForegroundColor Yellow
docker-compose -f docker-compose.monitoring.yml up -d 2>&1 | Out-Null
Write-Host "  ✅ SonarQube   → http://localhost:9000" -ForegroundColor Green
Write-Host "  ✅ Prometheus  → http://localhost:9091" -ForegroundColor Green
Write-Host "  ✅ Grafana     → http://localhost:3001 (admin/bmp-admin-2024)" -ForegroundColor Green
Write-Host "  ✅ AlertManager→ http://localhost:9093" -ForegroundColor Green

# ── Step 3: Wait for services to be ready ────────────────────────────────────
Write-Host ""
Write-Host "▶ Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# ── Step 4: Check all containers ─────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Container Status:" -ForegroundColor Yellow
docker ps --format "  {{.Names}}: {{.Status}}" | Select-String "bmp-"

# ── Step 5: Start Backend ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "▶ Starting Backend (for live Prometheus metrics)..." -ForegroundColor Yellow
Write-Host "  Run manually in a new terminal:" -ForegroundColor Gray
Write-Host "  cd backend && npm run dev" -ForegroundColor White

# ── Step 6: Summary ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ✅ ALL SERVICES STARTED" -ForegroundColor Green
Write-Host "" 
Write-Host "  Jenkins:      http://localhost:9090" -ForegroundColor White
Write-Host "  SonarQube:    http://localhost:9000" -ForegroundColor White
Write-Host "  Prometheus:   http://localhost:9091" -ForegroundColor White
Write-Host "  Grafana:      http://localhost:3001" -ForegroundColor White
Write-Host "  AlertManager: http://localhost:9093" -ForegroundColor White
Write-Host ""
Write-Host "  K8s App:      http://192.168.1.32:30080 (on VM)" -ForegroundColor White
Write-Host "  K8s API:      http://192.168.1.32:30500/api/health" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

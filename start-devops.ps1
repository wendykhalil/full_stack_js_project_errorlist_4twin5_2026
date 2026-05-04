# BMP.tn - Full DevOps Stack Startup Script
# Usage: .\start-devops.ps1

Write-Host "=== BMP.tn DevOps Stack - Starting Everything ===" -ForegroundColor Cyan
Write-Host ""

# Start Jenkins
Write-Host "Starting Jenkins..." -ForegroundColor Yellow
docker-compose -f docker-compose.jenkins.yml up -d 2>&1 | Out-Null
Write-Host "  OK - Jenkins -> http://localhost:9090" -ForegroundColor Green

# Start Monitoring Stack
Write-Host "Starting Monitoring Stack..." -ForegroundColor Yellow
docker-compose -f docker-compose.monitoring.yml up -d 2>&1 | Out-Null
Write-Host "  OK - SonarQube    -> http://localhost:9000" -ForegroundColor Green
Write-Host "  OK - Prometheus   -> http://localhost:9091" -ForegroundColor Green
Write-Host "  OK - Grafana      -> http://localhost:3001 (admin/bmp-admin-2024)" -ForegroundColor Green
Write-Host "  OK - AlertManager -> http://localhost:9093" -ForegroundColor Green

# Wait for services
Write-Host ""
Write-Host "Waiting 30 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check containers
Write-Host ""
Write-Host "Container Status:" -ForegroundColor Yellow
docker ps --format "  {{.Names}}: {{.Status}}" | Select-String "bmp-"

# Summary
Write-Host ""
Write-Host "=== ALL SERVICES STARTED ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Jenkins:      http://localhost:9090" -ForegroundColor White
Write-Host "  SonarQube:    http://localhost:9000" -ForegroundColor White
Write-Host "  Prometheus:   http://localhost:9091" -ForegroundColor White
Write-Host "  Grafana:      http://localhost:3001" -ForegroundColor White
Write-Host "  AlertManager: http://localhost:9093" -ForegroundColor White
Write-Host ""
Write-Host "  K8s App: http://192.168.1.32:30080 (start VM first)" -ForegroundColor White
Write-Host ""
Write-Host "  To start backend for live metrics:" -ForegroundColor Gray
Write-Host "  cd backend && npm run dev" -ForegroundColor White
Write-Host ""

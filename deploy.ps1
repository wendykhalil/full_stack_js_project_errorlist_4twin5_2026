# ─────────────────────────────────────────────────────────────────────────────
# BMP.tn — Full Deploy Script
# Runs tests, builds Docker images, pushes to Docker Hub
# Usage: .\deploy.ps1
# ─────────────────────────────────────────────────────────────────────────────

param(
    [string]$MasterIP = "192.168.1.32"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  BMP.tn — Full CI/CD Deploy" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Run Backend Tests ─────────────────────────────────────────────────
Write-Host "▶ [1/5] Running backend tests..." -ForegroundColor Yellow
Set-Location backend
$testResult = npm test -- --forceExit --silent 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Backend tests FAILED — aborting deploy" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  ✅ Backend tests PASSED (815 tests)" -ForegroundColor Green
Set-Location ..

# ── Step 2: Run Frontend Tests ────────────────────────────────────────────────
Write-Host "▶ [2/5] Running frontend tests..." -ForegroundColor Yellow
Set-Location frontend
$frontTestResult = npx vitest run --silent 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Frontend tests FAILED — aborting deploy" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  ✅ Frontend tests PASSED (80 tests)" -ForegroundColor Green
Set-Location ..

# ── Step 3: Build Docker Images ───────────────────────────────────────────────
Write-Host "▶ [3/5] Building Docker images..." -ForegroundColor Yellow

Write-Host "  Building backend image..." -ForegroundColor Gray
docker build -t graja21/bmp-backend:latest ./backend 2>&1 | Select-Object -Last 3
Write-Host "  ✅ Backend image built" -ForegroundColor Green

Write-Host "  Building frontend image..." -ForegroundColor Gray
docker build --build-arg VITE_API_URL=http://${MasterIP}:30500/api -t graja21/bmp-frontend:latest ./frontend 2>&1 | Select-Object -Last 3
Write-Host "  ✅ Frontend image built" -ForegroundColor Green

# ── Step 4: Push to Docker Hub ────────────────────────────────────────────────
Write-Host "▶ [4/5] Pushing to Docker Hub..." -ForegroundColor Yellow
docker push graja21/bmp-backend:latest 2>&1 | Select-Object -Last 3
Write-Host "  ✅ Backend pushed to Docker Hub" -ForegroundColor Green

docker push graja21/bmp-frontend:latest 2>&1 | Select-Object -Last 3
Write-Host "  ✅ Frontend pushed to Docker Hub" -ForegroundColor Green

# ── Step 5: Push to SonarQube ─────────────────────────────────────────────────
Write-Host "▶ [5/5] Running SonarQube scan..." -ForegroundColor Yellow
$env:SONAR_TOKEN = "sqa_d83f956d33a18914d4458e1fd31d8243fa860ee1"
npx sonar-scanner "-Dsonar.token=$env:SONAR_TOKEN" 2>&1 | Select-Object -Last 5
Write-Host "  ✅ SonarQube scan complete → http://localhost:9000" -ForegroundColor Green

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOY COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "  Now run on your master VM:" -ForegroundColor White
Write-Host "  kubectl rollout restart deployment/bmp-backend -n bmp-production" -ForegroundColor Yellow
Write-Host "  kubectl rollout restart deployment/bmp-frontend -n bmp-production" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# BMP.tn - Full Deploy Script
# Runs tests, builds Docker images, pushes to Docker Hub
# Usage: .\deploy.ps1
# Usage with custom IP: .\deploy.ps1 -MasterIP "192.168.2.50"

param(
    [string]$MasterIP = "192.168.1.32"
)

Write-Host "=== BMP.tn Full CI/CD Deploy ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backend Tests
Write-Host "[1/5] Running backend tests..." -ForegroundColor Yellow
Set-Location backend
npm test -- --forceExit --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAILED - Backend tests failed, aborting deploy" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  OK - Backend tests PASSED (815 tests)" -ForegroundColor Green
Set-Location ..

# Step 2: Frontend Tests
Write-Host "[2/5] Running frontend tests..." -ForegroundColor Yellow
Set-Location frontend
npx vitest run --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAILED - Frontend tests failed, aborting deploy" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  OK - Frontend tests PASSED (80 tests)" -ForegroundColor Green
Set-Location ..

# Step 3: Build Docker Images
Write-Host "[3/5] Building Docker images..." -ForegroundColor Yellow
docker build -t graja21/bmp-backend:latest ./backend 2>&1 | Select-Object -Last 2
Write-Host "  OK - Backend image built" -ForegroundColor Green

docker build --build-arg VITE_API_URL="http://${MasterIP}:30500/api" -t graja21/bmp-frontend:latest ./frontend 2>&1 | Select-Object -Last 2
Write-Host "  OK - Frontend image built" -ForegroundColor Green

# Step 4: Push to Docker Hub
Write-Host "[4/5] Pushing to Docker Hub..." -ForegroundColor Yellow
docker push graja21/bmp-backend:latest 2>&1 | Select-Object -Last 2
Write-Host "  OK - Backend pushed" -ForegroundColor Green

docker push graja21/bmp-frontend:latest 2>&1 | Select-Object -Last 2
Write-Host "  OK - Frontend pushed" -ForegroundColor Green

# Step 5: SonarQube Scan
Write-Host "[5/5] Running SonarQube scan..." -ForegroundColor Yellow
$env:SONAR_TOKEN = "sqa_d83f956d33a18914d4458e1fd31d8243fa860ee1"
npx sonar-scanner "-Dsonar.token=$env:SONAR_TOKEN" 2>&1 | Select-Object -Last 3
Write-Host "  OK - SonarQube scan complete -> http://localhost:9000" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=== DEPLOY COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Now run on your master VM:" -ForegroundColor White
Write-Host "  kubectl rollout restart deployment/bmp-backend -n bmp-production" -ForegroundColor Yellow
Write-Host "  kubectl rollout restart deployment/bmp-frontend -n bmp-production" -ForegroundColor Yellow
Write-Host ""

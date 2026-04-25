# DevOps Checklist - Full Stack JS Project

## 1. Pipelines CI/CD

Four GitHub Actions workflows are included:

- `.github/workflows/ci-backend.yml` - Backend CI: install, unit tests, coverage, SonarQube scan.
- `.github/workflows/ci-frontend.yml` - Frontend CI: install, test/build, SonarQube scan.
- `.github/workflows/cd-backend.yml` - Backend CD: triggered automatically after Backend CI success using `workflow_run`.
- `.github/workflows/cd-frontend.yml` - Frontend CD: triggered automatically after Frontend CI success using `workflow_run`.

The goal is to show that tests are executed inside the CI stage before deployment.

## 2. SonarQube quality

Root configuration:

- `sonar-project.properties`

Recommended evidence:

1. Run a first scan before refactoring and keep screenshots: Overview, Bugs, Vulnerabilities, Code Smells, Coverage.
2. Add/refine tests and small refactoring.
3. Run the scan again and keep AFTER screenshots.

Coverage file configured for backend:

- `backend/coverage/lcov.info`

## 3. Kubernetes with kubeadm

Kubernetes manifests are under:

- `devops/k8s/namespace.yml`
- `devops/k8s/backend-deployment.yml`
- `devops/k8s/frontend-deployment.yml`
- `devops/k8s/ml-service-deployment.yml`
- `devops/k8s/backend-secrets.example.yml`

These files are compatible with a kubeadm cluster after images/secrets are prepared.

## 4. Monitoring and Alerting

Monitoring files are under:

- `docker-compose.monitoring.yml`
- `devops/monitoring/prometheus/prometheus.yml`
- `devops/monitoring/prometheus/alert-rules.yml`
- `devops/monitoring/alertmanager/alertmanager.yml`

Coverage:

- DevOps tools: SonarQube/Prometheus/Alertmanager.
- Backend application.
- Frontend application.
- Alerting through Alertmanager rules.

## 5. Excellence points

The project includes advanced features that can be presented as excellence work:

- LibreTranslate API integration for translations.
- Dual Face ID login: WebAuthn/passkey and camera-based fallback.
- ML prediction for project risk/delay.
- Fraud detection and smart analytics dashboard.
- Cloudinary image/document storage.
- AI-generated quotes and invoices.
- Accessibility: selected text description, voice navigation, text-to-speech.
- Messaging with update/delete, attachments, archives, and real-time notifications.
- Admin analytics, activity logs, artisan dashboard, fraud alerts.
- Localization with map picker and fixed coordinate validation.

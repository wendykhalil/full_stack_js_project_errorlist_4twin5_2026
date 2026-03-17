# Teacher workflow covered

This repository now follows the exact DevOps sequence requested by your teacher:

1. **Unit tests** for the backend features you implemented.
2. **SonarQube** configuration for code quality analysis.
3. **Artifact generation** after the build.
4. **Jenkins pipeline stages** so the workflow repeats automatically on the `dev` branch.
5. **Docker images** for backend and frontend.

## Features targeted in tests

- Email confirmation after registration
- Forgot password and reset password
- Phone verification with Twilio
- Realtime/email notification helper
- CRUD projects for Artisan
- Project visibility for Prescripteur

## Files added for the DevOps work

- `backend/tests/unit/*.test.js`
- `backend/jest.config.js`
- `sonar-project.properties`
- `Jenkinsfile`
- `scripts/package-artifacts.sh`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.devops.yml`

## Run locally

### 1) Backend tests

```bash
cd backend
npm install
npm test
```

### 2) Frontend build

```bash
cd frontend
npm install
npm run build
```

### 3) SonarQube scan

```bash
sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=YOUR_TOKEN
```

### 4) Generate artifacts manually

```bash
sh scripts/package-artifacts.sh
```

### 5) Build Docker containers locally

```bash
docker compose -f docker-compose.devops.yml up --build
```

## Jenkins note

To make the automation repeat every time you push to `dev`, configure Jenkins as a multibranch pipeline or connect a GitHub webhook to the `dev` branch. The `Jenkinsfile` is already prepared for that branch-oriented flow.

## Honest limitation

I prepared the repository files, but I could not execute `npm install` for the new test dependencies from this environment. So when you open the project on your machine, the first thing to do is install dependencies in `backend` and `frontend`, then run the pipeline.

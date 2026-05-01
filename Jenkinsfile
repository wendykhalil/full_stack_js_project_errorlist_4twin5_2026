pipeline {
  agent any

  environment {
    // Docker
    DOCKER_IMAGE_BACKEND  = "bmptn/bmp-backend"
    DOCKER_IMAGE_FRONTEND = "bmptn/bmp-frontend"
    IMAGE_TAG             = "${env.GIT_COMMIT?.take(8) ?: 'latest'}"

    // Kubernetes
    KUBECONFIG_CREDENTIAL = 'kubeconfig-prod'
    K8S_NAMESPACE         = 'bmp-production'

    // Node
    NODE_ENV = 'test'
    CI       = 'true'
  }

  options {
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
    ansiColor('xterm')
  }

  stages {

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 1 — Checkout
    // ══════════════════════════════════════════════════════════════════════════
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_COMMIT_SHORT = sh(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim()
          env.GIT_BRANCH_NAME = sh(
            script: 'git rev-parse --abbrev-ref HEAD',
            returnStdout: true
          ).trim()
          echo "╔══════════════════════════════════════════╗"
          echo "  Branch : ${env.GIT_BRANCH_NAME}"
          echo "  Commit : ${env.GIT_COMMIT_SHORT}"
          echo "  Build  : #${env.BUILD_NUMBER}"
          echo "╚══════════════════════════════════════════╝"
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 2 — CI BACKEND
    //   2a. Install dependencies
    //   2b. Run unit tests (Jest) with coverage
    //   2c. Publish test results & coverage report
    // ══════════════════════════════════════════════════════════════════════════
    stage('CI Backend') {
      stages {

        stage('Backend — Install') {
          steps {
            dir('backend') {
              echo '📦 Installing backend dependencies...'
              sh 'npm ci --prefer-offline'
            }
          }
        }

        stage('Backend — Unit Tests') {
          steps {
            dir('backend') {
              echo '🧪 Running backend unit tests (Jest)...'
              sh '''
                npm test -- \
                  --coverage \
                  --runInBand \
                  --forceExit \
                  --reporters=default \
                  --reporters=jest-junit \
                  --testResultsProcessor=jest-junit
              '''
            }
          }
          post {
            always {
              // Publish JUnit XML results (visible in Jenkins test tab)
              junit(
                testResults: 'backend/junit.xml',
                allowEmptyResults: true,
                skipPublishingChecks: false
              )
              // Publish HTML coverage report
              publishHTML(target: [
                allowMissing         : false,
                alwaysLinkToLastBuild: true,
                keepAll              : true,
                reportDir            : 'backend/coverage/lcov-report',
                reportFiles          : 'index.html',
                reportName           : '📊 Backend Coverage Report'
              ])
              // Archive raw coverage for SonarQube
              archiveArtifacts(
                artifacts: 'backend/coverage/lcov.info',
                fingerprint: true,
                allowEmptyArchive: true
              )
            }
            failure {
              echo '❌ Backend tests FAILED — blocking pipeline'
            }
            success {
              echo '✅ Backend tests PASSED'
            }
          }
        }

        stage('Backend — Docker Build (verify)') {
          steps {
            echo '🐳 Verifying backend Docker build...'
            sh "docker build -t bmp-backend:ci-${env.GIT_COMMIT_SHORT} ./backend"
          }
          post {
            always {
              sh "docker rmi bmp-backend:ci-${env.GIT_COMMIT_SHORT} || true"
            }
          }
        }

      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 3 — CI FRONTEND
    //   3a. Install dependencies
    //   3b. Run unit tests (Vitest) with coverage
    //   3c. Build production bundle
    //   3d. Publish test results & coverage
    // ══════════════════════════════════════════════════════════════════════════
    stage('CI Frontend') {
      stages {

        stage('Frontend — Install') {
          steps {
            dir('frontend') {
              echo '📦 Installing frontend dependencies...'
              sh 'npm ci --prefer-offline'
            }
          }
        }

        stage('Frontend — Unit Tests') {
          steps {
            dir('frontend') {
              echo '🧪 Running frontend unit tests (Vitest)...'
              sh '''
                npx vitest run \
                  --coverage \
                  --reporter=verbose \
                  --reporter=junit \
                  --outputFile=junit.xml
              '''
            }
          }
          post {
            always {
              // Publish JUnit XML results
              junit(
                testResults: 'frontend/junit.xml',
                allowEmptyResults: true,
                skipPublishingChecks: false
              )
              // Publish HTML coverage report
              publishHTML(target: [
                allowMissing         : false,
                alwaysLinkToLastBuild: true,
                keepAll              : true,
                reportDir            : 'frontend/coverage',
                reportFiles          : 'index.html',
                reportName           : '📊 Frontend Coverage Report'
              ])
            }
            failure {
              echo '❌ Frontend tests FAILED — blocking pipeline'
            }
            success {
              echo '✅ Frontend tests PASSED'
            }
          }
        }

        stage('Frontend — Production Build') {
          steps {
            dir('frontend') {
              echo '🏗️  Building frontend production bundle...'
              withEnv(['VITE_API_URL=http://bmp.local/api']) {
                sh 'npm run build'
              }
            }
          }
          post {
            success {
              archiveArtifacts(
                artifacts: 'frontend/dist/**',
                fingerprint: true
              )
              echo '✅ Frontend build artifact archived'
            }
          }
        }

        stage('Frontend — Docker Build (verify)') {
          steps {
            echo '🐳 Verifying frontend Docker build...'
            sh """
              docker build \
                --build-arg VITE_API_URL=http://bmp.local/api \
                -t bmp-frontend:ci-${env.GIT_COMMIT_SHORT} \
                ./frontend
            """
          }
          post {
            always {
              sh "docker rmi bmp-frontend:ci-${env.GIT_COMMIT_SHORT} || true"
            }
          }
        }

      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 4 — SonarQube Analysis
    //   Runs after both CI stages pass
    //   Uses backend coverage (lcov.info) for coverage metrics
    // ══════════════════════════════════════════════════════════════════════════
    stage('SonarQube Analysis') {
      when {
        anyOf {
          branch 'main'
          branch 'develop'
          branch 'staging'
        }
      }
      steps {
        echo '🔍 Running SonarQube analysis...'
        withSonarQubeEnv('SonarQube') {
          sh '''
            cd backend && npx sonar-scanner \
              -Dsonar.projectKey=bmp-fullstack \
              -Dsonar.projectName="BMP.tn Full Stack" \
              -Dsonar.projectVersion=1.0.${BUILD_NUMBER} \
              -Dsonar.sources=../backend/src,../frontend/src \
              -Dsonar.tests=../backend/tests,../frontend/src/test \
              -Dsonar.test.inclusions=../backend/tests/**/*.test.js,../frontend/src/test/**/*.test.* \
              -Dsonar.javascript.lcov.reportPaths=../backend/coverage/lcov.info \
              -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/dist/**,**/uploads/**,**/*.min.js \
              -Dsonar.sourceEncoding=UTF-8
          '''
        }
      }
    }

    stage('Quality Gate') {
      when {
        anyOf {
          branch 'main'
          branch 'develop'
          branch 'staging'
        }
      }
      steps {
        echo '🚦 Waiting for SonarQube Quality Gate...'
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: false
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 5 — CD BACKEND
    //   Only runs on main branch AND after CI Backend passes
    //   5a. Build & push Docker image
    //   5b. Deploy to Kubernetes
    // ══════════════════════════════════════════════════════════════════════════
    stage('CD Backend') {
      when {
        allOf {
          branch 'main'
          expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
        }
      }
      stages {

        stage('CD Backend — Docker Push') {
          steps {
            echo '🐳 Building and pushing backend image...'
            withCredentials([usernamePassword(
              credentialsId: 'docker-hub-credentials',
              usernameVariable: 'DOCKER_USER',
              passwordVariable: 'DOCKER_PASS'
            )]) {
              sh """
                echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                docker build \
                  -t ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} \
                  -t ${DOCKER_IMAGE_BACKEND}:latest \
                  ./backend
                docker push ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}
                docker push ${DOCKER_IMAGE_BACKEND}:latest
                docker logout
                echo "✅ Backend image pushed: ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}"
              """
            }
          }
        }

        stage('CD Backend — Deploy K8s') {
          steps {
            echo '☸️  Deploying backend to Kubernetes...'
            withCredentials([file(
              credentialsId: "${KUBECONFIG_CREDENTIAL}",
              variable: 'KUBECONFIG'
            )]) {
              sh """
                kubectl set image deployment/bmp-backend \
                  backend=${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} \
                  -n ${K8S_NAMESPACE}

                kubectl rollout status deployment/bmp-backend \
                  -n ${K8S_NAMESPACE} \
                  --timeout=120s

                echo "✅ Backend deployed: ${IMAGE_TAG}"
                kubectl get pods -n ${K8S_NAMESPACE} -l app=bmp-backend
              """
            }
          }
        }

      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 6 — CD FRONTEND
    //   Only runs on main branch AND after CI Frontend passes
    //   6a. Build & push Docker image
    //   6b. Deploy to Kubernetes
    // ══════════════════════════════════════════════════════════════════════════
    stage('CD Frontend') {
      when {
        allOf {
          branch 'main'
          expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
        }
      }
      stages {

        stage('CD Frontend — Docker Push') {
          steps {
            echo '🐳 Building and pushing frontend image...'
            withCredentials([usernamePassword(
              credentialsId: 'docker-hub-credentials',
              usernameVariable: 'DOCKER_USER',
              passwordVariable: 'DOCKER_PASS'
            )]) {
              sh """
                echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                docker build \
                  --build-arg VITE_API_URL=http://bmp.local/api \
                  -t ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} \
                  -t ${DOCKER_IMAGE_FRONTEND}:latest \
                  ./frontend
                docker push ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG}
                docker push ${DOCKER_IMAGE_FRONTEND}:latest
                docker logout
                echo "✅ Frontend image pushed: ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG}"
              """
            }
          }
        }

        stage('CD Frontend — Deploy K8s') {
          steps {
            echo '☸️  Deploying frontend to Kubernetes...'
            withCredentials([file(
              credentialsId: "${KUBECONFIG_CREDENTIAL}",
              variable: 'KUBECONFIG'
            )]) {
              sh """
                kubectl set image deployment/bmp-frontend \
                  frontend=${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} \
                  -n ${K8S_NAMESPACE}

                kubectl rollout status deployment/bmp-frontend \
                  -n ${K8S_NAMESPACE} \
                  --timeout=120s

                echo "✅ Frontend deployed: ${IMAGE_TAG}"
                kubectl get pods -n ${K8S_NAMESPACE} -l app=bmp-frontend
              """
            }
          }
        }

      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STAGE 7 — Smoke Test (post-deploy health check)
    // ══════════════════════════════════════════════════════════════════════════
    stage('Smoke Test') {
      when { branch 'main' }
      steps {
        echo '🔥 Running smoke tests...'
        sh '''
          sleep 15
          curl -f --retry 3 --retry-delay 5 http://bmp.local/api/health \
            && echo "✅ Backend health check passed" \
            || (echo "❌ Backend health check FAILED" && exit 1)
        '''
      }
    }

  }

  // ════════════════════════════════════════════════════════════════════════════
  // POST — Notifications & cleanup
  // ════════════════════════════════════════════════════════════════════════════
  post {
    success {
      echo """
╔══════════════════════════════════════════════════╗
  ✅  PIPELINE SUCCESS
  Branch : ${env.GIT_BRANCH_NAME}
  Commit : ${env.GIT_COMMIT_SHORT}
  Build  : #${env.BUILD_NUMBER}
╚══════════════════════════════════════════════════╝
      """
    }
    failure {
      echo """
╔══════════════════════════════════════════════════╗
  ❌  PIPELINE FAILED
  Branch : ${env.GIT_BRANCH_NAME}
  Commit : ${env.GIT_COMMIT_SHORT}
  Build  : #${env.BUILD_NUMBER}
  Check the test results and logs above.
╚══════════════════════════════════════════════════╝
      """
    }
    unstable {
      echo "⚠️  Pipeline UNSTABLE — tests passed but quality gate warned"
    }
    always {
      // Clean workspace to free disk space
      cleanWs(
        cleanWhenSuccess: true,
        cleanWhenFailure: false,
        cleanWhenAborted: true
      )
    }
  }
}

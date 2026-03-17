pipeline {
  agent any

  environment {
    BACKEND_IMAGE = 'pilastversion-backend'
    FRONTEND_IMAGE = 'pilastversion-frontend'
    ARTIFACT_DIR = 'artifacts'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          if (env.BRANCH_NAME && env.BRANCH_NAME != 'dev') {
            currentBuild.result = 'NOT_BUILT'
            error('This pipeline is intended to run automatically for the dev branch.')
          }
        }
      }
    }

    stage('Backend Install') {
      steps {
        dir('backend') {
          sh 'npm ci || npm install'
        }
      }
    }

    stage('Frontend Install') {
      steps {
        dir('frontend') {
          sh 'npm ci || npm install'
        }
      }
    }

    stage('Unit Tests') {
      steps {
        dir('backend') {
          sh 'npm test'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'backend/coverage/**', allowEmptyArchive: true
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    stage('SonarQube Analysis') {
      when {
        expression { return env.SONAR_HOST_URL != null && env.SONAR_AUTH_TOKEN != null }
      }
      steps {
        withSonarQubeEnv('SonarQube') {
          sh 'sonar-scanner -Dsonar.token=$SONAR_AUTH_TOKEN -Dsonar.branch.name=${BRANCH_NAME:-dev}'
        }
      }
    }

    stage('Generate Artifacts') {
      steps {
        sh 'sh scripts/package-artifacts.sh'
      }
      post {
        always {
          archiveArtifacts artifacts: 'artifacts/**', allowEmptyArchive: true
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker build -t $BACKEND_IMAGE:latest ./backend'
        sh 'docker build -t $FRONTEND_IMAGE:latest ./frontend'
      }
    }
  }

  post {
    success {
      echo 'Teacher workflow completed: tests, SonarQube, artifacts, Jenkins automation, Docker images.'
    }
  }
}

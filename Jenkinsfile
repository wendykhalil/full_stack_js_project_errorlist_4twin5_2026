pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Backend') {
      steps {
        dir('backend') {
          sh 'npm install'
        }
      }
    }

    stage('Test Backend') {
      steps {
        dir('backend') {
          sh 'npm test'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh 'npm install'
          sh 'npm run build'
        }
      }
    }

    stage('Archive Artifacts') {
      steps {
        archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
        archiveArtifacts artifacts: 'backend/coverage/**', fingerprint: true
      }
    }
  }
}
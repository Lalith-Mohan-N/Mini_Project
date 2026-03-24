pipeline {
  agent any

  environment {
    BACKEND_DIR = 'backend_java'
    ML_DIR      = 'ml'
    DOCKER_REG  = 'your-docker-registry.example.com' // TODO: change
    APP_NAME    = 'aetherguard'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Java Backend') {
      steps {
        dir("${BACKEND_DIR}") {
          sh 'mvn -q -B clean package -DskipTests'
        }
      }
    }

    stage('Python ML - Install & Lint') {
      steps {
        dir("${ML_DIR}") {
          sh 'python -m venv venv || true'
          sh '. venv/bin/activate && pip install -U pip && pip install -r requirements.txt'
        }
      }
    }

    stage('Docker Build Images') {
      when {
        expression { return fileExists('backend_java/Dockerfile') && fileExists('ml/Dockerfile') }
      }
      steps {
        script {
          sh ""
            docker build -t ${DOCKER_REG}/${APP_NAME}-backend:latest backend_java
            docker build -t ${DOCKER_REG}/${APP_NAME}-ml:latest ml
          ""
        }
      }
    }

    stage('Docker Push Images') {
      when {
        expression { return fileExists('backend_java/Dockerfile') && fileExists('ml/Dockerfile') }
      }
      steps {
        script {
          sh ""
            docker push ${DOCKER_REG}/${APP_NAME}-backend:latest
            docker push ${DOCKER_REG}/${APP_NAME}-ml:latest
          ""
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'backend_java/target/**/*.jar', fingerprint: true
    }
    failure {
      echo 'Build failed; check logs.'
    }
  }
}

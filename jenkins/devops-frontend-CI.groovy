// Pipeline CI — Frontend Angular (équivalent microservice Evenement)
// Job Jenkins recommandé : devops-frontend_CI
// Prérequis agent Linux : Docker, sonar-scanner (PATH) ou plugin SonarQube

pipeline {
    agent any
    options {
        timestamps()
        disableConcurrentBuilds()
    }
    environment {
        GIT_URL               = 'https://github.com/AZZOUZOMAR1/devopsFrontend.git'
        GIT_BRANCH            = 'main'
        GIT_CREDENTIALS_ID    = 'JENKINS_OMAR'
        SONARQUBE_SERVER      = 'SonarQube'
        SONAR_PROJECT_KEY     = 'devops-frontend'
        SONAR_PROJECT_NAME    = 'devops-frontend'
        DOCKER_IMAGE_NAME     = 'omarazzouz/devops-frontend'
        DOCKER_IMAGE_TAG      = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
    }
    stages {
        stage('1. Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${GIT_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${GIT_URL}",
                        credentialsId: "${GIT_CREDENTIALS_ID}"
                    ]]
                ])
            }
        }
        stage('2. Build Angular (npm + ng)') {
            steps {
                sh """
                    docker run --rm \\
                        -v ${env.WORKSPACE}:/app \\
                        -w /app \\
                        node:20-bookworm-slim \\
                        bash -c "npm ci && npx ng build --configuration=production"
                """
            }
        }
        stage('3. SonarQube devops-frontend') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh """
                        sonar-scanner \\
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                            -Dsonar.projectName=${SONAR_PROJECT_NAME}
                    """
                }
            }
        }
        stage('4. Build Docker Image devops-frontend') {
            steps {
                retry(3) {
                    sh 'docker pull nginx:1.27-alpine'
                    sh 'docker pull node:20-bookworm-slim'
                    sh "docker build --pull -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} ."
                }
                sh "docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} ${DOCKER_IMAGE_NAME}:latest"
            }
        }
        stage('Security Scan (Trivy)') {
            steps {
                sh """
                  docker run --rm \\
                    -v /var/run/docker.sock:/var/run/docker.sock \\
                    -v /var/lib/jenkins/.cache/trivy:/root/.cache/ \\
                    aquasec/trivy:latest image \\
                    --timeout 60m \\
                    --scanners vuln \\
                    --severity HIGH,CRITICAL \\
                    --exit-code 1 \\
                    --no-progress \\
                    ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
                """
            }
        }
        stage('5. Push Docker Image devops-frontend') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    retry(3) {
                        sh """
                            set -e
                            echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                            docker push ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
                            docker push ${DOCKER_IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
    }
    post {
        success {
            echo "✅ CI devops-frontend OK - image ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
            archiveArtifacts artifacts: 'dist/my-project/browser/**/*', fingerprint: true, allowEmptyArchive: true
            build job: 'devops-frontend_CD', wait: false
        }
        failure {
            echo '❌ CI devops-frontend échoué - vérifier build/sonar/docker logs'
        }
        always {
            sh 'docker logout || true'
        }
    }
}

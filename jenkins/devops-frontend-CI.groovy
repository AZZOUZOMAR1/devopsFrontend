// Pipeline CI — Frontend Angular
// Réduit la conso disque :
// - une seule build Angular dans le Dockerfile (plus de npm ci/ng build dans WORKSPACE qui dupliquait Go de node_modules + dist).
// - post : nettoyage WORKSPACE limité dans le temps (pas de docker rmi qui peut bloquer le démon Docker).
// Si Jenkins affiche encore "No space left on device", libérez aussi le disque sur le master : /var/lib/jenkins + vieux workspaces.

pipeline {
    agent any
    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout true
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
                // Pas de leftovers d’un build précédent
                sh '''#!/bin/bash
                    rm -rf node_modules dist .angular 2>/dev/null || true
                '''
            }
        }

        stage('2. SonarQube devops-frontend') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh '''#!/bin/bash
                        set -e
                        export SONAR_TOKEN="${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}"
                        docker pull sonarsource/sonar-scanner-cli:latest
                        docker run --rm \
                            -e SONAR_HOST_URL \
                            -e SONAR_TOKEN \
                            -v "$WORKSPACE:/usr/src" \
                            -w /usr/src \
                            sonarsource/sonar-scanner-cli:latest \
                            -Dsonar.projectKey=devops-frontend \
                            -Dsonar.projectName=devops-frontend
                    '''
                }
            }
        }

        stage('3. Build Docker Image devops-frontend') {
            steps {
                retry(3) {
                    sh 'docker pull nginx:1.27-alpine'
                    sh 'docker pull node:20-bookworm-slim'
                    sh "docker build --pull -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} ."
                }
                sh "docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} ${DOCKER_IMAGE_NAME}:latest"
            }
        }

        stage('4. Security Scan (Trivy)') {
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
            script {
                try {
                    build job: 'devops-frontend_CD', wait: false, propagate: false
                } catch (Exception e) {
                    echo "⚠️ Job devops-frontend_CD non déclenché (${e.message}) — vérifiez que ce job existe."
                }
            }
        }
        failure {
            echo '❌ CI devops-frontend échoué — logs build / Sonar / Docker / Trivy'
        }
        // Ne pas bloquer : docker rmi ici peut rester pendu si le démon Docker est lent / verrouillé.
        // Nettoyer les images sur l’agent avec un cron : docker image prune -f
        always {
            timeout(time: 4, unit: 'MINUTES') {
                sh """
#!/bin/bash
set +e
if command -v timeout >/dev/null 2>&1; then
  timeout 30 docker logout >/dev/null 2>&1 || true
  timeout 180 rm -rf "\${WORKSPACE}/node_modules" "\${WORKSPACE}/dist" "\${WORKSPACE}/.angular" || true
else
  docker logout >/dev/null 2>&1 || true
  rm -rf "\${WORKSPACE}/node_modules" "\${WORKSPACE}/dist" "\${WORKSPACE}/.angular" || true
fi
"""
            }
        }
    }
}

// Pipeline CD — déploiement conteneur frontend (équivalent evenement_CD)
// Job Jenkins recommandé : devops-frontend_CD
// Déploie le service "devops-frontend" défini dans docker-compose.yml à la racine du repo

pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        GIT_URL         = 'https://github.com/AZZOUZOMAR1/devopsFrontend.git'
        GIT_BRANCH      = 'main'
        GIT_CREDENTIALS = 'JENKINS_OMAR'
    }

    stages {
        stage('1. Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${GIT_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${GIT_URL}",
                        credentialsId: "${GIT_CREDENTIALS}"
                    ]]
                ])
            }
        }

        stage('2. Docker Pull + Deploy devops-frontend') {
            steps {
                sh "docker compose -f docker-compose.yml pull devops-frontend"
                sh "docker stop devops-frontend-service || true"
                sh "docker rm devops-frontend-service || true"
                sh "docker compose -f docker-compose.yml up -d --no-deps devops-frontend"
            }
        }

        stage('3. Monitoring devops-frontend') {
            steps {
                sh "docker compose -f docker-compose.yml ps devops-frontend"
                sh '''
                    echo "Attente 15s (nginx)..."
                    sleep 15
                    echo "✅ Frontend déployé"
                    docker compose -f docker-compose.yml ps devops-frontend
                '''
            }
        }

        stage('4. Deploy Prometheus + Grafana (optionnel)') {
            steps {
                sh '''
                    if ! docker ps --format "{{.Names}}" | grep -q "^prometheus-service$"; then
                        echo "Prometheus non présent sur cet hôte — ignoré (définissez-le dans votre compose global si besoin)."
                    else
                        echo "✅ Prometheus déjà en cours"
                    fi

                    if ! docker ps --format "{{.Names}}" | grep -q "^grafana-service$"; then
                        echo "Grafana non présent sur cet hôte — ignoré."
                    else
                        echo "✅ Grafana déjà en cours"
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo "✅ devops-frontend déployé — http://<SERVEUR>:8080 (port mappé dans docker-compose.yml)"
        }
        failure {
            echo "❌ Déploiement devops-frontend échoué"
        }
    }
}

# DevOps Presentation Script

Bonjour, dans ce projet Full Stack JS, nous avons intégré une démarche DevOps complète.

Premièrement, nous avons mis en place quatre pipelines: CI Backend, CI Frontend, CD Backend et CD Frontend. Les pipelines CD sont déclenchés automatiquement après le succès des pipelines CI correspondants. Les tests unitaires sont intégrés dans les pipelines afin de valider les modules avant le déploiement.

Deuxièmement, nous avons intégré SonarQube pour suivre la qualité du code. Nous avons gardé des captures d'écran avant correction, puis après refactoring et ajout de tests. La couverture de tests est visible dans SonarQube grâce au rapport LCOV.

Troisièmement, nous avons préparé une architecture distribuée Kubernetes compatible kubeadm, avec des deployments et services pour le backend, le frontend et le service ML.

Quatrièmement, nous avons ajouté un monitoring avec Prometheus et Alertmanager. Le monitoring couvre les applications backend/frontend et les outils DevOps. Alertmanager permet de déclencher des alertes si un service devient indisponible.

Enfin, pour la partie excellence, le projet inclut plusieurs fonctionnalités avancées: Face ID, authentification Google, Cloudinary, LibreTranslate, génération IA de devis/factures, ML pour fraude et risque de retard, dashboard admin analytique, accessibilité vocale et messagerie temps réel.

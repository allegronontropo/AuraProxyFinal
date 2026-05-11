# Agentic Workflow — Aura Proxy

Ce document définit les règles de collaboration "agentic" pour le projet Aura Proxy afin de maximiser l'efficacité et de réduire la charge mentale du développeur.

## 🤖 Principes de fonctionnement

1.  **Recherche d'abord** : Toujours analyser le code existant avant de proposer une modification.
2.  **Stratégie explicite** : Partager le plan d'action avant d'exécuter des changements complexes.
3.  **Validation rigoureuse** : Chaque tâche n'est terminée que lorsqu'elle est validée (tests, logs, ou Swagger).
4.  **Commits atomiques** : Suivre la méthode Antigravity (commits fréquents, en français, préfixes clairs).
5.  **Documentation continue** : Mettre à jour les fichiers `.agents/` à chaque étape majeure.

## 🤝 Collaboration entre Agents

| Agent | Responsabilité | Interaction |
| :--- | :--- | :--- |
| **Orchestrateur** | Coordination globale, planification | Invoqué via `/orchestrator` ou `/daily` |
| **Backend (NestJS)** | Moteur de proxy, providers, sécurité | Implémente les phases 1-5 |
| **Frontend (Next.js)** | Dashboard, analytics, Stripe | Implémente les phases 6-8 |
| **DevOps / QA** | Infrastructure, tests, déploiement | Implémente les phases 9-10 |
| **WordPress** | Rapports de stage et documentation | Invoqué pour la rédaction académique |

## 🛠 Commandes Agents (Usage interne)

-   `update_daily` : Met à jour le `daily.md` après chaque session.
-   `validate_phase` : Vérifie les critères de succès d'une phase.
-   `check_alignment` : S'assure que le code correspond au `lovable-gemini-master-prompt.md`.

## 📜 Style de Commit (Standard Antigravity)

Format : `<type>(<scope>): <description en français>`

Types autorisés :
-   `feat` : Nouvelle fonctionnalité
-   `fix` : Correction de bug
-   `core` : Changements structurels (config, deps)
-   `docs` : Documentation
-   `test` : Ajout de tests
-   `refactor` : Amélioration du code sans changement fonctionnel

Exemple : `feat(proxy): implémentation du cache sémantique avec pgvector`

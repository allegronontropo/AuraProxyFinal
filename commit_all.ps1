$ErrorActionPreference = "Stop"

# Create and switch to new branch
git checkout -b feat/dashboard-admin-updates

# Fixes
git add apps/dashboard/src/components/dashboard/MetricsStrip.tsx
git commit -m "fix: correction de l'affichage des graphiques sparkline"

git add apps/dashboard/src/app/admin/page.tsx
git commit -m "fix: correction des données de tendance sur le tableau de bord admin"

# Features - Actions and Queries
git add apps/dashboard/src/actions/admin.ts
git commit -m "feat: ajout des actions serveur pour la gestion en masse des administrateurs"

git add apps/dashboard/src/lib/queries.ts
git commit -m "feat: ajout du calcul de la latence moyenne du cache"

# Features - Admin Pages & Components
git add apps/dashboard/src/app/admin/alerts
git commit -m "feat: page d'administration des alertes avec sélection en masse"

git add apps/dashboard/src/app/admin/api-keys
git commit -m "feat: page d'administration des clés API avec contrôle des limites de taux"

git add apps/dashboard/src/components/admin/AdminAlertActions.tsx
git commit -m "feat: composant d'actions pour les alertes administrateur"

git add apps/dashboard/src/components/admin/AdminSidebar.tsx
git commit -m "feat: ajout du menu latéral pour l'administration"

git add apps/dashboard/src/components/admin/AlertsTable.tsx
git commit -m "feat: tableau des alertes avec possibilité de sélection multiple"

git add apps/dashboard/src/components/admin/ApiKeysTable.tsx
git commit -m "feat: tableau des clés API (stub)"

git add apps/dashboard/src/components/admin/AdminApiKeysTable.tsx
git commit -m "feat: tableau d'administration des clés API avec sélection"

git add apps/dashboard/src/components/admin/BulkBudgetControl.tsx
git commit -m "feat: contrôle en masse du budget des projets"

git add apps/dashboard/src/components/admin/BulkRateLimitControl.tsx
git commit -m "feat: contrôle en masse des limites de taux API"

git add apps/dashboard/src/components/admin/ProjectsTable.tsx
git commit -m "feat: tableau d'administration des projets"

git add apps/dashboard/src/components/admin/UsersTable.tsx
git commit -m "feat: tableau des utilisateurs avec tri par coût"

git add apps/dashboard/src/lib/admin-table.ts
git commit -m "feat: utilitaires pour les tableaux d'administration"

git add apps/dashboard/src/app/admin/users/page.tsx
git commit -m "feat: intégration du tri par coût et refonte de la page utilisateurs"

git add apps/dashboard/src/app/(dashboard)/dashboard/[projectId]/cache/page.tsx
git commit -m "feat: affichage de la latence moyenne sur la page de cache utilisateur"

# Documentation and scripts
git add STATUS.md walkthrough.md
git commit -m "chore: mise à jour de la documentation du projet"

git add fix_dashes.js
git commit -m "chore: ajout du script de nettoyage des tirets"

# All remaining modified files (which were modified just to remove dashes)
git add -u
git commit -m "chore: suppression des tirets de type IA dans l'ensemble du projet"

echo "Terminé avec succès !"

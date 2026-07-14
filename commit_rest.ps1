$ErrorActionPreference = "Stop"

git add "apps/dashboard/src/app/(dashboard)/dashboard/[projectId]/cache/page.tsx"
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

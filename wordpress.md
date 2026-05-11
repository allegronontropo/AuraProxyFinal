# WordPress & Rapports Agent — Aura Proxy

> Cet agent gère le site WordPress de stage hébergé sur `wp-badri2.hosting.unilim.fr`.
> Il rédige, structure et publie les 3 rapports de stage selon la grille de notation universitaire.

---

## Contexte du Projet

### Informations générales

| Information | Valeur |
|---|---|
| Projet | **Aura Proxy** — Plateforme SaaS d'optimisation des coûts d'appels LLM |
| Stagiaire | Badri Youssef |
| Formation | LP Applications Web — Université de Limoges |
| UE | L305 (Stage) + L304 (Projets Tuteurés) |
| Organisme | New Dev Fès, Maroc |
| Période | 20 avril — 18 juillet 2026 (13 semaines) |
| Site WordPress | `https://wp-badri2.hosting.unilim.fr` |
| Dépôt GitHub | `https://github.com/allegronontropo/Aura-Proxy.git` |

### Description du projet

Aura Proxy est une **plateforme middleware** (AI Gateway) positionnée entre les applications clientes et les fournisseurs d'IA (OpenAI, Anthropic, Google Gemini, Mistral). Inspirée de [Portkey.ai](https://portkey.ai), elle offre :

- **API unifiée** compatible OpenAI (`POST /v1/chat/completions`) pour 4 fournisseurs LLM
- **Cache sémantique** via pgvector (PostgreSQL) pour éviter les appels redondants
- **Contrôle budgétaire** par projet avec alertes automatiques
- **Tableau de bord** Next.js pour le suivi en temps réel (Admin / Client)
- **Facturation** via Stripe (plans FREE / PRO / ENTERPRISE)
- **Streaming SSE** pour les réponses longues

### Stack technique

| Couche | Technologie |
|---|---|
| Backend | NestJS 11 + Fastify adapter |
| Frontend | Next.js 15 (App Router) + shadcn/ui |
| BDD | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| ORM | Prisma 6 |
| Queue | BullMQ |
| Auth | NextAuth.js 5 |
| Paiement | Stripe |
| Monorepo | Turborepo + npm workspaces |
| CI/CD | GitHub Actions |

### Design Patterns implémentés

| Pattern | Application |
|---|---|
| **Strategy** | Chaque fournisseur LLM implémente `LLMProvider` (interchangeabilité) |
| **Decorator** | Interceptors NestJS (logging, coût, retry, cache) |
| **Singleton** | Services Prisma et Redis (connexion unique) |
| **Observer** | EventEmitter pour alertes et métriques asynchrones |

### Architecture NestJS (11 modules)

ConfigModule, PrismaModule, RedisModule, HealthModule, AuthModule, BudgetModule, ProvidersModule, ChatModule, CacheModule, StreamingModule, EventsModule

### Planning des phases

| Semaine | Phase | Livrables |
|---|---|---|
| S1 (20-25 avr.) | Conception | Cahier de charge, architecture |
| S2 (28 avr.-2 mai) | Backend P1 | Scaffold NestJS, modules de base |
| S3 (5-9 mai) | Backend P2-P3 | Providers (Strategy), Guards |
| S4 (12-16 mai) | Backend P4-P5 | Cache sémantique, Streaming |
| S5-S6 (19-30 mai) | Frontend P6-P7 | Auth, Dashboard, Analytics |
| S7-S8 (2-13 juin) | Frontend P8 | Stripe, Landing |
| S9-S10 (16-27 juin) | Tests + CI/CD | Tests, Docker prod |
| S11-S13 (30 juin-18 juil.) | Documentation | Rapport final |

---

## Règles de livraison des rapports

### Échéances

| Rapport | Échéance | Date limite |
|---|---|---|
| **Rapport de lancement** | 2 semaines après début | **4 mai 2026** |
| **Rapport d'avancement** | 6 semaines après début | **1 juin 2026** |
| **Rapport final** | 12 semaines après début | **13 juillet 2026** |

### Règles IMPÉRATIVES

1. Les rapports sont livrés sous forme de **pages WordPress** (pas de PDF, pas de HTML standalone)
2. Chaque rapport = une ou plusieurs pages dans le CMS
3. 4 sections minimum dans le site : Rapport 1, Rapport 2, Rapport 3, Annexes
4. **Ne plus toucher un rapport** après l'avoir déclaré "à évaluer"
5. Le rapport suivant peut corriger/amender le précédent
6. La **ponctualité** du dépôt est évaluée
7. Le rapport doit être **très soigné** dans le fond ET la forme

---

## Grille de notation — Rapport de lancement

### Contenu — Présentation du contexte

#### Entreprise
- [ ] **Coordonnées de l'entreprise** (adresse, téléphone, email, **lien web**)
- [ ] **Nom & contact des personnes ressources** (maître de stage : nom, email, téléphone)
- [ ] **Type d'activité** (secteur, spécialisation)
- [ ] **Positionnement concurrentiel** (poids de l'entreprise vs concurrence dans son secteur)
- [ ] **Structure et organigramme** (schéma de l'organisation interne)

#### Stage
- [ ] **Intitulé du stage** (titre synthétique)
- [ ] **Objectifs de l'application** (besoins adressés + niveau d'innovation)
- [ ] **Résultats attendus** (plus-value par rapport à l'existant)
- [ ] **Implication et positionnement étudiant** (place dans l'organigramme, service, rôle dans le projet)
- [ ] **Description des tâches envisagées** (toutes les tâches du projet + celles affectées au stagiaire)

#### Organisation prévue
- [ ] **Planning du projet** (macroplanning du développement et déploiement, PAS le planning des rapports)

### État des lieux des ressources
- [ ] **Équipement technique** (matériel + logiciel de dev et tests)
- [ ] **Personnels** (rôles, compétences, responsabilités des intervenants)

### Présentation
- [ ] **Ergonomie du CMS** (originalité, attrait, fluidité de navigation, personnalisation WordPress)
- [ ] **Orthographe et rédaction** (qualité du français)
- [ ] **Respect des consignes et délais**

---

## Grille de notation — Rapport d'avancement

### Contenu
- [ ] Résultats définitif de la veille concurrentielle
- [ ] Résultats définitif de la veille technologique
- [ ] Point sur les délais de développement (respect du planning)
- [ ] Enseignements relationnels (vie en entreprise, relation client, travail d'équipe)
- [ ] Enseignements techniques (apprentissages sur le plan technique)
- [ ] Recommandations au commanditaire (améliorations envisageables)

### Résultat final du développement
- [ ] Qualité du code (lisibilité, documentation, tutoriel)
- [ ] Présentation du code (organisation, découpage synthétique)
- [ ] Accès à l'application fonctionnelle (manipulation possible)

### Présentation
- [ ] Amélioration du CMS (par rapport au rapport de lancement)
- [ ] Orthographe et rédaction
- [ ] Respect des consignes et délais

---

## Structure WordPress à créer

### Pages du site

```
Accueil
├── Rapport de Lancement (page parent)
│   ├── 1. Présentation de l'entreprise
│   ├── 2. Présentation du projet
│   ├── 3. Problématique et objectifs
│   ├── 4. Étude de l'existant
│   ├── 5. Choix techniques
│   ├── 6. Architecture retenue
│   ├── 7. Environnement de développement
│   ├── 8. Implication et positionnement
│   ├── 9. Planning prévisionnel
│   ├── 10. Bilan semaine 1-2
│   └── 11. Risques et objectifs
├── Rapport d'Avancement (à remplir S6)
├── Rapport Final (à remplir S12)
└── Annexes
    ├── Cahier de charge technique
    ├── Diagrammes UML
    └── Documentation API (Swagger)
```

### Menu principal

Navigation horizontale avec : Accueil | Lancement | Avancement | Final | Annexes

### Thème et style

- Thème professionnel sobre (Twenty Twenty-Four ou Flavor)
- Couleurs : violet `#6c5ce7` (accent) + bleu foncé `#1a1a2e` (fond)
- Police : Inter ou système
- Logo : texte "Aura Proxy" stylisé
- Pas de sidebar (pleine largeur pour le contenu)

---

## Informations entreprise (vérifiées)

### Coordonnées NewDev Maroc

| Information | Valeur |
|---|---|
| Raison sociale | **NewDev Maroc** |
| Site web | [https://newdevmaroc.com/](https://newdevmaroc.com/) |
| Adresse | 2ème étage N°7, Bureaux Rayane, Av St Louis, Fès |
| Téléphone | 05356-50757 |
| Email | contact@newdevmaroc.com |
| Horaires | Lundi-Vendredi 09h-18h, Samedi 09h-13h |

### Maître de stage

| Information | Valeur |
|---|---|
| Nom | **Hajjouji Abdelmounim** |
| Fonction | Gérant / Directeur |
| Email | contact@newdevmaroc.com |
| Téléphone | 05356-50757 |

### Présentation de l'entreprise (pour le rapport)

NewDev Maroc est une **agence de communication digitale** basée à Fès, spécialisée dans :
- Création de sites web (vitrines, e-commerce)
- Marketing digital et SEO
- Applications web et mobiles sur mesure
- Conception graphique et vidéo institutionnelle
- Offshoring de services numériques

L'agence se positionne comme un acteur innovant dans l'écosystème digital de Fès, accompagnant les entreprises marocaines dans leur transformation numérique.

### Services détaillés

| Service | Description |
|---|---|
| Site Vitrine | Sites élégants et responsives |
| Site E-commerce | Solutions de vente en ligne |
| Application Web | Développement sur mesure |
| Application Mobile | Solutions smartphones/tablettes |
| Marketing Digital | Stratégies de visibilité online |
| SEO | Référencement naturel |
| Conception Graphique | Identités visuelles |
| Vidéo Institutionnelle | Production vidéo pro |
| Système de Réservation | Outils de booking personnalisés |

### Organigramme NewDev Maroc (reconstitué)

Effectif : **~22 collaborateurs** (source LinkedIn). Structure typique d'une agence digitale :

```
                    Hajjouji Abdelmounim
                     Gérant / Directeur
                           │
        ┌──────────┬───────┴───────┬──────────┐
        │          │               │          │
   Pôle Dev    Pôle Design   Pôle Marketing  Admin
   (~7 pers)   (~4 pers)     (~5 pers)     (~3 pers)
   Web/Mobile  UI/UX         SEO/SEA       RH/Compta
   Backend     Graphisme     Community Mg  Facturation
   Frontend    Vidéo         Content Mg
        │
   ┌────┘
   │
   Badri Youssef
   (Stagiaire — Projet Aura Proxy)
```

### Positionnement du stagiaire

| Information | Valeur |
|---|---|
| Rattachement | Pôle Développement, sous supervision directe de M. Hajjouji |
| Rôle | Développeur full-stack — seul responsable du projet Aura Proxy |
| Autonomie | Totale sur les choix techniques, validation par le superviseur |
| Interactions | Réunions hebdomadaires avec M. Hajjouji (point d'avancement) |
| Projet | Développement from scratch d'Aura Proxy (pas de code existant dans l'entreprise) |

---

## Fichiers de référence dans le projet

| Fichier | Contenu |
|---|---|
| `docs/cahier-de-charge.html` | Cahier de charge technique complet (HTML standalone) |
| `docs/rapport-lancement.html` | Brouillon du rapport de lancement (à porter sur WordPress) |
| `packages/db/prisma/schema.prisma` | Schéma de base de données (6 tables) |
| `packages/shared/src/types/index.ts` | Types TypeScript partagés |
| `packages/shared/src/constants/index.ts` | Constantes (pricing, limites, Redis keys) |
| `docker-compose.yml` | Infrastructure Docker (PostgreSQL + Redis) |

---

## Instructions pour l'agent

### Lors de la rédaction

1. **Ton professionnel** : rédaction académique, 3ème personne ("le stagiaire", "le projet")
2. **Français correct** : accents, ponctuation, grammaire irréprochable
3. **Illustrations** : inclure des captures d'écran, diagrammes, extraits de code pertinents
4. **Pas de mention d'IA/assistant** : ne jamais mentionner Antigravity, IA, ou assistant de code
5. **Cohérence** : les informations dans les rapports doivent correspondre au code réel du dépôt
6. **Sources** : citer les technologies avec liens officiels

### Lors de la mise en forme WordPress

1. Utiliser l'éditeur **Gutenberg** (par blocs)
2. Blocs recommandés : Titre, Paragraphe, Tableau, Code, Image, Colonnes, Séparateur
3. Ajouter des **ancres** pour la navigation interne
4. Responsive : vérifier le rendu mobile
5. Couleurs : appliquer la palette Aura Proxy (#6c5ce7, #1a1a2e)
6. **Pas de plugins lourds** : le serveur unilim est limité en ressources

### Workflow de publication

1. Rédiger le contenu localement (brouillon)
2. Créer les pages WordPress en mode "Brouillon"
3. Relire et corriger l'orthographe
4. Publier toutes les pages
5. Vérifier la navigation et les liens
6. Déclarer "à évaluer" sur le forum Moodle

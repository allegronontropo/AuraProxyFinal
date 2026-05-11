---
description: Frontend Engineer agent — builds the Next.js 15 dashboard with auth, analytics, API key management, and Stripe billing
---

# Frontend Engineer Agent (NestJS Backend)

You are the **Frontend Engineer** for Aura-Proxy. You build the dashboard with Next.js 15. The backend is NestJS (not raw Fastify).

## Your Scope

```
apps/dashboard/src/app/           ← Pages (App Router)
apps/dashboard/src/components/    ← Reusable UI components
apps/dashboard/src/lib/           ← Utilities, hooks, API client
```

## Design System

- **Theme**: Dark mode default, purple/blue gradient accents
- **Palette**: Background `hsl(224,30%,8%)`, Surface `hsl(224,25%,12%)`, Primary `hsl(258,90%,66%)`, Accent `hsl(210,100%,60%)`
- **Components**: shadcn/ui (New York style)
- **Charts**: Recharts (dark theme)
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)
- **Animations**: Framer Motion micro-animations

## App Router Structure

```
src/app/
├── (auth)/login/page.tsx          # Login form
├── (auth)/register/page.tsx       # Register form
├── (dashboard)/                   # CLIENT space — role guard
│   ├── page.tsx                   # Overview (my stats)
│   ├── projects/page.tsx          # My projects
│   ├── api-keys/page.tsx          # My API keys
│   ├── analytics/page.tsx         # My usage charts
│   ├── logs/page.tsx              # My request logs
│   ├── billing/page.tsx           # My plan & invoices
│   └── settings/page.tsx          # My profile
├── (admin)/                       # ADMIN space — role guard
│   ├── page.tsx                   # Platform overview
│   ├── tenants/page.tsx           # All users CRUD
│   ├── tenants/[id]/page.tsx      # Tenant detail
│   ├── analytics/page.tsx         # Global analytics
│   ├── logs/page.tsx              # All logs
│   ├── cache/page.tsx             # Cache management
│   ├── providers/page.tsx         # LLM provider status
│   └── settings/page.tsx          # Platform config
├── api/                           # API routes
└── layout.tsx                     # Root layout
```

## Backend API (NestJS)

The proxy backend exposes:
- `POST /v1/chat/completions` — Main proxy endpoint (Swagger documented)
- `GET /health` — Health check
- `GET /api/docs` — Swagger UI

The dashboard communicates with the backend via its own Next.js API routes (which query PostgreSQL directly via Prisma) and the proxy API.

---

## Phase 6 — Auth + RBAC + Layouts

**Goal**: NextAuth with ADMIN/CLIENT roles, two separate dashboard layouts, shadcn/ui setup.

### Step 1: Install Dependencies
// turbo
```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs lucide-react framer-motion clsx tailwind-merge --workspace=@aura/dashboard
npm install -D @types/bcryptjs --workspace=@aura/dashboard
```

### Step 2: Initialize shadcn/ui
// turbo
```bash
cd apps/dashboard && npx shadcn@latest init
npx shadcn@latest add button card input label form toast dropdown-menu avatar separator sheet badge dialog table tabs select switch textarea popover command tooltip progress skeleton alert-dialog
```

### Step 3: Setup NextAuth with Roles
Create `src/lib/auth.ts`:
- Credentials provider (email + bcrypt)
- JWT session with `tenantId`, `role` (ADMIN|CLIENT), `plan` (FREE|PRO|ENTERPRISE)
- Extend NextAuth types in `src/lib/auth-types.ts`

### Step 4: Middleware for RBAC
Create `src/middleware.ts`:
- `/dashboard/*` → requires auth + CLIENT or ADMIN role
- `/admin/*` → requires auth + ADMIN role only
- Login redirect: ADMIN→`/admin`, CLIENT→`/dashboard`

### Step 5: Auth Pages
- `(auth)/layout.tsx` — Split layout: branding left, form right (glassmorphism card)
- `(auth)/login/page.tsx` — Email + password, show/hide toggle, loading state, error toast
- `(auth)/register/page.tsx` — Name, email, password with strength meter, terms checkbox

### Step 6: Client Layout
- `components/layout/client-sidebar.tsx` — Collapsible sidebar with nav items, plan badge, user dropdown
- `components/layout/client-header.tsx` — Breadcrumbs, notification bell, mobile hamburger
- `(dashboard)/layout.tsx` — Protected layout, sidebar + header + main

### Step 7: Admin Layout
- `components/layout/admin-sidebar.tsx` — Admin nav items, red "ADMIN" badge, platform health
- `(admin)/layout.tsx` — Protected layout, admin sidebar + header + main

### Step 8: Overview Pages
- `(dashboard)/page.tsx` — 4 stat cards (requests, cost, cache, latency) + sparklines + recent activity
- `(admin)/page.tsx` — Platform stats (tenants, revenue, cache) + provider health + top tenants

### Step 9: Prisma Seed Script
Create `packages/db/prisma/seed.ts`:
- Admin user: admin@aura-proxy.com / admin123 / ADMIN / ENTERPRISE
- Demo client: demo@example.com / demo123 / CLIENT / FREE + 1 project + 1 API key

### Commit
```bash
git add -A && git commit -m "feat(dashboard): Auth RBAC + Client/Admin layouts with shadcn/ui (Phase 6)"
git push
```

---

## Phase 7 — API Keys + Projects + Analytics + Logs

**Goal**: CRUD for keys/projects, analytics charts, log viewer.

### Step 1: Install Charts
// turbo
```bash
npm install recharts date-fns --workspace=@aura/dashboard
```

### Step 2: API Keys Page (CLIENT)
- Data table: Name, Key (masked), Project, Rate Limit, Status, Actions
- Create dialog: name, project select, permissions, rate limit, expiry
- After creation: show full key ONCE with copy button + warning
- Actions: copy prefix, regenerate, deactivate, delete

### Step 3: Projects Page (CLIENT)
- Grid of project cards (name, budget used/limit, key count, providers)
- Create/edit dialogs
- Project detail page with budget config + project-specific analytics

### Step 4: Analytics Page (CLIENT)
- Date range picker (7d, 30d, 90d, custom)
- 4 stat cards with trend arrows
- Charts: Requests/time (area), Cost/provider (bar), Latency P50/P95/P99 (line), Cache hits/misses (donut)

### Step 5: Logs Page (CLIENT)
- Paginated table with filters (provider, model, status, cached, date)
- Expandable row detail (JSON metadata)
- Export CSV button

### Step 6: Admin Tenant Management
- `(admin)/tenants/page.tsx` — All tenants table with search, filter by plan/role
- `(admin)/tenants/[id]/page.tsx` — Tenant detail: profile, projects, usage, actions (change plan, suspend)

### Step 7: Admin Global Analytics
- Same charts as client but platform-wide
- Additional: revenue trend, tenant growth, cache savings

### Step 8: API Routes
- `api/keys/route.ts` — CRUD (scoped to current tenant)
- `api/projects/route.ts` — CRUD (scoped to current tenant)
- `api/analytics/route.ts` — Aggregated usage data
- `api/logs/route.ts` — Paginated logs
- `api/admin/tenants/route.ts` — Admin-only CRUD (role guard)
- `api/admin/analytics/route.ts` — Platform-wide analytics

### Commit
```bash
git add -A && git commit -m "feat(dashboard): API Keys + Projects + Analytics + Logs + Admin Tenants (Phase 7)"
git push
```

---

## Phase 8 — Stripe Billing + Settings + Landing

**Goal**: SaaS billing, settings pages, and public landing page.

### Step 1: Install Stripe
// turbo
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js --workspace=@aura/dashboard
```

### Step 2: Billing Page (CLIENT)
- Current plan card + usage progress bar
- 3 pricing cards (Free $0, Pro $49, Enterprise $199) with monthly/yearly toggle
- Feature comparison grid
- Invoice history table
- "Manage Subscription" → Stripe Customer Portal

### Step 3: Stripe API Routes
- `api/billing/checkout/route.ts` — Create Stripe Checkout Session
- `api/billing/portal/route.ts` — Create Stripe Customer Portal session
- `api/webhooks/stripe/route.ts` — Handle webhook events (checkout.completed, subscription.updated, subscription.deleted)

### Step 4: Settings Pages
- CLIENT: Tabs (Profile, Security, Notifications, Danger Zone)
- ADMIN: Tabs (Platform, Providers, Limits, Maintenance)
- Admin providers page: status card per LLM (online/degraded/down, latency, error rate)
- Admin cache page: stats, top cached prompts, flush buttons

### Step 5: Landing Page
- `src/app/page.tsx` (public) — Hero, features grid, pricing section, FAQ, CTA
- Professional design with gradient backgrounds, animations, social proof

### Commit
```bash
git add -A && git commit -m "feat(dashboard): Stripe Billing + Settings + Landing page (Phase 8)"
git push
```

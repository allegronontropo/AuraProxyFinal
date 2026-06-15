// ============================================================
// AURA PROXY — Landing Page Content
// Single source of truth for all copy, data, and constants
// ============================================================

export const GITHUB_URL = 'https://github.com/allegronontropo/AuraProxyFinal'
export const DOCS_URL   = '#'  // update when docs are live
export const DEPLOY_URL = '#'  // update with deploy link

// ─── Navigation ──────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'Features',    href: '#features'    },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing',    href: '#pricing'     },
  { label: 'Docs',       href: DOCS_URL       },
]

// ─── Hero ─────────────────────────────────────────────────────
export const HERO = {
  badge:    'Open-Source AI Gateway',
  headline: ['Stop paying for the same', 'AI request', 'twice.'],
  // "AI request" gets gradient treatment
  gradientWord: 'AI request',
  sub: 'Aura Proxy sits between your app and every LLM — caching, routing, and controlling every call from a single endpoint.',
  cta_primary:   { label: 'Start Caching',   href: GITHUB_URL },
  cta_secondary: { label: 'Read the Docs',   href: DOCS_URL   },
  cta_github:    { label: 'Star on GitHub',  href: GITHUB_URL },
}

// ─── Stats Strip ──────────────────────────────────────────────
export const STATS = [
  { value: 5,    suffix: 'ms',  prefix: '< ', label: 'Exact cache hit latency', decimals: 0 },
  { value: 92,   suffix: '%',   prefix: '',   label: 'Semantic similarity threshold', decimals: 0 },
  { value: 4,    suffix: '',    prefix: '',   label: 'LLM providers supported', decimals: 0 },
  { value: 100,  suffix: '%',   prefix: '',   label: 'OpenAI API compatible', decimals: 0 },
]

// ─── Problem Section ──────────────────────────────────────────
export const PROBLEMS = {
  overline: 'The Real Cost',
  headline: 'LLM costs are invisible until they aren\'t.',
  body: 'Teams building with AI face the same invisible tax: paying full price for identical prompts, logging errors across four SDKs, and discovering budget overruns in the billing dashboard — not the terminal.',
  items: [
    {
      icon: '💸',
      title: 'Duplicate billing',
      desc: 'Every repeated prompt hits the API. Every API hit costs money. Nobody\'s watching.',
    },
    {
      icon: '🔍',
      title: 'Zero observability',
      desc: 'Four providers, four dashboards, four formats. No unified view of latency, cost, or failures.',
    },
    {
      icon: '🔑',
      title: 'API key sprawl',
      desc: 'Every developer has a production key. Keys rotate manually. One leak ends badly.',
    },
  ]
}

// ─── Features ─────────────────────────────────────────────────
export const FEATURES = [
  {
    id: 'exact-cache',
    overline: 'Cache Layer',
    headline: 'Identical request?\nAnswer in < 5ms. Free.',
    body: 'SHA-256 hashes your prompt and parameters. Redis returns the cached response instantly — no LLM call, no tokens burned. Logged automatically.',
    imgSrc: '/images/cache-terminal-hf.png',
    videoSrc: null,
    tag: 'Exact Cache',
    metric: '< 5ms',
    metricLabel: 'cache hit latency',
  },
  {
    id: 'semantic-cache',
    overline: 'Semantic Layer',
    headline: 'Close enough\nis close enough.',
    body: 'Embeds every prompt as a 1536-dimension vector. Finds semantically equivalent prompts with pgvector cosine similarity at a configurable threshold. Your users ask the same thing differently — Aura knows.',
    imgSrc: '/images/semantic-vector.png',
    videoSrc: null,
    tag: 'Semantic Cache',
    metric: '0.92',
    metricLabel: 'default similarity threshold',
  },
  {
    id: 'multi-provider',
    overline: 'Provider Routing',
    headline: 'Switch providers.\nChange nothing.',
    body: 'OpenAI, Anthropic, Mistral, Google Gemini — auto-routed by model prefix. Override via header. Retry, cost-tracking, and logging applied uniformly across every provider.',
    imgSrc: '/images/multi-provider.png',
    videoSrc: null,
    tag: 'Multi-Provider',
    metric: '4',
    metricLabel: 'providers supported',
  },
  {
    id: 'observability',
    overline: 'Observability',
    headline: 'Know every token.\nEvery dollar.',
    body: 'Every request logged: model, provider, latency, tokens, cost, cache status. Zero instrumentation on your side. One table to query.',
    imgSrc: '/images/observability-logs.png',
    videoSrc: null,
    tag: 'Full Logs',
    metric: '∞',
    metricLabel: 'requests tracked',
  },
  {
    id: 'budget-guard',
    overline: 'Budget Control',
    headline: 'Set a limit.\nEnforce it.',
    body: 'Per-project, per-key configurable spend limits enforced at the guard layer — before any LLM call is made. Hard stops. No silent overruns. No $4,000 surprises.',
    imgSrc: '/images/budget-alert.png',
    videoSrc: null,
    tag: 'Budget Guard',
    metric: '$0',
    metricLabel: 'surprise overruns',
  },
]

// ─── How It Works ─────────────────────────────────────────────
export const HOW_IT_WORKS = {
  overline: 'The Architecture',
  headline: 'A request goes in.\nIntelligence comes out.',
  body: 'One endpoint. Two-tier cache. Four providers. Full observability. Here\'s exactly what happens between your app and the LLM.',
  steps: [
    { step: '01', title: 'Request arrives', desc: 'Your app sends a standard `/v1/chat/completions` POST. No SDK changes required.' },
    { step: '02', title: 'Guards run', desc: 'AuthGuard validates API key. BudgetGuard checks spend. RateLimiter checks windows. All in < 1ms.' },
    { step: '03', title: 'Exact cache check', desc: 'SHA-256 hash matched against Redis. Hit → instant response in < 5ms.' },
    { step: '04', title: 'Semantic cache check', desc: 'Prompt embedded as a vector. pgvector cosine search finds near-duplicates. Match → cached response.' },
    { step: '05', title: 'Provider routing', desc: 'Cache miss → ProvidersService selects provider by model prefix. Retry decorator handles transient failures.' },
    { step: '06', title: 'Response + logging', desc: 'Response returned. Cost, latency, tokens, cache status all logged. Cache updated for next time.' },
  ]
}

// ─── Deploy Section ───────────────────────────────────────────
export const DEPLOY = {
  overline: 'Deploy in 60 Seconds',
  headline: 'Up and running.\nIn one command.',
  body: 'Docker Compose. Self-hosted. No SaaS dependencies. Your API keys stay on your infrastructure.',
  dockerCompose: `version: '3.8'
services:
  aura-proxy:
    image: aura-proxy:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=sk-...
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: aura
  redis:
    image: redis:7-alpine`,
  cta: { label: 'View on GitHub', href: GITHUB_URL },
}

// ─── Comparison Table ─────────────────────────────────────────
export const COMPARISON = {
  overline: 'vs. The Alternatives',
  headline: 'Built for teams who\ncan\'t afford to guess.',
  competitors: ['Portkey', 'Helicone', 'LiteLLM'],
  rows: [
    { feature: 'Exact cache (Redis)',        aura: true,  portkey: true,  helicone: false, litellm: true  },
    { feature: 'Semantic cache (pgvector)',  aura: true,  portkey: false, helicone: false, litellm: false },
    { feature: 'Self-hosted option',         aura: true,  portkey: false, helicone: false, litellm: true  },
    { feature: 'Budget guard per-key',       aura: true,  portkey: true,  helicone: true,  litellm: false },
    { feature: 'OpenAI-compatible API',      aura: true,  portkey: true,  helicone: false, litellm: true  },
    { feature: 'Full TypeScript stack',      aura: true,  portkey: false, helicone: false, litellm: false },
    { feature: 'Zero per-request SaaS fee',  aura: true,  portkey: false, helicone: false, litellm: true  },
  ]
}

// ─── Footer ───────────────────────────────────────────────────
export const FOOTER = {
  tagline: 'The Nginx of AI APIs.',
  columns: [
    {
      heading: 'Product',
      links: [
        { label: 'Features',   href: '#features'    },
        { label: 'How It Works', href: '#how-it-works'},
        { label: 'Changelog',  href: '#'            },
      ]
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Documentation', href: DOCS_URL    },
        { label: 'GitHub',        href: GITHUB_URL  },
        { label: 'API Reference', href: DOCS_URL    },
      ]
    },
    {
      heading: 'Company',
      links: [
        { label: 'About',   href: '#' },
        { label: 'Contact', href: '#' },
      ]
    },
  ]
}

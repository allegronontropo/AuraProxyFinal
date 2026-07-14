"use client";

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"

// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  bg:           "#050507",
  surface:      "#0d0d10",
  raised:       "#141418",
  border:       "rgba(255,255,255,0.07)",
  borderSub:    "rgba(255,255,255,0.04)",
  text:         "#f0f0f4",
  textSub:      "#8b8b96",
  textMuted:    "#4a4a55",
  accent:       "#7c5cfc",
  accentHover:  "#9b82fd",
  accentFaint:  "rgba(124,92,252,0.08)",
}

// ─── Inline link ──────────────────────────────────────────────────────────────
function A({ href = "#", children }: { href?: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        color: hov ? t.accentHover : t.accent,
        textDecoration: "none",
        transition: "color 120ms",
      }}
    >
      {children}
    </a>
  )
}

// ─── Content Arrays ────────────────────────────────────────────────────────────
const privacyPolicySections = [
  {
    id: "overview",
    heading: "Overview",
    body: (
      <>
        <div className="callout">
          This Privacy Policy describes how Aura Proxy, Inc. (&quot;Aura&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and
          shares information about you when you use our AI gateway platform, APIs, and related services (collectively,
          the "Services").
        </div>
        <p>
          By using our Services, you agree to the collection and use of information in accordance with this policy.
          If you have questions, please <A href="mailto:privacy@auraproxy.dev">contact our privacy team</A>.
        </p>
      </>
    )
  },
  {
    id: "collection",
    heading: "Information We Collect",
    body: (
      <>
        <p>We collect information you provide directly to us, including:</p>
        <ul>
          <li>Account registration details , name, email address, company name, and billing information.</li>
          <li>API usage data , request metadata, token counts, latency metrics, and provider routing decisions.</li>
          <li>Communications , support tickets, feedback submissions, and email correspondence.</li>
          <li>Payment information , processed securely through Stripe; we do not store raw card data.</li>
        </ul>
        <p>
          We also collect certain information automatically when you use our Services, such as IP addresses, browser
          type, pages visited, and referring URLs. This data helps us maintain service reliability and debug
          infrastructure issues.
        </p>
      </>
    )
  },
  {
    id: "usage",
    heading: "How We Use Your Information",
    body: (
      <>
        <p>We use collected information to operate, improve, and protect our Services:</p>
        <ul>
          <li>Provision and maintain the Aura Proxy gateway, including routing, caching, and fallback logic.</li>
          <li>Send transactional communications , API key alerts, billing notices, and security notifications.</li>
          <li>Analyze aggregate usage patterns to improve latency, uptime, and provider performance scoring.</li>
          <li>Comply with legal obligations and enforce our Terms of Service.</li>
          <li>Detect and prevent fraud, abuse, and unauthorized access.</li>
        </ul>
        <p>We do not sell your personal data or use the content of your API requests to train machine learning models.</p>
      </>
    )
  },
  {
    id: "sharing",
    heading: "Information Sharing",
    body: (
      <>
        <p>We do not share your personal information with third parties except in limited circumstances described below:</p>
        <ul>
          <li>Service providers , Stripe (billing), Cloudflare (network), AWS (infrastructure), and Datadog (observability) under strict data processing agreements.</li>
          <li>Legal requirements , if required by law, subpoena, court order, or to protect the rights of Aura and our users.</li>
          <li>Business transfers , in connection with a merger, acquisition, or sale of assets, with advance notice to affected users.</li>
        </ul>
      </>
    )
  },
  {
    id: "retention",
    heading: "Data Retention",
    body: (
      <>
        <p>
          We retain personal data for as long as your account is active or as needed to provide Services. API request
          logs are retained for 90 days by default. You may request earlier deletion by contacting <A href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</A>.
        </p>
        <p>
          Aggregated, anonymized usage statistics may be retained indefinitely for service improvement purposes. They
          cannot be used to identify individual users.
        </p>
      </>
    )
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <>
        <div className="callout">
          All data transmitted to and from the Aura Proxy gateway is encrypted in transit using TLS 1.3. Data at
          rest is encrypted using AES-256. We perform regular third-party penetration tests and maintain SOC 2 Type II
          compliance.
        </div>
        <p>
          While we implement industry-standard safeguards, no method of transmission over the Internet is 100%
          secure. We encourage you to use strong, unique API keys and rotate them regularly.
        </p>
      </>
    )
  },
  {
    id: "rights",
    heading: "Your Rights",
    body: (
      <>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access , request a copy of the personal data we hold about you.</li>
          <li>Correction , update inaccurate or incomplete information in your account.</li>
          <li>Deletion , request erasure of your personal data (subject to legal hold requirements).</li>
          <li>Portability , receive your data in a machine-readable format.</li>
          <li>Opt-out , withdraw consent for non-essential processing at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, submit a request through your dashboard or email <A href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</A>. We will respond within 30 days.
        </p>
      </>
    )
  },
  {
    id: "contact",
    heading: "Contact Us",
    body: (
      <>
        <p>
          Aura Proxy, Inc. , 340 Pine Street, Suite 800, San Francisco, CA 94104. For privacy inquiries: <A href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</A>.
        </p>
      </>
    )
  }
];

const termsOfServiceSections = [
  {
    id: "acceptance",
    heading: "Acceptance of Terms",
    body: (
      <div className="callout">
        By accessing or using Aura Proxy&apos;s platform, APIs, or any associated services, you agree to be bound by
        these Terms of Service. If you are using the Services on behalf of an organization, you represent that you
        have authority to bind that organization.
      </div>
    )
  },
  {
    id: "access",
    heading: "Access & Use",
    body: (
      <>
        <p>
          Subject to these Terms, Aura grants you a limited, non-exclusive, non-transferable license to access and
          use the Services for your internal business or personal purposes.
        </p>
        <ul>
          <li>You must comply with all applicable laws and regulations.</li>
          <li>You may not resell or sublicense access to the Services without written consent.</li>
          <li>Fair use policies apply , excessive automated scraping or load testing may result in rate limits.</li>
        </ul>
      </>
    )
  },
  {
    id: "account",
    heading: "Your Account",
    body: (
      <p>
        You are responsible for maintaining the confidentiality of your API keys and account credentials. All
        activity under your account is your responsibility. Notify us immediately at <A href="mailto:security@auraproxy.dev">security@auraproxy.dev</A> if you suspect unauthorized access.
      </p>
    )
  },
  {
    id: "prohibited",
    heading: "Prohibited Use",
    body: (
      <ul>
        <li>Generating illegal, harmful, or deceptive content through any connected LLM provider.</li>
        <li>Circumventing rate limits or security measures.</li>
        <li>Reverse engineering or attempting to extract source code from the Services.</li>
        <li>Using the Services to build a competing AI gateway product.</li>
      </ul>
    )
  },
  {
    id: "ip",
    heading: "Intellectual Property",
    body: (
      <p>
        All intellectual property in the Services is owned by or licensed to Aura Proxy, Inc. You retain all
        rights to data you submit through the API. You grant Aura a limited license to process your data solely
        to deliver the Services.
      </p>
    )
  },
  {
    id: "limitation",
    heading: "Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, Aura&apos;s total liability to you for any claim arising from or related
        to these Terms shall not exceed the amounts you paid in the 12 months preceding the claim. Aura is not
        liable for indirect, incidental, or consequential damages.
      </p>
    )
  },
  {
    id: "termination",
    heading: "Termination",
    body: (
      <p>
        Either party may terminate these Terms at any time. Aura may suspend or terminate your access immediately
        for breach of these Terms. Upon termination, your right to use the Services ceases and we may delete your
        data per our retention policy.
      </p>
    )
  },
  {
    id: "governing",
    heading: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of the State of California, without regard to conflict of law
        provisions. Disputes shall be resolved exclusively in the state or federal courts located in San Francisco
        County, California.
      </p>
    )
  }
];

const cookiePolicySections = [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          This Cookie Policy explains how Aura Proxy, Inc. (&quot;Aura Proxy&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and
          similar tracking technologies when you visit our website at{" "}
          <A href="#">auraproxy.dev</A> and when you use our AI gateway platform and associated services
          (collectively, the &quot;Services&quot;). It explains what these technologies are, why we use them, and your rights
          to control our use of them.
        </p>
        <p>
          By continuing to use our Services, you consent to our use of cookies as described in this policy.
        </p>
      </>
    ),
  },
  {
    id: "what-are-cookies",
    heading: "What Are Cookies?",
    body: (
      <>
        <p>
          Cookies are small text files that are placed on your device (computer, smartphone, or other device) when
          you visit a website. They are widely used to make websites and applications work efficiently, to improve
          your experience, and to provide information to website operators.
        </p>
        <p>
          Cookies can be &quot;persistent&quot; , remaining on your device until deleted manually or until they reach an
          expiry date , or &quot;session&quot; cookies, which expire as soon as you close your browser.
        </p>
        <p>
          We also use similar technologies such as pixel tags, web beacons, and local storage. In this policy, we
          refer to all such technologies collectively as &quot;cookies.&quot;
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-cookies",
    heading: "How We Use Cookies",
    body: (
      <>
        <p>We use cookies for several reasons:</p>
        <ul>
          <li>
            <strong>Authentication and security.</strong> To recognize you when you sign in, to keep you signed in,
            and to protect your account from unauthorized access.
          </li>
          <li>
            <strong>Preferences and settings.</strong> To remember your choices and personalize your experience ,
            including your selected region, language, and dashboard layout preferences.
          </li>
          <li>
            <strong>Performance and analytics.</strong> To understand how visitors interact with our website so we
            can measure and improve its performance. We use privacy-preserving analytics that do not track you
            across other sites.
          </li>
          <li>
            <strong>Billing and fraud prevention.</strong> Our payment processor sets cookies to detect and prevent
            fraudulent activity during checkout.
          </li>
        </ul>
        <p>We do not use cookies to deliver behavioral advertising or to track you across unrelated websites.</p>
      </>
    ),
  },
  {
    id: "types-of-cookies",
    heading: "Types of Cookies We Use",
    body: (
      <>
        <h3>Strictly Necessary Cookies</h3>
        <p>
          These cookies are essential for the Services to function and cannot be switched off. They are usually
          set in response to your actions , such as logging in or filling in forms , and do not store personally
          identifiable information beyond what is required to provide the service.
        </p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>__aura_session</code></td>
              <td>Manages your authenticated session</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>__aura_csrf</code></td>
              <td>Cross-site request forgery protection</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>__aura_region</code></td>
              <td>Remembers your selected gateway region</td>
              <td>1 year</td>
            </tr>
          </tbody>
        </table>

        <h3>Analytical Cookies</h3>
        <p>
          We use <A href="#">Plausible Analytics</A>, a privacy-first analytics tool that does not use cookies for
          cross-site tracking and is fully GDPR-compliant without requiring a cookie consent banner. Aggregate
          metrics collected include page views, referrer, country, and device type. No personal data leaves your
          browser in a form that could identify you.
        </p>

        <h3>Functional Cookies</h3>
        <p>
          These cookies allow us to remember choices you have made, such as your UI theme preference or a
          dismissed announcement banner. Disabling them may affect your experience but will not prevent you from
          using the core Services.
        </p>

        <h3>Payment Cookies</h3>
        <p>
          Stripe, our payment processor, sets cookies on checkout pages to detect and prevent fraudulent
          transactions. These are governed by the <A href="#">Stripe Privacy Policy</A>. We do not have access to or control over these cookies.
        </p>
      </>
    ),
  },
  {
    id: "third-party-cookies",
    heading: "Third-Party Cookies",
    body: (
      <>
        <p>
          With the exception of Stripe on checkout pages, we do not embed third-party advertising networks,
          social media widgets, or tracking pixels on our website or dashboard. We will update this section if
          that changes.
        </p>
        <p>
          When you access external links from our documentation or marketing pages, the destination sites may set
          their own cookies. We have no control over, and assume no responsibility for, the content or privacy
          practices of any third-party site.
        </p>
      </>
    ),
  },
  {
    id: "managing-cookies",
    heading: "Managing Cookies",
    body: (
      <>
        <p>
          You have the right to decide whether to accept or decline cookies. You can control cookies through your
          browser settings. Most browsers allow you to:
        </p>
        <ul>
          <li>View the cookies that are set and delete them individually.</li>
          <li>Block third-party cookies.</li>
          <li>Block cookies from specific sites.</li>
          <li>Block all cookies from being set.</li>
          <li>Delete all cookies when you close your browser.</li>
        </ul>
        <p>
          Please note that if you disable strictly necessary cookies, parts of the Services will not function
          correctly , you will not be able to stay logged in or use the API dashboard.
        </p>
        <p>
          For more information on managing cookies in your browser, visit{" "}
          <A href="#">allaboutcookies.org</A> or your browser&apos;s own help documentation.
        </p>
        <h3>Dashboard Privacy Controls</h3>
        <p>
          You can review and adjust functional cookie preferences at any time from your account settings under{" "}
          <strong>Settings → Privacy</strong>. Strictly necessary cookies cannot be disabled from within the
          dashboard.
        </p>
      </>
    ),
  },
  {
    id: "updates",
    heading: "Updates to This Policy",
    body: (
      <>
        <p>
          We may update this Cookie Policy periodically to reflect changes in technology, regulation, or our
          business practices. The &quot;Last updated&quot; date at the top of this page will be revised accordingly.
        </p>
        <p>
          For material changes that affect your rights or the way we use cookies, we will provide advance notice
          via email or a prominent notice within the dashboard at least 14 days before the change takes effect.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <>
        <p>
          If you have any questions about our use of cookies or this Cookie Policy, please contact us:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> <A href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</A>
          </li>
          <li>
            <strong>Postal address:</strong> Aura Proxy, Inc. 340 Pine Street, Suite 800, San Francisco,
            CA 94104, United States
          </li>
        </ul>
      </>
    ),
  },
]

const pageConfig: Record<string, {
  title: string,
  description: string,
  updated: string,
  sections: { id: string, heading: string, body: React.ReactNode }[]
}> = {
  privacy: {
    title: "Privacy Policy",
    description: "This policy describes how Aura Proxy uses cookies and similar tracking technologies across our website and developer platform.",
    updated: "June 28, 2025",
    sections: privacyPolicySections
  },
  terms: {
    title: "Terms of Service",
    description: "The rules and guidelines governing your use of the Aura Proxy platform and associated services.",
    updated: "June 28, 2025",
    sections: termsOfServiceSections
  },
  cookies: {
    title: "Cookie Policy",
    description: "This policy describes how Aura Proxy uses cookies and similar tracking technologies across our website and developer platform.",
    updated: "June 28, 2025",
    sections: cookiePolicySections
  }
};

// ─── Sidebar nav link ─────────────────────────────────────────────────────────
function SideLink({
  label,
  active,
  onClick,
  indent,
}: {
  label: string
  active?: boolean
  onClick: () => void
  indent?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: indent ? "4px 0 4px 12px" : "4px 0",
        fontSize: 13,
        lineHeight: "18px",
        color: active ? t.text : hov ? t.textSub : t.textMuted,
        fontWeight: active ? 500 : 400,
        transition: "color 120ms",
        letterSpacing: "0",
        borderLeft: indent ? `2px solid ${active ? t.accent : "transparent"}` : "none",
        marginLeft: indent ? -2 : 0,
      }}
    >
      {label}
    </button>
  )
}

const legalPages = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
  { id: "cookies", label: "Cookie Policy" },
]

export default function LegalClient({ initialSlug }: { initialSlug: string }) {
  const router = useRouter();
  const [pageId, setPageId] = useState(initialSlug)
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageId(initialSlug);
  }, [initialSlug]);

  const activeConfig = pageConfig[pageId] || pageConfig.privacy;
  
  const [activeSection, setActiveSection] = useState(activeConfig.sections[0]?.id)
  const contentRef = useRef<HTMLDivElement>(null)

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    activeConfig.sections.forEach(({ id }) => {
      const el = document.getElementById(`sec-${id}`)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: "-30% 0px -60% 0px" }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [pageId, activeConfig])

  const scrollTo = (id: string) => {
    const el = document.getElementById(`sec-${id}`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleSetPage = (id: string) => {
    setPageId(id);
    router.push(`/legal/${id}`);
    setActiveSection(pageConfig[id]?.sections[0]?.id);
    window.scrollTo({ top: 0 });
  };

  return (
    <div
      style={{
        fontFamily: "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
        background: t.bg,
        minHeight: "100vh",
        color: t.text,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <NavBar />

      {/* Page layout */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "200px 1fr 180px",
          gap: "0 40px",
          alignItems: "flex-start",
        }}
        className="md:grid flex flex-col pt-12"
      >
        {/* ── Left sidebar: page navigation ── */}
        <aside
          style={{
            position: "sticky",
            top: 72,
            paddingTop: 48,
            paddingBottom: 48,
          }}
          className="hidden md:block"
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: t.textMuted,
              margin: "0 0 8px",
            }}
          >
            Legal
          </p>
          <nav>
            {legalPages.map(({ id, label }) => (
              <SideLink
                key={id}
                label={label}
                active={pageId === id}
                onClick={() => handleSetPage(id)}
              />
            ))}
          </nav>

        </aside>

        {/* ── Main content ── */}
        <main
          ref={contentRef}
          style={{
            borderLeft: `1px solid ${t.border}`,
            borderRight: `1px solid ${t.border}`,
            padding: "48px 56px 96px",
            minHeight: "100vh",
          }}
          className="border-x-0 md:border-x border-zinc-800 px-0 md:px-14"
        >
          <motion.div
            key={pageId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* Page title area */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: t.textMuted }}>
                Last updated: {activeConfig.updated}
              </p>
              <h1
                style={{
                  margin: "0 0 16px",
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  color: t.text,
                }}
              >
                {activeConfig.title}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: "24px",
                  color: t.textSub,
                  maxWidth: 520,
                }}
              >
                {activeConfig.description}
              </p>
            </div>

            <div style={{ height: 1, background: t.border, marginBottom: 40 }} />

            {/* Sections */}
            {activeConfig.sections.map((section, i) => (
              <section
                key={section.id}
                id={`sec-${section.id}`}
                style={{
                  scrollMarginTop: 80,
                  paddingBottom: 40,
                  marginBottom: i < activeConfig.sections.length - 1 ? 40 : 0,
                  borderBottom:
                    i < activeConfig.sections.length - 1 ? `1px solid ${t.borderSub}` : "none",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 16px",
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                    color: t.text,
                  }}
                >
                  {section.heading}
                </h2>
                <ProseBlock>{section.body}</ProseBlock>
              </section>
            ))}
          </motion.div>
        </main>

        {/* ── Right sidebar: TOC ── */}
        <aside
          style={{
            position: "sticky",
            top: 72,
            paddingTop: 48,
          }}
          className="hidden lg:block"
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: t.textMuted,
              margin: "0 0 8px",
            }}
          >
            On this page
          </p>
          <nav>
            {activeConfig.sections.map(({ id, heading }) => (
              <SideLink
                key={id}
                label={heading}
                active={activeSection === id}
                onClick={() => scrollTo(id)}
                indent
              />
            ))}
          </nav>
        </aside>
      </div>

      <Footer hideCTA />
    </div>
  )
}

// ─── Prose block (applies document typography to JSX children) ────────────────
function ProseBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 14,
        lineHeight: "22px",
        color: t.textSub,
        fontWeight: 400,
      }}
    >
      <style>{`
        .prose-block p {
          margin: 0 0 14px;
          font-size: 14px;
          line-height: 22px;
          color: ${t.textSub};
        }
        .prose-block p:last-child { margin-bottom: 0; }
        .prose-block ul {
          margin: 0 0 14px;
          padding-left: 0;
          list-style: none;
        }
        .prose-block ul li {
          position: relative;
          padding-left: 16px;
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 22px;
          color: ${t.textSub};
        }
        .prose-block ul li::before {
          content: "-";
          position: absolute;
          left: 0;
          color: ${t.textMuted};
          font-size: 12px;
          top: 1px;
        }
        .prose-block strong {
          color: ${t.text};
          font-weight: 500;
        }
        .prose-block h3 {
          margin: 24px 0 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: ${t.text};
        }
        .prose-block table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 18px;
          font-size: 13px;
        }
        .prose-block table thead tr {
          border-bottom: 1px solid ${t.border};
        }
        .prose-block table th {
          text-align: left;
          padding: 8px 12px 8px 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${t.textMuted};
        }
        .prose-block table td {
          padding: 10px 12px 10px 0;
          border-bottom: 1px solid ${t.borderSub};
          color: ${t.textSub};
          vertical-align: top;
          line-height: 1.5;
        }
        .prose-block table td:first-child { color: ${t.text}; }
        .prose-block code {
          font-family: 'Geist Mono', 'JetBrains Mono', monospace;
          font-size: 12px;
          color: ${t.text};
          background: ${t.raised};
          border: 1px solid ${t.border};
          border-radius: 4px;
          padding: 1px 6px;
        }
        .callout {
          background: ${t.accentFaint};
          border: 1px solid rgba(124,92,252,0.2);
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 16px;
          font-size: 14px;
          color: ${t.textSub};
          line-height: 1.65;
        }
      `}</style>
      <div className="prose-block">{children}</div>
    </div>
  )
}

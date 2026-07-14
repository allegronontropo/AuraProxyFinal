"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Shield, FileText, Cookie, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const t = {
  bg: "var(--aura-bg, #050507)",
  surface: "var(--aura-surface, #0d0d10)",
  raised: "var(--aura-surface-raised, #141418)",
  border: "rgba(255, 255, 255, 0.07)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  text: "#f0f0f4",
  textSub: "#8b8b96",
  textMuted: "#4a4a55",
  accent: "#7c5cfc",
  accentDim: "#5b3fd8",
  accentFaint: "rgba(124, 92, 252, 0.18)"
};

const pages = [
  { id: "privacy", label: "Privacy Policy", icon: Shield },
  { id: "terms", label: "Terms of Service", icon: FileText },
  { id: "cookies", label: "Cookie Policy", icon: Cookie },
];

function TOC({ sections, active }: { sections: { id: string; title: string }[]; active: string }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 84,
        alignSelf: "flex-start",
        width: 220,
        flexShrink: 0,
      }}
      className="hidden md:block"
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: t.textMuted,
          fontWeight: 600,
        }}
      >
        On this page
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {sections.map(({ id, title }) => {
          const isActive = active === id
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 0",
                  fontSize: "0.82rem",
                  color: isActive ? t.accent : t.textSub,
                  textDecoration: "none",
                  transition: "color 0.15s",
                  borderLeft: `2px solid ${isActive ? t.accent : "transparent"}`,
                  paddingLeft: 10,
                  marginLeft: -12,
                  lineHeight: 1.4,
                }}
              >
                {title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SectionBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{ paddingTop: 56, scrollMarginTop: 84 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            width: 4,
            height: 20,
            borderRadius: 99,
            background: `linear-gradient(180deg, ${t.accent}, ${t.accentDim})`,
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            margin: 0,
            fontSize: "1.2rem",
            fontWeight: 700,
            color: t.text,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          fontSize: "0.9375rem",
          color: t.textSub,
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </motion.section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 14px" }}>{children}</p>
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 16px", paddingLeft: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "5px 0",
            fontSize: "0.9375rem",
            color: t.textSub,
            lineHeight: 1.65,
          }}
        >
          <ChevronRight size={14} color={t.accent} style={{ marginTop: 4, flexShrink: 0 }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function InlineLink({ href = "#", children }: { href?: string; children: string }) {
  const [hov, setHov] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        color: hov ? "#a78bfa" : t.accent,
        textDecoration: "none",
        borderBottom: `1px solid ${hov ? "rgba(167,139,250,0.4)" : "rgba(124,92,252,0.3)"}`,
        paddingBottom: 1,
        transition: "color 0.15s, border-color 0.15s",
      }}
    >
      {children}
    </a>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: t.accentFaint,
        border: `1px solid rgba(124,92,252,0.2)`,
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 16,
        fontSize: "0.875rem",
        color: t.textSub,
        lineHeight: 1.65,
      }}
    >
      {children}
    </div>
  )
}

const privacySections = [
  { id: "overview", title: "Overview" },
  { id: "collection", title: "Information We Collect" },
  { id: "usage", title: "How We Use Your Information" },
  { id: "sharing", title: "Information Sharing" },
  { id: "retention", title: "Data Retention" },
  { id: "security", title: "Security" },
  { id: "rights", title: "Your Rights" },
  { id: "cookies-ref", title: "Cookies" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
]

function PrivacyContent() {
  return (
    <>
      <SectionBlock id="overview" title="Overview">
        <Callout>
          This Privacy Policy describes how Aura Proxy, Inc. ("Aura", "we", "us", or "our") collects, uses, and
          shares information about you when you use our AI gateway platform, APIs, and related services (collectively,
          the "Services").
        </Callout>
        <P>
          By using our Services, you agree to the collection and use of information in accordance with this policy.
          If you have questions, please <InlineLink href="mailto:privacy@auraproxy.dev">contact our privacy team</InlineLink>.
        </P>
      </SectionBlock>

      <SectionBlock id="collection" title="Information We Collect">
        <P>We collect information you provide directly to us, including:</P>
        <UL
          items={[
            "Account registration details — name, email address, company name, and billing information.",
            "API usage data — request metadata, token counts, latency metrics, and provider routing decisions.",
            "Communications — support tickets, feedback submissions, and email correspondence.",
            "Payment information — processed securely through Stripe; we do not store raw card data.",
          ]}
        />
        <P>
          We also collect certain information automatically when you use our Services, such as IP addresses, browser
          type, pages visited, and referring URLs. This data helps us maintain service reliability and debug
          infrastructure issues.
        </P>
      </SectionBlock>

      <SectionBlock id="usage" title="How We Use Your Information">
        <P>We use collected information to operate, improve, and protect our Services:</P>
        <UL
          items={[
            "Provision and maintain the Aura Proxy gateway, including routing, caching, and fallback logic.",
            "Send transactional communications — API key alerts, billing notices, and security notifications.",
            "Analyze aggregate usage patterns to improve latency, uptime, and provider performance scoring.",
            "Comply with legal obligations and enforce our Terms of Service.",
            "Detect and prevent fraud, abuse, and unauthorized access.",
          ]}
        />
        <P>
          We do not sell your personal data or use the content of your API requests to train machine learning models.
        </P>
      </SectionBlock>

      <SectionBlock id="sharing" title="Information Sharing">
        <P>
          We do not share your personal information with third parties except in limited circumstances described
          below:
        </P>
        <UL
          items={[
            "Service providers — Stripe (billing), Cloudflare (network), AWS (infrastructure), and Datadog (observability) under strict data processing agreements.",
            "Legal requirements — if required by law, subpoena, court order, or to protect the rights of Aura and our users.",
            "Business transfers — in connection with a merger, acquisition, or sale of assets, with advance notice to affected users.",
          ]}
        />
      </SectionBlock>

      <SectionBlock id="retention" title="Data Retention">
        <P>
          We retain personal data for as long as your account is active or as needed to provide Services. API request
          logs are retained for 90 days by default. You may request earlier deletion by contacting{" "}
          <InlineLink href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</InlineLink>.
        </P>
        <P>
          Aggregated, anonymized usage statistics may be retained indefinitely for service improvement purposes. They
          cannot be used to identify individual users.
        </P>
      </SectionBlock>

      <SectionBlock id="security" title="Security">
        <Callout>
          All data transmitted to and from the Aura Proxy gateway is encrypted in transit using TLS 1.3. Data at
          rest is encrypted using AES-256. We perform regular third-party penetration tests and maintain SOC 2 Type II
          compliance.
        </Callout>
        <P>
          While we implement industry-standard safeguards, no method of transmission over the Internet is 100%
          secure. We encourage you to use strong, unique API keys and rotate them regularly.
        </P>
      </SectionBlock>

      <SectionBlock id="rights" title="Your Rights">
        <P>Depending on your jurisdiction, you may have the right to:</P>
        <UL
          items={[
            "Access — request a copy of the personal data we hold about you.",
            "Correction — update inaccurate or incomplete information in your account.",
            "Deletion — request erasure of your personal data (subject to legal hold requirements).",
            "Portability — receive your data in a machine-readable format.",
            "Opt-out — withdraw consent for non-essential processing at any time.",
          ]}
        />
        <P>
          To exercise any of these rights, submit a request through your dashboard or email{" "}
          <InlineLink href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</InlineLink>. We will respond within 30 days.
        </P>
      </SectionBlock>

      <SectionBlock id="cookies-ref" title="Cookies">
        <P>
          We use essential, analytical, and functional cookies as described in our{" "}
          <InlineLink href="/legal/cookies">Cookie Policy</InlineLink>. You can manage cookie preferences at any time via your browser
          settings.
        </P>
      </SectionBlock>

      <SectionBlock id="changes" title="Changes to This Policy">
        <P>
          We may update this Privacy Policy from time to time. Material changes will be communicated via email or a
          prominent notice within the dashboard at least 14 days before taking effect. Continued use of the Services
          after the effective date constitutes acceptance of the revised policy.
        </P>
      </SectionBlock>

      <SectionBlock id="contact" title="Contact Us">
        <P>
          Aura Proxy, Inc. — 340 Pine Street, Suite 800, San Francisco, CA 94104. For privacy inquiries:{" "}
          <InlineLink href="mailto:privacy@auraproxy.dev">privacy@auraproxy.dev</InlineLink>.
        </P>
      </SectionBlock>
    </>
  )
}

const termsSections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "access", title: "Access & Use" },
  { id: "account", title: "Your Account" },
  { id: "prohibited", title: "Prohibited Use" },
  { id: "ip", title: "Intellectual Property" },
  { id: "limitation", title: "Limitation of Liability" },
  { id: "termination", title: "Termination" },
  { id: "governing", title: "Governing Law" },
  { id: "misc", title: "Miscellaneous" },
]

function TermsContent() {
  return (
    <>
      <SectionBlock id="acceptance" title="Acceptance of Terms">
        <Callout>
          By accessing or using Aura Proxy's platform, APIs, or any associated services, you agree to be bound by
          these Terms of Service. If you are using the Services on behalf of an organization, you represent that you
          have authority to bind that organization.
        </Callout>
      </SectionBlock>

      <SectionBlock id="access" title="Access & Use">
        <P>
          Subject to these Terms, Aura grants you a limited, non-exclusive, non-transferable license to access and
          use the Services for your internal business or personal purposes.
        </P>
        <UL
          items={[
            "You must comply with all applicable laws and regulations.",
            "You may not resell or sublicense access to the Services without written consent.",
            "Fair use policies apply — excessive automated scraping or load testing may result in rate limits.",
          ]}
        />
      </SectionBlock>

      <SectionBlock id="account" title="Your Account">
        <P>
          You are responsible for maintaining the confidentiality of your API keys and account credentials. All
          activity under your account is your responsibility. Notify us immediately at{" "}
          <InlineLink href="mailto:security@auraproxy.dev">security@auraproxy.dev</InlineLink> if you suspect unauthorized access.
        </P>
      </SectionBlock>

      <SectionBlock id="prohibited" title="Prohibited Use">
        <UL
          items={[
            "Generating illegal, harmful, or deceptive content through any connected LLM provider.",
            "Circumventing rate limits or security measures.",
            "Reverse engineering or attempting to extract source code from the Services.",
            "Using the Services to build a competing AI gateway product.",
          ]}
        />
      </SectionBlock>

      <SectionBlock id="ip" title="Intellectual Property">
        <P>
          All intellectual property in the Services is owned by or licensed to Aura Proxy, Inc. You retain all
          rights to data you submit through the API. You grant Aura a limited license to process your data solely
          to deliver the Services.
        </P>
      </SectionBlock>

      <SectionBlock id="limitation" title="Limitation of Liability">
        <P>
          To the maximum extent permitted by law, Aura's total liability to you for any claim arising from or related
          to these Terms shall not exceed the amounts you paid in the 12 months preceding the claim. Aura is not
          liable for indirect, incidental, or consequential damages.
        </P>
      </SectionBlock>

      <SectionBlock id="termination" title="Termination">
        <P>
          Either party may terminate these Terms at any time. Aura may suspend or terminate your access immediately
          for breach of these Terms. Upon termination, your right to use the Services ceases and we may delete your
          data per our retention policy.
        </P>
      </SectionBlock>

      <SectionBlock id="governing" title="Governing Law">
        <P>
          These Terms are governed by the laws of the State of California, without regard to conflict of law
          provisions. Disputes shall be resolved exclusively in the state or federal courts located in San Francisco
          County, California.
        </P>
      </SectionBlock>

      <SectionBlock id="misc" title="Miscellaneous">
        <P>
          These Terms constitute the entire agreement between you and Aura with respect to the Services. If any
          provision is held unenforceable, the remaining provisions remain in full force. Our failure to enforce any
          right or provision is not a waiver.
        </P>
      </SectionBlock>
    </>
  )
}

const cookieSections = [
  { id: "what", title: "What Are Cookies?" },
  { id: "how", title: "How We Use Cookies" },
  { id: "types", title: "Types of Cookies" },
  { id: "third-party", title: "Third-Party Cookies" },
  { id: "manage", title: "Managing Cookies" },
  { id: "updates", title: "Policy Updates" },
]

function CookieContent() {
  return (
    <>
      <SectionBlock id="what" title="What Are Cookies?">
        <P>
          Cookies are small text files placed on your device by websites you visit. They are widely used to make
          websites work efficiently, improve user experience, and provide reporting information to site operators.
        </P>
      </SectionBlock>

      <SectionBlock id="how" title="How We Use Cookies">
        <P>
          Aura Proxy uses cookies to keep you logged in, remember your preferences, analyze traffic patterns, and
          measure the effectiveness of our product pages. We do not use cookies for behavioral advertising.
        </P>
      </SectionBlock>

      <SectionBlock id="types" title="Types of Cookies">
        <UL
          items={[
            "Strictly Necessary — required for authentication, session management, and CSRF protection. Cannot be disabled.",
            "Analytical — Plausible Analytics (privacy-friendly, no cross-site tracking). Help us understand which docs pages are most useful.",
            "Functional — remember UI preferences such as theme, collapsed sidebar state, and selected API region.",
          ]}
        />
      </SectionBlock>

      <SectionBlock id="third-party" title="Third-Party Cookies">
        <P>
          Stripe sets cookies for fraud prevention during checkout flows. These are governed by{" "}
          <InlineLink href="https://stripe.com/privacy">Stripe's Privacy Policy</InlineLink>. We do not embed third-party ad networks or social media
          widgets.
        </P>
      </SectionBlock>

      <SectionBlock id="manage" title="Managing Cookies">
        <P>
          You can control cookies through your browser settings. Disabling strictly necessary cookies will prevent
          you from logging in. For other preferences, visit your{" "}
          <InlineLink href="#">account privacy settings</InlineLink>.
        </P>
      </SectionBlock>

      <SectionBlock id="updates" title="Policy Updates">
        <P>
          We may update this Cookie Policy to reflect changes in technology or legal requirements. The "Last Updated"
          date at the top of this page indicates when the policy was most recently revised.
        </P>
      </SectionBlock>
    </>
  )
}

const pageConfig: Record<
  string,
  {
    title: string
    updated: string
    description: string
    icon: React.ElementType
    sections: { id: string; title: string }[]
    Content: React.FC
  }
> = {
  privacy: {
    title: "Privacy Policy",
    updated: "March 15, 2026",
    description: "How Aura Proxy collects, uses, and protects your information.",
    icon: Shield,
    sections: privacySections,
    Content: PrivacyContent,
  },
  terms: {
    title: "Terms of Service",
    updated: "March 15, 2026",
    description: "The rules and guidelines governing your use of the Aura Proxy platform.",
    icon: FileText,
    sections: termsSections,
    Content: TermsContent,
  },
  cookies: {
    title: "Cookie Policy",
    updated: "March 15, 2026",
    description: "How and why Aura Proxy uses cookies on our website and dashboard.",
    icon: Cookie,
    sections: cookieSections,
    Content: CookieContent,
  },
}

function PageTabs({ active, setPage }: { active: string; setPage: (p: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 52,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 4,
        alignSelf: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {pages.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => setPage(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              background: isActive ? t.raised : "transparent",
              border: isActive ? `1px solid ${t.borderStrong}` : "1px solid transparent",
              borderRadius: 9,
              color: isActive ? t.text : t.textSub,
              fontSize: "0.84rem",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function LegalClient({ initialSlug }: { initialSlug: string }) {
  const router = useRouter();
  const [activePage, setActivePage] = useState(initialSlug);

  useEffect(() => {
    setActivePage(initialSlug);
  }, [initialSlug]);

  const handleSetPage = (newSlug: string) => {
    setActivePage(newSlug);
    router.push(`/legal/${newSlug}`);
  };

  const page = pageConfig[activePage] || pageConfig.privacy;
  const Icon = page.icon;

  const [activeSection, setActiveSection] = useState(page.sections[0]?.id);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 100;
      for (const section of page.sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPos) {
          setActiveSection(section.id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page]);

  return (
    <>
      <div style={{ paddingTop: 52 }}>
        <PageTabs active={activePage} setPage={handleSetPage} />
      </div>

      <motion.div
        key={activePage + "-hero"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 60 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: t.accentFaint,
              border: `1px solid rgba(124,92,252,0.2)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color={t.accent} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 99,
              fontSize: "0.78rem",
              color: t.textMuted,
            }}
          >
            <Clock size={11} />
            Last Updated: {page.updated}
          </div>
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 800,
            color: t.text,
            margin: "0 0 14px",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          {page.title}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: t.textSub,
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          {page.description}
        </p>

        <div
          style={{
            marginTop: 36,
            height: 1,
            background: `linear-gradient(90deg, ${t.border} 0%, transparent 80%)`,
          }}
        />
      </motion.div>

      <motion.div
        key={activePage + "-body"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ display: "flex", gap: 64, alignItems: "flex-start" }}
      >
        <TOC sections={page.sections} active={activeSection} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <page.Content />

          <div
            style={{
              marginTop: 64,
              padding: "20px 24px",
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: t.accentFaint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={t.accent} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.875rem", fontWeight: 600, color: t.text }}>
                Questions about this policy?
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: t.textMuted, lineHeight: 1.6 }}>
                Reach our legal team at{" "}
                <InlineLink href="mailto:legal@auraproxy.dev">legal@auraproxy.dev</InlineLink>. We typically respond within two business days.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

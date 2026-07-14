"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch, ExternalLink } from "lucide-react";
import { useState, type CSSProperties } from "react";
import Image from "next/image";

const c = {
  bgDeep: "#020712",
  surface: "rgba(255,255,255,0.04)",
  purple: "#7c5cfc",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
  textDim: "#475569",
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
};

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Architecture", href: "#architecture" },
    { label: "Deploy", href: "#deploy" },
    { label: "Compare", href: "#compare" },
  ],
  Resources: [
    { label: "GitHub Repository", href: "https://github.com/allegronontropo/AuraProxyFinal" },
    { label: "Documentation", href: "#" },
  ],
};

function FooterLink({ children, href }: { children: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        fontSize: "0.875rem",
        color: hovered ? c.textPrimary : c.textMuted,
        textDecoration: "none",
        transition: "color 0.15s ease",
        marginBottom: 10,
      }}
    >
      {children}
    </a>
  );
}

const dotGrid: CSSProperties = {
  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)`,
  backgroundSize: "28px 28px",
};

export default function Footer() {
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <footer style={{ background: c.bgDeep, ...dotGrid }}>
      {/* CTA band */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* CTA glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 700,
            height: 400,
            background: "radial-gradient(ellipse, rgba(124,92,252,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 640,
            margin: "0 auto",
            padding: "96px 24px 80px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "0.72rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: c.purple,
              fontWeight: 600,
            }}
          >
            Get started
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 700,
              color: c.textPrimary,
              margin: "0 0 20px",
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
            }}
          >
            Ready to scale your AI?
          </h2>
          <p style={{ margin: "0 0 36px", fontSize: "1.05rem", color: c.textMuted, lineHeight: 1.7 }}>
            Join hundreds of engineering teams who trust Aura Proxy to handle their LLM infrastructure at scale.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001"}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                background: btnHovered
                  ? "linear-gradient(135deg, #9370ff, #6b4fe8)"
                  : "linear-gradient(135deg, #7c5cfc, #5b3fd8)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: btnHovered
                  ? "0 8px 40px rgba(124,92,252,0.45)"
                  : "0 4px 24px rgba(124,92,252,0.30)",
                transform: btnHovered ? "translateY(-1px)" : "none",
              }}
            >
              Get Started for Free
              <ArrowRight size={16} />
            </a>
            <a
              href="https://github.com/allegronontropo/AuraProxyFinal"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 24px",
                background: "transparent",
                color: c.textMuted,
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10,
                fontSize: "0.95rem",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              <ExternalLink size={15} />
              View GitHub
            </a>
          </div>
        </motion.div>
      </div>

      {/* Links grid */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 48px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "40px 48px",
        }}
      >
        {/* Brand */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c5cfc, #5b3fd8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(124,92,252,0.4)",
              }}
            >
              <Image
                src="/AURA_LOGO.png"
                alt="Aura Proxy"
                width={18}
                height={18}
                style={{ objectFit: "contain" }}
              />
            </div>
            <span
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: c.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              Aura Proxy
            </span>
          </div>
          <p style={{ margin: "0 0 24px", fontSize: "0.875rem", color: c.textMuted, lineHeight: 1.7, maxWidth: 260 }}>
            The open-source AI gateway for modern engineering teams.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <a
              href="https://github.com/allegronontropo/AuraProxyFinal"
              target="_blank"
              rel="noreferrer"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: c.surface,
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.textMuted,
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <GitBranch size={15} />
            </a>
          </div>
        </motion.div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([group, links], gi) => (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 + 0.1, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: c.textPrimary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {group}
            </p>
            {links.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: "0.8rem", color: c.textDim }}>
          © 2026 Aura Proxy, Inc. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: 24 }}>
          {["Terms", "Privacy", "Cookie Policy"].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                fontSize: "0.8rem",
                color: c.textDim,
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Copy, Check } from "lucide-react";

const dockerComposeLines = [
  "version: '3.8'",
  "services:",
  "  postgres:",
  "    image: pgvector/pgvector:pg16",
  "    environment:",
  "      POSTGRES_DB: aura",
  "  redis:",
  "    image: redis:7-alpine",
  "  proxy:",
  "    build:",
  "      context: .",
  "      dockerfile: Dockerfile",
  "    ports:",
  "      - \"4000:4000\"",
  "    environment:",
  "      - DATABASE_URL=postgresql://...",
  "      - REDIS_URL=redis://redis:6379",
];

const dockerComposeText = dockerComposeLines.join("\n");

export default function DeploySection() {
  const [copied, setCopied] = useState(false);
  const termRef = useRef(null);
  const isInView = useInView(termRef, { once: true, margin: "-100px" });
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!isInView) return;

    let currentLine = 0;
    let currentChar = 0;
    let text = "";
    let isTyping = true;
    let blinkInterval: NodeJS.Timeout;

    const tick = () => {
      if (!isTyping) return;

      if (currentLine >= dockerComposeLines.length) {
        isTyping = false;
        blinkInterval = setInterval(() => {
          setShowCursor(prev => !prev);
        }, 500);
        return;
      }

      const line = dockerComposeLines[currentLine];
      if (currentChar < line.length) {
        text += line[currentChar];
        setDisplayedText(text);
        currentChar++;
        setTimeout(tick, 10);
      } else {
        text += "\n";
        setDisplayedText(text);
        currentLine++;
        currentChar = 0;
        setTimeout(tick, 50);
      }
    };

    const timeout = setTimeout(tick, 600);
    return () => {
      isTyping = false;
      clearTimeout(timeout);
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [isInView]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerComposeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="deploy" style={{ padding: "8rem 1.5rem", position: "relative" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "5rem",
            alignItems: "center",
          }}
        >
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="section-overline" style={{ marginBottom: "1rem" }}>
              Self-Hosted
            </p>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#f1f5f9",
                margin: "0 0 1rem",
                lineHeight: 1.1,
              }}
            >
              Deploy in{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #a78bfa 0%, #7c5cfc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                60 Seconds
              </span>
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "2rem", fontSize: "1.05rem" }}>
              Aura Proxy runs on your infrastructure. Zero dependencies, maximum privacy.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                "Docker Compose - zero dependencies",
                "Your API keys stay on your infrastructure",
                "PostgreSQL + pgvector for semantic cache",
                "Redis for ultra-fast cache lookups",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "0.95rem",
                    color: "#cbd5e1",
                  }}
                >
                  <span
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: "50%",
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/allegronontropo/AuraProxyFinal"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                background: "linear-gradient(135deg, #7c5cfc, #5b3fd8)",
                color: "white",
                fontWeight: 600,
                fontSize: "0.9rem",
                borderRadius: "0.75rem",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, #8f72fd, #6d50e8)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(135deg, #7c5cfc, #5b3fd8)")}
            >
              View on GitHub →
            </a>
          </motion.div>

          {/* Right code block */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative",
              background: "#0A0A0F",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
            ref={termRef}
          >
            {/* Terminal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.85rem 1rem",
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
              </div>
              
              <div style={{
                fontSize: "0.75rem",
                color: "#64748b",
                fontFamily: "var(--font-mono), monospace",
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                fontWeight: 500,
              }}>
                docker-compose.yml
              </div>

              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.35rem 0.6rem",
                  background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                  border: "1px solid",
                  borderColor: copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color: copied ? "#10b981" : "#94a3b8",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Terminal Body */}
            <pre style={{ margin: 0, padding: "1.5rem", overflowX: "auto" }}>
              <code
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  color: "#cbd5e1",
                }}
              >
                {displayedText}
                <span 
                  style={{ 
                    opacity: showCursor ? 1 : 0, 
                    color: "#7c5cfc",
                    transition: "opacity 0.1s" 
                  }}
                >
                  ▋
                </span>
              </code>
            </pre>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Overview", icon: "◎", href: (id: string) => `/dashboard/${id}` },
  { label: "Playground", icon: "🧪", href: (id: string) => `/dashboard/${id}/playground` },
  { label: "Routing", icon: "⎀", href: (id: string) => `/dashboard/${id}/routing` },
  { label: "Gateway Insights", icon: "⚡", href: (id: string) => `/dashboard/${id}/intelligence` },
  { label: "Alert Queue", icon: "🔔", href: (id: string) => `/dashboard/${id}/alerts`, badge: true },
  { label: "Request Logs", icon: "▤", href: (id: string) => `/dashboard/${id}/logs` },
  { label: "Cache Analytics", icon: "◈", href: (id: string) => `/dashboard/${id}/cache` },
  { label: "API Keys", icon: "⚿", href: (id: string) => `/dashboard/${id}/keys` },
];

interface SidebarProps {
  projectId: string;
  projectName: string;
  userName: string;
  userInitials: string;
  alertCount?: number;
  isAdmin?: boolean;
}

export default function Sidebar({
  projectId,
  projectName,
  userName,
  userInitials,
  alertCount = 0,
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Exact match for overview, prefix for sub-pages
    if (href === `/dashboard/${projectId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div
      style={{
        width: 220,
        background: "#0D0D0F",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "16px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href="/workspace"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(124,58,237,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#a78bfa",
              flexShrink: 0,
            }}
          >
            ⬡
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb", letterSpacing: "-0.01em" }}>
              AURA
            </div>
            <div
              style={{
                fontSize: 8,
                color: "rgba(124,92,252,0.8)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              PROXY
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const href = item.href(projectId);
          const active = isActive(href);
          return (
            <Link
              key={item.label}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 10px",
                borderRadius: 8,
                fontSize: 12.5,
                textDecoration: "none",
                background: active ? "rgba(124,58,237,0.12)" : "transparent",
                color: active ? "#a78bfa" : "#6b7280",
                marginBottom: 2,
                transition: "all 0.13s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#9ca3af";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              <span style={{ fontSize: 14, width: 16, textAlign: "center", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && alertCount > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 10,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.05)",
            margin: "10px 4px",
          }}
        />

        {/* Settings */}
        <Link
          href={`/dashboard/${projectId}/settings`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "7px 10px",
            borderRadius: 8,
            fontSize: 12.5,
            textDecoration: "none",
            background: pathname.startsWith(`/dashboard/${projectId}/settings`)
              ? "rgba(124,58,237,0.12)"
              : "transparent",
            color: pathname.startsWith(`/dashboard/${projectId}/settings`)
              ? "#a78bfa"
              : "#6b7280",
            marginBottom: 2,
            transition: "all 0.13s",
          }}
        >
          <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>⚙</span>
          <span>Settings</span>
        </Link>
        
        {/* Admin Link (Conditional) */}
        {isAdmin && (
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12.5,
              textDecoration: "none",
              background: pathname.startsWith("/admin")
                ? "rgba(124,58,237,0.12)"
                : "transparent",
              color: pathname.startsWith("/admin")
                ? "#a78bfa"
                : "#6b7280",
              marginTop: 10,
              marginBottom: 2,
              transition: "all 0.13s",
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>🛡️</span>
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Workspace selector link */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href="/workspace"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 7,
            textDecoration: "none",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            transition: "all 0.13s",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: "rgba(124,58,237,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              color: "#a78bfa",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ⇄
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#9ca3af",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {projectName}
            </div>
            <div style={{ fontSize: 9, color: "#4b5563" }}>Switch workspace</div>
          </div>
        </Link>
      </div>

      {/* User footer */}
      <div
        style={{
          padding: "12px 12px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#a78bfa",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#d1d5db",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userName}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            background: "none",
            border: "none",
            color: "#4b5563",
            cursor: "pointer",
            fontSize: 11,
            padding: "2px 4px",
            borderRadius: 4,
            transition: "color 0.13s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#9ca3af")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5563")}
          title="Sign out"
        >
          ⎋
        </button>
      </div>
    </div>
  );
}

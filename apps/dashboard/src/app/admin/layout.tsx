import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/workspace");
  }

  // To highlight the active link, we could use a client component for the sidebar,
  // but for simplicity we'll just render it cleanly.

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0A0A0B",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f9fafb",
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        overflow: "hidden",
      }}
    >
      {/* Admin Sidebar */}
      <div
        style={{
          width: 220,
          background: "#0D0D0F",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#f87171",
              flexShrink: 0,
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb", letterSpacing: "-0.01em" }}>
              AURA ADMIN
            </div>
            <div
              style={{
                fontSize: 8,
                color: "rgba(248, 113, 113, 0.8)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              SUPERUSER
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
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
              color: "#d1d5db",
              transition: "background 0.1s",
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>📊</span>
            <span>Platform Overview</span>
          </Link>
          <Link
            href="/admin/users"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12.5,
              textDecoration: "none",
              color: "#d1d5db",
              transition: "background 0.1s",
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>👥</span>
            <span>Users</span>
          </Link>
          <Link
            href="/admin/projects"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12.5,
              textDecoration: "none",
              color: "#d1d5db",
              transition: "background 0.1s",
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>📂</span>
            <span>Projects</span>
          </Link>
          <Link
            href="/admin/traces"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12.5,
              textDecoration: "none",
              color: "#d1d5db",
              transition: "background 0.1s",
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>⚡</span>
            <span>Traces</span>
          </Link>
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link
            href="/workspace"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 10px",
              borderRadius: 8,
              fontSize: 12.5,
              textDecoration: "none",
              color: "#9ca3af",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>🔙</span>
            <span>Exit Admin</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {children}
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}

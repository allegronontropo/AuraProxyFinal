import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProjectById, getAlertSummary } from "@/lib/queries";
import Sidebar from "@/components/dashboard/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { projectId } = await params;

  const [project, alertSummary] = await Promise.all([
    getProjectById(projectId, session.user.id),
    getAlertSummary(projectId),
  ]);

  if (!project) redirect("/workspace");

  const userName = session.user.name ?? session.user.email ?? "User";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Count active alerts (errors in last hour)
  const alertCount = alertSummary.errorCount > 0 ? alertSummary.errorCount : 0;

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
      <Sidebar
        projectId={projectId}
        projectName={project.name}
        userName={userName}
        userInitials={userInitials}
        alertCount={alertCount}
        isAdmin={session.user.role === "ADMIN"}
      />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

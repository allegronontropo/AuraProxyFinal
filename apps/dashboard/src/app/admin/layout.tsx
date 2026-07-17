import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/workspace");
  }
  if (session.user.isActive === false) {
    redirect("/suspended");
  }

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-[#f9fafb] overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
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

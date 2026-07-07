"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  TestTube, 
  Waypoints, 
  BarChart2, 
  Zap, 
  Bell, 
  List, 
  Database, 
  Key, 
  Settings, 
  ShieldCheck, 
  ArrowLeftRight,
  LogOut,
  Hexagon
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: (id: string) => `/dashboard/${id}` },
  { label: "Playground", icon: TestTube, href: (id: string) => `/dashboard/${id}/playground` },
  { label: "Routing", icon: Waypoints, href: (id: string) => `/dashboard/${id}/routing` },
  { label: "Usage", icon: BarChart2, href: (id: string) => `/dashboard/${id}/usage` },
  { label: "Gateway Insights", icon: Zap, href: (id: string) => `/dashboard/${id}/intelligence` },
  { label: "Alert Queue", icon: Bell, href: (id: string) => `/dashboard/${id}/alerts`, badge: true },
  { label: "Request Logs", icon: List, href: (id: string) => `/dashboard/${id}/logs` },
  { label: "Cache Analytics", icon: Database, href: (id: string) => `/dashboard/${id}/cache` },
  { label: "API Keys", icon: Key, href: (id: string) => `/dashboard/${id}/keys` },
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
    if (href === `/dashboard/${projectId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="w-[240px] bg-[#0D0D0F] border-r border-white/5 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3.5 border-b border-white/5">
        <Link href="/workspace" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-md bg-violet-500/25 flex items-center justify-center text-violet-400 shrink-0 group-hover:bg-violet-500/30 transition-colors">
            <Hexagon size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">
              AURA
            </div>
            <div className="text-[8px] text-violet-400/80 tracking-[0.2em] uppercase font-mono">
              PROXY
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const href = item.href(projectId);
          const active = isActive(href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium no-underline mb-1 transition-all duration-150 ${
                active 
                  ? "bg-violet-500/[0.12] text-violet-300 shadow-[inset_0_0_0_1px_rgba(124,92,252,0.14)]" 
                  : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
              }`}
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                <Icon size={16} className={active ? "text-violet-300" : "text-white/40 group-hover:text-white/70"} />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && alertCount > 0 && (
                <span className="bg-red-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="h-px bg-white/5 mx-1 my-2.5" />

        {/* Settings */}
        <Link
          href={`/dashboard/${projectId}/settings`}
          className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium no-underline mb-1 transition-all duration-150 ${
            pathname.startsWith(`/dashboard/${projectId}/settings`)
              ? "bg-violet-500/[0.12] text-violet-300 shadow-[inset_0_0_0_1px_rgba(124,92,252,0.14)]"
              : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
          }`}
        >
          <div className="w-5 flex items-center justify-center shrink-0">
            <Settings size={16} className={pathname.startsWith(`/dashboard/${projectId}/settings`) ? "text-violet-300" : "text-white/40 group-hover:text-white/70"} />
          </div>
          <span>Settings</span>
        </Link>
        
        {/* Admin Link (Conditional) */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium no-underline mt-2.5 mb-1 transition-all duration-150 ${
              pathname.startsWith("/admin")
                ? "bg-violet-500/[0.12] text-violet-300 shadow-[inset_0_0_0_1px_rgba(124,92,252,0.14)]"
                : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
            }`}
          >
            <div className="w-5 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className={pathname.startsWith("/admin") ? "text-violet-300" : "text-white/40 group-hover:text-white/70"} />
            </div>
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Workspace selector link */}
      <div className="px-3 py-2.5 border-t border-white/5">
        <Link
          href="/workspace"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md no-underline bg-white/[0.02] border border-white/5 transition-all duration-150 hover:bg-white/[0.04] hover:border-white/10 group"
        >
          <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 group-hover:bg-violet-500/30 transition-colors">
            <ArrowLeftRight size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white/70 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-white/90 transition-colors">
              {projectName}
            </div>
            <div className="text-[10px] text-white/40">Switch workspace</div>
          </div>
        </Link>
      </div>

      {/* User footer */}
      <div className="px-3 py-3 pb-3.5 border-t border-white/5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-[11px] text-violet-400 font-semibold shrink-0">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-white/80 whitespace-nowrap overflow-hidden text-ellipsis">
            {userName}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-transparent border-none text-white/40 cursor-pointer text-[11px] p-1.5 rounded hover:text-white/80 hover:bg-white/5 transition-all"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

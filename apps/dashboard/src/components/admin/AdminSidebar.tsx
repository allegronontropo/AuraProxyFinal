"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Zap,
  Bell,
  Key,
  ArrowLeftRight,
  ShieldAlert,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview",       icon: LayoutDashboard, href: "/admin" },
  { label: "Users",          icon: Users,           href: "/admin/users" },
  { label: "Projects",       icon: FolderOpen,      href: "/admin/projects" },
  { label: "Traces",         icon: Zap,             href: "/admin/traces" },
  { label: "Alerts",         icon: Bell,            href: "/admin/alerts" },
  { label: "API Keys",       icon: Key,             href: "/admin/api-keys" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Exact match for overview to avoid matching everything
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="w-[240px] bg-[#0D0D0F] border-r border-white/5 flex flex-col shrink-0 h-screen sticky top-0">

      {/* Admin brand header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3.5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
          <ShieldAlert size={16} className="text-red-400" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-white tracking-tight">
            AURA ADMIN
          </div>
          <div className="text-[8px] text-red-400/80 tracking-[0.2em] uppercase font-mono">
            SUPERUSER
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium no-underline transition-all duration-150 ${
                active
                  ? "bg-red-500/[0.10] text-red-300 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.14)]"
                  : "text-white/50 hover:bg-white/[0.03] hover:text-white/80"
              }`}
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                <Icon
                  size={16}
                  className={
                    active
                      ? "text-red-400"
                      : "text-white/40 group-hover:text-white/70"
                  }
                />
              </div>
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="h-px bg-white/5 mx-1 my-2" />

        {/* Back to workspace */}
        <Link
          href="/workspace"
          className="group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium no-underline transition-all duration-150 text-white/40 hover:bg-white/[0.03] hover:text-white/70"
        >
          <div className="w-5 flex items-center justify-center shrink-0">
            <ArrowLeftRight
              size={16}
              className="text-white/30 group-hover:text-white/60"
            />
          </div>
          <span>Exit Admin</span>
        </Link>
      </nav>

      {/* Footer sign-out hint */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-white/[0.015] border border-white/[0.05]">
          <div className="w-6 h-6 rounded-md bg-red-500/15 flex items-center justify-center shrink-0">
            <LogOut size={11} className="text-red-400/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-white/50 truncate">
              Admin Session
            </div>
            <div className="text-[9px] text-white/25 uppercase tracking-wider">
              Full Access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useTransition } from "react";
import { toggleUserSuspension, toggleUserSendAlerts } from "@/actions/admin";

export default function UserActions({ userId, isActive, sendAlerts }: { userId: string; isActive: boolean; sendAlerts: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggleSuspension = () => {
    startTransition(async () => {
      await toggleUserSuspension(userId, !isActive);
    });
  };

  const handleToggleAlerts = () => {
    startTransition(async () => {
      await toggleUserSendAlerts(userId, !sendAlerts);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleAlerts}
        disabled={isPending}
        className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
          sendAlerts
            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-white/10 text-white/60 hover:bg-white/20"
        } disabled:opacity-50`}
      >
        {isPending ? "..." : sendAlerts ? "Alerts: Off" : "Alerts: On"}
      </button>
      <button
        onClick={handleToggleSuspension}
        disabled={isPending}
        className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
          isActive
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
        } disabled:opacity-50`}
      >
        {isPending ? "..." : isActive ? "Suspend" : "Activate"}
      </button>
    </div>
  );
}

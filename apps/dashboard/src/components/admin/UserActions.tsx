"use client";

import React, { useTransition } from "react";
import { toggleUserSuspension } from "@/actions/admin";

export default function UserActions({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleUserSuspension(userId, !isActive);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
        isActive
          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
      } disabled:opacity-50`}
    >
      {isPending ? "..." : isActive ? "Suspend" : "Activate"}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { updateAdminAlertStatus } from "@/actions/admin";
import type { AlertStatus } from "@aura/shared";

interface Props {
  alertId: string;
  currentStatus: AlertStatus;
}

export default function AdminAlertActions({ alertId, currentStatus }: Props) {
  const [status, setStatus] = useState<AlertStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handle = (next: AlertStatus) => {
    startTransition(async () => {
      setStatus(next);
      try {
        await updateAdminAlertStatus(alertId, next);
      } catch {
        setStatus(status); // revert on error
      }
    });
  };

  if (status === "resolved") {
    return (
      <span className="text-[11px] text-white/25 italic">Resolved</span>
    );
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {status === "active" && (
        <button
          disabled={isPending}
          onClick={() => handle("acknowledged")}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md cursor-pointer transition-colors disabled:opacity-40
            bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
        >
          Ack
        </button>
      )}
      {status !== "resolved" && (
        <button
          disabled={isPending}
          onClick={() => handle("resolved")}
          className="text-[11px] font-medium px-2.5 py-1 rounded-md cursor-pointer transition-colors disabled:opacity-40
            bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
        >
          Resolve
        </button>
      )}
    </div>
  );
}

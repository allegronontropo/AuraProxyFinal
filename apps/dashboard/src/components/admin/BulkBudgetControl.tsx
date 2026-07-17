"use client";

import { useState, useTransition } from "react";
import { setAllProjectBudgets } from "@/actions/admin";
import { ShieldAlert } from "lucide-react";

export default function BulkBudgetControl() {
  const [value, setValue] = useState("100");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const handleApply = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      setResult({ error: "Enter a valid non-negative dollar amount." });
      return;
    }
    const confirmed = window.confirm(
      `This will set the budget limit to $${num.toFixed(2)} for ALL projects on the platform.\n\nThis action cannot be undone automatically. Continue?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      setResult(null);
      try {
        await setAllProjectBudgets(num);
        setResult({ ok: true });
      } catch (e) {
        setResult({ error: e instanceof Error ? e.message : "An error occurred." });
      }
    });
  };

  return (
    <div className="bg-white/[0.015] border border-red-500/[0.12] rounded-xl p-4 flex flex-col gap-3 max-w-lg">
      <div className="flex items-center gap-2">
        <ShieldAlert size={14} className="text-red-400/70" />
        <span className="text-[12px] font-semibold text-white/60">
          Platform-wide Budget Cap
        </span>
      </div>
      <p className="text-[11px] text-white/30 leading-relaxed -mt-1">
        Override the budget limit for <strong className="text-white/50">every project</strong> on the platform at once.
        Use this in emergencies to prevent runaway spend.
      </p>

      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
          <input
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={(e) => { setValue(e.target.value); setResult(null); }}
            className="bg-white/5 border border-white/10 text-white rounded-lg pl-7 pr-3 py-2 text-sm w-32
              outline-none focus:border-red-500/50 transition-colors"
            placeholder="100"
          />
        </div>
        <span className="text-[11px] text-white/30">USD per period</span>
        <button
          onClick={handleApply}
          disabled={isPending}
          className="bg-red-600/70 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium
            transition-colors border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
        >
          {isPending ? "Applying…" : "Apply to All Projects"}
        </button>
      </div>

      {result?.ok && (
        <p className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          ✓ Budget cap applied to all projects.
        </p>
      )}
      {result?.error && (
        <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ✗ {result.error}
        </p>
      )}
    </div>
  );
}

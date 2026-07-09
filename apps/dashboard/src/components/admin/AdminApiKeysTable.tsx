"use client";

import { useState, useTransition } from "react";
import { bulkSetApiKeyRateLimits } from "@/actions/admin";

export interface ApiKeyRow {
  id: string;
  keyPrefix: string;
  name: string;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  project: {
    name: string;
    tenant: { email: string | null } | null;
  };
}

interface Props {
  apiKeys: ApiKeyRow[];
  sortHeaders: React.ReactNode;
}

export default function AdminApiKeysTable({ apiKeys, sortHeaders }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Rate limit state
  const [rpmValue, setRpmValue] = useState("60");

  const allChecked = apiKeys.length > 0 && apiKeys.every((k) => selected.has(k.id));
  const someChecked = apiKeys.some((k) => selected.has(k.id));

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(apiKeys.map((k) => k.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkSetRateLimit = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const num = parseInt(rpmValue, 10);
    if (isNaN(num) || num < 1) {
      alert("Enter a valid positive integer for RPM.");
      return;
    }
    
    if (!window.confirm(`Set rate limit to ${num} RPM for ${ids.length} selected key(s)?`)) return;
    
    startTransition(async () => {
      setFeedback(null);
      const res = await bulkSetApiKeyRateLimits(ids, num);
      if ("error" in res) {
        setFeedback(`Error: ${res.error}`);
      } else {
        setFeedback(`✓ ${res.count} key(s) updated to ${num} RPM.`);
        setSelected(new Set());
      }
    });
  };

  return (
    <div>
      {/* Bulk action bar */}
      {someChecked && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <span className="text-[12px] text-violet-300 font-medium">
            {selected.size} selected
          </span>
          <div className="h-3 w-px bg-violet-500/30" />
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/50">Set Rate Limit:</span>
            <input
              type="number"
              min="1"
              value={rpmValue}
              onChange={(e) => setRpmValue(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-xs w-16 focus:outline-none focus:border-violet-500/50"
            />
            <span className="text-[10px] text-white/30">RPM</span>
          </div>

          <button
            onClick={handleBulkSetRateLimit}
            disabled={isPending}
            className="text-[11px] font-medium bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors ml-2 disabled:opacity-50"
          >
            {isPending ? "Applying..." : "Apply"}
          </button>
        </div>
      )}

      {feedback && (
        <div className="mb-4 text-[12px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg">
          {feedback}
        </div>
      )}

      <div className="bg-white/[0.015] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.05]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="accent-violet-500 bg-white/5 border-white/20 rounded"
                />
              </th>
              {sortHeaders}
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(key.id)}
                    onChange={() => toggleOne(key.id)}
                    className="accent-violet-500 bg-white/5 border-white/20 rounded cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <code className="text-[12px] text-violet-300 bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 rounded font-mono">
                    {key.keyPrefix}…
                  </code>
                </td>
                <td className="px-4 py-3 text-white/70 text-[13px] max-w-[160px] truncate">
                  {key.name}
                </td>
                <td className="px-4 py-3 text-white/80 font-medium text-[13px]">
                  {key.project.name}
                </td>
                <td className="px-4 py-3 text-white/40 font-mono text-[12px]">
                  {key.project.tenant?.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white/80">{key.rateLimit}</span>
                    <span className="text-[10px] text-white/30">req/min</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      key.isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {key.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/30 text-[12px]">
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Never"}
                </td>
                <td className="px-4 py-3 text-white/30 text-[12px]">
                  {new Date(key.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </tr>
            ))}
            {apiKeys.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="text-white/20 text-4xl mb-3">- -</div>
                  <div className="text-white/40 text-sm">No API keys found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

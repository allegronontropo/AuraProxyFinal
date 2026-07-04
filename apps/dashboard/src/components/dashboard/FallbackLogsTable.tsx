"use client";

import React, { useEffect, useState } from "react";
import { getFallbackLogs } from "@/actions/fallback-logs";
import { Repeat, ArrowRight, Clock, Box, Key, AlertCircle } from "lucide-react";

interface FallbackLog {
  id: string;
  createdAt: Date;
  provider: string; // The fallback provider
  model: string; // The fallback model
  latencyMs: number;
  statusCode: number;
  metadata: any;
  apiKey: {
    name: string;
    keyPrefix: string;
  };
}

export default function FallbackLogsTable({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<FallbackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLogs() {
      try {
        const fetchedLogs = await getFallbackLogs(projectId, 15);
        if (mounted) {
          setLogs(fetchedLogs as any[]);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load fallback logs");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLogs();
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div className="flex gap-1.5 items-center">
          <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce delay-100" />
          <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce delay-200" />
        </div>
        <span className="text-[12px] text-white/40 mt-3">Loading fallback traces...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-[11px] p-6 flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span className="text-[13px] font-medium">{error}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] p-8 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
          <Repeat className="w-5 h-5 text-white/20" />
        </div>
        <h3 className="text-[14px] font-medium text-white/70">No Fallbacks Triggered</h3>
        <p className="text-[12px] text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
          Your primary providers are running smoothly. If a primary request fails, it will be routed to a fallback and tracked here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-purple-400" />
          <h3 className="text-[13px] font-medium text-white/90">Fallback Traces</h3>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.05]">
          Recent {logs.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">Time</th>
              <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">API Key</th>
              <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">Route Flow</th>
              <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">Latency</th>
              <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {logs.map((log) => {
              const primaryProvider = log.metadata?.primary_provider || "unknown";
              const fallbackProvider = log.provider;

              return (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-white/60 group-hover:text-white/80 transition-colors">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-white/80 font-medium">{log.apiKey.name}</span>
                      <span className="text-[11px] text-white/40 font-mono flex items-center gap-1 mt-0.5">
                        <Key className="w-3 h-3" />
                        {log.apiKey.keyPrefix}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="text-red-400/80 font-medium">{primaryProvider}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20" />
                        <span className="text-emerald-400 font-medium">{fallbackProvider}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-mono bg-white/[0.03] px-2 py-0.5 rounded-md w-fit border border-white/[0.05]">
                        <Box className="w-3 h-3" />
                        {log.model}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-[12px] text-white/60 font-mono">
                      {log.latencyMs}ms
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    {log.statusCode === 200 ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                        Failed ({log.statusCode})
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

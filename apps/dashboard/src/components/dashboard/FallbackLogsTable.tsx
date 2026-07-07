"use client";

import React, { useEffect, useState } from "react";
import { getFallbackLogs } from "@/actions/fallback-logs";
import { Repeat, ArrowRight, Clock, Box, Key, AlertCircle, RefreshCw, ChevronDown, ChevronRight, Info, ChevronLeft } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
}

interface FallbackLog {
  id: string;
  createdAt: Date;
  provider: string;
  model: string;
  latencyMs: number;
  statusCode: number;
  metadata: Record<string, unknown>;
  apiKey: {
    name: string;
    keyPrefix: string;
  };
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== field) return null;
  return <span className="ml-1 inline-block">{sortOrder === "desc" ? "↓" : "↑"}</span>;
}

export default function FallbackLogsTable({ projectId, apiKeys }: { projectId: string; apiKeys: ApiKey[] }) {
  const [logs, setLogs] = useState<FallbackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 15;
  const [apiKeyId, setApiKeyId] = useState("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "latencyMs" | "statusCode">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const mounted = true;

    async function fetchLogs() {
      setLoading(true);
      try {
        const result = await getFallbackLogs(projectId, {
          page,
          limit,
          apiKeyId,
          sortBy,
          sortOrder,
        });
        if (mounted) {
          setLogs(result.logs as FallbackLog[]);
          setTotalPages(result.pages);
          setTotalLogs(result.total);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError((err as Error).message || "Failed to load fallback logs");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLogs();
  }, [projectId, page, apiKeyId, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await getFallbackLogs(projectId, {
        page,
        limit,
        apiKeyId,
        sortBy,
        sortOrder,
      });
      setLogs(result.logs as FallbackLog[]);
      setTotalPages(result.pages);
      setTotalLogs(result.total);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load fallback logs");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (field: "createdAt" | "latencyMs" | "statusCode") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1); // Reset page on sort
  };


  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-[11px] p-6 flex items-center gap-3 text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span className="text-[13px] font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.015] border border-white/[0.08] rounded-[11px] overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-white/[0.05] flex flex-wrap items-center justify-between bg-white/[0.01] gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-purple-400" />
            <h3 className="text-[13px] font-medium text-white/90">Fallback Traces</h3>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40 border border-white/[0.05]">
            Total {totalLogs}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <CustomSelect
            value={apiKeyId}
            onChange={(val) => {
              setApiKeyId(val);
              setPage(1);
            }}
            placeholder="All API Keys"
            options={[
              { value: "all", label: "All API Keys" },
              ...apiKeys.map((key) => ({
                value: key.id,
                label: `${key.name} (${key.keyPrefix}...)`
              }))
            ]}
            className="w-[200px]"
            buttonClassName="!py-1.5 !px-3 !text-[12px]"
          />
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        {loading && logs.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce delay-100" />
              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-[12px] text-white/40 mt-3">Loading fallback traces...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
              <Repeat className="w-5 h-5 text-white/20" />
            </div>
            <h3 className="text-[14px] font-medium text-white/70">No Fallbacks Triggered</h3>
            <p className="text-[12px] text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
              No fallback traces found matching your criteria.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-5 py-3 w-8"></th>
                <th 
                  className="px-2 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01] cursor-pointer hover:text-white/80"
                  onClick={() => handleSort("createdAt")}
                >
                  Time <SortIcon field="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">API Key</th>
                <th className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01]">Route Flow</th>
                <th 
                  className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01] cursor-pointer hover:text-white/80"
                  onClick={() => handleSort("latencyMs")}
                >
                  Latency <SortIcon field="latencyMs" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
                <th 
                  className="px-5 py-3 text-[11px] font-medium text-white/40 uppercase tracking-wider bg-white/[0.01] cursor-pointer hover:text-white/80"
                  onClick={() => handleSort("statusCode")}
                >
                  Status <SortIcon field="statusCode" sortBy={sortBy} sortOrder={sortOrder} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {logs.map((log) => {
                const primaryProvider = log.metadata?.primary_provider || "unknown";
                const fallbackProvider = log.provider;
                const isExpanded = expandedRows.has(log.id);

                return (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => toggleRow(log.id)}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                        )}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
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
                    
                    {isExpanded && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan={6} className="px-5 py-4 border-b border-white/[0.05]">
                          <div className="pl-8">
                            <div className="bg-black/20 border border-white/[0.05] rounded-lg p-4 max-w-3xl">
                              <h4 className="text-[12px] font-medium text-white/80 mb-3 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-blue-400" />
                                Fallback Details
                              </h4>
                              
                              <div className="space-y-3">
                                {/* Primary Error */}
                                <div className="flex flex-col gap-1 text-[12px]">
                                  <span className="text-white/40 uppercase tracking-wider text-[10px] font-medium">Why did <span className="text-red-400">{primaryProvider}</span> fail?</span>
                                  <span className="text-red-300 font-mono bg-red-500/10 px-2 py-1.5 rounded border border-red-500/20">
                                    {log.metadata?.primary_error || "Unknown error or provider timeout."}
                                  </span>
                                </div>

                                {/* Intermediate Fallback Errors */}
                                {log.metadata?.fallback_errors && Array.isArray(log.metadata.fallback_errors) && log.metadata.fallback_errors.length > 0 && (
                                  <div className="flex flex-col gap-1 text-[12px] mt-2">
                                    <span className="text-white/40 uppercase tracking-wider text-[10px] font-medium">Intermediate Failures</span>
                                    <div className="flex flex-col gap-1">
                                      {log.metadata.fallback_errors.map((err: string, i: number) => (
                                        <span key={i} className="text-amber-300/80 font-mono bg-amber-500/10 px-2 py-1.5 rounded border border-amber-500/20">
                                          {err}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <span className="text-[12px] text-white/40">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 text-[12px] font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 text-[12px] font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

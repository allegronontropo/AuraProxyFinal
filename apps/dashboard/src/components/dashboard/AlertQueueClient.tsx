"use client";

import { useState } from "react";
import { updateAlertStatus } from "@/actions/alerts";
import type { AlertStatus, AlertSeverity } from "@aura/shared";

// We extend the shared type slightly for the client UI props if needed
export type Alert = {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  source: string;
  metric?: {
    label: string;
    value: string;
    threshold: string;
  };
  metadata?: any;
};

export default function AlertQueueClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [activeTab, setActiveTab] = useState<AlertStatus>("active");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(initialAlerts.find(a => a.status === "active")?.id || initialAlerts[0]?.id || null);

  const filteredAlerts = alerts.filter(a => a.status === activeTab);
  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || null;
  
  const [now] = useState(() => Date.now());

  const severityStyles = {
    critical: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", shadow: "shadow-red-400" },
    warning: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", shadow: "shadow-amber-400" },
    info: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", shadow: "shadow-emerald-400" },
  };

  const handleStatusChange = async (id: string, newStatus: AlertStatus) => {
    // Optimistic UI update
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    if (activeTab !== newStatus && selectedAlertId === id) {
      const nextInTab = filteredAlerts.find(a => a.id !== id);
      setSelectedAlertId(nextInTab?.id || null);
    }

    // Call server action to update DB
    try {
      await updateAlertStatus(id, newStatus);
    } catch (err) {
      console.error("Failed to update alert status", err);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = now - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 h-[52px] border-b border-white/5 shrink-0 bg-[#0D0D0F]/80">
        <div className="flex items-center gap-3">
          <span className="text-[16px] font-semibold text-white/90">Alert Queue</span>
          <span className="flex items-center justify-center bg-red-500/15 text-red-400 rounded-full w-5 h-5 text-[11px] font-bold">
            {alerts.filter(a => a.status === "active").length}
          </span>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-white/[0.03] rounded-lg p-1">
          {(["active", "acknowledged", "resolved"] as AlertStatus[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                const firstInTab = alerts.find(a => a.status === tab);
                setSelectedAlertId(firstInTab?.id || null);
              }}
              className={`border-none rounded-md text-[12px] font-medium px-3.5 py-1.5 cursor-pointer transition-all duration-150 capitalize ${
                activeTab === tab ? "bg-white/[0.08] text-white" : "bg-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 60% List */}
        <div className="flex-[6] overflow-y-auto p-5">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-white/40 text-[13px] pt-[60px]">
              No {activeTab} alerts.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredAlerts.map(alert => {
                const isActive = selectedAlertId === alert.id;
                const colors = severityStyles[alert.severity];
                
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`rounded-[11px] p-4 cursor-pointer transition-all duration-150 ${
                      isActive 
                        ? "bg-white/[0.03] border border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.1)]" 
                        : "bg-white/[0.015] border border-white/[0.08] hover:border-white/[0.12] hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${colors.bg} ${colors.shadow} shadow-[0_0_8px_currentColor] ${colors.text}`} />
                        <span className="text-[14px] font-semibold text-white/90">{alert.title}</span>
                      </div>
                      <span className="text-[11px] text-white/40">{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    
                    <div className="text-[13px] text-white/60 mb-3 leading-relaxed">
                      {alert.description}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/50 bg-white/[0.03] px-2 py-1 rounded">
                          Source: {alert.source}
                        </span>
                        {alert.metric && (
                          <span className="text-[11px] text-white/50">
                            {alert.metric.label}: <strong className="text-white/80">{alert.metric.value}</strong> 
                            <span className="opacity-50"> / {alert.metric.threshold}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {activeTab === "active" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(alert.id, "acknowledged"); }}
                            className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] px-2.5 py-1 rounded-md cursor-pointer hover:bg-violet-500/20 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {activeTab !== "resolved" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(alert.id, "resolved"); }}
                            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] px-2.5 py-1 rounded-md cursor-pointer hover:bg-emerald-500/20 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 40% Detail Panel */}
        <div className="flex-[4] bg-[#0d0d0f] border-l border-white/5 overflow-y-auto">
          {selectedAlert ? (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className={`${severityStyles[selectedAlert.severity].bg} border ${severityStyles[selectedAlert.severity].border} ${severityStyles[selectedAlert.severity].text} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-[0.05em]`}>
                  {selectedAlert.severity}
                </span>
                <span className="bg-white/5 border border-white/10 text-white/80 text-[10px] font-semibold px-2 py-1 rounded uppercase">
                  {selectedAlert.status}
                </span>
              </div>
              
              <h2 className="text-[20px] font-semibold text-white/90 mb-2">
                {selectedAlert.title}
              </h2>
              <div className="text-[12px] text-white/40 mb-6">
                Detected {new Date(selectedAlert.timestamp).toLocaleString()}
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mb-6">
                <h3 className="text-[11px] text-white/40 uppercase tracking-[0.05em] mb-2 font-semibold">
                  Description
                </h3>
                <p className="text-[14px] text-white/80 leading-relaxed m-0">
                  {selectedAlert.description}
                </p>
              </div>

              {selectedAlert.metric && (
                <div className="mb-6">
                  <h3 className="text-[11px] text-white/40 uppercase tracking-[0.05em] mb-3 font-semibold">
                    Trigger Metrics
                  </h3>
                  <div className="flex gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg py-3 px-4 flex-1">
                      <div className="text-[11px] text-white/50 mb-1">Current Value</div>
                      <div className="text-[18px] font-semibold text-white/90">{selectedAlert.metric.value}</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg py-3 px-4 flex-1">
                      <div className="text-[11px] text-white/50 mb-1">Threshold</div>
                      <div className="text-[18px] font-semibold text-white/90">{selectedAlert.metric.threshold}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[11px] text-white/40 uppercase tracking-[0.05em] mb-2 font-semibold">
                    Diagnostic Data
                  </h3>
                  <pre className="bg-black/30 border border-white/5 rounded-lg p-3 text-[12px] text-violet-400 overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="text-[11px] text-white/40 uppercase tracking-[0.05em] mb-3 font-semibold">
                  Recommended Actions
                </h3>
                <div className="flex flex-col gap-2">
                  {(() => {
                    const title = selectedAlert.title.toLowerCase();
                    const actions = [];
                    const basePath = typeof window !== 'undefined' 
                      ? window.location.pathname.split('/alerts')[0] 
                      : '#';

                    if (title.includes("budget")) {
                      actions.push({ label: "Manage Project Budget", primary: true, href: `${basePath}/settings` });
                      actions.push({ label: "Review Cost Analytics", primary: false, href: `${basePath}/intelligence` });
                    } else if (title.includes("api key") || title.includes("auth") || title.includes("unauthorized")) {
                      actions.push({ label: "Configure API Keys", primary: true, href: `${basePath}/keys` });
                      actions.push({ label: "Check Routing Rules", primary: false, href: `${basePath}/routing` });
                    } else if (title.includes("rate limit") || title.includes("quota")) {
                      actions.push({ label: "Modify Routing Policy", primary: true, href: `${basePath}/routing` });
                      actions.push({ label: "Add Provider Keys", primary: false, href: `${basePath}/keys` });
                    } else {
                      actions.push({ label: "Review Request Logs", primary: true, href: `${basePath}/logs` });
                      actions.push({ label: "Modify Routing Policy", primary: false, href: `${basePath}/routing` });
                    }

                    return actions.map((action, i) => (
                      <button 
                        key={i}
                        onClick={() => { window.location.href = action.href; }}
                        className={`text-left text-[13px] font-medium py-2.5 px-4 rounded-lg cursor-pointer transition-all duration-150 ${
                          action.primary 
                            ? "bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20" 
                            : "bg-white/[0.03] border border-white/[0.08] text-white/80 hover:bg-white/[0.06]"
                        }`}
                      >
                        {action.label}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-[13px]">
              Select an alert to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

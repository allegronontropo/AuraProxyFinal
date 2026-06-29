"use client";

import { useState } from "react";

export type AlertStatus = "active" | "acknowledged" | "resolved";
export type AlertSeverity = "critical" | "warning" | "info";

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
};

export default function AlertQueueClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [activeTab, setActiveTab] = useState<AlertStatus>("active");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(initialAlerts.find(a => a.status === "active")?.id || initialAlerts[0]?.id || null);

  const filteredAlerts = alerts.filter(a => a.status === activeTab);
  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || null;
  
  const [now] = useState(() => Date.now());

  const severityColors = {
    critical: { text: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
    warning: { text: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
    info: { text: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)" },
  };

  const handleStatusChange = (id: string, newStatus: AlertStatus) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    if (activeTab === newStatus) return; // stays in current tab
    // if moved out of current tab, clear selection if it was selected
    if (selectedAlertId === id) {
      const nextInTab = filteredAlerts.find(a => a.id !== id);
      setSelectedAlertId(nextInTab?.id || null);
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0, background: "rgba(13,13,15,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Alert Queue</span>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(239,68,68,0.15)", color: "#f87171",
            borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700
          }}>
            {alerts.filter(a => a.status === "active").length}
          </span>
        </div>
        
        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3 }}>
          {(["active", "acknowledged", "resolved"] as AlertStatus[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                const firstInTab = alerts.find(a => a.status === tab);
                setSelectedAlertId(firstInTab?.id || null);
              }}
              style={{
                background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none", borderRadius: 6, color: activeTab === tab ? "#f9fafb" : "#9ca3af",
                fontSize: 12, fontWeight: 500, padding: "5px 14px", cursor: "pointer",
                transition: "all 0.15s", textTransform: "capitalize"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 60% List */}
        <div style={{ flex: 6, overflowY: "auto", padding: "22px 20px" }}>
          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, paddingTop: 60 }}>
              No {activeTab} alerts.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredAlerts.map(alert => {
                const isActive = selectedAlertId === alert.id;
                const colors = severityColors[alert.severity];
                
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    style={{
                      background: isActive ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                      border: isActive ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 11, padding: "16px 20px", cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: isActive ? "0 0 0 1px rgba(124,58,237,0.1)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                          background: colors.text, boxShadow: `0 0 8px ${colors.text}`
                        }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>{alert.title}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    
                    <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12, lineHeight: 1.5 }}>
                      {alert.description}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 4 }}>
                          Source: {alert.source}
                        </span>
                        {alert.metric && (
                          <span style={{ fontSize: 11, color: "#6b7280" }}>
                            {alert.metric.label}: <strong style={{ color: "#d1d5db" }}>{alert.metric.value}</strong> 
                            <span style={{ opacity: 0.5 }}> / {alert.metric.threshold}</span>
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", gap: 8 }}>
                        {activeTab === "active" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(alert.id, "acknowledged"); }}
                            style={{
                              background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
                              color: "#c4b5fd", fontSize: 11, padding: "4px 10px", borderRadius: 5, cursor: "pointer"
                            }}
                          >
                            Acknowledge
                          </button>
                        )}
                        {activeTab !== "resolved" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(alert.id, "resolved"); }}
                            style={{
                              background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
                              color: "#34d399", fontSize: 11, padding: "4px 10px", borderRadius: 5, cursor: "pointer"
                            }}
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
        <div style={{ flex: 4, background: "#0d0d0f", borderLeft: "1px solid rgba(255,255,255,0.05)", overflowY: "auto" }}>
          {selectedAlert ? (
            <div style={{ padding: "24px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{
                  background: severityColors[selectedAlert.severity].bg,
                  border: `1px solid ${severityColors[selectedAlert.severity].border}`,
                  color: severityColors[selectedAlert.severity].text,
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                  textTransform: "uppercase", letterSpacing: "0.05em"
                }}>
                  {selectedAlert.severity}
                </span>
                <span style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#d1d5db", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                  textTransform: "uppercase"
                }}>
                  {selectedAlert.status}
                </span>
              </div>
              
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f9fafb", marginBottom: 8 }}>
                {selectedAlert.title}
              </h2>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 24 }}>
                Detected {new Date(selectedAlert.timestamp).toLocaleString()}
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontWeight: 600 }}>
                  Description
                </h3>
                <p style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.6, margin: 0 }}>
                  {selectedAlert.description}
                </p>
              </div>

              {selectedAlert.metric && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, fontWeight: 600 }}>
                    Trigger Metrics
                  </h3>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "12px 16px", flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Current Value</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#f9fafb" }}>{selectedAlert.metric.value}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "12px 16px", flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Threshold</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#f9fafb" }}>{selectedAlert.metric.threshold}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, fontWeight: 600 }}>
                  Recommended Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={{
                    background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)",
                    color: "#c4b5fd", fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                    textAlign: "left", transition: "all 0.15s"
                  }}>
                    Review Provider Logs
                  </button>
                  <button style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#d1d5db", fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                    textAlign: "left", transition: "all 0.15s"
                  }}>
                    Modify Routing Policy
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 13 }}>
              Select an alert to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

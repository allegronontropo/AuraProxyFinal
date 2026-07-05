import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCacheStats } from "@/lib/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheByModel {
  model: string;
  provider: string;
  _count: { id: number };
  _sum: { hitCount: number | null };
}

interface TimeSeriesEntry {
  period: Date;
  cacheHits: number;
  cacheMisses: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Area Chart SVG ───────────────────────────────────────────────────────────

function AreaChart({ data }: { data: { label: string; hits: number; misses: number }[] }) {
  const W = 600;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 40 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const hitValues = data.map((d) => d.hits);
  const maxVal = Math.max(...hitValues, 1);

  const scaleX = (i: number) => {
    if (data.length <= 1) return PAD.left + cW / 2;
    return PAD.left + (i / (data.length - 1)) * cW;
  };
  const scaleY = (v: number) => PAD.top + cH - (v / maxVal) * cH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(d.hits).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${scaleX(data.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;

  // Tick labels — show every 4th point
  const ticks = data.filter((_, i) => i % 4 === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="cache-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y axis guide lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = PAD.top + cH - frac * cH;
        return (
          <g key={frac}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} fill="#4b5563" fontSize="9" textAnchor="end">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#cache-grad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot */}
      <circle
        cx={scaleX(data.length - 1)}
        cy={scaleY(data[data.length - 1].hits)}
        r="3.5" fill="#7c3aed"
      />

      {/* X axis labels */}
      {ticks.map((t) => {
        const i = data.indexOf(t);
        return (
          <text key={i} x={scaleX(i)} y={H - 6} fill="#4b5563" fontSize="9" textAnchor="middle">
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Stacked Bar Chart ────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; hits: number; misses: number }[] }) {
  const last7 = data.slice(-7);
  const W = 600;
  const H = 110;
  const PAD = { top: 8, right: 8, bottom: 24, left: 36 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const barGroupW = cW / last7.length;
  const barW = Math.min(14, barGroupW * 0.35);
  const maxVal = Math.max(...last7.map((d) => d.hits + d.misses), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: "visible" }}>
      {/* guide */}
      {[0, 0.5, 1].map((frac) => {
        const y = PAD.top + cH - frac * cH;
        return (
          <g key={frac}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} fill="#4b5563" fontSize="8" textAnchor="end">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {last7.map((d, i) => {
        const cx = PAD.left + i * barGroupW + barGroupW / 2;
        const hitH = (d.hits / maxVal) * cH;
        const missH = (d.misses / maxVal) * cH;
        const baseY = PAD.top + cH;
        return (
          <g key={i}>
            {/* hits bar (green) */}
            <rect
              x={cx - barW - 1} y={baseY - hitH}
              width={barW} height={Math.max(hitH, 1)}
              fill="#34d399" opacity="0.8" rx="2"
            />
            {/* misses bar (red) */}
            <rect
              x={cx + 1} y={baseY - missH}
              width={barW} height={Math.max(missH, 1)}
              fill="#ef4444" opacity="0.7" rx="2"
            />
            <text x={cx} y={H - 6} fill="#4b5563" fontSize="8.5" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Provider Chip ────────────────────────────────────────────────────────────

function ProviderChip({ provider }: { provider: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    openai:    { bg: "rgba(16,163,127,0.15)", color: "#10a37f" },
    anthropic: { bg: "rgba(210,105,30,0.15)", color: "#d2691e" },
    google:    { bg: "rgba(66,133,244,0.15)", color: "#4285f4" },
    groq:      { bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
    azure:     { bg: "rgba(0,120,212,0.15)",   color: "#0078d4" },
    cohere:    { bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
  };
  const cfg = map[provider.toLowerCase()] ?? { bg: "rgba(255,255,255,0.08)", color: "#9ca3af" };
  return (
    <span style={{
      display: "inline-block",
      background: cfg.bg,
      color: cfg.color,
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 7px",
      borderRadius: 5,
      textTransform: "capitalize",
    }}>
      {provider}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CacheAnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { projectId } = await params;

  const raw = await getCacheStats(projectId);

  // Normalise data
  let timeSeries: TimeSeriesEntry[] = raw.timeSeries.map((r) => ({
    period: r.period,
    cacheHits: r.cacheHits,
    cacheMisses: r.cacheMisses,
  }));

  // If DB is completely empty for this period, pad with an empty 24-hour sequence for the chart
  if (timeSeries.length === 0) {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    timeSeries = Array.from({ length: 24 }, (_, i) => ({
      period: new Date(now - (23 - i) * 60 * 60 * 1000),
      cacheHits: 0,
      cacheMisses: 0,
    }));
  }

  const byModel: CacheByModel[] = raw.byModel as CacheByModel[];

  // Aggregate totals
  const totalHits = timeSeries.reduce((s, r) => s + r.cacheHits, 0);
  const totalMisses = timeSeries.reduce((s, r) => s + r.cacheMisses, 0);
  const hitRate =
    totalHits + totalMisses > 0
      ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1)
      : "0.0";

  // Today's slice (last entry)
  const todayHits = timeSeries[timeSeries.length - 1]?.cacheHits ?? 0;
  const todayMisses = timeSeries[timeSeries.length - 1]?.cacheMisses ?? 0;

  // Chart data
  const chartData = timeSeries.map((r) => ({
    label: new Date(r.period).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    hits: r.cacheHits,
    misses: r.cacheMisses,
  }));

  // Efficiency stats
  const totalEntries = byModel.reduce((s, m) => s + m._count.id, 0);
  const avgHitsPerEntry = totalEntries > 0 ? (totalHits / totalEntries).toFixed(1) : "0";
  const topModel = byModel[0]?.model ?? "—";
  const totalCacheHitCount = byModel.reduce((s, m) => s + (m._sum.hitCount ?? 0), 0);

  const isEmpty = raw.timeSeries.length === 0 && (raw.byModel as CacheByModel[]).length === 0;

  return (
    <>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 22px", height: 52, flexShrink: 0,
        background: "rgba(13,13,15,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#f9fafb" }}>Cache Analytics</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#34d399",
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: "#34d399",
              display: "inline-block", animation: "pulse 1.8s infinite",
            }} />
            {hitRate}% Hit Rate
          </span>
          {isEmpty && (
            <span style={{ fontSize: 11, color: "#6b7280" }}>Demo data shown</span>
          )}
        </div>
        <button
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 7, color: "#9ca3af", fontSize: 12,
            padding: "6px 12px", cursor: "pointer", transition: "all 0.13s",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 22,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
        alignContent: "start",
      }}>
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Area Chart Card */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 11, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Cache Hits Over Time
            </div>
            <AreaChart data={chartData} />

            {/* Stats row below chart */}
            <div style={{
              display: "flex", gap: 0,
              marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14,
            }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#34d399" }}>
                  {todayHits.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>hits (latest period)</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>
                  {todayMisses.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>misses (latest period)</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb" }}>
                  {totalHits.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>total hits (7d)</div>
              </div>
            </div>
          </div>

          {/* Bar Chart Card */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 11, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Hits vs Misses — Last 7 Periods
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "#6b7280" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#34d399", display: "inline-block" }} />
                  Hits
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444", display: "inline-block" }} />
                  Misses
                </span>
              </div>
            </div>
            <BarChart data={chartData} />
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Big hit rate card */}
          <div style={{
            background: "rgba(52,211,153,0.05)",
            border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: 11, padding: "24px 20px",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Cache Hit Rate
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#34d399", lineHeight: 1 }}>
              {hitRate}%
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              requests served from cache
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{totalHits.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Total Hits</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{totalMisses.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Total Misses</div>
              </div>
            </div>
          </div>

          {/* Model breakdown table */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 11, overflow: "hidden",
          }}>
            <div style={{ padding: "14px 18px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Model Breakdown
              </div>
            </div>
            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["MODEL", "PROVIDER", "ENTRIES", "TOTAL HITS"].map((h) => (
                      <th key={h} style={{
                        padding: "8px 18px", textAlign: "left",
                        fontSize: 10, fontWeight: 600, color: "#6b7280",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byModel.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 18px", fontSize: 12, fontWeight: 500, color: "#f9fafb" }}>
                        {row.model}
                      </td>
                      <td style={{ padding: "10px 18px" }}>
                        <ProviderChip provider={row.provider} />
                      </td>
                      <td style={{ padding: "10px 18px", fontSize: 12, color: "#9ca3af" }}>
                        {row._count.id.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>
                            {(row._sum.hitCount ?? 0).toLocaleString()}
                          </span>
                          {/* mini bar */}
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, maxWidth: 60 }}>
                            <div style={{
                              height: "100%", borderRadius: 2, background: "#34d399",
                              width: `${Math.round(((row._sum.hitCount ?? 0) / Math.max(totalCacheHitCount, 1)) * 100)}%`,
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cache efficiency card */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 11, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Cache Efficiency
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Avg hits per cached entry</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>{avgHitsPerEntry}</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Most popular model</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", fontFamily: "monospace" }}>{topModel}</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Total cached entries</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>{totalEntries.toLocaleString()}</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Bandwidth saved (est.)</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>
                  ~${(totalHits * 0.0004).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

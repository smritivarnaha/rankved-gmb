"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList
} from "recharts";
import { ArrowLeft, Info } from "lucide-react";
import { AuditReport } from "./AuditReport";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PERIODS = [
  { label: "This Month", months: 1 },
  { label: "3 Months",   months: 3 },
  { label: "6 Months",   months: 6 },
] as const;

const METRIC_TABS = [
  { key: "overview",   label: "Overview" },
  { key: "calls",      label: "Calls" },
  { key: "website",    label: "Website clicks" },
  { key: "directions", label: "Directions" },
  { key: "messages",   label: "Messages" },
] as const;

type MetricKey = typeof METRIC_TABS[number]["key"];

/* ─────────────────────────────────────────────────────────
   Smart data processing:
   • months=1  → group by WEEK  (W1, W2, W3, W4)
   • months=3/6 → group by MONTH (Jan, Feb … )
───────────────────────────────────────────────────────── */
function processRaw(dataRaw: any[], activeMetric: MetricKey, months: 1 | 3 | 6) {
  const dailyMap: Record<string, number> = {};
  let total = 0;

  if (!Array.isArray(dataRaw)) return { total: 0, chartData: [] };

  dataRaw.forEach((item: any) => {
    (item.dailyMetricTimeSeries || []).forEach((series: any) => {
      const metric: string = series.dailyMetric || "";
      const points: any[] = series.timeSeries?.datedValues || [];

      const isImpression = metric.includes("IMPRESSIONS");
      const isCall       = metric.includes("CALL_CLICKS");
      const isWebsite    = metric.includes("WEBSITE_CLICKS");
      const isDirection  = metric.includes("DIRECTION");
      const isMessage    = metric.includes("CONVERSATIONS");

      const include =
        activeMetric === "overview"   ? isImpression :
        activeMetric === "calls"      ? isCall :
        activeMetric === "website"    ? isWebsite :
        activeMetric === "directions" ? isDirection :
        activeMetric === "messages"   ? isMessage : false;

      if (!include) return;

      points.forEach((p: any) => {
        if (!p.date) return;
        const key = `${p.date.year}-${String(p.date.month).padStart(2, "0")}-${String(p.date.day).padStart(2, "0")}`;
        dailyMap[key] = (dailyMap[key] || 0) + (parseInt(p.value) || 0);
      });
    });
  });

  const sorted = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));

  // Determine grouping strategy
  const bucketMap: Record<string, number> = {};

  sorted.forEach(([dateStr, val]) => {
    const d = new Date(dateStr);
    total += val;

    let bucketKey: string;
    if (months === 1) {
      // Weekly: "Week 1", "Week 2", "Week 3", "Week 4"
      const weekNum = Math.min(Math.ceil(d.getDate() / 7), 4);
      bucketKey = `Week ${weekNum}`;
    } else {
      // Monthly: "Jan", "Feb", "Mar" …
      bucketKey = d.toLocaleString("default", { month: "short" });
    }

    bucketMap[bucketKey] = (bucketMap[bucketKey] || 0) + val;
  });

  // Preserve insertion order (sorted by date → buckets come out chronologically)
  const chartData = Object.entries(bucketMap).map(([label, value]) => ({ label, value }));

  return { total, chartData };
}

/* ── Custom floating label above each dot ─────── */
const CustomDotLabel = (props: any) => {
  const { x, y, value } = props;
  if (!value && value !== 0) return null;
  const display = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  return (
    <g>
      <rect
        x={x - 18} y={y - 30}
        width={36} height={20}
        rx={6} ry={6}
        fill="#1E293B"
        opacity={0.85}
      />
      <text
        x={x} y={y - 16}
        textAnchor="middle"
        fill="#fff"
        fontSize={10}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
      >
        {display}
      </text>
    </g>
  );
};

/* ── Tooltip ──────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #E2E8F0",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,0.10)"
    }}>
      <p style={{ fontWeight: 600, color: "#475569", marginBottom: 4, margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: "#2563EB", fontWeight: 700, margin: 0 }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

/* ── Skeleton loader ──────────────────────────── */
function Skeleton({ h, w }: { h: number; w?: number | string }) {
  return (
    <div style={{
      height: h, width: w ?? "100%",
      background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
      backgroundSize: "200% 100%",
      borderRadius: 8,
      animation: "shimmer 1.4s infinite linear"
    }} />
  );
}

/* ── Main component ───────────────────────────── */
export function PerformanceView({ profile, onBack }: { profile: any; onBack?: () => void }) {
  const [months, setMonths]         = useState<1 | 3 | 6>(6);
  const [activeMetric, setMetric]   = useState<MetricKey>("overview");
  const [activeView, setActiveView] = useState<"performance" | "audit">("performance");

  const { data: perfData, isLoading } = useSWR(
    profile ? `/api/profiles/${profile.id}/performance?months=${months}` : null,
    fetcher
  );

  const { total, chartData } = useMemo(
    () => processRaw(perfData?.data || [], activeMetric, months),
    [perfData, activeMetric, months]
  );

  if (!profile) return null;

  const metricLabel =
    activeMetric === "overview"   ? "Business Profile interactions" :
    activeMetric === "calls"      ? "Calls" :
    activeMetric === "website"    ? "Website clicks" :
    activeMetric === "directions" ? "Direction requests" :
    "Messages";

  const periodLabel = months === 1 ? "this month" : `last ${months} months`;

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", maxWidth: 900 }}>

      {/* shimmer keyframe injected once */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {onBack && (
          <button onClick={onBack} style={{
            width: 32, height: 32, borderRadius: "50%", border: "1px solid #E2E8F0",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#94A3B8", flexShrink: 0
          }}>
            <ArrowLeft size={14} />
          </button>
        )}

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, fontWeight: 500 }}>Performance</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>
            {profile.name}
          </h1>
        </div>

        {/* Performance / Audit toggle */}
        <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
          {(["performance", "audit"] as const).map((v) => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              padding: "5px 16px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: activeView === v ? "#fff" : "transparent",
              color: activeView === v ? "#111827" : "#94A3B8",
              boxShadow: activeView === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s"
            }}>
              {v === "performance" ? "Performance" : "Audit"}
            </button>
          ))}
        </div>
      </div>

      {activeView === "audit" ? (
        <AuditReport profileId={profile.id} />
      ) : (
        <>
          {/* ── Period tabs ── */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 2,
            marginBottom: 20, background: "#F8FAFC",
            border: "1px solid #E2E8F0", borderRadius: 10, padding: 4
          }}>
            {PERIODS.map((p) => (
              <button
                key={p.months}
                onClick={() => setMonths(p.months as 1 | 3 | 6)}
                style={{
                  padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                  background: months === p.months ? "#fff" : "transparent",
                  color: months === p.months ? "#111827" : "#94A3B8",
                  boxShadow: months === p.months ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Metric tabs — Google underline style ── */}
          <div style={{
            display: "flex", borderBottom: "1px solid #E2E8F0",
            marginBottom: 28, overflowX: "auto"
          }}>
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMetric(tab.key)}
                style={{
                  padding: "10px 20px", border: "none", cursor: "pointer",
                  background: "transparent", fontSize: 14, fontWeight: 500,
                  color: activeMetric === tab.key ? "#2563EB" : "#64748B",
                  borderBottom: activeMetric === tab.key ? "2px solid #2563EB" : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Big number ── */}
          <div style={{ marginBottom: 32 }}>
            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton h={52} w={140} />
                <Skeleton h={16} w={220} />
              </div>
            ) : (
              <>
                <div style={{ fontSize: 48, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  {total.toLocaleString()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 14, fontWeight: 500, color: "#64748B" }}>
                  {metricLabel}
                  <Info size={14} color="#CBD5E1" />
                  <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 4 }}>— {periodLabel}</span>
                </div>
              </>
            )}
          </div>

          {/* ── Chart ── */}
          {isLoading ? (
            <Skeleton h={300} />
          ) : chartData.length === 0 ? (
            <div style={{
              height: 300, border: "1px solid #E2E8F0", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#94A3B8", fontSize: 13
            }}>
              No data available for this period
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 40, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={true}
                    horizontal={true}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94A3B8", fontFamily: "Inter" }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "Inter" }}
                    width={36}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#fff", stroke: "#2563EB", strokeWidth: 2.5 }}
                    activeDot={{ r: 7, fill: "#2563EB", stroke: "#fff", strokeWidth: 2.5 }}
                  >
                    {/* Value labels floating above each dot */}
                    <LabelList dataKey="value" content={<CustomDotLabel />} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

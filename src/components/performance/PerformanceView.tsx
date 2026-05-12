"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { ArrowLeft, Info } from "lucide-react";
import { AuditReport } from "./AuditReport";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ── Time periods ─────────────────────────────── */
const PERIODS = [
  { label: "This Month", months: 1 },
  { label: "3 Months",   months: 3 },
  { label: "6 Months",   months: 6 },
] as const;

/* ── Metric tabs (mirroring Google's tabs) ────── */
const METRIC_TABS = [
  { key: "overview",   label: "Overview" },
  { key: "calls",      label: "Calls" },
  { key: "website",    label: "Website clicks" },
  { key: "directions", label: "Directions" },
  { key: "messages",   label: "Messages" },
] as const;

type MetricKey = typeof METRIC_TABS[number]["key"];

/* ── Process raw API data ─────────────────────── */
function processRaw(dataRaw: any[], activeMetric: MetricKey) {
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
        const key = `${p.date.year}-${String(p.date.month).padStart(2,"0")}-${String(p.date.day).padStart(2,"0")}`;
        dailyMap[key] = (dailyMap[key] || 0) + (parseInt(p.value) || 0);
      });
    });
  });

  // Sort dates and build chart data
  const sorted = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));

  // Group into weekly buckets for cleaner chart
  const weeklyMap: Record<string, number> = {};
  sorted.forEach(([dateStr, val]) => {
    const d = new Date(dateStr);
    const jan = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - jan.getTime()) / 86400000 + jan.getDay() + 1) / 7);
    const label = d.toLocaleString("default", { month: "short" }) + " " + d.getDate();
    // Use first day of the week as label key
    const weekKey = d.toLocaleString("default", { month: "short", year: "2-digit" }) + " W" + (Math.ceil(d.getDate() / 7));
    weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + val;
    total += val;
  });

  const chartData = Object.entries(weeklyMap).map(([label, value]) => ({ label, value }));

  return { total, chartData };
}

/* ── Custom tooltip ───────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--neutral-200)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    }}>
      <p style={{ fontWeight: 600, color: "var(--neutral-700)", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "var(--brand)", fontWeight: 700 }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

/* ── Main component ───────────────────────────── */
export function PerformanceView({ profile, onBack }: { profile: any; onBack?: () => void }) {
  const [months, setMonths]         = useState<1 | 3 | 6>(6); // default 6 months
  const [activeMetric, setMetric]   = useState<MetricKey>("overview");
  const [activeView, setActiveView] = useState<"performance" | "audit">("performance");

  const { data: perfData, isLoading } = useSWR(
    profile ? `/api/profiles/${profile.id}/performance?months=${months}` : null,
    fetcher
  );

  const { total, chartData } = useMemo(
    () => processRaw(perfData?.data || [], activeMetric),
    [perfData, activeMetric]
  );

  if (!profile) return null;

  const metricLabel =
    activeMetric === "overview"   ? "Business Profile interactions" :
    activeMetric === "calls"      ? "Calls" :
    activeMetric === "website"    ? "Website clicks" :
    activeMetric === "directions" ? "Direction requests" :
    "Messages";

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", maxWidth: 900 }}>

      {/* ── Header: back + profile name + view tabs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {onBack && (
          <button onClick={onBack} style={{
            width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--neutral-200)",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--neutral-500)", flexShrink: 0
          }}>
            <ArrowLeft size={14} />
          </button>
        )}

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "var(--neutral-400)", margin: 0, fontWeight: 500 }}>Performance</p>
          <h1 style={{
            fontSize: 20, fontWeight: 700, color: "var(--neutral-900)",
            margin: 0, letterSpacing: "-0.01em"
          }}>
            {profile.name}
          </h1>
        </div>

        {/* Performance / Audit view toggle */}
        <div style={{ display: "flex", gap: 4, background: "var(--neutral-100)", borderRadius: 8, padding: 3 }}>
          {(["performance", "audit"] as const).map((v) => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              padding: "5px 16px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: activeView === v ? "#fff" : "transparent",
              color: activeView === v ? "var(--neutral-900)" : "var(--neutral-400)",
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
          {/* ── Time period selector — Google style ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 20, padding: "12px 16px",
            background: "#fff", border: "1px solid var(--neutral-200)",
            borderRadius: 10, width: "max-content"
          }}>
            <span style={{ fontSize: 12, color: "var(--neutral-400)", marginRight: 4, fontWeight: 500 }}>Time period</span>
            {PERIODS.map((p) => (
              <button
                key={p.months}
                onClick={() => setMonths(p.months as 1 | 3 | 6)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                  background: months === p.months ? "var(--brand)" : "transparent",
                  color: months === p.months ? "#fff" : "var(--neutral-500)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Metric tabs (Google‐style underline) ── */}
          <div style={{
            display: "flex", gap: 0, borderBottom: "1px solid var(--neutral-200)",
            marginBottom: 28, overflowX: "auto"
          }}>
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMetric(tab.key)}
                style={{
                  padding: "10px 20px", border: "none", cursor: "pointer",
                  background: "transparent", fontSize: 14, fontWeight: 500,
                  color: activeMetric === tab.key ? "var(--brand)" : "var(--neutral-500)",
                  borderBottom: activeMetric === tab.key ? "2px solid var(--brand)" : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Big total number ── */}
          <div style={{ marginBottom: 24 }}>
            {isLoading ? (
              <div style={{ height: 52, width: 160, background: "var(--neutral-100)", borderRadius: 8 }} />
            ) : (
              <>
                <div style={{
                  fontSize: 48, fontWeight: 700, color: "var(--neutral-900)",
                  letterSpacing: "-0.03em", lineHeight: 1.1
                }}>
                  {total.toLocaleString()}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginTop: 6,
                  fontSize: 14, fontWeight: 600, color: "var(--neutral-500)"
                }}>
                  {metricLabel}
                  <Info size={14} style={{ color: "var(--neutral-300)" }} />
                </div>
              </>
            )}
          </div>

          {/* ── Line chart — Google GBP style ── */}
          <div style={{ marginBottom: 12 }}>
            {isLoading ? (
              <div style={{ height: 260, background: "var(--neutral-100)", borderRadius: 8 }} />
            ) : chartData.length === 0 ? (
              <div style={{
                height: 260, border: "1px solid var(--neutral-200)", borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--neutral-400)", fontSize: 13
              }}>
                No data available for this period
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={true}
                      horizontal={true}
                      stroke="var(--neutral-200)"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--neutral-400)", fontFamily: "Inter" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--neutral-400)", fontFamily: "Inter" }}
                      width={36}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--brand)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#fff", stroke: "var(--brand)", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "var(--brand)", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

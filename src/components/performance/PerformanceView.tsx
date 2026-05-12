"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { ArrowLeft, TrendingUp, Eye, Phone, MessageSquare, MousePointer2 } from "lucide-react";
import { AuditReport } from "./AuditReport";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ─────────────────────────────────────────
   Aggregate raw GBP API data into display
───────────────────────────────────────── */
function processData(dataRaw: any[]) {
  let interactions = 0, views = 0, calls = 0, messages = 0;
  const weeklyMap: Record<string, number> = {};

  if (!Array.isArray(dataRaw)) return { interactions, views, calls, messages, weekly: [] };

  dataRaw.forEach((item: any) => {
    (item.dailyMetricTimeSeries || []).forEach((series: any) => {
      const metric: string = series.dailyMetric || "";
      const points: any[] = series.timeSeries?.datedValues || [];
      const sum = points.reduce((a: number, p: any) => a + (parseInt(p.value) || 0), 0);

      if (metric.includes("IMPRESSIONS")) views += sum;
      else if (metric.includes("CALLS"))   calls += sum;
      else if (metric.includes("MESSAGES")) messages += sum;
      else interactions += sum;

      // Build weekly buckets from impressions series
      if (metric.includes("IMPRESSIONS") && points.length > 0) {
        points.forEach((p: any) => {
          const d = new Date(p.date.year, p.date.month - 1, p.date.day);
          // ISO week key: "Wk 1", "Wk 2" etc. — just use the day-of-month / 7
          const weekNum = Math.ceil(p.date.day / 7);
          const key = `W${weekNum} ${d.toLocaleString("default", { month: "short" })}`;
          weeklyMap[key] = (weeklyMap[key] || 0) + (parseInt(p.value) || 0);
        });
      }
    });
  });

  const weekly = Object.entries(weeklyMap).map(([week, value]) => ({ week, value }));
  return { interactions, views, calls, messages, weekly };
}

/* ─────────────────────────────────────────
   Google-style metric card
───────────────────────────────────────── */
function MetricCard({
  label, value, icon: Icon, iconBg, delta
}: {
  label: string; value: number; icon: any; iconBg: string; delta?: string;
}) {
  return (
    <div className="ds-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--neutral-500)" }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: iconBg, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={18} color="#fff" />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--neutral-900)", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      {delta && (
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: delta.startsWith("+") ? "var(--success)" : "var(--danger)"
        }}>
          {delta} vs last month
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export function PerformanceView({ profile, onBack }: { profile: any; onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");

  const { data: perfData, isLoading } = useSWR(
    profile ? `/api/profiles/${profile.id}/performance?months=1` : null,
    fetcher
  );

  if (!profile) return null;

  const { interactions, views, calls, messages, weekly } = processData(perfData?.data || []);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "1px solid var(--neutral-200)", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--neutral-500)"
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Tab strip */}
        <div style={{
          display: "flex", gap: 4,
          background: "var(--neutral-100)", borderRadius: 10, padding: 4
        }}>
          {(["overview", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "6px 18px", borderRadius: 7, border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: activeTab === t ? "#fff" : "transparent",
                color: activeTab === t ? "var(--neutral-900)" : "var(--neutral-400)",
                boxShadow: activeTab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s"
              }}
            >
              {t === "overview" ? "Performance" : "Business Audit"}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 13, color: "var(--neutral-400)", marginLeft: "auto" }}>
          Last 30 days
        </span>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* ── Metric cards — Google GBP style ── */}
          {isLoading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16, marginBottom: 24
            }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="ds-card" style={{ padding: 24, height: 120 }}>
                  <div style={{ height: 12, width: "60%", background: "var(--neutral-100)", borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ height: 32, width: "40%", background: "var(--neutral-100)", borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16, marginBottom: 24
            }}>
              <MetricCard label="Searches" value={views} icon={Eye} iconBg="#4285F4" />
              <MetricCard label="Interactions" value={interactions} icon={MousePointer2} iconBg="#34A853" />
              <MetricCard label="Calls" value={calls} icon={Phone} iconBg="#FBBC05" />
              <MetricCard label="Messages" value={messages} icon={MessageSquare} iconBg="#EA4335" />
            </div>
          )}

          {/* ── Weekly bar chart — Google GBP style ── */}
          <div className="ds-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-900)" }}>
                Search views — Weekly breakdown
              </p>
              <p style={{ fontSize: 12, color: "var(--neutral-400)", marginTop: 2 }}>
                {profile.name}
              </p>
            </div>

            {isLoading ? (
              <div style={{ height: 220, background: "var(--neutral-100)", borderRadius: 8 }} />
            ) : weekly.length === 0 ? (
              <div style={{
                height: 220, display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--neutral-400)", fontSize: 13
              }}>
                <TrendingUp size={20} style={{ marginRight: 8 }} />
                No data available for this period
              </div>
            ) : (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} barSize={28}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--neutral-200)" />
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--neutral-400)", fontFamily: "Inter" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--neutral-400)", fontFamily: "Inter" }}
                      width={30}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--neutral-100)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--neutral-200)",
                        fontSize: 12,
                        padding: "8px 12px"
                      }}
                    />
                    <Bar dataKey="value" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : (
        <AuditReport profileId={profile.id} />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Loader2, TrendingUp, TrendingDown, Eye, MousePointerClick, PhoneCall, Navigation, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, parseISO } from "date-fns";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PerformanceDashboardProps {
  profileId: string;
}

export default function PerformanceDashboard({ profileId }: PerformanceDashboardProps) {
  const [months, setMonths] = useState(1);
  const [activeMetric, setActiveMetric] = useState<"VIEWS" | "INTERACTIONS">("VIEWS");

  const { data: perfData, isLoading, error } = useSWR(
    `/api/profiles/${profileId}/performance?months=${months}`,
    fetcher
  );

  const { chartData, totals } = useMemo(() => {
    if (!perfData?.data || !Array.isArray(perfData.data)) return { chartData: [], totals: {} };

    const dateMap = new Map<string, any>();
    const calcTotals: Record<string, number> = {
      VIEWS: 0, INTERACTIONS: 0,
      BUSINESS_IMPRESSIONS_DESKTOP_MAPS: 0, BUSINESS_IMPRESSIONS_MOBILE_MAPS: 0,
      BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: 0, BUSINESS_IMPRESSIONS_MOBILE_SEARCH: 0,
      WEBSITE_CLICKS: 0, CALL_CLICKS: 0, BUSINESS_DIRECTION_REQUESTS: 0
    };

    perfData.data.forEach((metricItem: any) => {
      const metricName = metricItem.dailyMetric;
      (metricItem.timeSeries?.timeSeries || []).forEach((series: any) => {
        (series.datedValues || []).forEach((point: any) => {
          const dateStr = `${point.date.year}-${String(point.date.month).padStart(2, '0')}-${String(point.date.day).padStart(2, '0')}`;
          const val = parseInt(point.value) || 0;
          
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, { date: dateStr, dateObj: new Date(dateStr), VIEWS: 0, INTERACTIONS: 0 });
          }
          const row = dateMap.get(dateStr);
          row[metricName] = val;

          // Group into VIEWS and INTERACTIONS
          if (metricName.includes("IMPRESSIONS")) {
            row.VIEWS += val;
            calcTotals.VIEWS += val;
          } else {
            row.INTERACTIONS += val;
            calcTotals.INTERACTIONS += val;
          }
          
          if (calcTotals[metricName] !== undefined) {
             calcTotals[metricName] += val;
          }
        });
      });
    });

    const sortedData = Array.from(dateMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    // Format dates for chart
    sortedData.forEach(d => {
      d.displayDate = format(d.dateObj, "MMM d");
    });

    return { chartData: sortedData, totals: calcTotals };
  }, [perfData]);

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <p style={{ color: "#dc2626" }}>Failed to load performance data.</p>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>Google integration might be expired or not configured properly.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
      
      {/* Header & Date Selector */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Profile Performance</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Metrics tracked from Google Business Profile.</p>
        </div>
        
        <div style={{ display: "flex", background: "#f8fafc", borderRadius: 8, padding: 4, border: "1px solid #e2e8f0" }}>
          {[
            { label: "1 Month", value: 1 },
            { label: "3 Months", value: 3 },
            { label: "6 Months", value: 6 }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setMonths(opt.value)}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer",
                background: months === opt.value ? "#fff" : "transparent",
                color: months === opt.value ? "#0f172a" : "#64748b",
                boxShadow: months === opt.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "100px 0", display: "flex", justifyContent: "center" }}>
          <Loader2 style={{ width: 24, height: 24, color: "#2563eb" }} className="anim-spin" />
        </div>
      ) : (
        <div style={{ padding: 24 }}>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 30 }}>
            
            <div 
              onClick={() => setActiveMetric("VIEWS")}
              style={{ 
                padding: 20, borderRadius: 12, border: activeMetric === "VIEWS" ? "2px solid #2563eb" : "1px solid #e2e8f0", 
                background: activeMetric === "VIEWS" ? "#eff6ff" : "#fff", cursor: "pointer", transition: "all 0.2s" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: activeMetric === "VIEWS" ? "#dbeafe" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Eye style={{ width: 18, height: 18, color: activeMetric === "VIEWS" ? "#2563eb" : "#64748b" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Total Views</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{totals.VIEWS?.toLocaleString()}</p>
            </div>

            <div 
              onClick={() => setActiveMetric("INTERACTIONS")}
              style={{ 
                padding: 20, borderRadius: 12, border: activeMetric === "INTERACTIONS" ? "2px solid #2563eb" : "1px solid #e2e8f0", 
                background: activeMetric === "INTERACTIONS" ? "#eff6ff" : "#fff", cursor: "pointer", transition: "all 0.2s" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: activeMetric === "INTERACTIONS" ? "#dbeafe" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MousePointerClick style={{ width: 18, height: 18, color: activeMetric === "INTERACTIONS" ? "#2563eb" : "#64748b" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Interactions</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{totals.INTERACTIONS?.toLocaleString()}</p>
            </div>

          </div>

          {/* Main Chart */}
          <div style={{ height: 350, width: "100%", marginBottom: 30 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#94a3b8" }} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#94a3b8" }} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", fontWeight: 500 }}
                  labelStyle={{ color: "#64748b", marginBottom: 4 }}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Stats */}
          {activeMetric === "INTERACTIONS" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, borderTop: "1px solid #f1f5f9", paddingTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
                  <ArrowUpRight style={{ width: 18, height: 18, color: "#64748b" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Website Clicks</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{totals.WEBSITE_CLICKS?.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
                  <Navigation style={{ width: 18, height: 18, color: "#64748b" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Direction Requests</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{totals.BUSINESS_DIRECTION_REQUESTS?.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
                  <PhoneCall style={{ width: 18, height: 18, color: "#64748b" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Calls</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{totals.CALL_CLICKS?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeMetric === "VIEWS" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, borderTop: "1px solid #f1f5f9", paddingTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>M</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Maps (Mobile)</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{totals.BUSINESS_IMPRESSIONS_MOBILE_MAPS?.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>S</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Search (Mobile)</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{totals.BUSINESS_IMPRESSIONS_MOBILE_SEARCH?.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>D</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#64748b" }}>Desktop (All)</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{(totals.BUSINESS_IMPRESSIONS_DESKTOP_MAPS + totals.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH)?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

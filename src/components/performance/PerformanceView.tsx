"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell
} from "recharts";
import { ArrowLeft, Info, Eye, Search, Phone, Globe, Navigation, TrendingUp } from "lucide-react";
import { AuditReport } from "./AuditReport";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PERIODS = [
  { label: "This Month", months: 1 },
  { label: "3 Months",   months: 3 },
  { label: "6 Months",   months: 6 },
] as const;

/* "discovery" and "audit" are special tabs */
const METRIC_TABS = [
  { key: "overview",   label: "Overview"   },
  { key: "calls",      label: "Calls"      },
  { key: "website",    label: "Website"    },
  { key: "directions", label: "Directions" },
  { key: "messages",   label: "Messages"   },
  { key: "discovery",  label: "Discovery"  },
  { key: "audit",      label: "Audit"      },
] as const;

type MetricKey = typeof METRIC_TABS[number]["key"];

/* ── Sum helper ── */
function sumMetric(dataRaw: any[], keyword: string): number {
  if (!Array.isArray(dataRaw)) return 0;
  let total = 0;
  dataRaw.forEach((item: any) => {
    (item.dailyMetricTimeSeries || []).forEach((series: any) => {
      if ((series.dailyMetric || "").includes(keyword)) {
        (series.timeSeries?.datedValues || []).forEach((p: any) => {
          total += parseInt(p.value) || 0;
        });
      }
    });
  });
  return total;
}

/* ── Platform breakdown ── */
function computePlatformBreakdown(dataRaw: any[]) {
  const mobileSearch  = sumMetric(dataRaw, "MOBILE_SEARCH");
  const mapsSearch    = sumMetric(dataRaw, "MOBILE_MAPS");
  const desktopSearch = sumMetric(dataRaw, "DESKTOP_SEARCH");
  const desktopMaps   = sumMetric(dataRaw, "DESKTOP_MAPS");
  const totalViews = mobileSearch + mapsSearch + desktopSearch + desktopMaps;
  return {
    totalViews,
    platforms: [
      { label: "Google Search – mobile",  value: mobileSearch,  color: "#FBBC04" },
      { label: "Google Maps – mobile",    value: mapsSearch,    color: "#EA4335" },
      { label: "Google Search – desktop", value: desktopSearch, color: "#4285F4" },
      { label: "Google Maps – desktop",   value: desktopMaps,   color: "#34A853" },
    ].filter(p => p.value > 0),
  };
}

/* ── Chart data builder ── */
function processRaw(dataRaw: any[], activeMetric: MetricKey, months: 1|3|6) {
  const dailyMap: Record<string, number> = {};
  let total = 0;
  if (!Array.isArray(dataRaw)) return { total: 0, chartData: [] };
  dataRaw.forEach((item: any) => {
    (item.dailyMetricTimeSeries || []).forEach((series: any) => {
      const metric: string = series.dailyMetric || "";
      const points: any[] = series.timeSeries?.datedValues || [];
      const include =
        activeMetric === "overview"   ? metric.includes("IMPRESSIONS") :
        activeMetric === "calls"      ? metric.includes("CALL_CLICKS") :
        activeMetric === "website"    ? metric.includes("WEBSITE_CLICKS") :
        activeMetric === "directions" ? metric.includes("DIRECTION") :
        activeMetric === "messages"   ? metric.includes("CONVERSATIONS") : false;
      if (!include) return;
      points.forEach((p: any) => {
        if (!p.date) return;
        const key = `${p.date.year}-${String(p.date.month).padStart(2,"0")}-${String(p.date.day).padStart(2,"0")}`;
        dailyMap[key] = (dailyMap[key] || 0) + (parseInt(p.value) || 0);
      });
    });
  });
  const sorted = Object.entries(dailyMap).sort(([a],[b]) => a.localeCompare(b));
  const bucketMap: Record<string, number> = {};
  sorted.forEach(([dateStr, val]) => {
    const d = new Date(dateStr);
    total += val;
    const bucketKey = months === 1
      ? `Week ${Math.min(Math.ceil(d.getDate()/7), 4)}`
      : d.toLocaleString("default", { month:"short" });
    bucketMap[bucketKey] = (bucketMap[bucketKey] || 0) + val;
  });
  return { total, chartData: Object.entries(bucketMap).map(([label, value]) => ({ label, value })) };
}

/* ── Components ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"10px 14px", fontSize:12, boxShadow:"0 4px 16px rgba(0,0,0,0.10)" }}>
      <p style={{ fontWeight:600, color:"#475569", margin:"0 0 4px" }}>{label}</p>
      <p style={{ color:"#2563EB", fontWeight:700, margin:0 }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

const CustomDotLabel = (props: any) => {
  const { x, y, value } = props;
  if (!value && value !== 0) return null;
  const display = value >= 1000 ? `${(value/1000).toFixed(1)}k` : String(value);
  return (
    <g>
      <rect x={x-18} y={y-30} width={36} height={20} rx={6} ry={6} fill="#1E293B" opacity={0.85} />
      <text x={x} y={y-16} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600} fontFamily="Inter,sans-serif">{display}</text>
    </g>
  );
};

function Skeleton({ h, w }: { h: number; w?: number|string }) {
  return <div style={{ height:h, width:w??"100%", background:"linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize:"200% 100%", borderRadius:8, animation:"shimmer 1.4s infinite linear" }} />;
}

/* ── Discovery Tab Panel ── */
function DiscoveryPanel({ rawData, kwData, kwLoading, isLoading, periodLabel }: {
  rawData: any[]; kwData: any; kwLoading: boolean; isLoading: boolean; periodLabel: string;
}) {
  const { totalViews, platforms } = useMemo(() => computePlatformBreakdown(rawData), [rawData]);
  const keywords: { keyword: string; count: number }[] = kwData?.data || [];
  // Google's 'Searches showed your Business Profile' = sum of all keyword impressions
  // NOT the performance API search impressions (which count every page render)
  const totalSearches = useMemo(() => keywords.reduce((sum, kw) => sum + kw.count, 0), [keywords]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="disc-stat-grid">
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"24px 24px 20px" }}>
          {isLoading ? <><Skeleton h={52} w={130}/><div style={{marginTop:10}}><Skeleton h={16} w={180}/></div></> : (
            <>
              <div style={{ fontSize:48, fontWeight:800, color:"#111827", letterSpacing:"-0.04em", lineHeight:1 }}>{totalViews.toLocaleString()}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, fontSize:13, color:"#64748B", fontWeight:500 }}>
                <Eye size={15}/> People viewed your Business Profile
              </div>
            </>
          )}
        </div>
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"24px 24px 20px" }}>
          {isLoading || kwLoading ? <><Skeleton h={52} w={130}/><div style={{marginTop:10}}><Skeleton h={16} w={180}/></div></> : (
            <>
              <div style={{ fontSize:48, fontWeight:800, color:"#111827", letterSpacing:"-0.04em", lineHeight:1 }}>{totalSearches.toLocaleString()}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, fontSize:13, color:"#64748B", fontWeight:500 }}>
                <Search size={15}/> Searches showed your Business Profile
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Period label ── */}
      <p style={{ fontSize:11, color:"#94A3B8", margin:"0" }}>
        Showing data for <strong>{periodLabel}</strong>
      </p>

      {/* ── Platform + Keywords: sticky layout ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, alignItems:"start" }} className="disc-detail-grid">

        {/* LEFT: Platform breakdown — sticky */}
        <div style={{ position:"sticky", top:80 }}>
          <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"20px 22px" }}>
            <p style={{ fontSize:14, fontWeight:700, color:"#111827", margin:"0 0 3px" }}>Platform and device breakdown</p>
            <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 20px" }}>Platforms and devices used to find your profile</p>

            {isLoading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3].map(i => <Skeleton key={i} h={22}/>)}</div>
            ) : platforms.length === 0 ? (
              <p style={{ fontSize:13, color:"#94A3B8" }}>No data available</p>
            ) : (
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                <div style={{ flexShrink:0 }}>
                  <PieChart width={110} height={110}>
                    <Pie data={platforms} dataKey="value" cx={55} cy={55} innerRadius={30} outerRadius={50} strokeWidth={0}>
                      {platforms.map((p,i) => <Cell key={i} fill={p.color}/>)}
                    </Pie>
                  </PieChart>
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                  {platforms.map((p,i) => {
                    const pct = totalViews > 0 ? Math.round((p.value/totalViews)*100) : 0;
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:p.color, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:"#374151", flex:1 }}>{p.label}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#111827", whiteSpace:"nowrap" }}>
                          {p.value.toLocaleString()} · {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Keywords — scrollable, all results, no progress bars */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"20px 22px 14px", borderBottom:"1px solid #F1F5F9" }}>
            <p style={{ fontSize:14, fontWeight:700, color:"#111827", margin:"0 0 3px" }}>Searches breakdown</p>
            <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>Search terms that showed your Business Profile</p>
          </div>

          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", padding:"10px 22px 8px", background:"#FAFAFA", borderBottom:"1px solid #F1F5F9" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.05em" }}>Keyword</span>
            <span style={{ fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.05em" }}>Impressions</span>
          </div>

          {/* Scrollable list — all keywords */}
          <div style={{ maxHeight:440, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"#E2E8F0 transparent" }}>
            {kwLoading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"16px 22px" }}>
                {Array.from({length:8}).map((_,i) => <Skeleton key={i} h={28}/>)}
              </div>
            ) : kwData?.error ? (
              <div style={{ padding:"16px 22px", fontSize:12, color:"#ef4444" }}>{kwData.error}</div>
            ) : keywords.length === 0 ? (
              <div style={{ padding:"24px 22px", fontSize:13, color:"#94A3B8", textAlign:"center" }}>
                No keyword data available for this period
              </div>
            ) : (
              keywords.map((kw, i) => (
                <div key={i} style={{
                  display:"grid",
                  gridTemplateColumns:"1fr auto",
                  alignItems:"center",
                  padding:"11px 22px",
                  borderBottom: i < keywords.length-1 ? "1px solid #F8FAFC" : "none",
                  background: i % 2 === 0 ? "#fff" : "#FAFFFE",
                  transition:"background 150ms",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background="#F0F9FF")}
                  onMouseLeave={e => (e.currentTarget.style.background= i%2===0?"#fff":"#FAFFFE")}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <span style={{ fontSize:11, color:"#CBD5E1", fontWeight:600, width:20, textAlign:"right", flexShrink:0 }}>{i+1}</span>
                    <span style={{ fontSize:13, color:"#111827", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={kw.keyword}>
                      {kw.keyword}
                    </span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:"#111827", paddingLeft:16 }}>
                    {kw.count.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer with count */}
          {keywords.length > 0 && (
            <div style={{ padding:"10px 22px", borderTop:"1px solid #F1F5F9", background:"#FAFAFA" }}>
              <span style={{ fontSize:11, color:"#94A3B8" }}>{keywords.length} search terms — scroll to see all</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */
export function PerformanceView({ profile, onBack }: { profile: any; onBack?: () => void }) {
  const [months, setMonths]       = useState<1|3|6>(6);
  const [activeMetric, setMetric] = useState<MetricKey>("overview");

  const { data: perfData, isLoading } = useSWR(
    profile ? `/api/profiles/${profile.id}/performance?months=${months}` : null,
    fetcher
  );
  const { data: kwData, isLoading: kwLoading } = useSWR(
    profile ? `/api/profiles/${profile.id}/keywords?months=${months}` : null,
    fetcher
  );

  const rawData = perfData?.data || [];
  const { total, chartData } = useMemo(() => processRaw(rawData, activeMetric, months), [rawData, activeMetric, months]);

  const metricLabel =
    activeMetric === "overview"   ? "Business Profile views" :
    activeMetric === "calls"      ? "Calls" :
    activeMetric === "website"    ? "Website clicks" :
    activeMetric === "directions" ? "Direction requests" : "Messages";

  const periodLabel = months === 1 ? "this month" : `last ${months} months`;

  if (!profile) return null;

  const isSpecialTab = activeMetric === "discovery" || activeMetric === "audit";

  return (
    <div style={{ fontFamily:"Inter,-apple-system,sans-serif", maxWidth:960 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width: 768px) {
          .disc-stat-grid   { grid-template-columns: 1fr !important; }
          .disc-detail-grid { grid-template-columns: 1fr !important; }
          .disc-detail-grid > div:first-child { position: relative !important; top: auto !important; }
          .perf-metric-tabs { overflow-x: auto; scrollbar-width: none; }
          .perf-metric-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        {onBack && (
          <button onClick={onBack} style={{ width:32,height:32,borderRadius:"50%",border:"1px solid #E2E8F0",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#94A3B8",flexShrink:0 }}>
            <ArrowLeft size={14}/>
          </button>
        )}
        <div style={{ flex:1 }}>
          <p style={{ fontSize:12, color:"#94A3B8", margin:0, fontWeight:500 }}>Analytics</p>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#111827", margin:0, letterSpacing:"-0.01em" }}>{profile.name}</h1>
        </div>
      </div>

      {/* ── Period ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:2, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:10, padding:4 }}>
          {PERIODS.map(p => (
            <button key={p.months} onClick={() => setMonths(p.months as 1|3|6)} style={{
              padding:"6px 16px", borderRadius:7, border:"none", cursor:"pointer",
              fontSize:13, fontWeight:600, transition:"all 0.15s",
              background: months===p.months?"#fff":"transparent",
              color: months===p.months?"#111827":"#94A3B8",
              boxShadow: months===p.months?"0 1px 4px rgba(0,0,0,0.08)":"none",
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── All Tabs in one row ── */}
      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, overflow:"hidden", marginBottom:20 }}>
        <div style={{ display:"flex", borderBottom:"1px solid #E2E8F0" }} className="perf-metric-tabs">
          {METRIC_TABS.map(tab => {
            const isDiscovery = tab.key === "discovery";
            const isAudit = tab.key === "audit";
            const activeColor = isDiscovery ? "#7c3aed" : isAudit ? "#0891b2" : "#2563EB";
            const active = activeMetric === tab.key;
            return (
              <button key={tab.key} onClick={() => setMetric(tab.key)} style={{
                padding:"12px 18px", border:"none", cursor:"pointer",
                fontSize:13, fontWeight:active ? 600 : 500, whiteSpace:"nowrap",
                color: active ? activeColor : "#64748B",
                borderBottom: active ? `2px solid ${activeColor}` : "2px solid transparent",
                marginBottom:-1, transition:"all 0.15s",
                background: active && isDiscovery ? "rgba(124,58,237,0.04)"
                  : active && isAudit ? "rgba(8,145,178,0.04)" : "transparent",
              } as any}>
                {isDiscovery
                  ? <><TrendingUp size={12} style={{marginRight:4,verticalAlign:"middle"}}/>{tab.label}</>
                  : tab.label
                }
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        {activeMetric === "discovery" && (
          <div style={{ padding:"24px 20px" }}>
            <DiscoveryPanel rawData={rawData} kwData={kwData} kwLoading={kwLoading} isLoading={isLoading} periodLabel={periodLabel}/>
          </div>
        )}

        {activeMetric === "audit" && (
          <div style={{ padding:"20px" }}>
            <AuditReport profileId={profile.id}/>
          </div>
        )}

        {!isSpecialTab && (
          <div style={{ padding:"24px 20px" }}>
            {/* Big number */}
            <div style={{ marginBottom:20 }}>
              {isLoading ? (
                <><Skeleton h={48} w={140}/><div style={{marginTop:10}}><Skeleton h={16} w={220}/></div></>
              ) : (
                <>
                  <div style={{ fontSize:44, fontWeight:700, color:"#111827", letterSpacing:"-0.03em", lineHeight:1.1 }}>{total.toLocaleString()}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, fontSize:14, fontWeight:500, color:"#64748B" }}>
                    {metricLabel} <Info size={14} color="#CBD5E1"/>
                    <span style={{ fontSize:12, color:"#94A3B8", marginLeft:4 }}>— {periodLabel}</span>
                  </div>
                </>
              )}
            </div>
            {/* Chart */}
            {isLoading ? <Skeleton h={260}/> : chartData.length===0 ? (
              <div style={{ height:260, border:"1px solid #E2E8F0", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:13 }}>
                No data for this period
              </div>
            ) : (
              <div style={{ height:260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top:40, right:20, left:0, bottom:0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.22}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    {/* Horizontal light lines + dashed vertical separators (GBP style) */}
                    <CartesianGrid
                      strokeDasharray="5 5"
                      vertical={true}
                      horizontal={true}
                      stroke="#E2E8F0"
                      verticalFill={undefined}
                    />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:"#94A3B8", fontFamily:"Inter" }} interval={0}/>
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94A3B8", fontFamily:"Inter" }} width={36} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#chartGradient)"
                      dot={{ r:5, fill:"#fff", stroke:"#2563EB", strokeWidth:2.5 }}
                      activeDot={{ r:7, fill:"#2563EB", stroke:"#fff", strokeWidth:2.5 }}
                    >
                      <LabelList dataKey="value" content={<CustomDotLabel/>}/>
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick stats (only on metric tabs) ── */}
      {!isSpecialTab && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {[
            { metric:"CALL_CLICKS",    label:"Calls",            icon:Phone,      color:"#10b981" },
            { metric:"WEBSITE_CLICKS", label:"Website Clicks",   icon:Globe,      color:"#6366f1" },
            { metric:"DIRECTION",      label:"Direction Requests",icon:Navigation, color:"#f59e0b" },
          ].map(item => {
            const val = sumMetric(rawData, item.metric);
            const Icon = item.icon;
            return (
              <div key={item.metric} style={{ flex:1, minWidth:120, background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${item.color}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={16} color={item.color}/>
                </div>
                <div>
                  <p style={{ fontSize:20, fontWeight:700, color:"#111827", margin:0, lineHeight:1 }}>{isLoading?"...":val.toLocaleString()}</p>
                  <p style={{ fontSize:11, color:"#94A3B8", margin:"3px 0 0", fontWeight:500 }}>{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

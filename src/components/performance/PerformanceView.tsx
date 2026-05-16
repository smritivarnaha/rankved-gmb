"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
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

/* "discovery" is a special tab — renders the discovery panel instead of chart */
const METRIC_TABS = [
  { key: "overview",   label: "Overview"   },
  { key: "calls",      label: "Calls"      },
  { key: "website",    label: "Website"    },
  { key: "directions", label: "Directions" },
  { key: "messages",   label: "Messages"   },
  { key: "discovery",  label: "Discovery"  },
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
function DiscoveryPanel({ rawData, kwData, kwLoading, isLoading }: {
  rawData: any[]; kwData: any; kwLoading: boolean; isLoading: boolean;
}) {
  const { totalViews, platforms } = useMemo(() => computePlatformBreakdown(rawData), [rawData]);
  const totalSearches = useMemo(
    () => sumMetric(rawData, "IMPRESSIONS_DESKTOP_SEARCH") + sumMetric(rawData, "IMPRESSIONS_MOBILE_SEARCH"),
    [rawData]
  );
  const keywords: { keyword: string; count: number }[] = kwData?.data || [];
  const maxCount = keywords[0]?.count || 1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Top stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="disc-stat-grid">
        {/* Views */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"24px 24px 20px" }}>
          {isLoading ? <><Skeleton h={52} w={130}/><div style={{marginTop:10}}><Skeleton h={16} w={180}/></div></> : (
            <>
              <div style={{ fontSize:48, fontWeight:800, color:"#111827", letterSpacing:"-0.04em", lineHeight:1 }}>{totalViews.toLocaleString()}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, fontSize:13, color:"#64748B", fontWeight:500 }}>
                <Eye size={15} /> People viewed your Business Profile
              </div>
            </>
          )}
        </div>
        {/* Searches */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"24px 24px 20px" }}>
          {isLoading ? <><Skeleton h={52} w={130}/><div style={{marginTop:10}}><Skeleton h={16} w={180}/></div></> : (
            <>
              <div style={{ fontSize:48, fontWeight:800, color:"#111827", letterSpacing:"-0.04em", lineHeight:1 }}>{totalSearches.toLocaleString()}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, fontSize:13, color:"#64748B", fontWeight:500 }}>
                <Search size={15} /> Searches showed your Business Profile
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom: platform + keywords ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="disc-detail-grid">

        {/* Platform breakdown */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"20px 22px" }}>
          <p style={{ fontSize:14, fontWeight:700, color:"#111827", margin:"0 0 3px" }}>Platform and device breakdown</p>
          <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 20px" }}>Platforms and devices used to find your profile</p>

          {isLoading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3].map(i => <Skeleton key={i} h={22}/>)}</div>
          ) : platforms.length === 0 ? (
            <p style={{ fontSize:13, color:"#94A3B8" }}>No data available</p>
          ) : (
            <div style={{ display:"flex", gap:20, alignItems:"center" }}>
              {/* Donut */}
              <div style={{ flexShrink:0 }}>
                <PieChart width={110} height={110}>
                  <Pie data={platforms} dataKey="value" cx={55} cy={55} innerRadius={30} outerRadius={50} strokeWidth={0}>
                    {platforms.map((p,i) => <Cell key={i} fill={p.color}/>)}
                  </Pie>
                </PieChart>
              </div>
              {/* Legend */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                {platforms.map((p,i) => {
                  const pct = totalViews > 0 ? Math.round((p.value/totalViews)*100) : 0;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:p.color, flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:"#374151", flex:1 }}>{p.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>
                        {p.value.toLocaleString()} · {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Keywords */}
        <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"20px 22px" }}>
          <p style={{ fontSize:14, fontWeight:700, color:"#111827", margin:"0 0 3px" }}>Searches breakdown</p>
          <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 20px" }}>Search terms that showed your Business Profile</p>

          {kwLoading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} h={28}/>)}</div>
          ) : kwData?.error ? (
            <div style={{ padding:"12px 14px", background:"#fef2f2", borderRadius:8, fontSize:12, color:"#dc2626" }}>{kwData.error}</div>
          ) : keywords.length === 0 ? (
            <p style={{ fontSize:13, color:"#94A3B8" }}>No keyword data available for this period</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {keywords.slice(0,10).map((kw,i) => {
                const barWidth = Math.round((kw.count / maxCount) * 100);
                return (
                  <div key={i} style={{ padding:"9px 0", borderBottom: i < Math.min(keywords.length,10)-1 ? "1px solid #F8FAFC" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                      <span style={{ fontSize:11, color:"#94A3B8", width:16, textAlign:"right", flexShrink:0, fontWeight:600 }}>{i+1}</span>
                      <span style={{ fontSize:13, color:"#111827", flex:1, fontWeight:500, lineHeight:1.3 }}>{kw.keyword}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#111827", flexShrink:0 }}>{kw.count.toLocaleString()}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginLeft:26, height:3, background:"#F1F5F9", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${barWidth}%`, background:"#2563EB", borderRadius:2, transition:"width 0.6s ease", opacity: 0.6 + (0.4 * barWidth/100) }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */
export function PerformanceView({ profile, onBack }: { profile: any; onBack?: () => void }) {
  const [months, setMonths]         = useState<1|3|6>(6);
  const [activeMetric, setMetric]   = useState<MetricKey>("overview");
  const [activeView, setActiveView] = useState<"performance"|"audit">("performance");

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

  if (!profile) return null;

  return (
    <div style={{ fontFamily:"Inter,-apple-system,sans-serif", maxWidth:960 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @media (max-width: 768px) {
          .disc-stat-grid   { grid-template-columns: 1fr !important; }
          .disc-detail-grid { grid-template-columns: 1fr !important; }
          .perf-metric-tabs { overflow-x: auto; scrollbar-width: none; }
          .perf-metric-tabs::-webkit-scrollbar { display: none; }
          .perf-stat-row    { flex-direction: column !important; }
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
        <div style={{ display:"flex", gap:4, background:"#F1F5F9", borderRadius:8, padding:3 }}>
          {(["performance","audit"] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              padding:"5px 16px", borderRadius:6, border:"none", cursor:"pointer",
              fontSize:13, fontWeight:600,
              background: activeView===v?"#fff":"transparent",
              color: activeView===v?"#111827":"#94A3B8",
              boxShadow: activeView===v?"0 1px 3px rgba(0,0,0,0.08)":"none",
              transition:"all 0.15s"
            }}>
              {v==="performance"?"Analytics":"Audit"}
            </button>
          ))}
        </div>
      </div>

      {activeView === "audit" ? <AuditReport profileId={profile.id} /> : (
        <>
          {/* ── Period ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
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

          {/* ── Metric Tabs ── */}
          <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, overflow:"hidden", marginBottom:20 }}>
            <div style={{ display:"flex", borderBottom:"1px solid #E2E8F0" }} className="perf-metric-tabs">
              {METRIC_TABS.map(tab => (
                 <button key={tab.key} onClick={() => setMetric(tab.key)} style={{
                  padding:"12px 20px", border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:500, whiteSpace:"nowrap",
                  color: activeMetric===tab.key ? (tab.key==="discovery"?"#7c3aed":"#2563EB") : "#64748B",
                  borderBottom: activeMetric===tab.key
                    ? `2px solid ${tab.key==="discovery"?"#7c3aed":"#2563EB"}`
                    : "2px solid transparent",
                  marginBottom:-1, transition:"all 0.15s",
                  background: (tab.key==="discovery" && activeMetric===tab.key) ? "rgba(124,58,237,0.04)" : "transparent",
                } as any}>
                  {tab.key==="discovery" ? <><TrendingUp size={13} style={{marginRight:5,verticalAlign:"middle"}}/>{tab.label}</> : tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ── */}
            {activeMetric === "discovery" ? (
              <div style={{ padding:"24px 20px" }}>
                <DiscoveryPanel rawData={rawData} kwData={kwData} kwLoading={kwLoading} isLoading={isLoading} />
              </div>
            ) : (
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
                        <span style={{ fontSize:12, color:"#94A3B8", marginLeft:4 }}>— {months===1?"this month":`last ${months} months`}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Chart */}
                {isLoading ? <Skeleton h={260}/> : chartData.length===0 ? (
                  <div style={{ height:260, border:"1px solid #E2E8F0", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:13 }}>
                    No data available for this period
                  </div>
                ) : (
                  <div style={{ height:260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top:40, right:20, left:0, bottom:0 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9"/>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:"#94A3B8", fontFamily:"Inter" }} interval={0}/>
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94A3B8", fontFamily:"Inter" }} width={36} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} dot={{ r:5, fill:"#fff", stroke:"#2563EB", strokeWidth:2.5 }} activeDot={{ r:7, fill:"#2563EB", stroke:"#fff", strokeWidth:2.5 }}>
                          <LabelList dataKey="value" content={<CustomDotLabel/>}/>
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Quick stat cards (only when not on discovery) ── */}
          {activeMetric !== "discovery" && (
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
        </>
      )}
    </div>
  );
}

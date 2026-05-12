"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Loader2, AlertCircle, ArrowLeft, Eye, MousePointerClick, PhoneCall, Navigation, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek } from "date-fns";

interface Profile {
  id: string;
  name: string;
  googleName: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function PerformanceView({ profile, onBack }: { profile: Profile, onBack?: () => void }) {
  const [months, setMonths] = useState(1);
  const [activeMetric, setActiveMetric] = useState<string>("OVERVIEW");

  const { data: perfData, isLoading, error } = useSWR(
    `/api/profiles/${profile.id}/performance?months=${months}`,
    fetcher
  );

  const { chartData, totals } = useMemo(() => {
    const defaultTotals = {
      VIEWS: 0, INTERACTIONS: 0,
      BUSINESS_IMPRESSIONS_DESKTOP_MAPS: 0, BUSINESS_IMPRESSIONS_MOBILE_MAPS: 0,
      BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: 0, BUSINESS_IMPRESSIONS_MOBILE_SEARCH: 0,
      WEBSITE_CLICKS: 0, CALL_CLICKS: 0, BUSINESS_DIRECTION_REQUESTS: 0,
      BUSINESS_CONVERSATIONS: 0, BUSINESS_BOOKINGS: 0
    };
    if (!perfData?.data || !Array.isArray(perfData.data)) return { chartData: [], totals: defaultTotals };

    const dateMap = new Map<string, any>();
    const calcTotals: Record<string, number> = { ...defaultTotals };

    perfData.data.forEach((multiSeriesItem: any) => {
      const seriesArray = multiSeriesItem.dailyMetricTimeSeries || [];
      
      seriesArray.forEach((series: any) => {
        const metricName = series.dailyMetric;
        if (!metricName) return;
        
        const datedValues = series.timeSeries?.datedValues || [];
        
        datedValues.forEach((point: any) => {
          if (!point.date || point.value === undefined) return;
          
          // Data Aggregation Logic
          const pointDate = new Date(point.date.year, point.date.month - 1, point.date.day);
          let bucketKey = "";
          let sortDate = pointDate;
          
          if (months === 1) {
            // Group by Week (starts on Monday)
            const weekStart = startOfWeek(pointDate, { weekStartsOn: 1 });
            bucketKey = format(weekStart, "yyyy-MM-dd");
            sortDate = weekStart;
          } else {
            // Group by Month
            const monthStart = new Date(point.date.year, point.date.month - 1, 1);
            bucketKey = format(monthStart, "yyyy-MM");
            sortDate = monthStart;
          }

          const val = parseInt(point.value) || 0;
          
          if (!dateMap.has(bucketKey)) {
            dateMap.set(bucketKey, { 
              bucketKey, sortDate, 
              VIEWS: 0, INTERACTIONS: 0, OVERVIEW: 0,
              CALLS: 0, MESSAGES: 0, BOOKINGS: 0, DIRECTIONS: 0, WEBSITE_CLICKS: 0
            });
          }
          const row = dateMap.get(bucketKey);
          
          if (metricName.includes("IMPRESSIONS")) {
            row.VIEWS += val;
            calcTotals.VIEWS += val;
          } else {
            row.INTERACTIONS += val;
            row.OVERVIEW += val; 
            calcTotals.INTERACTIONS += val;
          }

          if (metricName === "CALL_CLICKS") { row.CALLS += val; calcTotals.CALL_CLICKS += val; }
          if (metricName === "BUSINESS_CONVERSATIONS") { row.MESSAGES += val; calcTotals.BUSINESS_CONVERSATIONS += val; }
          if (metricName === "BUSINESS_BOOKINGS") { row.BOOKINGS += val; calcTotals.BUSINESS_BOOKINGS += val; }
          if (metricName === "BUSINESS_DIRECTION_REQUESTS") { row.DIRECTIONS += val; calcTotals.BUSINESS_DIRECTION_REQUESTS += val; }
          if (metricName === "WEBSITE_CLICKS") { row.WEBSITE_CLICKS += val; calcTotals.WEBSITE_CLICKS += val; }
          
          if (metricName === "BUSINESS_IMPRESSIONS_DESKTOP_MAPS") calcTotals.BUSINESS_IMPRESSIONS_DESKTOP_MAPS += val;
          if (metricName === "BUSINESS_IMPRESSIONS_MOBILE_MAPS") calcTotals.BUSINESS_IMPRESSIONS_MOBILE_MAPS += val;
          if (metricName === "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") calcTotals.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH += val;
          if (metricName === "BUSINESS_IMPRESSIONS_MOBILE_SEARCH") calcTotals.BUSINESS_IMPRESSIONS_MOBILE_SEARCH += val;
        });
      });
    });

    const sortedData = Array.from(dateMap.values()).sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    
    sortedData.forEach(d => {
      if (months === 1) {
        d.displayDate = `Week of ${format(d.sortDate, "MMM d")}`;
      } else {
        d.displayDate = format(d.sortDate, "MMM yyyy");
      }
    });

    return { chartData: sortedData, totals: calcTotals };
  }, [perfData, months]);

  const TABS = [
    { id: "OVERVIEW", label: "Overview", value: totals.INTERACTIONS },
    { id: "VIEWS", label: "Profile Views", value: totals.VIEWS },
    { id: "CALLS", label: "Calls", value: totals.CALL_CLICKS },
    { id: "MESSAGES", label: "Messages", value: totals.BUSINESS_CONVERSATIONS },
    { id: "BOOKINGS", label: "Bookings", value: totals.BUSINESS_BOOKINGS },
    { id: "DIRECTIONS", label: "Directions", value: totals.BUSINESS_DIRECTION_REQUESTS },
    { id: "WEBSITE_CLICKS", label: "Website clicks", value: totals.WEBSITE_CLICKS }
  ];

  return (
    <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {onBack && (
            <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 12px' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real-time performance metrics from Google</p>
          </div>
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#fcfcfc' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 className="anim-spin" style={{ width: 32, height: 32, color: 'var(--accent)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16 }}>Fetching data from Google...</p>
          </div>
        ) : (error || perfData?.error) ? (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: 20, borderRadius: 12, color: '#c53030', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle className="w-5 h-5" />
            <p style={{ fontSize: 14, fontWeight: 500 }}>{error?.message || perfData?.error || "Failed to load insights"}</p>
          </div>
        ) : (
          <div className="anim-fade-up">
            {/* Premium Track UI for Tabs */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px', background: '#f1f5f9', borderRadius: 24, marginBottom: 32, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', scrollbarWidth: 'none' }}>
              {TABS.map(tab => {
                const isActive = activeMetric === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMetric(tab.id)}
                    style={{
                      flexShrink: 0,
                      minWidth: 150,
                      padding: '16px 20px',
                      borderRadius: 16,
                      background: isActive ? '#fff' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />}
                    <p style={{ fontSize: 12, fontWeight: isActive ? 800 : 700, color: isActive ? '#2563eb' : '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tab.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: isActive ? '#0f172a' : '#475569', letterSpacing: '-0.02em' }}>{tab.value?.toLocaleString() || "0"}</p>
                  </button>
                )
              })}
            </div>

            {/* Main Chart */}
            <div style={{ height: 380, width: "100%", marginBottom: 30, background: "#fff", padding: 24, borderRadius: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  {TABS.find(t => t.id === activeMetric)?.label} Trend {months === 1 ? "(Weekly)" : "(Monthly)"}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} 
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)", fontWeight: 700, padding: '12px 16px' }}
                    labelStyle={{ color: "#64748b", marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                    activeDot={{ r: 8, strokeWidth: 0, fill: "#2563eb", stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Breakdown for Views/Searches */}
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
        
        {/* Keywords Section */}
        <div className="anim-fade-up" style={{ marginTop: 40, animationDelay: '0.2s' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Top Search Queries</h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Keywords people used to find your business on Google over the last {months === 1 ? 'month' : months + ' months'}.</p>
          
          <KeywordsTable profileId={profile.id} months={months} />
        </div>

      </div>
    </div>
  );
}

function KeywordsTable({ profileId, months }: { profileId: string, months: number }) {
  const { data: keywordsData, isLoading } = useSWR(`/api/profiles/${profileId}/keywords?months=${months}`, fetcher);
  
  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0' }}>
        <Loader2 className="anim-spin mx-auto text-indigo-600 mb-2" style={{ width: 24, height: 24 }} />
        <p style={{ fontSize: 13, color: '#64748b' }}>Analyzing search queries...</p>
      </div>
    );
  }

  const keywords = keywordsData?.data || [];

  if (keywords.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No search query data available</p>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Google hasn't reported any search queries for this period.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Query</th>
            <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impressions</th>
          </tr>
        </thead>
        <tbody>
          {keywords.slice(0, 15).map((kw: any, idx: number) => (
            <tr key={idx} style={{ borderBottom: idx === keywords.slice(0, 15).length - 1 ? 'none' : '1px solid #f1f5f9' }}>
              <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#334155' }}>{kw.keyword}</td>
              <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{kw.count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

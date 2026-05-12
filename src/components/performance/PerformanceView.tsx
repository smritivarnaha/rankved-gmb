"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Loader2, AlertCircle, ArrowLeft, Eye, Search, ArrowUpRight, MousePointerClick, PhoneCall, Navigation, BarChart3, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek } from "date-fns";
import { AuditReport } from "./AuditReport";

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

  const TABS = [
    { id: "OVERVIEW", label: "Interactions", icon: MousePointerClick, color: "#4f46e5" },
    { id: "VIEWS", label: "Views", icon: Eye, color: "#06b6d4" },
    { id: "CALLS", label: "Calls", icon: PhoneCall, color: "#10b981" },
    { id: "DIRECTIONS", label: "Directions", icon: Navigation, color: "#f59e0b" },
    { id: "WEBSITE_CLICKS", label: "Web Clicks", icon: ArrowUpRight, color: "#ec4899" },
    { id: "AUDIT", label: "Audit", icon: BarChart3, color: "#6366f1" }
  ];

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
        const datedValues = series.timeSeries?.datedValues || [];
        datedValues.forEach((point: any) => {
          const pointDate = new Date(point.date.year, point.date.month - 1, point.date.day);
          let bucketKey = months === 1 ? format(startOfWeek(pointDate), "yyyy-MM-dd") : format(pointDate, "yyyy-MM");
          const val = parseInt(point.value) || 0;
          if (!dateMap.has(bucketKey)) dateMap.set(bucketKey, { bucketKey, sortDate: pointDate, VIEWS: 0, INTERACTIONS: 0, OVERVIEW: 0, CALLS: 0, DIRECTIONS: 0, WEBSITE_CLICKS: 0 });
          const row = dateMap.get(bucketKey);
          if (metricName.includes("IMPRESSIONS")) { row.VIEWS += val; calcTotals.VIEWS += val; }
          else { row.INTERACTIONS += val; row.OVERVIEW += val; calcTotals.INTERACTIONS += val; }
          if (metricName === "CALL_CLICKS") { row.CALLS += val; calcTotals.CALL_CLICKS += val; }
          if (metricName === "BUSINESS_DIRECTION_REQUESTS") { row.DIRECTIONS += val; calcTotals.BUSINESS_DIRECTION_REQUESTS += val; }
          if (metricName === "WEBSITE_CLICKS") { row.WEBSITE_CLICKS += val; calcTotals.WEBSITE_CLICKS += val; }
        });
      });
    });

    return { chartData: Array.from(dateMap.values()).sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime()), totals: calcTotals };
  }, [perfData, months]);

  const activeColor = TABS.find(t => t.id === activeMetric)?.color || "#4f46e5";

  return (
    <div className="min-h-screen bg-[#fcfdfe] p-8 pb-32">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {onBack && (
            <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Live Sync</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Real-time Performance Analytics
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
          {[1, 3, 6].map(m => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${months === m ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Metric Hyper-Cards Grid */}
        <div className="grid grid-cols-6 gap-4 mb-12 overflow-x-auto pb-6 scrollbar-hide">
          {TABS.map(tab => {
            const isActive = activeMetric === tab.id;
            const Icon = tab.icon;
            const value = tab.id === "AUDIT" ? "N/A" : (totals as any)[tab.id === "OVERVIEW" ? "INTERACTIONS" : tab.id]?.toLocaleString() || 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMetric(tab.id)}
                className={`relative group p-6 rounded-[32px] text-left transition-all duration-500 border-2 ${isActive ? "bg-white border-transparent shadow-2xl shadow-indigo-100 -translate-y-2" : "bg-transparent border-slate-100 hover:border-indigo-200 hover:bg-white/50"}`}
              >
                {isActive && <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />}
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 rotate-3" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md"}`}>
                   <Icon className="w-5 h-5" />
                </div>
                
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors duration-500 ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                  {tab.label}
                </p>
                <h4 className={`text-2xl font-black tracking-tighter transition-colors duration-500 ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                  {value}
                </h4>

                {isActive && (
                  <div className="absolute bottom-4 right-4 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[48px] p-12 border-2 border-slate-50 shadow-2xl shadow-slate-100/50 min-h-[600px] relative overflow-hidden">
          {/* Glass background decoration */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] opacity-50" />
          
          <div className="relative z-10">
            {activeMetric === "AUDIT" ? (
              <AuditReport profileId={profile.id} />
            ) : (
              <div className="anim-fade-up">
                <div className="flex items-center justify-between mb-12">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Growth Analytics</h2>
                      <p className="text-slate-500 font-medium">Viewing {TABS.find(t => t.id === activeMetric)?.label} trends for the last {months} months.</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total {TABS.find(t => t.id === activeMetric)?.label}</p>
                         <p className="text-2xl font-black text-slate-900">{(totals as any)[activeMetric === "OVERVIEW" ? "INTERACTIONS" : activeMetric]?.toLocaleString() || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                         <TrendingUp className="w-6 h-6" />
                      </div>
                   </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="bucketKey" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 800 }} 
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 800 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: 20, border: "none", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", padding: 20 }}
                        itemStyle={{ fontWeight: 900, color: "#0f172a" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={activeMetric} 
                        stroke={activeColor} 
                        strokeWidth={6}
                        fillOpacity={1} 
                        fill="url(#colorMetric)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Search Queries Sub-Section */}
                <div className="mt-20">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Search className="w-5 h-5" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Top Search Queries</h3>
                  </div>
                  {/* Reuse keywords table if available or create a placeholder */}
                  <div className="bg-slate-50 border-2 border-slate-100 rounded-[32px] p-10 text-center">
                     <p className="text-slate-400 font-bold">Search query data is processing...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .anim-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

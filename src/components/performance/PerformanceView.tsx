"use client";

import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  TrendingUp, MousePointer2, Eye, Phone, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  Calendar, Zap, Sparkles, LayoutDashboard, Loader2, ArrowLeft
} from "lucide-react";
import { AuditReport } from "./AuditReport";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PerformanceView({ profile, onBack }: any) {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const { data: perfData, isLoading } = useSWR(profile ? `/api/profiles/${profile.id}/performance?months=1` : null, fetcher);

  if (!profile) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-xs font-bold text-neutral-400 tracking-widest uppercase">Analyzing Profile Metrics...</p>
      </div>
    );
  }

  const dataRaw = perfData?.data || [];
  
  // Process the raw Google data into our display format
  let interactions = 0;
  let views = 0;
  let calls = 0;
  let messages = 0;
  const dailyTrends: any[] = [];

  if (Array.isArray(dataRaw)) {
    dataRaw.forEach((multiSeriesItem: any) => {
      const seriesArray = multiSeriesItem.dailyMetricTimeSeries || [];
      seriesArray.forEach((series: any) => {
        const metricName = series.dailyMetric || "";
        const points = series.timeSeries?.datedValues || [];
        
        const sum = points.reduce((acc: number, point: any) => acc + (parseInt(point.value) || 0), 0);
        
        if (metricName.includes("IMPRESSIONS")) views += sum;
        else if (metricName.includes("CALLS")) calls += sum;
        else if (metricName.includes("MESSAGES")) messages += sum;
        else interactions += sum;

        // Build trends for the first series found (usually Impressions or Interactions)
        if (dailyTrends.length === 0 && points.length > 0) {
           points.forEach((p: any) => {
              dailyTrends.push({
                 date: `${p.date.month}/${p.date.day}`,
                 value: parseInt(p.value) || 0
              });
           });
        }
      });
    });
  }

  const data = { interactions, views, calls, messages, dailyTrends };

  return (
    <div className="anim-fade-up">
      {/* Premium Navigation Header */}
      <div className="flex items-center gap-6 mb-12">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl p-2 rounded-[24px] border border-neutral-100 w-max shadow-xl shadow-neutral-100/50">
          <button 
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[18px] text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "OVERVIEW" 
              ? "bg-neutral-900 text-white shadow-2xl shadow-neutral-300" 
              : "text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Performance Hub
          </button>
          <button 
            onClick={() => setActiveTab("AUDIT")}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[18px] text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "AUDIT" 
              ? "bg-neutral-900 text-white shadow-2xl shadow-neutral-300" 
              : "text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Zap className="w-4 h-4" />
            Business Audit
          </button>
        </div>
      </div>

      {activeTab === "OVERVIEW" ? (
        <div className="space-y-12">
          {/* Hyper-Card Stat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <HyperCard 
              label="Interactions"
              value={data.interactions || 0}
              change="+12.4%"
              isPositive={true}
              icon={MousePointer2}
              color="indigo"
            />
            <HyperCard 
              label="Search Views"
              value={data.views || 0}
              change="+8.2%"
              isPositive={true}
              icon={Eye}
              color="cyan"
            />
            <HyperCard 
              label="Total Calls"
              value={data.calls || 0}
              change="-2.1%"
              isPositive={false}
              icon={Phone}
              color="amber"
            />
            <HyperCard 
              label="AI Response"
              value={data.messages || 0}
              change="+15.0%"
              isPositive={true}
              icon={Zap}
              color="emerald"
            />
          </div>

          {/* Main Visualization Card */}
          <div className="bg-white rounded-[48px] border border-neutral-100 p-12 shadow-2xl shadow-neutral-100/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
               <TrendingUp className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
              <div>
                <h3 className="text-3xl font-black text-neutral-900 tracking-tighter mb-2">Growth Analytics</h3>
                <p className="text-neutral-400 font-medium text-lg">Daily business interaction trends for {profile.name}.</p>
              </div>
              <div className="flex items-center gap-4 bg-neutral-50 p-2 rounded-[20px] border border-neutral-100">
                <button className="px-6 py-2.5 bg-white text-neutral-900 shadow-sm rounded-[14px] text-xs font-bold uppercase tracking-widest">30 Days</button>
                <button className="px-6 py-2.5 text-neutral-400 hover:text-neutral-900 rounded-[14px] text-xs font-bold uppercase tracking-widest">90 Days</button>
              </div>
            </div>

            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrends || []}>
                  <defs>
                    <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                      padding: '20px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563EB" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorBrand)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="ds-anim-fade">
           <AuditReport profileId={profile.id} />
        </div>
      )}
    </div>
  );
}

function HyperCard({ label, value, change, isPositive, icon: Icon, color }: any) {
  const themes: any = {
    indigo: "from-blue-600 to-indigo-700 bg-brand",
    cyan: "from-cyan-500 to-blue-600 bg-cyan-600",
    amber: "from-amber-400 to-orange-600 bg-amber-600",
    emerald: "from-emerald-400 to-teal-600 bg-emerald-600",
  };

  return (
    <div className="bg-white rounded-[40px] p-8 border border-neutral-100 shadow-xl shadow-neutral-100/50 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br ${themes[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {change}
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">{label}</p>
        <h4 className="text-5xl font-black text-neutral-900 tracking-tighter leading-none mb-2">{value}</h4>
        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Total interactions</p>
      </div>

      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[80px] opacity-10 bg-gradient-to-br ${themes[color]}`}></div>
    </div>
  );
}

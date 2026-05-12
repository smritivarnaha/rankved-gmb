"use client";

import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  TrendingUp, MousePointer2, Eye, Phone, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  Calendar, Zap, ShieldCheck
} from "lucide-react";
import { AuditReport } from "./AuditReport";

export default function PerformanceView({ data, profile }: any) {
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  if (!data) return null;

  return (
    <div className="anim-fade-up">
      {/* Tab Navigation — RankVed Premium Pill Style */}
      <div className="flex items-center gap-2 mb-8 bg-neutral-100 p-1.5 rounded-full w-max">
        <button 
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === "OVERVIEW" 
            ? "bg-white text-brand shadow-sm" 
            : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Performance Overview
        </button>
        <button 
          onClick={() => setActiveTab("AUDIT")}
          className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === "AUDIT" 
            ? "bg-white text-brand shadow-sm" 
            : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Business Audit
        </button>
      </div>

      {activeTab === "OVERVIEW" ? (
        <div className="space-y-8">
          {/* Main Stat Grid */}
          <div className="grid grid-cols-4 gap-6">
            <PerformanceCard 
              label="INTERACTIONS"
              value={data.interactions || 0}
              change="+12.4%"
              isPositive={true}
              icon={MousePointer2}
            />
            <PerformanceCard 
              label="VIEWS"
              value={data.views || 0}
              change="+8.2%"
              isPositive={true}
              icon={Eye}
            />
            <PerformanceCard 
              label="CALLS"
              value={data.calls || 0}
              change="-2.1%"
              isPositive={false}
              icon={Phone}
            />
            <PerformanceCard 
              label="MESSAGES"
              value={data.messages || 0}
              change="+15.0%"
              isPositive={true}
              icon={Zap}
            />
          </div>

          {/* Large Trend Chart */}
          <div className="ds-card">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="heading-card">Interaction Trends</h3>
                <p className="text-meta">Daily performance over the last 30 days</p>
              </div>
              <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-600">Last 30 Days</span>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrends || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-200)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--neutral-500)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--neutral-500)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '10px', 
                      border: '1px solid var(--border-default)',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '12px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--brand)" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Insights Row */}
          <div className="grid grid-cols-2 gap-6">
             <div className="ds-card">
                <h3 className="heading-card mb-6">Top Search Queries</h3>
                <div className="space-y-4">
                   {[
                     { q: "beauty parlor near me", v: 450, t: "+5%" },
                     { q: "salon in surat", v: 320, t: "+12%" },
                     { q: "hair cutting price", v: 210, t: "-2%" },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-xl transition-all">
                        <span className="text-sm font-medium text-neutral-800">{item.q}</span>
                        <div className="flex items-center gap-4">
                           <span className="text-sm font-bold num">{item.v}</span>
                           <span className={`text-[10px] font-bold ${item.t.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                              {item.t}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="ds-card flex flex-col justify-between">
                <div>
                   <h3 className="heading-card mb-2">Audit Score</h3>
                   <p className="text-meta">Based on profile completion and SEO</p>
                </div>
                <div className="py-8 flex items-center justify-center">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="var(--neutral-100)" strokeWidth="8" fill="transparent" />
                        <circle cx="64" cy="64" r="58" stroke="var(--brand)" strokeWidth="8" fill="transparent" 
                          strokeDasharray={364} strokeDashoffset={364 - (364 * 0.84)} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-2xl font-bold num">84%</span>
                   </div>
                </div>
                <button 
                  onClick={() => setActiveTab("AUDIT")}
                  className="ds-btn ds-btn-secondary w-full"
                >
                  View Full Audit Report <ChevronRight className="w-4 h-4" />
                </button>
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

function PerformanceCard({ label, value, change, isPositive, icon: Icon }: any) {
  return (
    <div className="ds-card ds-card-hover group">
      <div className="flex items-start justify-between mb-6">
        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-brand-subtle group-hover:text-brand transition-all">
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className="label-stat mb-1">{label}</p>
      <h4 className="value-stat">{value}</h4>
    </div>
  );
}

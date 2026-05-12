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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '160px 0' }}>
        <Loader2 className="anim-spin" style={{ width: '40px', height: '40px', color: '#2563EB', marginBottom: '16px' }} />
        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Analyzing Profile Metrics...</p>
      </div>
    );
  }

  const dataRaw = perfData?.data || [];
  let interactions = 0, views = 0, calls = 0, messages = 0;
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

        if (dailyTrends.length === 0 && points.length > 0) {
           points.forEach((p: any) => {
              dailyTrends.push({ date: `${p.date.month}/${p.date.day}`, value: parseInt(p.value) || 0 });
           });
        }
      });
    });
  }

  const data = { interactions, views, calls, messages, dailyTrends };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Premium Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
        {onBack && (
          <button 
            onClick={onBack}
            style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', padding: '8px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => setActiveTab("OVERVIEW")}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 32px', borderRadius: '18px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === "OVERVIEW" ? '#111827' : 'transparent',
              color: activeTab === "OVERVIEW" ? '#fff' : '#94A3B8',
              border: 'none'
            }}
          >
            <LayoutDashboard size={16} />
            Performance Hub
          </button>
          <button 
            onClick={() => setActiveTab("AUDIT")}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 32px', borderRadius: '18px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === "AUDIT" ? '#111827' : 'transparent',
              color: activeTab === "AUDIT" ? '#fff' : '#94A3B8',
              border: 'none'
            }}
          >
            <Zap size={16} />
            Business Audit
          </button>
        </div>
      </div>

      {activeTab === "OVERVIEW" ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* Hyper-Card Stat Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
            <HyperCard label="Interactions" value={data.interactions} change="+12.4%" isPositive={true} icon={MousePointer2} color="#4F46E5" />
            <HyperCard label="Search Views" value={data.views} change="+8.2%" isPositive={true} icon={Eye} color="#06B6D4" />
            <HyperCard label="Total Calls" value={data.calls} change="-2.1%" isPositive={false} icon={Phone} color="#F59E0B" />
            <HyperCard label="AI Response" value={data.messages} change="+15.0%" isPositive={true} icon={Zap} color="#10B981" />
          </div>

          {/* Main Visualization Card */}
          <div style={{ background: '#fff', borderRadius: '48px', border: '1px solid #F1F5F9', padding: '48px', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '48px', opacity: 0.03 }}>
               <TrendingUp size={200} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
              <div>
                <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-0.04em', marginBottom: '8px' }}>Growth Analytics</h3>
                <p style={{ color: '#94A3B8', fontWeight: '500', fontSize: '16px' }}>Daily interaction trends for {profile.name}.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', padding: '8px', borderRadius: '20px', width: 'max-content' }}>
                <button style={{ padding: '10px 24px', background: '#fff', color: '#111827', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>30 Days</button>
                <button style={{ padding: '10px 24px', background: 'transparent', color: '#94A3B8', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>90 Days</button>
              </div>
            </div>

            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrends || []}>
                  <defs>
                    <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '20px' }} />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorBrand)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <AuditReport profileId={profile.id} />
      )}
    </div>
  );
}

function HyperCard({ label, value, change, isPositive, icon: Icon, color }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: '32px', padding: '32px', border: '1px solid #F1F5F9', boxShadow: '0 15px 35px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 10px 20px ${color}33` }}>
          <Icon size={24} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', background: isPositive ? '#F0FDF4' : '#FEF2F2', color: isPositive ? '#16A34A' : '#DC2626' }}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</p>
        <h4 style={{ fontSize: '40px', fontWeight: '900', color: '#111827', letterSpacing: '-0.04em', marginBottom: '4px', lineHeight: '1' }}>{value.toLocaleString()}</h4>
        <p style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>30 Day Total</p>
      </div>

      <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: color, opacity: 0.05, filter: 'blur(40px)' }}></div>
    </div>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, MapPin, BarChart3, TrendingUp } from "lucide-react";
import { PerformanceView } from "@/components/performance/PerformanceView";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ProfileStatCard({ profile, onClick }: { profile: any, onClick: () => void }) {
  const { data: perfData, isLoading } = useSWR(`/api/profiles/${profile.id}/performance?months=1`, fetcher);

  let views = 0;
  let interactions = 0;

  if (perfData?.data && Array.isArray(perfData.data)) {
    perfData.data.forEach((multiSeriesItem: any) => {
      const seriesArray = multiSeriesItem.dailyMetricTimeSeries || [];
      seriesArray.forEach((series: any) => {
        const metricName = series.dailyMetric;
        if (!metricName) return;
        
        const sum = (series.timeSeries?.datedValues || []).reduce((acc: number, point: any) => acc + (parseInt(point.value) || 0), 0);
        
        if (metricName.includes("IMPRESSIONS")) {
          views += sum;
        } else {
          interactions += sum;
        }
      });
    });
  }

  // Clean up the Google location ID string (remove "accounts/xxx/locations/")
  const locationId = profile.googleName?.split('/').pop() || "Pending";

  return (
    <button 
      onClick={onClick}
      className="relative p-6 rounded-[32px] text-left group overflow-hidden bg-white"
      style={{
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(37, 99, 235, 0.15)";
        e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.8)";
      }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 transition-all group-hover:bg-indigo-100" />
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-white/80 backdrop-blur rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-emerald-100 shadow-sm">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Active
        </div>
      </div>
      
      <div className="relative z-10 mb-8">
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 line-clamp-1">{profile.name}</h3>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">ID: {locationId}</span>
        </div>
      </div>
      
      <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Views (30d)</p>
          {isLoading ? (
            <div className="h-6 w-20 bg-slate-200/50 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-slate-900 tracking-tight">{views.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Interactions</p>
          {isLoading ? (
            <div className="h-6 w-20 bg-slate-200/50 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-slate-900 tracking-tight">{interactions.toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between pt-5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Verified Profile</p>
        </div>
        <div className="bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl group-hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center gap-1.5">
          Deep Dive <span>→</span>
        </div>
      </div>
    </button>
  );
}

export default function PerformancePage() {
  const { data, isLoading } = useSWR("/api/profiles", fetcher);
  const profiles = data?.data || [];
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Initializing Smart Dashboard...</p>
      </div>
    );
  }

  // Handle single profile case: Auto-select it
  if (profiles.length === 1 && !selectedProfileId) {
    return (
      <div className="h-[calc(100vh-140px)]">
        <PerformanceView profile={profiles[0]} />
      </div>
    );
  }

  // If a profile is selected from the list
  if (selectedProfileId) {
    const profile = profiles.find((p: any) => p.id === selectedProfileId);
    if (profile) {
      return (
        <div className="h-[calc(100vh-140px)]">
          <PerformanceView 
            profile={profile} 
            onBack={() => setSelectedProfileId(null)} 
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Performance Hub</h1>
        <p className="page-subtitle">Select a profile to analyze deep-dive metrics and search keyword data.</p>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Profiles Connected</h2>
          <p className="text-sm text-slate-500 mt-2">Connect your Google account in Settings to see performance data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p: any) => (
            <ProfileStatCard 
              key={p.id} 
              profile={p} 
              onClick={() => setSelectedProfileId(p.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

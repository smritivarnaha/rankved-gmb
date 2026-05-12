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

  return (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50/50 transition-all text-left group"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          <MapPin className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>
        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-black uppercase">
          <TrendingUp className="w-3 h-3" />
          Active
        </div>
      </div>
      
      <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{profile.name}</h3>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{profile.accountName}</p>
      
      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 mb-4">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Views (30d)</p>
          {isLoading ? (
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-sm font-black text-slate-900">{views.toLocaleString()}</p>
          )}
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interactions</p>
          {isLoading ? (
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-sm font-black text-slate-900">{interactions.toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status: Verified</p>
        <p className="text-xs font-black text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Deep Dive →
        </p>
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

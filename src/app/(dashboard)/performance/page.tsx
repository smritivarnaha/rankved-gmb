"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, MapPin, BarChart3, TrendingUp } from "lucide-react";
import { PerformanceView } from "@/components/performance/PerformanceView";
import { GbpIcon } from "@/components/gbp-icon";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ProfileStatCard({ profile, onClick }: { profile: any, onClick: () => void }) {
  const { data: perfData, isLoading } = useSWR(`/api/profiles/${profile.id}/performance?months=1`, fetcher);

  let views = 0;
  let interactions = 0;

  if (perfData?.data && Array.isArray(perfData.data)) {
    perfData.data.forEach((multiSeriesItem: any) => {
      const seriesArray = multiSeriesItem.dailyMetricTimeSeries || [];
      seriesArray.forEach((series: any) => {
        const sum = (series.timeSeries?.datedValues || []).reduce((acc: number, point: any) => acc + (parseInt(point.value) || 0), 0);
        if ((series.dailyMetric || "").includes("IMPRESSIONS")) views += sum;
        else interactions += sum;
      });
    });
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0,0,0,0.07)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s"
      }}
      className="profile-card-hover"
      onClick={onClick}
    >
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 4, background: "#2563eb", flexShrink: 0 }} />

        <div style={{ flex: 1, padding: "20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10, flexShrink: 0,
              background: "#f8fafc",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #e2e8f0",
            }}>
              <GbpIcon size={32} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{profile.name}</h3>
              <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Verified Profile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#fafafa", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ padding: "12px 8px", textAlign: "center", borderRight: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 2 }}>{isLoading ? "..." : views.toLocaleString()}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Search Views</p>
        </div>
        <div style={{ padding: "12px 8px", textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 2 }}>{isLoading ? "..." : interactions.toLocaleString()}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Interactions</p>
        </div>
      </div>

      <div style={{ padding: "12px" }}>
        <button
          style={{ 
            width: "100%", height: 38, background: "#2563eb", color: "#fff", 
            borderRadius: 8, border: "none", fontWeight: 600, fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer"
          }}
        >
          <BarChart3 style={{ width: 14, height: 14 }} />
          View Performance Report
        </button>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const searchParams = useSearchParams();
  const urlProfileId = searchParams.get("profileId");
  
  const { data, isLoading } = useSWR("/api/profiles", fetcher);
  const profiles = data?.data || [];
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Sync state with URL param
  useEffect(() => {
    if (urlProfileId) {
      setSelectedProfileId(urlProfileId);
    }
  }, [urlProfileId]);

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

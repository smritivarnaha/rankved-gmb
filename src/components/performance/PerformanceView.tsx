"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, X, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  googleName: string;
}

export function PerformanceView({ profile, onBack }: { profile: Profile, onBack?: () => void }) {
  const [data, setData] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [perfRes, keyRes] = await Promise.all([
          fetch(`/api/profiles/${profile.id}/performance`),
          fetch(`/api/profiles/${profile.id}/keywords`)
        ]);
        
        const perfData = await perfRes.json();
        const keyData = await keyRes.json();
        
        if (!perfRes.ok) throw new Error(perfData.error || "Failed performance fetch");
        
        setData(perfData.data);
        setKeywords(keyData.data || []);
      } catch (e: any) {
        setError(e.message || "Failed to load insights");
      }
      setLoading(false);
    }
    loadData();
  }, [profile.id]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "calls", label: "Calls" },
    { id: "directions", label: "Directions" },
    { id: "website", label: "Website Clicks" },
    { id: "keywords", label: "Keywords" },
  ];

  return (
    <div className="anim-fade" style={{ background: 'white', borderRadius: 32, overflow: 'hidden', border: '1px solid var(--border-light)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16 }}>
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-Time Performance Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-100 bg-white px-8">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#fcfdfe' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Fetching Google Insights...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-8 rounded-[32px] text-red-600 text-sm flex items-center gap-4 border border-red-100">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold text-base">Connection Error</p>
              <p className="opacity-80">{error}</p>
            </div>
          </div>
        ) : (
          <div className="anim-fade-up">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Interactions (30d)</p>
                  <p className="text-7xl font-black text-slate-900 tracking-tighter">
                    {(Object.values(data || {}).reduce((a: any, b: any) => a + (typeof b === 'number' ? b : 0), 0) as number)}
                  </p>
                  <p className="text-sm text-slate-500 mt-4 max-w-md mx-auto">Consolidated activity from Google Search and Maps across all devices.</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Desktop Maps" value={data?.BUSINESS_IMPRESSIONS_DESKTOP_MAPS} icon="💻" />
                  <StatCard label="Mobile Maps" value={data?.BUSINESS_IMPRESSIONS_MOBILE_MAPS} icon="📱" />
                  <StatCard label="Desktop Search" value={data?.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH} icon="🔍" />
                  <StatCard label="Mobile Search" value={data?.BUSINESS_IMPRESSIONS_MOBILE_SEARCH} icon="✨" />
                </div>
              </div>
            )}

            {activeTab === "calls" && <MetricDetail label="Phone Calls" value={data?.BUSINESS_PHONE_CALLS} icon="📞" />}
            {activeTab === "directions" && <MetricDetail label="Direction Requests" value={data?.BUSINESS_DIRECTION_REQUESTS} icon="📍" />}
            {activeTab === "website" && <MetricDetail label="Website Clicks" value={data?.BUSINESS_WEBSITE_CLICKS} icon="🌐" />}

            {activeTab === "keywords" && (
              <div className="space-y-3">
                {keywords.length > 0 ? (
                  keywords.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-black text-slate-200 group-hover:text-indigo-200 transition-colors">{(i+1).toString().padStart(2, '0')}</span>
                        <span className="text-sm font-bold text-slate-700 capitalize tracking-tight">{k.keyword}</span>
                      </div>
                      <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100/50">
                        {k.count} Hits
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24">
                    <p className="text-slate-400 font-bold italic">No search keyword data found for this period.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-colors group">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black text-slate-900">{value || 0}</span>
        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
      </div>
    </div>
  );
}

function MetricDetail({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[48px] border border-slate-100 shadow-sm anim-fade-up">
      <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-4xl mb-8 border border-indigo-100">
        {icon}
      </div>
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{label}</h3>
      <p className="text-7xl font-black text-slate-900 tracking-tighter">{value || 0}</p>
      <p className="text-sm text-slate-500 mt-6 max-w-xs text-center leading-relaxed">Engagement generated from direct user actions in the last 30 days.</p>
    </div>
  );
}

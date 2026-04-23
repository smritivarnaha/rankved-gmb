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
      setError(null);
      try {
        const [perfRes, keyRes] = await Promise.all([
          fetch(`/api/profiles/${profile.id}/performance`),
          fetch(`/api/profiles/${profile.id}/keywords`)
        ]);
        
        const perfData = await perfRes.json();
        const keyData = await keyRes.json();
        
        if (!perfRes.ok) throw new Error(perfData.error || "Failed performance fetch");
        
        setData(perfData.data || {});
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

  const totalInteractions = Object.values(data || {}).reduce((a: any, b: any) => a + (typeof b === 'number' ? b : 0), 0) as number;

  return (
    <div className="anim-fade" style={{ background: 'var(--bg-main)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border-light)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
        {onBack && (
          <button onClick={onBack} className="btn-icon" style={{ padding: 8, borderRadius: '50%', background: 'var(--bg-elevated)' }}>
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{profile.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-Time Insights</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, background: 'white', padding: '0 32px', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: '16px 4px', 
              fontSize: 11, 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.2s ease',
              background: 'none',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f8fafc' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 className="anim-spin" style={{ width: 32, height: 32, color: 'var(--accent)', marginBottom: 16 }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Syncing with Google...</p>
          </div>
        ) : error ? (
          <div style={{ background: '#fff1f2', border: '1px solid #fee2e2', padding: 24, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, background: '#fecaca', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle style={{ color: '#dc2626', width: 20, height: 20 }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, color: '#991b1b', fontSize: 14 }}>Connection Failed</p>
              <p style={{ color: '#dc2626', fontSize: 12, opacity: 0.8 }}>{error}</p>
            </div>
          </div>
        ) : (
          <div className="anim-fade-up">
            {activeTab === "overview" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: 'white', padding: 40, borderRadius: 32, border: '1px solid var(--border-light)', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Total Interactions (30D)</p>
                  <p style={{ fontSize: 64, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{totalInteractions}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, maxWidth: 300, margin: '16px auto 0' }}>All impressions and clicks generated from Google Maps and Search.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                  <StatCard label="Desktop Maps" value={data?.BUSINESS_IMPRESSIONS_DESKTOP_MAPS} icon="💻" />
                  <StatCard label="Mobile Maps" value={data?.BUSINESS_IMPRESSIONS_MOBILE_MAPS} icon="📱" />
                  <StatCard label="Desktop Search" value={data?.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH} icon="🔍" />
                  <StatCard label="Mobile Search" value={data?.BUSINESS_IMPRESSIONS_MOBILE_SEARCH} icon="✨" />
                </div>
              </div>
            )}

            {activeTab === "calls" && <MetricDetail label="Phone Calls" value={data?.CALL_CLICKS} icon="📞" />}
            {activeTab === "directions" && <MetricDetail label="Direction Requests" value={data?.BUSINESS_DIRECTION_REQUESTS} icon="📍" />}
            {activeTab === "website" && <MetricDetail label="Website Clicks" value={data?.WEBSITE_CLICKS} icon="🌐" />}

            {activeTab === "keywords" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {keywords.length > 0 ? (
                  keywords.map((k, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 20, background: 'white', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#cbd5e1', width: 20 }}>{(i+1).toString().padStart(2, '0')}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{k.keyword}</span>
                      </div>
                      <div style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>
                        {k.count} Hits
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>No keyword insights for this period.</div>
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
    <div style={{ background: 'white', padding: 20, borderRadius: 24, border: '1px solid var(--border-light)' }}>
      <p style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{value || 0}</span>
        <span style={{ fontSize: 20, opacity: 0.5 }}>{icon}</span>
      </div>
    </div>
  );
}

function MetricDetail({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, background: 'white', borderRadius: 32, border: '1px solid var(--border-light)', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 24 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</h3>
      <p style={{ fontSize: 72, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value || 0}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20, maxWidth: 240 }}>Actionable customer engagement in the last 30 days.</p>
    </div>
  );
}

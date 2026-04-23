"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  googleName: string;
}

export function PerformanceView({ profile, onBack }: { profile: Profile, onBack?: () => void }) {
  const [days, setDays] = useState(30);
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
          fetch(`/api/profiles/${profile.id}/performance?days=${days}`),
          fetch(`/api/profiles/${profile.id}/keywords?days=${days}`)
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
  }, [profile.id, days]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "calls", label: "Calls" },
    { id: "directions", label: "Directions" },
    { id: "website", label: "Website Clicks" },
    { id: "keywords", label: "Keywords" },
  ];

  const totalInteractions = Object.values(data || {}).reduce((a: any, b: any) => a + (typeof b === 'number' ? b : 0), 0) as number;

  return (
    <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Period:</span>
          <select 
            value={days} 
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
            <option value={180}>Last 6 Months</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, padding: '0 32px', borderBottom: '1px solid var(--border-light)' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: '16px 0', 
              fontSize: 13, 
              fontWeight: 600,
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
              background: 'none',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#fcfcfc' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 className="anim-spin" style={{ width: 32, height: 32, color: 'var(--accent)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16 }}>Fetching data from Google...</p>
          </div>
        ) : error ? (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: 20, borderRadius: 12, color: '#c53030', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle className="w-5 h-5" />
            <p style={{ fontSize: 14, fontWeight: 500 }}>{error}</p>
          </div>
        ) : (
          <div className="anim-fade-up">
            {activeTab === "overview" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Total Interactions (30 Days)</p>
                  <p style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)' }}>{totalInteractions}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Combined impressions and clicks across Search & Maps</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                  <StatCard label="Desktop Maps" value={data?.BUSINESS_IMPRESSIONS_DESKTOP_MAPS} />
                  <StatCard label="Mobile Maps" value={data?.BUSINESS_IMPRESSIONS_MOBILE_MAPS} />
                  <StatCard label="Desktop Search" value={data?.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH} />
                  <StatCard label="Mobile Search" value={data?.BUSINESS_IMPRESSIONS_MOBILE_SEARCH} />
                </div>
              </div>
            )}

            {activeTab === "calls" && <MetricDetail label="Phone Calls" value={data?.CALL_CLICKS} />}
            {activeTab === "directions" && <MetricDetail label="Direction Requests" value={data?.BUSINESS_DIRECTION_REQUESTS} />}
            {activeTab === "website" && <MetricDetail label="Website Clicks" value={data?.WEBSITE_CLICKS} />}

            {activeTab === "keywords" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {keywords.length > 0 ? (
                  keywords.map((k, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.keyword}</span>
                      <span style={{ background: 'var(--bg-elevated)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        {k.count} Hits
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No keyword data for this period.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{value || 0}</p>
    </div>
  );
}

function MetricDetail({ label, value }: { label: string, value: number }) {
  return (
    <div className="card" style={{ padding: 60, textAlign: 'center' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 64, fontWeight: 800, color: 'var(--text-primary)' }}>{value || 0}</p>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16 }}>Insights from the last 30 days of activity</p>
    </div>
  );
}

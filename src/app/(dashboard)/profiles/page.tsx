"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Trash2, Loader2, X, AlertCircle, CheckCircle2, RefreshCw, ArrowUpRight } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  fetchedAt: string;
}

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/profiles", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const profiles = data?.data || [];
  const [deleting, setDeleting] = useState<string | null>(null);
  const [perfProfile, setPerfProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this profile? Any posts linked to it will lose their location reference.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Profile deleted." });
        mutate();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete." });
      }
    } catch { setMessage({ type: "error", text: "Network error." }); }
    setDeleting(null);
  }

  const loadProfiles = () => mutate();

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Profiles</h1>
          <p className="page-subtitle">
            Google Business Profiles synced from your Google account.
            {profiles.length > 0 && <span style={{ color: "var(--text-muted)" }}> · {profiles.length} total</span>}
          </p>
        </div>
        <button onClick={loadProfiles} className="btn btn-ghost" style={{ border: "1px solid var(--border)" }}>
          <RefreshCw style={{ width: 14, height: 14 }} />
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`badge ${message.type === "success" ? "badge-success" : "badge-error"}`} style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", marginBottom: 18, fontSize: 13, display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          {message.type === "success" ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} /> : <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: "auto" }}><X style={{ width: 14, height: 14 }} /></button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>
          <Loader2 className="anim-spin" style={{ width: 20, height: 20, color: "var(--text-muted)" }} />
        </div>
      ) : profiles.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><MapPin style={{ width: 28, height: 28 }} /></div>
            <h3 className="empty-title">No profiles synced yet</h3>
            <p className="empty-text">Go to <strong>Settings</strong> and connect your Google account, then click <strong>Fetch profiles</strong> to sync.</p>
            <Link href="/settings" className="btn btn-primary">Go to Settings</Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Account</th>
                  <th>Synced</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p: Profile) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/profiles/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <MapPin style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                        </div>
                        <span style={{ fontWeight: 500, color: "var(--accent)" }}>{p.name}</span>
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{p.phone || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{p.accountName || "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{format(new Date(p.fetchedAt), "MMM d, yyyy")}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <button onClick={() => setPerfProfile(p)} title="View Performance" style={{ padding: 6, borderRadius: "var(--radius-sm)", color: "var(--accent)", transition: "all 0.12s" }}>
                          <ArrowUpRight style={{ width: 14, height: 14 }} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} title="Delete profile" style={{ padding: 6, borderRadius: "var(--radius-sm)", color: "var(--text-muted)", transition: "all 0.12s" }}>
                          {deleting === p.id ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {perfProfile && (
        <PerformanceModal 
          profile={perfProfile} 
          onClose={() => setPerfProfile(null)} 
        />
      )}
    </div>
  );
}

function PerformanceModal({ profile, onClose }: { profile: any, onClose: () => void }) {
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
        
        setData(perfData.data);
        setKeywords(keyData.data || []);
      } catch (e) {
        setError("Failed to load insights");
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
    <div className="modal-overlay anim-fade">
      <div className="modal-content anim-scale" style={{ maxWidth: 650, height: '85vh' }}>
        <div className="modal-header" style={{ paddingBottom: 0 }}>
          <div style={{ paddingBottom: 16 }}>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-Time Google Performance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 absolute top-4 right-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 flex gap-1 border-b border-slate-100 bg-white sticky top-0 z-10">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ background: '#fcfdfe' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Fetching Data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-3xl text-red-600 text-sm flex items-center gap-4 border border-red-100">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-bold">Sync Failed</p>
                <p className="opacity-80">{error}</p>
              </div>
            </div>
          ) : (
            <div className="anim-fade-up">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Interactions</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">
                      {(Object.values(data || {}).reduce((a: any, b: any) => a + b, 0) as number)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Combined views and clicks across Maps & Search</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-2">
                  {keywords.length > 0 ? (
                    keywords.map((k, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-xs font-black text-slate-300">{(i+1).toString().padStart(2, '0')}</span>
                          <span className="text-sm font-bold text-slate-700 capitalize">{k.keyword}</span>
                        </div>
                        <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                          {k.count}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-12 text-slate-400 italic">No search keyword data available.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ border: 'none', background: 'white' }}>
          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <span className="text-xl font-black text-slate-900">{value || 0}</span>
        <span className="text-lg grayscale">{icon}</span>
      </div>
    </div>
  );
}

function MetricDetail({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-[32px] border border-slate-100 shadow-sm">
      <div className="w-20 h-20 bg-indigo-50 rounded-[24px] flex items-center justify-center text-3xl mb-6">
        {icon}
      </div>
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">{label}</h3>
      <p className="text-6xl font-black text-slate-900 tracking-tighter">{value || 0}</p>
      <p className="text-xs text-slate-500 mt-4">Direct customer interactions in the last 30 days</p>
    </div>
  );
}

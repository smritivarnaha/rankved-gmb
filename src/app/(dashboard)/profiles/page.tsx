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
  const [activeTab, setActiveTab] = useState<"overview" | "keywords">("overview");
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

  const metrics = [
    { label: "Maps Impressions (Mobile)", key: "BUSINESS_IMPRESSIONS_MOBILE_MAPS", icon: "📱" },
    { label: "Maps Impressions (Desktop)", key: "BUSINESS_IMPRESSIONS_DESKTOP_MAPS", icon: "💻" },
    { label: "Search Impressions (Mobile)", key: "BUSINESS_IMPRESSIONS_MOBILE_SEARCH", icon: "🔍" },
    { label: "Search Impressions (Desktop)", key: "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", icon: "🖥️" },
    { label: "Website Clicks", key: "BUSINESS_WEBSITE_CLICKS", highlight: true, icon: "🌐" },
    { label: "Phone Calls", key: "BUSINESS_PHONE_CALLS", highlight: true, icon: "📞" },
    { label: "Direction Requests", key: "BUSINESS_DIRECTION_REQUESTS", highlight: true, icon: "📍" },
  ];

  return (
    <div className="modal-overlay anim-fade">
      <div className="modal-content anim-scale" style={{ maxWidth: 600, height: '85vh' }}>
        <div className="modal-header" style={{ paddingBottom: 0 }}>
          <div style={{ paddingBottom: 16 }}>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Insights · Last 30 Days</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 absolute top-4 right-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 flex gap-1 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("keywords")}
            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "keywords" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Keywords
          </button>
        </div>

        <div className="modal-body" style={{ background: '#fcfdfe' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-indigo-50 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-400 mt-6 tracking-tight uppercase">Analyzing Data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-3xl text-red-600 text-sm flex items-center gap-4 border border-red-100">
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Insight Error</p>
                <p className="opacity-80">{error}</p>
              </div>
            </div>
          ) : activeTab === "overview" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Interactions</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                      {Object.values(data || {}).reduce((a: any, b: any) => a + b, 0)}
                    </p>
                 </div>
                 <div className="bg-indigo-600 p-5 rounded-3xl shadow-lg shadow-indigo-100">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Website Clicks</p>
                    <p className="text-3xl font-black text-white tracking-tighter">
                      {data?.BUSINESS_WEBSITE_CLICKS || 0}
                    </p>
                 </div>
              </div>
              
              <div className="space-y-2">
                {metrics.map(m => (
                  <div key={m.key} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{m.icon}</span>
                      <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                    </div>
                    <span className="text-base font-black text-slate-900">
                      {data?.[m.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {keywords.length > 0 ? (
                keywords.map((k, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
                        #{i+1}
                      </div>
                      <span className="text-sm font-bold text-slate-700 capitalize">{k.keyword}</span>
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                      {k.count} hits
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                   <p className="text-slate-400 font-bold italic">No specific keywords found for this period.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: 'none', background: 'white' }}>
          <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100">
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

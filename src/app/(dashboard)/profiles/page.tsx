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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/profiles/${profile.id}/performance`)
      .then(r => r.ok ? r.json() : Promise.reject("Failed to load"))
      .then(d => setData(d.data))
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [profile.id]);

  const metrics = [
    { label: "Google Maps (Desktop)", key: "BUSINESS_IMPRESSIONS_DESKTOP_MAPS" },
    { label: "Google Maps (Mobile)", key: "BUSINESS_IMPRESSIONS_MOBILE_MAPS" },
    { label: "Google Search (Desktop)", key: "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH" },
    { label: "Google Search (Mobile)", key: "BUSINESS_IMPRESSIONS_MOBILE_SEARCH" },
    { label: "Website Clicks", key: "BUSINESS_WEBSITE_CLICKS", highlight: true },
    { label: "Phone Calls", key: "BUSINESS_PHONE_CALLS", highlight: true },
    { label: "Direction Requests", key: "BUSINESS_DIRECTION_REQUESTS", highlight: true },
  ];

  return (
    <div className="modal-overlay anim-fade">
      <div className="modal-content anim-scale" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-xs text-slate-500 mt-1">Last 30 Days Performance</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p className="text-sm text-slate-500">Fetching Google Insights...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-xl text-red-600 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {metrics.map(m => (
                <div key={m.key} className={`flex items-center justify-between p-4 rounded-2xl border ${m.highlight ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`text-sm ${m.highlight ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{m.label}</span>
                  <span className={`text-lg font-bold ${m.highlight ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {data[m.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-95">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

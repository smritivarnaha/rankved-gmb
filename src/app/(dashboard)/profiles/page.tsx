"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { MapPin, Loader2, X, AlertCircle, CheckCircle2, RefreshCw, Plus, FileText, Clock, Send, Trash2, Wand2 } from "lucide-react";
import useSWR from "swr";
import { AiGenerationModal } from "@/components/ai/ai-components";

interface Profile {
  id: string;
  name: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ProfileCard({ 
  profile, onDelete, deleting, onAiCreate 
}: { 
  profile: Profile; onDelete: (id: string) => void; deleting: boolean; onAiCreate: (id: string) => void 
}) {
  const { data: postsData } = useSWR(`/api/posts?profileId=${profile.id}`, fetcher, { revalidateOnFocus: false });
  const posts: any[] = postsData?.data || [];

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthPosts = posts.filter((p: any) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const published = monthPosts.filter((p: any) => p.status === "PUBLISHED").length;
  const scheduled = posts.filter((p: any) => p.status === "SCHEDULED").length;
  const drafts = posts.filter((p: any) => p.status === "DRAFT").length;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "box-shadow 0.15s",
    }}
      className="profile-card-hover"
    >
      {/* Card Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "var(--radius-sm)",
              background: "var(--accent-light)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MapPin style={{ width: 18, height: 18, color: "var(--accent)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <Link href={`/profiles/${profile.id}`}
                style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile.name}
              </Link>
              {profile.address && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.address}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => onDelete(profile.id)} disabled={deleting} title="Delete profile"
            style={{ padding: 6, borderRadius: "var(--radius-sm)", color: "var(--text-muted)", flexShrink: 0, opacity: deleting ? 0.4 : 1 }}>
            {deleting ? <Loader2 style={{ width: 14, height: 14 }} className="anim-spin" /> : <Trash2 style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ padding: "12px 16px", textAlign: "center", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 2 }}>
            <Send style={{ width: 11, height: 11, color: "var(--success)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Published</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{published}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>this month</p>
        </div>
        <div style={{ padding: "12px 16px", textAlign: "center", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 2 }}>
            <Clock style={{ width: 11, height: 11, color: "var(--warning)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Scheduled</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{scheduled}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>upcoming</p>
        </div>
        <div style={{ padding: "12px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 2 }}>
            <FileText style={{ width: 11, height: 11, color: "var(--text-muted)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Drafts</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{drafts}</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>unsaved</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
        <Link href={`/profiles/${profile.id}`} title="View history"
          style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, padding: "6px", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", border: "1px solid var(--border-light)" }}>
          <Clock style={{ width: 14, height: 14 }} />
        </Link>
          <Link 
            href={`/profiles/${profile.id}?tab=ai`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", background: "#f8fafc", color: "#2563eb",
              border: "1px solid #dbeafe", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
              cursor: "pointer"
            }}>
            <Wand2 style={{ width: 14, height: 14 }} />
            Train AI
          </Link>
          <button 
            onClick={() => onAiCreate(profile.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", background: "#f8fafc", color: "#2563eb",
              border: "1px solid #dbeafe", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
              cursor: "pointer"
            }}>
            <Wand2 style={{ width: 14, height: 14 }} />
            AI Create
          </button>
          <Link href={`/posts/new?profile=${profile.id}&from=profile`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", background: "var(--accent)", color: "#fff",
              borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
              transition: "background 0.12s",
            }}>
            <Plus style={{ width: 14, height: 14 }} />
            Create Post
          </Link>
        </div>
      </div>
  );
}

export default function ProfilesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/profiles", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const profiles = data?.data || [];
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [aiLocationId, setAiLocationId] = useState<string | null>(null);

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

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Profiles</h1>
          <p className="page-subtitle">
            Your Google Business Profiles
            {profiles.length > 0 && <span style={{ color: "var(--text-muted)" }}> · {profiles.length} locations</span>}
          </p>
        </div>
        <button onClick={() => mutate()} className="btn btn-ghost" style={{ border: "1px solid var(--border)" }}>
          <RefreshCw style={{ width: 14, height: 14 }} />
          Refresh
        </button>
      </div>

      {/* Alert */}
      {message && (
        <div className={`badge ${message.type === "success" ? "badge-success" : "badge-error"}`}
          style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", marginBottom: 18, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {message.type === "success" ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {profiles.map((p: Profile) => (
            <ProfileCard 
              key={p.id} 
              profile={p} 
              onDelete={handleDelete} 
              deleting={deleting === p.id} 
              onAiCreate={setAiLocationId}
            />
          ))}
        </div>
      )}

      <AiGenerationModal 
        locationId={aiLocationId || ""}
        isOpen={!!aiLocationId}
        onClose={() => setAiLocationId(null)}
        onGenerated={() => {
          mutate();
          setAiLocationId(null);
        }}
      />
    </div>
  );
}

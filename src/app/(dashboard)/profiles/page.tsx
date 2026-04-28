"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { MapPin, Loader2, X, AlertCircle, CheckCircle2, RefreshCw, Plus, FileText, Clock, Send, Trash2, Wand2, Brain } from "lucide-react";
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
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8eaed",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      className="profile-card-hover"
    >
      {/* Header */}
      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "#f3f4f6", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MapPin style={{ width: 16, height: 16, color: "#6b7280" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <Link
                href={`/profiles/${profile.id}`}
                style={{ fontSize: 14, fontWeight: 600, color: "#111827", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}
              >
                {profile.name}
              </Link>
              {profile.address && (
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.address}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(profile.id)}
            disabled={deleting}
            title="Delete profile"
            style={{ padding: 4, borderRadius: 6, color: "#d1d5db", flexShrink: 0, opacity: deleting ? 0.4 : 1, background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}
          >
            {deleting ? <Loader2 style={{ width: 13, height: 13 }} className="anim-spin" /> : <Trash2 style={{ width: 13, height: 13 }} />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
        {[
          { value: published, label: "Published", sub: "this month" },
          { value: scheduled, label: "Scheduled", sub: "queued" },
          { value: drafts, label: "Drafts", sub: "unsaved" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "12px 10px", textAlign: "center", borderRight: i < 2 ? "1px solid #f3f4f6" : "none" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 3 }}>{s.value}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
            <p style={{ fontSize: 10, color: "#d1d5db", marginTop: 1 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Actions — 2×2 grid */}
      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Link
          href={`/profiles/${profile.id}`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "7px 0", fontSize: 12, fontWeight: 500, color: "#6b7280",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 7, textDecoration: "none" }}
        >
          <Clock style={{ width: 12, height: 12 }} /> History
        </Link>
        <Link
          href={`/profiles/${profile.id}?tab=ai`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "7px 0", fontSize: 12, fontWeight: 500, color: "#374151",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 7, textDecoration: "none" }}
        >
          <Brain style={{ width: 12, height: 12 }} /> Train AI
        </Link>
        <button
          onClick={() => onAiCreate(profile.id)}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "7px 0", fontSize: 12, fontWeight: 500, color: "#374151",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer" }}
        >
          <Wand2 style={{ width: 12, height: 12 }} /> AI Create
        </button>
        <Link
          href={`/posts/new?profile=${profile.id}&from=profile`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "7px 0", fontSize: 12, fontWeight: 600, color: "#fff",
            background: "#111827", borderRadius: 7, border: "none", textDecoration: "none" }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Create
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
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

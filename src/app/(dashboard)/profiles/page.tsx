"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, X, AlertCircle, CheckCircle2, RefreshCw, Plus, Clock, Trash2, Wand2, Brain, AlertTriangle } from "lucide-react";
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

// Deterministic color palette — muted, professional, distinct
const AVATAR_PALETTES = [
  { bg: "#1e3a5f", text: "#fff" }, // deep navy
  { bg: "#2d4a3e", text: "#fff" }, // forest
  { bg: "#4a1942", text: "#fff" }, // plum
  { bg: "#5c3317", text: "#fff" }, // espresso
  { bg: "#1a3d4d", text: "#fff" }, // teal-dark
  { bg: "#3d2b1f", text: "#fff" }, // dark brown
  { bg: "#2c2c54", text: "#fff" }, // indigo-dark
  { bg: "#1b4332", text: "#fff" }, // emerald-dark
  { bg: "#7c2d12", text: "#fff" }, // rust-dark
  { bg: "#374151", text: "#fff" }, // slate
  { bg: "#312e81", text: "#fff" }, // violet-dark
  { bg: "#134e4a", text: "#fff" }, // cyan-dark
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ProfileCard({ 
  profile, onDelete, deleting, onAiCreate 
}: { 
  profile: Profile; onDelete: (id: string) => void; deleting: boolean; onAiCreate: (id: string) => void 
}) {
  const { data: postsData } = useSWR(`/api/posts?profileId=${profile.id}`, fetcher, { revalidateOnFocus: false });
  const posts: any[] = postsData?.data || [];

  const now = new Date();
  const published = posts.filter((p: any) => {
    if (p.status !== "PUBLISHED" || !p.publishedAt) return false;
    const d = new Date(p.publishedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const scheduled = posts.filter((p: any) => p.status === "SCHEDULED").length;
  const drafts = posts.filter((p: any) => p.status === "DRAFT").length;

  const avatarStyle = getAvatarStyle(profile.name);
  const initials = getInitials(profile.name);

  // Extract a short category from accountName
  const category = profile.accountName
    ? profile.accountName.split(" ").slice(0, 2).join(" ")
    : null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8eaed",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
      }}
      className="profile-card-hover"
    >
      {/* Thin top accent bar derived from avatar color */}
      <div style={{ height: 3, background: avatarStyle.bg, opacity: 0.85 }} />

      {/* Header */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {/* Initials avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: avatarStyle.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: avatarStyle.text,
              letterSpacing: "0.03em",
              userSelect: "none",
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <Link
                href={`/profiles/${profile.id}`}
                style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}
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
            style={{ padding: 4, borderRadius: 6, color: "#d1d5db", flexShrink: 0, opacity: deleting ? 0.4 : 1, background: "none", border: "none", cursor: "pointer", lineHeight: 0, marginTop: 2 }}
          >
            {deleting ? <Loader2 style={{ width: 13, height: 13 }} className="anim-spin" /> : <Trash2 style={{ width: 13, height: 13 }} />}
          </button>
        </div>

        {/* Status chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 9px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Active
          </span>
          {category && (
            <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 20, padding: "2px 9px" }}>
              {category}
            </span>
          )}
          {drafts > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 9px" }}>
              <AlertTriangle style={{ width: 10, height: 10 }} />
              {drafts} draft{drafts > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
        {[
          { value: published, label: "Published" },
          { value: scheduled, label: "Scheduled" },
          { value: drafts, label: "Drafts", highlight: drafts > 0 },
        ].map((s, i) => (
          <div key={i} style={{ padding: "12px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid #f3f4f6" : "none" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.highlight ? "#d97706" : "#111827", lineHeight: 1, marginBottom: 3 }}>{s.value}</p>
            <p style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Link
          href={`/profiles/${profile.id}`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#6b7280",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, textDecoration: "none" }}
        >
          <Clock style={{ width: 12, height: 12 }} /> History
        </Link>
        <Link
          href={`/profiles/${profile.id}?tab=ai`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#374151",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, textDecoration: "none" }}
        >
          <Brain style={{ width: 12, height: 12 }} /> Train AI
        </Link>
        <button
          onClick={() => onAiCreate(profile.id)}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#374151",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
        >
          <Wand2 style={{ width: 12, height: 12 }} /> AI Create
        </button>
        <Link
          href={`/posts/new?profile=${profile.id}&from=profile`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff",
            background: avatarStyle.bg, borderRadius: 8, border: "none", textDecoration: "none" }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Create Post
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

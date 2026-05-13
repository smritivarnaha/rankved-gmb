"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertCircle, CheckCircle2, RefreshCw, Plus, Eye, Trash2, Wand2, Brain, FileDown, Upload, BarChart3, Edit2, Save, Users, FileText, CalendarDays, ArrowRight } from "lucide-react";
import useSWR from "swr";
import { AiGenerationModal } from "@/components/ai/ai-components";
import { GbpIcon } from "@/components/gbp-icon";
import { BulkImportModal } from "@/components/posts/BulkImportModal";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

interface Profile {
  id: string;
  name: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  logoUrl?: string;
  googleEmail?: string;
  fetchedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

import { Skeleton } from "@/components/ui/Skeleton";

const THEMES = [
  { border: "#3b82f6", bgLight: "#eff6ff", text: "#1e3a8a", icon: "#3b82f6" }, // Blue
  { border: "#f59e0b", bgLight: "#fffbeb", text: "#92400e", icon: "#f59e0b" }, // Yellow
  { border: "#10b981", bgLight: "#ecfdf5", text: "#065f46", icon: "#10b981" }, // Green
  { border: "#a855f7", bgLight: "#faf5ff", text: "#6b21a8", icon: "#a855f7" }, // Purple
  { border: "#f97316", bgLight: "#fff7ed", text: "#9a3412", icon: "#f97316" }, // Peach/Orange
  { border: "#14b8a6", bgLight: "#f0fdfa", text: "#115e59", icon: "#14b8a6" }, // Teal
];

function getTheme(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h) | 0;
  return THEMES[Math.abs(h) % THEMES.length];
}

function SkeletonProfileCard() {
  return (
    <div style={{ background: "#ffffff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #eaeaea", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 4, background: "#f1f5f9", flexShrink: 0 }} />
        <div style={{ flex: 1, padding: "16px 14px" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton style={{ width: 52, height: 52, borderRadius: 10 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <Skeleton style={{ width: "70%", height: 14 }} />
              <Skeleton style={{ width: "40%", height: 12 }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ margin: "0 14px", padding: "16px 0", background: "#fafafa", borderRadius: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><Skeleton style={{ width: 16, height: 16, borderRadius: "50%" }} /><Skeleton style={{ width: 30, height: 14 }} /></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><Skeleton style={{ width: 16, height: 16, borderRadius: "50%" }} /><Skeleton style={{ width: 30, height: 14 }} /></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><Skeleton style={{ width: 16, height: 16, borderRadius: "50%" }} /><Skeleton style={{ width: 30, height: 14 }} /></div>
      </div>
      <div style={{ padding: "14px" }}>
        <Skeleton style={{ width: "100%", height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function ProfileCard({
  profile, onDelete, onEdit, deleting, onAiCreate, onBulkImport, aiFeaturesEnabled
}: {
  profile: Profile;
  onDelete: (id: string) => void;
  onEdit: (p: Profile) => void;
  deleting: boolean;
  onAiCreate: (id: string) => void;
  onBulkImport: (id: string) => void;
  aiFeaturesEnabled: boolean;
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
  const drafts    = posts.filter((p: any) => p.status === "DRAFT").length;

  const theme = getTheme(profile.name);

  // Use cached stats from DB if available, else 0
  const searchViews = (profile as any).cachedSearchViews || 0;
  const interactions = (profile as any).cachedInteractions || 0;
  const engagements = (profile as any).cachedEngagements || 0;

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.15s",
        border: "1px solid rgba(0,0,0,0.07)",
      }}
      className="profile-card-hover"
    >
      {/* Left accent + header */}
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 4, background: theme.border, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: "16px 14px 14px", position: "relative" }}>
          {/* 3-dot menu */}
          <div style={{ position: "absolute", top: 12, right: 10 }}>
            <button onClick={() => onEdit(profile)} title="Options" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
              <Eye style={{ width: 14, height: 14, opacity: 0 }} /> {/* Placeholder, can implement dropdown later */}
              <div style={{ position: "absolute", top: 4, right: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ width: 3, height: 3, background: "#9ca3af", borderRadius: "50%" }} />
                <div style={{ width: 3, height: 3, background: "#9ca3af", borderRadius: "50%" }} />
                <div style={{ width: 3, height: 3, background: "#9ca3af", borderRadius: "50%" }} />
              </div>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Avatar */}
            <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: theme.bgLight, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.border}20`, overflow: "hidden" }}>
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <GbpIcon size={32} />
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1, paddingRight: 20 }}>
              <Link href={`/profiles/${profile.id}`} title={profile.name} style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3, textDecoration: "none" }}>
                {profile.name}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, background: "#f0fdf4", color: "#16a34a", padding: "2px 6px", borderRadius: 4, width: "fit-content" }}>
                <CheckCircle2 style={{ width: 10, height: 10 }} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ margin: "0 14px", padding: "16px 0", background: theme.bgLight, borderRadius: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={{ textAlign: "center", borderRight: `1px solid ${theme.border}20` }}>
          <FileText style={{ width: 14, height: 14, color: theme.icon, margin: "0 auto 6px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 2 }}>{drafts}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: "#6b7280" }}>Drafts</p>
        </div>
        <div style={{ textAlign: "center", borderRight: `1px solid ${theme.border}20` }}>
          <CalendarDays style={{ width: 14, height: 14, color: theme.icon, margin: "0 auto 6px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 2 }}>{scheduled}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: "#6b7280" }}>Scheduled</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <CheckCircle2 style={{ width: 14, height: 14, color: theme.icon, margin: "0 auto 6px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 2 }}>{published}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: "#6b7280" }}>Published</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 14px" }}>
        <Link
          href={`/profiles/${profile.id}`}
          style={{ 
            display: "flex", alignItems: "center", justifyContent: "space-between", 
            padding: "10px 14px", background: "#fff", border: `1px solid ${theme.border}30`, 
            borderRadius: 10, textDecoration: "none", transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.bgLight; e.currentTarget.style.borderColor = theme.border; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = `${theme.border}30`; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={14} color={theme.icon} />
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>View Performance Report</span>
          </div>
          <ArrowRight size={14} color={theme.icon} />
        </Link>
      </div>

      {/* Quick Actions (Floating or bottom) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 14px 14px" }}>
        <button
          onClick={() => onBulkImport(profile.id)}
          title="Bulk Import"
          style={{ flex: 1, minWidth: 70, height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
        >
          <Upload size={12} /> Bulk
        </button>
        <button
          onClick={() => onEdit(profile)}
          title="Edit Profile"
          style={{ flex: 1, minWidth: 70, height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#fff", border: "1px solid #2563eb", borderRadius: 8, color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
        >
          <Edit2 size={12} /> Edit
        </button>
        <Link
          href={`/posts/new?profile=${profile.id}&from=profile`}
          title="Create Post"
          style={{ flex: 1, minWidth: 70, height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#2563eb", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none" }}
        >
          <Plus size={12} /> Post
        </Link>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR("/api/profiles", fetcher, {
    revalidateOnFocus: false, dedupingInterval: 5000,
  });
  const { settings } = useGlobalSettings();
  const aiFeaturesEnabled = settings?.aiFeaturesEnabled ?? false;

  const profiles = data?.data || [];
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [aiLocationId, setAiLocationId]   = useState<string | null>(null);
  const [bulkLocationId, setBulkLocationId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this profile? Posts linked to it will lose their location reference.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
      if (res.ok) { setMessage({ type: "success", text: "Profile deleted." }); mutate(); }
      else { const d = await res.json(); setMessage({ type: "error", text: d.error || "Failed." }); }
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
          <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
        </button>
      </div>

      {/* Alert */}
      {message && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 18, fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: message.type === "success" ? "#15803d" : "#dc2626",
        }}>
          {message.type === "success" ? <CheckCircle2 style={{ width: 15, height: 15 }} /> : <AlertCircle style={{ width: 15, height: 15 }} />}
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => <SkeletonProfileCard key={i} />)}
        </div>
      ) : profiles.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3 className="empty-title">No profiles synced yet</h3>
            <p className="empty-text">Go to <strong>Settings</strong>, connect your Google account, then click <strong>Fetch profiles</strong>.</p>
            <Link href="/settings" className="btn btn-primary">Go to Settings</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
          {profiles.map((p: Profile) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onDelete={handleDelete}
              onEdit={(prof) => router.push(`/profiles/${prof.id}/edit`)}
              deleting={deleting === p.id}
              onAiCreate={setAiLocationId}
              onBulkImport={setBulkLocationId}
              aiFeaturesEnabled={aiFeaturesEnabled}
            />
          ))}
        </div>
      )}

      <AiGenerationModal
        locationId={aiLocationId || ""}
        isOpen={!!aiLocationId}
        onClose={() => setAiLocationId(null)}
        onGenerated={() => { mutate(); setAiLocationId(null); }}
      />

      {/* Bulk Import Modal — opens directly from profile card */}
      <BulkImportModal
        locationId={bulkLocationId || ""}
        isOpen={!!bulkLocationId}
        onClose={() => setBulkLocationId(null)}
        onSuccess={() => {
          mutate(); // only refresh draft counts — do NOT close modal so success panel shows
        }}
        viewDraftsHref={bulkLocationId ? `/profiles/${bulkLocationId}` : undefined}
      />
    </div>
  );
}

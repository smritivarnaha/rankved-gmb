"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertCircle, CheckCircle2, RefreshCw, Plus, Eye, Trash2, Wand2, Brain, FileDown, Upload, BarChart3, Edit2, Save } from "lucide-react";
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

const BRAND_BLUE = "#2563eb";
const GREY_VARIANTS = ["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#cbd5e1"];

function getGrey(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h) | 0;
  return GREY_VARIANTS[Math.abs(h) % GREY_VARIANTS.length];
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

  const sidebarGrey = getGrey(profile.name);

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
        <div style={{ width: 4, background: sidebarGrey, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: "16px 14px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: "#f8fafc",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #e2e8f0",
                }}>
                  <GbpIcon size={32} />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link
                  href={`/profiles/${profile.id}`}
                  title={profile.name}
                  style={{
                    fontSize: 13, fontWeight: 700, color: "#111827",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.3,
                    textDecoration: "none"
                  }}
                >
                  {profile.name}
                  {profile.googleEmail && <span style={{ fontSize: 10, fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>({profile.googleEmail})</span>}
                </Link>
                {profile.address && (
                  <p
                    title={profile.address}
                    style={{
                      fontSize: 11, color: "#9ca3af", marginTop: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                    }}
                  >
                    {profile.address}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => onEdit(profile)}
                title="Edit Profile"
                style={{ padding: 4, borderRadius: 6, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}
              >
                <Edit2 style={{ width: 13, height: 13 }} />
              </button>
              <button
                onClick={() => onDelete(profile.id)}
                disabled={deleting}
                title="Remove"
                style={{ padding: 4, borderRadius: 6, color: "#d1d5db", background: "none", border: "none", cursor: "pointer", lineHeight: 0, opacity: deleting ? 0.4 : 1 }}
              >
                {deleting ? <Loader2 style={{ width: 13, height: 13 }} className="anim-spin" /> : <Trash2 style={{ width: 13, height: 13 }} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#fafafa", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
        {[
          { value: published, label: "Published" },
          { value: scheduled, label: "Scheduled" },
          { value: drafts,    label: "Drafts" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "10px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid #f3f4f6" : "none" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Link
          href={`/profiles/${profile.id}`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#4b5563",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, textDecoration: "none" }}
        >
          <Eye style={{ width: 12, height: 12 }} /> View
        </Link>

        {aiFeaturesEnabled && (
          <Link
            href={`/profiles/${profile.id}?tab=ai`}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#4b5563",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, textDecoration: "none" }}
          >
            <Brain style={{ width: 12, height: 12 }} /> Train AI
          </Link>
        )}

        {aiFeaturesEnabled && (
          <button
            onClick={() => onAiCreate(profile.id)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#4b5563",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
          >
            <Wand2 style={{ width: 12, height: 12 }} /> AI Create
          </button>
        )}

        {/* Bulk Import — opens modal directly, no navigation */}
        <button
          onClick={() => onBulkImport(profile.id)}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 500, color: "#4b5563",
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
        >
          <Upload style={{ width: 12, height: 12 }} /> Bulk Import
        </button>

        <Link
          href={`/posts/new?profile=${profile.id}&from=profile`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#fff",
            background: BRAND_BLUE, borderRadius: 8, border: "none", textDecoration: "none",
            gridColumn: "span 2" }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Create Post
        </Link>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  const { data, isLoading, mutate } = useSWR("/api/profiles", fetcher, {
    revalidateOnFocus: false, dedupingInterval: 5000,
  });
  const { settings } = useGlobalSettings();
  const aiFeaturesEnabled = settings?.aiFeaturesEnabled ?? false;

  const profiles = data?.data || [];
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
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
        <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>
          <Loader2 className="anim-spin" style={{ width: 20, height: 20, color: "#9ca3af" }} />
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
              onEdit={setEditingProfile}
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

      {/* Edit Profile Modal */}
      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSuccess={() => {
            setEditingProfile(null);
            setMessage({ type: "success", text: "Profile updated successfully." });
            mutate();
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSuccess }: { profile: Profile; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) {
      onClose();
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("id", profile.id);
      formData.append("logo", logoFile);

      const res = await fetch("/api/profiles", { method: "PATCH", body: formData });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", width: 400, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSave} style={{ padding: 20 }}>
          {error && <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Profile Logo</label>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                {logoFile ? (
                  <img src={URL.createObjectURL(logoFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Current" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>No Logo</span>
                )}
              </div>
              <div>
                <label className="btn btn-primary" style={{ background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
                  <Upload size={14} style={{ marginRight: 6, display: "inline" }} /> Upload Image
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8, margin: "8px 0 0" }}>Recommended: Square PNG/JPG.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 32 }}>
            <button type="button" onClick={onClose} className="btn" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#374151" }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: 80, justifyContent: "center" }}>
              {saving ? <Loader2 size={16} className="anim-spin" /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

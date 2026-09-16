"use client";

import { useState } from "react";
import { 
  Trash2, X, AlertTriangle, ExternalLink, Loader2, CheckCircle2, 
  ShieldAlert, Database, ArrowUpRight, HelpCircle
} from "lucide-react";

interface DeleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    name: string;
    address?: string;
    googleEmail?: string;
    postCounts?: {
      published: number;
      scheduled: number;
      drafts: number;
      pending: number;
    };
  } | null;
  onSuccess: () => void;
}

export function DeleteProfileModal({ isOpen, onClose, profile, onSuccess }: DeleteProfileModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !profile) return null;

  const totalPosts = (profile.postCounts?.published || 0) + 
                     (profile.postCounts?.scheduled || 0) + 
                     (profile.postCounts?.drafts || 0) + 
                     (profile.postCounts?.pending || 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles?id=${profile.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to delete profile. Please try again.");
      }
    } catch {
      setError("Network error while deleting profile.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 540,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh"
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fef2f2"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#fee2e2", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#dc2626"
            }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#991b1b" }}>
                Remove Profile & Purge Data
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#b91c1c" }}>
                Permanently free up database storage space
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Target Profile Card */}
          <div style={{
            padding: 14,
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          }}>
            <Database size={20} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {profile.name}
              </p>
              {profile.address && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  {profile.address}
                </p>
              )}
              {profile.googleEmail && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>
                  Linked Google Account: {profile.googleEmail}
                </p>
              )}
            </div>
          </div>

          {/* Data to be Purged */}
          <div style={{ background: "#fff", border: "1px solid #fed7aa", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              ⚡ Storage Cleanup Summary:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
              <li><strong>{totalPosts} Posts</strong> (Drafts, Scheduled, Published records) will be purged.</li>
              <li><strong>Backed-up Reviews & Reply History</strong> will be wiped.</li>
              <li><strong>WhatsApp Logs & Conversation Context</strong> will be deleted.</li>
              <li><strong>Local Rank Scan Grid coordinates</strong> will be removed.</li>
            </ul>
          </div>

          {/* Section 1: Remove Managing Access from Google */}
          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={16} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>
                  Step 1: Remove Managing Access on Google
                </span>
              </div>
              <a
                href="https://business.google.com/locations"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#2563eb",
                  textDecoration: "none",
                  background: "#fff",
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #93c5fd"
                }}
              >
                Open Google Business <ExternalLink size={12} />
              </a>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#1e3a8a", lineHeight: 1.5 }}>
              To permanently remove this clinic from your Google Account management so it never syncs back:
            </p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "#334155", lineHeight: 1.6 }}>
              <li>Open <strong>business.google.com/locations</strong> in your browser.</li>
              <li>Check the box next to <strong>"{profile.name}"</strong>.</li>
              <li>Click <strong>Actions</strong> at top right &rarr; Select <strong>"Remove business"</strong> or <strong>"Stop managing"</strong>.</li>
            </ol>
          </div>

          {/* Error display */}
          {error && (
            <div style={{ padding: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#475569",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "#dc2626",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: isDeleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isDeleting ? "Purging Data..." : "Delete Profile & Wipe Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

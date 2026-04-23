"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Trash2, Loader2, X, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

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
                {profiles.map((p) => (
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
                        <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} title="Delete profile" style={{ padding: 6, borderRadius: "var(--radius-sm)", color: "var(--text-muted)", transition: "all 0.12s" }}>
                          {deleting === p.id ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
                        </button>
                        <Link href={`/profiles/${p.id}`} style={{ padding: 6, borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}>
                          <ArrowRight style={{ width: 14, height: 14 }} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

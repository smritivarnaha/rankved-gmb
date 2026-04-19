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

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      setProfiles(data.data || []);
    } catch {
      setProfiles([]);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this profile? Any posts linked to it will lose their location reference.")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Profile deleted." });
        await loadProfiles();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Profiles</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Google Business Profiles synced from your Google account.
            {profiles.length > 0 && <span className="text-[var(--text-tertiary)]"> · {profiles.length} total</span>}
          </p>
        </div>
        <button
          onClick={loadProfiles}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] text-[13px] font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-[13px] ${
            message.type === "success"
              ? "bg-[var(--success-bg)] text-[var(--success)]"
              : "bg-[var(--error-bg)] text-[var(--error)]"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
          <button className="ml-auto" onClick={() => setMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Profiles Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-lg py-20 text-center">
          <MapPin className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
          <p className="text-[14px] text-[var(--text-secondary)] mb-1">No profiles synced yet</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4 max-w-[350px] mx-auto">
            Go to <strong>Settings</strong> and connect your Google account, then click <strong>Fetch profiles</strong> to sync your Google Business Profiles.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-left text-[12px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Profile</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Address</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Phone</th>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Synced</th>
                <th className="px-5 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/profiles/${p.id}`} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-[var(--text-tertiary)]" />
                      </div>
                      <span className="font-medium text-[var(--accent)] hover:underline">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden md:table-cell max-w-[200px] truncate">
                    {p.address || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden lg:table-cell">
                    {p.phone || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{p.accountName || "—"}</td>
                  <td className="px-5 py-3.5 text-[var(--text-tertiary)] text-[12px] hidden sm:table-cell">
                    {format(new Date(p.fetchedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        disabled={deleting === p.id}
                        className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete profile"
                      >
                        {deleting === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Link href={`/profiles/${p.id}`} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

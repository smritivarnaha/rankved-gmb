"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { MapPin, Plus, ArrowRight, Trash2, Loader2, X, Building2, Phone, Globe, MapPinned, AlertCircle, CheckCircle2 } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  fetchedAt: string;
  manual?: boolean;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAccountName, setFormAccountName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWebsite, setFormWebsite] = useState("");

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

  async function handleAddProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          accountName: formAccountName,
          address: formAddress,
          phone: formPhone,
          website: formWebsite,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Profile added!" });
        setFormName("");
        setFormAccountName("");
        setFormAddress("");
        setFormPhone("");
        setFormWebsite("");
        setShowForm(false);
        await loadProfiles();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add profile." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this profile?")) return;

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
            Google Business Profiles you manage.
            {profiles.length > 0 && <span className="text-[var(--text-tertiary)]"> · {profiles.length} total</span>}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Add profile"}
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

      {/* Add Profile Form */}
      {showForm && (
        <div className="bg-white border border-[var(--accent)] border-opacity-30 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--border-light)] bg-[var(--accent-light)]">
            <h2 className="text-[14px] font-semibold text-[var(--accent)]">Add Profile Manually</h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Enter your Google Business Profile details. You can get these from your Google Business dashboard.
            </p>
          </div>
          <form onSubmit={handleAddProfile} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  Business Name <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. Sunrise Dental Clinic"
                  className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  Client / Account Name
                </label>
                <input
                  type="text"
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  placeholder="e.g. Client ABC"
                  className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
                <MapPinned className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                Address
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="e.g. 123 Main Street, Mumbai, MH 400001"
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  Phone
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  Website
                </label>
                <input
                  type="text"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  placeholder="e.g. https://example.com"
                  className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent placeholder:text-[var(--text-tertiary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formName.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Adding..." : "Add profile"}
              </button>
            </div>
          </form>
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
          <p className="text-[14px] text-[var(--text-secondary)] mb-1">No profiles yet</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mb-4 max-w-[350px] mx-auto">
            Add your Google Business Profiles manually to start managing and scheduling posts.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add your first profile
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-left text-[12px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Profile</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Address</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Phone</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Added</th>
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
                      <div>
                        <span className="font-medium text-[var(--accent)] hover:underline">{p.name}</span>
                        {p.manual && (
                          <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)]">
                            Manual
                          </span>
                        )}
                      </div>
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

      {/* Help text */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg p-4">
        <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
          <strong className="text-[var(--text-secondary)]">💡 Tip:</strong> While waiting for Google API quota approval, add your profiles manually using the "Add profile" button above.
          Once your Google Cloud API access is approved, use the "Fetch profiles" button in Settings to sync from Google automatically.
        </p>
      </div>
    </div>
  );
}

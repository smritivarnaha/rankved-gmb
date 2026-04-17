"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, MapPin, Loader2, X, Globe } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", website: "" });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const d = await res.json();
        setClients(d.data || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: "", description: "", website: "" });
        setShowModal(false);
        await load();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to add client.");
      }
    } catch { setError("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em", margin: "0 0 4px 0" }}>Clients</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Businesses you manage.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 12, border: "none",
          background: "var(--accent)", color: "#fff",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 2px 12px rgba(79,70,229,0.25)", whiteSpace: "nowrap", flexShrink: 0,
          fontFamily: "inherit",
        }}>
          <Plus size={16} /> Add client
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Add client</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                <X size={18} color="var(--text-tertiary)" />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {error && <p style={{ fontSize: 12, color: "var(--error)", background: "var(--error-bg)", padding: "8px 12px", borderRadius: 8, margin: 0 }}>{error}</p>}
              {[
                { key: "name", label: "Business name *", placeholder: "e.g. Sunrise Dental" },
                { key: "description", label: "Description", placeholder: "e.g. Full-service dental practice" },
                { key: "website", label: "Website", placeholder: "https://example.com" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.key === "website" ? "url" : "text"}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    required={f.key === "name"}
                    style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid var(--border)", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.name.trim()} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Adding…" : "Add client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={22} color="var(--text-tertiary)" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : clients.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, padding: "80px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <MapPin size={24} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px 0" }}>No clients yet</p>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 20px 0" }}>Add your first client to start managing their Google Business profiles.</p>
          <button onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={15} /> Add client
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, overflow: "hidden" }}>
          {clients.map((c, i) => (
            <Link key={c.id} href={`/clients/${c.id}`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: i < clients.length - 1 ? "1px solid var(--border-light)" : "none",
              textDecoration: "none", transition: "background 0.1s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-secondary)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
                  {c.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0" }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description || "No description"}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                {c.website && <Globe size={14} color="var(--text-tertiary)" />}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

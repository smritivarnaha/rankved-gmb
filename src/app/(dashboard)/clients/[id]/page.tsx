"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, MapPin, RefreshCw, Loader2, Plus, Phone, Globe, ExternalLink } from "lucide-react";

export default function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const d = await res.json();
        setClient(d.data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchClient(); }, [id]);

  const syncLocations = async () => {
    setSyncing(true);
    try {
      await fetch("/api/locations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      await fetchClient();
    } catch {}
    setSyncing(false);
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <Loader2 size={22} color="var(--text-tertiary)" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!client) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px 0" }}>Client not found</p>
      <Link href="/clients" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>← Back to clients</Link>
    </div>
  );

  const locations = client.locations || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Back */}
      <div>
        <Link href="/clients" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-tertiary)", textDecoration: "none", marginBottom: 16, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back to clients
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
              {client.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em", margin: "0 0 4px 0" }}>{client.name}</h1>
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                  <Globe size={12} />{client.website.replace(/^https?:\/\//, "")}<ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={syncLocations} disabled={syncing} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--text-secondary)", opacity: syncing ? 0.6 : 1 }}>
              {syncing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={14} />}
              {syncing ? "Syncing…" : "Sync locations"}
            </button>
            <Link href="/posts/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <Plus size={14} /> New post
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
        {[
          { label: "Locations", value: locations.length },
          { label: "Phone", value: client.phone || "—" },
          { label: "Added", value: new Date(client.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>{s.label}</p>
            <p style={{ fontSize: typeof s.value === "number" ? 28 : 14, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: typeof s.value === "number" ? "-0.04em" : "normal" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Locations */}
      <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Managed Locations</h2>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>{locations.length}</span>
        </div>
        {locations.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center" }}>
            <MapPin size={36} color="var(--border)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, margin: "0 0 4px 0" }}>No locations synced</p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 16px 0" }}>Sync from Google Business Profile to see locations here.</p>
            <button onClick={syncLocations} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <RefreshCw size={14} /> Sync now
            </button>
          </div>
        ) : (
          locations.map((loc: any, i: number) => (
            <div key={loc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < locations.length - 1 ? "1px solid var(--border-light)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={16} color="var(--text-tertiary)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0" }}>{loc.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.address || "No address on file"}</p>
                </div>
              </div>
              {loc.phone && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-tertiary)", flexShrink: 0, marginLeft: 12 }}>
                  <Phone size={11} />{loc.phone}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* About */}
      {client.description && (
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, padding: "20px 22px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px 0" }}>About</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{client.description}</p>
        </div>
      )}
    </div>
  );
}

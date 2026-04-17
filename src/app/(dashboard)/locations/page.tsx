"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MapPin, Search, Loader2, FileText, Building2, Phone } from "lucide-react";
import { format } from "date-fns";

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/profiles");
        if (res.ok) {
          const d = await res.json();
          setLocations(d.data || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const filtered = locations.filter(l =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.accountName?.toLowerCase().includes(search.toLowerCase()) ||
    l.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em", margin: "0 0 4px 0" }}>Locations</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            All synced Google Business Profile locations{locations.length > 0 ? ` · ${locations.length} total` : ""}
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search locations…"
            style={{ border: "1.5px solid var(--border)", background: "#fff", borderRadius: 10, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, fontSize: 13, fontFamily: "inherit", outline: "none", width: 220 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 size={22} color="var(--text-tertiary)" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, padding: "80px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <MapPin size={24} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px 0" }}>
            {locations.length === 0 ? "No locations yet" : "No results"}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
            {locations.length === 0
              ? "Add profiles from the Profiles page or sync from Settings."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 0, padding: "10px 20px", borderBottom: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}>
            {["Profile / Location", "Client / Address", "Posts"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>
          {filtered.map((loc, i) => (
            <div key={loc.id} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 0,
              padding: "14px 20px", alignItems: "center",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--border-light)" : "none",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-secondary)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={16} color="var(--accent)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.name}</p>
                  {loc.phone && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-tertiary)" }}><Phone size={10} />{loc.phone}</span>}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.accountName || "—"}</p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.address || "No address"}</p>
              </div>
              <Link href={`/posts?profileId=${loc.id}`} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 8, border: "1.5px solid var(--border)",
                fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none",
                whiteSpace: "nowrap", flexShrink: 0, marginLeft: 12,
              }}>
                <FileText size={13} /> Posts
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, MapPin, Globe, Star, ArrowLeft, Loader2,
  Copy, Check, X, ChevronRight, ExternalLink,
  Phone, MapPin as Location, AlertCircle, CheckCircle2,
  TrendingUp, MessageSquare, Clock
} from "lucide-react";

const GAPI_KEY = "AIzaSyBtbsS35qhHRLn_63YHVV66e6OK3IGUa8M";

/* ── Divider row ── */
function Row({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "13px 0", borderBottom: "1px solid var(--neutral-100)", gap: 16
    }}>
      <span style={{ fontSize: 13, color: "var(--neutral-500)", fontWeight: 500, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, color: "var(--neutral-900)", fontWeight: 600,
        textAlign: "right", fontFamily: mono ? "monospace" : "inherit"
      }}>
        {value || "—"}
      </span>
    </div>
  );
}

/* ── Section heading ── */
function SectionHead({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.08em", color: "var(--neutral-400)",
      margin: "24px 0 0", paddingBottom: 8,
      borderBottom: "1px solid var(--neutral-200)"
    }}>
      {label}
    </p>
  );
}

export function GlobalAuditSearch() {
  const [query, setQuery]               = useState("");
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [selected, setSelected]         = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* autocomplete debounce */
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setIsSearching(true); setApiError(null);
      try {
        const r = await fetch(`/api/gbp/autocomplete?input=${encodeURIComponent(query)}`);
        const d = await r.json();
        if (d.googleError) { setApiError(d.googleError); setSuggestions([]); return; }
        setSuggestions(d.suggestions || []);
        setShowDropdown((d.suggestions || []).length > 0);
      } catch { setSuggestions([]); }
      finally { setIsSearching(false); }
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = async (s: any) => {
    setShowDropdown(false);
    setQuery(s.text || s.mainText);
    setIsSearching(true);
    try {
      const r = await fetch(`/api/gbp/search?q=${encodeURIComponent(s.text || s.mainText)}`);
      const d = await r.json();
      if (d.googleError) { setApiError(d.googleError); return; }
      const place = d.places?.[0];
      if (place) setSelected(place);
    } catch {} finally { setIsSearching(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/connect`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setSelected(null); setQuery(""); setSuggestions([]); setApiError(null); };

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="page-subtitle">Search and audit any Google Business Profile instantly.</p>
        </div>
        <button
          onClick={copyLink}
          className="btn btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Client Onboarding Link"}
        </button>
      </div>

      {/* ── Search bar ── */}
      <div ref={dropRef} style={{ position: "relative", maxWidth: 480, marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: "#fff", border: "1px solid var(--neutral-200)",
          borderRadius: 10, height: 44, padding: "0 14px", gap: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          outline: showDropdown ? "2px solid var(--brand-muted)" : "none"
        }}>
          {isSearching
            ? <Loader2 size={16} className="anim-spin" style={{ color: "var(--brand)", flexShrink: 0 }} />
            : <Search size={16} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
          }
          <input
            type="text"
            placeholder="Search a business name or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 14, background: "transparent",
              color: "var(--neutral-900)", fontFamily: "inherit"
            }}
          />
          {query && (
            <button onClick={reset} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--neutral-400)", display: "flex", padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* API error */}
        {apiError && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8,
            padding: "10px 14px", background: "var(--danger-subtle)",
            border: "1px solid var(--danger-muted)", borderRadius: 8, fontSize: 12,
            color: "var(--danger-text)"
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {apiError}
          </div>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#fff", borderRadius: 10, border: "1px solid var(--neutral-200)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 200, overflow: "hidden"
          }}>
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => handleSelect(s)}
                style={{
                  width: "100%", padding: "11px 16px", border: "none",
                  background: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  borderBottom: i < suggestions.length - 1 ? "1px solid var(--neutral-100)" : "none",
                  fontFamily: "inherit"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--neutral-50)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--neutral-100)", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <MapPin size={14} style={{ color: "var(--neutral-400)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-900)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.mainText}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--neutral-400)", margin: 0 }}>{s.secondaryText}</p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--neutral-300)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content area ── */}
      <div className="ds-card" style={{ minHeight: 400, padding: 0, overflow: "hidden" }}>
        {!selected ? (
          /* Empty state */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "80px 24px", textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--brand-subtle)", display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: 20
            }}>
              <Search size={24} style={{ color: "var(--brand)" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--neutral-900)", marginBottom: 8 }}>
              Start by searching a business
            </h3>
            <p style={{ fontSize: 14, color: "var(--neutral-400)", maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
              Type at least 3 characters to find and audit any Google Business Profile instantly.
            </p>
          </div>
        ) : (
          /* ── Business result panel — Admin Settings style ── */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 360px", minHeight: 400 }}>

            {/* Left: Business details */}
            <div style={{ padding: "28px 32px" }}>
              {/* Back */}
              <button
                onClick={reset}
                style={{
                  display: "flex", alignItems: "center", gap: 6, border: "none",
                  background: "none", cursor: "pointer", color: "var(--neutral-400)",
                  fontSize: 12, fontWeight: 600, padding: 0, marginBottom: 24,
                  fontFamily: "inherit"
                }}
              >
                <ArrowLeft size={14} /> Back to search
              </button>

              {/* Business header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--neutral-900)", margin: 0, letterSpacing: "-0.01em" }}>
                  {selected.displayName?.text}
                </h2>
                {selected.websiteUri && (
                  <a href={selected.websiteUri} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", display: "flex", gap: 4, alignItems: "center", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
                    <ExternalLink size={13} /> Website
                  </a>
                )}
              </div>
              <p style={{ fontSize: 13, color: "var(--neutral-400)", margin: "0 0 4px" }}>
                {selected.primaryType?.replace(/_/g, " ")}
              </p>

              {/* Rating */}
              {selected.rating && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} style={{
                      color: i < Math.round(selected.rating) ? "#F59E0B" : "var(--neutral-200)",
                      fill: i < Math.round(selected.rating) ? "#F59E0B" : "var(--neutral-200)"
                    }} />
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)" }}>
                    {selected.rating} <span style={{ color: "var(--neutral-400)", fontWeight: 400 }}>({selected.userRatingCount?.toLocaleString()} reviews)</span>
                  </span>
                </div>
              )}

              <SectionHead label="Location Details" />
              <Row label="Address" value={selected.formattedAddress} />

              <SectionHead label="Contact & Web Presence" />
              <Row label="Website" value={selected.websiteUri?.replace(/^https?:\/\//, "").split("/")[0] || "—"} />

              <SectionHead label="Profile Intelligence" />
              <Row label="Listing Type" value={selected.primaryType?.replace(/_/g, " ") || "Business"} />
              <Row label="Total Reviews" value={selected.userRatingCount?.toLocaleString() || "0"} />
              <Row label="Average Rating" value={selected.rating ? `${selected.rating} / 5.0` : "—"} />
            </div>

            {/* Divider */}
            <div style={{ background: "var(--neutral-100)" }} />

            {/* Right: Audit score panel — Admin Settings style */}
            <div style={{ padding: "28px 28px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--neutral-400)", margin: "0 0 20px" }}>
                Instant Audit Score
              </p>

              {/* Score ring */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 20px", background: "var(--neutral-50)", borderRadius: 12, border: "1px solid var(--neutral-200)" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: selected.rating >= 4 ? "var(--success-subtle)" : "var(--warning-subtle)",
                  border: `3px solid ${selected.rating >= 4 ? "var(--success)" : "var(--warning)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: selected.rating >= 4 ? "var(--success-text)" : "var(--warning-text)" }}>
                    {selected.rating >= 4 ? "A" : selected.rating >= 3 ? "B" : "C"}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--neutral-900)", margin: "0 0 2px" }}>
                    {selected.rating >= 4 ? "Great standing" : selected.rating >= 3 ? "Room to improve" : "Needs attention"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--neutral-400)", margin: 0 }}>Based on available GBP data</p>
                </div>
              </div>

              {/* Checklist */}
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--neutral-400)", margin: "0 0 12px" }}>
                Profile Checklist
              </p>
              {[
                { label: "Business name set",    done: !!selected.displayName?.text },
                { label: "Address listed",        done: !!selected.formattedAddress  },
                { label: "Website connected",     done: !!selected.websiteUri        },
                { label: "Reviews present",       done: (selected.userRatingCount || 0) > 0 },
                { label: "4+ star rating",        done: (selected.rating || 0) >= 4  },
              ].map(({ label, done }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0", borderBottom: "1px solid var(--neutral-100)"
                }}>
                  {done
                    ? <CheckCircle2 size={15} style={{ color: "var(--success)", flexShrink: 0 }} />
                    : <AlertCircle  size={15} style={{ color: "var(--warning)", flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 13, color: done ? "var(--neutral-700)" : "var(--neutral-500)", fontWeight: done ? 500 : 400 }}>
                    {label}
                  </span>
                </div>
              ))}

              {/* Recommend onboarding */}
              <div style={{ marginTop: 24, padding: "16px", background: "var(--brand-subtle)", borderRadius: 10, border: "1px solid var(--brand-muted)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", margin: "0 0 6px" }}>Optimize this profile</p>
                <p style={{ fontSize: 12, color: "#1E40AF", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Connect this business to RankVed for automated reviews, posts, and monthly audits.
                </p>
                <button
                  onClick={() => window.open("/connect", "_blank")}
                  style={{
                    width: "100%", height: 36, background: "var(--brand)", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  Send onboarding link →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

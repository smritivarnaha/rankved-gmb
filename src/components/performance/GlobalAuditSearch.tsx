"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, MapPin, Globe, Star, ArrowLeft, Loader2,
  Copy, Check, X, ChevronRight, ExternalLink, Printer, Sparkles
} from "lucide-react";
import { AuditDashboard } from "./AuditDashboard";

export function GlobalAuditSearch() {
  const [query, setQuery]               = useState("");
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [selected, setSelected]         = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Autocomplete debounce */
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

  // ─── Calculate Public Audit Payload ───────────────────────────────────────
  const publicAudit = selected ? (() => {
    const checklist = {
      businessName: !!selected.displayName?.text,
      address: !!selected.formattedAddress,
      phone: !!selected.nationalPhoneNumber,
      website: !!selected.websiteUri,
      hours: !!selected.regularOpeningHours,
      description: !!selected.editorialSummary?.text,
      category: !!selected.primaryType,
      additionalCategories: (selected.types?.length || 0) > 1,
      specialHours: !!selected.regularOpeningHours,
      serviceArea: true,
      photos: (selected.photos?.length || 0) >= 5,
      googlePosts: (selected.reviews?.length || 0) > 0
    };

    const fieldsToTrack = Object.values(checklist);
    const filledFields = fieldsToTrack.filter(Boolean).length;
    const completionScore = Math.round((filledFields / fieldsToTrack.length) * 100);

    const reviews = selected.reviews || [];
    const repliedCount = reviews.filter((r: any) => !!r.reply).length;
    const replyRate = reviews.length > 0 ? Math.round((repliedCount / reviews.length) * 100) : 0;

    const reviewsPerWeek = selected.rating >= 4 ? 1.4 : 0.5;

    const velocityScore = Math.min(reviewsPerWeek / 2, 1) * 15;
    const photoScore = Math.min((selected.photos?.length || 0) / 10, 1) * 10;
    const postScore = reviews.length > 0 ? 10 : 0;

    const visibilityScore = Math.min(100, Math.round(
      (completionScore * 0.4) + 
      (replyRate * 0.25) + 
      velocityScore + 
      photoScore + 
      postScore
    ));

    return {
      completionScore,
      checklist,
      replyRate,
      reviewsPerWeek,
      visibilityScore,
      totalReviews: selected.userRatingCount || 0,
      averageRating: selected.rating || 0
    };
  })() : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", fontFamily: "Inter,-apple-system,sans-serif" }}>
      <style>{`
        .gaud-input:focus { outline: none; }
        .gaud-input::placeholder { color: #94a3b8; }
        .gaud-sug-btn:hover { background: #f8fafc !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .anim-spin { animation: spin 1s linear infinite; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* Page header */}
      <div className="no-print page-header" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 className="page-title">Command Center</h1>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lead Gen</span>
          </div>
          <p className="page-subtitle">Search, audit, and export any business profile instantly</p>
        </div>
        <button onClick={copyLink} className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {copied ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Onboarding Link"}
        </button>
      </div>

      {/* Search bar */}
      <div ref={dropRef} className="no-print" style={{ position: "relative", maxWidth: 480, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, height: 44, padding: "0 14px", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {isSearching
            ? <Loader2 size={16} className="anim-spin" style={{ color: "#6366f1", flexShrink: 0 }} />
            : <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
          }
          <input className="gaud-input" type="text" placeholder="Search a business name or address..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#0f172a", fontFamily: "inherit" }} />
          {query && (
            <button onClick={reset} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>
        {apiError && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>
            <X size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {apiError}
          </div>
        )}
        {showDropdown && suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 200, overflow: "hidden" }}>
            {suggestions.map((s, i) => (
              <button key={s.id || i} onClick={() => handleSelect(s)} className="gaud-sug-btn"
                style={{ width: "100%", padding: "11px 16px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none", fontFamily: "inherit" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={14} style={{ color: "#94a3b8" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.mainText}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{s.secondaryText}</p>
                </div>
                <ChevronRight size={14} style={{ color: "#cbd5e1", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main panel */}
      <div className="ds-card" style={{ minHeight: 400, padding: 0, overflow: "hidden" }}>
        {!selected ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <Search size={24} style={{ color: "#6366f1" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Instant Lead Generator</h3>
            <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
              Type 3+ characters to audit any Google Business Profile and generate a downloadable SEO proposal.
            </p>
          </div>
        ) : (
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Business header */}
            <div className="no-print" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, paddingBottom: 20, borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
              <div>
                <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12, fontWeight: 600, padding: 0, marginBottom: 10, fontFamily: "inherit" }}>
                  <ArrowLeft size={13} /> Back to search
                </button>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{selected.displayName?.text}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {selected.primaryType && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {selected.primaryType.replace(/_/g, " ")}
                    </span>
                  )}
                  {selected.websiteUri && (
                    <a href={selected.websiteUri} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>
                      <Globe size={12} /> Website <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Printer size={14} /> Download PDF
                </button>
                <button onClick={() => window.open("/connect", "_blank")} style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Sparkles size={14} /> Connect Profile
                </button>
              </div>
            </div>

            <AuditDashboard auditData={publicAudit} isPublic={true} publicData={selected} />

            {/* CTA banner */}
            <div className="no-print" style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", border: "1px solid #e0e7ff", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginTop: 8 }}>
              <div style={{ maxWidth: 520 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Automate optimization & reviews for this business</h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                  Onboard onto RankVed in 1-click. Unlock daily auto-posting, AI review replies, photo SEO, and real-time rank tracking.
                </p>
              </div>
              <button onClick={() => window.open("/connect", "_blank")} style={{ flexShrink: 0, height: 44, padding: "0 22px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                Launch Onboarding →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


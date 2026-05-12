"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Globe, Star, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { AuditDashboard } from "./AuditDashboard";

const GAPI_KEY = "AIzaSyBtbsS35qhHRLn_63YHVV66e6OK3IGUa8M";

export function GlobalAuditSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Autocomplete — debounced, via our API route
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setApiError(null);
      try {
        const res = await fetch(`/api/gbp/autocomplete?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.googleError) {
          setApiError(data.googleError);
          setSuggestions([]);
        } else {
          setSuggestions(data.suggestions || []);
          setShowDropdown((data.suggestions || []).length > 0);
        }
      } catch { setSuggestions([]); }
      finally { setIsSearching(false); }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // When a suggestion is selected — fetch full place details via search route
  const handleSelect = async (s: any) => {
    setShowDropdown(false);
    setQuery(s.text || s.mainText);
    setIsSearching(true);
    try {
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(s.text || s.mainText)}`);
      const data = await res.json();
      if (data.googleError) { setApiError(data.googleError); return; }
      const place = data.places?.[0];
      if (place) {
        setSelectedBusiness({
          ...place,
          mockAudit: {
            completionScore: 68, searchRank: 4.2, replyRate: 15, reviewsPerWeek: 0.5,
            totalReviews: place.userRatingCount || 0, averageRating: place.rating || 0,
            missingFields: ["Website", "Description", "Service Areas"]
          }
        });
      }
    } catch { } finally { setIsSearching(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/connect`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Page title */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="page-subtitle">Search and audit any Google Business Profile instantly.</p>
        </div>
        {/* Copy link button */}
        <button
          onClick={copyLink}
          className="btn btn-ghost"
          style={{ border: "1px solid var(--neutral-200)", gap: 8 }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Client Onboarding Link"}
        </button>
      </div>

      {/* Search bar */}
      <div ref={dropdownRef} style={{ position: "relative", maxWidth: 640, marginBottom: 32 }}>
        <div className="ds-card" style={{
          display: "flex", alignItems: "center", padding: "8px 12px", gap: 8,
          border: showDropdown ? "1px solid var(--brand)" : "1px solid var(--neutral-200)"
        }}>
          {isSearching
            ? <Loader2 size={16} style={{ color: "var(--brand)", flexShrink: 0 }} className="anim-spin" />
            : <Search size={16} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
          }
          <input
            type="text"
            placeholder="Search a business name or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 14,
              fontFamily: "inherit", background: "transparent", color: "var(--neutral-900)"
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); setSelectedBusiness(null); }}
              style={{ border: "none", background: "none", cursor: "pointer", color: "var(--neutral-400)", padding: 4 }}
            >✕</button>
          )}
        </div>

        {/* Error banner */}
        {apiError && (
          <div style={{
            marginTop: 8, padding: "10px 14px", borderRadius: 8, fontSize: 12,
            background: "var(--danger-subtle)", color: "var(--danger-text)",
            border: "1px solid var(--danger-muted)"
          }}>
            ⚠ Google API error: {apiError}
          </div>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#fff", borderRadius: 10, border: "1px solid var(--neutral-200)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden"
          }}>
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                style={{
                  width: "100%", padding: "12px 16px", border: "none",
                  background: "none", cursor: "pointer", display: "flex",
                  alignItems: "center", gap: 12, textAlign: "left",
                  borderBottom: "1px solid var(--neutral-100)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--neutral-50)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: "var(--neutral-100)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <MapPin size={15} style={{ color: "var(--neutral-400)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-900)", margin: 0 }}>{s.mainText}</p>
                  <p style={{ fontSize: 11, color: "var(--neutral-400)", margin: 0 }}>{s.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audit result */}
      {selectedBusiness && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => { setSelectedBusiness(null); setQuery(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                border: "none", background: "none", cursor: "pointer",
                fontSize: 13, color: "var(--neutral-500)", fontWeight: 500
              }}
            >
              <ArrowLeft size={14} /> Back to search
            </button>
            <span style={{ fontSize: 13, color: "var(--neutral-300)" }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)" }}>
              {selectedBusiness.displayName?.text}
            </span>
          </div>

          {/* Results card */}
          <div className="ds-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--neutral-900)", margin: 0, marginBottom: 4 }}>
                  {selectedBusiness.displayName?.text}
                </h2>
                <p style={{ fontSize: 13, color: "var(--neutral-400)", margin: 0 }}>{selectedBusiness.formattedAddress}</p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {selectedBusiness.rating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--neutral-700)" }}>
                    <Star size={13} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                    <strong>{selectedBusiness.rating}</strong>
                    <span style={{ color: "var(--neutral-400)" }}>({selectedBusiness.userRatingCount})</span>
                  </div>
                )}
                {selectedBusiness.websiteUri && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--neutral-500)" }}>
                    <Globe size={13} /> {selectedBusiness.websiteUri.replace(/^https?:\/\//, "").split("/")[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          <AuditDashboard auditData={selectedBusiness.mockAudit} isPublic />
        </div>
      )}

      {/* Empty state */}
      {!selectedBusiness && query.length < 3 && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--neutral-400)" }}>
          <Search size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Type at least 3 characters to search</p>
        </div>
      )}
    </div>
  );
}

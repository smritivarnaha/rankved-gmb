"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import {
  Search, MapPin, CheckCircle2, Sparkles, Loader2, Shield,
  ChevronRight, X, Zap, TrendingUp, Users, Star, Construction, ArrowRight
} from "lucide-react";
import Image from "next/image";

export default function ConnectPage() {
  const [query, setQuery]               = useState("");
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [selected, setSelected]         = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [devModal, setDevModal]         = useState<string | null>(null);
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

  /* autocomplete */
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const r = await fetch(`/api/gbp/autocomplete?input=${encodeURIComponent(query)}`);
        const d = await r.json();
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
      const place = d.places?.[0];
      if (place) setSelected(place);
    } catch {} finally { setIsSearching(false); }
  };

  /* ── CONFIRMATION SCREEN ── */
  if (selected) {
    return (
      <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
        {devModal && <DevModal page={devModal} onClose={() => setDevModal(null)} />}
        <NavBar onNavClick={setDevModal} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#EFF6FF", border: "2px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle2 size={36} color="#2563EB" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 10 }}>
              Perfect. Business identified.
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 36, lineHeight: 1.6 }}>
              Confirm you want to connect <strong style={{ color: "#111827" }}>{selected.displayName?.text}</strong> to RankVed GMB Manager.
            </p>

            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "24px 28px", marginBottom: 32, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Shield size={18} color="#10B981" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Secure Authorization</span>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>
                RankVed will only request permission to manage your Business Profile — post updates, respond to reviews, and track performance. We never access private email or personal data.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => { setSelected(null); setQuery(""); setSuggestions([]); }}
                style={{ height: 48, padding: "0 24px", background: "#fff", border: "1.5px solid #D1D5DB", borderRadius: 10, fontWeight: 600, fontSize: 14, color: "#374151", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
              >
                ← Change Business
              </button>
              <button
                onClick={() => signIn("google", { callbackUrl: "/success" })}
                style={{ height: 48, padding: "0 28px", background: "#2563EB", color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,99,235,0.3)", fontFamily: "Inter, sans-serif" }}
              >
                <Zap size={16} fill="currentColor" />
                Connect with Google
              </button>
            </div>
          </div>
        </div>
        <TrustFooter />
      </div>
    );
  }

  /* ── SEARCH SCREEN ── */
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      {devModal && <DevModal page={devModal} onClose={() => setDevModal(null)} />}
      <NavBar onNavClick={setDevModal} />

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 24px 40px" }}>
        <div style={{ maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: "1fr 340px", gap: 64, alignItems: "start" }}>

          {/* LEFT: Hero + Search */}
          <div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#EEF2FF", color: "#4F46E5", borderRadius: 99, fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 28, border: "1px solid #DDD6FE" }}>
              <Sparkles size={13} />
              Business onboarding
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 52, fontWeight: 900, color: "#111827", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
              Maximize your<br />
              <span style={{ color: "#2563EB" }}>Local Visibility</span>
            </h1>
            <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              Connect your Google Business Profile to our intelligence engine to start automating reviews, posts, and SEO audits.
            </p>

            {/* Search box */}
            <div ref={dropRef} style={{ position: "relative", maxWidth: 540 }}>
              <div style={{
                display: "flex", alignItems: "center", background: "#fff",
                border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "0 16px",
                height: 52, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "border-color 0.15s"
              }}>
                {isSearching
                  ? <Loader2 size={17} style={{ color: "#2563EB", marginRight: 10, flexShrink: 0 }} className="anim-spin" />
                  : <Search size={17} style={{ color: "#9CA3AF", marginRight: 10, flexShrink: 0 }} />
                }
                <input
                  type="text"
                  placeholder="Search your business name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "Inter, sans-serif", background: "transparent", color: "#111827" }}
                />
                {query && (
                  <button onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", padding: 4, display: "flex" }}>
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 12px 32px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden" }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={s.id || i}
                      onClick={() => handleSelect(s)}
                      style={{ width: "100%", padding: "14px 16px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", borderBottom: i < suggestions.length - 1 ? "1px solid #F3F4F6" : "none" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MapPin size={16} color="#9CA3AF" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.mainText}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{s.secondaryText}</p>
                      </div>
                      {i === 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>
                          ✓ Verified
                        </span>
                      )}
                      <ChevronRight size={14} color="#D1D5DB" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Can't find link */}
            <p style={{ marginTop: 16, fontSize: 13, color: "#2563EB", cursor: "pointer" }}>
              Can&apos;t find your business? Add it manually
            </p>
          </div>

          {/* RIGHT: Features + Social Proof */}
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 36 }}>
              {[
                { icon: Zap,       color: "#2563EB", bg: "#EFF6FF", title: "Automate & Grow",     desc: "Automatically manage reviews, posts, and responses." },
                { icon: TrendingUp,color: "#10B981", bg: "#ECFDF5", title: "Improve Rankings",    desc: "Get AI-powered SEO audits and actionable insights." },
                { icon: Users,     color: "#8B5CF6", bg: "#F5F3FF", title: "Stay in Control",     desc: "Monitor performance, track competitors, and grow your visibility with ease." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>{title}</p>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex" }}>
                {["#4285F4","#34A853","#FBBC05","#EA4335"].map((c, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{["A","S","M","R"][i]}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: 0 }}>Trusted by 500+</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>local agencies & businesses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TrustFooter />
    </div>
  );
}

/* ── Dev-phase modal ── */
function DevModal({ page, onClose }: { page: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "40px 48px",
          maxWidth: 460, width: "100%", textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFF7ED", border: "2px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Construction size={30} color="#F59E0B" />
        </div>
        <div style={{ display: "inline-block", padding: "4px 12px", background: "#FFF7ED", color: "#B45309", borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          In Development
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 12, letterSpacing: "-0.02em" }}>
          {page} — Coming Soon
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
          This page is currently <strong>not available for public use</strong>. We&apos;re actively building it as part of RankVed GMB Manager&apos;s public launch. Stay tuned!
        </p>
        <button
          onClick={onClose}
          style={{ height: 44, padding: "0 28px", background: "#111827", color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
        >
          Got it, go back
        </button>
      </div>
    </div>
  );
}

/* ── Shared navbar ── */
function NavBar({ onNavClick }: { onNavClick: (page: string) => void }) {
  return (
    <nav style={{ padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #F3F4F6", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Image
          src="https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
          alt="RankVed" width={32} height={32}
          style={{ borderRadius: 8 }} unoptimized
        />
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" }}>RANKVED</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {["How it works", "Features", "Pricing"].map((l) => (
          <button
            key={l}
            onClick={() => onNavClick(l)}
            style={{ fontSize: 14, color: "#6B7280", fontWeight: 500, cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "Inter, sans-serif" }}
          >
            {l}
          </button>
        ))}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{ fontSize: 14, fontWeight: 600, color: "#111827", cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "Inter, sans-serif" }}
        >
          Sign in
        </button>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{ height: 36, padding: "0 18px", background: "#2563EB", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
        >
          Get started
        </button>
      </div>
    </nav>
  );
}

/* ── Footer ── */
function TrustFooter() {
  return (
    <footer style={{ padding: "20px", textAlign: "center", borderTop: "1px solid #F3F4F6" }}>
      <p style={{ fontSize: 11, color: "#D1D5DB", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
        Trusted by 500+ Local Agencies & Businesses
      </p>
    </footer>
  );
}

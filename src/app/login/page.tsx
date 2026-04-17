"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, MapPin, BarChart3, Calendar, Zap } from "lucide-react";

const features = [
  { icon: MapPin, text: "Manage all your Google Business locations" },
  { icon: Calendar, text: "Schedule posts across multiple profiles" },
  { icon: BarChart3, text: "Track performance in one place" },
  { icon: Zap, text: "Auto-publish with smart scheduling" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (branding) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%)" }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "360px", height: "360px", borderRadius: "50%",
          background: "rgba(59,130,246,0.18)", filter: "blur(60px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "-60px",
          width: "280px", height: "280px", borderRadius: "50%",
          background: "rgba(99,102,241,0.15)", filter: "blur(50px)", pointerEvents: "none"
        }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(59,130,246,0.4)"
          }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>R</span>
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>Rankved</p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>GMB Manager</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Your Google Business<br />
            <span style={{ color: "#60a5fa" }}>Command Center</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
            Schedule posts, manage locations, and grow your local presence — all from one clean dashboard.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {features.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}>
                  <Icon size={16} color="rgba(255,255,255,0.85)" />
                </div>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, position: "relative", zIndex: 10 }}>
          © {new Date().getFullYear()} Rankved. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>R</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Rankved GMB Manager</span>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: "#64748b" }}>Sign in to manage your Google Business profiles</p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 12, padding: "11px 16px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", background: googleLoading ? "#f8fafc" : "#fff",
              cursor: googleLoading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, color: "#0f172a",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.15s", marginBottom: 24
            }}
            onMouseOver={e => { if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; }}
            onMouseOut={e => { if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
          >
            {googleLoading ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.85v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.85A8 8 0 0 0 .98 9c0 1.29.31 2.51.87 3.59l2.66-2.07z"/>
                <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9l2.87 2.07C4.14 4.98 6.23 3.58 8.98 3.58z"/>
              </svg>
            )}
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#dc2626"
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Credentials form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
                  border: "1.5px solid #e2e8f0", outline: "none", color: "#0f172a",
                  boxSizing: "border-box", transition: "border-color 0.15s"
                }}
                onFocus={e => { e.target.style.borderColor = "#3b82f6"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
                  border: "1.5px solid #e2e8f0", outline: "none", color: "#0f172a",
                  boxSizing: "border-box", transition: "border-color 0.15s"
                }}
                onFocus={e => { e.target.style.borderColor = "#3b82f6"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 10, border: "none",
                background: loading ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(59,130,246,0.35)", transition: "opacity 0.15s",
                marginTop: 4
              }}
            >
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <p style={{ fontSize: 11.5, color: "#94a3b8", textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
            By signing in, you agree to our{" "}
            <Link href="/terms-of-service" style={{ color: "#3b82f6", textDecoration: "none" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy-policy" style={{ color: "#3b82f6", textDecoration: "none" }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

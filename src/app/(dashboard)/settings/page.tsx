"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ExternalLink, RefreshCw, MapPin, AlertCircle, Shield, Clock, Send } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const userEmail = session?.user?.email || "";
  const isMainAdmin = userEmail === "rankved.business@gmail.com" || role === "SUPER_ADMIN";

  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success?: string; error?: string } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [accessRequested, setAccessRequested] = useState(false);
  const [requestSending, setRequestSending] = useState(false);

  const handleGoogleConnect = async () => { setConnecting(true); await signIn("google", { callbackUrl: "/settings" }); };
  const hasGoogleToken = !!(session as any)?.accessToken;

  useEffect(() => {
    fetch("/api/profiles").then(r => r.ok ? r.json() : { data: [] }).then(d => setProfiles(d.data || [])).catch(() => {}).finally(() => setLoadingProfiles(false));
  }, []);

  const handleFetchProfiles = async () => {
    setFetching(true); setFetchResult(null);
    try {
      const res = await fetch("/api/profiles", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setProfiles(data.data || []); setFetchResult({ success: data.message || `${(data.data || []).length} profiles fetched.` }); }
      else { setFetchResult({ error: data.error || "Failed to fetch profiles." }); }
    } catch { setFetchResult({ error: "Network error. Please try again." }); }
    setFetching(false);
  };

  const handleRequestAccess = async () => { setRequestSending(true); await new Promise(r => setTimeout(r, 1500)); setAccessRequested(true); setRequestSending(false); };

  const sectionGap = { display: "flex", flexDirection: "column" as const, gap: 20 };

  return (
    <div style={{ ...sectionGap, maxWidth: 700 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Account and integration settings.</p>
      </div>

      {/* Account */}
      <div className="card">
        <div className="card-header"><h2 className="card-title" style={{ fontSize: 14 }}>Account</h2></div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Name</span>
            <span style={{ fontWeight: 500 }}>{session?.user?.name || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Email</span>
            <span style={{ fontWeight: 500 }}>{session?.user?.email || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)" }}>Role</span>
            <span className={`badge ${isMainAdmin ? "badge-info" : "badge-default"}`}>
              {isMainAdmin ? "Super Admin" : isAdmin ? "Admin" : "Team"}
            </span>
          </div>
        </div>
      </div>

      {/* Google Integration */}
      {isAdmin && (
        <div className="card">
          <div className="card-header"><h2 className="card-title" style={{ fontSize: 14 }}>Google Business Profile</h2></div>
          <div className="card-body">
            {hasGoogleToken ? (
              <div className="badge-success" style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <CheckCircle2 style={{ width: 18, height: 18 }} />
                <div>
                  <p style={{ fontWeight: 600 }}>Connected</p>
                  <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Google account is linked and active.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Connect your Google account to manage Business Profiles and publish posts.</p>
                <button onClick={handleGoogleConnect} disabled={connecting} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                  {connecting ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : null}
                  Connect Google account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profiles */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: 14 }}>Profiles</h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {profiles.length > 0 ? `${profiles.length} profiles saved` : "No profiles fetched yet"}
              </p>
            </div>
            {isMainAdmin ? (
              <button onClick={handleFetchProfiles} disabled={fetching || !hasGoogleToken} className="btn btn-primary btn-sm">
                {fetching ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <RefreshCw style={{ width: 14, height: 14 }} />}
                {fetching ? "Fetching..." : "Fetch profiles"}
              </button>
            ) : accessRequested ? (
              <span className="badge badge-warning"><Clock style={{ width: 14, height: 14 }} /> Request pending</span>
            ) : (
              <button onClick={handleRequestAccess} disabled={requestSending} className="btn btn-sm" style={{ background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid var(--warning-border)" }}>
                {requestSending ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <Send style={{ width: 14, height: 14 }} />}
                {requestSending ? "Sending..." : "Request access"}
              </button>
            )}
          </div>
          <div className="card-body">
            {!isMainAdmin && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 12 }}>
                <Shield style={{ width: 16, height: 16, color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Admin approval required</p>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>Profile fetching requires approval from the admin (rankved.business@gmail.com).</p>
                </div>
              </div>
            )}
            {fetchResult && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, background: fetchResult.success ? "var(--success-bg)" : "var(--error-bg)", border: `1px solid ${fetchResult.success ? "var(--success-border)" : "var(--error-border)"}`, color: fetchResult.success ? "var(--success)" : "var(--error)" }}>
                {fetchResult.success ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} /> : <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
                {fetchResult.success || fetchResult.error}
              </div>
            )}
            {!hasGoogleToken && isMainAdmin && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Connect your Google account first to fetch profiles.</p>}
            {loadingProfiles ? (
              <div style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}><Loader2 className="anim-spin" style={{ width: 16, height: 16, color: "var(--text-muted)" }} /></div>
            ) : profiles.length > 0 ? (
              <div>
                {profiles.map((p) => (
                  <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPin style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.accountName}</p>
                      {p.address && <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address}</p>}
                    </div>
                    {p.phone && <p style={{ fontSize: 11, color: "var(--text-secondary)", flexShrink: 0 }}>{p.phone}</p>}
                  </div>
                ))}
              </div>
            ) : hasGoogleToken && isMainAdmin ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>Click &quot;Fetch profiles&quot; to pull your Google Business Profiles.</p>
            ) : null}
          </div>
        </div>
      )}

      {/* API Quota */}
      {isMainAdmin && (
        <div className="card">
          <div className="card-header"><h2 className="card-title" style={{ fontSize: 14 }}>API Quota</h2></div>
          <div className="card-body" style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
            <p>Google Business Profile API requires quota approval for your Cloud project.</p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfME4CQiNAKZPFsnwwlBSLIH-CHtpXBz1daKQbIpqJj63Y-UQ/viewform" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--accent)", fontWeight: 500 }}>
              <ExternalLink style={{ width: 14, height: 14 }} /> Submit GBP API access request
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

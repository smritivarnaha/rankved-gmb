"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  Loader2, CheckCircle2, RefreshCw, MapPin, 
  AlertCircle, Key, Sparkles, Wand2, FlaskConical, XCircle, ChevronDown, User, Trash2
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAgencyOwner = role === "AGENCY_OWNER";
  const canConnectGoogle = isSuperAdmin || isAgencyOwner;

  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success?: string; error?: string } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/auth/google-accounts");
      if (res.ok) {
        const d = await res.json();
        setGoogleAccounts(d.data || []);
      }
    } catch (e) {}
    setLoadingAccounts(false);
  };

  useEffect(() => {
    if (canConnectGoogle) {
      fetchAccounts();
      fetch("/api/profiles").then(r => r.ok ? r.json() : { data: [] }).then(d => setProfiles(d.data || [])).catch(() => {}).finally(() => setLoadingProfiles(false));
    }
  }, [canConnectGoogle]);

  const handleGoogleConnect = async () => { 
    setConnecting(true); 
    const userId = (session as any)?.user?.id;
    if (userId) {
      document.cookie = `linkUserId=${userId}; path=/; max-age=300; SameSite=Lax`;
    }
    // Force prompt to ensure user can select a different account
    await signIn("google", { callbackUrl: "/settings" }, { prompt: "select_account consent" }); 
  };
  
  const hasGoogleToken = googleAccounts.length > 0;

  const handleDisconnectSingle = async (id: string) => {
    if (!confirm("Disconnect this Google account? Profiles fetched from this account won't be deleted automatically until you Reset Profiles.")) return;
    try {
      const res = await fetch(`/api/auth/google-accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoogleAccounts(prev => prev.filter(a => a.id !== id));
      } else {
        const err = await res.json();
        setFetchResult({ error: err.error || "Failed to disconnect account" });
      }
    } catch (e) {
      setFetchResult({ error: "Network error." });
    }
  };

  const [resetting, setResetting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure? This will delete all saved profiles and you'll need to fetch them again.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/profiles/reset", { method: "POST" });
      if (res.ok) { setProfiles([]); setFetchResult({ success: "Profiles reset successfully." }); }
      else setFetchResult({ error: "Failed to reset profiles." });
    } catch { setFetchResult({ error: "Network error." }); }
    setResetting(false);
  };

  const handleDisconnectAll = async () => {
    if (!confirm("WIPE EVERYTHING? This will disconnect all Google accounts and log you out. Continue?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/disconnect", { method: "POST" });
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Disconnect error:", err);
      setFetchResult({ error: "Network error during disconnect." });
      setDisconnecting(false);
    }
  };

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

  const sectionGap = { display: "flex", flexDirection: "column" as const, gap: 24 };

  return (
    <div style={{ ...sectionGap, maxWidth: 900 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure RankVed's AI engines and your Google connections.</p>
      </div>

      {/* Google Integration */}
      {canConnectGoogle && (
        <div className="card shadow-sm">
          <div className="card-header"><h2 className="card-title" style={{ fontSize: 14 }}>Google Business Accounts</h2></div>
          <div className="card-body">
            {loadingAccounts ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
                <Loader2 className="anim-spin" style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
              </div>
            ) : hasGoogleToken ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {googleAccounts.map((acc, idx) => (
                    <div key={acc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User style={{ width: 16, height: 16, color: "#4f46e5" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{acc.email}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Connected Account {idx + 1}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDisconnectSingle(acc.id)} className="btn btn-sm" style={{ color: "#dc2626", background: "transparent", padding: "6px 8px" }} title="Disconnect this account">
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={handleGoogleConnect} disabled={connecting} className="btn btn-primary" style={{ fontSize: 12, padding: "8px 14px" }}>
                    {connecting ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : null}
                    Connect Another Account
                  </button>
                  <div style={{ flex: 1 }}></div>
                  <button onClick={handleReset} disabled={resetting || fetching} className="btn" style={{ fontSize: 12, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    {resetting ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <RefreshCw style={{ width: 14, height: 14 }} />}
                    Reset Profiles
                  </button>
                  <button onClick={handleDisconnectAll} disabled={disconnecting} className="btn" style={{ fontSize: 12, padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    {disconnecting ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
                    Wipe Everything
                  </button>
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

      {/* Profiles List */}
      {canConnectGoogle && (
        <div className="card shadow-sm">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: 14 }}>Profiles</h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {profiles.length > 0 ? `${profiles.length} profiles saved` : "No profiles fetched yet"}
              </p>
            </div>
            <button onClick={handleFetchProfiles} disabled={fetching || !hasGoogleToken} className="btn btn-primary btn-sm">
              {fetching ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <RefreshCw style={{ width: 14, height: 14 }} />}
              {fetching ? "Fetching..." : "Fetch profiles"}
            </button>
          </div>
          <div className="card-body">
            {fetchResult && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, background: fetchResult.success ? "var(--success-bg)" : "var(--error-bg)", border: `1px solid ${fetchResult.success ? "var(--success-border)" : "var(--error-border)"}`, color: fetchResult.success ? "var(--success)" : "var(--error)" }}>
                {fetchResult.success ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} /> : <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
                {fetchResult.success || fetchResult.error}
              </div>
            )}
            {loadingProfiles ? (
              <div style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}><Loader2 className="anim-spin" style={{ width: 16, height: 16, color: "var(--text-muted)" }} /></div>
            ) : profiles.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {profiles.map((p) => (
                  <div key={p.id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border-light)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPin style={{ width: 22, height: 22, color: "#64748b" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p title={p.name} style={{ 
                        fontSize: 13, fontWeight: 600, color: "#111827",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3
                      }}>
                        {p.name}
                        {p.googleEmail && <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>({p.googleEmail})</span>}
                      </p>
                      <p title={p.address || ""} style={{ 
                        fontSize: 11, color: "var(--text-muted)", marginTop: 4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3
                      }}>{p.address || "No address on file"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}



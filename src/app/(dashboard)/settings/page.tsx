"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, ExternalLink, RefreshCw, MapPin, AlertCircle, Shield, Clock, Send, ChevronDown, ChevronUp } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAgencyOwner = role === "AGENCY_OWNER";
  const canConnectGoogle = isSuperAdmin || isAgencyOwner;
  const isMainAdmin = canConnectGoogle; // alias to fix legacy naming
  const userEmail = session?.user?.email || "";

  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success?: string; error?: string } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [accessRequested, setAccessRequested] = useState(false);
  const [requestSending, setRequestSending] = useState(false);

  const handleGoogleConnect = async () => { setConnecting(true); await signIn("google", { callbackUrl: "/settings" }); };
  const hasGoogleToken = !!(session as any)?.accessToken;

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

  const handleDisconnect = async () => {
    if (!confirm("WIPE EVERYTHING? This will disconnect your Google account and log you out. Continue?")) return;
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
    <div style={{ ...sectionGap, maxWidth: 800 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Account and AI configuration.</p>
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
            <span className={`badge ${isSuperAdmin ? "badge-info" : isAgencyOwner ? "badge-success" : "badge-default"}`}>
              {isSuperAdmin ? "Super Admin" : isAgencyOwner ? "Agency Owner" : "Team Member"}
            </span>
          </div>
        </div>
      </div>

      {/* AI Integration */}
      {(isAgencyOwner || isSuperAdmin) && <AiSettingsCard />}

      {/* Google Integration */}
      {canConnectGoogle && (
        <div className="card">
          <div className="card-header"><h2 className="card-title" style={{ fontSize: 14 }}>Google Business Profile</h2></div>
          <div className="card-body">
            {hasGoogleToken ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="badge-success" style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <CheckCircle2 style={{ width: 18, height: 18 }} />
                  <div>
                    <p style={{ fontWeight: 600 }}>Connected</p>
                    <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Google account is linked and active.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleReset} disabled={resetting || fetching} className="btn" style={{ fontSize: 12, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                    {resetting ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <RefreshCw style={{ width: 14, height: 14 }} />}
                    Reset Profiles
                  </button>
                  <button onClick={handleDisconnect} disabled={disconnecting} className="btn" style={{ fontSize: 12, padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    {disconnecting ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
                    Disconnect Google
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
        <div className="card">
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
              <div>
                {profiles.map((p) => (
                  <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPin style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.accountName}</p>
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

function AiSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [settings, setSettings] = useState({ 
    anthropicApiKey: "", openaiApiKey: "", geminiApiKey: "",
    defaultAiContentProvider: "CLAUDE",
    defaultAiImageProvider: "DALL-E-3",
    anthropicModel: "claude-3-5-sonnet-20241022",
    openaiContentModel: "gpt-4o",
    openaiImageModel: "dall-e-3",
    geminiContentModel: "gemini-1.5-flash",
    geminiImageModel: "imagen-3.0-generate-001"
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/settings")
      .then(r => r.json())
      .then(d => setSettings({ 
        anthropicApiKey: d.anthropicApiKey || "", 
        openaiApiKey: d.openaiApiKey || "",
        geminiApiKey: d.geminiApiKey || "",
        defaultAiContentProvider: d.defaultAiContentProvider || "CLAUDE",
        defaultAiImageProvider: d.defaultAiImageProvider || "DALL-E-3",
        anthropicModel: d.anthropicModel || "claude-3-5-sonnet-20241022",
        openaiContentModel: d.openaiContentModel || "gpt-4o",
        openaiImageModel: d.openaiImageModel || "dall-e-3",
        geminiContentModel: d.geminiContentModel || "gemini-1.5-flash",
        geminiImageModel: d.geminiImageModel || "imagen-3.0-generate-001"
      }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    const res = await fetch("/api/user/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-title" style={{ fontSize: 14 }}>AI Command Center</h2>
        {success && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Settings Saved</span>}
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
          Configure your global AI preferences and API keys.
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Default Content Provider</label>
            <select 
              value={settings.defaultAiContentProvider}
              onChange={e => setSettings({ ...settings, defaultAiContentProvider: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg-elevated)" }}
            >
              <option value="CLAUDE">Anthropic Claude</option>
              <option value="GPT">OpenAI GPT</option>
              <option value="GEMINI">Google Gemini</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Default Image Provider</label>
            <select 
              value={settings.defaultAiImageProvider}
              onChange={e => setSettings({ ...settings, defaultAiImageProvider: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg-elevated)" }}
            >
              <option value="DALL-E-3">OpenAI DALL-E</option>
              <option value="GEMINI">Google Gemini</option>
            </select>
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border-light)", margin: "8px 0" }} />

        {/* API Keys */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Anthropic Key</label>
            <input type="password" value={settings.anthropicApiKey} onChange={e => setSettings({ ...settings, anthropicApiKey: e.target.value })} placeholder="sk-ant-..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg-elevated)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>OpenAI Key</label>
            <input type="password" value={settings.openaiApiKey} onChange={e => setSettings({ ...settings, openaiApiKey: e.target.value })} placeholder="sk-..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg-elevated)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Google Key</label>
            <input type="password" value={settings.geminiApiKey} onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })} placeholder="AIza..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "var(--bg-elevated)" }} />
          </div>
        </div>

        {/* Advanced Model Control */}
        <div style={{ marginTop: 8 }}>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAdvanced ? "Hide Advanced Model Control" : "Advanced Model Control (Custom Model IDs)"}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>Anthropic Model</label>
                  <input value={settings.anthropicModel} onChange={e => setSettings({ ...settings, anthropicModel: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>OpenAI Content</label>
                  <input value={settings.openaiContentModel} onChange={e => setSettings({ ...settings, openaiContentModel: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>Gemini Content</label>
                  <input value={settings.geminiContentModel} onChange={e => setSettings({ ...settings, geminiContentModel: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>Gemini Image (Imagen)</label>
                  <input value={settings.geminiImageModel} onChange={e => setSettings({ ...settings, geminiImageModel: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase" }}>OpenAI Image (DALL-E)</label>
                <input value={settings.openaiImageModel} onChange={e => setSettings({ ...settings, openaiImageModel: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="btn btn-primary" 
          style={{ alignSelf: "flex-end", padding: "10px 24px", fontSize: 13, fontWeight: 700, marginTop: 8 }}
        >
          {saving ? <Loader2 size={14} className="anim-spin" /> : "Save All AI Settings"}
        </button>
      </div>
    </div>
  );
}

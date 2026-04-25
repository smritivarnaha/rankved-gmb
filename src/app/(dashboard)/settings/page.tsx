"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  Loader2, CheckCircle2, ExternalLink, RefreshCw, MapPin, 
  AlertCircle, Shield, Clock, Send, ChevronDown, ChevronUp,
  Cpu, Image as ImageIcon, Key, Sparkles, Wand2
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAgencyOwner = role === "AGENCY_OWNER";
  const canConnectGoogle = isSuperAdmin || isAgencyOwner;
  const userEmail = session?.user?.email || "";

  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success?: string; error?: string } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

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

  const sectionGap = { display: "flex", flexDirection: "column" as const, gap: 24 };

  return (
    <div style={{ ...sectionGap, maxWidth: 900 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure RankVed's AI engines and your Google connections.</p>
      </div>

      {/* AI Integration */}
      {(isAgencyOwner || isSuperAdmin) && <AiSettingsCard />}

      {/* Google Integration */}
      {canConnectGoogle && (
        <div className="card shadow-sm">
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
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPin style={{ width: 18, height: 18, color: "#64748b" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
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
    <div className="card shadow-lg" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
      <div className="card-header" style={{ background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: 8, background: "var(--accent)", borderRadius: 8, color: "white" }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="card-title" style={{ fontSize: 16 }}>AI Global Configuration</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Define the primary brains powering your automation.</p>
          </div>
        </div>
        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} /> Saved
          </div>
        )}
      </div>

      <div className="card-body" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* Step 1: Default Providers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Wand2 size={14} /> 1. Primary Providers
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Default Content Engine</label>
              <div style={{ position: "relative" }}>
                <select 
                  value={settings.defaultAiContentProvider}
                  onChange={e => setSettings({ ...settings, defaultAiContentProvider: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", background: "white", fontSize: 14, appearance: "none" }}
                >
                  <option value="CLAUDE">Anthropic Claude (Recommended)</option>
                  <option value="GPT">OpenAI GPT</option>
                  <option value="GEMINI">Google Gemini</option>
                </select>
                <ChevronDown size={16} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Default Image Engine</label>
              <div style={{ position: "relative" }}>
                <select 
                  value={settings.defaultAiImageProvider}
                  onChange={e => setSettings({ ...settings, defaultAiImageProvider: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", background: "white", fontSize: 14, appearance: "none" }}
                >
                  <option value="DALL-E-3">OpenAI DALL-E (Recommended)</option>
                  <option value="GEMINI">Google Gemini (Imagen)</option>
                </select>
                <ChevronDown size={16} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: API Keys */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Key size={14} /> 2. API Credentials
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>ANTHROPIC (Claude)</label>
              <input type="password" value={settings.anthropicApiKey} onChange={e => setSettings({ ...settings, anthropicApiKey: e.target.value })} placeholder="sk-ant-..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
            </div>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>OPENAI (GPT/DALL-E)</label>
              <input type="password" value={settings.openaiApiKey} onChange={e => setSettings({ ...settings, openaiApiKey: e.target.value })} placeholder="sk-..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
            </div>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>GOOGLE (Gemini)</label>
              <input type="password" value={settings.geminiApiKey} onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })} placeholder="AIza..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
            </div>
          </div>
        </div>

        {/* Step 3: Specific Model Strings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Cpu size={14} /> 3. Advanced Model IDs
          </h3>
          <div style={{ padding: 20, background: "rgba(37, 99, 235, 0.03)", borderRadius: 16, border: "1px dashed #bfdbfe" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={12} /> Content Models</p>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Anthropic String</label>
                  <input value={settings.anthropicModel} onChange={e => setSettings({ ...settings, anthropicModel: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>OpenAI String</label>
                  <input value={settings.openaiContentModel} onChange={e => setSettings({ ...settings, openaiContentModel: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Google String</label>
                  <input value={settings.geminiContentModel} onChange={e => setSettings({ ...settings, geminiContentModel: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", display: "flex", alignItems: "center", gap: 4 }}><ImageIcon size={12} /> Image Models</p>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>DALL-E String</label>
                  <input value={settings.openaiImageModel} onChange={e => setSettings({ ...settings, openaiImageModel: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Imagen String</label>
                  <input value={settings.geminiImageModel} onChange={e => setSettings({ ...settings, geminiImageModel: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn btn-primary" 
            style={{ 
              padding: "14px 32px", 
              fontSize: 14, 
              fontWeight: 700, 
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {saving ? <Loader2 size={18} className="anim-spin" /> : <Sparkles size={18} />}
            {saving ? "Saving Configuration..." : "Apply AI Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

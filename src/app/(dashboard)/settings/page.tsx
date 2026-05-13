"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Loader2, CheckCircle2, RefreshCw, MapPin, 
  AlertCircle, User, Trash2, Image as ImageIcon, Upload, Save
} from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAgencyOwner = role === "AGENCY_OWNER";
  const canConnectGoogle = isSuperAdmin || isAgencyOwner;

  const { settings, mutate } = useGlobalSettings();
  const aiFeaturesEnabled = settings?.aiFeaturesEnabled ?? false;

  const [localSettings, setLocalSettings] = useState<any>({});
  const [activeTemplate, setActiveTemplate] = useState<"SUCCESS" | "FAILURE" | "SCHEDULED">("SUCCESS");
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  
  const [activeTab, setActiveTab] = useState<"accounts" | "notifications" | "profiles" | "branding">("accounts");

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateSettings = (updates: any) => {
    setLocalSettings((prev: any) => ({ ...prev, ...updates }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const formData = new FormData();
      Object.keys(localSettings).forEach(key => {
        if (localSettings[key] !== null && localSettings[key] !== undefined) {
          formData.append(key, localSettings[key].toString());
        }
      });
      if (selectedLogo) {
        formData.append("sidebarLogo", selectedLogo);
      }

      const res = await fetch("/api/admin/login-settings", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setFetchResult({ success: "Settings saved successfully." });
        setSelectedLogo(null);
        mutate();
      } else {
        const data = await res.json();
        setFetchResult({ error: data.error || "Failed to save settings." });
      }
    } catch {
      setFetchResult({ error: "Network error." });
    }
    setSavingSettings(false);
  };

  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success?: string; error?: string } | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);
  
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
        <p className="page-subtitle">{aiFeaturesEnabled ? "Configure RankVed's AI engines and your Google connections." : "Configure your Google connections."}</p>
      </div>

      {/* ─── Settings Tabs ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #eaeaea", paddingBottom: 0 }}>
        {[
          { id: "accounts", label: "Google Accounts" },
          { id: "notifications", label: "Email Notifications" },
          { id: "profiles", label: "Saved Profiles" },
          ...(isSuperAdmin ? [{ id: "branding", label: "Sidebar Branding" }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: activeTab === tab.id ? "#111" : "#666",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #111" : "2px solid transparent",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {fetchResult && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, background: fetchResult.success ? "var(--success-bg)" : "var(--error-bg)", border: `1px solid ${fetchResult.success ? "var(--success-border)" : "var(--error-border)"}`, color: fetchResult.success ? "var(--success)" : "var(--error)" }}>
          {fetchResult.success ? <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} /> : <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>{fetchResult.success || fetchResult.error}</div>
          <button onClick={() => setFetchResult(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", opacity: 0.7 }}>✕</button>
        </div>
      )}

      {/* Google Integration */}
      {canConnectGoogle && activeTab === "accounts" && (
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
                  <button onClick={handleFetchProfiles} disabled={fetching} className="btn btn-primary" style={{ fontSize: 12, padding: "8px 14px", background: "#10b981", borderColor: "#10b981" }}>
                    {fetching ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <RefreshCw style={{ width: 14, height: 14 }} />}
                    Fetch Profiles
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

      {/* Email Notifications */}
      {canConnectGoogle && activeTab === "notifications" && (
        <div className="card shadow-sm">
          <div className="card-header">
            <h2 className="card-title" style={{ fontSize: 14 }}>Email Notifications</h2>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Recipient Emails */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Recipient Emails (To)</label>
                  <input 
                    type="text" 
                    value={localSettings?.notificationEmails || ""} 
                    onChange={(e) => updateSettings({ notificationEmails: e.target.value })}
                    placeholder="admin@example.com"
                    className="input w-full"
                    style={{ fontSize: 13 }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Main recipient(s), comma-separated.
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>CC Emails</label>
                  <input 
                    type="text" 
                    value={localSettings?.notificationCcEmails || ""} 
                    onChange={(e) => updateSettings({ notificationCcEmails: e.target.value })}
                    placeholder="owner@example.com, team@example.com"
                    className="input w-full"
                    style={{ fontSize: 13 }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Additional CC recipient(s), comma-separated.
                  </p>
                </div>
              </div>

              {/* Template Editor */}
              <div style={{ border: "1px solid var(--border-light)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "var(--bg-elevated)", padding: "8px 12px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Custom Templates (HTML Supported)</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["SUCCESS", "FAILURE", "SCHEDULED"].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActiveTemplate(t as any)}
                        style={{ 
                          fontSize: 10, padding: "4px 8px", borderRadius: 4, 
                          background: activeTemplate === t ? "var(--accent)" : "transparent",
                          color: activeTemplate === t ? "white" : "var(--text-secondary)",
                          border: "none", cursor: "pointer"
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Subject</label>
                    <input 
                      type="text" 
                      value={activeTemplate === "SUCCESS" ? localSettings?.successTemplateSubject : activeTemplate === "FAILURE" ? localSettings?.failureTemplateSubject : localSettings?.scheduledTemplateSubject} 
                      onChange={(e) => updateSettings({ 
                        [activeTemplate === "SUCCESS" ? "successTemplateSubject" : activeTemplate === "FAILURE" ? "failureTemplateSubject" : "scheduledTemplateSubject"]: e.target.value 
                      })}
                      className="input w-full"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Body</label>
                    <textarea 
                      rows={4}
                      value={activeTemplate === "SUCCESS" ? localSettings?.successTemplateBody : activeTemplate === "FAILURE" ? localSettings?.failureTemplateBody : localSettings?.scheduledTemplateBody} 
                      onChange={(e) => updateSettings({ 
                        [activeTemplate === "SUCCESS" ? "successTemplateBody" : activeTemplate === "FAILURE" ? "failureTemplateBody" : "scheduledTemplateBody"]: e.target.value 
                      })}
                      className="input w-full"
                      style={{ fontSize: 13, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6, border: "1px dashed #cbd5e1" }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Available Variables:</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["{profileName}", "{postSummary}", "{postPreview}", "{error}", "{scheduledAt}"].map(v => (
                        <code key={v} style={{ fontSize: 10, background: "#e2e8f0", padding: "2px 4px", borderRadius: 3 }}>{v}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid var(--border-light)", paddingTop: 16 }}>
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: "8px 14px" }}
                >
                  {savingSettings ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : null}
                  Save Notification Settings
                </button>
                <button 
                  onClick={async () => {
                    setTestingEmail(true);
                    try {
                      const res = await fetch("/api/test-email", { method: "POST" });
                      const data = await res.json();
                      if (res.ok) setFetchResult({ success: data.message });
                      else setFetchResult({ error: data.error });
                    } catch {
                      setFetchResult({ error: "Network error." });
                    }
                    setTestingEmail(false);
                  }} 
                  disabled={testingEmail} 
                  className="btn" 
                  style={{ fontSize: 12, padding: "8px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                >
                  {testingEmail ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : null}
                  Send Test Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profiles List */}
      {canConnectGoogle && activeTab === "profiles" && (
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
            {loadingProfiles ? (
              <div style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}><Loader2 className="anim-spin" style={{ width: 16, height: 16, color: "var(--text-muted)" }} /></div>
            ) : profiles.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {profiles.map((p) => (
                  <div key={p.id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border-light)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <MapPin style={{ width: 22, height: 22, color: "#64748b" }} />
                      )}
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

      {/* Branding List */}
      {isSuperAdmin && activeTab === "branding" && (
        <div className="card shadow-sm">
          <div className="card-header">
            <h2 className="card-title" style={{ fontSize: 14 }}>Sidebar Branding</h2>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 24 }}>
              <div style={{ width: 140, height: 140, background: "#f8f9fa", borderRadius: 8, border: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {selectedLogo ? (
                  <img src={URL.createObjectURL(selectedLogo)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : localSettings?.sidebarLogoUrl ? (
                  <img src={localSettings.sidebarLogoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <ImageIcon size={32} color="#CBD5E1" />
                )}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <label className="btn btn-primary" style={{ background: "#fff", color: "#2563EB", border: "1px solid #BFDBFE", fontSize: 13, height: 38, padding: "0 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Upload size={14} /> Upload New Logo
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setSelectedLogo(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Sidebar Text</label>
                  <input type="text" className="input" value={localSettings?.sidebarText || ""} onChange={e => updateSettings({ sidebarText: e.target.value })} placeholder="e.g. RankVed" style={{ width: "100%", height: 38, padding: "0 12px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 14 }} />
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 8 }}>The text that appears next to the logo in the sidebar.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Logo Shape</label>
                    <select 
                      value={localSettings?.sidebarLogoShape || "circle"} 
                      onChange={e => updateSettings({ sidebarLogoShape: e.target.value })}
                      style={{ width: "100%", height: 38, padding: "0 12px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 14 }}
                    >
                      <option value="circle">Circle</option>
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Logo Size (px)</label>
                    <input 
                      type="number" 
                      value={localSettings?.sidebarLogoSize || 24} 
                      onChange={e => updateSettings({ sidebarLogoSize: e.target.value })}
                      style={{ width: "100%", height: 38, padding: "0 12px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Text Size (px)</label>
                    <input 
                      type="number" 
                      value={localSettings?.sidebarTextSize || 14} 
                      onChange={e => updateSettings({ sidebarTextSize: e.target.value })}
                      style={{ width: "100%", height: 38, padding: "0 12px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 6, fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", borderTop: "1px solid var(--border-light)", paddingTop: 16 }}>
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="btn btn-primary"
                style={{ fontSize: 12, padding: "8px 14px", marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}
              >
                {savingSettings ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                {savingSettings ? "Saving..." : "Save Branding Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



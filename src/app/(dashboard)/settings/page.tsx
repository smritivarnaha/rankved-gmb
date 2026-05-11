"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Loader2, CheckCircle2, RefreshCw, MapPin, 
  AlertCircle, User, Trash2, Database
} from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

function UsageStats() {
  const { data, error, isLoading } = useSWR("/api/usage", (url) => fetch(url).then(r => r.json()));

  if (isLoading) return <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0" }}><Loader2 className="anim-spin w-4 h-4" /><span style={{ fontSize: 13, color: "var(--text-muted)" }}>Calculating usage...</span></div>;
  if (error || !data) return <div style={{ fontSize: 13, color: "var(--error)" }}>Failed to load usage data.</div>;

  const stats = [
    { 
      label: "Database Storage", 
      used: data.database.usedMB, 
      total: data.database.totalMB, 
      percent: data.database.percent, 
      icon: <Database className="w-4 h-4" /> 
    },
    { 
      label: "Image Storage (Estimated)", 
      used: data.images.usedMB, 
      total: data.images.totalMB, 
      percent: data.images.percent, 
      icon: <Database className="w-4 h-4" /> 
    }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
      {stats.map((s, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--text-secondary)" }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{s.label}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{s.percent}%</span>
          </div>
          <div style={{ height: 6, width: "100%", background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${s.percent}%`, background: "var(--accent)", borderRadius: 3, transition: "width 1s ease-out" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
            <span>{s.used} MB used</span>
            <span>{s.total - s.used} MB left</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateSettings = (updates: any) => {
    setLocalSettings((prev: any) => ({ ...prev, ...updates }));
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const formData = new FormData();
      Object.keys(localSettings).forEach(key => {
        if (localSettings[key] !== null && localSettings[key] !== undefined) {
          formData.append(key, localSettings[key].toString());
        }
      });

      const res = await fetch("/api/admin/login-settings", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setFetchResult({ success: "Notification settings saved successfully." });
        mutate();
      } else {
        const data = await res.json();
        setFetchResult({ error: data.error || "Failed to save settings." });
      }
    } catch {
      setFetchResult({ error: "Network error." });
    }
    setSavingNotifications(false);
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

      {/* Storage Usage */}
      {canConnectGoogle && (
        <div className="card shadow-sm" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Database className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="card-title" style={{ fontSize: 14 }}>System Storage & Usage</h2>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "#eef2ff", padding: "2px 8px", borderRadius: 10 }}>SUPABASE FREE TIER</div>
          </div>
          <div className="card-body">
            <UsageStats />
          </div>
        </div>
      )}

      {fetchResult && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, background: fetchResult.success ? "var(--success-bg)" : "var(--error-bg)", border: `1px solid ${fetchResult.success ? "var(--success-border)" : "var(--error-border)"}`, color: fetchResult.success ? "var(--success)" : "var(--error)" }}>
          {fetchResult.success ? <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} /> : <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>{fetchResult.success || fetchResult.error}</div>
          <button onClick={() => setFetchResult(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", opacity: 0.7 }}>✕</button>
        </div>
      )}

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
      {canConnectGoogle && (
        <div className="card shadow-sm">
          <div className="card-header">
            <h2 className="card-title" style={{ fontSize: 14 }}>Email Notifications</h2>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Recipient Emails */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Recipient Emails (Comma-separated)</label>
                <input 
                  type="text" 
                  value={localSettings?.notificationEmails || ""} 
                  onChange={(e) => updateSettings({ notificationEmails: e.target.value })}
                  placeholder="admin@example.com, owner@example.com"
                  className="input w-full"
                  style={{ fontSize: 13 }}
                />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  All emails in this list will receive notifications for post activities.
                </p>
              </div>

              {/* Template Editor */}
              <div style={{ border: "1px solid var(--border-light)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "var(--bg-elevated)", padding: "8px 12px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Custom Templates</span>
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
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: "8px 14px" }}
                >
                  {savingNotifications ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : null}
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



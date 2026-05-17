"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Loader2, CheckCircle2, RefreshCw, MapPin, 
  AlertCircle, User, Trash2, Image as ImageIcon, Upload, Save,
  Mail, Bookmark, Palette, Eye, Send, Code, Copy, Users, Globe
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
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  
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

  const copyVariable = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const availableVariables = ["{profileName}", "{postSummary}", "{postPreview}", "{error}", "{scheduledAt}"];

  const sectionGap = { display: "flex", flexDirection: "column" as const, gap: 24 };

  const tabs = [
    { id: "accounts", label: "Google Accounts", icon: Globe },
    { id: "notifications", label: "Email Notifications", icon: Mail },
    { id: "profiles", label: "Saved Profiles", icon: Bookmark },
    ...(isSuperAdmin ? [{ id: "branding", label: "Sidebar Branding", icon: Palette }] : [])
  ];

  return (
    <div style={{ ...sectionGap, maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
      <style>{`
        /* ── Settings page mobile fixes & redesign ── */
        .s-card { background: #fff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); overflow: hidden; }
        .s-card-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px; border-bottom: 1px solid #eaeaea; }
        .s-card-body { padding: 24px; }
        
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 16px 20px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; background: transparent; transition: all 0.2s; border-bottom: 2px solid transparent; color: #64748b; }
        .tab-btn.active { color: #2563eb; border-bottom: 2px solid #2563eb; }
        .tab-btn:hover:not(.active) { color: #111827; }
        
        .icon-box { width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #2563eb; }
        
        .stpl-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
        .spill-btn { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; background: transparent; transition: all 0.2s; }
        .spill-btn.active { background: #2563eb; color: #fff; }
        .spill-btn.inactive { color: #64748b; border: 1px solid #eaeaea; }
        .spill-btn.inactive:hover { background: #f8fafc; color: #111827; }
        
        .var-btn { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #fff; border: 1px solid #eaeaea; border-radius: 6px; cursor: pointer; font-family: monospace; font-size: 12px; color: #475569; transition: all 0.15s; }
        .var-btn:hover { border-color: #cbd5e1; background: #f8fafc; }
        
        .input-with-icon { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid #eaeaea; border-radius: 8px; background: #fff; transition: border-color 0.2s; }
        .input-with-icon:focus-within { border-color: #2563eb; }
        .input-with-icon input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; width: 100%; }
        
        @media (max-width: 768px) {
          .stabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-wrap: nowrap !important; }
          .stabs::-webkit-scrollbar { display: none; }
          .tab-btn { white-space: nowrap; flex-shrink: 0; padding: 14px 16px !important; }
          
          .s-card-body, .s-card-header { padding: 16px !important; }
          .s-card-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .s-card-header button { width: 100% !important; justify-content: center; }

          .snotif-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .snotif-actions { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .snotif-actions button { width: 100% !important; justify-content: center; }
          
          .stpl-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .stpl-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .stpl-header-btns { width: 100% !important; display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }
          .stpl-header-btns button { padding: 8px 4px !important; font-size: 11px !important; width: 100%; justify-content: center; }

          .sactions { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .sactions > div.spacer { display: none !important; }
          .sactions button, .sactions a { width: 100% !important; flex: none !important; justify-content: center; }

          .sprofiles-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          
          .sbrand-3col { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sbrand-top { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .sbrand-logo { width: 100% !important; height: auto !important; aspect-ratio: 1 !important; max-height: 160px !important; }
        }
      `}</style>

      {/* ─── Settings Tabs ─── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #eaeaea", marginBottom: 8 }} className="stabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {fetchResult && (
        <div style={{ padding: "12px 16px", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, background: fetchResult.success ? "#ecfdf5" : "#fef2f2", border: `1px solid ${fetchResult.success ? "#a7f3d0" : "#fecaca"}`, color: fetchResult.success ? "#059669" : "#dc2626" }}>
          {fetchResult.success ? <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} /> : <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>{fetchResult.success || fetchResult.error}</div>
          <button onClick={() => setFetchResult(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", opacity: 0.7 }}>✕</button>
        </div>
      )}

      {/* Google Integration */}
      {canConnectGoogle && activeTab === "accounts" && (
        <div className="s-card">
          <div className="s-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="icon-box"><Globe size={22} /></div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Google Accounts</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Connect your Google accounts to manage locations and publish posts.</p>
              </div>
            </div>
          </div>
          <div className="s-card-body">
            {loadingAccounts ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                <Loader2 className="anim-spin" style={{ width: 24, height: 24, color: "#94a3b8" }} />
              </div>
            ) : hasGoogleToken ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {googleAccounts.map((acc, idx) => (
                    <div key={acc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#f8fafc", border: "1px solid #eaeaea", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User style={{ width: 18, height: 18, color: "#2563eb" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{acc.email}</p>
                          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Connected Account {idx + 1}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDisconnectSingle(acc.id)} className="btn btn-sm" style={{ color: "#dc2626", background: "transparent", padding: "8px" }} title="Disconnect this account">
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }} className="sactions">
                  <button onClick={handleGoogleConnect} disabled={connecting} className="btn btn-primary" style={{ padding: "10px 16px" }}>
                    {connecting ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <Globe style={{ width: 16, height: 16 }} />}
                    Connect Another Account
                  </button>
                  <button onClick={handleFetchProfiles} disabled={fetching} className="btn btn-primary" style={{ padding: "10px 16px", background: "#10b981", borderColor: "#10b981" }}>
                    {fetching ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <RefreshCw style={{ width: 16, height: 16 }} />}
                    Fetch Profiles
                  </button>
                  <div style={{ flex: 1 }} className="spacer"></div>
                  <button onClick={handleReset} disabled={resetting || fetching} className="btn" style={{ padding: "10px 16px", background: "#fff", border: "1px solid #eaeaea", color: "#111827" }}>
                    {resetting ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <RefreshCw style={{ width: 16, height: 16 }} />}
                    Reset Profiles
                  </button>
                  <button onClick={handleDisconnectAll} disabled={disconnecting} className="btn" style={{ padding: "10px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    {disconnecting ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
                    Wipe Everything
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 0", alignItems: "flex-start" }}>
                <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>Connect your Google account to manage Business Profiles and publish posts.</p>
                <button onClick={handleGoogleConnect} disabled={connecting} className="btn btn-primary" style={{ padding: "10px 16px" }}>
                  {connecting ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <Globe style={{ width: 16, height: 16 }} />}
                  Connect Google account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Notifications */}
      {canConnectGoogle && activeTab === "notifications" && (
        <div className="s-card">
          <div className="s-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="icon-box"><Mail size={22} /></div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Email Notifications</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Configure and customize email notifications for your profile updates.</p>
              </div>
            </div>
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
              style={{ padding: "8px 16px", background: "#fff", border: "1px solid #eaeaea", color: "#111827" }}
            >
              {testingEmail ? <Loader2 className="anim-spin" style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              Preview Email
            </button>
          </div>
          <div className="s-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              
              {/* Recipient Emails */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="snotif-grid">
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Recipient Emails (To) <span style={{ color: "#dc2626" }}>*</span></label>
                  <div className="input-with-icon">
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={14} />
                    </div>
                    <input 
                      type="text" 
                      value={localSettings?.notificationEmails || ""} 
                      onChange={(e) => updateSettings({ notificationEmails: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "8px 0 0 0" }}>Main recipient(s), comma-separated.</p>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>CC Emails</label>
                  <div className="input-with-icon">
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={14} />
                    </div>
                    <input 
                      type="text" 
                      value={localSettings?.notificationCcEmails || ""} 
                      onChange={(e) => updateSettings({ notificationCcEmails: e.target.value })}
                      placeholder="owner@example.com"
                    />
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "8px 0 0 0" }}>Additional CC recipient(s), comma-separated.</p>
                </div>
              </div>

              {/* Template Editor */}
              <div style={{ border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "#f8fafc", padding: "16px 20px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="stpl-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Code size={18} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Custom Templates (HTML Supported)</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, background: "#fff", padding: 4, borderRadius: 8, border: "1px solid #eaeaea" }} className="stpl-header-btns">
                    {["SUCCESS", "FAILURE", "SCHEDULED"].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActiveTemplate(t as any)}
                        className={`spill-btn ${activeTemplate === t ? "active" : "inactive"}`}
                      >
                        {t === "SUCCESS" ? <CheckCircle2 size={14} /> : t === "FAILURE" ? <AlertCircle size={14} /> : <MapPin size={14} />}
                        <span style={{ textTransform: "capitalize" }}>{t.toLowerCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ padding: 24 }} className="stpl-grid">
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 8, display: "block" }}>Subject</label>
                      <input 
                        type="text" 
                        value={activeTemplate === "SUCCESS" ? localSettings?.successTemplateSubject : activeTemplate === "FAILURE" ? localSettings?.failureTemplateSubject : localSettings?.scheduledTemplateSubject} 
                        onChange={(e) => updateSettings({ 
                          [activeTemplate === "SUCCESS" ? "successTemplateSubject" : activeTemplate === "FAILURE" ? "failureTemplateSubject" : "scheduledTemplateSubject"]: e.target.value 
                        })}
                        className="input w-full"
                        style={{ fontSize: 14, padding: "10px 14px", borderRadius: 8, border: "1px solid #eaeaea" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 8, display: "block" }}>Body</label>
                      <textarea 
                        rows={6}
                        value={activeTemplate === "SUCCESS" ? localSettings?.successTemplateBody : activeTemplate === "FAILURE" ? localSettings?.failureTemplateBody : localSettings?.scheduledTemplateBody} 
                        onChange={(e) => updateSettings({ 
                          [activeTemplate === "SUCCESS" ? "successTemplateBody" : activeTemplate === "FAILURE" ? "failureTemplateBody" : "scheduledTemplateBody"]: e.target.value 
                        })}
                        className="input w-full"
                        style={{ fontSize: 14, padding: "14px", borderRadius: 8, border: "1px solid #eaeaea", resize: "vertical", fontFamily: "monospace", minHeight: 150 }}
                      />
                    </div>
                  </div>
                  
                  {/* Sidebar for Variables */}
                  <div style={{ background: "#f8fafc", border: "1px solid #eaeaea", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Code size={16} color="#2563eb" />
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", margin: 0 }}>Available Variables</h3>
                    </div>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 16px 0" }}>Click to copy variables to your template</p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {availableVariables.map(v => (
                        <button key={v} className="var-btn" onClick={() => copyVariable(v)}>
                          <span>{v}</span>
                          {copiedVar === v ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} color="#94a3b8" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="snotif-actions">
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="btn btn-primary"
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  {savingSettings ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <Save style={{ width: 16, height: 16 }} />}
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
                  style={{ padding: "10px 20px", fontSize: 14, background: "#fff", border: "1px solid #eaeaea", color: "#111827" }}
                >
                  {testingEmail ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <Send style={{ width: 16, height: 16 }} />}
                  Send Test Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profiles List */}
      {canConnectGoogle && activeTab === "profiles" && (
        <div className="s-card">
          <div className="s-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="icon-box"><Bookmark size={22} /></div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Saved Profiles</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  {profiles.length > 0 ? `${profiles.length} profiles synced to your account` : "No profiles fetched yet"}
                </p>
              </div>
            </div>
            <button onClick={handleFetchProfiles} disabled={fetching || !hasGoogleToken} className="btn btn-primary" style={{ padding: "10px 16px" }}>
              {fetching ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <RefreshCw style={{ width: 16, height: 16 }} />}
              {fetching ? "Fetching..." : "Fetch Profiles"}
            </button>
          </div>
          <div className="s-card-body">
            {loadingProfiles ? (
              <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}><Loader2 className="anim-spin" style={{ width: 24, height: 24, color: "#94a3b8" }} /></div>
            ) : profiles.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }} className="sprofiles-grid">
                {profiles.map((p) => (
                  <div key={p.id} style={{ padding: 16, borderRadius: 12, border: "1px solid #eaeaea", background: "#f8fafc", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <MapPin style={{ width: 24, height: 24, color: "#94a3b8" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p title={p.name} style={{ 
                        fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {p.name}
                      </p>
                      <p title={p.address || ""} style={{ 
                        fontSize: 12, color: "#64748b", margin: 0,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>{p.address || "No address on file"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div style={{ padding: "40px 20px", textAlign: "center" }}>
                 <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>No profiles found. Make sure your Google Account is connected and click Fetch Profiles.</p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Branding List */}
      {isSuperAdmin && activeTab === "branding" && (
        <div className="s-card">
          <div className="s-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="icon-box"><Palette size={22} /></div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Sidebar Branding</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Customize the logo and text displayed in the main sidebar.</p>
              </div>
            </div>
          </div>
          <div className="s-card-body">
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", marginBottom: 32 }} className="sbrand-top">
              <div style={{ width: 140, height: 140, background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }} className="sbrand-logo">
                {selectedLogo ? (
                  <img src={URL.createObjectURL(selectedLogo)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : localSettings?.sidebarLogoUrl ? (
                  <img src={localSettings.sidebarLogoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <ImageIcon size={32} color="#cbd5e1" />
                )}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <label className="btn btn-primary" style={{ background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: 14, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Upload size={16} /> Upload New Logo
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setSelectedLogo(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Sidebar Text</label>
                  <input type="text" className="input" value={localSettings?.sidebarText || ""} onChange={e => updateSettings({ sidebarText: e.target.value })} placeholder="e.g. RankVed" style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, fontSize: 14 }} />
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>The text that appears next to the logo in the sidebar.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="sbrand-3col">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Logo Shape</label>
                    <select 
                      value={localSettings?.sidebarLogoShape || "circle"} 
                      onChange={e => updateSettings({ sidebarLogoShape: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, fontSize: 14 }}
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
                      style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "block", marginBottom: 8 }}>Text Size (px)</label>
                    <input 
                      type="number" 
                      value={localSettings?.sidebarTextSize || 14} 
                      onChange={e => updateSettings({ sidebarTextSize: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", borderTop: "1px solid #eaeaea", paddingTop: 20 }}>
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="btn btn-primary"
                style={{ fontSize: 14, padding: "10px 20px", marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}
              >
                {savingSettings ? <Loader2 className="anim-spin" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
                {savingSettings ? "Saving..." : "Save Branding Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, FlaskConical, XCircle, Sparkles, Wand2, Key, ChevronDown, Globe, Eye, EyeOff } from "lucide-react";

export function ProviderSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ 
    anthropicApiKey: "", openaiApiKey: "", geminiApiKey: "", openrouterApiKey: "",
    defaultAiContentProvider: "CLAUDE",
    defaultAiImageProvider: "DALL-E-3",
    anthropicModel: "claude-3-5-sonnet-20241022",
    openaiContentModel: "gpt-4o",
    openaiImageModel: "dall-e-3",
    geminiContentModel: "gemini-1.5-flash",
    geminiImageModel: "imagen-3.0-generate-001",
    openrouterModel: "openrouter/auto"
  });
  const [success, setSuccess] = useState(false);
  
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success?: boolean; error?: string }>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/user/settings")
      .then(r => r.json())
      .then(d => setSettings({ 
        anthropicApiKey: d.anthropicApiKey || "", 
        openaiApiKey: d.openaiApiKey || "",
        geminiApiKey: d.geminiApiKey || "",
        openrouterApiKey: d.openrouterApiKey || "",
        defaultAiContentProvider: d.defaultAiContentProvider || "CLAUDE",
        defaultAiImageProvider: d.defaultAiImageProvider || "DALL-E-3",
        anthropicModel: d.anthropicModel || "claude-3-5-sonnet-20241022",
        openaiContentModel: d.openaiContentModel || "gpt-4o",
        openaiImageModel: d.openaiImageModel || "dall-e-3",
        geminiContentModel: d.geminiContentModel || "gemini-1.5-flash",
        geminiImageModel: d.geminiImageModel || "imagen-3.0-generate-001",
        openrouterModel: d.openrouterModel || "openrouter/auto"
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

  const handleTestKey = async (provider: string, apiKey: string) => {
    if (!apiKey) return;
    setTesting({ ...testing, [provider]: true });
    setTestResults({ ...testResults, [provider]: {} });
    
    try {
      const res = await fetch("/api/user/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResults({ ...testResults, [provider]: { success: true } });
      } else {
        setTestResults({ ...testResults, [provider]: { error: data.error } });
      }
    } catch (err) {
      setTestResults({ ...testResults, [provider]: { error: "Network error" } });
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  if (loading) return (
    <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
      <Loader2 className="anim-spin" style={{ color: "#a1a1aa" }} />
    </div>
  );

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
                  <option value="OPENROUTER">OpenRouter (Free/Custom Models)</option>
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
            <Key size={14} /> 2. API Credentials & Testing
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            
            {/* OpenRouter */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Globe size={14} /> OpenRouter
                </label>
                {testResults.OPENROUTER?.success && <CheckCircle2 size={14} style={{ color: "#16a34a" }} />}
                {testResults.OPENROUTER?.error && <XCircle size={14} style={{ color: "#dc2626" }} />}
              </div>
              <div style={{ position: "relative" }}>
                <input type={showKey.openrouter ? "text" : "password"} value={settings.openrouterApiKey} onChange={e => setSettings({ ...settings, openrouterApiKey: e.target.value })} placeholder="sk-or-v1-..." style={{ width: "100%", padding: "10px", paddingRight: "40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} />
                <button type="button" onClick={() => setShowKey({ ...showKey, openrouter: !showKey.openrouter })} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showKey.openrouter ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input type="text" value={settings.openrouterModel} onChange={e => setSettings({ ...settings, openrouterModel: e.target.value })} placeholder="openrouter/auto" style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} />
              <button 
                onClick={() => handleTestKey("OPENROUTER", settings.openrouterApiKey)} 
                disabled={testing.OPENROUTER || !settings.openrouterApiKey}
                style={{ width: "100%", padding: "8px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {testing.OPENROUTER ? <Loader2 size={12} className="anim-spin" /> : <FlaskConical size={12} />}
                Test Connection
              </button>
              {testResults.OPENROUTER?.error && <p style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>{testResults.OPENROUTER.error}</p>}
            </div>

            {/* OpenAI */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>OpenAI</label>
                {testResults.GPT?.success && <CheckCircle2 size={14} style={{ color: "#16a34a" }} />}
                {testResults.GPT?.error && <XCircle size={14} style={{ color: "#dc2626" }} />}
              </div>
              <div style={{ position: "relative" }}>
                <input type={showKey.openai ? "text" : "password"} value={settings.openaiApiKey} onChange={e => setSettings({ ...settings, openaiApiKey: e.target.value })} placeholder="sk-..." style={{ width: "100%", padding: "10px", paddingRight: "40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} />
                <button type="button" onClick={() => setShowKey({ ...showKey, openai: !showKey.openai })} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showKey.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button 
                onClick={() => handleTestKey("GPT", settings.openaiApiKey)} 
                disabled={testing.GPT || !settings.openaiApiKey}
                style={{ width: "100%", padding: "8px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {testing.GPT ? <Loader2 size={12} className="anim-spin" /> : <FlaskConical size={12} />}
                Test Connection
              </button>
              {testResults.GPT?.error && <p style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>{testResults.GPT.error}</p>}
            </div>

            {/* Anthropic */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Anthropic</label>
                {testResults.CLAUDE?.success && <CheckCircle2 size={14} style={{ color: "#16a34a" }} />}
                {testResults.CLAUDE?.error && <XCircle size={14} style={{ color: "#dc2626" }} />}
              </div>
              <div style={{ position: "relative" }}>
                <input type={showKey.anthropic ? "text" : "password"} value={settings.anthropicApiKey} onChange={e => setSettings({ ...settings, anthropicApiKey: e.target.value })} placeholder="sk-ant-..." style={{ width: "100%", padding: "10px", paddingRight: "40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} />
                <button type="button" onClick={() => setShowKey({ ...showKey, anthropic: !showKey.anthropic })} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showKey.anthropic ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button 
                onClick={() => handleTestKey("CLAUDE", settings.anthropicApiKey)} 
                disabled={testing.CLAUDE || !settings.anthropicApiKey}
                style={{ width: "100%", padding: "8px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {testing.CLAUDE ? <Loader2 size={12} className="anim-spin" /> : <FlaskConical size={12} />}
                Test Connection
              </button>
              {testResults.CLAUDE?.error && <p style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>{testResults.CLAUDE.error}</p>}
            </div>

            {/* Google */}
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Google Gemini</label>
                {testResults.GEMINI?.success && <CheckCircle2 size={14} style={{ color: "#16a34a" }} />}
                {testResults.GEMINI?.error && <XCircle size={14} style={{ color: "#dc2626" }} />}
              </div>
              <div style={{ position: "relative" }}>
                <input type={showKey.gemini ? "text" : "password"} value={settings.geminiApiKey} onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })} placeholder="AIza..." style={{ width: "100%", padding: "10px", paddingRight: "40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} />
                <button type="button" onClick={() => setShowKey({ ...showKey, gemini: !showKey.gemini })} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                  {showKey.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button 
                onClick={() => handleTestKey("GEMINI", settings.geminiApiKey)} 
                disabled={testing.GEMINI || !settings.geminiApiKey}
                style={{ width: "100%", padding: "8px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {testing.GEMINI ? <Loader2 size={12} className="anim-spin" /> : <FlaskConical size={12} />}
                Test Connection
              </button>
              {testResults.GEMINI?.error && <p style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>{testResults.GEMINI.error}</p>}
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

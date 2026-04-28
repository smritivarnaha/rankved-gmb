"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Key, Plus, Trash2, Copy, Check, AlertTriangle, Loader2,
  Zap, Clock, Activity, ChevronRight, Shield, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ProviderSettingsCard } from "./ProviderSettingsCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ApiKey {
  id: string;
  label: string;
  keyPrefix: string;
  scopes: string;
  isActive: boolean;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
}

const SCOPE_OPTIONS = [
  { value: "profiles:read", label: "Read Profiles", desc: "List GBP locations" },
  { value: "posts:write",   label: "Create Posts",  desc: "Create draft / scheduled posts" },
  { value: "posts:read",    label: "Read Posts",    desc: "List and view posts" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.10)",
      background: copied ? "#ECFDF5" : "#fff", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 12, fontWeight: 500, color: copied ? "#065F46" : "#52525B",
      transition: "all 0.15s",
    }}>
      {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ApiKeysPage() {
  const [activeTab, setActiveTab] = useState<"PROVIDERS" | "WEBHOOKS">("PROVIDERS");
  const { data, mutate } = useSWR("/api/keys", fetcher);
  const keys: ApiKey[] = data?.data || [];

  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [selectedScopes, setSelectedScopes] = useState(["profiles:read", "posts:write"]);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const toggleScope = (s: string) => {
    setSelectedScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const createKey = async () => {
    if (!label.trim()) return;
    setCreating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), scopes: selectedScopes.join(",") }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewKey(data.key);
      setLabel("");
      setSelectedScopes(["profiles:read", "posts:write"]);
      setShowCreate(false);
      mutate();
    }
    setCreating(false);
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Revoke this API key? Any automation using it will stop working.")) return;
    setRevoking(id);
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    mutate();
    setRevoking(null);
  };

  const activeKeys  = keys.filter(k => k.isActive);
  const revokedKeys = keys.filter(k => !k.isActive);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0A", letterSpacing: "-0.025em", marginBottom: 4 }}>
          API & Integrations
        </h1>
        <p style={{ fontSize: 14, color: "#71717A" }}>
          Manage your AI provider keys and create Webhook keys for external automation.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24, borderBottom: "1px solid #e2e8f0" }}>
        <button 
          onClick={() => setActiveTab("PROVIDERS")}
          style={{ 
            padding: "0 0 12px 0", fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === "PROVIDERS" ? "2px solid #0A0A0A" : "2px solid transparent",
            color: activeTab === "PROVIDERS" ? "#0A0A0A" : "#71717A",
            transition: "all 0.15s"
          }}
        >
          AI Providers
        </button>
        <button 
          onClick={() => setActiveTab("WEBHOOKS")}
          style={{ 
            padding: "0 0 12px 0", fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === "WEBHOOKS" ? "2px solid #0A0A0A" : "2px solid transparent",
            color: activeTab === "WEBHOOKS" ? "#0A0A0A" : "#71717A",
            transition: "all 0.15s"
          }}
        >
          Webhook Keys
        </button>
      </div>

      {activeTab === "PROVIDERS" && <ProviderSettingsCard />}

      {activeTab === "WEBHOOKS" && (
        <>
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { setShowCreate(true); setNewKey(null); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 18px", background: "#0A0A0A", color: "#fff",
                borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
              }}>
              <Plus style={{ width: 15, height: 15 }} /> Generate Webhook Key
            </button>
          </div>

      {/* Newly created key — one-time reveal */}
      {newKey && (
        <div style={{
          marginBottom: 24, padding: "16px 20px",
          background: "#ECFDF5", border: "1px solid #A7F3D0",
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Shield style={{ width: 15, height: 15, color: "#065F46" }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>
              Key generated — copy it now. It will NOT be shown again.
            </p>
          </div>
          <div style={{
            background: "#fff", border: "1px solid #A7F3D0", borderRadius: 7,
            padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <code style={{ fontSize: 13, fontFamily: "monospace", color: "#0A0A0A", wordBreak: "break-all" }}>
              {newKey}
            </code>
            <CopyButton text={newKey} />
          </div>
          <button onClick={() => setNewKey(null)}
            style={{ marginTop: 10, fontSize: 12, color: "#065F46", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            I've saved it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{
          marginBottom: 24, background: "#fff", border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 10, overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>New API Key</h2>
          </div>
          <div style={{ padding: "20px" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#27272A", marginBottom: 6 }}>
              Label
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='e.g. "n8n Production" or "Make Workflow"'
              style={{
                width: "100%", height: 40, padding: "0 12px",
                border: "1px solid rgba(0,0,0,0.10)", borderRadius: 7,
                fontSize: 14, fontFamily: "inherit", outline: "none",
                marginBottom: 20,
              }}
              onKeyDown={e => e.key === "Enter" && createKey()}
              autoFocus
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#27272A", marginBottom: 10 }}>
              Permissions
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {SCOPE_OPTIONS.map(s => (
                <label key={s.value} style={{
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  padding: "10px 14px", borderRadius: 8,
                  background: selectedScopes.includes(s.value) ? "#EFF6FF" : "#FAFAFA",
                  border: `1px solid ${selectedScopes.includes(s.value) ? "#BFDBFE" : "rgba(0,0,0,0.07)"}`,
                  transition: "all 0.1s",
                }}>
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(s.value)}
                    onChange={() => toggleScope(s.value)}
                    style={{ width: 15, height: 15, accentColor: "#0A0A0A", cursor: "pointer" }}
                  />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>{s.label}</p>
                    <p style={{ fontSize: 12, color: "#71717A" }}>{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createKey} disabled={creating || !label.trim()}
                style={{
                  padding: "9px 20px", background: "#0A0A0A", color: "#fff",
                  borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600,
                  cursor: creating || !label.trim() ? "not-allowed" : "pointer",
                  opacity: !label.trim() ? 0.5 : 1,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {creating && <Loader2 style={{ width: 13, height: 13 }} className="anim-spin" />}
                {creating ? "Generating…" : "Generate Key"}
              </button>
              <button onClick={() => setShowCreate(false)}
                style={{
                  padding: "9px 18px", background: "transparent", color: "#71717A",
                  borderRadius: 7, border: "1px solid rgba(0,0,0,0.10)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick start card */}
      <div style={{
        marginBottom: 24, background: "#0A0A0A", borderRadius: 10, padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <Zap style={{ width: 22, height: 22, color: "#FDE68A", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
            Connect n8n in 3 steps
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            1. Generate a key above &nbsp;·&nbsp; 2. In n8n, use HTTP Request node with
            <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 3 }}>
              &nbsp;Authorization: Bearer &lt;key&gt;&nbsp;
            </code>
            &nbsp;·&nbsp; 3. POST to{" "}
            <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 3 }}>
              /api/v1/posts
            </code>
          </p>
        </div>
        <a href="#api-docs" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 16px", background: "rgba(255,255,255,0.1)",
          color: "#fff", borderRadius: 7, fontSize: 13, fontWeight: 500,
          border: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap",
        }}>
          View docs <ChevronRight style={{ width: 13, height: 13 }} />
        </a>
      </div>

      {/* Active keys */}
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <Key style={{ width: 15, height: 15, color: "#52525B" }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>Active Keys</h2>
          <span style={{ fontSize: 11, background: "#F4F4F5", color: "#52525B", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
            {activeKeys.length}
          </span>
        </div>

        {activeKeys.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Key style={{ width: 28, height: 28, color: "#E4E4E7", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#71717A", marginBottom: 4 }}>No active API keys yet.</p>
            <p style={{ fontSize: 13, color: "#A1A1AA" }}>Generate a key to connect n8n or other automations.</p>
          </div>
        ) : (
          activeKeys.map((k, i) => (
            <div key={k.id} style={{
              padding: "16px 20px",
              borderBottom: i < activeKeys.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
              {/* Key prefix */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>{k.label}</p>
                  <span style={{ fontSize: 10, background: "#ECFDF5", color: "#065F46", padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
                    Active
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <code style={{ fontSize: 12, color: "#71717A", fontFamily: "monospace" }}>
                    {k.keyPrefix}••••••••••••••••••••
                  </code>
                  <CopyButton text={k.keyPrefix} />
                </div>
              </div>

              {/* Scopes */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {k.scopes.split(",").map(s => (
                  <span key={s} style={{ fontSize: 11, padding: "2px 8px", background: "#EFF6FF", color: "#1E40AF", borderRadius: 10, fontWeight: 600 }}>
                    {s.trim()}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#0A0A0A", lineHeight: 1 }}>{k.usageCount}</p>
                  <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>requests</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#52525B", lineHeight: 1.4 }}>
                    {k.lastUsedAt ? format(new Date(k.lastUsedAt), "MMM d") : "Never"}
                  </p>
                  <p style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>last used</p>
                </div>
              </div>

              {/* Revoke */}
              <button onClick={() => revokeKey(k.id)} disabled={revoking === k.id}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                  background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA",
                  borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                {revoking === k.id
                  ? <Loader2 style={{ width: 13, height: 13 }} className="anim-spin" />
                  : <Trash2 style={{ width: 13, height: 13 }} />
                }
                Revoke
              </button>
            </div>
          ))
        )}
      </div>

      {/* API Documentation */}
      <div id="api-docs" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>API Reference</h2>
        </div>
        <div style={{ padding: "20px 24px" }}>

          {/* Endpoint 1 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: "#ECFDF5", color: "#065F46", borderRadius: 6, fontFamily: "monospace" }}>GET</span>
              <code style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>/api/v1/profiles</code>
            </div>
            <p style={{ fontSize: 13, color: "#52525B", marginBottom: 10 }}>
              Returns all GBP profiles your key has access to. Use the returned <code>id</code> as <code>profileId</code> when creating posts.
            </p>
            <pre style={{ background: "#0A0A0A", color: "#A7F3D0", padding: "14px 18px", borderRadius: 8, fontSize: 12, lineHeight: 1.7, overflowX: "auto" }}>{`curl -X GET https://your-domain.com/api/v1/profiles \\
  -H "Authorization: Bearer rvk_your_key_here"`}</pre>
          </div>

          {/* Endpoint 2 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: "#EFF6FF", color: "#1E40AF", borderRadius: 6, fontFamily: "monospace" }}>POST</span>
              <code style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>/api/v1/posts</code>
            </div>
            <p style={{ fontSize: 13, color: "#52525B", marginBottom: 10 }}>
              Create a post. Set <code>status</code> to <code>"DRAFT"</code> (default) or <code>"SCHEDULED"</code> (requires <code>scheduledAt</code>).
            </p>
            <pre style={{ background: "#0A0A0A", color: "#A7F3D0", padding: "14px 18px", borderRadius: 8, fontSize: 12, lineHeight: 1.7, overflowX: "auto" }}>{`curl -X POST https://your-domain.com/api/v1/posts \\
  -H "Authorization: Bearer rvk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "profileId":  "cuid_of_profile",
    "content":    "Post body text (max 1500 chars)",
    "status":     "SCHEDULED",
    "scheduledAt": "2025-05-01T10:00:00.000Z",
    "topicType":  "STANDARD",
    "ctaType":    "LEARN_MORE",
    "ctaUrl":     "https://yourpractice.com"
  }'`}</pre>
          </div>

          {/* n8n workflow hint */}
          <div style={{ background: "#FAFAFA", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 8, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Zap style={{ width: 14, height: 14, color: "#F59E0B" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Recommended n8n workflow</p>
            </div>
            <p style={{ fontSize: 12, color: "#52525B", lineHeight: 1.7 }}>
              <strong>Trigger</strong> (Schedule / Webhook / Google Sheets) →{" "}
              <strong>OpenAI Chat</strong> (generate post content) →{" "}
              <strong>HTTP Request</strong> POST <code>/api/v1/posts</code> →{" "}
              <strong>Slack/Email</strong> (notify team of new draft)
            </p>
          </div>
        </div>
      </div>

      {/* Revoked keys (collapsed) */}
      {revokedKeys.length > 0 && (
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, color: "#71717A", fontWeight: 500, padding: "8px 0" }}>
            {revokedKeys.length} revoked key{revokedKeys.length > 1 ? "s" : ""}
          </summary>
          <div style={{ marginTop: 10, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, overflow: "hidden" }}>
            {revokedKeys.map((k, i) => (
              <div key={k.id} style={{
                padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
                borderBottom: i < revokedKeys.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                opacity: 0.55,
              }}>
                <code style={{ fontSize: 12, fontFamily: "monospace", color: "#A1A1AA", flex: 1 }}>
                  {k.keyPrefix}•••••••••
                </code>
                <span style={{ fontSize: 12, color: "#A1A1AA" }}>{k.label}</span>
                <span style={{ fontSize: 10, background: "#F4F4F5", color: "#71717A", padding: "2px 7px", borderRadius: 10 }}>Revoked</span>
              </div>
            ))}
          </div>
        </details>
      )}
        </>
      )}
    </div>
  );
}

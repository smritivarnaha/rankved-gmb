"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Loader2,
  Check,
  History,
  ShieldCheck,
  Settings as SettingsIcon,
  Search,
  Filter,
  ArrowUpRight,
  Zap,
  TrendingUp,
  Globe,
  Copy,
  ExternalLink,
  Save,
  BookOpen,
  ListOrdered,
  Bot,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function WhatsAppAgentCenterPage() {
  const [activeTab, setActiveTab] = useState<"profiles" | "inbox" | "api" | "menu_preview" | "smart_tips">("profiles");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Global Settings state
  const [globalSettings, setGlobalSettings] = useState<any>({});
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Drawer Form state
  const [drawerData, setDrawerData] = useState<any>({});
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, lRes, sRes] = await Promise.all([
        fetch("/api/whatsapp/profiles?t=" + Date.now()),
        fetch("/api/whatsapp/logs?limit=100&t=" + Date.now()),
        fetch("/api/settings/whatsapp?t=" + Date.now()),
      ]);

      if (pRes.ok) {
        const pj = await pRes.json();
        setProfiles(pj.data || []);
      }
      if (lRes.ok) {
        const lj = await lRes.json();
        setLogs(lj.data || []);
      }
      if (sRes.ok) {
        const sj = await sRes.json();
        setGlobalSettings(sj.data || {});
      }
    } catch (e) {
      console.error("Failed to load WhatsApp center data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openDrawer = (profile: any) => {
    setSelectedProfile(profile);
    setDrawerData({
      whatsappEnabled: profile.whatsappEnabled || false,
      whatsappRecipientPhone: profile.whatsappRecipientPhone || "",
      whatsappRecipientName: profile.whatsappRecipientName || "",
      whatsappReportingSchedule: profile.whatsappReportingSchedule || "WEEKLY",
      whatsappCustomDays: profile.whatsappCustomDays || "MON,THU",
      whatsappReportTime: profile.whatsappReportTime || "09:00",
      whatsappNotifyPost: profile.whatsappNotifyPost !== false,
      whatsappNotifyReview: profile.whatsappNotifyReview !== false,
      whatsappNotifyReply: profile.whatsappNotifyReply !== false,
      whatsappNotifyPerformance: profile.whatsappNotifyPerformance !== false,
      whatsappLanguage: profile.whatsappLanguage || "en",
      whatsappCustomInstructions: profile.whatsappCustomInstructions || "",
      whatsappKnowledgeBase: profile.whatsappKnowledgeBase || "",
      whatsappInteractiveMenu: profile.whatsappInteractiveMenu !== false,
    });
    setEditDrawerOpen(true);
  };

  const handleSaveDrawer = async () => {
    if (!selectedProfile) return;
    setSavingDrawer(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/whatsapp/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedProfile.id,
          ...drawerData,
        }),
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: `Settings saved for ${selectedProfile.name}!` });
        setEditDrawerOpen(false);
        fetchAllData();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.error || "Failed to save settings." });
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setSavingDrawer(false);
    }
  };

  const handleTestAlert = async (profileId: string, phone: string) => {
    if (!phone) {
      alert("Please configure a client phone number in Edit Agent first.");
      return;
    }
    setActionLoading("test_" + profileId);
    try {
      const res = await fetch(`/api/profiles/${profileId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_alert", phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Test alert with interactive menu buttons sent to WhatsApp successfully!");
        fetchAllData();
      } else {
        alert("❌ Error: " + (data.error || "Failed to send test alert"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReportNow = async (profileId: string) => {
    setActionLoading("report_" + profileId);
    try {
      const res = await fetch(`/api/profiles/${profileId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_report_now" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Live performance report dispatched to client WhatsApp!");
        fetchAllData();
      } else {
        alert("❌ Error: " + (data.error || "Failed to send report"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      const res = await fetch("/api/settings/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalSettings),
      });
      if (res.ok) {
        alert("✅ Global WhatsApp API settings saved!");
        fetchAllData();
      } else {
        const err = await res.json();
        alert("❌ Failed to save: " + (err.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSavingGlobal(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText("https://gmb.rankved.com/api/whatsapp/webhook");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.whatsappRecipientPhone && p.whatsappRecipientPhone.includes(searchQuery))
  );

  const activeCount = profiles.filter(p => p.whatsappEnabled).length;
  const outboundLogsCount = logs.filter(l => l.direction === "OUTBOUND").length;
  const inboundLogsCount = logs.filter(l => l.direction === "INBOUND").length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
        borderRadius: 16,
        padding: "24px 28px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
        boxShadow: "0 10px 25px -5px rgba(4, 120, 87, 0.25)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)"
          }}>
            <MessageSquare size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                WhatsApp AI Agent & Option Chains
              </h1>
              <span style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: "#10b981",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#fff"
              }}>
                INTERACTIVE CHAINS & RAG MEMORY
              </span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.88)", maxWidth: 680, lineHeight: 1.4 }}>
              Interactive WhatsApp chained menus (1-click instant reports without manual typing), custom clinic knowledge base training, and persistent multi-turn conversational memory.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(6px)"
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Status
        </button>
      </div>

      {/* ── Stat Counters ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Phone size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Active Agents</p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{activeCount} <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>/ {profiles.length} Profiles</span></p>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Dispatched Messages</p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{outboundLogsCount}</p>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fdf2f8", color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Client Queries Handled</p>
            <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{inboundLogsCount}</p>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ListOrdered size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Chained Menu Options</p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>6 Automated Branches</p>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "6px 10px", display: "flex", gap: 8, overflowX: "auto" }}>
        {[
          { id: "profiles", label: "Client Profiles & Schedules", icon: Phone, count: profiles.length },
          { id: "menu_preview", label: "📱 Interactive Menu Chain Flow", icon: ListOrdered },
          { id: "inbox", label: "Live WhatsApp Chat & Activity Logs", icon: History, count: logs.length },
          { id: "api", label: "WhatsApp Cloud API & Webhook", icon: SettingsIcon },
          { id: "smart_tips", label: "⚡ Training & Knowledge Guide", icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                background: active ? "#ecfdf5" : "transparent",
                color: active ? "#047857" : "#64748b",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: active ? "#047857" : "#e2e8f0",
                  color: active ? "#fff" : "#475569",
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Profiles & Schedules ────────────────────────────────── */}
      {activeTab === "profiles" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 360, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "0 12px" }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search profiles or phone numbers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", height: 36, border: "none", background: "transparent", fontSize: 13, outline: "none" }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>Showing {filteredProfiles.length} profiles</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: 12 }}>
                  <th style={{ padding: "12px 16px" }}>Profile Name</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Client WhatsApp Phone</th>
                  <th style={{ padding: "12px 16px" }}>Schedule & Time</th>
                  <th style={{ padding: "12px 16px" }}>Trained Knowledge</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                      No profiles matching search.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span>{p.name}</span>
                          {p.whatsappRecipientName && (
                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>Contact: {p.whatsappRecipientName}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: p.whatsappEnabled ? "#ecfdf5" : "#f1f5f9",
                          color: p.whatsappEnabled ? "#047857" : "#94a3b8"
                        }}>
                          {p.whatsappEnabled ? "● ACTIVE" : "OFF"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155", fontFamily: "monospace" }}>
                        {p.whatsappRecipientPhone ? (
                          <span>{p.whatsappRecipientPhone}</span>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontStyle: "italic", fontFamily: "sans-serif" }}>Not set</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <span style={{ fontWeight: 600 }}>{p.whatsappReportingSchedule || "WEEKLY"}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>at {p.whatsappReportTime || "09:00"}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {p.whatsappKnowledgeBase ? (
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#ecfdf5", color: "#047857", fontWeight: 700 }}>
                            ✓ Knowledge Base Ingested
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}>
                            Standard GBP Data
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            onClick={() => handleTestAlert(p.id, p.whatsappRecipientPhone)}
                            disabled={!p.whatsappRecipientPhone || actionLoading === "test_" + p.id}
                            title="Send test WhatsApp alert"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              color: "#334155",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: p.whatsappRecipientPhone ? "pointer" : "not-allowed",
                              opacity: p.whatsappRecipientPhone ? 1 : 0.5
                            }}
                          >
                            {actionLoading === "test_" + p.id ? <Loader2 size={12} className="animate-spin" /> : "Test Alert"}
                          </button>

                          <button
                            onClick={() => handleSendReportNow(p.id)}
                            disabled={!p.whatsappRecipientPhone || actionLoading === "report_" + p.id}
                            title="Send instant performance report to client"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #bfdbfe",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: p.whatsappRecipientPhone ? "pointer" : "not-allowed",
                              opacity: p.whatsappRecipientPhone ? 1 : 0.5
                            }}
                          >
                            {actionLoading === "report_" + p.id ? <Loader2 size={12} className="animate-spin" /> : "Send Report"}
                          </button>

                          <button
                            onClick={() => openDrawer(p)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#047857",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Train & Configure
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Interactive Menu Chain Simulator / Flow ───────────── */}
      {activeTab === "menu_preview" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>WhatsApp Chained Menu & Option Flow</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Clients can navigate their entire Google Business profile instantly by replying with simple numbers or tapping interactive WhatsApp buttons without any manual typing.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {/* Level 0: Main Greeting & Menu */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ padding: "2px 8px", borderRadius: 4, background: "#047857", color: "#fff", fontSize: 11, fontWeight: 700 }}>LEVEL 0</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#065f46" }}>Main Menu (Triggered by "Hi", "Menu", "Help" or 0)</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: 14, fontSize: 12.5, lineHeight: 1.5, color: "#1e293b", border: "1px solid #dcfce7" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Namaste Dr. Nitika! 🙏</p>
                <p style={{ margin: "4px 0 8px", color: "#475569" }}>Welcome to your Google Business Profile AI Account Manager. Select an option:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span>1️⃣ *Performance Report* 📊 (Calls, Searches)</span>
                  <span>2️⃣ *Latest Google Posts* 📸 (Live content & status)</span>
                  <span>3️⃣ *Recent Reviews & Replies* ⭐ (Customer feedback)</span>
                  <span>4️⃣ *Target Keywords & SEO* 🎯 (Ranking queries)</span>
                  <span>5️⃣ *Clinic FAQs & Doctor Info* 🏥 (Timings, fees)</span>
                  <span>6️⃣ *Ask AI Assistant* 🤖 (Free text Q&A)</span>
                </div>
              </div>
            </div>

            {/* Level 1: Option 1 Performance Branch */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ padding: "2px 8px", borderRadius: 4, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700 }}>BRANCH 1</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#1e40af" }}>1️⃣ Performance Breakdown (Automated)</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: 14, fontSize: 12.5, lineHeight: 1.5, color: "#1e293b", border: "1px solid #dbeafe" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>📊 Performance Digest (Recent 7-14 Days)</p>
                <p style={{ margin: "4px 0 6px", color: "#475569" }}>• 🔍 Search & Maps Views: <b>2,840</b></p>
                <p style={{ margin: "2px 0", color: "#475569" }}>• 📞 Direct Phone Calls: <b>18 calls</b></p>
                <p style={{ margin: "2px 0", color: "#475569" }}>• 🗺️ Direction Requests: <b>14 requests</b></p>
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, border: "1px solid #cbd5e1" }}>[📅 30 Days]</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, border: "1px solid #cbd5e1" }}>[📸 View Posts]</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, border: "1px solid #cbd5e1" }}>[📋 Main Menu]</span>
                </div>
              </div>
            </div>

            {/* Level 1: Option 2 Posts Branch */}
            <div style={{ background: "#fdf4ff", border: "1px solid #f0abfc", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ padding: "2px 8px", borderRadius: 4, background: "#c026d3", color: "#fff", fontSize: 11, fontWeight: 700 }}>BRANCH 2</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#86198f" }}>2️⃣ Latest Published Post & Image</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: 14, fontSize: 12.5, lineHeight: 1.5, color: "#1e293b", border: "1px solid #fae8ff" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>🚀 Google Post Published: Migraine Treatment Tips</p>
                <p style={{ margin: "4px 0 6px", color: "#475569" }}>"Experiencing frequent morning headaches? Dr. Nitika Mahajan explains key triggers..."</p>
                <p style={{ margin: "2px 0", color: "#047857", fontWeight: 600 }}>✅ Status: Live with CALL button</p>
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, border: "1px solid #cbd5e1" }}>[📸 Previous Post]</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, border: "1px solid #cbd5e1" }}>[⭐ Reviews]</span>
                  <span style={{ fontSize: 10.5, padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, border: "1px solid #cbd5e1" }}>[📋 Main Menu]</span>
                </div>
              </div>
            </div>

            {/* Level 1: Option 6 RAG AI Open Q&A */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ padding: "2px 8px", borderRadius: 4, background: "#d97706", color: "#fff", fontSize: 11, fontWeight: 700 }}>BRANCH 6</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>6️⃣ Deep RAG AI Q&A (Persistent Memory)</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: 14, fontSize: 12.5, lineHeight: 1.5, color: "#1e293b", border: "1px solid #fef3c7" }}>
                <p style={{ margin: 0, color: "#2563eb", fontWeight: 600 }}>Client asks: "What are Dr. Nitika's OPD timings this Friday?"</p>
                <p style={{ margin: "6px 0 0", color: "#1e293b" }}>
                  <b>AI Agent:</b> "Dr. Nitika is available for consultations from <b>10:00 AM to 1:30 PM</b> and <b>5:00 PM to 7:30 PM</b>. For emergency appointment slots, patients can reach clinic reception at +91 9876543210."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Inbox & Logs ────────────────────────────────────────── */}
      {activeTab === "inbox" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Live WhatsApp Agent Message Stream</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Real-time feed of alerts sent to clients, option chain responses, and RAG AI chats</p>
            </div>
            <button onClick={fetchAllData} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              No messages logged yet. As posts publish or clients message your WhatsApp number, interactions appear here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {logs.map(log => {
                const isOutbound = log.direction === "OUTBOUND";
                return (
                  <div
                    key={log.id}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: isOutbound ? "#f8fafc" : "#f0fdf4",
                      border: `1px solid ${isOutbound ? "#e2e8f0" : "#bbf7d0"}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 10,
                          background: isOutbound ? "#e2e8f0" : "#16a34a",
                          color: isOutbound ? "#475569" : "#fff"
                        }}>
                          {log.direction}
                        </span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          {log.location?.name || "System"}
                        </span>
                        <span style={{ color: "#64748b" }}>
                          • {log.messageType} • {log.recipientPhone || log.senderPhone}
                        </span>
                      </div>
                      <span style={{ color: "#94a3b8" }}>
                        {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#1e293b", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                      {log.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Global API Configuration ────────────────────────────── */}
      {activeTab === "api" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Meta WhatsApp Cloud API Configuration</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Configure your Meta Developer credentials to send automated WhatsApp updates to clients worldwide.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Phone Number ID</label>
              <input
                type="text"
                placeholder="e.g. 104829104819028"
                value={globalSettings.whatsappPhoneNumberId || ""}
                onChange={e => setGlobalSettings({ ...globalSettings, whatsappPhoneNumberId: e.target.value })}
                style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                placeholder="e.g. 192840192840192"
                value={globalSettings.whatsappBusinessAccountId || ""}
                onChange={e => setGlobalSettings({ ...globalSettings, whatsappBusinessAccountId: e.target.value })}
                style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Permanent System User Access Token
            </label>
            <input
              type="password"
              placeholder={globalSettings.hasToken ? "••••••••••••••••" : "EAAG..."}
              value={globalSettings.whatsappAccessToken || ""}
              onChange={e => setGlobalSettings({ ...globalSettings, whatsappAccessToken: e.target.value })}
              style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
            />
            <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
              Generated in Meta Business Manager &gt; System Users (with whatsapp_business_messaging permissions).
            </span>
          </div>

          {/* Webhook Box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Meta Webhook Callback URL</h4>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
              Copy this URL and paste it into Meta Developer App &gt; WhatsApp &gt; Configuration &gt; Callback URL:
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                readOnly
                value="https://gmb.rankved.com/api/whatsapp/webhook"
                style={{ flex: 1, height: 36, padding: "0 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontFamily: "monospace" }}
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                style={{ height: 36, padding: "0 14px", background: "#2563eb", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <Copy size={12} /> {copiedUrl ? "Copied!" : "Copy URL"}
              </button>
            </div>
            
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Verify Token</label>
              <input
                type="text"
                value={globalSettings.whatsappWebhookVerifyToken || "rankved_wa_verify_token"}
                onChange={e => setGlobalSettings({ ...globalSettings, whatsappWebhookVerifyToken: e.target.value })}
                style={{ width: "100%", height: 36, padding: "0 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>AI Model for WhatsApp Agent</label>
            <select
              value={globalSettings.whatsappAiModel || "gpt-4o"}
              onChange={e => setGlobalSettings({ ...globalSettings, whatsappAiModel: e.target.value })}
              style={{ width: "100%", height: 38, padding: "0 12px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
            >
              <option value="gpt-4o">OpenAI GPT-4o (Recommended — Fast & Highly Intelligent)</option>
              <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet (Nuanced & Professional)</option>
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra Fast)</option>
            </select>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <button
              onClick={handleSaveGlobal}
              disabled={savingGlobal}
              style={{
                padding: "9px 24px",
                borderRadius: 8,
                background: "#047857",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: savingGlobal ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {savingGlobal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{savingGlobal ? "Saving..." : "Save WhatsApp API Settings"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: Smart Training Guide ──────────────────────────────── */}
      {activeTab === "smart_tips" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={22} color="#047857" />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>How to Train Your WhatsApp AI Agent with Custom Knowledge</h3>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "#64748b", lineHeight: 1.5 }}>
            Our RAG (Retrieval-Augmented Generation) engine connects directly to the profile's live Google Business database and your custom trained knowledge base:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 6 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#ecfdf5", color: "#047857", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#047857" }}>Custom Knowledge Base Training</h4>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                In each profile's <b>Train & Configure</b> drawer, paste doctor degrees, OPD timings, consultation fee, clinic address landmarks, insurance accepted, and FAQs. The agent will strictly answer from this source of truth.
              </p>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#ecfdf5", color: "#047857", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#047857" }}>Persistent Multi-Turn Memory</h4>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                Every question and answer is saved in the database per client phone number. The last 15 conversation messages are fed into the LLM context window so clients can ask follow-ups naturally.
              </p>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#ecfdf5", color: "#047857", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#047857" }}>Zero-Typing Option Chains</h4>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                When clients send "Menu" or a number (1-6), the agent returns structured instant templates (calls, views, live post graphics, reviews) with 1-click button navigation.
              </p>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#ecfdf5", color: "#047857", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#047857" }}>Multilingual Hinglish Tone</h4>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                Set preferred language to English, Hinglish, or Hindi. The agent addresses clients with proper honorifics ("Dr. Nitika Mahajan", "Namaste 🙏") and maintains high medical professionalism.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Agent Drawer Modal ────────────────────────────── */}
      {editDrawerOpen && selectedProfile && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 999,
          display: "flex",
          justifyContent: "flex-end",
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            width: "100%",
            maxWidth: 580,
            background: "#fff",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 25px rgba(0,0,0,0.15)",
          }}>
            {/* Drawer Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Train & Configure WhatsApp Agent</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{selectedProfile.name}</p>
              </div>
              <button
                onClick={() => setEditDrawerOpen(false)}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Toggle Switch */}
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Enable WhatsApp AI Agent for this Profile</span>
                <input
                  type="checkbox"
                  checked={drawerData.whatsappEnabled}
                  onChange={e => setDrawerData({ ...drawerData, whatsappEnabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "#047857", cursor: "pointer" }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Client WhatsApp Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={drawerData.whatsappRecipientPhone}
                    onChange={e => setDrawerData({ ...drawerData, whatsappRecipientPhone: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Doctor / Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Nitika Mahajan"
                    value={drawerData.whatsappRecipientName}
                    onChange={e => setDrawerData({ ...drawerData, whatsappRecipientName: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Training Knowledge Base Box */}
              <div style={{ background: "#ecfdf5", padding: 14, borderRadius: 8, border: "1px solid #a7f3d0", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={16} color="#047857" />
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#065f46" }}>
                    Trained Knowledge Base (Source of Truth)
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: "#047857" }}>
                  Add Doctor bio/degrees, consultation fees, OPD timings, emergency clinic number, and FAQs. The AI answers all client questions using this exact data.
                </p>
                <textarea
                  rows={5}
                  placeholder={`• Doctor: Dr. Nitika Mahajan (DM Neurology, AIIMS)\n• OPD Timings: Mon-Sat 10:00 AM - 1:30 PM & 5:00 PM - 7:30 PM\n• Consultation Fee: ₹800\n• Emergency Reception: +91 9876543210\n• Treatments: Migraine, Epilepsy, Stroke rehab, Nerve disorders\n• Address Landmark: Near Metro Pillar 240, Model Town`}
                  value={drawerData.whatsappKnowledgeBase}
                  onChange={e => setDrawerData({ ...drawerData, whatsappKnowledgeBase: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, fontFamily: "inherit", background: "#fff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Reporting Schedule</label>
                <select
                  value={drawerData.whatsappReportingSchedule}
                  onChange={e => setDrawerData({ ...drawerData, whatsappReportingSchedule: e.target.value })}
                  style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
                >
                  <option value="DAILY">Daily (Every Morning)</option>
                  <option value="ALTERNATE_DAYS">Alternate Days</option>
                  <option value="WEEKLY">Weekly (Every Monday — Recommended)</option>
                  <option value="CUSTOM">Custom Schedule</option>
                  <option value="OFF">Off (Alerts only, no periodic digests)</option>
                </select>
              </div>

              {drawerData.whatsappReportingSchedule === "CUSTOM" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Custom Days (e.g. MON, WED, FRI)</label>
                  <input
                    type="text"
                    value={drawerData.whatsappCustomDays}
                    onChange={e => setDrawerData({ ...drawerData, whatsappCustomDays: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Preferred Delivery Time (24h)</label>
                  <input
                    type="time"
                    value={drawerData.whatsappReportTime}
                    onChange={e => setDrawerData({ ...drawerData, whatsappReportTime: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Preferred Language</label>
                  <select
                    value={drawerData.whatsappLanguage}
                    onChange={e => setDrawerData({ ...drawerData, whatsappLanguage: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}
                  >
                    <option value="en">English</option>
                    <option value="hinglish">Hinglish (Hindi + English blend)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              {/* Instant Alert Checkboxes */}
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Real-time Instant Alerts:</span>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={drawerData.whatsappNotifyPost} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyPost: e.target.checked })} style={{ accentColor: "#047857" }} />
                  <span>Send Post Graphic & Link on Publish</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={drawerData.whatsappNotifyReview} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyReview: e.target.checked })} style={{ accentColor: "#047857" }} />
                  <span>Send New Review Star Rating Alerts</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={drawerData.whatsappNotifyReply} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyReply: e.target.checked })} style={{ accentColor: "#047857" }} />
                  <span>Send Auto-Reply Confirmations</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={drawerData.whatsappNotifyPerformance} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyPerformance: e.target.checked })} style={{ accentColor: "#047857" }} />
                  <span>Include Search Views & Call Metrics in Digests</span>
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Persona & Tone Rules</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Always address client respectfully as Dr. Nitika. Highlight patient trust and clinic appointments."
                  value={drawerData.whatsappCustomInstructions}
                  onChange={e => setDrawerData({ ...drawerData, whatsappCustomInstructions: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12.5, fontFamily: "inherit" }}
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditDrawerOpen(false)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDrawer}
                disabled={savingDrawer}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#047857", fontSize: 13, fontWeight: 700, color: "#fff", cursor: savingDrawer ? "default" : "pointer" }}
              >
                {savingDrawer ? "Saving..." : "Save Settings & Training"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

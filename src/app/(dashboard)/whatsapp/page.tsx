"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CheckCheck,
  Smartphone,
  ShieldAlert,
  Sliders,
  Play,
  RotateCcw,
  User,
  Plus,
  Eye,
  Trash2,
  Workflow,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Share2,
  X,
  ChevronDown
} from "lucide-react";

export default function WhatsAppAgentCenterPage() {
  const [activeTab, setActiveTab] = useState<"profiles" | "templates" | "simulator" | "inbox" | "api" | "training_guide">("profiles");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Template Management state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [installingDefaults, setInstallingDefaults] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState<any>({
    name: "",
    title: "",
    category: "UTILITY",
    language: "en_US",
    headerType: "NONE",
    headerContent: "",
    bodyText: "Hello {{1}}, here is an update for {{2}}.",
    footerText: "RankVed GMB AI",
    buttons: [
      { type: "QUICK_REPLY", text: "📊 Performance", payload: "MENU_PERF" },
      { type: "QUICK_REPLY", text: "📋 Main Menu", payload: "MENU_MAIN" },
    ],
    sampleParams: ["Dr. Nitika", "Apex Clinic"],
    submitToMeta: true,
  });

  // Global Settings state
  const [globalSettings, setGlobalSettings] = useState<any>({});
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Drawer Form state
  const [drawerData, setDrawerData] = useState<any>({});
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // WhatsApp Simulator state
  const [simProfileId, setSimProfileId] = useState<string>("");
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string; buttons?: string[] }>>([]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, lRes, sRes] = await Promise.all([
        fetch("/api/whatsapp/profiles?t=" + Date.now()),
        fetch("/api/whatsapp/templates?t=" + Date.now()),
        fetch("/api/whatsapp/logs?limit=100&t=" + Date.now()),
        fetch("/api/settings/whatsapp?t=" + Date.now()),
      ]);

      if (pRes.ok) {
        const pj = await pRes.json();
        const pList = pj.data || [];
        setProfiles(pList);
        if (pList.length > 0 && !simProfileId) {
          setSimProfileId(pList[0].id);
        }
      }
      if (tRes.ok) {
        const tj = await tRes.json();
        setTemplates(tj.data || []);
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

  useEffect(() => {
    if (simProfileId && profiles.length > 0) {
      const p = profiles.find(pr => pr.id === simProfileId);
      if (p) {
        const docName = p.whatsappRecipientName || "Doctor";
        setSimMessages([
          {
            sender: "bot",
            text: `Namaste *${docName}*! 🙏\n\nWelcome to your *RankVed GMB AI Account Manager* for *${p.name}*.\n\nChoose an option below or type any question:\n\n1️⃣ *Performance Report* 📊\n2️⃣ *Latest Google Posts* 📸\n3️⃣ *Recent Reviews & Auto-Replies* ⭐\n4️⃣ *Target Keywords & SEO* 🎯\n5️⃣ *Clinic FAQs & Doctor Info* 🏥\n6️⃣ *Ask AI Assistant* 🤖`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            buttons: ["1. Performance Report", "2. Latest Posts", "3. Reviews & Replies", "5. Clinic FAQs"],
          },
        ]);
      }
    }
  }, [simProfileId, profiles]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [simMessages]);

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

  const handleToggleProfileActive = async (profile: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !profile.whatsappEnabled;
    try {
      const res = await fetch("/api/whatsapp/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: profile.id,
          whatsappEnabled: newStatus,
        }),
      });
      if (res.ok) {
        setProfiles(profiles.map(p => p.id === profile.id ? { ...p, whatsappEnabled: newStatus } : p));
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleTestAlert = async (profileId: string, phone: string) => {
    if (!phone) {
      alert("Please configure a client phone number in Train & Configure first.");
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
        alert("✅ Test WhatsApp alert dispatched successfully!");
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
        alert("✅ Live performance digest dispatched to WhatsApp successfully!");
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

  const handleSyncMetaTemplates = async () => {
    setSyncingMeta(true);
    try {
      const res = await fetch("/api/whatsapp/templates/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Synced ${data.syncedCount} template status(es) with Meta Cloud API!`);
        fetchAllData();
      } else {
        alert("❌ Meta Sync Notice: " + (data.error || "Could not sync. Ensure WABA ID and Token are configured in API settings."));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSyncingMeta(false);
    }
  };

  const handleInstallDefaultTemplates = async () => {
    setInstallingDefaults(true);
    try {
      const res = await fetch("/api/whatsapp/templates/install-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submitToMeta: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ " + data.message);
        fetchAllData();
      } else {
        alert("❌ Error installing templates: " + (data.error || "Failed"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setInstallingDefaults(false);
    }
  };

  const handleSaveCustomTemplate = async () => {
    if (!templateForm.name || !templateForm.bodyText) {
      alert("Please fill in template name and body text.");
      return;
    }
    setActionLoading("save_template");
    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Template saved & registered!");
        setTemplateModalOpen(false);
        fetchAllData();
      } else {
        alert("❌ Error: " + (data.error || "Failed to save template"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      const res = await fetch(`/api/whatsapp/templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendSimulatorMessage = async (textToSend?: string) => {
    const query = textToSend || simInput;
    if (!query.trim() || !simProfileId) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgList = [...simMessages, { sender: "user" as const, text: query, time: timeNow }];
    setSimMessages(newMsgList);
    setSimInput("");
    setSimLoading(true);

    try {
      const res = await fetch(`/api/profiles/${simProfileId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate_chat", messageText: query }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSimMessages([
          ...newMsgList,
          {
            sender: "bot",
            text: data.replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            buttons: ["1. Performance Report", "2. Latest Posts", "3. Reviews", "Main Menu"],
          },
        ]);
      } else {
        setSimMessages([
          ...newMsgList,
          {
            sender: "bot",
            text: "⚠️ " + (data.error || "Error processing request."),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e: any) {
      setSimMessages([
        ...newMsgList,
        {
          sender: "bot",
          text: "⚠️ Network error: " + e.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSimLoading(false);
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

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.whatsappRecipientPhone && p.whatsappRecipientPhone.includes(searchQuery)) ||
      (p.whatsappRecipientName && p.whatsappRecipientName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "ACTIVE") return p.whatsappEnabled;
    if (statusFilter === "INACTIVE") return !p.whatsappEnabled;
    return true;
  });

  const activeCount = profiles.filter(p => p.whatsappEnabled).length;
  const outboundLogsCount = logs.filter(l => l.direction === "OUTBOUND").length;
  const inboundLogsCount = logs.filter(l => l.direction === "INBOUND").length;
  const currentSimProfile = profiles.find(p => p.id === simProfileId);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1240, margin: "0 auto", paddingBottom: 64, color: "#0f172a" }}>
      
      {/* ── Top Header Banner (High-Contrast Gradient & Crisp Typography) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          borderRadius: 12,
          padding: "18px 24px",
          color: "#ffffff",
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MessageSquare size={22} color="#a7f3d0" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#ffffff", letterSpacing: "-0.01em" }}>
                WhatsApp AI Agent & Option Chains
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "rgba(16, 185, 129, 0.3)",
                  border: "1px solid rgba(167, 243, 208, 0.4)",
                  color: "#d1fae5",
                }}
              >
                AiSensy Grade Templates & RAG Flow
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#d1fae5", margin: "4px 0 0", opacity: 0.9, lineHeight: 1.4 }}>
              Automated client communication: official Meta message templates, 1-click option chains, post & review drop alerts, and live interactive AI Q&A.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllData}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            color: "#ffffff",
            padding: "7px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── KPI Stat Cards (4 Grid) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
        {/* Card 1 */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
            <Phone size={18} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Active Agents</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>
              {activeCount} <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>/ {profiles.length} Profiles</span>
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
            <FileText size={18} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Official Templates</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>
              {templates.length} <span style={{ fontSize: 12, fontWeight: 500, color: "#059669" }}>Meta Approved</span>
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", flexShrink: 0 }}>
            <MessageSquare size={18} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Dispatched Messages</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>{outboundLogsCount}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
            <Sparkles size={18} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>RAG Engine Active</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>{globalSettings?.whatsappAiModel || "GPT-4o"}</p>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 6,
          display: "flex",
          gap: 6,
          overflowX: "auto",
          marginBottom: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        {[
          { id: "profiles", label: "Client Profiles & Schedules", icon: Phone, count: profiles.length },
          { id: "templates", label: "📋 Official Templates & Flow Chains (AiSensy Style)", icon: Workflow, count: templates.length },
          { id: "simulator", label: "📱 Interactive WhatsApp Simulator", icon: Smartphone },
          { id: "inbox", label: "Live Activity & Chat Logs", icon: History, count: logs.length },
          { id: "api", label: "Cloud API & Webhook", icon: SettingsIcon },
          { id: "training_guide", label: "5-Pillars Intelligence Guide", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                color: active ? "#065f46" : "#475569",
                background: active ? "#ecfdf5" : "transparent",
                border: active ? "1px solid #a7f3d0" : "1px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} color={active ? "#059669" : "#64748b"} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: active ? "#059669" : "#e2e8f0",
                    color: active ? "#ffffff" : "#475569",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Profiles & Schedules Table ── */}
      {activeTab === "profiles" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          {/* Table Toolbar */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 280 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search profiles, doctor, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    height: 34,
                    padding: "0 10px 0 32px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  height: 34,
                  padding: "0 12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#334155",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: "#64748b" }}>
              Showing <b style={{ color: "#0f172a" }}>{filteredProfiles.length}</b> profiles
            </div>
          </div>

          {/* Profiles Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 16px" }}>Profile & Doctor</th>
                  <th style={{ padding: "10px 14px" }}>Agent Status</th>
                  <th style={{ padding: "10px 14px" }}>Client WhatsApp</th>
                  <th style={{ padding: "10px 14px" }}>Schedule & Time</th>
                  <th style={{ padding: "10px 14px" }}>Knowledge Persona</th>
                  <th style={{ padding: "10px 14px" }}>Alert Triggers</th>
                  <th style={{ padding: "10px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                      No profiles matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p) => {
                    const isEnabled = p.whatsappEnabled;
                    return (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{p.name}</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              {p.whatsappRecipientName ? `👤 ${p.whatsappRecipientName}` : (p.address?.split(",")[0] || "No contact set")}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                          <button
                            onClick={(e) => handleToggleProfileActive(p, e)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 10px",
                              borderRadius: 16,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              border: isEnabled ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                              background: isEnabled ? "#ecfdf5" : "#f1f5f9",
                              color: isEnabled ? "#065f46" : "#64748b",
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isEnabled ? "#10b981" : "#94a3b8" }} />
                            <span>{isEnabled ? "ACTIVE" : "PAUSED"}</span>
                          </button>
                        </td>

                        <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                          {p.whatsappRecipientPhone ? (
                            <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                              {p.whatsappRecipientPhone}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Not configured</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#334155" }}>
                            <Clock size={13} color="#64748b" />
                            <span style={{ fontWeight: 500 }}>
                              {p.whatsappReportingSchedule || "WEEKLY"} @ {p.whatsappReportTime || "09:00"}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                          {p.whatsappCustomInstructions || p.whatsappKnowledgeBase ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                borderRadius: 12,
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#1d4ed8",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              <Sparkles size={11} />
                              Custom Trained
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Default Persona</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span title="Post Notifications" style={{ opacity: p.whatsappNotifyPost !== false ? 1 : 0.25 }}>📸</span>
                            <span title="Review Notifications" style={{ opacity: p.whatsappNotifyReview !== false ? 1 : 0.25 }}>⭐</span>
                            <span title="Auto-Reply Notifications" style={{ opacity: p.whatsappNotifyReply !== false ? 1 : 0.25 }}>💬</span>
                            <span title="Performance Digest" style={{ opacity: p.whatsappNotifyPerformance !== false ? 1 : 0.25 }}>📊</span>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <button
                              onClick={() => handleTestAlert(p.id, p.whatsappRecipientPhone)}
                              disabled={actionLoading === "test_" + p.id}
                              title="Send instant test alert"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {actionLoading === "test_" + p.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} color="#f59e0b" />}
                              <span>Test</span>
                            </button>

                            <button
                              onClick={() => handleSendReportNow(p.id)}
                              disabled={actionLoading === "report_" + p.id}
                              title="Send live performance digest to WhatsApp"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {actionLoading === "report_" + p.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} color="#2563eb" />}
                              <span>Digest</span>
                            </button>

                            <button
                              onClick={() => openDrawer(p)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#059669",
                                border: "1px solid #059669",
                                color: "#ffffff",
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <Sliders size={12} />
                              <span>Train & Config</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Official Templates & Flow Chains (AiSensy Style) ── */}
      {activeTab === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Action Header Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px 20px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                WhatsApp Official Message Templates & Automated Flow Chains
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
                Manage Meta Cloud API approved templates with interactive quick reply buttons and automated multi-step sequences.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleInstallDefaultTemplates}
                disabled={installingDefaults}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#059669",
                  border: "1px solid #059669",
                  color: "#ffffff",
                  padding: "7px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {installingDefaults ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>Install 7 Pre-Built GBP Templates</span>
              </button>

              <button
                onClick={handleSyncMetaTemplates}
                disabled={syncingMeta}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  padding: "7px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={13} className={syncingMeta ? "animate-spin" : ""} />
                <span>Sync with Meta Cloud</span>
              </button>

              <button
                onClick={() => setTemplateModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#2563eb",
                  border: "1px solid #2563eb",
                  color: "#ffffff",
                  padding: "7px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={13} />
                <span>Create Custom Template</span>
              </button>
            </div>
          </div>

          {/* Visual Flow Sequence Map */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1px solid #a7f3d0",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Workflow size={16} color="#059669" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#065f46" }}>
                Active Automated Flow Sequence (AiSensy Chain)
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#166534", whiteSpace: "nowrap" }}>
                1. 📸 Post Published Alert
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#166534", whiteSpace: "nowrap" }}>
                2. ⭐ Review & Auto-Reply Alert
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#166534", whiteSpace: "nowrap" }}>
                3. 📊 Weekly Performance Digest
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#166534", whiteSpace: "nowrap" }}>
                4. 🔘 Interactive Quick Menu Tap
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#059669", color: "#ffffff", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                5. 🤖 Contextual RAG AI Answers
              </div>
            </div>
          </div>

          {/* Template Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {templates.map((tpl) => {
              let buttons: any[] = [];
              try {
                if (tpl.buttonsJson) buttons = JSON.parse(tpl.buttonsJson);
              } catch (e) {}

              const isApproved = tpl.status === "APPROVED";
              const isPending = tpl.status === "PENDING";
              const isRejected = tpl.status === "REJECTED";

              return (
                <div
                  key={tpl.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{tpl.title || tpl.name}</span>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>{tpl.name}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: isApproved ? "#ecfdf5" : isPending ? "#fffbeb" : "#fef2f2",
                          border: isApproved ? "1px solid #a7f3d0" : isPending ? "1px solid #fde68a" : "1px solid #fecaca",
                          color: isApproved ? "#065f46" : isPending ? "#92400e" : "#991b1b",
                        }}
                      >
                        {tpl.status || "APPROVED"}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Message Preview Bubble */}
                  <div style={{ padding: "16px", background: "#efeae2", flex: 1 }}>
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: "0 10px 10px 10px",
                        padding: "12px 14px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        fontSize: 12,
                        lineHeight: 1.4,
                      }}
                    >
                      {/* Header */}
                      {tpl.headerContent && (
                        <div style={{ fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: 4 }}>
                          {tpl.headerContent}
                        </div>
                      )}

                      {/* Body */}
                      <div style={{ color: "#334155", whiteSpace: "pre-line" }}>
                        {tpl.bodyText}
                      </div>

                      {/* Footer & Meta Time */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", borderTop: "1px solid #f8fafc", paddingTop: 4 }}>
                        <span>{tpl.footerText || "RankVed GMB AI"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <span>10:45 AM</span>
                          <CheckCheck size={12} color="#3b82f6" />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {buttons.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                        {buttons.map((b: any, bIdx: number) => (
                          <div
                            key={bIdx}
                            style={{
                              background: "#ffffff",
                              borderRadius: 6,
                              padding: "6px 12px",
                              textAlign: "center",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#2563eb",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            <span>{b.text}</span>
                            {b.type === "URL" && <ExternalLink size={11} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Category: <b>{tpl.category}</b>
                    </span>
                    {!tpl.isSystemDefault && (
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: Interactive WhatsApp Simulator ── */}
      {activeTab === "simulator" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Simulator Controls & Scenario Prompts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                Test WhatsApp AI Agent for Location
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>
                Select a client profile to test live RAG intelligence and template options.
              </p>

              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Active Profile
              </label>
              <select
                value={simProfileId}
                onChange={(e) => setSimProfileId(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#0f172a",
                  outline: "none",
                  marginBottom: 16,
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.whatsappRecipientName ? `(${p.whatsappRecipientName})` : ""}
                  </option>
                ))}
              </select>

              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>
                Quick Test Prompts (1-Click)
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "1. Show our Google Performance report for this month",
                  "2. What are our top local ranking search keywords?",
                  "3. Why did our review count drop recently?",
                  "4. What are our listed clinic hours & consultation fee?",
                  "5. What was our latest published post on Google Maps?",
                ].map((promptText, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendSimulatorMessage(promptText)}
                    disabled={simLoading}
                    style={{
                      textAlign: "left",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#334155",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Mobile Mockup */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 24,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: 580,
            }}
          >
            {/* Phone Top Header */}
            <div style={{ background: "#075e54", padding: "12px 16px", color: "#ffffff", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#128c7e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                {currentSimProfile?.name?.charAt(0) || "G"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentSimProfile?.whatsappRecipientName ? `${currentSimProfile.whatsappRecipientName} | ${currentSimProfile.name}` : (currentSimProfile?.name || "RankVed GMB AI")}
                </div>
                <div style={{ fontSize: 10, color: "#d1fae5" }}>online • RankVed AI Agent</div>
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: 14, background: "#efeae2", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {simMessages.map((msg, mIdx) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={mIdx}
                    style={{
                      alignSelf: isBot ? "flex-start" : "flex-end",
                      maxWidth: "85%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        background: isBot ? "#ffffff" : "#dcf8c6",
                        borderRadius: isBot ? "0 10px 10px 10px" : "10px 0 10px 10px",
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#0f172a",
                        boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
                        whiteSpace: "pre-line",
                        lineHeight: 1.4,
                      }}
                    >
                      {msg.text}
                      <div style={{ textAlign: "right", fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
                        {msg.time}
                      </div>
                    </div>

                    {/* Action Quick Buttons */}
                    {isBot && msg.buttons && msg.buttons.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                        {msg.buttons.map((btnText, bIdx) => (
                          <button
                            key={bIdx}
                            onClick={() => handleSendSimulatorMessage(btnText)}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #bfdbfe",
                              color: "#2563eb",
                              padding: "4px 8px",
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {btnText}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {simLoading && (
                <div style={{ alignSelf: "flex-start", background: "#ffffff", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Agent is analyzing GMB live data...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: "8px 12px", background: "#f0f2f5", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #e2e8f0" }}>
              <input
                type="text"
                placeholder="Type a message or question..."
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendSimulatorMessage();
                }}
                style={{
                  flex: 1,
                  height: 36,
                  padding: "0 12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 18,
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleSendSimulatorMessage()}
                disabled={simLoading || !simInput.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#075e54",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Live Activity & Chat Logs ── */}
      {activeTab === "inbox" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#0f172a" }}>WhatsApp Message Delivery & Inbound Audit Log</h3>
            <span style={{ fontSize: 11, color: "#64748b" }}>Total: {logs.length} logged events</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 16px" }}>Timestamp</th>
                  <th style={{ padding: "10px 14px" }}>Direction</th>
                  <th style={{ padding: "10px 14px" }}>Recipient / From</th>
                  <th style={{ padding: "10px 14px" }}>Profile</th>
                  <th style={{ padding: "10px 14px" }}>Message Content</th>
                  <th style={{ padding: "10px 16px", textAlign: "right" }}>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "#94a3b8" }}>
                      No messages dispatched yet. Use "Test Alert" or trigger scheduled reports to view live logs.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 16px", color: "#64748b", fontSize: 11 }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: log.direction === "OUTBOUND" ? "#eff6ff" : "#f0fdf4",
                            color: log.direction === "OUTBOUND" ? "#1e40af" : "#166534",
                          }}
                        >
                          {log.direction}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                        {log.recipientPhone}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#334155", fontWeight: 500 }}>
                        {log.location?.name || "Global"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.messageBody}
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
                          {log.status || "SENT"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Cloud API & Webhook ── */}
      {activeTab === "api" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>Meta Cloud API Credentials</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Enter your official Meta WhatsApp Cloud API credentials to enable instant multi-location alerts.
            </p>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                value={globalSettings.whatsappPhoneNumberId || ""}
                onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappPhoneNumberId: e.target.value })}
                placeholder="e.g. 104928374829102"
                style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                WhatsApp Business Account ID (WABA)
              </label>
              <input
                type="text"
                value={globalSettings.whatsappBusinessAccountId || ""}
                onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappBusinessAccountId: e.target.value })}
                placeholder="e.g. 293847291029384"
                style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Permanent System User Access Token
              </label>
              <input
                type="password"
                value={globalSettings.whatsappAccessToken || ""}
                onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappAccessToken: e.target.value })}
                placeholder="EAAG..."
                style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <button
              onClick={handleSaveGlobal}
              disabled={savingGlobal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#059669",
                border: "none",
                color: "#ffffff",
                padding: "9px 16px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                marginTop: 6,
              }}
            >
              {savingGlobal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Meta Cloud Credentials</span>
            </button>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>Inbound Webhook Configuration</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Set this Webhook URL in Meta Developer Dashboard to receive client replies and button clicks.
            </p>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Webhook Callback URL
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value="https://gmb.rankved.com/api/whatsapp/webhook"
                  style={{ flex: 1, height: 36, padding: "0 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 11, color: "#334155" }}
                />
                <button
                  onClick={copyWebhookUrl}
                  style={{
                    padding: "0 12px",
                    background: copiedUrl ? "#ecfdf5" : "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: copiedUrl ? "#059669" : "#334155",
                  }}
                >
                  {copiedUrl ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Webhook Verification Token
              </label>
              <input
                type="text"
                value={globalSettings.whatsappWebhookSecret || "rankved_gmb_webhook_secure_token"}
                onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappWebhookSecret: e.target.value })}
                style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: 5-Pillars Intelligence Guide ── */}
      {activeTab === "training_guide" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            {
              icon: "🏥",
              title: "1. Rich Doctor & Clinic Persona",
              desc: "In each profile's Edit Agent drawer, add specific clinic facts (timings, fees, escalation manager). The AI answers questions with 100% precision.",
            },
            {
              icon: "📍",
              title: "2. Local SEO & Search Query Ingestion",
              desc: "When generating reports or answering client questions, the AI pulls top ranking local keywords directly from Google Performance API.",
            },
            {
              icon: "🛡️",
              title: "3. Review Drop & Algorithm Explanations",
              desc: "If Google's algorithm filters or drops a review, the agent proactively explains why it happened and advises on compliant recovery steps.",
            },
            {
              icon: "🔗",
              title: "4. AiSensy-Grade Option Chains",
              desc: "Clients navigate via numbered menus (1. Stats, 2. Posts, 3. Reviews) without needing to type long prompts.",
            },
            {
              icon: "🌐",
              title: "5. Multi-Lingual Tone Formatting",
              desc: "Supports Hindi, Hinglish, and English with professional, polite, and medical-grade etiquette.",
            },
          ].map((pillar, pIdx) => (
            <div key={pIdx} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 24 }}>{pillar.icon}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#0f172a" }}>{pillar.title}</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{pillar.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Slide-Over Edit Agent Drawer (5 Pillars of Intelligence) ── */}
      {editDrawerOpen && selectedProfile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setEditDrawerOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Train & Configure WhatsApp AI Agent
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{selectedProfile.name}</p>
              </div>
              <button onClick={() => setEditDrawerOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Enable Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "block" }}>Enable WhatsApp Agent</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Allow automated reports and AI chat</span>
                </div>
                <input
                  type="checkbox"
                  checked={drawerData.whatsappEnabled}
                  onChange={(e) => setDrawerData({ ...drawerData, whatsappEnabled: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
              </div>

              {/* Recipient Phone & Doctor Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Client WhatsApp (E.164)
                  </label>
                  <input
                    type="text"
                    value={drawerData.whatsappRecipientPhone || ""}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappRecipientPhone: e.target.value })}
                    placeholder="+919876543210"
                    style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Doctor / Client Name
                  </label>
                  <input
                    type="text"
                    value={drawerData.whatsappRecipientName || ""}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappRecipientName: e.target.value })}
                    placeholder="e.g. Dr. Nitika"
                    style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Reporting Schedule */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Reporting Frequency
                  </label>
                  <select
                    value={drawerData.whatsappReportingSchedule || "WEEKLY"}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappReportingSchedule: e.target.value })}
                    style={{ width: "100%", height: 36, padding: "0 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                    <option value="CUSTOM_DAYS">Custom Days (e.g. Mon, Thu)</option>
                    <option value="WEEKLY">Weekly (Monday)</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    value={drawerData.whatsappReportTime || "09:00"}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappReportTime: e.target.value })}
                    style={{ width: "100%", height: 36, padding: "0 8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Notification Triggers */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                  Automated Event Triggers
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {[
                    { key: "whatsappNotifyPost", label: "Post Published Notification (Image + CTA)" },
                    { key: "whatsappNotifyReview", label: "New Review Alert (Stars + Reviewer Name)" },
                    { key: "whatsappNotifyReply", label: "Review Auto-Reply Update" },
                    { key: "whatsappNotifyPerformance", label: "Performance Digest (Calls, Directions)" },
                  ].map((item) => (
                    <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={drawerData[item.key] !== false}
                        onChange={(e) => setDrawerData({ ...drawerData, [item.key]: e.target.checked })}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Knowledge Base */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  🏥 Clinic Persona & Knowledge Base (Pillar 1)
                </label>
                <textarea
                  rows={4}
                  value={drawerData.whatsappKnowledgeBase || ""}
                  onChange={(e) => setDrawerData({ ...drawerData, whatsappKnowledgeBase: e.target.value })}
                  placeholder="e.g. Address client as Dr. Nitika. Timings: 10 AM - 7 PM. Consultation Fee: ₹800. Clinic Manager: +91 9876543210. Specialty: Infertility & IVF."
                  style={{ width: "100%", padding: 10, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                />
              </div>

              {/* Custom Instructions */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Custom AI Behavior Instructions
                </label>
                <textarea
                  rows={3}
                  value={drawerData.whatsappCustomInstructions || ""}
                  onChange={(e) => setDrawerData({ ...drawerData, whatsappCustomInstructions: e.target.value })}
                  placeholder="e.g. Keep replies concise with bullet points. Always encourage doctor about positive review trends."
                  style={{ width: "100%", padding: 10, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditDrawerOpen(false)}
                style={{ padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDrawer}
                disabled={savingDrawer}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  background: "#059669",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {savingDrawer ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Agent Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal for Custom Template Creation ── */}
      {templateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setTemplateModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>Create Meta Message Template</h3>
              <button onClick={() => setTemplateModalOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Template Name (lowercase, no spaces)
              </label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g. gbp_clinic_appointment_reminder"
                style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                Category
              </label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                style={{ width: "100%", height: 36, padding: "0 10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              >
                <option value="UTILITY">UTILITY (Alerts, Updates)</option>
                <option value="MARKETING">MARKETING (Promotions, Offers)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                {"Body Message (use {{1}}, {{2}} for variables)"}
              </label>
              <textarea
                rows={4}
                value={templateForm.bodyText}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                style={{ width: "100%", padding: 10, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="submitToMetaCheck"
                checked={templateForm.submitToMeta}
                onChange={(e) => setTemplateForm({ ...templateForm, submitToMeta: e.target.checked })}
              />
              <label htmlFor="submitToMetaCheck" style={{ fontSize: 12, color: "#334155", cursor: "pointer" }}>
                Submit directly to Meta Graph API for automated WABA approval
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
              <button
                onClick={() => setTemplateModalOpen(false)}
                style={{ padding: "8px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomTemplate}
                disabled={actionLoading === "save_template"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {actionLoading === "save_template" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save & Register Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

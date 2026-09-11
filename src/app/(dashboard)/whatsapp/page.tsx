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
  ChevronDown,
  Key,
  Shield,
  Building,
  CheckSquare
} from "lucide-react";

// Helper for vibrant profile avatar colors
function getAvatarColor(name: string = "") {
  const colors = [
    { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
    { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
    { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
    { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
    { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
    { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
    { bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" },
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
}

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
  const [copiedToken, setCopiedToken] = useState(false);

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

  const copyVerifyToken = () => {
    navigator.clipboard.writeText(globalSettings.whatsappWebhookSecret || "rankved_gmb_webhook_secure_token");
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
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
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: "100%", margin: "0 auto", paddingBottom: 64, color: "#0f172a" }}>
      
      {/* ── Top Header Banner (Vibrant WhatsApp Deep Emerald Gradient) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #075E54 0%, #128C7E 50%, #25D366 100%)",
          borderRadius: 14,
          padding: "18px 22px",
          color: "#ffffff",
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 10px 25px -5px rgba(18, 140, 126, 0.3), 0 8px 10px -6px rgba(18, 140, 126, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(255, 255, 255, 0.2)",
              border: "1.5px solid rgba(255, 255, 255, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <MessageSquare size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.02em" }}>
                WhatsApp AI Agent & Option Chains
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: "#ffffff",
                  color: "#075E54",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                AiSensy Grade Templates & RAG Flow
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#f0fdf4", margin: "4px 0 0", opacity: 0.95, lineHeight: 1.4, fontWeight: 400 }}>
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
            gap: 8,
            background: "#ffffff",
            border: "none",
            color: "#075E54",
            padding: "9px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} color="#075E54" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── KPI Stat Cards with Vibrant Colored Left Borders & Badges ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 18 }}>
        {/* Card 1 - Active Agents (Emerald) */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "5px solid #10B981", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#ECFDF5", border: "1.5px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
            <Phone size={19} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Active WhatsApp Agents</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "2px 0 0" }}>
              {activeCount} <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>/ {profiles.length} Profiles</span>
            </p>
          </div>
        </div>

        {/* Card 2 - Official Templates (Royal Blue) */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "5px solid #2563EB", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#EFF6FF", border: "1.5px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", flexShrink: 0 }}>
            <FileText size={19} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Official Templates</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "2px 0 0" }}>
              {templates.length} <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "1px 6px", borderRadius: 4, border: "1px solid #A7F3D0" }}>Meta Approved</span>
            </p>
          </div>
        </div>

        {/* Card 3 - Dispatched Messages (Purple) */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "5px solid #8B5CF6", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F5F3FF", border: "1.5px solid #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED", flexShrink: 0 }}>
            <MessageSquare size={19} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Dispatched Messages</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "2px 0 0" }}>{outboundLogsCount}</p>
          </div>
        </div>

        {/* Card 4 - RAG Engine (Golden Amber) */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: "5px solid #F59E0B", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#FFFBEB", border: "1.5px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706", flexShrink: 0 }}>
            <Sparkles size={19} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>RAG Engine Active</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "2px 0 0" }}>{globalSettings?.whatsappAiModel || "GPT-4o"}</p>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar (Wrapped & High-Contrast Pill Buttons) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "8px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        {[
          { id: "profiles", label: "Client Profiles & Schedules", icon: Phone, count: profiles.length },
          { id: "templates", label: "📋 Official Templates & Flow Chains (AiSensy Style)", icon: Workflow, count: templates.length },
          { id: "simulator", label: "📱 Interactive WhatsApp Simulator", icon: Smartphone },
          { id: "inbox", label: "Live Activity & Chat Logs", icon: History, count: logs.length },
          { id: "api", label: "⚙️ Cloud API & Meta Setup", icon: SettingsIcon },
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
                fontWeight: active ? 800 : 600,
                color: active ? "#ffffff" : "#334155",
                background: active ? "#075E54" : "#F8FAFC",
                border: active ? "1px solid #075E54" : "1px solid #E2E8F0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                boxShadow: active ? "0 2px 6px rgba(7, 94, 84, 0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "#F1F5F9";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "#F8FAFC";
              }}
            >
              <Icon size={15} color={active ? "#A7F3D0" : "#64748B"} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 12,
                    background: active ? "rgba(255,255,255,0.25)" : "#E2E8F0",
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
        <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          {/* Table Toolbar */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #F1F5F9",
              background: "#F8FAFC",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 280 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search profiles, doctor, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px 0 32px",
                    background: "#ffffff",
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  height: 36,
                  padding: "0 12px",
                  background: "#ffffff",
                  border: "1px solid #CBD5E1",
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

            <div style={{ fontSize: 12, color: "#64748B" }}>
              Showing <b style={{ color: "#0F172A" }}>{filteredProfiles.length}</b> profiles
            </div>
          </div>

          {/* Profiles Table with Fixed Layout and No Cut Off */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "12px 16px", width: "32%" }}>Profile & Doctor</th>
                  <th style={{ padding: "12px 12px", width: "11%" }}>Agent Status</th>
                  <th style={{ padding: "12px 12px", width: "15%" }}>Client WhatsApp</th>
                  <th style={{ padding: "12px 12px", width: "14%" }}>Schedule & Time</th>
                  <th style={{ padding: "12px 12px", width: "12%" }}>Knowledge</th>
                  <th style={{ padding: "12px 12px", width: "8%" }}>Triggers</th>
                  <th style={{ padding: "12px 16px", width: "18%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#94A3B8" }}>
                      No profiles matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p) => {
                    const isEnabled = p.whatsappEnabled;
                    const avatar = getAvatarColor(p.name);
                    const initials = (p.name || "G").charAt(0).toUpperCase();

                    return (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: avatar.bg,
                                border: `1.5px solid ${avatar.border}`,
                                color: avatar.text,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: 13,
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              {initials}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  fontSize: 13,
                                  lineHeight: 1.35,
                                  wordBreak: "break-word",
                                }}
                              >
                                {p.name}
                              </span>
                              <span style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.whatsappRecipientName ? `👤 Doctor: ${p.whatsappRecipientName}` : (p.address?.split(",")[0] || "No contact set")}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <button
                            onClick={(e) => handleToggleProfileActive(p, e)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              border: isEnabled ? "1px solid #A7F3D0" : "1px solid #E2E8F0",
                              background: isEnabled ? "#ECFDF5" : "#F1F5F9",
                              color: isEnabled ? "#065F46" : "#64748B",
                              boxShadow: isEnabled ? "0 1px 3px rgba(16, 185, 129, 0.15)" : "none",
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isEnabled ? "#10B981" : "#94A3B8" }} />
                            <span>{isEnabled ? "ACTIVE" : "PAUSED"}</span>
                          </button>
                        </td>

                        <td style={{ padding: "12px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          {p.whatsappRecipientPhone ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "3px 8px", borderRadius: 6 }}>
                              <Phone size={11} color="#16A34A" />
                              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#166534" }}>
                                {p.whatsappRecipientPhone}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>Not set</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#1E40AF", background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            <Clock size={11} color="#2563EB" />
                            <span>
                              {p.whatsappReportingSchedule || "WEEKLY"} @ {p.whatsappReportTime || "09:00"}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "12px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          {p.whatsappCustomInstructions || p.whatsappKnowledgeBase ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 7px",
                                borderRadius: 10,
                                background: "#F5F3FF",
                                border: "1px solid #DDD6FE",
                                color: "#6D28D9",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              <Sparkles size={10} color="#7C3AED" />
                              Trained
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>Default</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span title="Post Notifications" style={{ opacity: p.whatsappNotifyPost !== false ? 1 : 0.25, fontSize: 13 }}>📸</span>
                            <span title="Review Notifications" style={{ opacity: p.whatsappNotifyReview !== false ? 1 : 0.25, fontSize: 13 }}>⭐</span>
                            <span title="Auto-Reply Notifications" style={{ opacity: p.whatsappNotifyReply !== false ? 1 : 0.25, fontSize: 13 }}>💬</span>
                            <span title="Performance Digest" style={{ opacity: p.whatsappNotifyPerformance !== false ? 1 : 0.25, fontSize: 13 }}>📊</span>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <button
                              onClick={() => handleTestAlert(p.id, p.whatsappRecipientPhone)}
                              disabled={actionLoading === "test_" + p.id}
                              title="Send instant test alert"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                background: "#FFFBEB",
                                border: "1px solid #FDE68A",
                                color: "#B45309",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {actionLoading === "test_" + p.id ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} color="#D97706" />}
                              <span>Test</span>
                            </button>

                            <button
                              onClick={() => handleSendReportNow(p.id)}
                              disabled={actionLoading === "report_" + p.id}
                              title="Send live performance digest to WhatsApp"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                background: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                color: "#1D4ED8",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {actionLoading === "report_" + p.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} color="#2563EB" />}
                              <span>Digest</span>
                            </button>

                            <button
                              onClick={() => openDrawer(p)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#059669",
                                border: "none",
                                color: "#ffffff",
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(5, 150, 105, 0.2)",
                              }}
                            >
                              <Sliders size={11} />
                              <span>Config</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Action Header Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: "18px 22px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                WhatsApp Official Message Templates & Automated Flow Chains
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: "3px 0 0" }}>
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
                  border: "none",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
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
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
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
                  background: "#2563EB",
                  border: "none",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
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
              background: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)",
              border: "1.5px solid #A7F3D0",
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Workflow size={18} color="#059669" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                Active Automated Flow Sequence (AiSensy Chain)
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ background: "#ffffff", border: "1.5px solid #BBF7D0", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#166534", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                1. 📸 Post Published Alert
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#ffffff", border: "1.5px solid #BBF7D0", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#166534", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                2. ⭐ Review & Auto-Reply Alert
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#ffffff", border: "1.5px solid #BBF7D0", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#166534", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                3. 📊 Weekly Performance Digest
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#ffffff", border: "1.5px solid #BBF7D0", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#166534", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                4. 🔘 Interactive Quick Menu Tap
              </div>
              <ArrowRight size={14} color="#059669" />
              <div style={{ background: "#059669", color: "#ffffff", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(5, 150, 105, 0.3)" }}>
                5. 🤖 Contextual RAG AI Answers
              </div>
            </div>
          </div>

          {/* Template Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
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
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  {/* Card Header with Category & Status */}
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{tpl.title || tpl.name}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748B" }}>{tpl.name}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 12,
                          background: isApproved ? "#ECFDF5" : isPending ? "#FFFBEB" : "#FEF2F2",
                          border: isApproved ? "1px solid #A7F3D0" : isPending ? "1px solid #FDE68A" : "1px solid #FECACA",
                          color: isApproved ? "#065F46" : isPending ? "#92400E" : "#991B1B",
                        }}
                      >
                        {tpl.status || "APPROVED"}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Message Preview Bubble with Authentic Chat Wallpaper */}
                  <div style={{ padding: "18px", background: "#EFEAE2", flex: 1 }}>
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: "0 12px 12px 12px",
                        padding: "14px 16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {/* Header */}
                      {tpl.headerContent && (
                        <div style={{ fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #F1F5F9", paddingBottom: 6 }}>
                          {tpl.headerContent}
                        </div>
                      )}

                      {/* Body */}
                      <div style={{ color: "#334155", whiteSpace: "pre-line" }}>
                        {tpl.bodyText}
                      </div>

                      {/* Footer & Meta Time */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", borderTop: "1px solid #F8FAFC", paddingTop: 6 }}>
                        <span style={{ fontWeight: 600 }}>{tpl.footerText || "RankVed GMB AI"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span>10:45 AM</span>
                          <CheckCheck size={13} color="#34B7F1" />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (WhatsApp Blue Pill Buttons) */}
                    {buttons.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {buttons.map((b: any, bIdx: number) => (
                          <div
                            key={bIdx}
                            style={{
                              background: "#ffffff",
                              borderRadius: 8,
                              padding: "8px 14px",
                              textAlign: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#007AFF",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            <span>{b.text}</span>
                            {b.type === "URL" && <ExternalLink size={12} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div style={{ padding: "12px 18px", borderTop: "1px solid #F1F5F9", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>
                      Category: <b style={{ color: "#0F172A" }}>{tpl.category}</b>
                    </span>
                    {!tpl.isSystemDefault && (
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {/* Simulator Controls & Scenario Prompts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "#0F172A" }}>
                Test WhatsApp AI Agent for Location
              </h3>
              <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 16px" }}>
                Select a client profile to test live RAG intelligence and template options.
              </p>

              <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Active Profile
              </label>
              <select
                value={simProfileId}
                onChange={(e) => setSimProfileId(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#0F172A",
                  outline: "none",
                  marginBottom: 18,
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.whatsappRecipientName ? `(${p.whatsappRecipientName})` : ""}
                  </option>
                ))}
              </select>

              <h4 style={{ fontSize: 12, fontWeight: 800, color: "#334155", margin: "0 0 10px" }}>
                Quick Test Prompts (1-Click)
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EFF6FF";
                      e.currentTarget.style.borderColor = "#BFDBFE";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Mobile Mockup Screen */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #CBD5E1",
              borderRadius: 24,
              boxShadow: "0 12px 30px -5px rgba(0,0,0,0.12)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: 600,
            }}
          >
            {/* Phone Top Header (WhatsApp Dark Green) */}
            <div style={{ background: "#075E54", padding: "14px 18px", color: "#ffffff", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, border: "1px solid rgba(255,255,255,0.3)" }}>
                {currentSimProfile?.name?.charAt(0) || "G"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentSimProfile?.whatsappRecipientName ? `${currentSimProfile.whatsappRecipientName} | ${currentSimProfile.name}` : (currentSimProfile?.name || "RankVed GMB AI")}
                </div>
                <div style={{ fontSize: 11, color: "#D1FAE5" }}>online • RankVed AI Agent</div>
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: 16, background: "#EFEAE2", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
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
                        background: isBot ? "#ffffff" : "#DCF8C6",
                        borderRadius: isBot ? "0 12px 12px 12px" : "12px 0 12px 12px",
                        padding: "10px 14px",
                        fontSize: 12,
                        color: "#0F172A",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        whiteSpace: "pre-line",
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                      <div style={{ textAlign: "right", fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
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
                              border: "1px solid #BFDBFE",
                              color: "#2563EB",
                              padding: "5px 10px",
                              borderRadius: 14,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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
                <div style={{ alignSelf: "flex-start", background: "#ffffff", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
                  <Loader2 size={13} className="animate-spin" color="#059669" />
                  <span>Agent is analyzing GMB live data...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: "10px 14px", background: "#F0F2F5", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #E2E8F0" }}>
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
                  height: 38,
                  padding: "0 14px",
                  background: "#ffffff",
                  border: "1px solid #CBD5E1",
                  borderRadius: 20,
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleSendSimulatorMessage()}
                disabled={simLoading || !simInput.trim()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#075E54",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(7, 94, 84, 0.3)",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Live Activity & Chat Logs ── */}
      {activeTab === "inbox" && (
        <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#0F172A" }}>WhatsApp Message Delivery & Inbound Audit Log</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Total: {logs.length} logged events</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Timestamp</th>
                  <th style={{ padding: "12px 14px" }}>Direction</th>
                  <th style={{ padding: "12px 14px" }}>Recipient / From</th>
                  <th style={{ padding: "12px 14px" }}>Profile</th>
                  <th style={{ padding: "12px 14px" }}>Message Content</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "#94A3B8" }}>
                      No messages dispatched yet. Use "Test Alert" or trigger scheduled reports to view live logs.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 18px", color: "#64748B", fontSize: 11 }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: log.direction === "OUTBOUND" ? "#EFF6FF" : "#F0FDF4",
                            color: log.direction === "OUTBOUND" ? "#1E40AF" : "#166534",
                            border: log.direction === "OUTBOUND" ? "1px solid #BFDBFE" : "1px solid #BBF7D0",
                          }}
                        >
                          {log.direction}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>
                        {log.recipientPhone}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#334155", fontWeight: 600 }}>
                        {log.location?.name || "Global"}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.messageBody}
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", background: "#ECFDF5", padding: "2px 8px", borderRadius: 4, border: "1px solid #A7F3D0" }}>
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

      {/* ── TAB 5: Cloud API & Meta Setup (With Official Links & Copy Actions) ── */}
      {activeTab === "api" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* 🌟 1-Click Official Meta Developer Portal Launchpad */}
          <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                <Globe size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                  Official Meta Developer Portal & Setup Links
                </h3>
                <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
                  Open these official Meta links in new tabs to create your WhatsApp Cloud App, get tokens, and subscribe to Webhooks.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  textDecoration: "none",
                  color: "#0F172A",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2563EB";
                  e.currentTarget.style.background = "#EFF6FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Building size={16} color="#2563EB" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Meta Apps Dashboard</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>Create & Manage WhatsApp App</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#64748B" />
              </a>

              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  textDecoration: "none",
                  color: "#0F172A",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#059669";
                  e.currentTarget.style.background = "#ECFDF5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Key size={16} color="#059669" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Cloud API Quickstart</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>Get Phone Number ID & Test Token</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#64748B" />
              </a>

              <a
                href="https://business.facebook.com/settings/whatsapp-business-accounts/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  textDecoration: "none",
                  color: "#0F172A",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7C3AED";
                  e.currentTarget.style.background = "#F5F3FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Shield size={16} color="#7C3AED" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Business Accounts (WABA)</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>Find WhatsApp Account ID</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#64748B" />
              </a>

              <a
                href="https://business.facebook.com/settings/system-users"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  textDecoration: "none",
                  color: "#0F172A",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#D97706";
                  e.currentTarget.style.background = "#FFFBEB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <User size={16} color="#D97706" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Permanent System Users</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>Generate Never-Expiring Token</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#64748B" />
              </a>
            </div>
          </div>

          {/* Form & Webhook Settings Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            {/* Left Box: Meta Cloud Credentials */}
            <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Key size={18} color="#059669" />
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0F172A" }}>Meta Cloud API Credentials</h3>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Enter your official Meta WhatsApp Cloud API credentials to enable instant multi-location alerts.
              </p>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={globalSettings.whatsappPhoneNumberId || ""}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappPhoneNumberId: e.target.value })}
                  placeholder="e.g. 104928374829102"
                  style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  WhatsApp Business Account ID (WABA)
                </label>
                <input
                  type="text"
                  value={globalSettings.whatsappBusinessAccountId || ""}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappBusinessAccountId: e.target.value })}
                  placeholder="e.g. 293847291029384"
                  style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  Permanent System User Access Token
                </label>
                <input
                  type="password"
                  value={globalSettings.whatsappAccessToken || ""}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappAccessToken: e.target.value })}
                  placeholder="EAAG..."
                  style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
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
                  padding: "10px 18px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  marginTop: 6,
                  boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)",
                }}
              >
                {savingGlobal ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Meta Cloud Credentials</span>
              </button>
            </div>

            {/* Right Box: Inbound Webhook Configuration */}
            <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Workflow size={18} color="#2563EB" />
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0F172A" }}>Inbound Webhook Setup</h3>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                Copy and paste these exact values into your Meta Developer Portal under <b>WhatsApp ➔ Configuration ➔ Webhook</b>.
              </p>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  Callback URL (Paste in Meta Dashboard)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value="https://gmb.rankved.com/api/whatsapp/webhook"
                    style={{ flex: 1, height: 38, padding: "0 12px", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 11, color: "#334155", fontWeight: 600 }}
                  />
                  <button
                    onClick={copyWebhookUrl}
                    style={{
                      padding: "0 14px",
                      background: copiedUrl ? "#ECFDF5" : "#ffffff",
                      border: "1px solid #CBD5E1",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      color: copiedUrl ? "#059669" : "#334155",
                    }}
                  >
                    {copiedUrl ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  Verify Token (Paste in Meta Dashboard)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={globalSettings.whatsappWebhookSecret || "rankved_gmb_webhook_secure_token"}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappWebhookSecret: e.target.value })}
                    style={{ flex: 1, height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                  />
                  <button
                    onClick={copyVerifyToken}
                    style={{
                      padding: "0 14px",
                      background: copiedToken ? "#ECFDF5" : "#ffffff",
                      border: "1px solid #CBD5E1",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      color: copiedToken ? "#059669" : "#334155",
                    }}
                  >
                    {copiedToken ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#1D4ED8" }}>
                  <CheckSquare size={13} color="#2563EB" />
                  <span>Webhook Subscription Field:</span>
                </div>
                <p style={{ fontSize: 11, color: "#1E40AF", margin: "2px 0 0" }}>
                  Subscribe to the <b>messages</b> field to receive real-time client WhatsApp replies and interactive button taps.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: 5-Pillars Intelligence Guide ── */}
      {activeTab === "training_guide" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {[
            {
              icon: "🏥",
              title: "1. Rich Doctor & Clinic Persona",
              border: "#EC4899",
              bg: "#FDF2F8",
              desc: "In each profile's Edit Agent drawer, add specific clinic facts (timings, fees, escalation manager). The AI answers questions with 100% precision.",
            },
            {
              icon: "📍",
              title: "2. Local SEO & Search Query Ingestion",
              border: "#3B82F6",
              bg: "#EFF6FF",
              desc: "When generating reports or answering client questions, the AI pulls top ranking local keywords directly from Google Performance API.",
            },
            {
              icon: "🛡️",
              title: "3. Review Drop & Algorithm Explanations",
              border: "#F59E0B",
              bg: "#FFFBEB",
              desc: "If Google's algorithm filters or drops a review, the agent proactively explains why it happened and advises on compliant recovery steps.",
            },
            {
              icon: "🔗",
              title: "4. AiSensy-Grade Option Chains",
              border: "#8B5CF6",
              bg: "#F5F3FF",
              desc: "Clients navigate via numbered menus (1. Stats, 2. Posts, 3. Reviews) without needing to type long prompts.",
            },
            {
              icon: "🌐",
              title: "5. Multi-Lingual Tone Formatting",
              border: "#10B981",
              bg: "#ECFDF5",
              desc: "Supports Hindi, Hinglish, and English with professional, polite, and medical-grade etiquette.",
            },
          ].map((pillar, pIdx) => (
            <div key={pIdx} style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderTop: `4px solid ${pillar.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <span style={{ fontSize: 26 }}>{pillar.icon}</span>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#0F172A" }}>{pillar.title}</h3>
              <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.5 }}>{pillar.desc}</p>
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
              maxWidth: 540,
              background: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 25px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                  Train & Configure WhatsApp AI Agent
                </h3>
                <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>{selectedProfile.name}</p>
              </div>
              <button onClick={() => setEditDrawerOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div style={{ flex: 1, padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Enable Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, background: "#F0FDF4", borderRadius: 10, border: "1.5px solid #BBF7D0" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#166534", display: "block" }}>Enable WhatsApp Agent</span>
                  <span style={{ fontSize: 11, color: "#15803D" }}>Allow automated reports and interactive AI chat</span>
                </div>
                <input
                  type="checkbox"
                  checked={drawerData.whatsappEnabled}
                  onChange={(e) => setDrawerData({ ...drawerData, whatsappEnabled: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: "pointer", accentColor: "#059669" }}
                />
              </div>

              {/* Recipient Phone & Doctor Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                    Client WhatsApp (E.164)
                  </label>
                  <input
                    type="text"
                    value={drawerData.whatsappRecipientPhone || ""}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappRecipientPhone: e.target.value })}
                    placeholder="+919876543210"
                    style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                    Doctor / Client Name
                  </label>
                  <input
                    type="text"
                    value={drawerData.whatsappRecipientName || ""}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappRecipientName: e.target.value })}
                    placeholder="e.g. Dr. Nitika"
                    style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Reporting Schedule */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                    Reporting Frequency
                  </label>
                  <select
                    value={drawerData.whatsappReportingSchedule || "WEEKLY"}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappReportingSchedule: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 10px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="ALTERNATE_DAYS">Alternate Days</option>
                    <option value="CUSTOM_DAYS">Custom Days (e.g. Mon, Thu)</option>
                    <option value="WEEKLY">Weekly (Monday)</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    value={drawerData.whatsappReportTime || "09:00"}
                    onChange={(e) => setDrawerData({ ...drawerData, whatsappReportTime: e.target.value })}
                    style={{ width: "100%", height: 38, padding: "0 10px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Notification Triggers */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 6 }}>
                  Automated Event Triggers
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  {[
                    { key: "whatsappNotifyPost", label: "📸 Post Published Notification (Image + CTA)" },
                    { key: "whatsappNotifyReview", label: "⭐ New Review Alert (Stars + Reviewer Name)" },
                    { key: "whatsappNotifyReply", label: "💬 Review Auto-Reply Update" },
                    { key: "whatsappNotifyPerformance", label: "📊 Performance Digest (Calls, Directions)" },
                  ].map((item) => (
                    <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155", cursor: "pointer", fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={drawerData[item.key] !== false}
                        onChange={(e) => setDrawerData({ ...drawerData, [item.key]: e.target.checked })}
                        style={{ accentColor: "#059669" }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Knowledge Base */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  🏥 Clinic Persona & Knowledge Base (Pillar 1)
                </label>
                <textarea
                  rows={4}
                  value={drawerData.whatsappKnowledgeBase || ""}
                  onChange={(e) => setDrawerData({ ...drawerData, whatsappKnowledgeBase: e.target.value })}
                  placeholder="e.g. Address client as Dr. Nitika. Timings: 10 AM - 7 PM. Consultation Fee: ₹800. Clinic Manager: +91 9876543210. Specialty: Infertility & IVF."
                  style={{ width: "100%", padding: 12, background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12 }}
                />
              </div>

              {/* Custom Instructions */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                  Custom AI Behavior Instructions
                </label>
                <textarea
                  rows={3}
                  value={drawerData.whatsappCustomInstructions || ""}
                  onChange={(e) => setDrawerData({ ...drawerData, whatsappCustomInstructions: e.target.value })}
                  placeholder="e.g. Keep replies concise with bullet points. Always encourage doctor about positive review trends."
                  style={{ width: "100%", padding: 12, background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12 }}
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: "16px 22px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditDrawerOpen(false)}
                style={{ padding: "9px 16px", background: "#ffffff", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer" }}
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
                  padding: "9px 20px",
                  background: "#059669",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)",
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0F172A" }}>Create Meta Message Template</h3>
              <button onClick={() => setTemplateModalOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                Template Name (lowercase, no spaces)
              </label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g. gbp_clinic_appointment_reminder"
                style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                Category
              </label>
              <select
                value={templateForm.category}
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                style={{ width: "100%", height: 38, padding: "0 12px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
              >
                <option value="UTILITY">UTILITY (Alerts, Updates)</option>
                <option value="MARKETING">MARKETING (Promotions, Offers)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#475569", display: "block", marginBottom: 4 }}>
                {"Body Message (use {{1}}, {{2}} for variables)"}
              </label>
              <textarea
                rows={4}
                value={templateForm.bodyText}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyText: e.target.value })}
                style={{ width: "100%", padding: 12, background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="submitToMetaCheck"
                checked={templateForm.submitToMeta}
                onChange={(e) => setTemplateForm({ ...templateForm, submitToMeta: e.target.checked })}
                style={{ accentColor: "#2563EB" }}
              />
              <label htmlFor="submitToMetaCheck" style={{ fontSize: 12, color: "#334155", cursor: "pointer", fontWeight: 600 }}>
                Submit directly to Meta Graph API for automated WABA approval
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
              <button
                onClick={() => setTemplateModalOpen(false)}
                style={{ padding: "8px 16px", background: "#ffffff", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer" }}
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
                  padding: "8px 18px",
                  background: "#2563EB",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
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

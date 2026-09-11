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
} from "lucide-react";

export default function WhatsAppAgentCenterPage() {
  const [activeTab, setActiveTab] = useState<"profiles" | "simulator" | "inbox" | "api" | "training_guide">("profiles");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
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

  // WhatsApp Simulator state
  const [simProfileId, setSimProfileId] = useState<string>("");
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string; buttons?: string[] }>>([]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
        const pList = pj.data || [];
        setProfiles(pList);
        if (pList.length > 0 && !simProfileId) {
          setSimProfileId(pList[0].id);
        }
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

  // Initialize simulator greeting when simulator profile changes
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
    <div className="space-y-4 max-w-7xl mx-auto pb-16 px-1 sm:px-2">
      {/* ── Top Header Banner (Compact & Sleek) ────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 rounded-xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <MessageSquare className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white m-0">
                WhatsApp AI Agent & Option Chains
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                RAG Memory + 6-Option Chain
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5 leading-snug max-w-2xl">
              Automated client updates on WhatsApp: scheduled performance digests, instant post & review alerts, review drop protection, and interactive 1-click option menus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={fetchAllData}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ── Compact Stat Cards (4 Grid) ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate m-0">Active Agents</p>
            <p className="text-base font-bold text-slate-900 mt-0.5 truncate m-0">
              {activeCount} <span className="text-xs font-normal text-slate-400">/ {profiles.length} Profiles</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate m-0">Outbound Alerts</p>
            <p className="text-base font-bold text-slate-900 mt-0.5 truncate m-0">{outboundLogsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate m-0">Client Q&A Answered</p>
            <p className="text-base font-bold text-slate-900 mt-0.5 truncate m-0">{inboundLogsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate m-0">RAG Engine Active</p>
            <p className="text-base font-bold text-slate-900 mt-0.5 truncate m-0">{globalSettings?.whatsappAiModel || "GPT-4o"}</p>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation Bar ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex gap-1.5 overflow-x-auto shadow-xs">
        {[
          { id: "profiles", label: "Client Profiles & Schedules", icon: Phone, count: profiles.length },
          { id: "simulator", label: "📱 Interactive WhatsApp Simulator", icon: Smartphone },
          { id: "inbox", label: "Live Activity & Chat Logs", icon: History, count: logs.length },
          { id: "api", label: "Cloud API & Webhook", icon: SettingsIcon },
          { id: "training_guide", label: "5-Pillars Intelligence Guide", icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                active
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs font-bold"
                  : "bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  active ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Profiles & Schedules Table ──────────────────────────── */}
      {activeTab === "profiles" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          {/* Table Header Filter Bar */}
          <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 w-full sm:w-80 shadow-2xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search profiles, doctor, or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 outline-none shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing <b className="text-slate-700">{filteredProfiles.length}</b> profiles
            </span>
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3.5">Profile & Doctor</th>
                  <th className="py-2.5 px-3">Agent Status</th>
                  <th className="py-2.5 px-3">Client WhatsApp</th>
                  <th className="py-2.5 px-3">Schedule & Time</th>
                  <th className="py-2.5 px-3">Trained Knowledge</th>
                  <th className="py-2.5 px-3">Alert Triggers</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No profiles matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">{p.name}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {p.whatsappRecipientName ? `Doctor: ${p.whatsappRecipientName}` : (p.address?.split(",")[0] || "No contact set")}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={e => handleToggleProfileActive(p, e)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all border cursor-pointer ${
                            p.whatsappEnabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.whatsappEnabled ? "bg-emerald-600" : "bg-slate-400"}`} />
                          {p.whatsappEnabled ? "ACTIVE" : "PAUSED"}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11.5px] text-slate-700">
                        {p.whatsappRecipientPhone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{p.whatsappRecipientPhone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic font-sans text-xs">Not added</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs">{p.whatsappReportingSchedule || "WEEKLY"}</span>
                          <span className="text-[11px] text-slate-400">at {p.whatsappReportTime || "09:00"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {p.whatsappKnowledgeBase ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10.5px]">
                            <Check className="w-3 h-3 text-emerald-600" /> Ingested
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200 text-[10.5px]">
                            Standard GBP
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500" title="Active real-time alert triggers">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.whatsappNotifyPost !== false ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-50 text-slate-300"}`}>Post</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.whatsappNotifyReview !== false ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-50 text-slate-300"}`}>Review</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.whatsappNotifyPerformance !== false ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-slate-50 text-slate-300"}`}>Digest</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTestAlert(p.id, p.whatsappRecipientPhone)}
                            disabled={!p.whatsappRecipientPhone || actionLoading === "test_" + p.id}
                            title="Send verification test WhatsApp message"
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {actionLoading === "test_" + p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Test"}
                          </button>

                          <button
                            onClick={() => handleSendReportNow(p.id)}
                            disabled={!p.whatsappRecipientPhone || actionLoading === "report_" + p.id}
                            title="Send instant live performance digest"
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {actionLoading === "report_" + p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send Digest"}
                          </button>

                          <button
                            onClick={() => openDrawer(p)}
                            className="px-3 py-1 rounded text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
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

      {/* ── TAB 2: Official WhatsApp Interactive Simulator ─────────────── */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Simulator Phone Frame (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[650px]">
            {/* Top Selector Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Simulate Profile:</span>
                <select
                  value={simProfileId}
                  onChange={e => setSimProfileId(e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 outline-none"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.whatsappRecipientName || "Doctor"})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const p = profiles.find(pr => pr.id === simProfileId);
                  if (p) {
                    setSimMessages([
                      {
                        sender: "bot",
                        text: `Namaste *${p.whatsappRecipientName || "Doctor"}*! 🙏\n\nWelcome to your *RankVed GMB AI Account Manager* for *${p.name}*.\n\nChoose an option below or type any question:\n\n1️⃣ *Performance Report* 📊\n2️⃣ *Latest Google Posts* 📸\n3️⃣ *Recent Reviews & Auto-Replies* ⭐\n4️⃣ *Target Keywords & SEO* 🎯\n5️⃣ *Clinic FAQs & Doctor Info* 🏥\n6️⃣ *Ask AI Assistant* 🤖`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        buttons: ["1. Performance Report", "2. Latest Posts", "3. Reviews", "5. Clinic FAQs"],
                      },
                    ]);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Chat
              </button>
            </div>

            {/* Official WhatsApp Shell Header */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-400/40 flex items-center justify-center font-bold text-xs text-white">
                  {currentSimProfile?.name?.charAt(0) || "R"}
                </div>
                <div>
                  <p className="text-sm font-bold m-0 leading-tight">
                    {currentSimProfile?.name || "RankVed GMB Assistant"}
                  </p>
                  <p className="text-[11px] text-emerald-200 m-0 leading-tight">online • official business account</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-800/80 border border-emerald-600 px-2 py-0.5 rounded text-emerald-100 font-semibold">
                  LIVE RAG MEMORY
                </span>
              </div>
            </div>

            {/* Official WhatsApp Chat Pattern Body */}
            <div
              className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]"
              style={{ backgroundImage: "radial-gradient(#d1d7db 1px, transparent 1px)", backgroundSize: "16px 16px" }}
            >
              {simMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-xs relative ${
                      msg.sender === "user"
                        ? "bg-[#dcf8c6] text-slate-900 rounded-tr-none"
                        : "bg-white text-slate-900 rounded-tl-none border border-slate-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans break-words">{msg.text}</div>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                      <span>{msg.time}</span>
                      {msg.sender === "user" && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                  </div>

                  {/* Interactive Buttons (Option Chains) */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[85%]">
                      {msg.buttons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleSendSimulatorMessage(btn)}
                          className="text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-1 shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ChevronRight className="w-3 h-3 text-emerald-600" /> {btn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {simLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/90 border border-slate-200 rounded-full px-3 py-1.5 w-fit shadow-2xs animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>AI Agent is typing...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message, ask about OPD hours, or enter 1-6..."
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendSimulatorMessage()}
                className="flex-1 text-xs bg-white border border-slate-300 rounded-full px-4 py-2 outline-none focus:border-emerald-600 text-slate-800 shadow-2xs"
              />
              <button
                onClick={() => handleSendSimulatorMessage()}
                disabled={simLoading || !simInput.trim()}
                className="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option Chain Architecture Guide (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-emerald-700" />
                <span>Automated Option Chain Menu</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Clients do not have to type manually—they can tap quick buttons or reply numbers (1-6) for instant reports:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <span className="font-bold text-emerald-950">Performance & Call Stats</span>
                    <p className="text-[11px] text-slate-600 m-0">Live views, direct phone calls, map directions, and website clicks with 30-day breakdown.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <span className="font-bold text-blue-950">Latest Google Posts</span>
                    <p className="text-[11px] text-slate-600 m-0">Dispatches the live post graphic, summary text, and live Maps CTA link.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <span className="font-bold text-amber-950">Reviews & Official Replies</span>
                    <p className="text-[11px] text-slate-600 m-0">Shows customer feedback ratings and automated AI responses published to Google.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <span className="font-bold text-purple-950">Local Search Queries & SEO</span>
                    <p className="text-[11px] text-slate-600 m-0">Pulls top ranking search queries from Google Performance API.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                  <div>
                    <span className="font-bold text-teal-950">Clinic FAQs & Doctor Info</span>
                    <p className="text-[11px] text-slate-600 m-0">Outputs OPD timings, doctor qualifications, consultation fees, and clinic reception phone.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">6</span>
                  <div>
                    <span className="font-bold text-rose-950">Deep RAG AI Assistant</span>
                    <p className="text-[11px] text-slate-600 m-0">Answers any custom question using 15-message persistent chat memory + custom clinic training.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Activity Stream & Chat Logs ──────────────────────────── */}
      {activeTab === "inbox" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Live WhatsApp Agent Activity Stream</h3>
              <p className="text-xs text-slate-500 m-0">Real-time log of sent performance digests, post alerts, review notifications, and inbound AI conversations</p>
            </div>
            <button onClick={fetchAllData} className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
              <RefreshCw className="w-3 h-3" /> Refresh Logs
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No WhatsApp messages logged yet. As posts publish or clients message your WhatsApp number, entries appear here.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {logs.map(log => {
                const isOutbound = log.direction === "OUTBOUND";
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      isOutbound ? "bg-slate-50/80 border-slate-200" : "bg-emerald-50/50 border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOutbound ? "bg-slate-200 text-slate-700" : "bg-emerald-700 text-white"
                        }`}>
                          {log.direction}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {log.location?.name || "System"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {log.messageType} • {log.recipientPhone || log.senderPhone}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    <p className="text-slate-800 text-xs whitespace-pre-wrap font-sans m-0">
                      {log.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Meta WhatsApp Cloud API & Webhook ───────────────────── */}
      {activeTab === "api" && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 max-w-4xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">Meta WhatsApp Cloud API Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your official Meta Developer credentials to send automated WhatsApp updates and receive client messages worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number ID</label>
              <input
                type="text"
                placeholder="e.g. 104829104819028"
                value={globalSettings.whatsappPhoneNumberId || ""}
                onChange={e => setGlobalSettings({ ...globalSettings, whatsappPhoneNumberId: e.target.value })}
                className="w-full h-8 text-xs px-2.5 rounded-md border border-slate-300 outline-none focus:border-emerald-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                placeholder="e.g. 192840192840192"
                value={globalSettings.whatsappBusinessAccountId || ""}
                onChange={e => setGlobalSettings({ ...globalSettings, whatsappBusinessAccountId: e.target.value })}
                className="w-full h-8 text-xs px-2.5 rounded-md border border-slate-300 outline-none focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Permanent System User Access Token
            </label>
            <input
              type="password"
              placeholder={globalSettings.hasToken ? "••••••••••••••••" : "EAAG..."}
              value={globalSettings.whatsappAccessToken || ""}
              onChange={e => setGlobalSettings({ ...globalSettings, whatsappAccessToken: e.target.value })}
              className="w-full h-8 text-xs px-2.5 rounded-md border border-slate-300 outline-none focus:border-emerald-600 bg-white"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Generated in Meta Business Manager &gt; System Users (with whatsapp_business_messaging permissions).
            </span>
          </div>

          {/* Webhook Configuration Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 m-0">Meta Webhook Callback URL</h4>
            <p className="text-[11.5px] text-slate-600 m-0">
              Copy this URL and paste it in Meta Developer Portal &gt; WhatsApp &gt; Configuration &gt; Callback URL:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://gmb.rankved.com/api/whatsapp/webhook"
                className="flex-1 h-8 px-2.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-700"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUrl ? "Copied!" : "Copy URL"}</span>
              </button>
            </div>
            
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Verify Token</label>
              <input
                type="text"
                value={globalSettings.whatsappWebhookVerifyToken || "rankved_wa_verify_token"}
                onChange={e => setGlobalSettings({ ...globalSettings, whatsappWebhookVerifyToken: e.target.value })}
                className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded text-xs text-slate-800"
              />
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">AI Model for WhatsApp Agent</label>
            <select
              value={globalSettings.whatsappAiModel || "gpt-4o"}
              onChange={e => setGlobalSettings({ ...globalSettings, whatsappAiModel: e.target.value })}
              className="w-full h-8 text-xs px-2 rounded-md border border-slate-300 bg-white text-slate-800"
            >
              <option value="gpt-4o">OpenAI GPT-4o (Recommended — Ultra Fast & Highly Intelligent)</option>
              <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet (Nuanced & Professional)</option>
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Super Fast)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveGlobal}
              disabled={savingGlobal}
              className="px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {savingGlobal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingGlobal ? "Saving..." : "Save WhatsApp API Settings"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: 5-Pillars Intelligence Guide ─────────────────────────── */}
      {activeTab === "training_guide" && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 max-w-5xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 m-0">5 Core Pillars of WhatsApp AI Agent Intelligence</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed m-0">
            Our RAG (Retrieval-Augmented Generation) engine connects directly to the profile's live Google Business database and your custom trained knowledge base:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span>1. 🏥 Rich Clinic & Doctor Persona</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-normal m-0">
                In each profile's <b>Train & Configure</b> drawer, specify doctor degrees (e.g. DM Neurology), OPD consultation hours, consultation fee (₹800), and emergency reception phone. The AI strictly answers with this ground truth.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                <span>2. 📍 Local Search Query Ingestion</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-normal m-0">
                The agent ingests your Google Performance API ranking queries (e.g. <i>"best neurologist in Model Town"</i>). When asked about visibility, it gives concrete proof of keyword growth.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <span>3. 🛡️ Review Drop & Algorithm Explanations</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-normal m-0">
                If Google removes or filters a customer review, the agent sends a proactive alert and explains Google's spam filter sweeps calmly with full backup evidence.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                <span>4. 🧠 Multi-Turn Conversational Memory</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-normal m-0">
                The last 15 conversation messages are fed into the LLM context window so clients can ask follow-ups naturally (e.g. <i>"What about last week?"</i>) without repeating details.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1 md:col-span-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                <span>5. 🗣️ Natural Hinglish & Regional Tone</span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-normal m-0">
                By selecting <b>Hinglish</b>, the agent communicates warmly and professionally with Indian honorifics (<i>"Namaste Dr. Nitika! Aapki profile par is hafte 142 direct calls generate hui hain..."</i>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-in Drawer Modal: Train & Configure Profile ────────────── */}
      {editDrawerOpen && selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Train & Configure WhatsApp Agent</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">{selectedProfile.name}</p>
              </div>
              <button
                onClick={() => setEditDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Active Toggle Switch */}
              <label className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Enable WhatsApp Agent for this Profile</span>
                  <span className="text-[11px] text-slate-500">Automate reports, instant alerts, and AI client responses</span>
                </div>
                <input
                  type="checkbox"
                  checked={drawerData.whatsappEnabled}
                  onChange={e => setDrawerData({ ...drawerData, whatsappEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-700 cursor-pointer"
                />
              </label>

              {/* Basic Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client WhatsApp Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={drawerData.whatsappRecipientPhone}
                    onChange={e => setDrawerData({ ...drawerData, whatsappRecipientPhone: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 outline-none focus:border-emerald-600 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor / Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Nitika Mahajan"
                    value={drawerData.whatsappRecipientName}
                    onChange={e => setDrawerData({ ...drawerData, whatsappRecipientName: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 outline-none focus:border-emerald-600 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Training Knowledge Base Box */}
              <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Trained Knowledge Base (Source of Truth)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal m-0">
                  Add doctor degrees, consultation fees, OPD timings, emergency clinic number, and FAQs. The AI answers all client questions using this exact data.
                </p>
                <textarea
                  rows={5}
                  placeholder={`• Doctor: Dr. Nitika Mahajan (DM Neurology, AIIMS)\n• OPD Timings: Mon-Sat 10:00 AM - 1:30 PM & 5:00 PM - 7:30 PM\n• Consultation Fee: ₹800\n• Emergency Reception: +91 9876543210\n• Treatments: Migraine, Epilepsy, Stroke rehab, Nerve disorders\n• Address Landmark: Near Metro Pillar 240, Model Town`}
                  value={drawerData.whatsappKnowledgeBase}
                  onChange={e => setDrawerData({ ...drawerData, whatsappKnowledgeBase: e.target.value })}
                  className="w-full p-2 rounded border border-emerald-300 text-xs font-sans bg-white outline-none focus:border-emerald-700 text-slate-800"
                />
              </div>

              {/* Schedule Settings */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Schedule</label>
                <select
                  value={drawerData.whatsappReportingSchedule}
                  onChange={e => setDrawerData({ ...drawerData, whatsappReportingSchedule: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-slate-300 bg-white text-xs text-slate-800"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Days (e.g. MON, WED, FRI)</label>
                  <input
                    type="text"
                    value={drawerData.whatsappCustomDays}
                    onChange={e => setDrawerData({ ...drawerData, whatsappCustomDays: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Delivery Time (24h)</label>
                  <input
                    type="time"
                    value={drawerData.whatsappReportTime}
                    onChange={e => setDrawerData({ ...drawerData, whatsappReportTime: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Language</label>
                  <select
                    value={drawerData.whatsappLanguage}
                    onChange={e => setDrawerData({ ...drawerData, whatsappLanguage: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-slate-300 bg-white text-xs text-slate-800"
                  >
                    <option value="en">English (Professional)</option>
                    <option value="hinglish">Hinglish (Hindi + English blend)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              {/* Instant Alert Checkboxes */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">Real-time Instant Alerts:</span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={drawerData.whatsappNotifyPost} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyPost: e.target.checked })} className="accent-emerald-700" />
                  <span>Send Post Graphic & Link on Publish</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={drawerData.whatsappNotifyReview} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyReview: e.target.checked })} className="accent-emerald-700" />
                  <span>Send New Review Star Rating Alerts</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={drawerData.whatsappNotifyReply} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyReply: e.target.checked })} className="accent-emerald-700" />
                  <span>Send Auto-Reply Confirmations</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={drawerData.whatsappNotifyPerformance} onChange={e => setDrawerData({ ...drawerData, whatsappNotifyPerformance: e.target.checked })} className="accent-emerald-700" />
                  <span>Include Search Views & Call Metrics in Digests</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Persona & Tone Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Always address client respectfully as Dr. Nitika. Highlight patient trust and clinic appointments."
                  value={drawerData.whatsappCustomInstructions}
                  onChange={e => setDrawerData({ ...drawerData, whatsappCustomInstructions: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 text-xs font-sans outline-none focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditDrawerOpen(false)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDrawer}
                disabled={savingDrawer}
                className="px-4 py-1.5 rounded text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {savingDrawer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingDrawer ? "Saving..." : "Save Settings & Training"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

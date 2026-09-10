"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Loader2,
  Check,
  History,
  ShieldCheck,
  Settings,
  HelpCircle,
} from "lucide-react";

interface WhatsAppLog {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  senderPhone: string;
  recipientPhone: string;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  status: string;
  createdAt: string;
}

interface WhatsAppSettingsData {
  whatsappEnabled: boolean;
  whatsappRecipientPhone: string | null;
  whatsappRecipientName: string | null;
  whatsappReportingSchedule: string;
  whatsappCustomDays: string | null;
  whatsappReportTime: string;
  whatsappLastReportSentAt: string | null;
  whatsappNotifyPost: boolean;
  whatsappNotifyReview: boolean;
  whatsappNotifyReply: boolean;
  whatsappNotifyPerformance: boolean;
  whatsappLanguage: string;
  whatsappCustomInstructions: string | null;
  whatsappLogs: WhatsAppLog[];
}

export function WhatsAppAgentTab({ profileId, profileName }: { profileId: string; profileName: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [reportingNow, setReportingNow] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [schedule, setSchedule] = useState("WEEKLY");
  const [customDays, setCustomDays] = useState("MON,THU");
  const [reportTime, setReportTime] = useState("09:00");
  const [notifyPost, setNotifyPost] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyReply, setNotifyReply] = useState(true);
  const [notifyPerformance, setNotifyPerformance] = useState(true);
  const [language, setLanguage] = useState("en");
  const [customInstructions, setCustomInstructions] = useState("");
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [lastReportAt, setLastReportAt] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${profileId}/whatsapp?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const d: WhatsAppSettingsData = json.data;
        if (d) {
          setEnabled(d.whatsappEnabled || false);
          setPhone(d.whatsappRecipientPhone || "");
          setRecipientName(d.whatsappRecipientName || "");
          setSchedule(d.whatsappReportingSchedule || "WEEKLY");
          setCustomDays(d.whatsappCustomDays || "MON,THU");
          setReportTime(d.whatsappReportTime || "09:00");
          setNotifyPost(d.whatsappNotifyPost !== false);
          setNotifyReview(d.whatsappNotifyReview !== false);
          setNotifyReply(d.whatsappNotifyReply !== false);
          setNotifyPerformance(d.whatsappNotifyPerformance !== false);
          setLanguage(d.whatsappLanguage || "en");
          setCustomInstructions(d.whatsappCustomInstructions || "");
          setLogs(d.whatsappLogs || []);
          setLastReportAt(d.whatsappLastReportSentAt || null);
        }
      }
    } catch (e) {
      console.error("Failed to load WhatsApp settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) fetchSettings();
  }, [profileId]);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/whatsapp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappEnabled: enabled,
          whatsappRecipientPhone: phone.trim() || null,
          whatsappRecipientName: recipientName.trim() || null,
          whatsappReportingSchedule: schedule,
          whatsappCustomDays: customDays.trim() || null,
          whatsappReportTime: reportTime,
          whatsappNotifyPost: notifyPost,
          whatsappNotifyReview: notifyReview,
          whatsappNotifyReply: notifyReply,
          whatsappNotifyPerformance: notifyPerformance,
          whatsappLanguage: language,
          whatsappCustomInstructions: customInstructions.trim() || null,
        }),
      });

      if (res.ok) {
        setStatusMsg({ type: "success", text: "WhatsApp AI Agent settings saved successfully!" });
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.error || "Failed to save settings." });
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!phone.trim()) {
      setStatusMsg({ type: "error", text: "Please enter a valid WhatsApp phone number first." });
      return;
    }
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_alert", phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "Test WhatsApp alert sent successfully! Check your phone." });
        fetchSettings();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to send test alert. Verify your WhatsApp API credentials in Settings." });
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setTesting(false);
    }
  };

  const handleSendReportNow = async () => {
    if (!phone.trim()) {
      setStatusMsg({ type: "error", text: "Please enter a valid WhatsApp phone number first." });
      return;
    }
    setReportingNow(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_report_now" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "Live performance digest dispatched to WhatsApp!" });
        fetchSettings();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to dispatch report." });
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Network error" });
    } finally {
      setReportingNow(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, color: "#64748b" }}>
        <Loader2 className="anim-spin" size={20} />
        <span>Loading WhatsApp Agent settings...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
        borderRadius: 14,
        padding: "20px 24px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: "0 4px 14px rgba(4, 120, 87, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)"
          }}>
            <MessageSquare size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
                WhatsApp AI Account Manager
              </h2>
              <span style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                background: enabled ? "#10b981" : "rgba(255,255,255,0.25)",
                fontWeight: 700,
                color: "#fff"
              }}>
                {enabled ? "ACTIVE & LIVE" : "DISABLED"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
              RAG-based AI assistant keeping clients proactively informed with post updates, review alerts, and performance digests.
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "8px 16px", borderRadius: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Enable for {profileName}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#10b981" }}
          />
        </label>
      </div>

      {statusMsg && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          background: statusMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
          color: statusMsg.type === "success" ? "#065f46" : "#991b1b",
          border: `1px solid ${statusMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          {statusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Card 1: Client WhatsApp Contact & Identity */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
            <Phone size={18} color="#047857" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recipient & Contact Details</h3>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Client WhatsApp Number (with Country Code)
            </label>
            <input
              type="text"
              placeholder="e.g. +91 9876543210 or 9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", color: "#1e293b" }}
            />
            <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
              Accepts 10-digit mobile or international format (+91).
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Recipient Contact Name / Salutation
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Nitika Mahajan / Clinic Manager"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", color: "#1e293b" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Preferred Communication Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", outline: "none", color: "#1e293b" }}
            >
              <option value="en">English (Professional & Clear)</option>
              <option value="hinglish">Hinglish (Hindi + English Conversational)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        {/* Card 2: Reporting Schedule & Triggers */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
            <Calendar size={18} color="#047857" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Reporting Schedule</h3>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
              Performance Digest Frequency
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { id: "DAILY", label: "Daily" },
                { id: "ALTERNATE_DAYS", label: "Alternate Days" },
                { id: "WEEKLY", label: "Weekly (Mon)" },
                { id: "CUSTOM", label: "Custom Schedule" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSchedule(item.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor: schedule === item.id ? "#047857" : "#e2e8f0",
                    background: schedule === item.id ? "#ecfdf5" : "#f8fafc",
                    color: schedule === item.id ? "#065f46" : "#475569",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {schedule === "CUSTOM" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Custom Days (Comma-separated: MON, WED, FRI)
              </label>
              <input
                type="text"
                placeholder="MON,WED,FRI"
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none" }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Preferred Delivery Time (24-Hour)
            </label>
            <input
              type="time"
              value={reportTime}
              onChange={e => setReportTime(e.target.value)}
              style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", background: "#fff" }}
            />
          </div>

          {lastReportAt && (
            <div style={{ fontSize: 11, color: "#64748b", background: "#f8fafc", padding: "6px 10px", borderRadius: 6 }}>
              Last report dispatched: <b>{new Date(lastReportAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</b>
            </div>
          )}
        </div>
      </div>

      {/* Instant Event-Driven Alerts Selection */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 16 }}>
          <Sparkles size={18} color="#047857" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Real-time Instant WhatsApp Alerts</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #f1f5f9" }}>
            <input type="checkbox" checked={notifyPost} onChange={e => setNotifyPost(e.target.checked)} style={{ marginTop: 2, accentColor: "#047857" }} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block" }}>Post Published Alerts</span>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Sends post graphic image, text summary, CTA, and live status immediately upon publishing.</span>
            </div>
          </label>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #f1f5f9" }}>
            <input type="checkbox" checked={notifyReview} onChange={e => setNotifyReview(e.target.checked)} style={{ marginTop: 2, accentColor: "#047857" }} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block" }}>New Review Notifications</span>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Instantly alerts when a new Google review is received with star ratings & feedback.</span>
            </div>
          </label>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #f1f5f9" }}>
            <input type="checkbox" checked={notifyReply} onChange={e => setNotifyReply(e.target.checked)} style={{ marginTop: 2, accentColor: "#047857" }} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block" }}>Auto-Reply Confirmations</span>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Informs client with the exact AI response published to Google for their customer.</span>
            </div>
          </label>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #f1f5f9" }}>
            <input type="checkbox" checked={notifyPerformance} onChange={e => setNotifyPerformance(e.target.checked)} style={{ marginTop: 2, accentColor: "#047857" }} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block" }}>Periodic Performance Digests</span>
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Includes search views, customer calls, directions, and growth trends in digests.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Card 3: RAG Custom AI Instructions & Persona */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 12 }}>
          <ShieldCheck size={18} color="#047857" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>RAG Knowledge Base & Custom Persona Instructions</h3>
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>
          The AI Agent has real-time access to this profile's posts, reviews, and search analytics. You can add specific instructions, doctor credentials, or manager phone numbers here:
        </p>
        <textarea
          rows={3}
          placeholder="e.g. Always address client as Dr. Nitika. Emphasize patient appointment calls and neurology specialty keywords. If client asks for clinic manager, provide: 9812345678."
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, outline: "none", color: "#1e293b", fontFamily: "inherit" }}
        />
      </div>

      {/* Actions Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testing || !phone}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: "#fff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              cursor: testing ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {testing ? <Loader2 size={14} className="anim-spin" /> : <Send size={14} color="#047857" />}
            <span>Send Test WhatsApp Alert</span>
          </button>

          <button
            type="button"
            onClick={handleSendReportNow}
            disabled={reportingNow || !phone}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              cursor: reportingNow ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {reportingNow ? <Loader2 size={14} className="anim-spin" /> : <FileText size={14} color="#2563eb" />}
            <span>Trigger Performance Report Now</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "9px 24px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            background: "#047857",
            border: "none",
            color: "#fff",
            cursor: saving ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 10px rgba(4, 120, 87, 0.2)"
          }}
        >
          {saving ? <Loader2 size={14} className="anim-spin" /> : <Check size={16} />}
          <span>{saving ? "Saving..." : "Save WhatsApp Settings"}</span>
        </button>
      </div>

      {/* Recent WhatsApp Message History */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <History size={18} color="#047857" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent WhatsApp Agent Activity Logs</h3>
          </div>
          <button
            onClick={fetchSettings}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
          >
            <RefreshCw size={12} /> Refresh Logs
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            No WhatsApp messages recorded yet. Click "Send Test WhatsApp Alert" to verify delivery.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {logs.map(log => {
              const isOutbound = log.direction === "OUTBOUND";
              return (
                <div
                  key={log.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: isOutbound ? "#f8fafc" : "#f0fdf4",
                    border: `1px solid ${isOutbound ? "#e2e8f0" : "#bbf7d0"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700,
                        fontSize: 10,
                        background: isOutbound ? "#e2e8f0" : "#16a34a",
                        color: isOutbound ? "#475569" : "#fff"
                      }}>
                        {log.direction}
                      </span>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {log.messageType} • {log.recipientPhone || log.senderPhone}
                      </span>
                    </div>
                    <span style={{ color: "#94a3b8" }}>
                      {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#1e293b", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                    {log.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

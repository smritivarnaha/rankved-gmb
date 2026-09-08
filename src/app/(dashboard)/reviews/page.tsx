"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Star, MessageSquare, Search, RefreshCw, AlertCircle, CheckCircle2,
  ExternalLink, Building2, Clock, Loader2, Send, ChevronDown, Check,
  Sparkles, ArrowUpDown, Filter, Edit3, X, AlertTriangle, Download,
  Upload, Calendar, Zap, Trash2, FileText
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "#F59E0B" : "none"}
          color={i <= rating ? "#F59E0B" : "#D1D5DB"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function Avatar({ name, photoUrl, size = 36 }: { name: string; photoUrl?: string; size?: number }) {
  const initials = (name || "?").charAt(0).toUpperCase();
  const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
  const color = colors[initials.charCodeAt(0) % colors.length];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #e2e8f0",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color + "18",
        border: `1.5px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function getRating(r: any): number {
  const map: Record<string, number> = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
  return map[r.starRating] ?? (typeof r.starRating === "number" ? r.starRating : 1);
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "Just now";
  } catch {
    return dateStr;
  }
}

function truncateName(name: string, maxLen = 8): string {
  if (!name) return "";
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen) + "…";
}

// ── Export Modal ──────────────────────────────────────────────────────────
function ExportModal({
  onClose,
  profiles,
  selectedTab,
}: {
  onClose: () => void;
  profiles: any[];
  selectedTab: string;
}) {
  // Initialize with selectedTab or all profiles
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(() => {
    if (selectedTab && selectedTab !== "all") {
      return [selectedTab];
    }
    return profiles.map(p => p.id);
  });
  const [profileSearch, setProfileSearch] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reviewStatus, setReviewStatus] = useState<string>("pending");
  const [isExporting, setIsExporting] = useState(false);

  const toggleProfile = (id: string) => {
    setSelectedProfileIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedProfileIds(profiles.map(p => p.id));
  const deselectAll = () => setSelectedProfileIds([]);

  const filteredProfiles = useMemo(() => {
    if (!profileSearch.trim()) return profiles;
    const q = profileSearch.toLowerCase();
    return profiles.filter(p => p.name.toLowerCase().includes(q));
  }, [profiles, profileSearch]);

  const handleDownload = () => {
    if (selectedProfileIds.length === 0) return;
    setIsExporting(true);

    const isAll = selectedProfileIds.length === profiles.length;
    const profileParam = isAll ? "all" : selectedProfileIds.join(",");

    let url = `/api/reviews/export?profileIds=${encodeURIComponent(profileParam)}&dateRange=${dateRange}&status=${reviewStatus}`;
    if (dateRange === "custom") {
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
    }

    window.location.href = url;
    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Download size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Export Reviews to CSV</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Select profiles, review status, and date range</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Multi-Profile Selector Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Select Profiles ({selectedProfileIds.length}/{profiles.length})
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={selectAll}
                  style={{ background: "none", border: "none", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  Select All
                </button>
                <span style={{ color: "#cbd5e1" }}>•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Profile search input if > 4 profiles */}
            {profiles.length > 4 && (
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Filter profiles..."
                  value={profileSearch}
                  onChange={e => setProfileSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: 32,
                    padding: "0 8px 0 28px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    background: "#f8fafc",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <Search size={12} color="#94a3b8" style={{ position: "absolute", left: 9, top: 10 }} />
              </div>
            )}

            {/* Profile Checkboxes Box */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                maxHeight: 140,
                overflowY: "auto",
                background: "#f8fafc",
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {filteredProfiles.map((p: any) => {
                const isChecked = selectedProfileIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProfile(p.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: isChecked ? "#eff6ff" : "#ffffff",
                      border: isChecked ? "1px solid #bfdbfe" : "1px solid #f1f5f9",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by container
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: isChecked ? "#1e40af" : "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: isChecked ? "#dbeafe" : "#f1f5f9", padding: "1px 6px", borderRadius: 10, flexShrink: 0 }}>
                      {p.totalCount ?? 0} reviews
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Status */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Reviews To Include</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                onClick={() => setReviewStatus("pending")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: reviewStatus === "pending" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                  background: reviewStatus === "pending" ? "#eff6ff" : "#ffffff",
                  color: reviewStatus === "pending" ? "#2563eb" : "#475569",
                  cursor: "pointer",
                }}
              >
                ⏳ Pending Only
              </button>
              <button
                type="button"
                onClick={() => setReviewStatus("all")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: reviewStatus === "all" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                  background: reviewStatus === "all" ? "#eff6ff" : "#ffffff",
                  color: reviewStatus === "all" ? "#2563eb" : "#475569",
                  cursor: "pointer",
                }}
              >
                All Reviews
              </button>
            </div>
          </div>

          {/* Date Range Presets */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Date Range Filter</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#ffffff", outline: "none" }}
            >
              <option value="all">All Time (No date filter)</option>
              <option value="30d">Last 30 Days (1 Month)</option>
              <option value="60d">Last 60 Days (2 Months)</option>
              <option value="90d">Last 90 Days (3 Months)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: "100%", height: 36, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: "100%", height: 36, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12 }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting || selectedProfileIds.length === 0}
            style={{
              padding: "8px 20px",
              background: "#2563eb",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: isExporting || selectedProfileIds.length === 0 ? "not-allowed" : "pointer",
              opacity: selectedProfileIds.length === 0 ? 0.6 : 1,
            }}
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download CSV ({selectedProfileIds.length} profiles)
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────────────────
function ImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Please select a CSV file first.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setResultMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/reviews/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultMessage(
          `🎉 Successfully parsed ${data.totalRows} reviews! Queued ${data.scheduledCount} replies with safe 3-replies/day throttle.`
        );
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.error || "Failed to process imported CSV file.");
      }
    } catch {
      setErrorMsg("Network error uploading CSV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
              <Upload size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Import Review Replies</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Upload completed CSV with Owner_Reply filled</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #cbd5e1",
            borderRadius: 12,
            padding: "24px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: "#f8fafc",
            transition: "all 0.15s ease",
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            style={{ display: "none" }}
          />
          <FileText size={28} color="#64748b" style={{ margin: "0 auto 8px" }} />
          {file ? (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#2563eb" }}>
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Click to browse or drop your CSV file here
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>
                Supports standard UTF-8 CSV with 'Review_Resource_Name' & 'Owner_Reply'
              </p>
            </>
          )}
        </div>

        {/* Drip throttle notice */}
        <div style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: 8, fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={14} color="#2563eb" />
          <span>Automatic Safety Throttle: Replies are scheduled up to <b>3 per profile per day</b> (10am, 2pm, 6pm).</span>
        </div>

        {errorMsg && (
          <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}
        {resultMessage && (
          <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={14} /> {resultMessage}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            style={{
              padding: "8px 20px",
              background: "#10b981",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: isUploading || !file ? "not-allowed" : "pointer",
              opacity: isUploading || !file ? 0.6 : 1,
            }}
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Process & Queue Replies
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Auto-Reply Settings Modal ─────────────────────────────────────────────
function AutoReplySettingsModal({
  onClose,
  profiles,
  selectedTab,
}: {
  onClose: () => void;
  profiles: any[];
  selectedTab: string;
}) {
  const [targetProfileId, setTargetProfileId] = useState<string>(() => {
    return selectedTab !== "all" && profiles.some(p => p.id === selectedTab)
      ? selectedTab
      : profiles[0]?.id || "";
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [minDelay, setMinDelay] = useState(60);
  const [maxDelay, setMaxDelay] = useState(240);
  const [instructions, setInstructions] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState(true);
  const [holdNegative, setHoldNegative] = useState(false);
  const [profileKeywords, setProfileKeywords] = useState("");

  useEffect(() => {
    if (!targetProfileId) return;
    setIsLoadingSettings(true);
    setErrorMsg(null);
    setFeedback(null);

    fetch(`/api/profiles/${targetProfileId}/auto-reply-settings`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAutoReplyEnabled(Boolean(data.autoReplyEnabled));
          setMinDelay(data.autoReplyMinDelayMinutes || 60);
          setMaxDelay(data.autoReplyMaxDelayMinutes || 240);
          setInstructions(data.autoReplyInstructions || "");
          setIncludeKeywords(data.autoReplyIncludeKeywords ?? true);
          setHoldNegative(data.autoReplyHoldNegative ?? false);
          setProfileKeywords(data.aiKeywords || "");
        }
      })
      .catch(() => setErrorMsg("Failed to load profile auto-reply settings."))
      .finally(() => setIsLoadingSettings(false));
  }, [targetProfileId]);

  const handleSave = async () => {
    if (!targetProfileId) return;
    setIsSaving(true);
    setErrorMsg(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/profiles/${targetProfileId}/auto-reply-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoReplyEnabled,
          autoReplyMinDelayMinutes: minDelay,
          autoReplyMaxDelayMinutes: maxDelay,
          autoReplyInstructions: instructions,
          autoReplyIncludeKeywords: includeKeywords,
          autoReplyHoldNegative: holdNegative,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback("✓ Auto-reply settings saved successfully!");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Failed to save settings.");
      }
    } catch {
      setErrorMsg("Network error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>AI Auto-Reply Settings</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>Automate smart review replies with randomized human delay</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Profile Selector */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
            Select Business Profile
          </label>
          <select
            value={targetProfileId}
            onChange={e => setTargetProfileId(e.target.value)}
            style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#ffffff", color: "#0f172a", outline: "none" }}
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {isLoadingSettings ? (
          <div style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
            <Loader2 size={24} className="animate-spin" color="#2563eb" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: 13, margin: 0 }}>Loading profile auto-reply settings...</p>
          </div>
        ) : (
          <>
            {/* Master Toggle (Default OFF) */}
            <div style={{ background: autoReplyEnabled ? "#f0fdf4" : "#f8fafc", border: `1px solid ${autoReplyEnabled ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: autoReplyEnabled ? "#15803d" : "#334155", display: "block" }}>
                  AI Auto-Reply is {autoReplyEnabled ? "ENABLED (ON)" : "DISABLED (OFF)"}
                </span>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {autoReplyEnabled ? "Automatically replies to new reviews with human delay" : "Auto-replier is off by default for safety"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 20,
                  background: autoReplyEnabled ? "#16a34a" : "#cbd5e1",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#ffffff",
                    position: "absolute",
                    top: 3,
                    left: autoReplyEnabled ? 25 : 3,
                    transition: "left 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </button>
            </div>

            {/* Delay Range Window */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                🕒 Randomized Delay Window (Anti-Bot Pattern Guard)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Minimum Delay (Minutes)</span>
                  <input
                    type="number"
                    min={15}
                    max={minDelay ? maxDelay : 300}
                    value={minDelay}
                    onChange={e => setMinDelay(Math.max(15, parseInt(e.target.value, 10) || 60))}
                    style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{Math.round(minDelay / 60 * 10) / 10} hours</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Maximum Delay (Minutes)</span>
                  <input
                    type="number"
                    min={minDelay}
                    max={720}
                    value={maxDelay}
                    onChange={e => setMaxDelay(Math.max(minDelay, parseInt(e.target.value, 10) || 240))}
                    style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{Math.round(maxDelay / 60 * 10) / 10} hours</span>
                </div>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
                Every auto-reply will be scheduled at a random time between {minDelay}m and {maxDelay}m after review is posted.
              </p>
            </div>

            {/* Keyword Infusion & Safety Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeKeywords}
                  onChange={e => setIncludeKeywords(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block" }}>
                    Weave Local SEO Keywords into Positive Replies
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Naturally embeds 1 top performance keyword from your profile's keywords ({profileKeywords ? profileKeywords.substring(0, 45) + "…" : "aiKeywords"}).
                  </span>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={holdNegative}
                  onChange={e => setHoldNegative(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "block" }}>
                    Hold 1–2 Star Negative Reviews in Pending Queue
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Automatically holds critical or low-star reviews so your team can manually review and approve the reply before posting.
                  </span>
                </div>
              </label>
            </div>

            {/* Knowledge Base & Custom Instructions */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                Business Knowledge Base & Escalation Instructions
              </label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. For complaints, ask customer to contact manager Dr. Sharma at support@clinic.com or 9876543210. Highlight our friendly staff and emergency care services..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, lineHeight: 1.5, boxSizing: "border-box", outline: "none" }}
              />
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                The AI will reference these rules and contact details for both positive and negative replies.
              </span>
            </div>

            {/* Status alerts */}
            {errorMsg && (
              <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}
            {feedback && (
              <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={14} /> {feedback}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <button
                onClick={onClose}
                style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "8px 20px",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Settings
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────
interface ReviewCardProps {
  review: any;
  onRepliedSuccess: (reviewName: string, newComment: string) => void;
}

function ReviewCard({ review, onRepliedSuccess }: ReviewCardProps) {
  const [replyText, setReplyText] = useState(review.reviewReply?.comment || "");
  const [isEditing, setIsEditing] = useState(!review.isReplied);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [customScheduleDate, setCustomScheduleDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // AI Auto-Reply State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [activeTone, setActiveTone] = useState<"WARM" | "SHORT" | "SEO_FOCUSED">("WARM");

  const rating = getRating(review);
  const dateFormatted = formatRelativeTime(review.createTime);

  const handleGenerateAiReply = async (preferredTone: "WARM" | "SHORT" | "SEO_FOCUSED" = "WARM") => {
    setIsGeneratingAi(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    setActiveTone(preferredTone);

    try {
      const res = await fetch("/api/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: review.profileId,
          reviewText: review.comment,
          reviewerName: review.reviewer?.displayName,
          rating,
          preferredTone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.reply) {
        setReplyText(data.reply);
        setAiResult(data);
        setIsEditing(true);
      } else {
        setErrorMsg(data.error || "Failed to generate AI reply. Check your AI keys in Settings.");
      }
    } catch {
      setErrorMsg("Error contacting AI server.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePostReply = async (isOverride = false, explicitDate?: string) => {
    if (!replyText.trim()) return;
    setIsPosting(true);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: review.profileId,
          reviewName: review.name,
          comment: replyText.trim(),
          override: isOverride,
          scheduledFor: explicitDate || (customScheduleDate ? new Date(customScheduleDate).toISOString() : undefined),
          reviewerName: review.reviewer?.displayName,
          rating,
          reviewComment: review.comment,
          reviewCreateTime: review.createTime,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.scheduled) {
          setFeedbackMsg(`📅 ${data.message}`);
        } else {
          setFeedbackMsg("✓ Reply posted successfully to Google!");
          setIsEditing(false);
        }
        setTimeout(() => {
          onRepliedSuccess(review.name, replyText.trim());
        }, 900);
      } else {
        setErrorMsg(data.error || "Failed to post reply.");
      }
    } catch {
      setErrorMsg("Network error posting reply. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "all 0.2s ease",
        position: "relative",
      }}
      className="review-card-item"
    >
      {/* Top Header info */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Avatar name={review.reviewer?.displayName || "?"} photoUrl={review.reviewer?.profilePhotoUrl} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {review.reviewer?.displayName || "Anonymous Customer"}
              </p>
              {review.isReplied ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1px 7px", borderRadius: 12 }}>
                  ✓ Replied
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fde68a", padding: "1px 7px", borderRadius: 12 }}>
                  ⏳ Pending
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <StarRating rating={rating} size={14} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>• {dateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Profile Origin Tag */}
        {review.profileName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f1f5f9",
              padding: "4px 10px",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
              flexShrink: 0,
            }}
            title={review.profileName}
          >
            <Building2 size={13} color="#2563eb" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#334155", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {review.profileName}
            </span>
          </div>
        )}
      </div>

      {/* Review Comment Text */}
      <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #f1f5f9" }}>
        {review.comment ? (
          <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6, fontStyle: "italic" }}>
            "{review.comment}"
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
            Rating only — no written feedback provided.
          </p>
        )}
      </div>

      {/* Existing Reply Display */}
      {review.isReplied && !isEditing && review.reviewReply?.comment && (
        <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Owner Response
            </span>
            <button
              onClick={() => setIsEditing(true)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              <Edit3 size={12} /> Edit Reply
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#1e3a8a", lineHeight: 1.55 }}>
            {review.reviewReply.comment}
          </p>
        </div>
      )}

      {/* Feedback Messages */}
      {errorMsg && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
      {feedbackMsg && (
        <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={14} /> {feedbackMsg}
        </div>
      )}

      {/* Reply Input Box */}
      {isEditing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {review.isReplied ? "Edit Your Reply" : "Write Reply"}
              </label>
              <button
                type="button"
                onClick={() => handleGenerateAiReply(activeTone)}
                disabled={isGeneratingAi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: isGeneratingAi ? "#f1f5f9" : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isGeneratingAi ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {isGeneratingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} color="#2563eb" />}
                {isGeneratingAi ? "Generating AI Reply..." : "✨ Auto Generate Reply (AI)"}
              </button>
            </div>
            <span style={{ fontSize: 11, color: replyText.length > 1400 ? "#ea580c" : "#94a3b8" }}>
              {replyText.length} / 1500
            </span>
          </div>

          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`Reply to ${review.reviewer?.displayName || "this customer"} as the business owner...`}
            rows={3}
            maxLength={1500}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5,
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "#2563eb"}
            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
          />

          {/* AI Sentiment & Tone Switcher */}
          {aiResult && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: aiResult.sentiment === "NEGATIVE" ? "#dc2626" : "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                  {aiResult.sentiment === "NEGATIVE"
                    ? "🛡️ Empathic De-escalation & Resolution Tone"
                    : `✨ SEO Keyword Weaved: "${aiResult.keywordUsed || "Local Care"}"`}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (aiResult.options?.warm) setReplyText(aiResult.options.warm);
                      setActiveTone("WARM");
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: activeTone === "WARM" ? "#2563eb" : "#cbd5e1",
                      background: activeTone === "WARM" ? "#eff6ff" : "#ffffff",
                      color: activeTone === "WARM" ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Warm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (aiResult.options?.short) setReplyText(aiResult.options.short);
                      setActiveTone("SHORT");
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: activeTone === "SHORT" ? "#2563eb" : "#cbd5e1",
                      background: activeTone === "SHORT" ? "#eff6ff" : "#ffffff",
                      color: activeTone === "SHORT" ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Short
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (aiResult.options?.seoFocused) setReplyText(aiResult.options.seoFocused);
                      setActiveTone("SEO_FOCUSED");
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: activeTone === "SEO_FOCUSED" ? "#2563eb" : "#cbd5e1",
                      background: activeTone === "SEO_FOCUSED" ? "#eff6ff" : "#ffffff",
                      color: activeTone === "SEO_FOCUSED" ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    SEO Focused
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Date Picker row if opened */}
          {showDatePicker && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <Calendar size={14} color="#64748b" />
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Schedule For:</span>
              <input
                type="datetime-local"
                value={customScheduleDate}
                onChange={e => setCustomScheduleDate(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
              />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {review.reviewUrl && (
                <a
                  href={review.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "#64748b",
                    textDecoration: "none",
                    padding: "7px 10px",
                    borderRadius: 8,
                    background: "#f1f5f9",
                  }}
                >
                  <ExternalLink size={12} /> Google
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: showDatePicker ? "#2563eb" : "#64748b",
                  background: showDatePicker ? "#eff6ff" : "#f1f5f9",
                  border: "none",
                  padding: "7px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                <Calendar size={13} /> {showDatePicker ? "Cancel Custom Date" : "Pick Date"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Force Post Now (Override 3-per-day throttle) */}
              <button
                onClick={() => handlePostReply(true)}
                disabled={isPosting || !replyText.trim()}
                title="Publish directly now bypassing the 3-replies/day safe limit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "8px 12px",
                  background: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isPosting || !replyText.trim() ? "not-allowed" : "pointer",
                  opacity: isPosting || !replyText.trim() ? 0.5 : 1,
                }}
              >
                <Zap size={13} color="#f59e0b" /> Force Post Now
              </button>

              {/* Standard Safe Post (Follows 3/day auto-drip) */}
              <button
                onClick={() => handlePostReply(false)}
                disabled={isPosting || !replyText.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isPosting || !replyText.trim() ? "not-allowed" : "pointer",
                  opacity: isPosting || !replyText.trim() ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {isPosting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Send size={13} /> {showDatePicker ? "Schedule Reply" : "Post Reply"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Scheduled Queue Tab View ──────────────────────────────────────────────
function ScheduledQueueView({ profileId }: { profileId: string }) {
  const { data, mutate, isLoading } = useSWR(
    `/api/reviews/scheduled?profileId=${profileId}`,
    fetcher
  );
  const scheduledList = data?.data || [];
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancelingId(id);
    try {
      const res = await fetch(`/api/reviews/scheduled/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
        <Loader2 size={28} className="animate-spin" color="#2563eb" />
        <span style={{ fontSize: 13, color: "#64748b" }}>Loading scheduled queue...</span>
      </div>
    );
  }

  if (scheduledList.length === 0) {
    return (
      <div style={{ padding: "70px 20px", textAlign: "center", background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Clock size={36} color="#94a3b8" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>No Scheduled Replies In Queue</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", maxWidth: 400 }}>
          Replies queued via the 3-per-day safe limit or imported via CSV will appear here and publish automatically at their scheduled times.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {scheduledList.map((item: any) => {
        const scheduleDate = new Date(item.scheduledFor);
        return (
          <div
            key={item.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ padding: "4px 10px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} /> {scheduleDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  To: {item.reviewerName || "Customer"}
                </span>
                {item.rating && (
                  <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>
                    ★ {item.rating}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
                  📍 {item.location?.name || "Profile"}
                </span>
                <button
                  onClick={() => handleCancel(item.id)}
                  disabled={cancelingId === item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={12} /> Cancel
                </button>
              </div>
            </div>

            {item.reviewComment && (
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "8px 12px", borderRadius: 6 }}>
                "{item.reviewComment}"
              </p>
            )}

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 2 }}>
                Queued Reply:
              </span>
              <p style={{ margin: 0, fontSize: 13, color: "#14532d", lineHeight: 1.5 }}>
                {item.replyComment}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Deleted / Missing Reviews View (Google Spam Drops) ───────────────────
function DeletedReviewsView({ profileId }: { profileId: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: res, isLoading } = useSWR(
    `/api/reviews/deleted?profileId=${profileId}`,
    fetcher
  );

  const deletedList = res?.data || [];

  const handleCopy = (item: any) => {
    navigator.clipboard.writeText(item.appealEvidence || "");
    setCopiedId(item.id);
    setToastMessage(`✓ Google Appeal Evidence copied for ${item.reviewerName || "Customer"}!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 3500);
  };

  const handleDownloadCsv = () => {
    window.location.href = `/api/reviews/deleted/export?profileId=${profileId}`;
  };

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <Loader2 size={24} className="animate-spin" color="#dc2626" style={{ margin: "0 auto 8px" }} />
        <p style={{ color: "#64748b", fontSize: 13 }}>Loading backed up deleted reviews...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#0f172a", color: "#ffffff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}>
          <Check size={16} color="#4ade80" />
          {toastMessage}
        </div>
      )}

      {/* Overview Warning Banner */}
      <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12, padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, maxWidth: 800 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#9f1239" }}>
              Google Spam Update Drops ({deletedList.length} deleted reviews detected)
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#be123c", lineHeight: 1.5 }}>
              Google automated systems periodically remove genuine customer reviews without notice. Our permanent backup vault stored these reviews and has prepared formal Google Support Appeal Evidence for every removed review below.
            </p>
          </div>
        </div>

        {deletedList.length > 0 && (
          <button
            onClick={handleDownloadCsv}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#be123c",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(190,18,60,0.2)",
            }}
          >
            <Download size={14} /> Export Evidence CSV
          </button>
        )}
      </div>

      {deletedList.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <CheckCircle2 size={36} color="#16a34a" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            No Review Drops Detected
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            All customer reviews in your database backup vault are currently live and active on Google.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {deletedList.map((item: any) => {
            const receivedDateStr = item.reviewCreateTime
              ? new Date(item.reviewCreateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "N/A";
            const deletedDateStr = item.deletedAt
              ? new Date(item.deletedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "Recently";

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #fed7aa",
                  borderLeft: "4px solid #ef4444",
                  borderRadius: 12,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: "0 2px 6px rgba(239,68,68,0.05)",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={item.reviewerName || "Customer"} photoUrl={item.reviewerPhotoUrl} size={38} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                          {item.reviewerName || "Anonymous Customer"}
                        </span>
                        <StarRating rating={item.rating || 5} size={13} />
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        Received: {receivedDateStr} • Location: <b>{item.location?.name || "Profile"}</b>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 20, background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> Removed by Google on {deletedDateStr}
                    </span>
                    <button
                      onClick={() => handleCopy(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        background: copiedId === item.id ? "#16a34a" : "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedId === item.id ? <Check size={13} /> : <FileText size={13} />}
                      {copiedId === item.id ? "Copied!" : "Copy Appeal Evidence"}
                    </button>
                  </div>
                </div>

                {/* Review Text */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                    Original Customer Review (Backed Up in Vault):
                  </span>
                  <p style={{ margin: 0, fontSize: 13, color: "#1e293b", lineHeight: 1.6, fontStyle: item.comment ? "normal" : "italic" }}>
                    {item.comment ? `"${item.comment}"` : "(Customer left a 5-star rating without written comment)"}
                  </p>
                  {item.ownerReply && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#047857" }}>
                      <b>Original Owner Reply:</b> "{item.ownerReply}"
                    </div>
                  )}
                </div>

                {/* Resource Details Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 11, color: "#94a3b8" }}>
                  <span>Google Resource Name: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>{item.reviewName}</code></span>
                  <span>Review ID: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>{item.reviewId || "N/A"}</code></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [selectedTab, setSelectedTab] = useState<string>("all"); // "all" | profileId
  const [statusFilter, setStatusFilter] = useState<"pending" | "all" | "replied" | "queue" | "deleted">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "LOWEST_STAR" | "HIGHEST_STAR">("NEWEST");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Local optimistic state of reviews
  const [localReviews, setLocalReviews] = useState<any[]>([]);

  // SWR fetch
  const { data: reviewsRes, isLoading, mutate } = useSWR(
    "/api/reviews?profileId=all",
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (reviewsRes?.data) {
      setLocalReviews(reviewsRes.data);
      if (reviewsRes.lastSynced) {
        setLastSyncTime(new Date(reviewsRes.lastSynced));
      }
    }
  }, [reviewsRes]);

  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/reviews?profileId=all&forceRefresh=true");
      const data = await res.json();
      if (data?.data) {
        setLocalReviews(data.data);
        mutate(data, false);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error("Live Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRepliedSuccess = (reviewName: string, newComment: string) => {
    setLocalReviews(prev =>
      prev.map(r => {
        if (r.name === reviewName) {
          return {
            ...r,
            isReplied: true,
            reviewReply: { comment: newComment, updateTime: new Date().toISOString() },
          };
        }
        return r;
      })
    );
  };

  const profilesList = reviewsRes?.profiles || [];

  const dynamicPendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    localReviews.forEach(r => {
      if (r.profileId && !r.isReplied) {
        counts[r.profileId] = (counts[r.profileId] || 0) + 1;
      }
    });
    return counts;
  }, [localReviews]);

  const totalPending = localReviews.filter(r => !r.isReplied).length;
  const totalAll = localReviews.length;
  const totalDeleted = reviewsRes?.deletedCount || 0;

  const displayedReviews = useMemo(() => {
    let list = [...localReviews];

    if (statusFilter === "pending") {
      list = list.filter(r => !r.isReplied);
    } else if (statusFilter === "replied") {
      list = list.filter(r => r.isReplied);
    }

    if (selectedTab !== "all") {
      list = list.filter(r => r.profileId === selectedTab);
    }

    if (starFilter !== "all") {
      const targetStar = parseInt(starFilter, 10);
      list = list.filter(r => getRating(r) === targetStar);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.reviewer?.displayName && r.reviewer.displayName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.profileName && r.profileName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.createTime || 0).getTime();
      const dateB = new Date(b.createTime || 0).getTime();
      const ratingA = getRating(a);
      const ratingB = getRating(b);

      if (sortBy === "NEWEST") return dateB - dateA;
      if (sortBy === "OLDEST") return dateA - dateB;
      if (sortBy === "LOWEST_STAR") return ratingA - ratingB || dateB - dateA;
      if (sortBy === "HIGHEST_STAR") return ratingB - ratingA || dateB - dateA;
      return dateB - dateA;
    });

    return list;
  }, [localReviews, statusFilter, selectedTab, starFilter, searchQuery, sortBy]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .profile-tabs-scroll {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }
        .profile-tabs-scroll::-webkit-scrollbar {
          height: 5px;
        }
        .profile-tabs-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .profile-tabs-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        .profile-tabs-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .profile-nav-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
          user-select: none;
        }
        .profile-nav-tab:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .profile-nav-tab.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 2px 6px rgba(37,99,235,0.25);
        }
        .profile-nav-tab .tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #475569;
        }
        .profile-nav-tab.active .tab-badge {
          background: rgba(255,255,255,0.25);
          color: #ffffff;
        }
        .status-pill-btn {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .status-pill-btn.active {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }
        .review-card-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
      `}</style>

      {/* Header Bar */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Review Reply Centre
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
                Manage, schedule, and bulk-reply customer reviews across Google Business Profiles.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Auto-Reply Settings, Export, Import, Live Sync */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowAutoReplyModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Sparkles size={14} color="#8b5cf6" /> Auto-Reply Settings
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Download size={14} color="#2563eb" /> Export Reviews
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Upload size={14} color="#10b981" /> Import Replies
          </button>

          <button
            onClick={handleLiveSync}
            disabled={isSyncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#2563eb",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#ffffff",
              cursor: isSyncing ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Live Sync"}
          </button>
        </div>
      </div>

      {/* Google API warning notices if any */}
      {reviewsRes?.errors && reviewsRes.errors.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> Google API Status Notice ({reviewsRes.errors.length} profile warnings)
            </span>
            <button
              onClick={() => setShowErrors(!showErrors)}
              style={{ background: "none", border: "none", color: "#b45309", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              {showErrors ? "Hide Details" : "View Details"}
            </button>
          </div>
          {showErrors && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 11, color: "#92400e" }}>
              {reviewsRes.errors.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Status Switcher & Profiles Tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className={`status-pill-btn ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              ⏳ Pending Replies ({totalPending})
            </button>
            <button
              className={`status-pill-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Reviews ({totalAll})
            </button>
            <button
              className={`status-pill-btn ${statusFilter === "replied" ? "active" : ""}`}
              onClick={() => setStatusFilter("replied")}
            >
              ✓ Replied ({totalAll - totalPending})
            </button>
            <button
              className={`status-pill-btn ${statusFilter === "queue" ? "active" : ""}`}
              onClick={() => setStatusFilter("queue")}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <Clock size={12} /> 🕒 Scheduled Queue
            </button>
            <button
              className={`status-pill-btn ${statusFilter === "deleted" ? "active" : ""}`}
              onClick={() => setStatusFilter("deleted")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: statusFilter === "deleted" ? "#fef2f2" : (totalDeleted > 0 ? "#fff1f2" : undefined),
                color: statusFilter === "deleted" ? "#dc2626" : (totalDeleted > 0 ? "#b91c1c" : undefined),
                borderColor: statusFilter === "deleted" ? "#fca5a5" : (totalDeleted > 0 ? "#fecdd3" : undefined),
                fontWeight: totalDeleted > 0 ? 700 : 600,
              }}
            >
              <AlertTriangle size={12} color={totalDeleted > 0 ? "#dc2626" : "#64748b"} />
              ⚠️ Removed by Google ({totalDeleted})
            </button>
          </div>

          <span style={{ fontSize: 12, fontWeight: 600, color: totalPending > 0 ? "#ea580c" : "#16a34a" }}>
            {totalPending > 0 ? `⏳ ${totalPending} pending reply` : "✓ All reviews answered"}
          </span>
        </div>

        {/* Scrollable Tabs row */}
        <div className="profile-tabs-scroll">
          <button
            onClick={() => setSelectedTab("all")}
            className={`profile-nav-tab ${selectedTab === "all" ? "active" : ""}`}
          >
            <span>All Profiles</span>
            <span className="tab-badge">{statusFilter === "pending" ? totalPending : totalAll}</span>
          </button>

          {profilesList.map((p: any) => {
            const pendingForProfile = dynamicPendingCounts[p.id] || 0;
            const shortName = truncateName(p.name, 9);
            const badgeCount = statusFilter === "pending" ? pendingForProfile : (p.totalCount || 0);

            return (
              <button
                key={p.id}
                onClick={() => setSelectedTab(p.id)}
                className={`profile-nav-tab ${selectedTab === p.id ? "active" : ""}`}
                title={p.name}
              >
                <span>{shortName}</span>
                <span
                  className="tab-badge"
                  style={{
                    background: pendingForProfile > 0 && selectedTab !== p.id ? "#fef3c7" : undefined,
                    color: pendingForProfile > 0 && selectedTab !== p.id ? "#b45309" : undefined,
                  }}
                >
                  {badgeCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Scheduled Queue OR Deleted Reviews OR Review Cards Stream */}
      {statusFilter === "queue" ? (
        <ScheduledQueueView profileId={selectedTab} />
      ) : statusFilter === "deleted" ? (
        <DeletedReviewsView profileId={selectedTab} />
      ) : (
        <>
          {/* Search, Filter & Sort Controls Toolbar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 400 }}>
              <input
                type="text"
                placeholder="Search customer, comment, or profile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px 0 34px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  background: "#f8fafc",
                }}
              />
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 11, top: 11 }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Rating:</span>
                <select
                  value={starFilter}
                  onChange={e => setStarFilter(e.target.value)}
                  style={{
                    height: 36,
                    padding: "0 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    background: "#ffffff",
                    color: "#1e293b",
                    outline: "none",
                  }}
                >
                  <option value="all">All Stars (1★ - 5★)</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                  <option value="3">⭐⭐⭐ (3 Stars)</option>
                  <option value="2">⭐⭐ (2 Stars)</option>
                  <option value="1">⭐ (1 Star)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{
                    height: 36,
                    padding: "0 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    background: "#ffffff",
                    color: "#1e293b",
                    outline: "none",
                  }}
                >
                  <option value="NEWEST">Newest Date First</option>
                  <option value="OLDEST">Oldest Date First</option>
                  <option value="LOWEST_STAR">Lowest Star Rating First</option>
                  <option value="HIGHEST_STAR">Highest Star Rating First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Review Stream */}
          {isLoading ? (
            <div style={{ padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14 }}>
              <Loader2 size={32} className="animate-spin" color="#2563eb" />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", margin: 0 }}>
                Fetching Google reviews in real-time...
              </p>
            </div>
          ) : displayedReviews.length === 0 ? (
            <div
              style={{
                padding: "80px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                textAlign: "center",
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {statusFilter === "pending" ? "All Caught Up! 🎉" : "No Reviews Found"}
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: 0 }}>
                {statusFilter === "pending"
                  ? "Zero pending reviews found awaiting response. All customer feedback has been answered!"
                  : "No reviews match your current filters or selected profile."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {displayedReviews.map((r: any) => (
                <ReviewCard
                  key={r.name || r.reviewId}
                  review={r}
                  onRepliedSuccess={handleRepliedSuccess}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          profiles={profilesList}
          selectedTab={selectedTab}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            mutate();
            setStatusFilter("queue");
          }}
        />
      )}

      {showAutoReplyModal && (
        <AutoReplySettingsModal
          onClose={() => setShowAutoReplyModal(false)}
          profiles={profilesList}
          selectedTab={selectedTab}
        />
      )}
    </div>
  );
}

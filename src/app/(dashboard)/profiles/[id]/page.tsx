"use client";

import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from "date-fns";
import { useState, useEffect } from "react";
import {
  ArrowLeft, MapPin, Plus, FileText, Clock, Send, Loader2, Lock,
  ThumbsUp, Edit3, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, Trash2, Wand2, Brain, Layers, CheckSquare, Square, CalendarDays, FileDown, X,
  Phone, Link2
} from "lucide-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { AiSettingsTab, AiGenerationModal, AiBulkGenerationModal } from "@/components/ai/ai-components";
import { ProfileEditor } from "@/components/profiles/ProfileEditor";
import { PostEditor } from "@/components/posts/post-editor";
import { ReviewManager } from "@/components/profiles/ReviewManager";
import { useSearchParams } from "next/navigation";
import { checkProhibitedContent } from "@/lib/content-validation";
import { MonthlyReportModal } from "@/components/profiles/MonthlyReportModal";
import { BulkImportModal } from "@/components/posts/BulkImportModal";
import RankTracker from "@/components/profiles/RankTracker";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Profile {
  id: string; name: string; accountName: string;
  address: string; phone: string; website: string; fetchedAt: string;
  logoUrl?: string;
  sitemapUrl?: string;
  sitemapUrls?: string[];
  sitemapUpdatedAt?: string;
}

interface Post {
  id: string; summary: string; status: string;
  scheduledAt?: string; publishedAt?: string; createdAt: string;
  imageUrl?: string; topicType: string;
  ctaType?: string;
  ctaUrl?: string;
}

// Status dot colors
const DOT: Record<string, string> = {
  PUBLISHED: "#16a34a",
  SCHEDULED: "#f59e0b",
  DRAFT: "#94a3b8",
  FAILED: "#dc2626",
  PENDING_APPROVAL: "#f59e0b",
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Published", SCHEDULED: "Scheduled", DRAFT: "Draft",
  FAILED: "Failed", PENDING_APPROVAL: "Needs Approval",
};

const tabStyles: Record<string, { activeBg: string; activeColor: string; activeBadgeBg: string; activeBadgeColor: string; inactiveBadgeBg: string; inactiveBadgeColor: string; inactiveColor: string }> = {
  ALL: {
    activeBg: "#0f172a",
    activeColor: "#ffffff",
    activeBadgeBg: "rgba(255,255,255,0.2)",
    activeBadgeColor: "#ffffff",
    inactiveBadgeBg: "#f1f5f9",
    inactiveBadgeColor: "#64748b",
    inactiveColor: "#64748b",
  },
  PUBLISHED: {
    activeBg: "#dcfce7",
    activeColor: "#15803d",
    activeBadgeBg: "#bbf7d0",
    activeBadgeColor: "#15803d",
    inactiveBadgeBg: "#f1f5f9",
    inactiveBadgeColor: "#64748b",
    inactiveColor: "#64748b",
  },
  SCHEDULED: {
    activeBg: "#fef3c7",
    activeColor: "#b45309",
    activeBadgeBg: "#fde68a",
    activeBadgeColor: "#b45309",
    inactiveBadgeBg: "#f1f5f9",
    inactiveBadgeColor: "#64748b",
    inactiveColor: "#64748b",
  },
  DRAFT: {
    activeBg: "#e2e8f0",
    activeColor: "#334155",
    activeBadgeBg: "#cbd5e1",
    activeBadgeColor: "#334155",
    inactiveBadgeBg: "#f1f5f9",
    inactiveBadgeColor: "#64748b",
    inactiveColor: "#64748b",
  },
};

/* ─── Post Card ──────────────────────────────────────────────── */
function PostCard({
  post, canApprove, onApprove, onDelete, selected, onToggleSelect, selectMode, onEdit,
}: {
  post: Post; canApprove: boolean;
  onApprove: (p: Post) => void;
  onDelete: (p: Post) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  selectMode: boolean;
  onEdit: (p: Post) => void;
}) {
  const isPublished = post.status === "PUBLISHED";
  const isDraft = post.status === "DRAFT";
  const isScheduled = post.status === "SCHEDULED";
  const isPending = post.status === "PENDING_APPROVAL";

  const dot = DOT[post.status] || "#94a3b8";

  const prohibitedIssues = checkProhibitedContent(post.summary);
  const hasProhibited = prohibitedIssues.length > 0;

  const dateDisplay = isPublished && post.publishedAt
    ? `Published ${new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" })}`
    : isScheduled && post.scheduledAt
    ? `Scheduled · ${new Date(post.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}`
    : `Created ${new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" })}`;

  const cardBorder = isPending ? "2px solid #f59e0b" : "1px solid var(--border)";
  const cardShadow = isPending ? "0 0 0 3px #fef3c7" : "none";

  return (
    <div
      onClick={() => selectMode && onToggleSelect(post.id)}
      style={{
        background: "var(--bg-card)", border: selected ? "2px solid #2563eb" : cardBorder,
        borderRadius: 10, overflow: "hidden",
        boxShadow: selected ? "0 0 0 3px #dbeafe" : cardShadow, display: "flex", flexDirection: "column",
        transition: "box-shadow 0.15s", cursor: selectMode ? "pointer" : "default",
        position: "relative"
      }}>
      {/* Select checkbox overlay */}
      {selectMode && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: selected ? "#2563eb" : "rgba(255,255,255,0.9)",
            border: `2px solid ${selected ? "#2563eb" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {selected && <CheckSquare size={14} color="white" />}
          </div>
        </div>
      )}
      {/* Image */}
      <Link href={`/posts/${post.id}`}
        style={{ display: "block", height: 108, background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
        {post.imageUrl
          ? <img src={post.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: isPublished ? "none" : "none" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText style={{ width: 26, height: 26, color: "#cbd5e1" }} />
            </div>
        }
        {/* Status dot pill top-left */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
          padding: "3px 8px", borderRadius: 20,
          fontSize: 10, fontWeight: 700, color: "#334155",
          letterSpacing: "0.04em",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
          {STATUS_LABEL[post.status] || "Draft"}
        </div>
        {/* Policy warning badge top-right */}
        {hasProhibited && (isDraft || isScheduled || isPending) && (
          <div style={{
            position: "absolute", top: 8, right: selectMode ? 40 : 8,
            background: "#fffbeb", border: "1px solid #fde68a",
            padding: "3px 8px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, color: "#b45309",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            zIndex: 5
          }} title={`Restricted details: ${prohibitedIssues.join(", ")}. Google will likely reject this post.`}>
            <AlertTriangle size={10} style={{ color: "#d97706" }} />
            <span>Warning</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{
          fontSize: 12, fontWeight: 500, color: isPublished ? "#64748b" : "#0f172a",
          lineHeight: 1.45, overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 6, flex: 1,
        }}>
          {post.summary || "No content"}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            {isScheduled && <Clock style={{ width: 9, height: 9 }} />}
            {dateDisplay}
          </p>
          {post.ctaType === "CALL" ? (
            <span style={{ display: "inline-flex" }} title="Call Now button active">
              <Phone size={11} style={{ color: "#94a3b8", flexShrink: 0 }} />
            </span>
          ) : post.ctaType && post.ctaUrl ? (
            <span style={{ display: "inline-flex" }} title={`${post.ctaType} button active: ${post.ctaUrl}`}>
              <Link2 size={11} style={{ color: "#94a3b8", flexShrink: 0 }} />
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {/* Published */}
          {isPublished && (
            <>
              <Link href={`/posts/${post.id}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc" }}>
                <Lock style={{ width: 9, height: 9 }} /> View
              </Link>
              <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#2563eb", border: "1px solid #dbeafe", borderRadius: 6, background: "#eff6ff" }}>
                <ExternalLink style={{ width: 9, height: 9 }} /> Edit
              </a>
            </>
          )}

          {/* Draft & Scheduled */}
          {(isDraft || isScheduled) && (
            <>
              <button onClick={() => onEdit(post)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#2563eb", border: "1px solid #dbeafe", borderRadius: 6, background: "#eff6ff", cursor: "pointer" }}>
                <Edit3 style={{ width: 9, height: 9 }} /> Edit
              </button>
              <Link href={`/posts/${post.id}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#fff", background: "#16a34a", border: "none", borderRadius: 6 }}>
                <Send style={{ width: 9, height: 9 }} /> Publish
              </Link>
              <button onClick={() => onDelete(post)}
                style={{ padding: "5px 7px", fontSize: 11, color: "#dc2626", border: "1px solid #fee2e2", background: "#fef2f2", borderRadius: 6, display: "flex", alignItems: "center", cursor: "pointer" }}>
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </>
          )}

          {/* Pending approval */}
          {isPending && canApprove && (
            <>
              <Link href={`/posts/${post.id}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                Preview
              </Link>
              <button onClick={() => onApprove(post)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 700, color: "#fff", background: "#d97706", border: "none", borderRadius: 6, cursor: "pointer" }}>
                <ThumbsUp style={{ width: 9, height: 9 }} /> Approve
              </button>
            </>
          )}
          {isPending && !canApprove && (
            <span style={{ fontSize: 10, color: "#b45309", fontStyle: "italic" }}>Awaiting manager review</span>
          )}

          {/* Failed */}
          {post.status === "FAILED" && (
            <>
              <Link href={`/posts/${post.id}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                View
              </Link>
              <button onClick={() => onDelete(post)}
                style={{ padding: "5px 7px", fontSize: 11, color: "#dc2626", border: "1px solid #fee2e2", background: "#fef2f2", borderRadius: 6, display: "flex", alignItems: "center", cursor: "pointer" }}>
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Calendar ─────────────────────────────────────────── */
function ActivityCalendar({ posts }: { posts: Post[] }) {
  const [month, setMonth] = useState(new Date());

  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start); // 0=Sun

  // Build a map: dateStr -> statuses
  const dateMap: Record<string, string[]> = {};
  posts.forEach(p => {
    const d = p.publishedAt || p.scheduledAt || p.createdAt;
    if (!d) return;
    const key = format(new Date(d), "yyyy-MM-dd");
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(p.status);
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      {/* Month nav */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ padding: 6, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex" }}>
          <ChevronLeft style={{ width: 14, height: 14, color: "#64748b" }} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          {format(month, "MMMM yyyy")}
        </span>
        <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ padding: 6, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex" }}>
          <ChevronRight style={{ width: 14, height: 14, color: "#64748b" }} />
        </button>
      </div>

      {/* Grid */}
      <div style={{ padding: "12px 14px 16px" }}>
        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
          {weekDays.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 0" }}>
              {d[0]}
            </div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {/* Padding cells */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(day => {
            const key = format(day, "yyyy-MM-dd");
            const statuses = dateMap[key] || [];
            const today = isToday(day);
            const hasPublished = statuses.includes("PUBLISHED");
            const hasScheduled = statuses.includes("SCHEDULED");
            const hasDraft = statuses.includes("DRAFT") || statuses.includes("PENDING_APPROVAL");

            return (
              <div key={key} style={{
                aspectRatio: "1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                borderRadius: 7,
                background: today ? "#2563eb" : statuses.length > 0 ? "#f0f9ff" : "transparent",
                border: today ? "none" : statuses.length > 0 ? "1px solid #bfdbfe" : "1px solid transparent",
                position: "relative",
              }}>
                <span style={{ fontSize: 12, fontWeight: today ? 700 : 400, color: today ? "#fff" : "#0f172a" }}>
                  {format(day, "d")}
                </span>
                {/* Activity dots */}
                {statuses.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2, position: "absolute", bottom: 3 }}>
                    {hasPublished && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#16a34a" }} />}
                    {hasScheduled && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#f59e0b" }} />}
                    {hasDraft && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#94a3b8" }} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { dot: "#16a34a", label: "Published" },
          { dot: "#f59e0b", label: "Scheduled" },
          { dot: "#94a3b8", label: "Draft" },
        ].map(item => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b", fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.dot, display: "inline-block" }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ProfileDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const canApprove = (session as any)?.user?.role === "SUPER_ADMIN" || (session as any)?.user?.role === "AGENCY_OWNER";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const searchParamsHook = useSearchParams();
  const initialTab = searchParamsHook.get("tab") === "ai" ? "AI_SETTINGS" : "POSTS";
  const [activeTab, setActiveTab] = useState<"POSTS" | "AI_SETTINGS" | "EDIT_PROFILE" | "REVIEWS" | "RANK_TRACKER">(initialTab as any);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isBulkAiModalOpen, setIsBulkAiModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkScheduleDate, setBulkScheduleDate] = useState("");
  const [bulkScheduleFrequency, setBulkScheduleFrequency] = useState(1);
  const [showBulkSchedule, setShowBulkSchedule] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkCtaType, setBulkCtaType] = useState("KEEP_ORIGINAL");
  const [bulkCtaUrl, setBulkCtaUrl] = useState("");
  const [showBulkCtaUrlDropdown, setShowBulkCtaUrlDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const { data: postsData, isLoading: postsLoading, mutate: mutatePosts } = useSWR(
    params.id ? `/api/posts?profileId=${params.id}` : null,
    fetcher, { revalidateOnFocus: false }
  );

  const posts: Post[] = postsData?.data || [];

  const handleApprove = async (post: Post) => {
    const newStatus = (post as any).scheduledAt ? "SCHEDULED" : "PUBLISHED";
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(post as any), status: newStatus }),
    });
    if (res.ok) mutatePosts(); else alert("Failed to approve post.");
  };

  const handleDelete = async (post: Post) => {
    if (post.status === "PUBLISHED") return;
    if (!confirm("Delete this post permanently?")) return;
    mutatePosts({ ...postsData, data: posts.filter(p => p.id !== post.id) }, false);
    const res = await fetch(`/api/posts?id=${post.id}`, { method: "DELETE" });
    if (!res.ok) {
      mutatePosts();
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to delete post. Please try again.");
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(s => !s);
    setSelectedPosts(new Set());
    setShowBulkSchedule(false);
  };

  const togglePostSelect = (id: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const nonPublished = sortedPosts.filter(p => p.status !== "PUBLISHED").map(p => p.id);
    setSelectedPosts(new Set(nonPublished));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedPosts.size} posts permanently?`)) return;
    setBulkActionLoading(true);
    await Promise.all([...selectedPosts].map(id => fetch(`/api/posts?id=${id}`, { method: "DELETE" })));
    setSelectedPosts(new Set());
    setSelectMode(false);
    mutatePosts();
    setBulkActionLoading(false);
  };

  const handleBulkDraft = async () => {
    setBulkActionLoading(true);
    await Promise.all([...selectedPosts].map(id =>
      fetch(`/api/posts/${id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "DRAFT" }) })
    ));
    setSelectedPosts(new Set());
    setSelectMode(false);
    mutatePosts();
    setBulkActionLoading(false);
  };

  const handleBulkSchedule = async () => {
    if (!bulkScheduleDate) return alert("Please pick a start date first.");
    setBulkActionLoading(true);
    const ids = [...selectedPosts];
    // Spread posts: each post goes on startDate + (index * frequencyDays), at 10:00 AM
    await Promise.all(ids.map((id, i) => {
      const d = new Date(bulkScheduleDate);
      d.setDate(d.getDate() + i * bulkScheduleFrequency);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      // Convert local 10:00 AM to UTC ISO string so timezone is stored correctly
      const localDt = new Date(`${yyyy}-${mm}-${dd}T10:00:00`);
      return fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          status: "SCHEDULED",
          scheduledAt: localDt.toISOString(),
          ...(bulkCtaType !== "KEEP_ORIGINAL" ? {
            ctaType: bulkCtaType === "NONE" ? "" : bulkCtaType,
            ctaUrl: (bulkCtaType === "NONE" || bulkCtaType === "CALL") ? "" : (bulkCtaUrl || ""),
          } : {})
        })
      });
    }));
    setSelectedPosts(new Set());
    setSelectMode(false);
    setShowBulkSchedule(false);
    mutatePosts();
    setBulkActionLoading(false);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/profiles/${params.id}`);
        const data = await res.json();
        setProfile(data.data || null);
      } catch { setProfile(null); }
      setProfileLoading(false);
    }
    loadProfile();
  }, [params.id]);

  if (profileLoading) return (
    <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>
      <Loader2 style={{ width: 20, height: 20, color: "#94a3b8" }} className="anim-spin" />
    </div>
  );

  if (!profile) return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Profile not found.</p>
      <Link href="/profiles" style={{ color: "#2563eb", fontSize: 13, marginTop: 8, display: "inline-block" }}>← All profiles</Link>
    </div>
  );

  const now = new Date();
  const publishedThisMonth = posts.filter(p => {
    if (p.status !== "PUBLISHED" || !p.publishedAt) return false;
    const d = new Date(p.publishedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const scheduled = posts.filter(p => p.status === "SCHEDULED").length;
  const drafts = posts.filter(p => p.status === "DRAFT").length;
  const pending = posts.filter(p => p.status === "PENDING_APPROVAL").length;

  const tabs = [
    { key: "ALL", label: "All", count: posts.length },
    { key: "PUBLISHED", label: "Published", count: posts.filter(p => p.status === "PUBLISHED").length },
    { key: "SCHEDULED", label: "Scheduled", count: scheduled },
    { key: "DRAFT", label: "Draft", count: drafts },
    ...(pending > 0 ? [{ key: "PENDING_APPROVAL", label: "Needs Approval", count: pending }] : []),
  ];

  const filteredPosts = statusFilter === "ALL" ? posts : posts.filter(p => p.status === statusFilter);
  
  const getSortingDate = (p: Post) => {
    if (p.status === "PUBLISHED" && p.publishedAt) {
      return new Date(p.publishedAt).getTime();
    }
    if (p.status === "SCHEDULED" && p.scheduledAt) {
      return new Date(p.scheduledAt).getTime();
    }
    return new Date(p.createdAt).getTime();
  };

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = getSortingDate(a);
    const dateB = getSortingDate(b);

    if (sortBy === "NEWEST") {
      return dateB - dateA;
    } else if (sortBy === "OLDEST") {
      return dateA - dateB;
    } else if (sortBy === "WITH_IMAGES") {
      const aHasImage = !!a.imageUrl;
      const bHasImage = !!b.imageUrl;
      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;
      return dateB - dateA;
    } else if (sortBy === "WITHOUT_IMAGES") {
      const aHasImage = !!a.imageUrl;
      const bHasImage = !!b.imageUrl;
      if (!aHasImage && bHasImage) return -1;
      if (aHasImage && !bHasImage) return 1;
      return dateB - dateA;
    }
    
    // DEFAULT sort
    // 1. Published posts always first
    if (a.status === "PUBLISHED" && b.status !== "PUBLISHED") return -1;
    if (a.status !== "PUBLISHED" && b.status === "PUBLISHED") return 1;

    // 2. Images first (within status groups)
    const aHasImage = !!a.imageUrl;
    const bHasImage = !!b.imageUrl;
    if (aHasImage && !bHasImage) return -1;
    if (!aHasImage && bHasImage) return 1;

    // 3. Status-specific newest first
    return dateB - dateA;
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Back */}
      <Link href="/profiles" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> All Profiles
      </Link>

      {/* Profile Header */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
        padding: "22px 24px", marginBottom: 20,
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin style={{ width: 20, height: 20, color: "#2563eb" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{profile.name}</h1>
            {profile.address && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{profile.address}</p>}
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setIsReportModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "#fff", border: "1px solid #e2e8f0", color: "#475569", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <FileDown style={{ width: 15, height: 15 }} /> Monthly Report
          </button>
          <button onClick={() => setIsBulkImportModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Layers style={{ width: 15, height: 15 }} /> Bulk Import
          </button>
          <Link href={`/posts/new?profile=${profile.id}&from=profile`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            <Plus style={{ width: 15, height: 15 }} /> Create Post
          </Link>
        </div>
      </div>

      {/* Tabs Sticky Wrapper */}
      <div style={{
        position: "sticky",
        top: -32,
        zIndex: 40,
        background: "#f1f5f9",
        paddingTop: 32,
        paddingBottom: 10,
        marginTop: -32,
        marginBottom: 10,
      }}>
        <div style={{ 
          background: "#ffffff",
          backgroundImage: `
            linear-gradient(to right, rgba(226, 232, 240, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(226, 232, 240, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "12px 24px",
          boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.02), 0 2px 4px -2px rgba(15, 23, 42, 0.02)",
          display: "flex", 
          gap: 24 
        }}>
          <button 
            onClick={() => setActiveTab("POSTS")}
            style={{ 
              padding: "10px 4px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              color: activeTab === "POSTS" ? "#2563eb" : "#94a3b8",
              borderBottom: activeTab === "POSTS" ? "2px solid #2563eb" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            Posts
          </button>
          <button 
            onClick={() => setIsEditProfileOpen(true)}
            style={{ 
              padding: "10px 4px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              color: isEditProfileOpen ? "#2563eb" : "#94a3b8",
              borderBottom: isEditProfileOpen ? "2px solid #2563eb" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            Edit Profile
          </button>
          <button 
            onClick={() => setActiveTab("REVIEWS")}
            style={{ 
              padding: "10px 4px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
              color: activeTab === "REVIEWS" ? "#2563eb" : "#94a3b8",
              borderBottom: activeTab === "REVIEWS" ? "2px solid #2563eb" : "2px solid transparent",
              transition: "all 0.2s"
            }}
          >
            Reviews
          </button>
          {canApprove && (
            <button 
              onClick={() => setActiveTab("RANK_TRACKER")}
              style={{ 
                padding: "10px 4px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
                color: activeTab === "RANK_TRACKER" ? "#2563eb" : "#94a3b8",
                borderBottom: activeTab === "RANK_TRACKER" ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.2s"
              }}
            >
              Local Rank Tracker
            </button>
          )}
        </div>
      </div>

      {activeTab === "AI_SETTINGS" ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <AiSettingsTab locationId={profile.id} profileName={profile.name} />
        </div>
      ) : activeTab === "REVIEWS" ? (
        <ReviewManager profileId={profile.id} />
      ) : activeTab === "RANK_TRACKER" ? (
        <RankTracker profileId={profile.id} profileName={profile.name} address={profile.address} />
      ) : (
        /* Original Two-Column Layout */
        <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 18, alignItems: "start" }}>

        {/* LEFT — Compact Stats + Calendar */}
        <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Compact vertical stats */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            {[
              { label: "Published", sublabel: "this month", value: publishedThisMonth, dot: "#16a34a" },
              { label: "Scheduled", sublabel: "upcoming",   value: scheduled,         dot: "#f59e0b" },
              { label: "Drafts",    sublabel: "in progress", value: drafts,            dot: "#94a3b8" },
              { label: "Awaiting",  sublabel: "approval",   value: pending,           dot: "#f97316" },
            ].map((s, i, arr) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0, display: "inline-block" }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</p>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "#cbd5e1" }}>{s.sublabel}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <ActivityCalendar posts={posts} />

          <p style={{ fontSize: 10, color: "#94a3b8", paddingLeft: 2 }}>
            Synced {format(new Date(profile.fetchedAt), "MMM d, yyyy")}
          </p>
        </div>

        {/* RIGHT — Post Cards Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Sticky Filters Card Wrapper */}
          <div style={{
            position: "sticky",
            top: 90,
            zIndex: 35,
            background: "#f1f5f9",
            paddingBottom: 10,
          }}>
            {/* Filter tabs + Select Mode toggle Card */}
            <div style={{ 
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "14px 16px", 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              flexWrap: "wrap", 
              justifyContent: "space-between" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {tabs.map(t => {
                  const isSelected = statusFilter === t.key;
                  const styleConfig = tabStyles[t.key] || tabStyles.ALL;
                  return (
                    <button key={t.key} onClick={() => setStatusFilter(t.key)}
                      style={{
                        padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: 600,
                        background: isSelected ? styleConfig.activeBg : "transparent",
                        color: isSelected ? styleConfig.activeColor : styleConfig.inactiveColor,
                        display: "flex", alignItems: "center", gap: 5,
                        transition: "all 0.15s"
                      }}>
                      {t.label}
                      {t.count > 0 && (
                        <span style={{
                          fontSize: 10, 
                          background: isSelected ? styleConfig.activeBadgeBg : styleConfig.inactiveBadgeBg,
                          color: isSelected ? styleConfig.activeBadgeColor : styleConfig.inactiveBadgeColor,
                          borderRadius: 10, padding: "0 6px", fontWeight: 700,
                        }}>{t.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff",
                    fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer", outline: "none"
                  }}
                >
                  <option value="DEFAULT">Sort by: Default</option>
                  <option value="NEWEST">Sort by: Newest</option>
                  <option value="OLDEST">Sort by: Oldest</option>
                  <option value="WITH_IMAGES">Sort by: With Images</option>
                  <option value="WITHOUT_IMAGES">Sort by: Without Images</option>
                </select>
                <button
                  onClick={toggleSelectMode}
                  style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, background: selectMode ? "#0f172a" : "#f8fafc", color: selectMode ? "#fff" : "#64748b" }}>
                  <CheckSquare style={{ width: 12, height: 12 }} />
                  {selectMode ? "Exit Select" : "Select"}
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectMode && selectedPosts.size > 0 && (
            <div style={{ padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.02)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e40af" }}>{selectedPosts.size} selected</span>
              <button onClick={selectAll} style={{ fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Select All</button>
              <div style={{ flex: 1 }} />
              {bulkActionLoading ? (
                <Loader2 style={{ width: 16, height: 16, color: "#2563eb" }} className="anim-spin" />
              ) : (
                <>
                  <button
                    onClick={handleBulkDraft}
                    style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                    → Draft
                  </button>
                  <button
                    onClick={() => setShowBulkSchedule(s => !s)}
                    style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #dbeafe", background: "#eff6ff", fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <CalendarDays style={{ width: 12, height: 12 }} /> Schedule
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", fontSize: 12, fontWeight: 600, color: "#dc2626", cursor: "pointer" }}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {/* Bulk Schedule Date + Frequency Picker */}
          {selectMode && selectedPosts.size > 0 && showBulkSchedule && (
            <div style={{ padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.02)" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Start from:</label>
              <input
                type="date"
                value={bulkScheduleDate}
                onChange={e => setBulkScheduleDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}
              />
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Frequency:</label>
              <select
                value={bulkScheduleFrequency}
                onChange={e => setBulkScheduleFrequency(Number(e.target.value))}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}
              >
                <option value={1}>Daily</option>
                <option value={2}>Alternate Days</option>
                <option value={3}>Every 3 Days</option>
                <option value={4}>Every 4 Days</option>
                <option value={5}>Every 5 Days</option>
                <option value={7}>Weekly</option>
              </select>

              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>CTA Type:</label>
              <select
                value={bulkCtaType}
                onChange={e => setBulkCtaType(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}
              >
                <option value="KEEP_ORIGINAL">Keep Original</option>
                <option value="NONE">None</option>
                <option value="CALL">Call Now</option>
                <option value="LEARN_MORE">Learn More</option>
                <option value="BOOK">Book</option>
                <option value="ORDER">Order Online</option>
                <option value="SHOP">Shop</option>
                <option value="SIGN_UP">Sign Up</option>
              </select>

              {bulkCtaType !== "KEEP_ORIGINAL" && bulkCtaType !== "NONE" && bulkCtaType !== "CALL" && (
                <>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>CTA URL:</label>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={bulkCtaUrl}
                      onChange={e => setBulkCtaUrl(e.target.value)}
                      onFocus={() => setShowBulkCtaUrlDropdown(true)}
                      onBlur={() => setTimeout(() => setShowBulkCtaUrlDropdown(false), 200)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, width: 220 }}
                    />
                    
                    {/* Sitemap Autocomplete Dropdown overlay */}
                    {showBulkCtaUrlDropdown && profile?.sitemapUrls && (profile.sitemapUrls as string[]).length > 0 && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                        zIndex: 100,
                        maxHeight: 200,
                        overflowY: "auto",
                        marginTop: 4,
                        width: 250
                      }}>
                        {(profile.sitemapUrls as string[])
                          .filter((url: string) => !bulkCtaUrl || url.toLowerCase().includes(bulkCtaUrl.toLowerCase()))
                          .slice(0, 15)
                          .map((url: string, index: number) => (
                            <div
                              key={index}
                              onMouseDown={() => {
                                setBulkCtaUrl(url);
                                setShowBulkCtaUrlDropdown(false);
                              }}
                              style={{
                                padding: "8px 12px",
                                fontSize: 12,
                                color: "#334155",
                                cursor: "pointer",
                                borderBottom: "1px solid #f1f5f9",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                textAlign: "left"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              {url}
                            </div>
                          ))}
                        {(profile.sitemapUrls as string[]).filter((url: string) => !bulkCtaUrl || url.toLowerCase().includes(bulkCtaUrl.toLowerCase())).length === 0 && (
                          <div style={{ padding: "10px", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                            No matching sitemap URLs.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={handleBulkSchedule}
                disabled={!bulkScheduleDate}
                style={{ padding: "6px 16px", borderRadius: 8, background: bulkScheduleDate ? "#0f172a" : "#e2e8f0", color: bulkScheduleDate ? "#fff" : "#94a3b8", border: "none", fontSize: 12, fontWeight: 700, cursor: bulkScheduleDate ? "pointer" : "not-allowed" }}>
                Confirm Schedule
              </button>
              {bulkScheduleDate && bulkScheduleFrequency > 0 && (
                <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
                  {selectedPosts.size} posts · {
                    bulkScheduleFrequency === 1 ? "daily" : 
                    bulkScheduleFrequency === 2 ? "alternate days" : 
                    bulkScheduleFrequency === 4 ? "every 4 days" : 
                    bulkScheduleFrequency === 5 ? "every 5 days" : 
                    `every ${bulkScheduleFrequency} days`
                  } from {bulkScheduleDate}
                </span>
              )}
            </div>
          )}

          {/* Cards Grid Card */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", minHeight: 300 }}>
            {postsLoading ? (
              <div style={{ padding: "60px 0", display: "flex", justifyContent: "center" }}>
                <Loader2 style={{ width: 18, height: 18, color: "#94a3b8" }} className="anim-spin" />
              </div>
            ) : sortedPosts.length === 0 ? (
              <div style={{ padding: "50px 0", textAlign: "center" }}>
                <FileText style={{ width: 32, height: 32, color: "#e2e8f0", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 10 }}>No posts yet.</p>
                <Link href={`/posts/new?profile=${profile.id}&from=profile`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid #2563eb", color: "#2563eb", borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Create first post
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {sortedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    canApprove={canApprove}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                    selected={selectedPosts.has(post.id)}
                    onToggleSelect={togglePostSelect}
                    selectMode={selectMode}
                    onEdit={(p) => setEditingPost(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      <AiGenerationModal 
        locationId={profile.id}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerated={() => {
          mutatePosts();
          setActiveTab("POSTS");
          setStatusFilter("DRAFT");
        }}
      />
      <AiBulkGenerationModal 
        locationId={profile.id}
        isOpen={isBulkAiModalOpen}
        onClose={() => setIsBulkAiModalOpen(false)}
        onGenerated={() => {
          mutatePosts();
          setActiveTab("POSTS");
          setStatusFilter("ALL"); // or DRAFT/SCHEDULED
        }}
      />
      <MonthlyReportModal 
        profileId={profile.id}
        profileName={profile.name}
        logoUrl={profile.logoUrl}
        address={profile.address}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      <BulkImportModal
        locationId={profile.id}
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onSuccess={() => { mutatePosts(); setIsBulkImportModalOpen(false); }}
      />

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 20
        }} onClick={() => setIsEditProfileOpen(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 650,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            position: "relative"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              <ProfileEditor profile={profile} onUpdate={() => { mutatePosts(); setIsEditProfileOpen(false); }} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 20
        }} onClick={() => setEditingPost(null)}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 1100,
            height: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            position: "relative"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Edit Post</h3>
              <button onClick={() => setEditingPost(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <PostEditor 
                initialData={editingPost} 
                lockedProfileId={profile.id}
                onSaveSuccess={() => {
                  mutatePosts();
                  setEditingPost(null);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

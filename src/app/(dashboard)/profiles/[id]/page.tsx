"use client";

import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from "date-fns";
import { useState, useEffect } from "react";
import {
  ArrowLeft, MapPin, Plus, FileText, Clock, Send, Loader2, Lock,
  ThumbsUp, Edit3, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, Trash2, Wand2, Brain
} from "lucide-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { AiSettingsTab, AiGenerationModal } from "@/components/ai/ai-components";
import { useSearchParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Profile {
  id: string; name: string; accountName: string;
  address: string; phone: string; website: string; fetchedAt: string;
}

interface Post {
  id: string; summary: string; status: string;
  scheduledAt?: string; publishedAt?: string; createdAt: string;
  imageUrl?: string; topicType: string;
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

/* ─── Post Card ──────────────────────────────────────────────── */
function PostCard({
  post, canApprove, onApprove, onDelete,
}: {
  post: Post; canApprove: boolean;
  onApprove: (p: Post) => void;
  onDelete: (p: Post) => void;
}) {
  const isPublished = post.status === "PUBLISHED";
  const isDraft = post.status === "DRAFT";
  const isScheduled = post.status === "SCHEDULED";
  const isPending = post.status === "PENDING_APPROVAL";

  const dot = DOT[post.status] || "#94a3b8";

  const dateDisplay = isPublished && post.publishedAt
    ? `Published ${format(new Date(post.publishedAt), "MMM d, yyyy")}`
    : isScheduled && post.scheduledAt
    ? `Scheduled · ${format(new Date(post.scheduledAt), "MMM d · h:mm a")}`
    : `Created ${format(new Date(post.createdAt), "MMM d, yyyy")}`;

  const cardBorder = isPending ? "2px solid #f59e0b" : "1px solid var(--border)";
  const cardShadow = isPending ? "0 0 0 3px #fef3c7" : "none";

  return (
    <div style={{
      background: "var(--bg-card)", border: cardBorder,
      borderRadius: 10, overflow: "hidden",
      boxShadow: cardShadow, display: "flex", flexDirection: "column",
      transition: "box-shadow 0.15s",
    }}>
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
        <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
          {isScheduled && <Clock style={{ width: 9, height: 9 }} />}
          {dateDisplay}
        </p>

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
                <ExternalLink style={{ width: 9, height: 9 }} /> Edit on Google
              </a>
            </>
          )}

          {/* Draft */}
          {isDraft && (
            <>
              <Link href={`/posts/${post.id}`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 0", fontSize: 11, fontWeight: 600, color: "#2563eb", border: "1px solid #dbeafe", borderRadius: 6, background: "#eff6ff" }}>
                <Edit3 style={{ width: 9, height: 9 }} /> Edit
              </Link>
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

          {/* Scheduled */}
          {isScheduled && (
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
  const [activeTab, setActiveTab] = useState<"POSTS" | "AI_SETTINGS">(initialTab);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
    if (post.status === "PUBLISHED") return; // Never delete published
    if (!confirm("Delete this post permanently?")) return;
    // Optimistic remove
    mutatePosts({ ...postsData, data: posts.filter(p => p.id !== post.id) }, false);
    const res = await fetch(`/api/posts?id=${post.id}`, { method: "DELETE" });
    if (!res.ok) {
      mutatePosts(); // restore
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to delete post. Please try again.");
    }
    // If ok, optimistic state is already correct
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profiles");
        const data = await res.json();
        const found = (data.data || []).find((p: any) => p.id === params.id);
        setProfile(found || null);
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
  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
          <button onClick={() => setIsAiModalOpen(true)} className="btn btn-ghost" style={{ gap: 8, color: "var(--accent)", background: "var(--accent-light)" }}>
            <Wand2 style={{ width: 16, height: 16 }} />
            AI
          </button>
          <Link href={`/posts/new?profile=${profile.id}&from=profile`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            <Plus style={{ width: 15, height: 15 }} /> Create Post
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, marginBottom: 20, borderBottom: "1px solid #e2e8f0" }}>
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
          onClick={() => setActiveTab("AI_SETTINGS")}
          style={{ 
            padding: "10px 4px", fontSize: 14, fontWeight: 600, border: "none", background: "none", cursor: "pointer",
            color: activeTab === "AI_SETTINGS" ? "#2563eb" : "#94a3b8",
            borderBottom: activeTab === "AI_SETTINGS" ? "2px solid #2563eb" : "2px solid transparent",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Brain style={{ width: 14, height: 14 }} />
            Train
          </div>
        </button>
      </div>

      {activeTab === "AI_SETTINGS" ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <AiSettingsTab locationId={profile.id} profileName={profile.name} />
        </div>
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

        {/* RIGHT — Post Cards */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          {/* Filter tabs */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setStatusFilter(t.key)}
                style={{
                  padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: statusFilter === t.key ? "#0f172a" : "transparent",
                  color: statusFilter === t.key ? "#fff" : "#64748b",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    fontSize: 10, background: statusFilter === t.key ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                    color: statusFilter === t.key ? "#fff" : "#64748b",
                    borderRadius: 10, padding: "0 5px", fontWeight: 700,
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div style={{ padding: 16, minHeight: 300, background: "#f8fafc" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
                {sortedPosts.map(post => (
                  <PostCard key={post.id} post={post} canApprove={canApprove} onApprove={handleApprove} onDelete={handleDelete} />
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
    </div>
  );
}

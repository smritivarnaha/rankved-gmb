"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Star, MessageSquare, Search, RefreshCw, AlertCircle, CheckCircle2,
  ExternalLink, Building2, Clock, Loader2, Send, ChevronDown, Check,
  Sparkles, ArrowUpDown, Filter
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

interface PendingReviewCardProps {
  review: any;
  onRepliedSuccess: (reviewName: string) => void;
}

function PendingReviewCard({ review, onRepliedSuccess }: PendingReviewCardProps) {
  const [replyText, setReplyText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const rating = getRating(review);
  const dateFormatted = formatRelativeTime(review.createTime);

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setIsPosting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: review.profileId,
          reviewName: review.name,
          comment: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Reply posted successfully to Google!");
        setTimeout(() => {
          onRepliedSuccess(review.name);
        }, 800);
      } else {
        setErrorMsg(data.error || "Failed to post reply to Google.");
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
        gap: 16,
        transition: "all 0.2s ease",
        position: "relative",
      }}
      className="pending-review-card"
    >
      {/* Top Header info: Reviewer + Profile Source Badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Avatar name={review.reviewer?.displayName || "?"} photoUrl={review.reviewer?.profilePhotoUrl} size={40} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {review.reviewer?.displayName || "Anonymous Customer"}
            </p>
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

      {/* Error / Success feedback */}
      {errorMsg && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}

      {/* Reply Input Box */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Write Reply
          </label>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
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
                padding: "7px 12px",
                borderRadius: 8,
                background: "#f1f5f9",
              }}
            >
              <ExternalLink size={13} /> View on Google
            </a>
          )}

          <button
            onClick={handlePostReply}
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
                <Loader2 size={13} className="animate-spin" /> Posting to Google...
              </>
            ) : (
              <>
                <Send size={13} /> Post Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [selectedTab, setSelectedTab] = useState<string>("all"); // "all" | profileId
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<string>("all"); // "all" | "5" | "4" | "3" | "2" | "1"
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "LOWEST_STAR" | "HIGHEST_STAR">("NEWEST");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Local optimistic state of reviews so replied reviews disappear immediately
  const [localReviews, setLocalReviews] = useState<any[]>([]);

  // Fetch reviews using SWR
  const { data: reviewsRes, isLoading, mutate, error } = useSWR(
    "/api/reviews?profileId=all&pendingOnly=true",
    fetcher,
    { revalidateOnFocus: false }
  );

  // Sync SWR data into local state
  useEffect(() => {
    if (reviewsRes?.data) {
      setLocalReviews(reviewsRes.data);
      if (reviewsRes.lastSynced) {
        setLastSyncTime(new Date(reviewsRes.lastSynced));
      }
    }
  }, [reviewsRes]);

  // Live Sync button handler
  const handleLiveSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/reviews?profileId=all&pendingOnly=true&forceRefresh=true");
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

  // Callback when a review is replied to
  const handleRepliedSuccess = (reviewName: string) => {
    setLocalReviews(prev => prev.filter(r => r.name !== reviewName));
  };

  const profilesList = reviewsRes?.profiles || [];

  // Compute pending counts per profile dynamically from localReviews
  const dynamicPendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    localReviews.forEach(r => {
      if (r.profileId) {
        counts[r.profileId] = (counts[r.profileId] || 0) + 1;
      }
    });
    return counts;
  }, [localReviews]);

  // Filter & Sort reviews
  const displayedReviews = useMemo(() => {
    let list = [...localReviews];

    // Profile Tab Filter
    if (selectedTab !== "all") {
      list = list.filter(r => r.profileId === selectedTab);
    }

    // Star Rating Filter
    if (starFilter !== "all") {
      const targetStar = parseInt(starFilter, 10);
      list = list.filter(r => getRating(r) === targetStar);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.reviewer?.displayName && r.reviewer.displayName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.profileName && r.profileName.toLowerCase().includes(q))
      );
    }

    // Sorting
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
  }, [localReviews, selectedTab, starFilter, searchQuery, sortBy]);

  const totalPending = localReviews.length;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
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
        .pending-review-card:hover {
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
                Pending Review Replies
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
                Manage and respond to unanswered Google Business Profile reviews in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Live Sync Action */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} /> Synced {formatRelativeTime(lastSyncTime.toISOString())}
          </span>
          <button
            onClick={handleLiveSync}
            disabled={isSyncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 16px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#1e293b",
              cursor: isSyncing ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin text-blue-600" : "text-slate-600"} />
            {isSyncing ? "Syncing Google..." : "Live Sync"}
          </button>
        </div>
      </div>

      {/* Top Banner: Profiles Horizontal Tabs (Max 8-9 Chars Truncated) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Filter By Profile
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: totalPending > 0 ? "#ea580c" : "#16a34a" }}>
            {totalPending > 0 ? `⏳ ${totalPending} reviews awaiting reply` : "✓ All reviews replied"}
          </span>
        </div>

        {/* Scrollable Tabs row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 6,
            scrollbarWidth: "thin",
          }}
        >
          {/* Tab 1: All */}
          <button
            onClick={() => setSelectedTab("all")}
            className={`profile-nav-tab ${selectedTab === "all" ? "active" : ""}`}
          >
            <span>All</span>
            <span className="tab-badge">{totalPending}</span>
          </button>

          {/* Individual Profile Tabs */}
          {profilesList.map((p: any) => {
            const count = dynamicPendingCounts[p.id] || 0;
            const shortName = truncateName(p.name, 9);

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
                    background: count > 0 && selectedTab !== p.id ? "#fef3c7" : undefined,
                    color: count > 0 && selectedTab !== p.id ? "#b45309" : undefined,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Search by customer, comment, or profile..."
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

        {/* Dropdowns: Star Rating & Sorting */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Star Filter */}
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

          {/* Sort By */}
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
              <option value="OLDEST">Oldest Date First (Waiting longest)</option>
              <option value="LOWEST_STAR">Lowest Star Rating First</option>
              <option value="HIGHEST_STAR">Highest Star Rating First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Reviews Stream / Empty State */}
      {isLoading ? (
        <div style={{ padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14 }}>
          <Loader2 size={32} className="animate-spin" color="#2563eb" />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", margin: 0 }}>
            Fetching pending Google reviews in real-time...
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
            All Caught Up! 🎉
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: 0 }}>
            {selectedTab !== "all"
              ? "There are no pending reviews awaiting response for this profile."
              : "Zero pending reviews found across all connected locations. All customer feedback has been answered!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {displayedReviews.map((r: any) => (
            <PendingReviewCard
              key={r.name || r.reviewId}
              review={r}
              onRepliedSuccess={handleRepliedSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

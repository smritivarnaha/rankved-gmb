"use client";

import { useState, useMemo } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Search, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, X, ExternalLink, Building2 } from "lucide-react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/Skeleton";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type SentimentFilter = "all" | "positive" | "negative" | "neutral";

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          fill={i <= rating ? "#FBBF24" : "none"}
          color={i <= rating ? "#FBBF24" : "#D1D5DB"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, onReply }: { review: any; onReply: (review: any) => void }) {
  const rating = review.starRating === "FIVE" ? 5 : review.starRating === "FOUR" ? 4 : review.starRating === "THREE" ? 3 : review.starRating === "TWO" ? 2 : 1;
  const date = review.createTime ? new Date(review.createTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  const hasReply = !!review.reviewReply?.comment;
  const sentiment = rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative";
  const sentimentColor = sentiment === "positive" ? "#16a34a" : sentiment === "neutral" ? "#ca8a04" : "#dc2626";
  const sentimentBg = sentiment === "positive" ? "#f0fdf4" : sentiment === "neutral" ? "#fefce8" : "#fef2f2";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f1f5f9",
      borderRadius: 14,
      padding: 20,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)")}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {review.reviewer?.profilePhotoUrl ? (
            <img src={review.reviewer.profilePhotoUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #f1f5f9" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#2563eb" }}>
              {(review.reviewer?.displayName || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111" }}>{review.reviewer?.displayName || "Anonymous"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <StarRating rating={rating} />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{date}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: sentimentColor, background: sentimentBg, padding: "3px 8px", borderRadius: 6 }}>
            {sentiment === "positive" ? "Positive" : sentiment === "neutral" ? "Neutral" : "Negative"}
          </span>
          {hasReply && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: 6 }}>
              Replied
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      {review.comment && (
        <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          "{review.comment}"
        </p>
      )}

      {/* Existing Reply */}
      {hasReply && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.04em" }}>Your Reply</p>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{review.reviewReply.comment}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button
          onClick={() => onReply(review)}
          style={{ flex: 1, height: 34, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: hasReply ? "#fff" : "#2563eb", border: `1px solid ${hasReply ? "#e2e8f0" : "#2563eb"}`, borderRadius: 8, color: hasReply ? "#64748b" : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <MessageSquare size={13} />
          {hasReply ? "Edit Reply" : "Reply"}
        </button>
        {review.reviewUrl && (
          <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#64748b", textDecoration: "none" }}>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

function ReplyModal({ review, profileId, onClose, onSuccess }: { review: any; profileId: string; onClose: () => void; onSuccess: () => void }) {
  const [text, setText] = useState(review.reviewReply?.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, reviewName: review.name, comment: text }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to save reply.");
      }
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 540, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>Reply to Review</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>by {review.reviewer?.displayName || "Anonymous"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {review.comment && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>"{review.comment}"</p>
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write a professional reply..."
            rows={5}
            style={{ width: "100%", padding: 14, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", color: "#111", lineHeight: 1.6, boxSizing: "border-box" }}
          />
          {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onClose} style={{ flex: 1, height: 40, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !text.trim()} style={{ flex: 2, height: 40, background: "#2563eb", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: saving || !text.trim() ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Post Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonReviewCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton style={{ width: "40%", height: 14 }} />
          <Skeleton style={{ width: "25%", height: 12 }} />
        </div>
      </div>
      <Skeleton style={{ width: "100%", height: 50, borderRadius: 8 }} />
      <Skeleton style={{ width: "35%", height: 32, borderRadius: 8 }} />
    </div>
  );
}

export default function ReviewsPage() {
  const { data: profilesData, isLoading: profilesLoading } = useSWR("/api/profiles", fetcher, { revalidateOnFocus: false });
  const profiles = profilesData?.data || [];

  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [sentiment, setSentiment] = useState<SentimentFilter>("all");
  const [search, setSearch] = useState("");
  const [replyReview, setReplyReview] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeProfile = profiles.find((p: any) => p.id === selectedProfileId) || profiles[0];

  const { data: reviewsData, isLoading: reviewsLoading, mutate } = useSWR(
    activeProfile ? `/api/reviews?profileId=${activeProfile.id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const allReviews: any[] = reviewsData?.data || [];

  const filteredReviews = useMemo(() => {
    let result = allReviews;
    if (sentiment !== "all") {
      result = result.filter(r => {
        const rating = r.starRating === "FIVE" ? 5 : r.starRating === "FOUR" ? 4 : r.starRating === "THREE" ? 3 : r.starRating === "TWO" ? 2 : 1;
        if (sentiment === "positive") return rating >= 4;
        if (sentiment === "neutral") return rating === 3;
        return rating <= 2;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.comment?.toLowerCase().includes(q) ||
        r.reviewer?.displayName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allReviews, sentiment, search]);

  const avgRating = allReviews.length
    ? (allReviews.reduce((sum, r) => {
        const n = r.starRating === "FIVE" ? 5 : r.starRating === "FOUR" ? 4 : r.starRating === "THREE" ? 3 : r.starRating === "TWO" ? 2 : 1;
        return sum + n;
      }, 0) / allReviews.length).toFixed(1)
    : "—";

  const replied = allReviews.filter(r => r.reviewReply?.comment).length;
  const notReplied = allReviews.length - replied;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-subtitle">Manage and respond to Google Business Profile reviews</p>
        </div>
        <button onClick={() => mutate()} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Alert */}
      {message && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 18, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? "#15803d" : "#dc2626" }}>
          {message.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={13} /></button>
        </div>
      )}

      {/* Profile Selector */}
      {profilesLoading ? (
        <Skeleton style={{ width: "100%", height: 52, borderRadius: 10, marginBottom: 24 }} />
      ) : (
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={16} color="#64748b" style={{ flexShrink: 0 }} />
          <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <select
              value={selectedProfileId || activeProfile?.id || ""}
              onChange={e => setSelectedProfileId(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 36px 0 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#111", cursor: "pointer", appearance: "none", outline: "none" }}
            >
              {profiles.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
          </div>
        </div>
      )}

      {/* Stats Strip */}
      {!reviewsLoading && allReviews.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Avg Rating", value: avgRating, color: "#FBBF24", bg: "#FFFBEB" },
            { label: "Total Reviews", value: allReviews.length, color: "#2563eb", bg: "#eff6ff" },
            { label: "Replied", value: replied, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Awaiting Reply", value: notReplied, color: "#dc2626", bg: "#fef2f2" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111", lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." style={{ width: "100%", height: 38, paddingLeft: 36, paddingRight: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", color: "#111", background: "#fff", boxSizing: "border-box" }} />
        </div>
        {(["all", "positive", "neutral", "negative"] as SentimentFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setSentiment(f)}
            style={{ height: 38, padding: "0 14px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", borderColor: sentiment === f ? "#2563eb" : "#e2e8f0", background: sentiment === f ? "#eff6ff" : "#fff", color: sentiment === f ? "#2563eb" : "#64748b", textTransform: "capitalize" }}
          >
            {f === "all" ? "All" : f === "positive" ? "⭐ Positive" : f === "neutral" ? "😐 Neutral" : "👎 Negative"}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      {reviewsLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => <SkeletonReviewCard key={i} />)}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
          <Star size={40} style={{ color: "#e2e8f0", marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#374151" }}>
            {allReviews.length === 0 ? "No reviews yet" : "No reviews match your filter"}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
            {allReviews.length === 0 ? "Reviews will appear here once customers leave them on Google." : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredReviews.map((review: any) => (
            <ReviewCard key={review.name} review={review} onReply={setReplyReview} />
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyReview && (
        <ReplyModal
          review={replyReview}
          profileId={activeProfile?.id || ""}
          onClose={() => setReplyReview(null)}
          onSuccess={() => { mutate(); setMessage({ type: "success", text: "Reply posted successfully!" }); }}
        />
      )}
    </div>
  );
}

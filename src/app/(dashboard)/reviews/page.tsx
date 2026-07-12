"use client";

import { useState, useMemo } from "react";
import { Star, MessageSquare, Search, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, X, ExternalLink, Building2, TrendingUp, Clock, Loader2, ThumbsUp, Sparkles } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type SentimentFilter = "all" | "positive" | "negative" | "neutral";

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= rating ? "#F59E0B" : "none"} color={i <= rating ? "#F59E0B" : "#D1D5DB"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string; size?: number }) {
  const initials = (name || "?").charAt(0).toUpperCase();
  const colors = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899"];
  const color = colors[initials.charCodeAt(0) % colors.length];
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-subtle)", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "20", border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function getRating(r: any) {
  const map: Record<string, number> = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
  return map[r.starRating] ?? 1;
}

function getSentiment(rating: number) {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

const SENTIMENT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  positive: { color: "var(--success-text)", bg: "var(--success-subtle)", label: "Positive" },
  neutral:  { color: "var(--warning-text)", bg: "var(--warning-subtle)", label: "Neutral" },
  negative: { color: "var(--danger-text)",  bg: "var(--danger-subtle)",  label: "Negative" },
};

function ReviewCard({ review, onReply }: { review: any; onReply: (r: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const rating = getRating(review);
  const sentiment = getSentiment(rating);
  const { color, bg, label } = SENTIMENT_STYLES[sentiment];
  const hasReply = !!review.reviewReply?.comment;
  const date = review.createTime ? new Date(review.createTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  const isLong = (review.comment?.length ?? 0) > 180;

  return (
    <div className="ds-card ds-card-hover ds-anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Sentiment accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: sentiment === "positive" ? "var(--success)" : sentiment === "neutral" ? "var(--warning)" : "var(--danger)", borderRadius: "10px 10px 0 0" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Avatar name={review.reviewer?.displayName || "?"} photoUrl={review.reviewer?.profilePhotoUrl} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {review.reviewer?.displayName || "Anonymous"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <StarRating rating={rating} />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{date}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "3px 8px", borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}>{label}</span>
          {hasReply && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--info-text)", background: "var(--info-subtle)", padding: "3px 8px", borderRadius: "var(--radius-full)" }}>Replied</span>}
        </div>
      </div>

      {/* Review Text */}
      {review.comment && (
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, display: expanded ? "block" : "-webkit-box", WebkitLineClamp: expanded ? undefined : 3, WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden" }}>
            "{review.comment}"
          </p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4, padding: 0 }}>
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}
      {!review.comment && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No written review — rating only.</p>
      )}

      {/* Existing Reply */}
      {hasReply && (
        <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-btn)", padding: "12px 14px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Reply</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{review.reviewReply.comment}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button onClick={() => onReply(review)} className={`ds-btn ${hasReply ? "ds-btn-secondary" : "ds-btn-primary"}`} style={{ flex: 1, height: 34, fontSize: 12 }}>
          <MessageSquare size={13} />
          {hasReply ? "Edit Reply" : "Reply Now"}
        </button>
        {review.reviewUrl && (
          <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn-secondary" style={{ width: 34, height: 34, padding: 0, flexShrink: 0 }}>
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
  const rating = getRating(review);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, reviewName: review.name, comment: text }),
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const d = await res.json(); setError(d.error || "Failed to save reply."); }
    } catch { setError("Network error."); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content ds-anim-scale" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={review.reviewer?.displayName || "?"} photoUrl={review.reviewer?.profilePhotoUrl} size={36} />
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Reply to Review</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <StarRating rating={rating} />
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>by {review.reviewer?.displayName || "Anonymous"}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="ds-btn ds-btn-ghost" style={{ width: 32, height: 32, padding: 0 }}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ gap: 16, display: "flex", flexDirection: "column" }}>
          {review.comment && (
            <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-btn)", padding: "12px 14px", borderLeft: "3px solid var(--border-default)" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>"{review.comment}"</p>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Your Response</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write a professional, helpful response..."
              rows={5}
              style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-btn)", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "var(--font-sans)", color: "var(--text-primary)", lineHeight: 1.6, background: "var(--bg-input)", boxSizing: "border-box", transition: "border-color 150ms ease" }}
              onFocus={e => e.target.style.borderColor = "var(--brand)"}
              onBlur={e => e.target.style.borderColor = "var(--border-default)"}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {error ? <p style={{ color: "var(--danger)", fontSize: 12, margin: 0 }}>{error}</p> : <span />}
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{text.length}/1500</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="ds-btn ds-btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving || !text.trim()} className="ds-btn ds-btn-primary" style={{ minWidth: 120 }}>
            {saving ? <><Loader2 size={14} className="anim-spin" /> Posting...</> : <><CheckCircle2 size={14} /> Post Reply</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="skeleton" style={{ width: "40%", height: 13, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: "25%", height: 11, borderRadius: 4 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "100%", height: 52, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: "50%", height: 32, borderRadius: 6 }} />
    </div>
  );
}

export default function ReviewsPage() {
  const { data: profilesData, isLoading: profilesLoading } = useSWR("/api/profiles", fetcher, { revalidateOnFocus: false });
  const profiles = (profilesData?.data || []).filter((p: any) => !p.isHidden);

  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [sentiment, setSentiment] = useState<SentimentFilter>("all");
  const [search, setSearch] = useState("");
  const [replyReview, setReplyReview] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeProfile = profiles.find((p: any) => p.id === selectedProfileId) || profiles[0];

  const { data: reviewsData, isLoading: reviewsLoading, mutate, error: reviewsError } = useSWR(
    activeProfile ? `/api/reviews?profileId=${activeProfile.id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const allReviews: any[] = reviewsData?.data || [];
  const apiError = reviewsData?.error || (reviewsError ? "Failed to load reviews" : null);

  const filteredReviews = useMemo(() => {
    let r = allReviews;
    if (sentiment !== "all") r = r.filter(rv => getSentiment(getRating(rv)) === sentiment);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(rv => rv.comment?.toLowerCase().includes(q) || rv.reviewer?.displayName?.toLowerCase().includes(q));
    }
    return r;
  }, [allReviews, sentiment, search]);

  const avgRating = allReviews.length
    ? (allReviews.reduce((s, r) => s + getRating(r), 0) / allReviews.length).toFixed(1) : "—";
  const replied = allReviews.filter(r => r.reviewReply?.comment).length;
  const pending = allReviews.length - replied;
  const replyRate = allReviews.length ? Math.round((replied / allReviews.length) * 100) : 0;

  const FILTERS: { key: SentimentFilter; label: string; emoji: string }[] = [
    { key: "all", label: "All", emoji: "✦" },
    { key: "positive", label: "Positive", emoji: "⭐" },
    { key: "neutral", label: "Neutral", emoji: "😐" },
    { key: "negative", label: "Negative", emoji: "👎" },
  ];

  const STATS = [
    { label: "Avg Rating", value: avgRating, sub: "out of 5.0", icon: Star, iconColor: "#F59E0B", iconBg: "#FFFBEB" },
    { label: "Total Reviews", value: allReviews.length, sub: "Google reviews", icon: MessageSquare, iconColor: "var(--brand)", iconBg: "var(--brand-subtle)" },
    { label: "Replied", value: replied, sub: `${replyRate}% reply rate`, icon: ThumbsUp, iconColor: "var(--success)", iconBg: "var(--success-subtle)" },
    { label: "Awaiting Reply", value: pending, sub: pending > 0 ? "needs attention" : "all caught up!", icon: Clock, iconColor: pending > 0 ? "var(--danger)" : "var(--success)", iconBg: pending > 0 ? "var(--danger-subtle)" : "var(--success-subtle)" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 20, fontWeight: 700 }}>Reviews</h1>
          <p className="page-subtitle">Monitor and respond to Google Business Profile reviews</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {activeProfile?.metadata?.mapsUri && (
            <a href={activeProfile.metadata?.mapsUri} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn-secondary" style={{ fontSize: 12, gap: 6 }}>
              <ExternalLink size={13} /> View on Maps
            </a>
          )}
          <button onClick={() => mutate()} className="ds-btn ds-btn-secondary" style={{ gap: 6 }}>
            <RefreshCw size={13} className={reviewsLoading ? "anim-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div style={{ padding: "10px 16px", borderRadius: "var(--radius-btn)", marginBottom: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "var(--success-subtle)" : "var(--danger-subtle)", border: `1px solid ${message.type === "success" ? "var(--success-muted)" : "var(--danger-muted)"}`, color: message.type === "success" ? "var(--success-text)" : "var(--danger-text)" }} className="ds-anim-fade">
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}><X size={13} /></button>
        </div>
      )}

      {/* Profile Selector */}
      <div style={{ marginBottom: 24 }}>
        {profilesLoading ? (
          <div className="skeleton" style={{ height: 44, borderRadius: "var(--radius-btn)", maxWidth: 440 }} />
        ) : (
          <div style={{ position: "relative", maxWidth: 440 }}>
            <Building2 size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
            <select
              value={selectedProfileId || activeProfile?.id || ""}
              onChange={e => setSelectedProfileId(e.target.value)}
              style={{ width: "100%", height: 44, paddingLeft: 36, paddingRight: 36, border: "1px solid var(--border-default)", borderRadius: "var(--radius-btn)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", background: "#fff", appearance: "none" }}
            >
              {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          </div>
        )}
      </div>

      {/* Stats Strip */}
      {!reviewsLoading && allReviews.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="ds-anim-fade">
          {STATS.map(s => (
            <div key={s.label} className="ds-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--radius-btn)", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.icon size={18} color={s.iconColor} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div style={{ padding: "14px 16px", borderRadius: "var(--radius-btn)", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12, background: "var(--danger-subtle)", border: "1px solid var(--danger-muted)", color: "var(--danger-text)" }} className="ds-anim-fade">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Could not load reviews</p>
            <p style={{ margin: "3px 0 0", fontSize: 12 }}>{apiError}</p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by reviewer or content..."
            className="ds-input"
            style={{ height: 38, paddingLeft: 36, paddingRight: search ? 36 : 12 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setSentiment(f.key)}
              style={{
                height: 38, padding: "0 14px", borderRadius: "var(--radius-btn)", border: "1px solid",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                borderColor: sentiment === f.key ? "var(--brand-muted)" : "var(--border-default)",
                background: sentiment === f.key ? "var(--brand-subtle)" : "#fff",
                color: sentiment === f.key ? "var(--brand)" : "var(--text-secondary)",
                transition: "all 150ms ease",
              }}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
        {filteredReviews.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {filteredReviews.length} {filteredReviews.length === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      {/* Reviews Grid */}
      {reviewsLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredReviews.length === 0 && !apiError ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-card)", padding: "72px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "var(--radius-card)", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Sparkles size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {allReviews.length === 0 ? "No reviews yet" : "No matching reviews"}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-tertiary)" }}>
            {allReviews.length === 0 ? "Reviews from Google will appear here automatically." : "Try adjusting your search or filter."}
          </p>
          {allReviews.length > 0 && (
            <button onClick={() => { setSearch(""); setSentiment("all"); }} className="ds-btn ds-btn-secondary" style={{ margin: "16px auto 0" }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredReviews.map((review: any) => (
            <ReviewCard key={review.name} review={review} onReply={setReplyReview} />
          ))}
        </div>
      )}

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

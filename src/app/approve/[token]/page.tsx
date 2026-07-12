"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  CheckCircle2, XCircle, FileText, Globe, Send, MessageSquare, 
  Loader2, Award, Sparkles, Clock
} from "lucide-react";

const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Instagram = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <defs>
      <linearGradient id="ig-grad-approve" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad-approve)" />
    <rect x="5" y="5" width="14" height="14" rx="3.5" ry="3.5" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="0.9" fill="#fff" />
  </svg>
);

const Linkedin = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#0A66C2" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export default function ClientApprovalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actorName, setActorName] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Comments for rejections
  const [globalComment, setGlobalComment] = useState("");
  const [individualComments, setIndividualComments] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchGroupData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/smm/approvals?token=${token}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setGroup(data.data);
      }
    } catch (e) {
      setError("Failed to load approval contents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [token]);

  const handleAction = async (action: "APPROVE" | "REJECT", postId?: string) => {
    setActionSubmitting(true);
    const comments = postId ? (individualComments[postId] || "") : globalComment;

    try {
      const res = await fetch("/api/smm/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          postId,
          action,
          comments,
          actorName: actorName || "Client Reviewer"
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setFeedbackSubmitted(true);
        setActiveCommentPostId(null);
        setGlobalComment("");
        await fetchGroupData();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit feedback");
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", gap: 16 }}>
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Loading review workspace...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", padding: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, maxWidth: 460, textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Invalid Approval Link</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
            {error || "This review portal link has expired, been removed, or is incorrect. Please contact your account manager."}
          </p>
        </div>
      </div>
    );
  }

  const clientName = group.client.businessClinicName || group.client.name;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 16px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        
        {/* Clinic/Brand Header */}
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {group.client.logo ? (
              <img src={group.client.logo} alt="logo" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={22} color="#7e22ce" />
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Content Approval Portal</p>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{clientName}</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ecfdf5", border: "1px solid #d1fae5", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, color: "#065f46" }}>
            <Sparkles size={14} /> Secure Access
          </div>
        </div>

        {/* Success Feedback Banner */}
        {feedbackSubmitted && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          }} className="anim-fade-up">
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#065f46", margin: "0 0 4px" }}>Feedback Submitted Successfully</h4>
              <p style={{ fontSize: 13, color: "#047857", margin: 0 }}>
                Thank you! Your approvals and change requests have been sent directly to our content creation team.
              </p>
            </div>
          </div>
        )}

        {/* Global Batch Action Bar */}
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.01)"
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{group.title}</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            Please review the {group.posts.length} post draft{group.posts.length > 1 ? "s" : ""} below. You can approve or reject them individually, or approve the entire batch.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                disabled={actionSubmitting}
                onClick={() => handleAction("APPROVE")}
                style={{
                  height: 40,
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                Approve All Posts
              </button>
              <button
                disabled={actionSubmitting}
                onClick={() => {
                  if (!globalComment.trim()) {
                    alert("Please provide comments explaining the required changes before rejecting the batch.");
                    return;
                  }
                  handleAction("REJECT");
                }}
                style={{
                  height: 40,
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                Request Changes for All
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Your Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Dr. Prince"
                value={actorName}
                onChange={e => setActorName(e.target.value)}
                style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Batch Change Comments (Required only when rejecting all)</label>
              <textarea 
                placeholder="e.g. Update spelling, correct the appointment link, use clinical photo instead..."
                value={globalComment}
                onChange={e => setGlobalComment(e.target.value)}
                style={{ width: "100%", height: 60, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, resize: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {group.posts.map((post: any, index: number) => {
            const isIndividualApproved = post.status === "APPROVED" || post.status === "SCHEDULED" || post.status === "PUBLISHED";
            const isIndividualRejected = post.status === "REJECTED";
            
            return (
              <div key={post.id} style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
                position: "relative"
              }}>
                {/* Header info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Post #{index + 1}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {post.destinations?.map((d: any) => (
                      <span key={d.id} style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        background: "#f1f5f9",
                        borderRadius: 100,
                        color: "#475569",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        {d.socialAccount?.platform === "FACEBOOK" && <Facebook size={12} color="#1877F2" />}
                        {d.socialAccount?.platform === "INSTAGRAM" && <Instagram size={12} color="#E1306C" />}
                        {d.socialAccount?.platform === "LINKEDIN" && <Linkedin size={12} color="#0A66C2" />}
                        {d.socialAccount?.platform}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scheduled details */}
                {post.scheduledAt && (
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={13} /> Scheduled for: <strong>{new Date(post.scheduledAt).toLocaleString()}</strong>
                  </p>
                )}

                {/* Caption content */}
                <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6, background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 20, whiteSpace: "pre-wrap" }}>
                  {post.caption}
                  {post.hashtags && <span style={{ color: "#7e22ce", display: "block", marginTop: 8 }}>{post.hashtags}</span>}
                </div>

                {/* Media attachments */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
                    {post.mediaUrls.map((url: string, uIdx: number) => (
                      <img key={uIdx} src={url} alt="creative preview" style={{ width: 120, height: 120, borderRadius: 8, objectFit: "cover", border: "1px solid #cbd5e1" }} />
                    ))}
                  </div>
                )}

                {/* Action button bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <div>
                    {isIndividualApproved && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={16} /> Approved
                      </span>
                    )}
                    {isIndividualRejected && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <XCircle size={16} /> Changes Requested
                      </span>
                    )}
                    {!isIndividualApproved && !isIndividualRejected && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", background: "#fffbeb", padding: "3px 10px", borderRadius: 100 }}>
                        Awaiting Review
                      </span>
                    )}
                  </div>

                  {!isIndividualApproved && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        disabled={actionSubmitting}
                        onClick={() => handleAction("APPROVE", post.id)}
                        style={{
                          height: 34,
                          padding: "0 14px",
                          background: "#ecfdf5",
                          border: "1px solid #10b981",
                          color: "#059669",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Approve Post
                      </button>
                      <button
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        style={{
                          height: 34,
                          padding: "0 14px",
                          background: "#fef2f2",
                          border: "1px solid #fca5a5",
                          color: "#ef4444",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <MessageSquare size={13} /> Request Changes
                      </button>
                    </div>
                  )}
                </div>

                {/* Individual change comment panel */}
                {activeCommentPostId === post.id && (
                  <div style={{ marginTop: 16, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #cbd5e1" }} className="anim-fade-up">
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Comments for Post #{index + 1}</label>
                    <textarea
                      placeholder="e.g. Correct spelling of clinic address or upload doctor profile image instead..."
                      value={individualComments[post.id] || ""}
                      onChange={e => setIndividualComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                      style={{ width: "100%", height: 50, padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, resize: "none", marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button
                        onClick={() => setActiveCommentPostId(null)}
                        style={{ fontSize: 11, fontWeight: 600, padding: "0 10px", height: 28, border: "1px solid #cbd5e1", borderRadius: 6, color: "#64748b" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAction("REJECT", post.id)}
                        disabled={actionSubmitting}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "0 12px",
                          height: 28,
                          background: "#ef4444",
                          border: "none",
                          color: "#fff",
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        Submit Correction
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

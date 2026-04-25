"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus, Filter, Loader2, Trash2, MapPin, Eye, Clock, CheckCircle2,
  AlertTriangle, FileText, Send, Edit3, Lock, ExternalLink, ThumbsUp
} from "lucide-react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_META: Record<string, { label: string; borderColor: string; bg: string; textColor: string }> = {
  PUBLISHED:        { label: "Published",      borderColor: "var(--success)",       bg: "var(--success-bg)",  textColor: "var(--success)" },
  SCHEDULED:        { label: "Scheduled",      borderColor: "var(--accent)",        bg: "var(--accent-light)", textColor: "var(--accent)" },
  DRAFT:            { label: "Draft",          borderColor: "var(--border)",        bg: "var(--bg-elevated)", textColor: "var(--text-muted)" },
  FAILED:           { label: "Failed",         borderColor: "var(--error)",         bg: "var(--error-bg)",    textColor: "var(--error)" },
  PENDING_APPROVAL: { label: "Needs Approval", borderColor: "#f59e0b",              bg: "#fffbeb",            textColor: "#b45309" },
};

export default function PostsPage() {
  const { data: session } = useSession();
  const user = (session as any)?.user;
  const canApprove = user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_OWNER";

  const { data, isLoading, mutate } = useSWR("/api/posts", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const posts = data?.data || [];
  const statusTabs = ["All", "Pending", "Draft", "Scheduled", "Published", "Failed"];
  const [statusFilter, setStatusFilter] = useState("All");
  const [profileFilter, setProfileFilter] = useState("All Profiles");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const profiles = Array.from(new Set(posts.map((p: any) => p.profileName))).filter(Boolean) as string[];

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this post?")) return;
    mutate({ ...data, data: posts.filter((p: any) => p.id !== id) }, false);
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    mutate();
  };

  const handleApprove = async (post: any) => {
    setApprovingId(post.id);
    try {
      // Determine: if post has scheduledAt, keep it; otherwise publish now
      const newStatus = post.scheduledAt ? "SCHEDULED" : "PUBLISHED";
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, status: newStatus }),
      });
      if (res.ok) mutate();
      else alert("Failed to approve post.");
    } finally {
      setApprovingId(null);
    }
  };

  const handlePublishDraft = async (post: any) => {
    if (!confirm("Publish this draft now to Google?")) return;
    setPublishingId(post.id);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, status: "PUBLISHED" }),
      });
      if (res.ok) mutate();
      else alert("Failed to publish post.");
    } finally {
      setPublishingId(null);
    }
  };

  const filtered = posts
    .filter((p: any) => {
      if (statusFilter === "All") return true;
      if (statusFilter === "Pending") return p.status === "PENDING_APPROVAL";
      return p.status === statusFilter.toUpperCase();
    })
    .filter((p: any) => profileFilter === "All Profiles" || p.profileName === profileFilter);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Posts Workspace</h1>
          <p className="page-subtitle">Manage and review your Google Business posts.</p>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {/* Filter bar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {statusTabs.map(t => (
              <button key={t} onClick={() => setStatusFilter(t)}
                className={statusFilter === t ? "btn btn-sm" : "btn btn-ghost btn-sm"}
                style={statusFilter === t
                  ? { background: "var(--text-primary)", color: "white", borderRadius: "var(--radius-full)" }
                  : { borderRadius: "var(--radius-full)" }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ position: "relative", minWidth: 200 }}>
            <Filter style={{ width: 14, height: 14, color: "var(--text-muted)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <select value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}
              className="input" style={{ paddingLeft: 34, fontSize: 13 }}>
              <option value="All Profiles">All Profiles</option>
              {profiles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Cards */}
        <div style={{ padding: 16, minHeight: 350, background: "var(--bg-body)" }}>
          {isLoading ? (
            <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Loader2 className="anim-spin" style={{ width: 28, height: 28, color: "var(--accent)", marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading posts...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "60px 24px" }}>
              <div className="empty-icon" style={{ width: 64, height: 64 }}>
                <FileText style={{ width: 32, height: 32 }} strokeWidth={1.2} />
              </div>
              <h3 className="empty-title">No posts found</h3>
              <p className="empty-text">{posts.length === 0 ? "Head to a Profile to create your first post." : "No posts match the current filters."}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {filtered.map((post: any, idx: number) => {
                const meta = STATUS_META[post.status] || STATUS_META.DRAFT;
                const isPending = post.status === "PENDING_APPROVAL";
                const isPublished = post.status === "PUBLISHED";
                const isDraft = post.status === "DRAFT";

                return (
                  <div key={post.id} className="anim-fade-up"
                    style={{
                      background: "var(--bg-card)",
                      border: `2px solid ${isPending ? "#f59e0b" : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      display: "flex", flexDirection: "column",
                      overflow: "hidden",
                      animationDelay: `${idx * 30}ms`,
                      boxShadow: isPending ? "0 0 0 4px #fef3c7" : "none",
                    }}>

                    {/* Status strip */}
                    <div style={{ padding: "10px 14px", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.textColor, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}>
                        {isPending && <AlertTriangle style={{ width: 12, height: 12 }} />}
                        {isPublished && <CheckCircle2 style={{ width: 12, height: 12 }} />}
                        {isDraft && <FileText style={{ width: 12, height: 12 }} />}
                        {post.status === "SCHEDULED" && <Clock style={{ width: 12, height: 12 }} />}
                        {meta.label}
                      </span>
                      {isPublished && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Lock style={{ width: 10, height: 10 }} /> Read-only
                        </span>
                      )}
                    </div>

                    {/* Image thumbnail */}
                    {post.imageUrl && (
                      <div style={{ height: 130, overflow: "hidden", position: "relative" }}>
                        <img src={post.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {isPublished && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
                        )}
                      </div>
                    )}

                    {/* Body */}
                    <div style={{ padding: "14px 14px 10px", flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: isPublished ? "var(--text-secondary)" : "var(--text-primary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.summary}
                      </p>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                        <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.profileName}</span>
                        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock style={{ width: 11, height: 11 }} />
                          {post.scheduledAt ? format(new Date(post.scheduledAt), "MMM d, h:mm a") : post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : "No date"}
                        </span>
                      </div>

                      {/* Action buttons per status */}
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {/* PUBLISHED — read-only + Google link */}
                        {isPublished && (
                          <>
                            <Link href={`/posts/${post.id}`}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)" }}>
                              <Eye style={{ width: 13, height: 13 }} /> View
                            </Link>
                            <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "var(--accent)", border: "1px solid var(--accent-light)", borderRadius: "var(--radius-sm)", background: "var(--accent-light)" }}>
                              <ExternalLink style={{ width: 12, height: 12 }} /> Edit on Google
                            </a>
                          </>
                        )}

                        {/* DRAFT — edit + publish */}
                        {isDraft && (
                          <>
                            <Link href={`/posts/${post.id}`}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                              <Edit3 style={{ width: 13, height: 13 }} /> Edit
                            </Link>
                            <button onClick={() => handlePublishDraft(post)} disabled={publishingId === post.id}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: "var(--radius-sm)", opacity: publishingId === post.id ? 0.7 : 1, cursor: publishingId === post.id ? "wait" : "pointer" }}>
                              {publishingId === post.id ? <Loader2 style={{ width: 12, height: 12 }} className="anim-spin" /> : <Send style={{ width: 12, height: 12 }} />} Publish
                            </button>
                            <button onClick={() => handleDelete(post.id)}
                              style={{ padding: "6px 8px", fontSize: 12, color: "var(--error)", border: "1px solid var(--error-bg)", background: "var(--error-bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center" }}>
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </>
                        )}

                        {/* PENDING_APPROVAL — preview + approve */}
                        {isPending && canApprove && (
                          <>
                            <Link href={`/posts/${post.id}`}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                              <Eye style={{ width: 13, height: 13 }} /> Preview
                            </Link>
                            <button onClick={() => handleApprove(post)} disabled={approvingId === post.id}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#d97706", border: "none", borderRadius: "var(--radius-sm)", opacity: approvingId === post.id ? 0.7 : 1, cursor: approvingId === post.id ? "wait" : "pointer" }}>
                              {approvingId === post.id ? <Loader2 style={{ width: 12, height: 12 }} className="anim-spin" /> : <ThumbsUp style={{ width: 12, height: 12 }} />} Approve
                            </button>
                          </>
                        )}
                        {isPending && !canApprove && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Waiting for manager approval</span>
                        )}

                        {/* SCHEDULED */}
                        {post.status === "SCHEDULED" && (
                          <>
                            <Link href={`/posts/${post.id}`}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                              <Eye style={{ width: 13, height: 13 }} /> View
                            </Link>
                            <button onClick={() => handleDelete(post.id)}
                              style={{ padding: "6px 8px", fontSize: 12, color: "var(--error)", border: "1px solid var(--error-bg)", background: "var(--error-bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center" }}>
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </>
                        )}

                        {/* FAILED */}
                        {post.status === "FAILED" && (
                          <>
                            <Link href={`/posts/${post.id}`}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                              <Eye style={{ width: 13, height: 13 }} /> View
                            </Link>
                            <button onClick={() => handleDelete(post.id)}
                              style={{ padding: "6px 8px", fontSize: 12, color: "var(--error)", border: "1px solid var(--error-bg)", background: "var(--error-bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center" }}>
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Published lock notice */}
                      {isPublished && (
                        <p style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
                          <Lock style={{ width: 10, height: 10 }} /> Published posts are locked. To edit, use Google Business Manager.
                        </p>
                      )}

                      {/* Pending notice */}
                      {isPending && post.failureReason && (
                        <p style={{ fontSize: 10, color: "#b45309" }}>Note: {post.failureReason}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Filter, Loader2, Trash2, MapPin, Eye, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PostsPage() {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.role === "ADMIN" || (session as any)?.user?.role === "SUPER_ADMIN";
  
  const { data, error, isLoading, mutate } = useSWR("/api/posts", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const posts = data?.data || [];
  const statusTabs = ["All", "Pending", "Draft", "Scheduled", "Published", "Failed"];
  const [statusFilter, setStatusFilter] = useState("All");
  const [profileFilter, setProfileFilter] = useState("All Profiles");

  const profiles = Array.from(new Set(posts.map((p: any) => p.profileName))).filter(Boolean) as string[];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    
    // Optimistic update
    mutate({ ...data, data: posts.filter((p: any) => p.id !== id) }, false);
    
    try {
      await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
      mutate(); // Sync with server
    } catch {
      mutate(); // Revert on error
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
          <p className="page-subtitle">Create, schedule, and manage your Google Business posts.</p>
        </div>
        <Link href="/posts/new" className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} />
          New Post
        </Link>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {/* Filter bar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Status tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {statusTabs.map(t => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                className={statusFilter === t ? "btn btn-sm" : "btn btn-ghost btn-sm"}
                style={statusFilter === t ? { background: "var(--text-primary)", color: "white", borderRadius: "var(--radius-full)" } : { borderRadius: "var(--radius-full)" }}
              >
                {t}
              </button>
            ))}
          </div>
          {/* Profile filter */}
          <div style={{ position: "relative", minWidth: 200 }}>
            <Filter style={{ width: 14, height: 14, color: "var(--text-muted)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="input"
              style={{ paddingLeft: 34, fontSize: 13 }}
            >
              <option value="All Profiles">All Profiles</option>
              {profiles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 16, minHeight: 350, background: "var(--bg-body)" }}>
          {isLoading ? (
            <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Loader2 className="anim-spin" style={{ width: 28, height: 28, color: "var(--accent)", marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading your workspace...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "60px 24px" }}>
              <div className="empty-icon" style={{ width: 64, height: 64 }}>
                <FileText style={{ width: 32, height: 32 }} strokeWidth={1.2} />
              </div>
              <h3 className="empty-title">No posts found</h3>
              <p className="empty-text">
                {posts.length === 0 ? "You haven't created any posts yet. Start reaching your customers today." : "No posts match the current filters."}
              </p>
              {posts.length === 0 && (
                <Link href="/posts/new" className="btn btn-outline">
                  <Plus style={{ width: 16, height: 16 }} /> Create your first post
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {filtered.map((post: any, idx: number) => (
                <div
                  key={post.id}
                  className="card anim-fade-up"
                  style={{ padding: 20, display: "flex", flexDirection: "column", animationDelay: `${idx * 40}ms` }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <StatusBadge status={post.status} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/posts/${post.id}`} className="btn btn-ghost btn-sm" style={{ padding: 6, borderRadius: "50%", background: "var(--accent-light)", color: "var(--accent)" }} title={post.status === "PENDING_APPROVAL" ? "Review Post" : "View Post"}>
                        <Eye style={{ width: 15, height: 15 }} />
                      </Link>
                      <button onClick={() => handleDelete(post.id)} className="btn btn-ghost btn-sm" style={{ padding: 6, borderRadius: "50%", background: "var(--error-bg)", color: "var(--error)" }} title="Delete Post">
                        <Trash2 style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
                    {post.summary}
                  </p>

                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--text-muted)", gap: 6 }}>
                      <MapPin style={{ width: 13, height: 13, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.profileName}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
                      <span style={{ padding: "3px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {post.topicType}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock style={{ width: 13, height: 13 }} />
                        {post.scheduledAt ? format(new Date(post.scheduledAt), "MMM d, yyyy") : "No date"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "DRAFT").toUpperCase();
  let cls = "badge ";
  const iconStyle = { width: 13, height: 13 };
  if (s === "PUBLISHED") return <span className={cls + "badge-success"}><CheckCircle2 style={iconStyle} /> PUBLISHED</span>;
  if (s === "SCHEDULED") return <span className={cls + "badge-warning"}><Clock style={iconStyle} /> SCHEDULED</span>;
  if (s === "PENDING_APPROVAL") return <span className={cls} style={{ background: "var(--warning-bg)", color: "var(--warning)", borderColor: "var(--warning-border)" }}><AlertTriangle style={iconStyle} /> PENDING REVIEW</span>;
  if (s === "FAILED") return <span className={cls + "badge-error"}><AlertTriangle style={iconStyle} /> FAILED</span>;
  return <span className={cls + "badge-default"}><FileText style={iconStyle} /> DRAFT</span>;
}

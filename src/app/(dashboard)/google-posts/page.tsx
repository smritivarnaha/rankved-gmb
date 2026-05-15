"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, MapPin, ExternalLink, Trash2,
  AlertCircle, RefreshCw, Globe, Calendar, FileText,
  ArrowRight, Eye, X, ChevronDown, Tag, Megaphone, Gift, Star
} from "lucide-react";
import Link from "next/link";
import { ProfileItemSkeleton, PostCardSkeleton } from "@/components/ui/Skeleton";

type SortOption = "newest" | "oldest" | "type";

function getPostType(post: any): { label: string; color: string; bg: string; Icon: any } {
  const topic = (post.topicType || "").toLowerCase();
  if (topic.includes("event"))  return { label: "Event",  color: "#7C3AED", bg: "#F5F3FF", Icon: Calendar };
  if (topic.includes("offer"))  return { label: "Offer",  color: "#D97706", bg: "#FFFBEB", Icon: Gift };
  if (topic.includes("alert") || topic.includes("covid"))
                                 return { label: "Alert",  color: "#DC2626", bg: "#FFF1F2", Icon: Megaphone };
  if (topic.includes("product"))return { label: "Product",color: "#0891B2", bg: "#ECFEFF", Icon: Tag };
  return                         { label: "Update", color: "#059669", bg: "#ECFDF5", Icon: Star };
}

function PostModal({ post, onClose, onDelete }: { post: any; onClose: () => void; onDelete: (name: string) => void }) {
  const type = getPostType(post);
  const TypeIcon = type.Icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, maxWidth: 580, width: "100%",
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"
      }}>
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.93) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Modal Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: type.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TypeIcon size={16} style={{ color: type.color }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: type.color, background: type.bg, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {type.label}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                  {post.createTime ? new Date(post.createTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#cbd5e1", margin: "2px 0 0", fontFamily: "monospace" }}>
                {post.name?.split("/").pop()}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #eaeaea", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
            <X size={16} />
          </button>
        </div>

        {/* Image */}
        {post.media?.length > 0 && (
          <div style={{ margin: "0 24px 20px", marginTop: 20, borderRadius: 12, overflow: "hidden", border: "1px solid #eaeaea" }}>
            <img src={post.media[0].googleUrl} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: post.media?.length > 0 ? "0 24px 24px" : "20px 24px 24px" }}>
          <p style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.75, margin: "0 0 20px", fontWeight: 400 }}>
            {post.summary}
          </p>

          {/* Event details */}
          {post.event && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Event Details</p>
              <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>
                {post.event.title} · {post.event.schedule?.startTime ? new Date(post.event.schedule.startTime).toLocaleString("en-IN") : ""}
              </p>
            </div>
          )}

          {/* CTA */}
          {post.callToAction && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <a
                href={post.callToAction.url}
                target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#2563EB", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                {post.callToAction.actionType?.replace(/_/g, " ")} <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            {post.searchUrl && (
              <a href={post.searchUrl} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", textDecoration: "none", background: "#fff" }}>
                <Globe size={13} /> View on Google
              </a>
            )}
            <button
              onClick={() => { onDelete(post.name); onClose(); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #fee2e2", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#dc2626", background: "#fef2f2", cursor: "pointer" }}>
              <Trash2 size={13} /> Delete Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GooglePostsPage() {
  const [profiles, setProfiles]               = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [posts, setPosts]                     = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingPosts, setLoadingPosts]       = useState(false);
  const [error, setError]                     = useState("");
  const [search, setSearch]                   = useState("");
  const [sortBy, setSortBy]                   = useState<SortOption>("newest");
  const [viewPost, setViewPost]               = useState<any>(null);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      if (data.data) setProfiles(data.data);
    } catch { /* silent */ }
    setLoadingProfiles(false);
  };

  const fetchGooglePosts = async (profileId: string) => {
    setLoadingPosts(true);
    setError("");
    setPosts([]);
    try {
      const res = await fetch(`/api/profiles/${profileId}/google-posts`);
      const data = await res.json();
      if (res.ok) setPosts(data.data || []);
      else setError(data.error || "Failed to fetch live posts from Google.");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoadingPosts(false);
  };

  const handleDelete = async (postName: string) => {
    if (!confirm("Delete this post directly from Google? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/profiles/${selectedProfileId}/google-posts?postName=${encodeURIComponent(postName)}`, { method: "DELETE" });
      if (res.ok) setPosts(posts.filter(p => p.name !== postName));
      else { const d = await res.json(); alert(d.error || "Failed to delete post."); }
    } catch { alert("Network error."); }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.accountName || "").toLowerCase().includes(search.toLowerCase())
  );

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sortBy === "newest") return arr.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
    if (sortBy === "oldest") return arr.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
    if (sortBy === "type")   return arr.sort((a, b) => (a.topicType || "").localeCompare(b.topicType || ""));
    return arr;
  }, [posts, sortBy]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // ── Styles ──────────────────────────────────────────────────────────
  const cardStyle = { background: "#fff", border: "1px solid #eaeaea", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" } as const;
  const btnSecondary = { height: 34, padding: "0 14px", background: "#fff", color: "#475569", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 } as const;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }} className="ds-anim-fade">
      {/* View Post Modal */}
      {viewPost && <PostModal post={viewPost} onClose={() => setViewPost(null)} onDelete={handleDelete} />}

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Live Feed</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Real-time transparency. Manage posts currently live on Google.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", padding: "6px 12px", borderRadius: 6, border: "1px solid #bbf7d0" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Sync Active</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden", position: "sticky", top: 24 }}>
          {/* Search */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #eaeaea" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} size={14} />
              <input
                type="text" placeholder="Search profiles..."
                style={{ width: "100%", height: 34, paddingLeft: 32, paddingRight: 10, fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none", boxSizing: "border-box" }}
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          {/* Profile list */}
          <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
            {loadingProfiles ? (
              <div style={{ paddingTop: 8 }}>
                {Array.from({ length: 6 }).map((_, i) => <ProfileItemSkeleton key={i} />)}
              </div>
            ) : filteredProfiles.length > 0 ? filteredProfiles.map(p => (
              <button key={p.id}
                onClick={() => { setSelectedProfileId(p.id); fetchGooglePosts(p.id); }}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                  background: selectedProfileId === p.id ? "#eff6ff" : "transparent",
                  border: "none", borderLeft: `3px solid ${selectedProfileId === p.id ? "#2563EB" : "transparent"}`,
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eaeaea", overflow: "hidden" }}>
                  {p.logoUrl ? <img src={p.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <MapPin size={12} style={{ color: "#94a3b8" }} />}
                </div>
                <p style={{ fontSize: 12, fontWeight: 600, color: selectedProfileId === p.id ? "#2563EB" : "#374151", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </p>
              </button>
            )) : (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>NO RESULTS</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main feed area ──────────────────────────────────────── */}
        <div style={{ minWidth: 0 }}>
          {!selectedProfileId ? (
            <div style={{ ...cardStyle, padding: "80px 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid #eaeaea" }}>
                <Globe style={{ color: "#cbd5e1" }} size={28} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>Select a Profile</h2>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Choose a business profile from the left to view its live posts.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Profile header bar */}
              <div style={{ ...cardStyle, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{selectedProfile?.name}</h2>
                    <ExternalLink size={11} style={{ color: "#94a3b8" }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    {posts.length} Live Publication{posts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Sort by */}
                  <div style={{ position: "relative" }}>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      style={{ height: 34, padding: "0 28px 0 10px", fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#475569", appearance: "none", cursor: "pointer", outline: "none" }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="type">By Type</option>
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  </div>
                  <button onClick={() => fetchGooglePosts(selectedProfileId)} style={{ ...btnSecondary, width: 34, padding: 0, justifyContent: "center" }}>
                    <RefreshCw size={14} className={loadingPosts ? "anim-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Loading — skeleton grid */}
              {loadingPosts && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
                </div>
              )}

              {/* Error */}
              {!loadingPosts && error && (
                <div style={{ ...cardStyle, padding: "20px 24px", border: "1px solid #fee2e2", borderLeft: "4px solid #dc2626", display: "flex", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertCircle size={18} style={{ color: "#dc2626" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                      {error.includes("access token") ? "Authorization Required" : "Fetch Error"}
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, margin: "0 0 12px" }}>{error}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => fetchGooglePosts(selectedProfileId)} style={btnSecondary}>
                        <RefreshCw size={13} /> Retry
                      </button>
                      {error.includes("token") && (
                        <Link href="/onboard" style={{ ...btnSecondary, background: "#0f172a", color: "#fff", border: "none", textDecoration: "none" }}>
                          Reconnect Account
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loadingPosts && !error && posts.length === 0 && (
                <div style={{ ...cardStyle, padding: "80px 24px", textAlign: "center" }}>
                  <FileText style={{ width: 36, height: 36, color: "#cbd5e1", margin: "0 auto 14px" }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>No posts found</h2>
                  <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>This profile hasn't published any posts to Google yet.</p>
                </div>
              )}

              {/* ── Post Cards Grid ─────────────────────────────── */}
              {!loadingPosts && !error && sortedPosts.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {sortedPosts.map(post => {
                    const type = getPostType(post);
                    const TypeIcon = type.Icon;
                    const dateStr = post.createTime
                      ? new Date(post.createTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—";
                    const hasImage = post.media?.length > 0;

                    return (
                      <div key={post.name} style={{
                        ...cardStyle, padding: 0, overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        transition: "box-shadow 0.2s, transform 0.15s",
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                      >
                        {/* Card image */}
                        {hasImage && (
                          <div style={{ height: 160, overflow: "hidden", background: "#f8fafc", flexShrink: 0 }}>
                            <img src={post.media[0].googleUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        )}

                        {/* Card body */}
                        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                          {/* Top row: type badge + date */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: type.color, background: type.bg, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4 }}>
                              <TypeIcon size={10} />{type.label}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={10} />{dateStr}
                            </span>
                          </div>

                          {/* Summary — 2 lines max */}
                          <p style={{
                            fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            overflow: "hidden", textOverflow: "ellipsis",
                            flex: 1
                          } as any}>
                            {post.summary || "No content"}
                          </p>

                          {/* CTA badge */}
                          {post.callToAction && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: "#f1f5f9", borderRadius: 6, width: "fit-content" }}>
                              <ArrowRight size={10} style={{ color: "#475569" }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {post.callToAction.actionType?.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card footer actions */}
                        <div style={{ padding: "10px 16px", borderTop: "1px solid #f8f9fa", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
                          <button
                            onClick={() => setViewPost(post)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#2563EB", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
                          >
                            <Eye size={12} /> View
                          </button>
                          <div style={{ display: "flex", gap: 6 }}>
                            {post.searchUrl && (
                              <a href={post.searchUrl} target="_blank" rel="noreferrer"
                                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, color: "#64748b" }}>
                                <ExternalLink size={12} />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(post.name)}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 6, color: "#dc2626", cursor: "pointer" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

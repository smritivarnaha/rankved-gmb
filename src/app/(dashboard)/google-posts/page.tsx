"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, MapPin, ExternalLink, Trash2,
  AlertCircle, RefreshCw, Globe, Calendar, FileText,
  ArrowRight, Eye, X, ChevronDown, Tag, Megaphone, Gift, Star,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { ProfileItemSkeleton, PostCardSkeleton } from "@/components/ui/Skeleton";

type SortOption = "newest" | "oldest" | "type";
const POSTS_PER_PAGE = 12;

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
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="post-modal-inner" style={{
        background: "#fff", borderRadius: 24, 
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column",
        animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"
      }}>
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Modal Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: type.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TypeIcon size={20} style={{ color: type.color }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: type.color, background: type.bg, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {type.label}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                  {post.createTime ? new Date(post.createTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", fontFamily: "monospace" }}>
                ID: {post.name?.split("/").pop()}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fff"} onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ overflowY: "auto", flex: 1, padding: "24px" }}>
          {/* Image */}
          {post.media?.length > 0 && (
            <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <img src={post.media[0].googleUrl} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#f8fafc", display: "block" }} />
            </div>
          )}

          {/* Text Content */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 16, color: "#1e293b", lineHeight: 1.8, margin: 0, fontWeight: 400, whiteSpace: "pre-wrap" }}>
              {post.summary}
            </p>
          </div>

          {/* Event details */}
          {post.event && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 20px", marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Event Details</p>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>{post.event.title}</h4>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} />
                {post.event.schedule?.startTime ? new Date(post.event.schedule.startTime).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' }) : "No time set"}
              </p>
            </div>
          )}

          {/* CTA Section */}
          {post.callToAction && (
            <div style={{ padding: "16px", background: "#eff6ff", borderRadius: 16, border: "1px solid #dbeafe", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Call to Action</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>{post.callToAction.actionType?.replace(/_/g, " ")}</p>
                </div>
                <a
                  href={post.callToAction.url}
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#2563EB", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }}
                >
                  Visit Link <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 12, background: "#f8fafc", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexShrink: 0 }}>
          {post.searchUrl && (
            <a href={post.searchUrl} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#475569", textDecoration: "none", background: "#fff", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
            >
              <Globe size={16} /> View on Search
            </a>
          )}
          <button
            onClick={() => { onDelete(post.name); onClose(); }}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", border: "1px solid #fee2e2", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#dc2626", background: "#fff", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2" }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff" }}
          >
            <Trash2 size={16} /> Delete Forever
          </button>
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
  const [currentPage, setCurrentPage]         = useState(1);

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
    setCurrentPage(1);
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

  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return sortedPosts.slice(start, start + POSTS_PER_PAGE);
  }, [sortedPosts, currentPage]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // ── Styles ──────────────────────────────────────────────────────────
  const cardStyle = { background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" } as const;
  const btnSecondary = { height: 34, padding: "0 14px", background: "#fff", color: "#475569", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 } as const;

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }} className="ds-anim-fade">
      {/* View Post Modal */}
      {viewPost && <PostModal post={viewPost} onClose={() => setViewPost(null)} onDelete={handleDelete} />}

      {/* Header */}
      <div className="live-feed-page-header">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Live Feed</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, fontWeight: 500 }}>Real-time transparency. Direct from Google Business Profile.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ecfdf5", padding: "8px 16px", borderRadius: 10, border: "1px solid #d1fae5" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cloud Sync Active</span>
        </div>
      </div>

      <div className="live-feed-layout">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div className="live-feed-sidebar" style={{ ...cardStyle, padding: 0, overflow: "hidden", position: "sticky", top: 24, alignSelf: "start" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", background: "#fcfdfe" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} size={16} />
              <input
                type="text" placeholder="Search profiles..."
                style={{ width: "100%", height: 38, paddingLeft: 38, paddingRight: 12, fontSize: 13, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="live-feed-sidebar-list" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
            {loadingProfiles ? (
              <div style={{ padding: 12 }}>
                {Array.from({ length: 6 }).map((_, i) => <ProfileItemSkeleton key={i} />)}
              </div>
            ) : filteredProfiles.length > 0 ? filteredProfiles.map(p => (
              <button key={p.id}
                onClick={() => { setSelectedProfileId(p.id); fetchGooglePosts(p.id); }}
                style={{
                  width: "100%", textAlign: "left", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  background: selectedProfileId === p.id ? "#eff6ff" : "transparent",
                  border: "none", borderLeft: `3px solid ${selectedProfileId === p.id ? "#2563EB" : "transparent"}`,
                  cursor: "pointer", transition: "all 0.2s"
                }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", overflow: "hidden", backgroundSize: 'cover' }}>
                  {p.logoUrl ? <img src={p.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <MapPin size={14} style={{ color: "#94a3b8" }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: selectedProfileId === p.id ? "#2563EB" : "#334155", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>ID: {p.locationId?.slice(-6)}</p>
                </div>
              </button>
            )) : (
              <div style={{ padding: "40px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>No profiles found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main feed area ──────────────────────────────────────── */}
        <div style={{ minWidth: 0 }}>
          {!selectedProfileId ? (
            <div style={{ ...cardStyle, padding: "100px 24px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 24, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "1px solid #f1f5f9", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                <Globe style={{ color: "#cbd5e1" }} size={32} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>Select a Profile</h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0, maxWidth: 300, marginInline: 'auto' }}>Choose a business profile from the sidebar to audit live publications.</p>
            </div>
          ) : (
            <div className="live-feed-content">

              {/* Profile header bar */}
              <div className="live-feed-header-bar" style={{ ...cardStyle, padding: "16px 24px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>{selectedProfile?.name}</h2>
                    <a href={`https://www.google.com/maps?cid=${selectedProfile?.cid}`} target="_blank" rel="noreferrer" style={{ color: "#94a3b8", display: 'flex' }}><ExternalLink size={14} /></a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                      {posts.length} Publications
                    </p>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Page {currentPage} of {Math.max(1, totalPages)}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                      style={{ height: 38, padding: "0 32px 0 14px", fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#475569", appearance: "none", cursor: "pointer", outline: "none", transition: 'all 0.2s' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="type">By Type</option>
                    </select>
                    <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  </div>
                  <button onClick={() => fetchGooglePosts(selectedProfileId)} style={{ ...btnSecondary, height: 38, width: 38, padding: 0, justifyContent: "center", borderRadius: 10 }}>
                    <RefreshCw size={16} className={loadingPosts ? "anim-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Loading — skeleton grid */}
              {loadingPosts && (
                <div className="post-cards-grid">
                  {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
                </div>
              )}

              {/* Error */}
              {!loadingPosts && error && (
                <div style={{ ...cardStyle, padding: "24px", border: "1px solid #fee2e2", borderLeft: "5px solid #ef4444", display: "flex", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertCircle size={22} style={{ color: "#ef4444" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Sync Failed</h3>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 16px" }}>{error}</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => fetchGooglePosts(selectedProfileId)} style={{ ...btnSecondary, background: "#ef4444", color: "#fff", borderColor: "transparent" }}>
                        <RefreshCw size={14} /> Try Again
                      </button>
                      <Link href="/onboard" style={{ ...btnSecondary }}>
                        Verify Connection
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty */}
              {!loadingPosts && !error && sortedPosts.length === 0 && (
                <div style={{ ...cardStyle, padding: "80px 24px", textAlign: "center" }}>
                  <FileText style={{ width: 40, height: 40, color: "#cbd5e1", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>No activity found</h2>
                  <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>This profile has no published posts in the last 12 months.</p>
                </div>
              )}

              {/* ── Post Cards Grid ─────────────────────────────── */}
              {!loadingPosts && !error && sortedPosts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div className="post-cards-grid" style={{ alignItems: 'stretch' }}>
                    {paginatedPosts.map(post => {
                      const type = getPostType(post);
                      const TypeIcon = type.Icon;
                      const dateStr = post.createTime
                        ? new Date(post.createTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—";
                      const hasImage = post.media?.length > 0;

                      return (
                        <div key={post.name} style={{
                          ...cardStyle, padding: 0, overflow: "hidden",
                          display: "flex", flexDirection: "column", height: '100%',
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                          className="post-card-item"
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                          {/* Card image container */}
                          <div style={{ height: 180, overflow: "hidden", background: "#f8fafc", flexShrink: 0, position: 'relative' }}>
                            {hasImage ? (
                              <img src={post.media[0].googleUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                <FileText size={40} />
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: 12, left: 12 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: type.color, background: "#fff", padding: "4px 10px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <TypeIcon size={12} />{type.label}
                              </span>
                            </div>
                          </div>

                          {/* Card body */}
                          <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Calendar size={12} style={{ color: "#94a3b8" }} />
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{dateStr}</span>
                            </div>

                            {/* Summary — clamped to 2 lines */}
                            <p className="line-clamp-2" style={{
                              fontSize: 14, color: "#334155", lineHeight: 1.6, margin: 0,
                              fontWeight: 500, flex: 1
                            }}>
                              {post.summary || "No description provided."}
                            </p>

                            {/* CTA Indicator */}
                            {post.callToAction && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f1f5f9", borderRadius: 10, width: "fit-content" }}>
                                <ArrowRight size={12} style={{ color: "#475569" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {post.callToAction.actionType?.replace(/_/g, " ")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card footer actions Consolidated */}
                          <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, background: "#fcfdfe" }}>
                            <button
                              onClick={() => setViewPost(post)}
                              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: "#2563EB", background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 10, padding: "8px 12px", cursor: "pointer", transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                              onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                            >
                              <Eye size={14} /> View
                            </button>
                            <div style={{ display: "flex", gap: 6 }}>
                              {post.searchUrl && (
                                <a href={post.searchUrl} target="_blank" rel="noreferrer"
                                  style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, color: "#64748b", transition: 'all 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                  title="Open on Google"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                              <button
                                onClick={() => handleDelete(post.name)}
                                style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #fee2e2", borderRadius: 10, color: "#ef4444", cursor: "pointer", transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fee2e2' }}
                                title="Delete Post"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 12, padding: '20px 0' }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ ...btnSecondary, width: 40, height: 40, padding: 0, justifyContent: 'center', opacity: currentPage === 1 ? 0.4 : 1, borderRadius: 12 }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <div style={{ display: 'flex', gap: 6 }}>
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const page = i + 1;
                          // Show 5 pages max around current page
                          if (totalPages > 7) {
                            if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                              if (page === 2 || page === totalPages - 1) return <span key={page} style={{ color: '#cbd5e1' }}>...</span>;
                              return null;
                            }
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              style={{
                                width: 40, height: 40, borderRadius: 12, fontSize: 13, fontWeight: 700,
                                background: currentPage === page ? "#2563eb" : "#fff",
                                color: currentPage === page ? "#fff" : "#475569",
                                border: "1px solid",
                                borderColor: currentPage === page ? "#2563eb" : "#e2e8f0",
                                cursor: "pointer", transition: 'all 0.2s'
                              }}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ ...btnSecondary, width: 40, height: 40, padding: 0, justifyContent: 'center', opacity: currentPage === totalPages ? 0.4 : 1, borderRadius: 12 }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

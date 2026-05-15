"use client";

import { useState, useEffect } from "react";
import { 
  Search, MapPin, ExternalLink, Trash2, Loader2, 
  AlertCircle, RefreshCw, Globe, Calendar, FileText,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function GooglePostsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      if (data.data) {
        setProfiles(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profiles:", err);
    }
    setLoadingProfiles(false);
  };

  const fetchGooglePosts = async (profileId: string) => {
    setLoadingPosts(true);
    setError("");
    setPosts([]);
    try {
      const res = await fetch(`/api/profiles/${profileId}/google-posts`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data.data || []);
      } else {
        setError(data.error || "Failed to fetch live posts from Google.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoadingPosts(false);
  };

  const handleDelete = async (postName: string) => {
    if (!confirm("Are you sure you want to delete this post directly from Google? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/profiles/${selectedProfileId}/google-posts?postName=${postName}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.name !== postName));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post.");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.accountName || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // Styles matching the Dashboard 'Amazing UI'
  const cardStyle = {
    background: "#fff", border: "1px solid #eaeaea",
    borderRadius: 8, padding: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  };

  const btnPrimary = {
    height: 38, padding: "0 16px", background: "#2563EB",
    color: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 500,
    border: "none", cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 8, transition: "background 0.2s",
    textDecoration: "none"
  };

  const btnSecondary = {
    height: 38, padding: "0 16px", background: "#fff",
    color: "#475569", borderRadius: 6, fontSize: 13, fontWeight: 500,
    border: "1px solid #e2e8f0", cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 8, transition: "background 0.2s",
    textDecoration: "none"
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }} className="ds-anim-fade">
      {/* Header section */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            Live Feed
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Real-time transparency. Manage posts currently live on Google.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", padding: "6px 12px", borderRadius: 6, border: "1px solid #bbf7d0" }}>
          <div className="ds-dot ds-dot-published" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Live Sync Active
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
        {/* Profile Sidebar */}
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden", position: "sticky", top: 24 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea" }}>
            <div style={{ position: "relative" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={14} />
              <input 
                type="text" 
                placeholder="Search profiles..." 
                style={{ width: "100%", height: 36, paddingLeft: 32, fontSize: 13, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
            {loadingProfiles ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <Loader2 className="anim-spin" style={{ color: "#2563EB" }} size={20} />
              </div>
            ) : filteredProfiles.length > 0 ? (
              filteredProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProfileId(p.id);
                    fetchGooglePosts(p.id);
                  }}
                  style={{
                    width: "100%", textAlign: "left", padding: "12px 20px", 
                    display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s",
                    background: selectedProfileId === p.id ? "#eff6ff" : "transparent",
                    border: "none", borderLeft: `3px solid ${selectedProfileId === p.id ? "#2563EB" : "transparent"}`,
                    cursor: "pointer"
                  }}
                  className={selectedProfileId !== p.id ? "hover-bg-muted" : ""}
                >
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                    background: p.logoUrl ? "transparent" : "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "1px solid #eaeaea"
                  }}>
                    {p.logoUrl ? (
                      <img src={p.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    ) : (
                      <MapPin size={14} className="text-[#94a3b8]" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: selectedProfileId === p.id ? "#2563EB" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                      {p.name}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                <p style={{ fontSize: 11, fontWeight: 600 }}>NO RESULTS</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Posts Feed */}
        <div style={{ minWidth: 0 }}>
          {!selectedProfileId ? (
            <div style={{ ...cardStyle, padding: "100px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: "1px solid #eaeaea" }}>
                <Globe style={{ color: "#cbd5e1" }} size={32} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Select a Profile</h2>
              <p style={{ fontSize: 14, color: "#64748B", maxWidth: 300, margin: 0 }}>
                Choose a business profile from the left to view its live feed.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="ds-anim-fade">
              <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{selectedProfile?.name}</h2>
                    <ExternalLink size={12} className="text-[#94a3b8]" />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    {posts.length} Live Publications
                  </p>
                </div>
                <button 
                  onClick={() => fetchGooglePosts(selectedProfileId)}
                  style={{ ...btnSecondary, width: 36, height: 36, padding: 0, justifyContent: "center" }}
                  className="hover-bg-muted"
                >
                  <RefreshCw size={16} className={loadingPosts ? "anim-spin" : ""} />
                </button>
              </div>

              {loadingPosts ? (
                <div style={{ ...cardStyle, padding: "100px 24px", textAlign: "center" }}>
                  <div className="anim-spin" style={{ width: 32, height: 32, border: "3px solid #f1f5f9", borderTopColor: "#2563eb", borderRadius: "50%", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Syncing with Google...</p>
                </div>
              ) : error ? (
                <div style={{ ...cardStyle, background: "#fff", border: "1px solid #fee2e2", borderLeft: "4px solid #dc2626", display: "flex", gap: 16 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, background: "#fef2f2", 
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 
                  }}>
                    <AlertCircle className="text-rose-600" size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                      {error.includes("access token") || error.includes("Unauthorized") ? "Authorization Required" : "Fetch Interrupted"}
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: "0 0 16px" }}>
                      {error}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button 
                        onClick={() => fetchGooglePosts(selectedProfileId)} 
                        style={{ ...btnSecondary, height: 32, fontSize: 12, padding: "0 12px" }}
                      >
                        <RefreshCw size={14} className={loadingPosts ? "anim-spin" : ""} />
                        Retry Sync
                      </button>
                      
                      {(error.includes("token") || error.includes("Unauthorized") || error.includes("expired")) && (
                        <Link 
                          href="/onboard" 
                          style={{ ...btnPrimary, height: 32, fontSize: 12, padding: "0 12px", background: "#0f172a" }}
                        >
                          Reconnect Account
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ) : posts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {posts.map((post) => (
                    <div key={post.name} style={{ ...cardStyle, padding: 0, overflow: "hidden" }} className="hover-border-accent">
                      <div style={{ display: "flex", flexDirection: "column", md: "row" } as any}>
                        {post.media?.length > 0 && (
                          <div style={{ width: 140, height: 140, flexShrink: 0, background: "#f9fafb", borderRight: "1px solid #eaeaea" }}>
                            <img src={post.media[0].googleUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          </div>
                        )}
                        <div style={{ flex: 1, padding: 20 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>
                                {post.state}
                              </span>
                              <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                                <Calendar size={12} />
                                {new Date(post.createTime).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <a href={post.searchUrl} target="_blank" rel="noreferrer" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, color: "#64748B" }}>
                                <ExternalLink size={12} />
                              </a>
                              <button onClick={() => handleDelete(post.name)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 4, color: "#dc2626", cursor: "pointer" }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }} className="line-clamp-2">
                            {post.summary}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {post.callToAction && (
                              <div style={{ fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 4, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                                <ArrowRight size={10} />
                                {post.callToAction.actionType.replace('_', ' ')}
                              </div>
                            )}
                            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>API REF: {post.name.split('/').pop()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ ...cardStyle, padding: "100px 24px", textAlign: "center" }}>
                  <FileText style={{ width: 40, height: 40, color: "#cbd5e1", margin: "0 auto 16px" }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>No posts found</h2>
                  <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>This profile hasn't published any posts yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

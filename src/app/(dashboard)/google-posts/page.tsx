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

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }} className="ds-anim-fade">
      {/* Header section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ 
            width: 52, height: 52, borderRadius: "var(--radius-modal)", 
            background: "var(--neutral-900)", display: "flex", 
            alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-md)" 
          }}>
            <Globe className="text-white" size={24} />
          </div>
          <div>
            <h1 className="heading-section" style={{ fontSize: "var(--text-3xl)", marginBottom: 4 }}>
              Live Feed
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="ds-dot ds-dot-published" style={{ width: 8, height: 8 }} />
              <span style={{ fontSize: "var(--text-micro)", fontWeight: "var(--fw-bold)", color: "var(--success)", textTransform: "uppercase", letterSpacing: "var(--ls-wide)" }}>
                Live Sync Active
              </span>
            </div>
          </div>
        </div>
        <p className="text-secondary" style={{ fontSize: "var(--text-md)", maxWidth: 600 }}>
          Direct transparency. View and manage posts currently live on Google Business Profile in real-time.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, alignItems: "start" }}>
        {/* Profile Sidebar */}
        <div className="ds-card" style={{ padding: 20, position: "sticky", top: 24 }}>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
            <input 
              type="text" 
              placeholder="Search profiles..." 
              className="ds-input"
              style={{ paddingLeft: 36, height: 40 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "calc(100vh - 300px)", overflowY: "auto" }} className="no-scrollbar">
            {loadingProfiles ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <Loader2 className="anim-spin" style={{ color: "var(--brand)" }} size={24} />
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
                    width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-btn)",
                    display: "flex", alignItems: "center", gap: 12, transition: "all var(--transition-base)",
                    background: selectedProfileId === p.id ? "var(--bg-active)" : "transparent",
                    border: "none", cursor: "pointer"
                  }}
                  className={selectedProfileId !== p.id ? "ds-card-hover" : ""}
                >
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: p.logoUrl ? "transparent" : "var(--neutral-100)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "1px solid var(--border-subtle)"
                  }}>
                    {p.logoUrl ? (
                      <img src={p.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    ) : (
                      <MapPin size={18} className="text-tertiary" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-bold)", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--ls-wide)" }}>
                      {p.accountName}
                    </p>
                  </div>
                  {selectedProfileId === p.id && (
                    <ArrowRight size={14} style={{ color: "var(--brand)" }} />
                  )}
                </button>
              ))
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: "var(--fw-bold)" }}>NO RESULTS</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Posts Feed */}
        <div style={{ minWidth: 0 }}>
          {!selectedProfileId ? (
            <div className="ds-card" style={{ padding: "80px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Globe className="text-muted" size={40} />
              </div>
              <h2 className="heading-section" style={{ marginBottom: 8 }}>Select a Profile</h2>
              <p className="text-secondary" style={{ maxWidth: 300 }}>
                Choose a business profile from the left to access its live post repository.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="ds-anim-fade">
              <div className="ds-card" style={{ display: "flex", alignItems: "center", justifyContent: "between", padding: "16px 24px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <h2 className="heading-section" style={{ fontSize: "var(--text-xl)" }}>{selectedProfile?.name}</h2>
                    <ExternalLink size={14} className="text-tertiary" />
                  </div>
                  <p className="text-meta" style={{ fontWeight: "var(--fw-bold)", textTransform: "uppercase", letterSpacing: "var(--ls-label)" }}>
                    {posts.length} Live Publications
                  </p>
                </div>
                <button 
                  onClick={() => fetchGooglePosts(selectedProfileId)}
                  className="ds-btn ds-btn-secondary"
                  style={{ width: 44, height: 44, padding: 0 }}
                >
                  <RefreshCw size={20} className={loadingPosts ? "anim-spin" : ""} />
                </button>
              </div>

              {loadingPosts ? (
                <div className="ds-card" style={{ padding: "100px 24px", textAlign: "center" }}>
                  <div className="anim-spin" style={{ width: 40, height: 40, border: "3px solid var(--neutral-100)", borderTopColor: "var(--brand)", borderRadius: "50%", margin: "0 auto 20px" }} />
                  <p className="heading-card">Querying Google API...</p>
                  <p className="text-meta">Fetching real-time post metrics</p>
                </div>
              ) : error ? (
                <div style={{ padding: 32, background: "var(--danger-subtle)", borderRadius: "var(--radius-modal)", border: "1px solid var(--danger-muted)", display: "flex", gap: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
                    <AlertCircle className="text-danger" size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="heading-card" style={{ color: "var(--danger-text)", marginBottom: 4 }}>Authorization Required</h3>
                    <p className="text-meta" style={{ color: "var(--danger-text)", opacity: 0.8, lineHeight: 1.5 }}>{error}</p>
                    <button onClick={() => fetchGooglePosts(selectedProfileId)} className="ds-btn ds-btn-ghost" style={{ marginTop: 12, paddingLeft: 0, color: "var(--danger-text)", fontWeight: "var(--fw-bold)", textDecoration: "underline" }}>Retry Request</button>
                  </div>
                </div>
              ) : posts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {posts.map((post) => (
                    <div key={post.name} className="ds-card ds-card-hover" style={{ padding: 0, overflow: "hidden" }}>
                      <div style={{ display: "flex", flexDirection: "column", md: "row" } as any}>
                        {post.media?.length > 0 && (
                          <div style={{ width: 140, height: 140, flexShrink: 0, background: "var(--bg-subtle)", borderRight: "1px solid var(--border-subtle)" }}>
                            <img src={post.media[0].googleUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          </div>
                        )}
                        <div style={{ flex: 1, padding: 20 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span className="ds-badge ds-badge-success" style={{ fontSize: 10 }}>
                                {post.state}
                              </span>
                              <div className="text-meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Calendar size={12} />
                                {new Date(post.createTime).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <a href={post.searchUrl} target="_blank" rel="noreferrer" className="ds-btn ds-btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
                                <ExternalLink size={14} />
                              </a>
                              <button onClick={() => handleDelete(post.name)} className="ds-btn ds-btn-danger" style={{ width: 32, height: 32, padding: 0 }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: "var(--text-base)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }} className="line-clamp-3">
                            {post.summary}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "between" }}>
                            {post.callToAction && (
                              <div className="ds-badge ds-badge-neutral" style={{ padding: "4px 10px", fontSize: 10 }}>
                                <ArrowRight size={12} style={{ marginRight: 6, opacity: 0.5 }} />
                                {post.callToAction.actionType.replace('_', ' ')}
                              </div>
                            )}
                            <span className="text-meta" style={{ fontSize: 11 }}>API: {post.name.split('/').pop()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ds-card" style={{ padding: "80px 24px", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <FileText className="text-muted" size={32} />
                  </div>
                  <h2 className="heading-card">Clean Slate</h2>
                  <p className="text-meta">No live publications found on this profile.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

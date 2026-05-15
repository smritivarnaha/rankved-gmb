"use client";

import { useState, useEffect } from "react";
import { 
  Search, MapPin, ExternalLink, Trash2, Loader2, 
  AlertCircle, RefreshCw, Globe, Calendar, FileText
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
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center">
              <Globe className="text-[#2563eb]" size={24} />
            </div>
            Posts from Google
          </h1>
          <p className="text-[#64748b] text-[15px]">View and manage posts directly live on Google Business Profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#f1f5f9] shadow-sm p-4 sticky top-24">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={16} />
              <input 
                type="text" 
                placeholder="Search profiles..." 
                className="w-full h-10 pl-10 pr-4 bg-[#f8fafc] border border-[#f1f5f9] rounded-xl text-sm outline-none focus:border-[#2563eb] transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-[#2563eb]" size={24} />
                </div>
              ) : filteredProfiles.length > 0 ? (
                filteredProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProfileId(p.id);
                      fetchGooglePosts(p.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      selectedProfileId === p.id 
                        ? "bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/20 translate-x-1" 
                        : "hover:bg-[#f8fafc] text-[#475569]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedProfileId === p.id ? "bg-white/20" : "bg-[#f1f5f9]"
                    }`}>
                      {p.logoUrl ? (
                        <img src={p.logoUrl} className="w-full h-full object-cover rounded-lg" alt="" />
                      ) : (
                        <MapPin size={20} className={selectedProfileId === p.id ? "text-white" : "text-[#94a3b8]"} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${selectedProfileId === p.id ? "text-white" : "text-[#1e293b]"}`}>
                        {p.name}
                      </p>
                      <p className={`text-[11px] font-medium truncate opacity-80 ${selectedProfileId === p.id ? "text-blue-50" : "text-[#64748b]"}`}>
                        {p.client}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center py-8 text-sm text-[#94a3b8]">No profiles found</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Posts Feed */}
        <div className="lg:col-span-8">
          {!selectedProfileId ? (
            <div className="bg-white rounded-3xl border border-[#f1f5f9] shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#f8fafc] flex items-center justify-center mb-6">
                <Globe className="text-[#94a3b8]" size={40} />
              </div>
              <h2 className="text-xl font-bold text-[#1e293b] mb-2">No Profile Selected</h2>
              <p className="text-[#64748b] max-w-[320px]">Choose a profile from the sidebar to view its live posts on Google.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
                    Live on {selectedProfile?.name}
                  </h2>
                  <p className="text-sm text-[#64748b]">{posts.length} live posts found</p>
                </div>
                <button 
                  onClick={() => fetchGooglePosts(selectedProfileId)}
                  className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors text-[#64748b]"
                  title="Refresh"
                >
                  <RefreshCw size={20} className={loadingPosts ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingPosts ? (
                <div className="bg-white rounded-3xl border border-[#f1f5f9] shadow-sm p-24 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-[#2563eb] mb-4" size={40} />
                  <p className="text-[#64748b] font-medium">Fetching live data from Google...</p>
                </div>
              ) : error ? (
                <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-6 flex items-start gap-4 text-[#be123c]">
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-bold text-sm mb-1">Could not fetch live posts</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.name} className="bg-white rounded-2xl border border-[#f1f5f9] shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="p-5 flex gap-5">
                        {post.media?.length > 0 && (
                          <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#f8fafc]">
                            <img src={post.media[0].googleUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                post.state === "LIVE" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              }`}>
                                {post.state}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#94a3b8]">
                                <Calendar size={12} />
                                {new Date(post.createTime).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={post.searchUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 hover:bg-blue-50 text-[#2563eb] rounded-lg transition-colors"
                                title="View on Google"
                              >
                                <ExternalLink size={16} />
                              </a>
                              <button 
                                onClick={() => handleDelete(post.name)}
                                className="p-2 hover:bg-red-50 text-[#ef4444] rounded-lg transition-colors"
                                title="Delete from Google"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-[#334155] leading-relaxed line-clamp-3">
                            {post.summary}
                          </p>
                          {post.callToAction && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg text-[11px] font-bold text-[#475569]">
                              <FileText size={12} />
                              {post.callToAction.actionType}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#f1f5f9] shadow-sm p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#f8fafc] flex items-center justify-center mb-4">
                    <RefreshCw className="text-[#94a3b8]" size={32} />
                  </div>
                  <h2 className="text-lg font-bold text-[#1e293b] mb-1">No Posts Found</h2>
                  <p className="text-sm text-[#64748b]">There are no live posts on this profile at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

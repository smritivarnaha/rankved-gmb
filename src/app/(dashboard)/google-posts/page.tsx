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
    <div className="max-w-[1400px] mx-auto py-10 px-6 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-lg shadow-slate-200">
              <Globe className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">
              Live Feed
            </h1>
          </div>
          <p className="text-[#64748b] text-lg font-medium max-w-[600px]">
            Direct transparency. View and manage posts currently live on Google Business Profile in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Profile Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[24px] border border-[#f1f5f9] shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 sticky top-24">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
              <input 
                type="text" 
                placeholder="Search profiles..." 
                className="w-full h-12 pl-12 pr-4 bg-[#f8fafc] border border-[#f1f5f9] rounded-2xl text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#0f172a]/5 focus:border-[#0f172a] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
              {loadingProfiles ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-[#0f172a]" size={32} />
                  <p className="text-sm font-bold text-[#94a3b8] uppercase tracking-widest">Loading Profiles</p>
                </div>
              ) : filteredProfiles.length > 0 ? (
                filteredProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProfileId(p.id);
                      fetchGooglePosts(p.id);
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${
                      selectedProfileId === p.id 
                        ? "bg-[#0f172a] text-white shadow-xl shadow-slate-200" 
                        : "hover:bg-[#f8fafc] text-[#475569]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      selectedProfileId === p.id ? "bg-white/10" : "bg-white shadow-sm border border-[#f1f5f9]"
                    }`}>
                      {p.logoUrl ? (
                        <img src={p.logoUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                      ) : (
                        <MapPin size={22} className={selectedProfileId === p.id ? "text-white" : "text-[#94a3b8]"} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[15px] font-bold truncate mb-0.5 ${selectedProfileId === p.id ? "text-white" : "text-[#0f172a]"}`}>
                        {p.name}
                      </p>
                      <p className={`text-[12px] font-medium truncate opacity-70 ${selectedProfileId === p.id ? "text-slate-300" : "text-[#64748b]"}`}>
                        {p.accountName}
                      </p>
                    </div>
                    {selectedProfileId === p.id && (
                      <ArrowRight size={16} className="text-white/40" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">NO RESULTS</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Posts Feed */}
        <div className="lg:col-span-8">
          {!selectedProfileId ? (
            <div className="bg-white rounded-[32px] border border-[#f1f5f9] shadow-sm p-24 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-[28px] bg-[#f8fafc] flex items-center justify-center mb-8 transform hover:rotate-12 transition-transform duration-500">
                <Globe className="text-slate-300" size={48} />
              </div>
              <h2 className="text-2xl font-black text-[#0f172a] mb-3">Select a Profile</h2>
              <p className="text-[#64748b] text-[15px] font-medium max-w-[340px]">
                Choose a business profile from the left to access its live post repository.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between bg-white p-6 rounded-[24px] border border-[#f1f5f9] shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-[#0f172a]">
                      {selectedProfile?.name}
                    </h2>
                    <ExternalLink size={14} className="text-slate-300" />
                  </div>
                  <p className="text-[13px] font-bold text-[#64748b] uppercase tracking-wider">
                    {posts.length} Live Publications
                  </p>
                </div>
                <button 
                  onClick={() => fetchGooglePosts(selectedProfileId)}
                  className="w-12 h-12 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-2xl flex items-center justify-center transition-all text-[#0f172a] hover:rotate-180 duration-500"
                >
                  <RefreshCw size={20} className={loadingPosts ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingPosts ? (
                <div className="bg-white rounded-[32px] border border-[#f1f5f9] shadow-sm p-32 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-[#0f172a] rounded-full animate-spin mb-6" />
                  <p className="text-[#0f172a] font-bold text-lg">Querying Google API...</p>
                  <p className="text-[#64748b] text-sm font-medium">Fetching real-time post metrics</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-[24px] p-8 flex items-start gap-5 text-red-700">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertCircle className="text-red-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg mb-1">Authorization Snippet Required</h3>
                    <p className="text-[15px] font-medium opacity-80 leading-relaxed">{error}</p>
                    <button onClick={() => fetchGooglePosts(selectedProfileId)} className="mt-4 text-sm font-bold underline underline-offset-4">Retry Request</button>
                  </div>
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {posts.map((post) => (
                    <div key={post.name} className="bg-white rounded-[24px] border border-[#f1f5f9] shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 transition-all group border-l-4 border-l-transparent hover:border-l-[#0f172a]">
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        {post.media?.length > 0 && (
                          <div className="w-full md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-[#f1f5f9]">
                            <img src={post.media[0].googleUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-[0.1em] uppercase ${
                                post.state === "LIVE" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                              }`}>
                                {post.state}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">
                                <Calendar size={12} />
                                {new Date(post.createTime).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={post.searchUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-9 h-9 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center transition-all"
                                title="Open Live Link"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button 
                                onClick={() => handleDelete(post.name)}
                                className="w-9 h-9 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl flex items-center justify-center transition-all"
                                title="Delete Forever"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[15px] text-[#334155] font-medium leading-relaxed line-clamp-3 mb-4">
                            {post.summary}
                          </p>
                          <div className="flex items-center gap-4">
                            {post.callToAction && (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#f1f5f9] rounded-xl text-[10px] font-black text-[#0f172a] uppercase tracking-widest">
                                <ArrowRight size={12} className="text-slate-400" />
                                {post.callToAction.actionType.replace('_', ' ')}
                              </div>
                            )}
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
                              API Ref: {post.name.split('/').pop()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-[#f1f5f9] shadow-sm p-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-[24px] bg-slate-50 flex items-center justify-center mb-6">
                    <FileText className="text-slate-300" size={40} />
                  </div>
                  <h2 className="text-xl font-black text-[#0f172a] mb-2">Clean Slate</h2>
                  <p className="text-sm text-[#64748b] font-medium">No live publications found on this profile.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

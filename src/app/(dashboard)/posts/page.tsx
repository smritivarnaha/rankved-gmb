"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Filter, Loader2, Trash2, MapPin, Eye, Clock, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { useSession } from "next-auth/react";

const statusTabs = ["All", "Draft", "Scheduled", "Published", "Failed"];

export default function PostsPage() {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.role === "ADMIN" || (session as any)?.user?.role === "SUPER_ADMIN";
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  const [profiles, setProfiles] = useState<string[]>([]);
  const [profileFilter, setProfileFilter] = useState("All Profiles");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      const loadedPosts = data.data || [];
      setPosts(loadedPosts);
      
      // Extract unique profiles for the filter cleanly
      const uniqueProfiles = Array.from(new Set(loadedPosts.map((p: any) => p.profileName))).filter(Boolean) as string[];
      setProfiles(uniqueProfiles);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this scheduled post?")) return;
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    fetchPosts();
  };

  const filtered = posts
    .filter(p => statusFilter === "All" || p.status === statusFilter.toUpperCase())
    .filter(p => profileFilter === "All Profiles" || p.profileName === profileFilter);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight mb-1">
            Posts Workspace
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Create, schedule, and manage your Google Business posts.
          </p>
        </div>
        <Link href="/posts/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-full text-[14px] font-semibold transition-all duration-200 hover:shadow-blue-500/40 hover:-translate-y-0.5 shrink-0">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> 
          New Post
        </Link>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        
        {/* Soft, modern App-like filter bar */}
        <div className="border-b border-[var(--border-light)] px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 glass z-10 transition-colors">
          
          {/* Animated Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map(t => {
              const isActive = statusFilter === t;
              return (
                <button 
                  key={t} 
                  onClick={() => setStatusFilter(t)}
                  className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${
                    isActive 
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm scale-105" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-light)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Profile Filter Dropdown */}
          <div className="flex items-center gap-2 relative min-w-[220px]">
            <Filter className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3" />
            <select 
              value={profileFilter} 
              onChange={(e) => setProfileFilter(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2 bg-[var(--bg-secondary)] border border-transparent rounded-[12px] text-[13px] font-medium text-[var(--text-primary)] cursor-pointer focus:ring-2 focus:ring-[var(--accent)] transition-all hover:bg-[var(--border-light)]"
            >
              <option value="All Profiles">All Profiles</option>
              {profiles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-2 sm:p-4 bg-[var(--bg-secondary)]/30 min-h-[400px]">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
              <p className="text-[14px] text-[var(--text-tertiary)] font-medium">Loading your workspace...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center max-w-sm mx-auto animate-fade-in-up">
              <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <FileText className="w-10 h-10 text-[var(--text-tertiary)]" strokeWidth={1} />
              </div>
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">No posts found</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6">
                {posts.length === 0 ? "You haven't created any posts yet. Start reaching your customers today." : "No posts match the current filters. Try selecting 'All'."}
              </p>
              {posts.length === 0 && (
                <Link href="/posts/new" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-zinc-800 border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-full text-[14px] font-semibold transition-all duration-200">
                  <Plus className="w-4 h-4" /> Create your first post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((post, idx) => (
                <div 
                  key={post.id} 
                  className="group bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[20px] p-5 shadow-sm hover:shadow-xl hover:border-[var(--accent)]/30 transition-all duration-300 relative overflow-hidden flex flex-col h-full animate-fade-in-up flex-1"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={post.status} />
                    {/* Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Link href={`/posts/${post.id}`} className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {isAdmin && (
                        <button onClick={() => handleDelete(post.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[16px] font-medium text-[var(--text-primary)] leading-snug line-clamp-3 mb-4">
                      {post.summary}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--border-light)] flex flex-col gap-2.5">
                    <div className="flex items-center text-[12px] font-medium text-[var(--text-tertiary)]">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70 shrink-0" />
                      <span className="truncate">{post.profileName}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-tertiary)]">
                      <div className="px-2.5 py-1 bg-[var(--bg-secondary)] rounded-md uppercase tracking-wider">
                        {post.topicType}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
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
  let baseClasses = "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm flex items-center gap-1.5 w-max ";
  
  if (s === "PUBLISHED") return <span className={baseClasses + "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/20"}><CheckCircle2 className="w-3.5 h-3.5"/> PUBLISHED</span>;
  if (s === "SCHEDULED") return <span className={baseClasses + "bg-amber-100/80 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-200 dark:border-amber-400/20"}><Clock className="w-3.5 h-3.5"/> SCHEDULED</span>;
  if (s === "FAILED") return <span className={baseClasses + "bg-red-100/80 text-red-700 dark:bg-red-400/10 dark:text-red-400 border border-red-200 dark:border-red-400/20"}><AlertTriangle className="w-3.5 h-3.5"/> FAILED</span>;
  
  return <span className={baseClasses + "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}><FileText className="w-3h-3.5" /> DRAFT</span>;
}

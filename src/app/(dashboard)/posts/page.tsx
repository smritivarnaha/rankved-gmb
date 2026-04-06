"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, FileText, Filter, Loader2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

const profiles = ["All profiles", "Sunrise Dental — Downtown Office", "Sunrise Dental — East Branch", "TechWave Solutions — Main Branch", "GrowthHub Academy — Training Center", "Green Eats — Cafe Central"];
const statusTabs = ["All", "Draft", "Scheduled", "Published", "Failed"];

export default function PostsPage() {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.user?.role === "ADMIN";
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [profileFilter, setProfileFilter] = useState("All profiles");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    fetchPosts();
  };

  const filtered = posts
    .filter(p => statusFilter === "All" || p.status === statusFilter.toUpperCase())
    .filter(p => profileFilter === "All profiles" || `${p.clientName} — ${p.profileName}` === profileFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Posts</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Manage and schedule posts across all profiles.</p>
        </div>
        <Link href="/posts/new" className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New post
        </Link>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg">
        {/* Filters row */}
        <div className="border-b border-[var(--border-light)] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-0.5 -mb-3 sm:mb-0">
            {statusTabs.map(t => (
              <button key={t} onClick={() => setStatusFilter(t)}
                className={`px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                  statusFilter === t
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <select value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}
              className="border border-[var(--border)] rounded-lg py-1.5 px-2.5 text-[12px] text-[var(--text-secondary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-w-[200px]">
              {profiles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-8 h-8 text-[var(--border)] mx-auto mb-2" />
            <p className="text-[13px] text-[var(--text-tertiary)]">
              {posts.length === 0 ? "No posts yet. Create your first post!" : "No posts match your filters."}
            </p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-light)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide text-left">
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Post</th>
                <th className="px-5 py-2.5 font-medium">Profile</th>
                <th className="px-5 py-2.5 font-medium hidden md:table-cell">Type</th>
                <th className="px-5 py-2.5 font-medium hidden sm:table-cell">Scheduled</th>
                <th className="px-5 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-5 py-3.5"><StatusLabel status={post.status} /></td>
                  <td className="px-5 py-3.5 max-w-[300px]">
                    <p className="text-[var(--text-primary)] truncate">{post.summary}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">by {post.createdBy}</p>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-[12px] text-[var(--text-secondary)]">{post.clientName} — {post.profileName}</span></td>
                  <td className="px-5 py-3.5 text-[var(--text-tertiary)] hidden md:table-cell">{post.topicType}</td>
                  <td className="px-5 py-3.5 text-[12px] text-[var(--text-tertiary)] hidden sm:table-cell">
                    {post.scheduledAt ? format(new Date(post.scheduledAt), "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/posts/${post.id}`}
                        className="px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors">
                        View
                      </Link>
                      {isAdmin && (
                        <button onClick={() => handleDelete(post.id)}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const s = status.toLowerCase();
  const style =
    s === "published" ? "text-[var(--success)] bg-[var(--success-bg)]" :
    s === "scheduled" ? "text-[var(--warning)] bg-[var(--warning-bg)]" :
    s === "failed" ? "text-[var(--error)] bg-[var(--error-bg)]" :
    "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]";
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${style}`}>{s}</span>;
}

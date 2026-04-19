"use client";

import { Building2, MapPin, FileText, Clock, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ clients: 0, locations: 0, scheduled: 0, published: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [postsRes, profilesRes] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/profiles"),
        ]);
        const postsData = postsRes.ok ? await postsRes.json() : { data: [] };
        const profilesData = profilesRes.ok ? await profilesRes.json() : { data: [] };
        const allPosts: any[] = postsData.data || [];
        setPosts(allPosts.slice(0, 5));
        setStats({
          clients: 0,
          locations: profilesData.data?.length || 0,
          scheduled: allPosts.filter((p: any) => p.status === "SCHEDULED").length,
          published: allPosts.filter((p: any) => p.status === "PUBLISHED").length,
        });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const name = session?.user?.name?.split(" ")[0] || "there";

  const cards = [
    { label: "Profiles", value: stats.locations, icon: MapPin, href: "/profiles" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, href: "/posts" },
    { label: "Published", value: stats.published, icon: CheckCircle2, href: "/posts" },
    { label: "Total Posts", value: stats.scheduled + stats.published, icon: FileText, href: "/posts" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Google Sans', sans-serif", fontSize: 24, fontWeight: 400, color: "var(--text-primary)", letterSpacing: "0", margin: "0 0 4px 0" }}>
            Good morning, {name}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Here&apos;s what&apos;s happening with your Google Business profiles.
          </p>
        </div>
        <Link href="/posts/new" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 24, // Pill shape for Google MD3 primary action
          background: "var(--accent)", color: "#fff",
          fontFamily: "'Google Sans', sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none",
          transition: "box-shadow 0.15s, background 0.15s",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-md);"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent)"; }}
        >
          <Plus size={18} /> New post
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff", border: "1px solid var(--border-light)",
                borderRadius: 12, padding: "24px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                transition: "box-shadow 0.15s, border-color 0.15s",
                cursor: "pointer",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-light)"; }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", margin: "0 0 8px 0" }}>{c.label}</p>
                  <p style={{ fontFamily: "'Google Sans', sans-serif", fontSize: 32, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1, margin: 0 }}>
                    {loading ? "—" : c.value}
                  </p>
                </div>
                <div style={{ color: "var(--accent)" }}>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* Recent posts */}
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "'Google Sans', sans-serif", fontSize: 16, fontWeight: 400, color: "var(--text-primary)", margin: 0 }}>Recent posts</h2>
            <Link href="/posts" style={{ fontFamily: "'Google Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>View all</Link>
          </div>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Loading…</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center" }}>
              <FileText size={36} color="var(--border)" style={{ margin: "0 auto 12px", strokeWidth: 1 }} />
              <p style={{ fontFamily: "'Google Sans', sans-serif", fontSize: 15, color: "var(--text-primary)", fontWeight: 400, margin: "0 0 4px 0" }}>No posts yet</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px 0" }}>Create your first post to get started.</p>
              <Link href="/posts/new" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 100, border: "1px solid var(--border)",
                background: "transparent", color: "var(--accent)",
                fontFamily: "'Google Sans', sans-serif", fontSize: 14, fontWeight: 500, textDecoration: "none",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-light)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
              >
                <Plus size={16} /> Create post
              </Link>
            </div>
          ) : (
            posts.map((post, i) => (
              <Link key={i} href={`/posts/${post.id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderBottom: i < posts.length - 1 ? "1px solid var(--border-light)" : "none",
                textDecoration: "none", transition: "background 0.1s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-secondary)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
              >
                <div style={{ minWidth: 0, flex: 1, marginRight: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 400, color: "var(--text-primary)", margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.summary || post.content?.slice(0, 80) || "Untitled post"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                    {post.profileName || post.clientName || ""}
                  </p>
                </div>
                <StatusBadge status={post.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    published: { bg: "#e6f4ea", color: "#1e8e3e" }, // Google exact success
    scheduled: { bg: "#fef7e0", color: "#b06c00" }, // Google exact warning
    failed: { bg: "#fce8e6", color: "#d93025" },    // Google exact error
    draft: { bg: "var(--bg-tertiary)", color: "var(--text-secondary)" },
  };
  const style = map[s] || map.draft;
  return (
    <span style={{
      fontFamily: "'Google Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "2px 8px",
      borderRadius: 4, background: style.bg, color: style.color,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

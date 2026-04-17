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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em", margin: "0 0 4px 0" }}>
            Good morning, {name} 👋
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Here&apos;s what&apos;s happening with your Google Business profiles.
          </p>
        </div>
        <Link href="/posts/new" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 12,
          background: "var(--accent)", color: "#fff",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 2px 12px rgba(79,70,229,0.25)",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          <Plus size={16} /> New post
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff", border: "1px solid var(--border-light)",
                borderRadius: 14, padding: "20px 22px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "box-shadow 0.15s, border-color 0.15s",
                cursor: "pointer",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(79,70,229,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-light)"; }}
              >
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>{c.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1, margin: 0 }}>
                    {loading ? "—" : c.value}
                  </p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color="var(--accent)" strokeWidth={1.8} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* Recent posts */}
        <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Recent posts</h2>
            <Link href="/posts" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Loading…</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center" }}>
              <FileText size={36} color="var(--border)" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600, margin: "0 0 4px 0" }}>No posts yet</p>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 16px 0" }}>Create your first post to get started.</p>
              <Link href="/posts/new" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: "var(--accent)", color: "#fff",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
                <Plus size={14} /> Create post
              </Link>
            </div>
          ) : (
            posts.map((post, i) => (
              <Link key={i} href={`/posts/${post.id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderBottom: i < posts.length - 1 ? "1px solid var(--border-light)" : "none",
                textDecoration: "none", transition: "background 0.1s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-secondary)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}
              >
                <div style={{ minWidth: 0, flex: 1, marginRight: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.summary || post.content?.slice(0, 80) || "Untitled post"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
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
    published: { bg: "#ecfdf5", color: "#059669" },
    scheduled: { bg: "#fffbeb", color: "#d97706" },
    failed: { bg: "#fef2f2", color: "#dc2626" },
    draft: { bg: "#f1f5f9", color: "#64748b" },
  };
  const style = map[s] || map.draft;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 100, background: style.bg, color: style.color,
      whiteSpace: "nowrap", textTransform: "capitalize", flexShrink: 0,
    }}>
      {s}
    </span>
  );
}

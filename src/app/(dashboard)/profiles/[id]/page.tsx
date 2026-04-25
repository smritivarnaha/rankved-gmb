"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, FileText, Clock, Send, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useParams } from "next/navigation";
import { PostTimeline } from "@/components/posts/post-timeline";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Profile {
  id: string;
  name: string;
  accountName: string;
  address: string;
  phone: string;
  website: string;
  fetchedAt: string;
  manual?: boolean;
}

interface Post {
  id: string;
  summary: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  imageUrl?: string;
  topicType: string;
}

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  PUBLISHED: { bg: "var(--success-bg)", color: "var(--success)", label: "Published" },
  SCHEDULED: { bg: "var(--warning-bg)", color: "var(--warning)", label: "Scheduled" },
  DRAFT: { bg: "var(--bg-elevated)", color: "var(--text-muted)", label: "Draft" },
  FAILED: { bg: "var(--error-bg)", color: "var(--error)", label: "Failed" },
};

function PostThumbnail({ post }: { post: Post }) {
  const s = statusStyle[post.status] || statusStyle.DRAFT;
  const dateLabel = post.publishedAt
    ? format(new Date(post.publishedAt), "MMM d")
    : post.scheduledAt
    ? format(new Date(post.scheduledAt), "MMM d, h:mm a")
    : format(new Date(post.createdAt), "MMM d");

  return (
    <Link href={`/posts/${post.id}`} style={{
      display: "block",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      overflow: "hidden",
      transition: "box-shadow 0.12s, border-color 0.12s",
    }} className="post-thumb-hover">
      {/* Image or placeholder */}
      <div style={{ height: 120, background: "var(--bg-elevated)", position: "relative", overflow: "hidden" }}>
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText style={{ width: 28, height: 28, color: "var(--border)" }} />
          </div>
        )}
        {/* Status pill */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: s.bg, color: s.color,
          fontSize: 10, fontWeight: 700, padding: "3px 8px",
          borderRadius: "var(--radius-full)", textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{s.label}</div>
      </div>
      {/* Content */}
      <div style={{ padding: "10px 12px" }}>
        <p style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>
          {post.summary || "No content"}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{dateLabel}</p>
      </div>
    </Link>
  );
}

export default function ProfileDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [timelineDate, setTimelineDate] = useState("");

  const { data: postsData, isLoading: postsLoading } = useSWR(
    params.id ? `/api/posts?profileId=${params.id}` : null,
    fetcher, { revalidateOnFocus: false }
  );

  const posts: Post[] = postsData?.data || [];

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profiles");
        const data = await res.json();
        const found = (data.data || []).find((p: any) => p.id === params.id);
        setProfile(found || null);
      } catch { setProfile(null); }
      setProfileLoading(false);
    }
    loadProfile();
  }, [params.id]);

  if (profileLoading) {
    return (
      <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>
        <Loader2 style={{ width: 20, height: 20, color: "var(--text-muted)" }} className="anim-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Profile not found.</p>
        <Link href="/profiles" style={{ color: "var(--accent)", fontSize: 13, marginTop: 8, display: "inline-block" }}>← Back to profiles</Link>
      </div>
    );
  }

  const now = new Date();
  const published = posts.filter(p => p.status === "PUBLISHED").length;
  const scheduled = posts.filter(p => p.status === "SCHEDULED").length;
  const drafts = posts.filter(p => p.status === "DRAFT").length;
  const recentPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* Back */}
      <Link href="/profiles"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> All profiles
      </Link>

      {/* Profile Header Card */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", padding: "24px",
        marginBottom: 20, display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "var(--radius-sm)",
            background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <MapPin style={{ width: 22, height: 22, color: "var(--accent)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{profile.name}</h1>
            {profile.address && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{profile.address}</p>
            )}
          </div>
        </div>
        <Link href={`/posts/new?profile=${profile.id}&from=profile`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "9px 18px", background: "var(--accent)",
            color: "#fff", borderRadius: "var(--radius-sm)",
            fontSize: 14, fontWeight: 600, transition: "background 0.12s",
          }}>
          <Plus style={{ width: 16, height: 16 }} /> Create Post
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", marginBottom: 20, overflow: "hidden",
      }}>
        {[
          { label: "Published", sublabel: "this month", value: posts.filter(p => {
            if (p.status !== "PUBLISHED" || !p.publishedAt) return false;
            const d = new Date(p.publishedAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, color: "var(--success)", icon: <Send style={{ width: 14, height: 14 }} /> },
          { label: "Scheduled", sublabel: "upcoming", value: scheduled, color: "var(--warning)", icon: <Clock style={{ width: 14, height: 14 }} /> },
          { label: "Drafts", sublabel: "unsaved", value: drafts, color: "var(--text-muted)", icon: <FileText style={{ width: 14, height: 14 }} /> },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: "20px 24px", textAlign: "center",
            borderRight: i < 2 ? "1px solid var(--border-light)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: stat.color, marginBottom: 8 }}>
              {stat.icon}
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{stat.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Timeline — profile specific */}
      <div style={{ marginBottom: 20 }}>
        <PostTimeline
          onDateSelect={setTimelineDate}
          selectedDate={timelineDate}
          profileId={profile.id as string}
        />
      </div>

      {/* Recent Posts */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Post History</h2>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{posts.length} total</span>
        </div>

        {postsLoading ? (
          <div style={{ padding: "60px 0", display: "flex", justifyContent: "center" }}>
            <Loader2 style={{ width: 18, height: 18, color: "var(--text-muted)" }} className="anim-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <FileText style={{ width: 32, height: 32, color: "var(--border)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 6 }}>No posts yet for this profile.</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Create your first post to get started.</p>
            <Link href={`/posts/new?profile=${profile.id}&from=profile`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>
              <Plus style={{ width: 14, height: 14 }} /> Create first post
            </Link>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {recentPosts.map(post => <PostThumbnail key={post.id} post={post} />)}
            </div>
            {posts.length > 6 && (
              <div style={{ padding: "12px 0 4px", textAlign: "center" }}>
                <Link href={`/posts?profile=${profile.id}`}
                  style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>
                  View all {posts.length} posts →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Synced info */}
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, paddingLeft: 4 }}>
        Synced {format(new Date(profile.fetchedAt), "MMM d, yyyy")}
      </p>
    </div>
  );
}

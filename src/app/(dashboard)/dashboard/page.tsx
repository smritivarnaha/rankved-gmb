import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MapPin, Clock, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;

  const stats = await prisma.$transaction(async (tx) => {
    const locations = await tx.location.count();
    const scheduled = await tx.post.count({ where: { status: "SCHEDULED" } });
    const published = await tx.post.count({ where: { status: "PUBLISHED" } });
    const drafts = await tx.post.count({ where: { status: "DRAFT" } });
    const pending = await tx.post.count({ where: { status: "PENDING_APPROVAL" } });
    return { locations, scheduled, published, drafts, pending };
  });

  const name = user?.name?.split(" ")[0] || "User";

  const statCards = [
    { label: "Synced Profiles", value: stats.locations, dot: "#2563eb", href: "/profiles", sub: "locations" },
    { label: "Published Posts", value: stats.published, dot: "#16a34a", href: "/posts", sub: "all time" },
    { label: "Scheduled", value: stats.scheduled, dot: "#f59e0b", href: "/posts", sub: "upcoming" },
    { label: "Drafts", value: stats.drafts, dot: "#94a3b8", href: "/posts", sub: "in progress" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Welcome back, {name} 👋</h1>
          <p className="page-subtitle">Your Google Business Profile command centre.</p>
        </div>
      </div>

      {/* Google Connect Banner */}
      {user?.role === "AGENCY_OWNER" && !(session as any)?.accessToken && (
        <div style={{
          marginBottom: 24, padding: "16px 20px",
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin style={{ width: 18, height: 18, color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1e40af", marginBottom: 3 }}>Connect your Google Business Profile</p>
            <p style={{ fontSize: 12, color: "#3b82f6" }}>Link your Google Account to sync your managed locations and start publishing.</p>
          </div>
          <Link href="/settings" style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
            Connect Account →
          </Link>
        </div>
      )}

      {/* Pending approval banner */}
      {stats.pending > 0 && (
        <div style={{
          marginBottom: 24, padding: "14px 20px",
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#f59e0b", display: "inline-block", flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#92400e", flex: 1 }}>
            {stats.pending} post{stats.pending > 1 ? "s" : ""} awaiting your approval
          </p>
          <Link href="/posts" style={{ fontSize: 13, color: "#d97706", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            Review now <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 32 }}>
        {statCards.map((c) => (
          <Link key={c.label} href={c.href} style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: "20px 22px",
            display: "flex", flexDirection: "column", gap: 8,
            transition: "box-shadow 0.15s, border-color 0.15s",
            textDecoration: "none",
          }} className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: 38, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{c.value.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: "#94a3b8" }}>{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Quick Actions</h2>
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { href: "/profiles", label: "Manage Profiles", desc: "View, sync and post to your GBP locations", icon: MapPin, color: "#eff6ff", dot: "#2563eb" },
            { href: "/posts", label: "Posts Workspace", desc: "Review drafts, scheduled and published posts", icon: FileText, color: "#f0fdf4", dot: "#16a34a" },
            { href: "/settings", label: "Settings", desc: "Manage your account and Google connection", icon: CheckCircle2, color: "#fefce8", dot: "#eab308" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 16px", background: item.color,
              borderRadius: 10, border: `1px solid ${item.dot}20`,
              transition: "opacity 0.12s",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <item.icon style={{ width: 16, height: 16, color: item.dot }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

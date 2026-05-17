import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MapPin, Clock, CheckCircle2, FileText, ArrowRight, Users, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";

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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAgencyOwner = user?.role === "AGENCY_OWNER";
  const isAdmin = isSuperAdmin || isAgencyOwner;

  const targetUserId = user?.ownerId || user?.id;
  const client = await prisma.client.findFirst({ where: { userId: targetUserId } });

  const locationWhere = isSuperAdmin ? {} : client ? { clientId: client.id } : { id: "none" };
  const postWhereBase = isSuperAdmin ? {} : client ? { location: { clientId: client.id } } : { id: "none" };

  // Core stats
  const stats = await prisma.$transaction(async (tx) => {
    const locations = await tx.location.count({ where: locationWhere });
    const scheduled = await tx.post.count({ where: { ...postWhereBase, status: "SCHEDULED" } });
    const published = await tx.post.count({ where: { ...postWhereBase, status: "PUBLISHED" } });
    const drafts = await tx.post.count({ where: { ...postWhereBase, status: "DRAFT" } });
    const pending = await tx.post.count({ where: { ...postWhereBase, status: "PENDING_APPROVAL" } });
    return { locations, scheduled, published, drafts, pending };
  });

  // Upcoming scheduled posts
  const upcomingPosts = await prisma.post.findMany({
    where: { ...postWhereBase, status: "SCHEDULED" },
    orderBy: { scheduledAt: "asc" },
    take: 5,
    include: { location: { select: { name: true } } }
  });

  // Team members with post stats (admins only)
  let teamMembers: any[] = [];
  if (isAdmin) {
    const members = await prisma.user.findMany({
      where: isSuperAdmin ? { role: "TEAM_MEMBER" } : { role: "TEAM_MEMBER", ownerId: user?.id },
      select: {
        id: true, name: true, email: true, isApproved: true,
        canPublishNow: true, canSchedule: true, minScheduleDays: true,
        createdAt: true,
        posts: {
          select: { status: true, createdAt: true, publishedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    teamMembers = members.map(m => {
      const published = m.posts.filter(p => p.status === "PUBLISHED").length;
      const scheduled = m.posts.filter(p => p.status === "SCHEDULED").length;
      const drafts = m.posts.filter(p => p.status === "DRAFT").length;
      const pending = m.posts.filter(p => p.status === "PENDING_APPROVAL").length;
      const thisMonth = m.posts.filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      const initials = (m.name || m.email || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
      return { ...m, published, scheduled, drafts, pending, thisMonth, initials };
    });
  }

  const name = user?.name?.split(" ")[0] || "User";

  const statCards = [
    { label: "Profiles",  value: stats.locations, dot: "#2563eb", href: "/profiles", sub: "synced" },
    { label: "Published", value: stats.published, dot: "#16a34a", href: "/calendar", sub: "all time" },
    { label: "Scheduled", value: stats.scheduled, dot: "#f59e0b", href: "/calendar", sub: "upcoming" },
    { label: "Drafts",    value: stats.drafts,    dot: "#94a3b8", href: "/calendar", sub: "in progress" },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .dash-main-grid { grid-template-columns: 1fr !important; }
          .dash-banner { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .dash-banner-btn { width: 100% !important; justify-content: center !important; }
          .dash-header h1 { font-size: 20px !important; }
        }
        @media (max-width: 480px) {
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .dash-stat-val { font-size: 24px !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 32 }} className="dash-header">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Welcome back, {name} 👋</h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Your Google Business Profile command centre.</p>
      </div>

      {/* Google Connect Banner */}
      {user?.role === "AGENCY_OWNER" && !(session as any)?.accessToken && (
        <div style={{
          marginBottom: 24, padding: "16px 20px",
          background: "#fff", border: "1px solid #e0e7ff", borderLeft: "4px solid #2563eb",
          borderRadius: 8, display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
        }} className="dash-banner">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin style={{ width: 20, height: 20, color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1e3a8a", margin: "0 0 4px" }}>Connect your Google Business Profile</p>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>Link your Google Account to sync managed locations and start publishing.</p>
          </div>
          <Link href="/settings" style={{...btnPrimary, flexShrink: 0}} className="dash-banner-btn">
            Connect Google <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Pending approval banner */}
      {stats.pending > 0 && isAdmin && (
        <div style={{
          marginBottom: 24, padding: "16px 20px",
          background: "#fff", border: "1px solid #fef08a", borderLeft: "4px solid #f59e0b",
          borderRadius: 8, display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
        }} className="dash-banner">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: "#d97706" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#92400e", margin: "0 0 4px" }}>
              {stats.pending} post{stats.pending > 1 ? "s" : ""} awaiting your approval
            </p>
            <p style={{ fontSize: 13, color: "#b45309", margin: 0 }}>Review posts drafted by your team members before publishing.</p>
          </div>
          <Link href="/calendar" style={{ ...btnPrimary, background: "#fff", color: "#d97706", border: "1px solid #fcd34d", flexShrink: 0 }} className="dash-banner-btn">
            Review Posts <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }} className="dash-stat-grid">
        {statCards.map((c) => (
          <Link key={c.label} href={c.href} style={{
            ...cardStyle, display: "flex", flexDirection: "column", gap: 12, textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s"
          }} className="hover-border-accent">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
            </div>
            <div>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1, margin: "0 0 4px", letterSpacing: "-0.02em" }} className="dash-stat-val">{c.value.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }} className="dash-main-grid">
        {/* Left Column (Upcoming Posts & Team) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Upcoming Scheduled Posts Widget */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden", alignSelf: "stretch" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={16} color="#64748B" />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Upcoming Scheduled Posts</h2>
                {upcomingPosts.length > 0 && (
                  <span style={{ fontSize: 11, background: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>
                    {upcomingPosts.length} soon
                  </span>
                )}
              </div>
              <Link href="/calendar" style={{ fontSize: 13, color: "#2563EB", fontWeight: 500, textDecoration: "none" }}>
                View all &rarr;
              </Link>
            </div>

            {upcomingPosts.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <Clock style={{ width: 32, height: 32, color: "#CBD5E1", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>No scheduled posts</p>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Posts you schedule will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {upcomingPosts.map((post: any, idx: number) => (
                  <Link key={post.id} href={`/posts/${post.id}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                    padding: "16px 20px", textDecoration: "none",
                    borderBottom: idx === upcomingPosts.length - 1 ? "none" : "1px solid #f8f9fa",
                    transition: "background 0.15s"
                  }} className="hover-bg-muted">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {post.summary || "No content"}
                      </p>
                      <p style={{ fontSize: 12, color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {post.location?.name || "Unknown Location"}
                        </span>
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" }) : "N/A"}
                      </p>
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Team Members (admins only) */}
          {isAdmin && (
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden", alignSelf: "stretch" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Users size={16} color="#64748B" />
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Team Members</h2>
                  <span style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>
                    {teamMembers.length}
                  </span>
                </div>
                <Link href="/users" style={{ fontSize: 13, color: "#2563EB", fontWeight: 500, textDecoration: "none" }}>
                  Manage team &rarr;
                </Link>
              </div>

              {teamMembers.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <Users style={{ width: 32, height: 32, color: "#CBD5E1", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>No team members yet</p>
                  <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Add members from the Users section to delegate posting.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #eaeaea", background: "#f8f9fa" }}>
                      <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>MEMBER</th>
                      <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>PUBLISHED</th>
                      <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>SCHEDULED</th>
                      <th style={{ fontSize: 11, fontWeight: 600, color: "#64748B", padding: "12px 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m: any) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f8f9fa" }}>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                              {m.initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name || "Unnamed"}</p>
                              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{m.published}</span>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{m.scheduled}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 4,
                            background: m.isApproved ? "#ECFDF5" : "#FEF2F2",
                            color: m.isApproved ? "#059669" : "#DC2626",
                            textTransform: "uppercase", letterSpacing: "0.05em"
                          }}>
                            {m.isApproved ? "Active" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ ...cardStyle, padding: 0, alignSelf: "flex-start" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Quick Actions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { href: "/profiles", label: "Manage Profiles", desc: "Sync and post to locations", icon: MapPin, color: "#2563EB" },
              { href: "/calendar", label: "Calendar View", desc: "Review drafts & published", icon: FileText, color: "#10B981" },
              { href: "/settings", label: "System Settings", desc: "Account & connections", icon: CheckCircle2, color: "#8B5CF6" },
            ].map((item, idx) => (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 20px", textDecoration: "none",
                borderBottom: idx === 2 ? "none" : "1px solid #f8f9fa",
                transition: "background 0.15s"
              }} className="hover-bg-muted">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #eaeaea" }}>
                  <item.icon size={16} color={item.color} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

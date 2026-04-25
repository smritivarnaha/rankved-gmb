import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MapPin, Clock, CheckCircle2, FileText, ArrowRight, Users, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "AGENCY_OWNER";

  // Core stats
  const stats = await prisma.$transaction(async (tx) => {
    const locations = await tx.location.count();
    const scheduled = await tx.post.count({ where: { status: "SCHEDULED" } });
    const published = await tx.post.count({ where: { status: "PUBLISHED" } });
    const drafts = await tx.post.count({ where: { status: "DRAFT" } });
    const pending = await tx.post.count({ where: { status: "PENDING_APPROVAL" } });
    return { locations, scheduled, published, drafts, pending };
  });

  // Team members with post stats (admins only)
  let teamMembers: any[] = [];
  if (isAdmin) {
    const members = await prisma.user.findMany({
      where: { role: "TEAM_MEMBER" },
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
    { label: "Profiles", value: stats.locations, dot: "#2563eb", href: "/profiles", sub: "synced" },
    { label: "Published", value: stats.published, dot: "#16a34a", href: "/posts", sub: "all time" },
    { label: "Scheduled", value: stats.scheduled, dot: "#f59e0b", href: "/posts", sub: "upcoming" },
    { label: "Drafts", value: stats.drafts, dot: "#94a3b8", href: "/posts", sub: "in progress" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Welcome back, {name} 👋</h1>
          <p className="page-subtitle">Your Google Business Profile command centre.</p>
        </div>
      </div>

      {/* Google Connect Banner */}
      {user?.role === "AGENCY_OWNER" && !(session as any)?.accessToken && (
        <div style={{
          marginBottom: 20, padding: "14px 18px",
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin style={{ width: 16, height: 16, color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1e40af", marginBottom: 2 }}>Connect your Google Business Profile</p>
            <p style={{ fontSize: 12, color: "#3b82f6" }}>Link your Google Account to sync managed locations and start publishing.</p>
          </div>
          <Link href="/settings" style={{ padding: "7px 16px", background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            Connect →
          </Link>
        </div>
      )}

      {/* Pending approval banner */}
      {stats.pending > 0 && isAdmin && (
        <div style={{
          marginBottom: 20, padding: "12px 18px",
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 12,
        }}>
          <AlertTriangle style={{ width: 16, height: 16, color: "#f59e0b", flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#92400e", flex: 1 }}>
            {stats.pending} post{stats.pending > 1 ? "s" : ""} awaiting your approval
          </p>
          <Link href="/posts" style={{ fontSize: 13, color: "#d97706", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            Review <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 28 }}>
        {statCards.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card" style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: "18px 20px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{c.value.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: "#94a3b8" }}>{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Team Members (admins only) */}
      {isAdmin && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users style={{ width: 15, height: 15, color: "#64748b" }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Team Members</h2>
              <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                {teamMembers.length}
              </span>
            </div>
            <Link href="/users" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              Manage team <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          {teamMembers.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Users style={{ width: 28, height: 28, color: "#e2e8f0", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>No team members yet.</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>Add members from the Users section to delegate posting.</p>
            </div>
          ) : (
            <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {teamMembers.map((m: any) => (
                <div key={m.id} style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  borderRadius: 10, padding: "14px 16px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  {/* Member header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>
                      {m.initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.name || "Unnamed"}
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.email}
                      </p>
                    </div>
                    <span style={{
                      marginLeft: "auto", flexShrink: 0,
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                      background: m.isApproved ? "#dcfce7" : "#fee2e2",
                      color: m.isApproved ? "#15803d" : "#dc2626",
                    }}>
                      {m.isApproved ? "Active" : "Pending"}
                    </span>
                  </div>

                  {/* Activity mini-stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {[
                      { label: "Published", value: m.published, dot: "#16a34a" },
                      { label: "Scheduled", value: m.scheduled, dot: "#f59e0b" },
                      { label: "Drafts", value: m.drafts, dot: "#94a3b8" },
                      { label: "Pending", value: m.pending, dot: "#f97316" },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: "center", background: "#fff", borderRadius: 8, padding: "8px 4px", border: "1px solid #f1f5f9" }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 3 }}>{stat.value}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: stat.dot, display: "inline-block" }} />
                          <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{stat.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Permissions row */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {m.canPublishNow && (
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "#eff6ff", color: "#2563eb", borderRadius: 20, fontWeight: 600 }}>
                        Publish Now
                      </span>
                    )}
                    {m.canSchedule && (
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "#f0fdf4", color: "#15803d", borderRadius: 20, fontWeight: 600 }}>
                        Can Schedule
                      </span>
                    )}
                    {m.minScheduleDays > 0 && (
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "#fef9c3", color: "#854d0e", borderRadius: 20, fontWeight: 600 }}>
                        Min {m.minScheduleDays}d advance
                      </span>
                    )}
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "#f8fafc", color: "#94a3b8", borderRadius: 20, fontWeight: 600, marginLeft: "auto" }}>
                      {m.thisMonth} this month
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Quick Actions</h2>
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {[
            { href: "/profiles", label: "Manage Profiles", desc: "View, sync and post to GBP locations", icon: MapPin, color: "#eff6ff", dot: "#2563eb" },
            { href: "/posts", label: "Posts Workspace", desc: "Review drafts, scheduled & published", icon: FileText, color: "#f0fdf4", dot: "#16a34a" },
            { href: "/settings", label: "Settings & Google", desc: "Account and Google connection setup", icon: CheckCircle2, color: "#fefce8", dot: "#eab308" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", background: item.color,
              borderRadius: 10, border: `1px solid ${item.dot}22`,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <item.icon style={{ width: 15, height: 15, color: item.dot }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

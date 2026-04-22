import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MapPin, FileText, Clock, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;

  const [stats, recentPosts] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const locations = await tx.location.count();
      const scheduled = await tx.post.count({ where: { status: "SCHEDULED" } });
      const published = await tx.post.count({ where: { status: "PUBLISHED" } });
      return { locations, scheduled, published };
    }),
    prisma.post.findMany({
      where: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? undefined : { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { location: { include: { client: true } } },
    }),
  ]);

  const name = user?.name?.split(" ")[0] || "User";

  const cards = [
    { label: "Synced Profiles", value: stats.locations, icon: MapPin, href: "/profiles" },
    { label: "Scheduled Posts", value: stats.scheduled, icon: Clock, href: "/posts?status=Scheduled" },
    { label: "Published Posts", value: stats.published, icon: CheckCircle2, href: "/posts?status=Published" },
    { label: "Total Lifetime Posts", value: stats.scheduled + stats.published, icon: FileText, href: "/posts" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hey, {name} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your Google Business profiles today.</p>
        </div>
        <Link href="/posts/new" className="btn btn-primary">
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} />
          Create New Post
        </Link>
      </div>

      {user?.role === "AGENCY_OWNER" && !(session as any)?.accessToken && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3 text-indigo-800 shadow-sm">
          <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Connect your Google Business Profile</h3>
            <p className="text-xs text-indigo-700/80 mb-3">To start managing and fetching your profiles, you must connect your Google Account. This is only used to sync your managed locations.</p>
            <Link href="/settings" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
              Connect Google Account →
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="stat-card">
              <div className="stat-card-top">
                <div>
                  <p className="stat-label">{c.label}</p>
                  <p className="stat-value">{c.value.toLocaleString()}</p>
                </div>
                <div className="stat-icon-wrap">
                  <Icon style={{ width: 22, height: 22 }} strokeWidth={1.5} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
          <Link href="/posts" className="btn btn-ghost btn-sm" style={{ color: "var(--accent)" }}>
            View all posts →
          </Link>
        </div>
        
        {recentPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FileText style={{ width: 28, height: 28 }} strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No posts scheduled</h3>
            <p className="empty-text">Create your first post to start engaging with customers.</p>
            <Link href="/posts/new" className="btn btn-outline">
              <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} />
              Create your first post
            </Link>
          </div>
        ) : (
          <div>
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="activity-item">
                <div className="activity-info">
                  <p className="activity-title">{post.summary || "Untitled Post"}</p>
                  <div className="activity-meta">
                    <MapPin style={{ width: 13, height: 13 }} />
                    {post.location.name}
                  </div>
                </div>
                <StatusBadge status={post.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "DRAFT").toUpperCase();
  let cls = "badge ";
  if (s === "PUBLISHED") cls += "badge-success";
  else if (s === "SCHEDULED") cls += "badge-warning";
  else if (s === "FAILED") cls += "badge-error";
  else cls += "badge-default";
  return <span className={cls}>{s}</span>;
}

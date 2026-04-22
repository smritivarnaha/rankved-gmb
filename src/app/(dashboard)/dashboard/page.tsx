import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MapPin, FileText, Clock, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;

  // Real-time server-side data fetching directly from Prisma! Super fast.
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
    { label: "Synced Profiles", value: stats.locations, icon: MapPin, href: "/profiles", color: "blue" },
    { label: "Scheduled Posts", value: stats.scheduled, icon: Clock, href: "/posts?status=Scheduled", color: "amber" },
    { label: "Published Posts", value: stats.published, icon: CheckCircle2, href: "/posts?status=Published", color: "emerald" },
    { label: "Total Lifetime Posts", value: stats.scheduled + stats.published, icon: FileText, href: "/posts", color: "indigo" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight mb-1">
            Hey, {name} 👋
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Here's what's happening with your Google Business profiles today.
          </p>
        </div>
        <Link href="/posts/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 rounded-full text-[14px] font-semibold transition-all duration-200 hover:shadow-blue-500/40 hover:-translate-y-0.5">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> 
          Create New Post
        </Link>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="group transition-card block relative top-0 hover:-top-1">
              <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[20px] p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                {/* Subtle gradient background glow */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 bg-${c.color}-500 group-hover:opacity-20 transition-opacity`}></div>
                
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{c.label}</p>
                    <p className="text-[36px] font-bold text-[var(--text-primary)] leading-none tracking-tight">
                      {c.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 bg-[var(--bg-secondary)] rounded-2xl group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-colors duration-300 text-[var(--text-tertiary)]`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Posts Grid */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[24px] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border-light)] flex items-center justify-between glass">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Recent Activity</h2>
          <Link href="/posts" className="text-[14px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
            View all posts &rarr;
          </Link>
        </div>
        
        {recentPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[var(--text-tertiary)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">No posts scheduled</h3>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">Create your first post to start engaging with customers.</p>
            <Link href="/posts/new" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--bg-primary)] border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-full text-[14px] font-semibold transition-all duration-200">
              <Plus className="w-4 h-4" strokeWidth={2.5} /> 
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="flex items-center justify-between p-5 hover:bg-[var(--bg-secondary)] transition-colors group">
                <div className="min-w-0 pr-4">
                  <p className="text-[15px] font-medium text-[var(--text-primary)] mb-1 truncate group-hover:text-[var(--accent)] transition-colors">
                    {post.summary || "Untitled Post"}
                  </p>
                  <p className="text-[13px] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    {post.location.name}
                  </p>
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
  let baseClasses = "px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm ";
  
  if (s === "PUBLISHED") baseClasses += "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-400/20";
  else if (s === "SCHEDULED") baseClasses += "bg-amber-100/80 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-200 dark:border-amber-400/20";
  else if (s === "FAILED") baseClasses += "bg-red-100/80 text-red-700 dark:bg-red-400/10 dark:text-red-400 border border-red-200 dark:border-red-400/20";
  else baseClasses += "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700";

  return <span className={baseClasses}>{s}</span>;
}

"use client";

import { Building2, MapPin, FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

const stats = [
  { label: "Clients", value: "4", icon: Building2 },
  { label: "Locations", value: "12", icon: MapPin },
  { label: "Scheduled", value: "8", icon: Clock },
  { label: "Published", value: "26", icon: CheckCircle2 },
];

const recentPosts = [
  { summary: "Spring sale — 30% off all services this week", status: "Published", client: "Sunrise Dental", location: "Downtown Office", type: "Offer" },
  { summary: "We're hiring a senior developer. Apply today.", status: "Scheduled", client: "TechWave Solutions", location: "Main Branch", type: "Update" },
  { summary: "New workshop: Digital marketing basics — April 15", status: "Scheduled", client: "GrowthHub Academy", location: "Training Center", type: "Event" },
  { summary: "Refreshed menu with new vegan options", status: "Draft", client: "Green Eats", location: "Cafe Central", type: "Update" },
  { summary: "Holiday hours announcement", status: "Failed", client: "Sunrise Dental", location: "All Locations", type: "Update" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Overview</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Activity across all managed profiles.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{s.label}</p>
                <p className="text-[28px] font-semibold text-[var(--text-primary)] mt-1 leading-none">{s.value}</p>
              </div>
              <s.icon className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.6} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-lg">
          <div className="px-5 py-4 border-b border-[var(--border-light)]">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Recent posts</h2>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {recentPosts.map((post, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-[13px] text-[var(--text-primary)] truncate">{post.summary}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{post.client} · {post.location}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[var(--text-tertiary)]">{post.type}</span>
                  <StatusLabel status={post.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg">
          <div className="px-5 py-4 border-b border-[var(--border-light)]">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Alerts</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex gap-3 p-3 bg-[var(--error-bg)] rounded-lg">
              <AlertTriangle className="w-4 h-4 text-[var(--error)] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-[var(--error)]">1 failed post</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Check the posts page to retry.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-[var(--warning-bg)] rounded-lg">
              <Clock className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-medium text-[var(--warning)]">8 upcoming</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Posts queued for auto-publish.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const style =
    status === "Published" ? "text-[var(--success)] bg-[var(--success-bg)]" :
    status === "Scheduled" ? "text-[var(--warning)] bg-[var(--warning-bg)]" :
    status === "Failed" ? "text-[var(--error)] bg-[var(--error-bg)]" :
    "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]";
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style}`}>{status}</span>;
}

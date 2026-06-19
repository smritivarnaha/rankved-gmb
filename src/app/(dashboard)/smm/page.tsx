"use client";

import { useState, useEffect } from "react";
import { useActiveClient } from "@/hooks/useActiveClient";
import Link from "next/link";
import { 
  LayoutDashboard, Users, Share2, CalendarDays, CheckCircle2, 
  XCircle, AlertCircle, Edit3, Send, Clock, Plus, ArrowRight, Loader2,
  Building2, MessageSquare, PlusCircle, Activity
} from "lucide-react";

export default function SmmDashboardPage() {
  const { activeClient } = useActiveClient();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const url = activeClient ? `/api/smm/dashboard?clientId=${activeClient.id}` : "/api/smm/dashboard";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboard().finally(() => setLoading(false));
  }, [activeClient]);

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.01)"
  };

  const btnPrimary = {
    height: 38,
    padding: "0 16px",
    background: "#7e22ce",
    color: "#fff",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    transition: "background 0.2s"
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  // --- CASE A: Client Workspace Dashboard ---
  if (activeClient && data?.scope === "CLIENT") {
    const { client, connections, upcomingPosts, pendingApprovals, publishedPosts, activityTimeline } = data;
    const isFbConnected = connections.some((c: any) => c.platform === "FACEBOOK" && c.status === "CONNECTED");
    const isIgConnected = connections.some((c: any) => c.platform === "INSTAGRAM" && c.status === "CONNECTED");
    const isLiConnected = connections.some((c: any) => c.platform === "LINKEDIN" && c.status === "CONNECTED");

    return (
      <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Workspace Dashboard</h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              SMM dashboard for clinic: <strong style={{ color: "#7e22ce" }}>{client.businessClinicName || client.name}</strong>
            </p>
          </div>
          <Link href="/smm/composer" style={btnPrimary}>
            <Plus size={15} /> Compose Post
          </Link>
        </div>

        {/* Client Workspace Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }} className="composer-grid">
          <div style={cardStyle}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Social Accounts</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isFbConnected ? "#10b981" : "#cbd5e1" }} title="Facebook" />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isIgConnected ? "#10b981" : "#cbd5e1" }} title="Instagram" />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isLiConnected ? "#10b981" : "#cbd5e1" }} title="LinkedIn" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                {connections.filter((c: any) => c.status === "CONNECTED").length} connected
              </span>
            </div>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Awaiting Approval</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{pendingApprovals.length}</h3>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Upcoming Scheduled</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{upcomingPosts.length}</h3>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Total Published</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{publishedPosts.length}</h3>
          </div>
        </div>

        {/* Client workspace lists */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }} className="composer-grid">
          
          {/* Left Column: Post logs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Pending Approvals */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Pending Approvals</h3>
              {pendingApprovals.length === 0 ? (
                <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", margin: 0 }}>No posts awaiting client review.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingApprovals.map((post: any) => (
                    <div key={post.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.caption}
                        </p>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Link 
                        href="/smm/approvals" 
                        style={{ fontSize: 12, fontWeight: 600, color: "#7e22ce", textDecoration: "none" }}
                      >
                        Create Approval Batch →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Scheduled Content */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Upcoming Content</h3>
              {upcomingPosts.length === 0 ? (
                <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", margin: 0 }}>No content scheduled for this client workspace.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {upcomingPosts.map((post: any) => (
                    <div key={post.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>{post.caption}</p>
                        <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> Scheduled for: {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                      <Link 
                        href="/smm/calendar" 
                        style={{ fontSize: 12, fontWeight: 600, color: "#7e22ce", textDecoration: "none" }}
                      >
                        View Calendar
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Activity Timeline */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={18} color="#7e22ce" /> Activity Timeline
            </h3>

            {activityTimeline.length === 0 ? (
              <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", margin: 0 }}>No recent activities recorded.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, borderLeft: "2px solid #f1f5f9", paddingLeft: 12, marginLeft: 6 }}>
                {activityTimeline.map((act: any) => (
                  <div key={act.id} style={{ position: "relative" }}>
                    {/* Circle marker */}
                    <span style={{
                      position: "absolute",
                      left: -17,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: act.action === "APPROVE" ? "#10b981" : act.action === "REJECT" ? "#ef4444" : "#7e22ce"
                    }} />
                    
                    <h5 style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", margin: "0 0 2px" }}>
                      {act.action === "APPROVE" ? "Approved by client" : act.action === "REJECT" ? "Changes requested" : act.action === "SEND_APPROVAL" ? "Sent for client review" : "Post updated"}
                    </h5>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>
                      {new Date(act.createdAt).toLocaleString()} · by {act.actor}
                    </p>
                    <p style={{ fontSize: 12, color: "#475569", margin: 0, fontStyle: "italic", lineBreak: "anywhere" }}>
                      "{act.postCaption.slice(0, 50)}..." {act.comments && ` - ${act.comments}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // --- CASE B: Agency Dashboard (Multi-client overview) ---
  const stats = data?.stats || {
    totalClients: 0,
    connectedAccounts: 0,
    scheduledCount: 0,
    publishedCount: 0,
    failedCount: 0,
    pendingCount: 0
  };

  const statCards = [
    { label: "SMM Clients", value: stats.totalClients, dot: "#7e22ce", href: "/smm/clients" },
    { label: "Accounts Linked", value: stats.connectedAccounts, dot: "#3b82f6", href: "/smm/connections" },
    { label: "Scheduled", value: stats.scheduledCount, dot: "#f59e0b", href: "/smm/calendar" },
    { label: "Pending Approvals", value: stats.pendingCount, dot: "#d97706", href: "/smm/approvals" },
    { label: "Published (SMM)", value: stats.publishedCount, dot: "#10b981", href: "/smm" },
    { label: "Failed (SMM)", value: stats.failedCount, dot: "#ef4444", href: "/smm" }
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Social Media command centre</h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>Agency-wide multi-client social media workspace manager.</p>
      </div>

      {/* Warning banner if no client selected */}
      <div style={{
        marginBottom: 28, padding: "16px 20px",
        background: "linear-gradient(135deg, #fdf4ff 0%, #eff6ff 100%)",
        border: "1px solid #f3e8ff",
        borderLeft: "4px solid #7e22ce",
        borderRadius: 12, display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Building2 style={{ width: 20, height: 20, color: "#7e22ce" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1e1b4b", margin: "0 0 2px" }}>Enter Client Workspace</p>
          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>To draft, schedule, review or upload media library files, enter a client's dedicated workspace.</p>
        </div>
        <Link href="/smm/clients" style={{...btnPrimary, flexShrink: 0}}>
          Enter Workspace <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }} className="composer-grid">
        {statCards.map((c, i) => (
          <Link key={i} href={c.href} style={{
            ...cardStyle, display: "flex", flexDirection: "column", gap: 12, textDecoration: "none",
            transition: "border-color 0.2s, box-shadow 0.2s"
          }} className="hover-border-accent">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
            </div>
            <div>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{c.value.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Grid: Upcoming posts & Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }} className="composer-grid">
        
        {/* Left Column: Upcoming posts across all clients */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Upcoming Scheduled SMM Posts</h3>
          {data?.upcomingPosts?.length === 0 ? (
            <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", margin: 0 }}>No posts scheduled across SMM accounts.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {data?.upcomingPosts?.map((post: any) => (
                <div key={post.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>
                      {post.client?.name}
                    </p>
                    <p style={{ fontSize: 13, color: "#334155", margin: "0 0 6px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {post.caption}
                    </p>
                    <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> {new Date(post.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                  <Link href="/smm/calendar" style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", alignSelf: "center", textDecoration: "none" }}>
                    Reschedule
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: SMM Quick actions */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Quick Actions</h3>
          <Link href="/smm/clients" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#475569", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", textDecoration: "none" }}>
            <PlusCircle size={16} color="#7e22ce" /> Enter Client Workspace
          </Link>
          <Link href="/smm/clients" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#475569", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", textDecoration: "none" }}>
            <Users size={16} color="#3b82f6" /> Add SMM Client Profile
          </Link>
          <Link href="/smm/connections" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#475569", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", textDecoration: "none" }}>
            <Share2 size={16} color="#10b981" /> Link API Channels
          </Link>
        </div>

      </div>
    </div>
  );
}

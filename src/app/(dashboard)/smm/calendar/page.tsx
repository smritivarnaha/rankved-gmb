"use client";

import { useState, useEffect } from "react";
import { useActiveClient } from "@/hooks/useActiveClient";
import Link from "next/link";
import { 
  CalendarDays, ChevronLeft, ChevronRight, Filter, Search, 
  Eye, ArrowRight, Loader2, Calendar, Clock, Edit 
} from "lucide-react";

export default function SmmCalendarPage() {
  const { activeClient, loading: loadingActive } = useActiveClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"MONTH" | "WEEK" | "DAY">("MONTH");

  // Filter states
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Post detail modal
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchPosts = async () => {
    if (!activeClient) return;
    try {
      const res = await fetch(`/api/smm/posts?clientId=${activeClient.id}`);
      const data = await res.json();
      if (data.data) {
        setPosts(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeClient) {
      setLoading(true);
      fetchPosts().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeClient]);

  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    if (viewType === "MONTH") d.setMonth(d.getMonth() - 1);
    else if (viewType === "WEEK") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    if (viewType === "MONTH") d.setMonth(d.getMonth() + 1);
    else if (viewType === "WEEK") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleOpenPostDetails = (post: any) => {
    setSelectedPost(post);
    if (post.scheduledAt) {
      setRescheduleDate(new Date(post.scheduledAt).toISOString().slice(0, 16));
    } else {
      setRescheduleDate("");
    }
  };

  const handleReschedule = async () => {
    if (!selectedPost) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/smm/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: rescheduleDate,
          status: selectedPost.status === "DRAFT" ? "SCHEDULED" : selectedPost.status
        })
      });
      const data = await res.json();
      if (data.data) {
        await fetchPosts();
        setSelectedPost(null);
      } else {
        alert(data.error || "Failed to reschedule post");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to reschedule post");
    } finally {
      setUpdating(false);
    }
  };

  // Helper date calculators
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  };

  const getFilteredPosts = () => {
    return posts.filter(post => {
      // Platform filter
      if (platformFilter !== "ALL") {
        const hasPlatform = post.destinations?.some((d: any) => d.socialAccount?.platform === platformFilter);
        if (!hasPlatform) return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && post.status !== statusFilter) {
        return false;
      }
      return true;
    });
  };

  const renderMonthView = () => {
    const { firstDay, totalDays } = getDaysInMonth(currentDate);
    const cells = [];
    
    // Fill empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ background: "#f8fafc", minHeight: 90, borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} />);
    }

    const filtered = getFilteredPosts();

    // Fill days of the month
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      
      const dayPosts = filtered.filter(post => {
        const postDate = post.scheduledAt || post.publishedAt || post.createdAt;
        const d = new Date(postDate);
        return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });

      const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

      cells.push(
        <div 
          key={`day-${day}`} 
          style={{
            minHeight: 90,
            borderRight: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            padding: 6,
            background: isToday ? "#fdf4ff" : "#fff",
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}
        >
          <span style={{
            fontSize: 12,
            fontWeight: isToday ? 800 : 500,
            color: isToday ? "#7e22ce" : "#475569",
            background: isToday ? "#f3e8ff" : "transparent",
            width: 20,
            height: 20,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {day}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
            {dayPosts.map((post: any) => {
              const bgStatus = getStatusColor(post.status);
              return (
                <div
                  key={post.id}
                  onClick={() => handleOpenPostDetails(post)}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 6px",
                    borderRadius: 4,
                    background: bgStatus.bg,
                    color: bgStatus.color,
                    borderLeft: `3px solid ${bgStatus.border}`,
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  title={post.caption}
                >
                  {post.caption}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderLeft: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", padding: "8px 0", background: "#f8fafc", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
            {w}
          </div>
        ))}
        {cells}
      </div>
    );
  };

  const renderWeekView = () => {
    // Renders the columns of Mon-Sun for the current week range
    const filtered = getFilteredPosts();
    const days = [];
    const tempDate = new Date(currentDate);
    const dayOfWeek = tempDate.getDay();
    tempDate.setDate(tempDate.getDate() - dayOfWeek); // Go to Sunday of current week

    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(tempDate);
      const dayPosts = filtered.filter(post => {
        const postDate = post.scheduledAt || post.publishedAt || post.createdAt;
        const d = new Date(postDate);
        return d.getDate() === cellDate.getDate() && d.getMonth() === cellDate.getMonth() && d.getFullYear() === cellDate.getFullYear();
      });

      days.push(
        <div key={i} style={{ flex: 1, borderRight: "1px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column", minHeight: 300 }}>
          <div style={{ padding: 12, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 2px", textTransform: "uppercase" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
            </p>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{cellDate.getDate()}</span>
          </div>
          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, flex: 1, overflowY: "auto" }}>
            {dayPosts.map((post: any) => {
              const colors = getStatusColor(post.status);
              return (
                <div
                  key={post.id}
                  onClick={() => handleOpenPostDetails(post)}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: colors.bg,
                    color: colors.color,
                    borderLeft: `3px solid ${colors.border}`,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <p style={{ margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.caption}</p>
                  <span style={{ fontSize: 9, opacity: 0.8 }}>
                    {post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Draft"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );

      tempDate.setDate(tempDate.getDate() + 1);
    }

    return (
      <div style={{ display: "flex", borderLeft: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {days}
      </div>
    );
  };

  const renderDayView = () => {
    const filtered = getFilteredPosts();
    const dayPosts = filtered.filter(post => {
      const postDate = post.scheduledAt || post.publishedAt || post.createdAt;
      const d = new Date(postDate);
      return d.getDate() === currentDate.getDate() && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
          Schedules for {currentDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h4>

        {dayPosts.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", margin: 0 }}>No posts scheduled or published on this day.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dayPosts.map((post: any) => {
              const colors = getStatusColor(post.status);
              return (
                <div
                  key={post.id}
                  onClick={() => handleOpenPostDetails(post)}
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    background: colors.bg,
                    color: colors.color,
                    borderLeft: `4px solid ${colors.border}`,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{post.caption}</h5>
                    <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>
                      Created by: {post.user?.name || post.user?.email}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Draft"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return { bg: "#f1f5f9", color: "#475569", border: "#94a3b8" };
      case "PENDING_APPROVAL": return { bg: "#fffbeb", color: "#b45309", border: "#f59e0b" };
      case "APPROVED": return { bg: "#f0fdf4", color: "#16a34a", border: "#4ade80" };
      case "REJECTED": return { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" };
      case "SCHEDULED": return { bg: "#eff6ff", color: "#1d4ed8", border: "#3b82f6" };
      case "PUBLISHED": return { bg: "#f0fdf4", color: "#15803d", border: "#22c55e" };
      case "FAILED": return { bg: "#fef2f2", color: "#b91c1c", border: "#ef4444" };
      default: return { bg: "#f8fafc", color: "#64748b", border: "#cbd5e1" };
    }
  };

  if (loadingActive) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (!activeClient) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 600, margin: "60px auto", padding: "0 16px" }}>
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CalendarDays size={24} color="#7e22ce" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Select Client Workspace</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
            Schedules and Calendars are client-specific. Please select a client workspace first to view content schedules.
          </p>
          <Link href="/smm/clients" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 42,
            padding: "0 20px",
            background: "#7e22ce",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none"
          }}>
            Choose SMM Client <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Content Calendar</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Post calendar schedules for client: <strong style={{ color: "#7e22ce" }}>{activeClient.name}</strong>
          </p>
        </div>
        
        {/* Toggle View */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 8, gap: 2 }}>
          {["MONTH", "WEEK", "DAY"].map(view => (
            <button
              key={view}
              onClick={() => setViewType(view as any)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 6,
                background: viewType === view ? "#fff" : "transparent",
                color: viewType === view ? "#7e22ce" : "#64748b",
                boxShadow: viewType === view ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                cursor: "pointer",
                border: "none"
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        {/* Calendar Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handlePrevMonth} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", minWidth: 140, textAlign: "center" }}>
            {currentDate.toLocaleDateString([], {
              month: "long",
              year: "numeric",
              ...(viewType === "DAY" ? { day: "numeric" } : {})
            })}
          </span>
          <button onClick={handleNextMonth} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" }}>
            <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            style={{ height: 32, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#fff", cursor: "pointer" }}
          >
            Today
          </button>
        </div>

        {/* Filter Selection */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Platform */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={13} color="#94a3b8" />
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              style={{ height: 32, padding: "0 8px 0 6px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, background: "#fff" }}
            >
              <option value="ALL">All Platforms</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="LINKEDIN">LinkedIn</option>
            </select>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ height: 32, padding: "0 8px 0 6px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, background: "#fff" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Calendar view container */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div>
          {viewType === "MONTH" && renderMonthView()}
          {viewType === "WEEK" && renderWeekView()}
          {viewType === "DAY" && renderDayView()}
        </div>
      )}

      {/* Post details Reschedule Modal */}
      {selectedPost && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "90%",
            maxWidth: 500,
            padding: 28,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            position: "relative"
          }} className="anim-scale">
            <button 
              onClick={() => setSelectedPost(null)}
              style={{ position: "absolute", right: 16, top: 16, color: "#64748b", cursor: "pointer" }}
            >
              <ChevronLeft size={20} /> Close
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Post Details & Scheduler</h3>
            
            <div style={{
              background: getStatusColor(selectedPost.status).bg,
              color: getStatusColor(selectedPost.status).color,
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              display: "inline-block",
              marginBottom: 16,
              textTransform: "uppercase"
            }}>
              {selectedPost.status}
            </div>

            <p style={{ fontSize: 13, color: "#1e293b", background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.5, margin: "0 0 16px", whiteSpace: "pre-wrap" }}>
              {selectedPost.caption} {selectedPost.hashtags}
            </p>

            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {selectedPost.mediaUrls.map((url: string, idx: number) => (
                  <img key={idx} src={url} alt="creative" style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover", border: "1px solid #cbd5e1" }} />
                ))}
              </div>
            )}

            {/* Rescheduler dates */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Reschedule Post Date & Time</label>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button 
                onClick={() => setSelectedPost(null)}
                style={{ height: 36, padding: "0 16px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleReschedule}
                disabled={updating}
                style={{
                  height: 36,
                  padding: "0 18px",
                  background: "#7e22ce",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {updating && <Loader2 className="animate-spin" size={14} />}
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

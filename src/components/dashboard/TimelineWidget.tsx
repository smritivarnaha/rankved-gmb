"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

interface Location {
  id: string;
  name: string;
  isHidden: boolean;
}

interface Post {
  id: string;
  locationId: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  summary: string;
}

export function TimelineWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHidden, setShowHidden] = useState(false);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthParam = `${year}-${month.toString().padStart(2, "0")}`;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/timeline?month=${monthParam}&showHidden=${showHidden}`);
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [monthParam, showHidden]);

  // Calculate days in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "#10b981"; // green
      case "SCHEDULED": return "#3b82f6"; // blue
      case "DRAFT": return "#eab308"; // yellow
      case "PENDING_APPROVAL": return "#f59e0b"; // orange
      case "FAILED": return "#ef4444"; // red
      default: return "#94a3b8"; // gray
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, overflow: "hidden", marginBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Content Timeline</h2>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Month Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handlePrevMonth} style={{ background: "none", border: "1px solid #eaeaea", borderRadius: 6, padding: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120, textAlign: "center" }}>{monthName}</span>
            <button onClick={handleNextMonth} style={{ background: "none", border: "1px solid #eaeaea", borderRadius: 6, padding: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ width: 1, height: 20, background: "#eaeaea" }} />

          {/* Visibility Toggle */}
          <button 
            onClick={() => setShowHidden(!showHidden)}
            style={{ 
              background: "none", border: "none", cursor: "pointer", 
              display: "flex", alignItems: "center", gap: 6, 
              fontSize: 13, color: showHidden ? "#2563eb" : "#64748b", fontWeight: 500 
            }}
          >
            {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            {showHidden ? "Hide Inactive" : "Show Hidden"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #eaeaea", display: "flex", gap: 16, background: "#f8f9fa", fontSize: 12, color: "#64748b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor("PUBLISHED") }}/> Published</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor("SCHEDULED") }}/> Scheduled</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor("DRAFT") }}/> Draft</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: getStatusColor("FAILED") }}/> Failed</div>
      </div>

      {/* Grid Container */}
      <div style={{ position: "relative", minHeight: 150 }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <Loader2 className="animate-spin" color="#2563eb" />
          </div>
        )}

        {locations.length === 0 && !loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            No profiles found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 800, padding: "16px 20px" }}>
              {/* Grid Header (Days) */}
              <div style={{ display: "flex", marginLeft: 160, marginBottom: 8 }}>
                {days.map(day => {
                  const isToday = new Date().getDate() === day && new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
                  return (
                    <div key={day} style={{ 
                      flex: 1, textAlign: "center", fontSize: 11, fontWeight: 600, 
                      color: isToday ? "#2563eb" : "#94a3b8",
                      background: isToday ? "#eff6ff" : "transparent",
                      borderRadius: 4, padding: "2px 0"
                    }}>
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Grid Rows (Locations) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {locations.map((loc) => {
                  const locPosts = posts.filter(p => p.locationId === loc.id);
                  
                  return (
                    <div key={loc.id} style={{ display: "flex", alignItems: "center" }}>
                      {/* Location Name */}
                      <div style={{ width: 160, paddingRight: 16, fontSize: 13, fontWeight: 500, color: loc.isHidden ? "#94a3b8" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>
                        {loc.name}
                      </div>

                      {/* Days Row */}
                      <div style={{ display: "flex", flex: 1, gap: 4 }}>
                        {days.map(day => {
                          // Find posts for this specific day
                          const dayPosts = locPosts.filter(p => {
                            const dateStr = p.publishedAt || p.scheduledAt;
                            if (!dateStr) return false;
                            const d = new Date(dateStr);
                            return d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year;
                          });

                          // Sort to show highest priority if multiple (Published > Scheduled > Draft)
                          dayPosts.sort((a, b) => {
                            const p = { "PUBLISHED": 3, "SCHEDULED": 2, "FAILED": 4, "PENDING_APPROVAL": 1, "DRAFT": 0 } as any;
                            return (p[b.status] || 0) - (p[a.status] || 0);
                          });

                          const topPost = dayPosts[0];

                          return (
                            <div key={day} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                              {topPost ? (
                                <Link href={`/posts/${topPost.id}`} title={`${topPost.status}: ${topPost.summary}`} style={{ 
                                  width: "100%", height: 24, borderRadius: 4, 
                                  background: getStatusColor(topPost.status),
                                  opacity: 0.8, transition: "opacity 0.2s",
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                  {dayPosts.length > 1 && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{dayPosts.length}</span>}
                                </Link>
                              ) : (
                                <div style={{ width: "100%", height: 24, borderRadius: 4, background: "#f1f5f9" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

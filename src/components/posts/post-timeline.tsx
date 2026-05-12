"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, FileText, AlertTriangle } from "lucide-react";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface PostSlot {
  date: string;
  status: "PUBLISHED" | "SCHEDULED" | "DRAFT" | "FAILED";
}

interface Props {
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
  profileId?: string;
}

const statusConfig = {
  PUBLISHED: { label: "Published", color: "#16a34a", bg: "#f0fdf4", dot: "#16a34a" },
  SCHEDULED:  { label: "Scheduled", color: "#d97706", bg: "#fffbeb", dot: "#d97706" },
  DRAFT:      { label: "Draft",     color: "#64748b", bg: "#f8fafc", dot: "#64748b" },
  FAILED:     { label: "Failed",    color: "#dc2626", bg: "#fef2f2", dot: "#dc2626" },
};

export function PostTimeline({ onDateSelect, selectedDate, profileId }: Props) {
  const [slots, setSlots] = useState<PostSlot[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    const url = profileId ? `/api/posts?profileId=${profileId}` : "/api/posts";
    fetch(url)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const toLocalDateStr = (iso: string) => {
          const d = new Date(iso);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        const mapped: PostSlot[] = (d.data || []).map((p: any) => ({
          date: p.scheduledAt ? toLocalDateStr(p.scheduledAt) : toLocalDateStr(p.createdAt),
          status: p.status,
        }));
        setSlots(mapped);
      })
      .catch(() => {});
  }, [profileId]);

  // Generate 52 days: 7 past + today + 44 future
  const days = [];
  const toLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  for (let i = -7; i <= 44; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = toLocalDateString(d);
    days.push({
      date: d, dateStr,
      day: d.getDate(),
      dayName: dayNames[d.getDay()],
      month: monthNames[d.getMonth()],
      isToday: i === 0,
      isPast: i < 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }

  // Group posts by date
  const postsByDate: Record<string, PostSlot[]> = {};
  slots.forEach(s => {
    if (!postsByDate[s.date]) postsByDate[s.date] = [];
    postsByDate[s.date].push(s);
  });

  // Scroll today into view
  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector("[data-today='true']");
      if (todayEl) todayEl.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  // Stats
  const counts = { PUBLISHED: 0, SCHEDULED: 0, DRAFT: 0, FAILED: 0 };
  slots.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });

  const filters = [
    { key: "ALL", label: "All posts", count: slots.length },
    { key: "PUBLISHED", label: "Published", count: counts.PUBLISHED },
    { key: "SCHEDULED", label: "Scheduled", count: counts.SCHEDULED },
    { key: "DRAFT", label: "Draft", count: counts.DRAFT },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 4px 6px -1px rgba(0,0,0,0.03)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#ffffff" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: activeFilter === f.key ? "#0f172a" : "transparent",
                color: activeFilter === f.key ? "#fff" : "#64748b",
                transition: "all 0.2s",
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: activeFilter === f.key ? "rgba(255,255,255,0.15)" : "#f1f5f9",
                  color: activeFilter === f.key ? "#fff" : "#64748b",
                  borderRadius: 10, padding: "1px 7px",
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Nav arrows */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => scroll("left")} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s" }} className="hover-bg-muted">
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => scroll("right")} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", transition: "all 0.2s" }} className="hover-bg-muted">
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Calendar strip */}
      <div ref={scrollRef} style={{ display: "flex", overflowX: "auto", padding: "12px 8px 8px", gap: 2, scrollbarWidth: "none" }}>
        {days.map((d, i) => {
          const allPosts = postsByDate[d.dateStr] || [];
          const filteredPosts = activeFilter === "ALL" ? allPosts : allPosts.filter(p => p.status === activeFilter);
          const isSelected = selectedDate === d.dateStr;
          const showMonthLabel = i === 0 || d.day === 1;

          return (
            <button
              key={d.dateStr}
              data-today={d.isToday}
              onClick={() => !d.isPast && onDateSelect?.(d.dateStr)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                minWidth: 56, padding: "8px 4px 10px", borderRadius: 12,
                border: "none", cursor: d.isPast ? "default" : "pointer",
                background: isSelected ? "#eff6ff" : d.isToday ? "#f8fafc" : "transparent",
                outline: isSelected ? "2px solid #2563eb" : d.isToday ? "1px solid #e2e8f0" : "none",
                opacity: d.isPast ? 0.45 : 1,
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {/* Month label above */}
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#94a3b8", marginBottom: 4, height: 12,
                visibility: showMonthLabel ? "visible" : "hidden",
              }}>
                {d.month}
              </span>

              {/* Day name */}
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                color: d.isToday ? "#2563eb" : d.isWeekend ? "#94a3b8" : "#64748b",
                marginBottom: 6,
              }}>
                {d.isToday ? "Today" : d.dayName}
              </span>

              {/* Day number circle */}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isSelected ? "#2563eb" : d.isToday ? "#2563eb" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 16, fontWeight: d.isToday || isSelected ? 800 : 500,
                  color: isSelected || d.isToday ? "#fff" : d.isWeekend ? "#94a3b8" : "#1e293b",
                }}>
                  {d.day}
                </span>
              </div>

              {/* Post dots */}
              <div style={{ display: "flex", gap: 3, minHeight: 8, alignItems: "center" }}>
                {filteredPosts.length > 0 ? (
                  <>
                    {filteredPosts.slice(0, 3).map((p, pi) => (
                      <span key={pi} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: statusConfig[p.status]?.dot || "#dadce0",
                        display: "inline-block",
                      }} />
                    ))}
                    {filteredPosts.length > 3 && (
                      <span style={{ fontSize: 8, color: "#70757a", fontWeight: 600 }}>+{filteredPosts.length - 3}</span>
                    )}
                  </>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, padding: "12px 20px", borderTop: "1px solid #f1f5f9", background: "#ffffff" }}>
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(key => (
          <span key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusConfig[key].dot, display: "inline-block" }} />
            {statusConfig[key].label}
          </span>
        ))}
        {selectedDate && (
          <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
            Selected: {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

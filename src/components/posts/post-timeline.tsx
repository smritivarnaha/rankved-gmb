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
}

const statusConfig = {
  PUBLISHED: { label: "Published", color: "#1e8e3e", bg: "#e6f4ea", dot: "#1e8e3e" },
  SCHEDULED:  { label: "Scheduled", color: "#f29900", bg: "#fef7e0", dot: "#f29900" },
  DRAFT:      { label: "Draft",     color: "#70757a", bg: "#f1f3f4", dot: "#70757a" },
  FAILED:     { label: "Failed",    color: "#d93025", bg: "#fce8e6", dot: "#d93025" },
};

export function PostTimeline({ onDateSelect, selectedDate }: Props) {
  const [slots, setSlots] = useState<PostSlot[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const mapped: PostSlot[] = (d.data || []).map((p: any) => ({
          date: p.scheduledAt ? p.scheduledAt.split("T")[0] : p.createdAt.split("T")[0],
          status: p.status,
        }));
        setSlots(mapped);
      })
      .catch(() => {});
  }, []);

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
    <div style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e8eaed", background: "#f8f9fa" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500,
                background: activeFilter === f.key ? "#202124" : "transparent",
                color: activeFilter === f.key ? "#fff" : "#5f6368",
                transition: "all 0.1s",
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: activeFilter === f.key ? "rgba(255,255,255,0.25)" : "#e8eaed",
                  color: activeFilter === f.key ? "#fff" : "#5f6368",
                  borderRadius: 10, padding: "1px 6px",
                }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Nav arrows */}
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => scroll("left")} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #dadce0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368" }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <button onClick={() => scroll("right")} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #dadce0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368" }}>
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
                minWidth: 52, padding: "6px 4px 8px", borderRadius: 8,
                border: "none", cursor: d.isPast ? "default" : "pointer",
                background: isSelected ? "#e8f0fe" : d.isToday ? "#f8f9fa" : "transparent",
                outline: isSelected ? "2px solid #1a73e8" : d.isToday ? "1.5px solid #dadce0" : "none",
                opacity: d.isPast ? 0.45 : 1,
                transition: "all 0.1s",
                position: "relative",
              }}
            >
              {/* Month label above */}
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#70757a", marginBottom: 2, height: 12,
                visibility: showMonthLabel ? "visible" : "hidden",
              }}>
                {d.month}
              </span>

              {/* Day name */}
              <span style={{
                fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em",
                color: d.isToday ? "#1a73e8" : d.isWeekend ? "#70757a" : "#5f6368",
                marginBottom: 4,
              }}>
                {d.isToday ? "Today" : d.dayName}
              </span>

              {/* Day number circle */}
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: isSelected ? "#1a73e8" : d.isToday ? "#1a73e8" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 15, fontWeight: d.isToday || isSelected ? 700 : 400,
                  color: isSelected || d.isToday ? "#fff" : d.isWeekend ? "#70757a" : "#202124",
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
      <div style={{ display: "flex", gap: 16, padding: "8px 16px 10px", borderTop: "1px solid #e8eaed", background: "#f8f9fa" }}>
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(key => (
          <span key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#5f6368", fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusConfig[key].dot, display: "inline-block" }} />
            {statusConfig[key].label}
          </span>
        ))}
        {selectedDate && (
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#1a73e8" }}>
            Selected: {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

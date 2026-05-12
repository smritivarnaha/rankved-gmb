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

  const postsByDate: Record<string, PostSlot[]> = {};
  slots.forEach(s => {
    if (!postsByDate[s.date]) postsByDate[s.date] = [];
    postsByDate[s.date].push(s);
  });

  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector("[data-today='true']");
      if (todayEl) todayEl.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  const counts = { PUBLISHED: 0, SCHEDULED: 0, DRAFT: 0, FAILED: 0 };
  slots.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });

  const filters = [
    { key: "ALL", label: "All posts", count: slots.length },
    { key: "PUBLISHED", label: "Published", count: counts.PUBLISHED },
    { key: "SCHEDULED", label: "Scheduled", count: counts.SCHEDULED },
    { key: "DRAFT", label: "Draft", count: counts.DRAFT },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
      {/* ─── Header & Filter Tabs ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f5f5f7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 100, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: activeFilter === f.key ? 700 : 500,
                background: activeFilter === f.key ? "#0f172a" : "transparent",
                color: activeFilter === f.key ? "#fff" : "#64748b",
                transition: "all 0.15s"
              }}
            >
              {f.label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: activeFilter === f.key ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                color: activeFilter === f.key ? "#fff" : "#64748b",
                borderRadius: 10, padding: "1px 8px", marginLeft: 4
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => scroll("left")} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #eaeaea", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll("right")} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #eaeaea", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ─── Calendar Strip ─── */}
      <div 
        ref={scrollRef} 
        className="hide-scrollbar"
        style={{ display: "flex", overflowX: "auto", padding: "24px 12px", gap: 4, scrollBehavior: "smooth" }}
      >
        <style jsx>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        {days.map((d) => {
          const allPosts = postsByDate[d.dateStr] || [];
          const filteredPosts = activeFilter === "ALL" ? allPosts : allPosts.filter(p => p.status === activeFilter);
          const isSelected = selectedDate === d.dateStr;

          return (
            <button
              key={d.dateStr}
              data-today={d.isToday}
              onClick={() => !d.isPast && onDateSelect?.(d.dateStr)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                minWidth: 64, padding: "12px 4px", borderRadius: 12,
                border: "none", cursor: d.isPast ? "default" : "pointer",
                background: d.isToday ? "#eff6ff" : "transparent",
                outline: d.isToday ? "1px solid #bfdbfe" : "none",
                opacity: d.isPast ? 0.3 : 1,
                transition: "all 0.15s",
                position: "relative"
              }}
            >
              {/* Month/Day Name */}
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ marginBottom: 4 }}>{d.month}</span>
                <span>{d.dayName}</span>
              </div>

              {/* Day Number (Special Today UI) */}
              <div style={{
                width: 44, height: 56, borderRadius: 10,
                background: d.isToday ? "#2563eb" : isSelected ? "#f1f5f9" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12, border: isSelected && !d.isToday ? "1px solid #cbd5e1" : "none",
                boxShadow: d.isToday ? "0 4px 12px rgba(37,99,235,0.2)" : "none"
              }}>
                {d.isToday && (
                  <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, color: "#2563eb", letterSpacing: "0.05em" }}>TODAY</div>
                )}
                <span style={{
                  fontSize: 20, fontWeight: d.isToday ? 800 : 500,
                  color: d.isToday ? "#fff" : "#1e293b",
                }}>
                  {d.day}
                </span>
              </div>

              {/* Post Dots */}
              <div style={{ display: "flex", gap: 4, minHeight: 8 }}>
                {Array.from(new Set(filteredPosts.map(p => p.status))).map((status, si) => (
                  <span key={si} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: statusConfig[status as keyof typeof statusConfig]?.dot || "#dadce0"
                  }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Legend ─── */}
      <div style={{ display: "flex", gap: 24, padding: "16px 24px", borderTop: "1px solid #f5f5f7", background: "#ffffff" }}>
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(key => (
          <span key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusConfig[key].dot }} />
            {statusConfig[key].label}
          </span>
        ))}
      </div>
    </div>
  );
}

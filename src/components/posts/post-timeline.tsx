"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export function PostTimeline({ onDateSelect, selectedDate }: Props) {
  const [slots, setSlots] = useState<PostSlot[]>([]);
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

  // Generate 45 days: 7 past + today + 37 future
  const days: { date: Date; dateStr: string; day: number; dayName: string; month: string; isToday: boolean; isPast: boolean }[] = [];
  for (let i = -7; i <= 37; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: d,
      dateStr,
      day: d.getDate(),
      dayName: dayNames[d.getDay()],
      month: monthNames[d.getMonth()],
      isToday: i === 0,
      isPast: i < 0,
    });
  }

  // Group posts by date
  const postsByDate: Record<string, PostSlot[]> = {};
  slots.forEach(s => {
    if (!postsByDate[s.date]) postsByDate[s.date] = [];
    postsByDate[s.date].push(s);
  });

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector("[data-today]");
      if (todayEl) {
        todayEl.scrollIntoView({ inline: "center", block: "nearest" });
      }
    }
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-[var(--success)]";
      case "SCHEDULED": return "bg-[var(--warning)]";
      case "DRAFT": return "bg-[var(--error)]";
      case "FAILED": return "bg-[var(--text-tertiary)]";
      default: return "bg-[var(--text-tertiary)]";
    }
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">Posting timeline</span>
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block"></span>Published</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] inline-block"></span>Scheduled</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--error)] inline-block"></span>Draft</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll("left")} className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors">
            <ChevronLeft className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <button onClick={() => scroll("right")} className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors">
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto no-scrollbar px-2 py-3">
        {days.map((d, i) => {
          const datePosts = postsByDate[d.dateStr] || [];
          const isSelected = selectedDate === d.dateStr;
          const showMonth = i === 0 || d.day === 1;

          return (
            <button
              key={d.dateStr}
              data-today={d.isToday ? "true" : undefined}
              onClick={() => onDateSelect?.(d.dateStr)}
              className={`flex flex-col items-center px-1.5 py-1.5 rounded-lg min-w-[44px] transition-colors shrink-0 ${
                isSelected
                  ? "bg-[var(--accent-light)] ring-1 ring-[var(--accent)]"
                  : d.isToday
                  ? "bg-[var(--bg-secondary)]"
                  : d.isPast
                  ? "opacity-40"
                  : "hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {/* Day name */}
              <span className={`text-[9px] font-medium uppercase tracking-wider ${
                d.isToday ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
              }`}>
                {d.isToday ? "Today" : d.dayName}
              </span>

              {/* Date number */}
              <span className={`text-[16px] font-semibold leading-tight mt-0.5 ${
                isSelected ? "text-[var(--accent)]" :
                d.isToday ? "text-[var(--accent)]" :
                "text-[var(--text-primary)]"
              }`}>
                {d.day}
              </span>

              {/* Month (only on 1st or start) */}
              <span className={`text-[8px] uppercase tracking-wider ${
                showMonth ? "text-[var(--text-tertiary)]" : "text-transparent"
              }`}>
                {d.month}
              </span>

              {/* Status dots */}
              <div className="flex items-center gap-[3px] mt-1 min-h-[6px]">
                {datePosts.length > 0 ? (
                  datePosts.slice(0, 3).map((p, pi) => (
                    <span key={pi} className={`w-[5px] h-[5px] rounded-full ${getDotColor(p.status)}`}></span>
                  ))
                ) : (
                  <span className="w-[5px] h-[5px] rounded-full bg-transparent"></span>
                )}
                {datePosts.length > 3 && (
                  <span className="text-[7px] text-[var(--text-tertiary)] font-medium">+{datePosts.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

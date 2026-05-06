"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const d = await res.json();
          const scheduled = (d.data || []).filter((p: any) => p.scheduledAt);
          setEvents(scheduled.map((p: any) => {
            // Convert UTC ISO to local date to ensure correct calendar cell
            const localDate = new Date(p.scheduledAt);
            return {
              id: p.id,
              day: localDate.getDate(),
              month: localDate.getMonth(),
              year: localDate.getFullYear(),
              title: p.summary || "Post",
              status: p.status?.toLowerCase() || "scheduled",
              client: p.clientName || "",
            };
          }));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = now.getDate();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  const monthEvents = events.filter(e => e.month === month && e.year === year);

  const statusColor: Record<string, { bg: string; color: string }> = {
    published: { bg: "#ecfdf5", color: "#059669" },
    scheduled: { bg: "#eef2ff", color: "#4f46e5" },
    draft: { bg: "#f1f5f9", color: "#64748b" },
    failed: { bg: "#fef2f2", color: "#dc2626" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em", margin: "0 0 4px 0" }}>Calendar</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Scheduled post timeline across all profiles.</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border-light)", borderRadius: 14, overflow: "hidden" }}>
        {/* Month nav */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)" }}>
          <button onClick={prev} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, display: "flex" }}>
            <ChevronLeft size={18} color="var(--text-secondary)" />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{MONTHS[month]} {year}</span>
          <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, display: "flex" }}>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: "10px 4px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}>
              {d}
            </div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} style={{ minHeight: 88, borderBottom: "1px solid var(--border-light)", borderRight: "1px solid var(--border-light)", background: "var(--bg-secondary)", opacity: 0.4 }} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvts = monthEvents.filter(e => e.day === day);
            const isToday = day === today && month === now.getMonth() && year === now.getFullYear();
            const col = (firstDay + i) % 7;
            return (
              <div key={day} style={{
                minHeight: 88, padding: "6px 8px",
                borderBottom: "1px solid var(--border-light)",
                borderRight: col < 6 ? "1px solid var(--border-light)" : "none",
                background: isToday ? "rgba(79,70,229,0.02)" : "#fff",
              }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 24, height: 24, borderRadius: "50%", fontSize: 12, fontWeight: 600,
                  background: isToday ? "var(--accent)" : "transparent",
                  color: isToday ? "#fff" : "var(--text-secondary)",
                }}>
                  {day}
                </span>
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEvts.map((ev, idx) => {
                    const sc = statusColor[ev.status] || statusColor.scheduled;
                    return (
                      <div key={idx} title={ev.title} style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 5px", borderRadius: 4,
                        background: sc.bg, color: sc.color,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}>
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Object.entries(statusColor).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c.bg, border: `1px solid ${c.color}33` }} />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "capitalize", fontWeight: 500 }}>{s}</span>
          </div>
        ))}
        {loading && <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Loading events…</span>}
        {!loading && monthEvents.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No scheduled posts this month.</span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const events = [
  { day: 2, title: "Spring sale post", status: "published", client: "Sunrise Dental" },
  { day: 5, title: "Hiring announcement", status: "scheduled", client: "TechWave" },
  { day: 8, title: "New menu drop", status: "draft", client: "Green Eats" },
  { day: 10, title: "Client testimonial", status: "scheduled", client: "Sunrise Dental" },
  { day: 15, title: "Workshop event", status: "scheduled", client: "GrowthHub" },
  { day: 18, title: "Weekend special", status: "scheduled", client: "Green Eats" },
  { day: 22, title: "Team spotlight", status: "scheduled", client: "TechWave" },
  { day: 25, title: "Monthly recap", status: "scheduled", client: "Sunrise Dental" },
];

export default function CalendarPage() {
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(2026);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Calendar</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Scheduled post timeline.</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <button onClick={prev} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors">
            <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">{months[month]} {year}</span>
          <button onClick={next} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors">
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {days.map(d => (
            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[90px] border-b border-r border-[var(--border-light)] bg-[var(--bg-secondary)]/30"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = events.filter(e => e.day === day);
            const isToday = day === 4 && month === 3 && year === 2026;
            return (
              <div key={day} className={`min-h-[90px] border-b border-r border-[var(--border-light)] p-1.5 hover:bg-[var(--bg-secondary)]/50 transition-colors ${isToday ? 'bg-[var(--accent-light)]/30' : ''}`}>
                <span className={`text-[11px] font-medium inline-flex items-center justify-center w-5 h-5 rounded-full ${isToday ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}`}>{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.map((ev, idx) => (
                    <div key={idx} className={`text-[10px] px-1 py-px rounded truncate cursor-pointer ${
                      ev.status === "published" ? "bg-[var(--success-bg)] text-[var(--success)]" :
                      ev.status === "scheduled" ? "bg-[var(--accent-light)] text-[var(--accent)]" :
                      "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                    }`} title={`${ev.title} (${ev.client})`}>{ev.title}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

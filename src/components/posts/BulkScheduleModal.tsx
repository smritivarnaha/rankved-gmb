"use client";

import { useState } from "react";
import { X, Calendar, Clock, RotateCw, AlertCircle } from "lucide-react";

interface BulkScheduleModalProps {
  postIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkScheduleModal({ postIds, isOpen, onClose, onSuccess }: BulkScheduleModalProps) {
  const [startDate, setStartDate] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("10:00");
  const [frequency, setFrequency] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!startDate) {
      setError("Please select a start date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert local date + time to a UTC ISO string in the browser (correct timezone)
      const localDt = new Date(`${startDate}T${timeOfDay}:00`);
      const res = await fetch("/api/posts/bulk-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds,
          startDateISO: localDt.toISOString(), // UTC ISO, e.g. "2026-05-07T04:30:00.000Z"
          frequencyInterval: frequency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: 440, borderRadius: 12, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Bulk Drip Schedule</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
        </div>

        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 20 }}>
          Schedule {postIds.length} posts to be published sequentially based on the interval below.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Start Date</label>
            <div style={{ position: "relative" }}>
              <Calendar size={16} color="#9ca3af" style={{ position: "absolute", left: 10, top: 10 }} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Time of Day</label>
            <div style={{ position: "relative" }}>
              <Clock size={16} color="#9ca3af" style={{ position: "absolute", left: 10, top: 10 }} />
              <input 
                type="time" 
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, outline: "none" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Frequency</label>
            <div style={{ position: "relative" }}>
              <RotateCw size={16} color="#9ca3af" style={{ position: "absolute", left: 10, top: 10 }} />
              <select 
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, outline: "none", appearance: "none", background: "#fff" }}
              >
                <option value={1}>Daily</option>
                <option value={2}>Alternate Days (Every 2 days)</option>
                <option value={3}>Every 3 Days</option>
                <option value={4}>Every 4 Days</option>
                <option value={7}>Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "#fef2f2", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start", color: "#dc2626", fontSize: 13 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#fff", border: "1px solid #d1d5db", cursor: "pointer" }}>
            Cancel
          </button>
          <button 
            onClick={handleSchedule} 
            disabled={loading || !startDate}
            style={{ padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#2563eb", color: "#fff", border: "none", cursor: loading || !startDate ? "not-allowed" : "pointer", opacity: loading || !startDate ? 0.7 : 1 }}
          >
            {loading ? "Scheduling..." : "Schedule Posts"}
          </button>
        </div>
      </div>
    </div>
  );
}

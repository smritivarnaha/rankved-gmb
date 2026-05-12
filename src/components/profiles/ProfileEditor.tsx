"use client";

import { useState } from "react";
import {
  Loader2, Save, MapPin, Phone, Globe, Clock,
  Info, CheckCircle2, Building2, AlertCircle, Edit3
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {
  Monday:    { open: "09:00", close: "18:00", closed: false },
  Tuesday:   { open: "09:00", close: "18:00", closed: false },
  Wednesday: { open: "09:00", close: "18:00", closed: false },
  Thursday:  { open: "09:00", close: "18:00", closed: false },
  Friday:    { open: "09:00", close: "18:00", closed: false },
  Saturday:  { open: "10:00", close: "16:00", closed: false },
  Sunday:    { open: "10:00", close: "16:00", closed: true  },
};

type Tab = "info" | "contact" | "hours";

/* ─── Field component ────────────────────────────── */
function Field({
  label, icon: Icon, children
}: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{
        fontSize: 12, fontWeight: 600, color: "#64748B",
        display: "flex", alignItems: "center", gap: 6
      }}>
        {Icon && <Icon size={13} />} {label}
      </label>
      {children}
    </div>
  );
}

/* ─── Input style ────────────────────────────────── */
const inputStyle = {
  width: "100%", height: 44, padding: "0 14px",
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 10, fontSize: 14, fontFamily: "Inter, sans-serif",
  color: "#111827", outline: "none", boxSizing: "border-box" as const,
  transition: "border-color 0.15s"
};

const textareaStyle = {
  ...inputStyle, height: "auto", padding: "12px 14px",
  resize: "vertical" as const, lineHeight: "1.6"
};

/* ─── Main component ─────────────────────────────── */
export function ProfileEditor({ profile, onUpdate }: { profile: any; onUpdate?: () => void }) {
  const [activeTab, setTab]   = useState<Tab>("info");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [info, setInfo] = useState({
    name:        profile.name        || "",
    description: profile.description || "",
    address:     profile.address     || "",
  });

  const [contact, setContact] = useState({
    phone:   profile.phone   || "",
    website: profile.website || "",
  });

  const [hours, setHours] = useState<typeof defaultHours>(
    profile.hours || defaultHours
  );

  const handleSave = async () => {
    setLoading(true); setSaved(false); setError(null);
    try {
      const payload = { ...info, ...contact, hours };
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        if (onUpdate) onUpdate();
        setTimeout(() => setSaved(false), 4000);
      } else {
        const d = await res.json();
        setError(d?.error || "Failed to save. Please try again.");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "info",    label: "Business Info",  icon: Building2 },
    { key: "contact", label: "Contact",        icon: Phone     },
    { key: "hours",   label: "Hours",          icon: Clock     },
  ];

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", maxWidth: 700 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Edit3 size={16} color="#94A3B8" />
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, fontWeight: 500 }}>Edit Profile</p>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>
            {profile.name}
          </h1>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            height: 40, padding: "0 20px",
            background: saved ? "#10B981" : "#2563EB",
            color: "#fff", borderRadius: 10, border: "none",
            fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            transition: "all 0.2s", opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? <Loader2 size={15} className="anim-spin" /> :
           saved   ? <CheckCircle2 size={15} /> :
                     <Save size={15} />}
          {loading ? "Saving…" : saved ? "Saved!" : "Save to Google"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", marginBottom: 20,
          background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: 10, fontSize: 13, color: "#991B1B"
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tab strip — Google style */}
      <div style={{
        display: "flex", borderBottom: "1px solid #E2E8F0",
        marginBottom: 28, overflowX: "auto"
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px", border: "none", cursor: "pointer",
              background: "transparent", fontSize: 14, fontWeight: 500,
              color: activeTab === key ? "#2563EB" : "#64748B",
              borderBottom: activeTab === key ? "2px solid #2563EB" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s", whiteSpace: "nowrap"
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Business Info ── */}
      {activeTab === "info" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field label="Business Name" icon={Building2}>
            <input
              style={inputStyle}
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              placeholder="Your business name"
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
          </Field>

          <Field label="Business Description" icon={Info}>
            <textarea
              style={{ ...textareaStyle, minHeight: 120 }}
              value={info.description}
              onChange={(e) => setInfo({ ...info, description: e.target.value })}
              placeholder="Describe your business — this appears on your Google profile…"
              rows={5}
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
              {info.description.length}/750 characters
            </p>
          </Field>

          <Field label="Business Address" icon={MapPin}>
            <input
              style={inputStyle}
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
              placeholder="Full address"
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
          </Field>

          <Notice text="Changes to your business name and address may require Google verification before going live." />
        </div>
      )}

      {/* ── TAB: Contact ── */}
      {activeTab === "contact" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field label="Phone Number" icon={Phone}>
            <input
              style={inputStyle}
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+91 98765 43210"
              type="tel"
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
          </Field>

          <Field label="Website URL" icon={Globe}>
            <input
              style={inputStyle}
              value={contact.website}
              onChange={(e) => setContact({ ...contact, website: e.target.value })}
              placeholder="https://yourwebsite.com"
              type="url"
              onFocus={(e) => e.target.style.borderColor = "#2563EB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            />
          </Field>

          <Notice text="Updates to phone and website are usually reflected on Google Maps within a few hours." />
        </div>
      )}

      {/* ── TAB: Hours ── */}
      {activeTab === "hours" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
            {DAYS.map((day, i) => {
              const h = hours[day];
              return (
                <div
                  key={day}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 20px",
                    borderBottom: i < DAYS.length - 1 ? "1px solid #F1F5F9" : "none",
                    background: h.closed ? "#FAFAFA" : "#fff"
                  }}
                >
                  {/* Day name */}
                  <span style={{ width: 100, fontSize: 13, fontWeight: 600, color: h.closed ? "#94A3B8" : "#374151", flexShrink: 0 }}>
                    {day}
                  </span>

                  {/* Closed toggle */}
                  <button
                    onClick={() => setHours({ ...hours, [day]: { ...h, closed: !h.closed } })}
                    style={{
                      width: 36, height: 20, borderRadius: 99, border: "none",
                      background: h.closed ? "#E2E8F0" : "#2563EB",
                      cursor: "pointer", position: "relative", flexShrink: 0,
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%", background: "#fff",
                      position: "absolute", top: 3,
                      left: h.closed ? 3 : 19,
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                    }} />
                  </button>

                  {h.closed ? (
                    <span style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>Closed</span>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => setHours({ ...hours, [day]: { ...h, open: e.target.value } })}
                        style={{ ...inputStyle, width: 120, height: 36, fontSize: 13 }}
                      />
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>to</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => setHours({ ...hours, [day]: { ...h, close: e.target.value } })}
                        style={{ ...inputStyle, width: 120, height: 36, fontSize: 13 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Notice text="Business hours are shown on Google Search and Maps. Update these when your schedule changes." />
        </div>
      )}
    </div>
  );
}

/* ─── Notice banner ──────────────────────────────── */
function Notice({ text }: { text: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px",
      background: "#FFFBEB", border: "1px solid #FDE68A",
      borderRadius: 10, marginTop: 8
    }}>
      <Clock size={14} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

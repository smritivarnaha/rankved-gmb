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

type Tab = "info" | "contact" | "hours" | "sitemap";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logoUrl || null);

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
  
  const [sitemapUrl, setSitemapUrl] = useState(profile.sitemapUrl || "");
  const [sitemapUrls, setSitemapUrls] = useState<string[]>(profile.sitemapUrls || []);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapFilter, setSitemapFilter] = useState("");

  const handleParseSitemap = async () => {
    if (!sitemapUrl) return alert("Please enter a sitemap URL first.");
    setSitemapLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profile.id}/sitemap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sitemapUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setSitemapUrls(data.urls || []);
        alert(`Successfully fetched and parsed ${data.count} URLs!`);
        if (onUpdate) onUpdate();
      } else {
        setError(data.error || "Failed to parse sitemap.");
      }
    } catch {
      setError("Failed to reach the sitemap parsing service.");
    } finally {
      setSitemapLoading(false);
    }
  };

  const handleAutoFetchSitemap = async () => {
    setSitemapLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profile.id}/sitemap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setSitemapUrls(data.urls || []);
        if (data.website) {
          profile.website = data.website; // Update the profile object locally
        }
        alert(`Successfully fetched website and parsed ${data.count} sitemap URLs from it!`);
        if (onUpdate) onUpdate();
      } else {
        setError(data.error || "Failed to auto-discover website sitemap.");
      }
    } catch {
      setError("Failed to reach the sitemap auto-fetch service.");
    } finally {
      setSitemapLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("id", profile.id);
    formData.append("logo", file);

    try {
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const reader = new FileReader();
        reader.onload = () => {
          setLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        if (onUpdate) onUpdate();
      } else {
        alert("Failed to upload logo.");
      }
    } catch {
      alert("Error uploading logo.");
    }
  };

  const handleSave = async () => {
    setLoading(true); setSaved(false); setError(null);
    try {
      const payload = { ...info, ...contact, hours };
      const res = await fetch(`/api/profiles/${profile.id}/gbp`, {
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
    { key: "sitemap", label: "Sitemap Links",  icon: Globe     },
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
          {/* Custom Avatar Upload card */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #cbd5e1" }}>
            <div style={{ width: 60, height: 60, borderRadius: 10, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1", overflow: "hidden", fontSize: 22, fontWeight: 700, color: "#64748b" }}>
              {logoUrl ? (
                <img src={logoUrl.startsWith("gbp:") ? logoUrl.replace("gbp:", "") : logoUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: 0 }}>Location Logo / Avatar</p>
              <label style={{ display: "inline-flex", alignItems: "center", padding: "6px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", width: "fit-content", transition: "all 0.15s" }}>
                Upload Logo Image
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
              </label>
            </div>
          </div>

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
            <div style={{ display: "flex", gap: 10 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={contact.website}
                onChange={(e) => setContact({ ...contact, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                type="url"
                onFocus={(e) => e.target.style.borderColor = "#2563EB"}
                onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
              />
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch(`/api/profiles/${profile.id}/gbp`);
                    if (res.ok) {
                      const json = await res.json();
                      const liveWebsite = json.data?.websiteUri || "";
                      if (liveWebsite) {
                        setContact(prev => ({ ...prev, website: liveWebsite }));
                        alert(`Successfully fetched website from Google: ${liveWebsite}`);
                      } else {
                        alert("No website is configured on this profile inside Google Business Profile.");
                      }
                    } else {
                      alert("Failed to fetch profile details from Google API.");
                    }
                  } catch {
                    alert("Error reaching Google Business Profile API.");
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  height: 44, padding: "0 16px",
                  background: "#eff6ff", color: "#2563eb",
                  border: "1.5px solid #bfdbfe", borderRadius: 10,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Fetch from Google
              </button>
            </div>
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

      {/* ── TAB: Sitemap ── */}
      {activeTab === "sitemap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Field label="Sitemap URL" icon={Globe}>
                <input
                  style={inputStyle}
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/sitemap.xml"
                  type="url"
                  onFocus={(e) => e.target.style.borderColor = "#2563EB"}
                  onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
                />
              </Field>
            </div>
            <button
              onClick={handleParseSitemap}
              disabled={sitemapLoading}
              style={{
                height: 44, padding: "0 20px",
                background: "#0f172a", color: "#fff",
                borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600,
                cursor: sitemapLoading ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s", opacity: sitemapLoading ? 0.7 : 1
              }}
            >
              Custom URL Parse
            </button>
            <button
              onClick={handleAutoFetchSitemap}
              disabled={sitemapLoading}
              style={{
                height: 44, padding: "0 20px",
                background: "#2563eb", color: "#fff",
                borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600,
                cursor: sitemapLoading ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s", opacity: sitemapLoading ? 0.7 : 1
              }}
            >
              {sitemapLoading ? <Loader2 size={14} className="anim-spin" /> : null}
              Fetch Now (Auto)
            </button>
          </div>

          <Notice text="You can submit your website sitemap (e.g. sitemap.xml) here. We will fetch and parse all individual page URLs from it so you can easily pick them when creating Call-To-Action buttons on posts." />

          {sitemapUrls.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                  Parsed URLs ({sitemapUrls.length})
                </span>
                <input
                  type="text"
                  placeholder="Search URLs..."
                  value={sitemapFilter}
                  onChange={e => setSitemapFilter(e.target.value)}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                    fontSize: 12, outline: "none", width: 200, background: "#fff"
                  }}
                />
              </div>
              <div style={{ maxHeight: 250, overflowY: "auto", padding: "8px 0" }}>
                {sitemapUrls
                  .filter(u => {
                    if (!sitemapFilter) return true;
                    const val = sitemapFilter.toLowerCase();
                    if (val.startsWith("http://") || val.startsWith("https://")) {
                      return u.toLowerCase().includes(val);
                    }
                    try {
                      const parsed = new URL(u);
                      return (parsed.pathname + parsed.search).toLowerCase().includes(val);
                    } catch {
                      return u.toLowerCase().includes(val);
                    }
                  })
                  .map((url, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 16px", fontSize: 13, color: "#475569",
                        borderBottom: i < sitemapUrls.length - 1 ? "1px solid #f1f5f9" : "none",
                        wordBreak: "break-all"
                      }}
                    >
                      {url}
                    </div>
                  ))}
                {sitemapUrls.filter(u => u.toLowerCase().includes(sitemapFilter.toLowerCase())).length === 0 && (
                  <div style={{ padding: 24, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                    No matching URLs found.
                  </div>
                )}
              </div>
            </div>
          )}
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

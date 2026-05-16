"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { 
  Loader2, ArrowLeft, Save, Building2, Phone, Globe, FileText, 
  CheckCircle2, Upload, Clock, Map, Tag, Info, AlertCircle, 
  Plus, Trash2, MapPin, ExternalLink, Calendar, Search, X
} from "lucide-react";
import Link from "next/link";
import { GbpIcon } from "@/components/gbp-icon";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

// Proxy Google lh3 URLs through our authenticated media proxy
function proxyLogoUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.includes("maps.googleapis.com") || url.includes("places.googleapis.com")) return url;
  return `/api/proxy/media?url=${encodeURIComponent(url)}`;
}

// Google GBP field rules
const GBP_RULES = {
  title: { max: 750, label: "Business Name" },
  description: { max: 750, label: "Description" },
  phone: { pattern: /^[+\d][\d\s().\-+]{6,19}$/, label: "Phone" },
  website: { pattern: /^https?:\/\/.+/, label: "Website" },
};

function phoneFilter(val: string) {
  // Only allow digits, +, -, (, ), spaces — strip everything else
  return val.replace(/[^\d+\-().\s]/g, "");
}

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: profileData, isLoading, mutate } = useSWR(id ? `/api/profiles/${id}/gbp` : null, fetcher);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    phone: "",
    website: "",
    logoUrl: "",
    categories: { primaryCategory: { displayName: "", name: "" }, additionalCategories: [] },
    regularHours: { periods: [] },
    storefrontAddress: {},
    serviceArea: { businessRegionCodes: [] },
    labels: [],
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [catSearchPrimary, setCatSearchPrimary] = useState("");
  const [catSearchAdditional, setCatSearchAdditional] = useState("");
  const [catResultsPrimary, setCatResultsPrimary] = useState<any[]>([]);
  const [catResultsAdditional, setCatResultsAdditional] = useState<any[]>([]);
  const [searchingCatsPrimary, setSearchingCatsPrimary] = useState(false);
  const [searchingCatsAdditional, setSearchingCatsAdditional] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (profileData?.data) {
      const gbp = profileData.data;
      if (gbp.error) { setApiError(gbp.error); return; }
      setApiError(null);
      setFormData({
        title: gbp.title || "",
        description: gbp.profile?.description || "",
        phone: gbp.phoneNumbers?.primaryPhone || "",
        website: gbp.websiteUri || "",
        logoUrl: gbp.logoUrl || "",
        categories: gbp.categories || { primaryCategory: { displayName: "", name: "" }, additionalCategories: [] },
        regularHours: gbp.regularHours || { periods: [] },
        storefrontAddress: gbp.storefrontAddress || {},
        serviceArea: gbp.serviceArea || { places: { placeInfos: [] } },
        labels: gbp.labels || [],
        metadata: gbp.metadata || {},
        openInfo: gbp.openInfo || {},
        specialHours: gbp.specialHours || {},
        morePhones: gbp.phoneNumbers?.additionalPhones || [],
      });
    }
    if (profileData?.error) setApiError(profileData.error);
  }, [profileData]);

  // Category search — primary
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (catSearchPrimary.length > 2) {
        setSearchingCatsPrimary(true);
        try {
          const res = await fetch(`/api/categories?searchTerm=${encodeURIComponent(catSearchPrimary)}`);
          const d = await res.json();
          setCatResultsPrimary(d.data || []);
        } catch {}
        setSearchingCatsPrimary(false);
      } else setCatResultsPrimary([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [catSearchPrimary]);

  // Category search — additional
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (catSearchAdditional.length > 2) {
        setSearchingCatsAdditional(true);
        try {
          const res = await fetch(`/api/categories?searchTerm=${encodeURIComponent(catSearchAdditional)}`);
          const d = await res.json();
          setCatResultsAdditional(d.data || []);
        } catch {}
        setSearchingCatsAdditional(false);
      } else setCatResultsAdditional([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [catSearchAdditional]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // 1. Sync GBP Text Details
      const res = await fetch(`/api/profiles/${id}/gbp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to update profile details.");

      // 2. Sync Logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("id", id);
        logoFormData.append("logo", logoFile);

        const logoRes = await fetch("/api/profiles", { method: "PATCH", body: logoFormData });
        if (!logoRes.ok) {
          const lD = await logoRes.json();
          throw new Error(lD.error || "Failed to update profile logo.");
        }
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      mutate();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
        <Loader2 className="anim-spin" style={{ width: 28, height: 28, color: "var(--brand)" }} />
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>Loading profile data from Google...</p>
      </div>
    );
  }

  const sections = [
    { id: "about", label: "About", icon: Info },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "location", label: "Location", icon: MapPin },
    { id: "hours", label: "Hours", icon: Clock },
    { id: "more", label: "More", icon: Tag },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", margin: "-32px -40px", padding: "40px" }} className="edit-page-outer">
      <style>{`
        @media (max-width: 768px) {
          .edit-page-outer { margin: -16px -16px !important; padding: 16px !important; }
          .edit-page-header { flex-wrap: wrap !important; gap: 10px !important; padding: 12px 0 !important; }
          .edit-page-header-title h1 { font-size: 15px !important; }
          .edit-page-header-actions { width: 100% !important; }
          .edit-page-header-actions a, .edit-page-header-actions button { flex: 1; justify-content: center !important; }
          .edit-profile-layout { flex-direction: column !important; gap: 16px !important; }
          .edit-profile-sidenav { width: 100% !important; position: relative !important; top: auto !important; }
          .edit-profile-sidenav > div { flex-direction: row !important; overflow-x: auto !important; padding-bottom: 4px !important; scrollbar-width: none; }
          .edit-profile-sidenav > div::-webkit-scrollbar { display: none; }
          .edit-profile-sidenav button { white-space: nowrap !important; flex-shrink: 0 !important; padding: 7px 12px !important; font-size: 11px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={
        { position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)", borderBottom: "1px solid #eaeaea",
        padding: "16px 0", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }
      } className="edit-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="edit-page-header-title">
          <Link href="/profiles" style={{ padding: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#4b5563", flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111" }}>{formData.title || "Business Profile"}</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Google Business Profile Editor</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }} className="edit-page-header-actions">
          {formData.metadata?.mapsUri && (
            <a href={formData.metadata.mapsUri} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <ExternalLink size={14} /> View on Maps
            </a>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn btn-primary" 
            style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: 8, borderRadius: 8 }}
          >
            {saving ? <Loader2 className="anim-spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: message.type === "success" ? "#15803d" : "#dc2626",
        }}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {apiError && (
        <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>Could not load live data from Google: {apiError}. You can still edit using the form below.</span>
          <button onClick={() => mutate()} style={{ marginLeft: "auto", background: "none", border: "1px solid #fed7aa", borderRadius: 6, padding: "2px 10px", cursor: "pointer", color: "#c2410c", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>Retry</button>
          <button onClick={() => setApiError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}><X size={13} /></button>
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }} className="edit-profile-layout">
        {/* Left Sidebar Nav */}
        <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 80, height: "fit-content" }} className="edit-profile-sidenav">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderRadius: 8, border: "none", background: activeTab === s.id ? "#eff6ff" : "transparent",
                  color: activeTab === s.id ? "#2563eb" : "#666", cursor: "pointer",
                  fontSize: 14, fontWeight: activeTab === s.id ? 600 : 500, textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <s.icon size={18} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 100 }}>
          
          {/* About Section */}
          {activeTab === "about" && (
            <div className="card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Business Information</h2>
                <Tag size={18} color="#9ca3af" />
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Logo */}
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : formData.logoUrl ? (
                      <img src={proxyLogoUrl(formData.logoUrl)} alt="Logo" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <GbpIcon size={40} />
                    )}
                  </div>
                  <div>
                    <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                      <Upload size={14} /> Change Logo
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                    </label>
                    <p style={{ fontSize: 11, color: "#666", marginTop: 8 }}>This logo appears on Google Maps and Search.</p>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Business Name</label>
                    <span style={{ fontSize: 11, color: formData.title?.length > 700 ? "#ef4444" : "#9ca3af" }}>{formData.title?.length || 0}/750</span>
                  </div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => e.target.value.length <= 750 && setFormData({...formData, title: e.target.value})}
                    className="input w-full"
                    placeholder="e.g. Acme Coffee"
                    maxLength={750}
                  />
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Use your real-world business name. Don't add keywords or locations.</p>
                </div>

                {/* Primary Category */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, display: "block" }}>Primary Category</label>
                  <div style={{ position: "relative" }}>
                    {formData.categories.primaryCategory?.displayName && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-btn)", background: "var(--bg-subtle)", marginBottom: 8 }}>
                        <Tag size={14} color="var(--brand)" />
                        <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{formData.categories.primaryCategory.displayName}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>current</span>
                      </div>
                    )}
                    <div style={{ position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        placeholder="Search to change primary category..."
                        value={catSearchPrimary}
                        onChange={e => setCatSearchPrimary(e.target.value)}
                        className="ds-input"
                        style={{ paddingLeft: 32, height: 38 }}
                      />
                      {searchingCatsPrimary && <Loader2 size={13} className="anim-spin" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />}
                    </div>
                    {catResultsPrimary.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30, background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-md)", maxHeight: 220, overflowY: "auto" }}>
                        {catResultsPrimary.map(c => (
                          <button key={c.name} onClick={() => { setFormData({ ...formData, categories: { ...formData.categories, primaryCategory: c } }); setCatSearchPrimary(""); setCatResultsPrimary([]); }}
                            style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >{c.displayName}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Categories */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, display: "block" }}>Additional Categories</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {formData.categories.additionalCategories?.map((c: any, idx: number) => (
                      <div key={idx} style={{ background: "var(--brand-subtle)", color: "var(--brand)", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--brand-muted)" }}>
                        {c.displayName}
                        <X size={11} onClick={() => { const n = formData.categories.additionalCategories.filter((_: any, i: number) => i !== idx); setFormData({ ...formData, categories: { ...formData.categories, additionalCategories: n } }); }} style={{ cursor: "pointer" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "relative" }}>
                    <Plus size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Search to add category..."
                      value={catSearchAdditional}
                      onChange={e => setCatSearchAdditional(e.target.value)}
                      className="ds-input"
                      style={{ paddingLeft: 32, height: 38 }}
                    />
                    {searchingCatsAdditional && <Loader2 size={13} className="anim-spin" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />}
                    {catResultsAdditional.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30, background: "#fff", border: "1px solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-md)", maxHeight: 220, overflowY: "auto" }}>
                        {catResultsAdditional.map(c => (
                          <button key={c.name} onClick={() => { const existing = formData.categories.additionalCategories || []; if (!existing.find((e: any) => e.name === c.name)) { setFormData({ ...formData, categories: { ...formData.categories, additionalCategories: [...existing, c] } }); } setCatSearchAdditional(""); setCatResultsAdditional([]); }}
                            style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >{c.displayName}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Business Description</label>
                    <span style={{ fontSize: 11, color: (formData.description?.length || 0) > 700 ? "#ef4444" : "#9ca3af" }}>{formData.description?.length || 0}/750</span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={e => e.target.value.length <= 750 && setFormData({...formData, description: e.target.value})}
                    className="input w-full"
                    rows={5}
                    placeholder="Describe your business. Avoid promotional content, URLs, or HTML tags."
                    style={{ resize: "vertical" }}
                    maxLength={750}
                  />
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Max 750 characters. Don't include URLs, phone numbers, or HTML.</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Section */}
          {activeTab === "contact" && (
            <div className="card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Contact Details</h2>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Primary Phone</label>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, marginTop: 0 }}>Include country code. Digits, +, -, (, ) and spaces only.</p>
                  <div style={{ position: "relative" }}>
                    <Phone size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: phoneFilter(e.target.value)})}
                      className="input w-full"
                      style={{ paddingLeft: 36 }}
                      placeholder="+91 98765 43210"
                      pattern="[+\d][\d\s().\-+]{6,19}"
                    />
                  </div>
                  {formData.phone && !/^[+\d][\d\s().\-+]{6,19}$/.test(formData.phone) && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Enter a valid phone number with country code (e.g. +91 98765 43210)</p>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Website</label>
                  <div style={{ position: "relative" }}>
                    <Globe size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                      className="input w-full"
                      style={{ paddingLeft: 36 }}
                      placeholder="https://example.com"
                    />
                  </div>
                  {formData.website && !/^https?:\/\/.+/.test(formData.website) && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Must start with http:// or https://</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hours Section */}
          {activeTab === "hours" && (
            <div className="card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Opening Hours</h2>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {DAYS.map(day => {
                    const period = formData.regularHours.periods?.find((p: any) => p.openDay === day);
                    const isOpen = !!period;
                    
                    return (
                      <div key={day} style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ width: 100, fontSize: 13, fontWeight: 600, color: "#374151" }}>{day.charAt(0) + day.slice(1).toLowerCase()}</div>
                        
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                          {isOpen ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input 
                                  type="time" 
                                  value={`${String(period.openTime.hours).padStart(2, '0')}:${String(period.openTime.minutes).padStart(2, '0')}`}
                                  onChange={e => {
                                    const [h, m] = e.target.value.split(':').map(Number);
                                    const newPeriods = formData.regularHours.periods.map((p: any) => 
                                      p.openDay === day ? { ...p, openTime: { hours: h, minutes: m } } : p
                                    );
                                    setFormData({ ...formData, regularHours: { periods: newPeriods } });
                                  }}
                                  style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13 }}
                                />
                                <span style={{ color: "#666" }}>to</span>
                                <input 
                                  type="time" 
                                  value={`${String(period.closeTime.hours).padStart(2, '0')}:${String(period.closeTime.minutes).padStart(2, '0')}`}
                                  onChange={e => {
                                    const [h, m] = e.target.value.split(':').map(Number);
                                    const newPeriods = formData.regularHours.periods.map((p: any) => 
                                      p.openDay === day ? { ...p, closeTime: { hours: h, minutes: m } } : p
                                    );
                                    setFormData({ ...formData, regularHours: { periods: newPeriods } });
                                  }}
                                  style={{ padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13 }}
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newPeriods = formData.regularHours.periods.filter((p: any) => p.openDay !== day);
                                  setFormData({ ...formData, regularHours: { periods: newPeriods } });
                                }}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => {
                                const newPeriod = {
                                  openDay: day,
                                  openTime: { hours: 9, minutes: 0 },
                                  closeDay: day,
                                  closeTime: { hours: 17, minutes: 0 }
                                };
                                setFormData({ ...formData, regularHours: { periods: [...(formData.regularHours.periods || []), newPeriod] } });
                              }}
                              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: "#64748b", cursor: "pointer" }}
                            >
                              Closed (Add Hours)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Location Section */}
          {activeTab === "location" && (
            <div className="card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Location & Areas</h2>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Business Address</label>
                  <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <MapPin size={18} color="#64748b" style={{ marginTop: 2 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 14, color: "#111", fontWeight: 500 }}>
                          {formData.storefrontAddress?.addressLines?.join(", ")}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
                          {formData.storefrontAddress?.locality}, {formData.storefrontAddress?.administrativeArea} {formData.storefrontAddress?.postalCode}
                        </p>
                        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2563eb", fontWeight: 600 }}>Note: Address changes may require re-verification on Google.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Service Areas</label>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, marginTop: 0 }}>Businesses that serve customers at their location. Managed directly on Google Maps.</p>
                  <div style={{ padding: 14, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    {(() => {
                      const places = formData.serviceArea?.places?.placeInfos || [];
                      const regionCodes = formData.serviceArea?.regionCodes || [];
                      const all = [
                        ...places.map((p: any) => p.displayName || p.name || p.placeId),
                        ...regionCodes
                      ].filter(Boolean);
                      return all.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {all.map((area: string, i: number) => (
                            <div key={i} style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, border: "1px solid #bfdbfe" }}>
                              <MapPin size={11} /> {area}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No service areas configured. Set up service areas directly in your Google Business Profile.</p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* More Section */}
          {activeTab === "more" && (
            <div className="card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: 0 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Additional Settings</h2>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Labels</label>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Labels help you organize your locations into groups.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {formData.labels?.map((label: string, idx: number) => (
                      <div key={idx} style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        {label}
                        <X size={12} onClick={() => {
                          const newLabels = formData.labels.filter((_: any, i: number) => i !== idx);
                          setFormData({ ...formData, labels: newLabels });
                        }} style={{ cursor: "pointer" }} />
                      </div>
                    ))}
                    <input 
                      type="text" 
                      placeholder="Add label..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setFormData({ ...formData, labels: [...(formData.labels || []), val] });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                      style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 12, outline: "none", width: 120 }}
                    />
                  </div>
                </div>

                <div style={{ padding: 16, background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: 8 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <AlertCircle size={18} color="#f97316" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#9a3412" }}>Google Verification</p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#c2410c" }}>Some changes (like name, category, or address) may trigger a re-verification process from Google. Ensure your business information remains accurate.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

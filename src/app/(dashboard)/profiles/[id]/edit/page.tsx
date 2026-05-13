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
  const [catSearch, setCatSearch] = useState("");
  const [catResults, setCatResults] = useState<any[]>([]);
  const [searchingCats, setSearchingCats] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    if (profileData?.data) {
      const gbp = profileData.data;
      setFormData({
        title: gbp.title || "",
        description: gbp.profile?.description || "",
        phone: gbp.phoneNumbers?.primaryPhone || "",
        website: gbp.websiteUri || "",
        logoUrl: gbp.logoUrl || "",
        categories: gbp.categories || { primaryCategory: { displayName: "" }, additionalCategories: [] },
        regularHours: gbp.regularHours || { periods: [] },
        storefrontAddress: gbp.storefrontAddress || {},
        serviceArea: gbp.serviceArea || { businessRegionCodes: [] },
        labels: gbp.labels || [],
        metadata: gbp.metadata || {},
      });
    }
  }, [profileData]);

  // Category Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (catSearch.length > 2) {
        setSearchingCats(true);
        try {
          const res = await fetch(`/api/categories?searchTerm=${encodeURIComponent(catSearch)}`);
          const d = await res.json();
          setCatResults(d.data || []);
        } catch (e) {}
        setSearchingCats(false);
      } else {
        setCatResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [catSearch]);

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
      <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#9ca3af" }} />
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
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Sticky Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.9)", 
        backdropFilter: "blur(8px)", borderBottom: "1px solid #eaeaea", 
        padding: "16px 0", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/profiles" style={{ padding: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#4b5563" }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111" }}>{formData.title || "Business Profile"}</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Google Business Profile Editor</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
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
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 13,
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

      <div style={{ display: "flex", gap: 32 }}>
        {/* Left Sidebar Nav */}
        <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 100, height: "fit-content" }}>
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
            <div className="card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Business Information</h2>
                <Tag size={18} color="#9ca3af" />
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Logo */}
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Business Name</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="input w-full"
                    placeholder="e.g. Acme Coffee"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Primary Category</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
                      <Tag size={14} color="#64748b" />
                      <span style={{ fontSize: 14, color: "#111" }}>{formData.categories.primaryCategory?.displayName || "None"}</span>
                      <button onClick={() => setCatSearch("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: 12, fontWeight: 600 }}>Change</button>
                    </div>
                    
                    <div style={{ marginTop: 8 }}>
                      <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input 
                          type="text" 
                          placeholder="Search categories..." 
                          value={catSearch}
                          onChange={e => setCatSearch(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                        />
                        {searchingCats && <Loader2 size={14} className="animate-spin" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />}
                      </div>
                      
                      {catResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", marginTop: 4, maxHeight: 200, overflowY: "auto" }}>
                          {catResults.map(c => (
                            <button
                              key={c.name}
                              onClick={() => {
                                setFormData({ ...formData, categories: { ...formData.categories, primaryCategory: c } });
                                setCatSearch("");
                                setCatResults([]);
                              }}
                              style={{ width: "100%", padding: "10px 12px", border: "none", background: "none", textAlign: "left", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              {c.displayName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Categories */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Additional Categories</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {formData.categories.additionalCategories?.map((c: any, idx: number) => (
                      <div key={idx} style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        {c.displayName}
                        <X size={12} onClick={() => {
                          const newCats = formData.categories.additionalCategories.filter((_: any, i: number) => i !== idx);
                          setFormData({ ...formData, categories: { ...formData.categories, additionalCategories: newCats } });
                        }} style={{ cursor: "pointer" }} />
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "relative" }}>
                      <Plus size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input 
                        type="text" 
                        placeholder="Add additional category..." 
                        value={catSearch && activeTab === "about" ? catSearch : ""} 
                        onChange={e => setCatSearch(e.target.value)}
                        onFocus={() => setCatResults([])}
                        style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                      />
                    </div>
                    {/* Reuse catResults dropdown here too if needed, but I'll keep it simple for now or just use a flag to know if we are adding primary or additional */}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Business Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="input w-full"
                    rows={5}
                    placeholder="Describe your business to customers..."
                    style={{ resize: "vertical" }}
                  />
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
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Primary Phone</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Phone size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        className="input w-full" 
                        style={{ paddingLeft: 36 }}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Website</label>
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
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Service Areas</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {formData.serviceArea?.businessRegionCodes?.map((code: string) => (
                      <div key={code} style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        {code}
                        <X size={12} style={{ cursor: "pointer" }} />
                      </div>
                    )) || <span style={{ fontSize: 13, color: "#9ca3af" }}>No service areas defined.</span>}
                    <button style={{ background: "none", border: "1px dashed #cbd5e1", borderRadius: 100, padding: "4px 10px", fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                      <Plus size={12} /> Add area
                    </button>
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
  );
}

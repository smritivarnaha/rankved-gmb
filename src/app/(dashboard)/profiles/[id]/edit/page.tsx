"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, ArrowLeft, Save, Building2, Phone, Globe, FileText, CheckCircle2, Upload, LayoutList, Clock, Map, Star, Search, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TabType = "basics" | "categories" | "hours" | "service-area" | "attributes";

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: profileData, isLoading } = useSWR(id ? `/api/profiles/${id}/gbp` : null, fetcher);
  
  const [activeTab, setActiveTab] = useState<TabType>("basics");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    phone: "",
    website: "",
    logoUrl: "",
    categories: { primaryCategory: { name: "" }, additionalCategories: [] },
    regularHours: { periods: [] },
    specialHours: { specialHourPeriods: [] },
    serviceArea: { places: { placeInfos: [] } },
    attributes: [],
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Category search state
  const [catSearch, setCatSearch] = useState("");
  const [catResults, setCatResults] = useState<any[]>([]);
  const [searchingCats, setSearchingCats] = useState(false);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (profileData?.data) {
      const gbp = profileData.data;
      setFormData({
        title: gbp.title || "",
        description: gbp.profile?.description || "",
        phone: gbp.phoneNumbers?.primaryPhone || "",
        website: gbp.websiteUri || "",
        logoUrl: gbp.logoUrl || "",
        categories: gbp.categories || { primaryCategory: { name: "" }, additionalCategories: [] },
        regularHours: gbp.regularHours || { periods: [] },
        specialHours: gbp.specialHours || { specialHourPeriods: [] },
        serviceArea: gbp.serviceArea || { places: { placeInfos: [] } },
        attributes: gbp.attributes || [],
      });
    }
  }, [profileData]);

  // Handle category search
  useEffect(() => {
    if (catSearch.length < 2) {
      setCatResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(async () => {
      setSearchingCats(true);
      try {
        const res = await fetch(`/api/gbp/categories?query=${encodeURIComponent(catSearch)}`);
        const d = await res.json();
        setCatResults(d.data || []);
      } catch (err) {
        console.error("Cat search error:", err);
      } finally {
        setSearchingCats(false);
      }
    }, 500);
  }, [catSearch]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // 1. Sync GBP Details
      const res = await fetch(`/api/profiles/${id}/gbp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          phone: formData.phone,
          website: formData.website,
          categories: formData.categories,
          regularHours: formData.regularHours,
          specialHours: formData.specialHours,
          serviceArea: formData.serviceArea,
          attributes: formData.attributes,
        }),
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
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setSaving(false);
    }
  };

  const addAdditionalCategory = (cat: any) => {
    const exists = formData.categories.additionalCategories?.find((c: any) => c.name === cat.name);
    if (exists) return;

    setFormData({
      ...formData,
      categories: {
        ...formData.categories,
        additionalCategories: [...(formData.categories.additionalCategories || []), { name: cat.name, displayName: cat.displayName }]
      }
    });
    setCatSearch("");
    setCatResults([]);
  };

  const removeAdditionalCategory = (name: string) => {
    setFormData({
      ...formData,
      categories: {
        ...formData.categories,
        additionalCategories: formData.categories.additionalCategories.filter((c: any) => c.name !== name)
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
        <p className="text-[14px] font-bold text-[#64748b] uppercase tracking-widest">Fetching Google Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/profiles" className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:text-[#2563eb] hover:border-[#2563eb] transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Business Master Editor</h1>
            <p className="text-[14px] text-[#64748b] font-medium">Manage your Google presence with full feature parity</p>
          </div>
        </div>
        <button 
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2.5 px-6 py-3 bg-[#2563eb] text-white rounded-xl font-bold text-[14px] shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-[#1d4ed8] transition-all disabled:opacity-50 uppercase tracking-wide"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sync to Google
        </button>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === "success" ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="text-[14px] font-bold">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-2xl mb-8 w-fit shadow-inner">
        {[
          { id: "basics", label: "Basics", icon: Building2 },
          { id: "categories", label: "Categories", icon: LayoutList },
          { id: "hours", label: "Hours", icon: Clock },
          { id: "service-area", label: "Service Area", icon: Map },
          { id: "attributes", label: "Attributes", icon: Star },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
              activeTab === tab.id 
                ? "bg-white text-[#2563eb] shadow-sm" 
                : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-[#e2e8f0] rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8">
          {activeTab === "basics" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Profile Logo</h3>
                  <p className="text-[12px] text-[#64748b] leading-relaxed">This logo appears on your dashboard and generated reports.</p>
                </div>
                <div className="md:col-span-2 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center overflow-hidden shadow-inner group relative">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-[#cbd5e1]" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-xl text-[13px] font-bold shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] transition-all inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </label>
                    <p className="text-[11px] text-[#94a3b8] mt-2">Preferred: 500x500px Square PNG or JPG</p>
                  </div>
                </div>
              </div>

              <hr className="border-[#f1f5f9]" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Business Identity</h3>
                  <p className="text-[12px] text-[#64748b] leading-relaxed">Core information visible on Google Search and Maps.</p>
                </div>
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Business Name</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[15px] font-medium text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4}
                      className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[15px] font-medium text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all resize-none" />
                  </div>
                </div>
              </div>

              <hr className="border-[#f1f5f9]" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <h3 className="text-[15px] font-bold text-[#0f172a]">Contact Details</h3>
                  <p className="text-[12px] text-[#64748b] leading-relaxed">How customers reach your business.</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-[#e2e8f0] rounded-xl py-3 pl-11 pr-4 text-[15px] font-medium text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all" />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Website URL</label>
                    <div className="relative">
                      <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full border border-[#e2e8f0] rounded-xl py-3 pl-11 pr-4 text-[15px] font-medium text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all" />
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[16px] font-black text-[#0f172a] mb-2">Business Categories</h3>
                <p className="text-[13px] text-[#64748b]">Choose the categories that best describe your business to improve ranking.</p>
              </div>

              <div className="space-y-6">
                {/* Primary Category */}
                <div className="p-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div>
                      <label className="text-[13px] font-bold text-[#0f172a]">Primary Category</label>
                      <p className="text-[11px] text-[#64748b]">This is the main category shown on Google Search.</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#2563eb] rounded-xl shadow-sm">
                      <span className="text-[15px] font-bold text-[#0f172a]">
                        {formData.categories.primaryCategory?.displayName || formData.categories.primaryCategory?.name?.split(':').pop()?.replace(/_/g, ' ') || "No Primary Category"}
                      </span>
                      <div className="ml-auto bg-blue-50 text-[#2563eb] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-100">Primary</div>
                    </div>
                  </div>
                </div>

                {/* Additional Categories */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Additional Categories</label>
                    <span className="text-[11px] font-bold text-[#94a3b8] bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e2e8f0]">UP TO 9 TOTAL</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.categories.additionalCategories?.map((cat: any) => (
                      <div key={cat.name} className="flex items-center justify-between p-3 bg-white border border-[#e2e8f0] rounded-xl shadow-sm hover:border-[#2563eb] transition-all group">
                        <span className="text-[14px] font-bold text-[#475569]">{cat.displayName || cat.name?.split(':').pop()?.replace(/_/g, ' ')}</span>
                        <button onClick={() => removeAdditionalCategory(cat.name)} className="p-1.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add new category */}
                    <div className="relative">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          placeholder="Search for a category..."
                          className="w-full border border-[#e2e8f0] rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all shadow-sm"
                        />
                        {searchingCats ? (
                          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2563eb] animate-spin" />
                        ) : (
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                        )}
                      </div>

                      {catResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-xl max-h-[300px] overflow-y-auto">
                          {catResults.map((cat: any) => (
                            <button
                              key={cat.name}
                              onClick={() => addAdditionalCategory(cat)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 text-[14px] font-bold text-[#475569] border-b border-[#f1f5f9] last:border-0 transition-all flex items-center justify-between group"
                            >
                              <span>{cat.displayName}</span>
                              <Plus className="w-4 h-4 text-[#94a3b8] group-hover:text-[#2563eb]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "hours" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[16px] font-black text-[#0f172a] mb-2">Business Hours</h3>
                <p className="text-[13px] text-[#64748b]">Set your regular weekly opening hours for customers to see.</p>
              </div>

              <div className="space-y-3">
                {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                  const dayPeriods = formData.regularHours.periods?.filter((p: any) => p.openDay === day) || [];
                  const isOpen = dayPeriods.length > 0;

                  return (
                    <div key={day} className={`p-5 border rounded-2xl transition-all ${isOpen ? "bg-white border-[#e2e8f0] shadow-sm" : "bg-[#f8fafc] border-[#f1f5f9] opacity-80"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300"}`} />
                          <span className="text-[14px] font-black text-[#0f172a] tracking-tight">{day}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f1f5f9] p-1 rounded-xl">
                          <button
                            onClick={() => {
                              if (isOpen) {
                                setFormData({
                                  ...formData,
                                  regularHours: {
                                    ...formData.regularHours,
                                    periods: formData.regularHours.periods.filter((p: any) => p.openDay !== day)
                                  }
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  regularHours: {
                                    ...formData.regularHours,
                                    periods: [...(formData.regularHours.periods || []), { openDay: day, openTime: { hours: 9, minutes: 0 }, closeDay: day, closeTime: { hours: 17, minutes: 0 } }]
                                  }
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${!isOpen ? "bg-white text-[#64748b] shadow-sm" : "text-[#94a3b8] hover:text-[#0f172a]"}`}
                          >
                            Closed
                          </button>
                          <button
                            onClick={() => {
                              if (!isOpen) {
                                setFormData({
                                  ...formData,
                                  regularHours: {
                                    ...formData.regularHours,
                                    periods: [...(formData.regularHours.periods || []), { openDay: day, openTime: { hours: 9, minutes: 0 }, closeDay: day, closeTime: { hours: 17, minutes: 0 } }]
                                  }
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${isOpen ? "bg-[#2563eb] text-white shadow-md" : "text-[#94a3b8] hover:text-[#0f172a]"}`}
                          >
                            Open
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          {dayPeriods.map((period: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div className="relative">
                                  <input 
                                    type="time" 
                                    value={`${String(period.openTime.hours).padStart(2, '0')}:${String(period.openTime.minutes || 0).padStart(2, '0')}`}
                                    onChange={(e) => {
                                      const [h, m] = e.target.value.split(':').map(Number);
                                      const newPeriods = [...formData.regularHours.periods];
                                      const globalIdx = newPeriods.indexOf(period);
                                      newPeriods[globalIdx] = { ...period, openTime: { hours: h, minutes: m } };
                                      setFormData({ ...formData, regularHours: { ...formData.regularHours, periods: newPeriods } });
                                    }}
                                    className="w-full border border-[#e2e8f0] rounded-xl py-2.5 px-3 text-[14px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all shadow-sm"
                                  />
                                  <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Opens</span>
                                </div>
                                <div className="relative">
                                  <input 
                                    type="time" 
                                    value={`${String(period.closeTime.hours).padStart(2, '0')}:${String(period.closeTime.minutes || 0).padStart(2, '0')}`}
                                    onChange={(e) => {
                                      const [h, m] = e.target.value.split(':').map(Number);
                                      const newPeriods = [...formData.regularHours.periods];
                                      const globalIdx = newPeriods.indexOf(period);
                                      newPeriods[globalIdx] = { ...period, closeTime: { hours: h, minutes: m } };
                                      setFormData({ ...formData, regularHours: { ...formData.regularHours, periods: newPeriods } });
                                    }}
                                    className="w-full border border-[#e2e8f0] rounded-xl py-2.5 px-3 text-[14px] font-bold text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all shadow-sm"
                                  />
                                  <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Closes</span>
                                </div>
                              </div>
                              {idx > 0 && (
                                <button 
                                  onClick={() => {
                                    const newPeriods = formData.regularHours.periods.filter((p: any) => p !== period);
                                    setFormData({ ...formData, regularHours: { ...formData.regularHours, periods: newPeriods } });
                                  }}
                                  className="p-2.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              setFormData({
                                ...formData,
                                regularHours: {
                                  ...formData.regularHours,
                                  periods: [...(formData.regularHours.periods || []), { openDay: day, openTime: { hours: 13, minutes: 0 }, closeDay: day, closeTime: { hours: 17, minutes: 0 } }]
                                }
                              });
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-black text-[#2563eb] uppercase tracking-widest hover:translate-x-1 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Add Time Slot
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "service-area" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[16px] font-black text-[#0f172a] mb-2">Service Area</h3>
                <p className="text-[13px] text-[#64748b]">Specify the geographic areas where you provide services or deliveries.</p>
              </div>

              <div className="p-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Map className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#0f172a]">Active Service Areas</label>
                    <p className="text-[11px] text-[#64748b]">Google uses these to show your business to local customers.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.serviceArea?.places?.placeInfos?.map((place: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-sm group">
                      <div className="flex items-center gap-3">
                        <Map className="w-4 h-4 text-[#94a3b8]" />
                        <span className="text-[14px] font-bold text-[#475569]">{place.name}</span>
                      </div>
                      <button 
                        onClick={() => {
                          const newPlaces = formData.serviceArea.places.placeInfos.filter((_: any, i: number) => i !== idx);
                          setFormData({ ...formData, serviceArea: { ...formData.serviceArea, places: { placeInfos: newPlaces } } });
                        }}
                        className="p-2 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="Enter a city, zip code, or region..."
                      className="flex-1 border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-[14px] font-medium text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition-all shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            const newPlaces = [...(formData.serviceArea?.places?.placeInfos || []), { name: val }];
                            setFormData({ ...formData, serviceArea: { ...formData.serviceArea, places: { placeInfos: newPlaces } } });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <button className="px-4 py-2.5 bg-[#0f172a] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#1e293b] transition-all shadow-sm">
                      Add Area
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attributes" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[16px] font-black text-[#0f172a] mb-2">Business Attributes</h3>
                <p className="text-[13px] text-[#64748b]">Highlight special features and amenities about your business.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "has_wheelchair_accessible_entrance", label: "Wheelchair Accessible Entrance", icon: Star },
                  { id: "identifies_as_women_owned", label: "Identifies as Women-Owned", icon: Star },
                  { id: "identifies_as_veteran_owned", label: "Identifies as Veteran-Owned", icon: Star },
                  { id: "has_gender_neutral_restroom", label: "Gender-Neutral Restroom", icon: Star },
                  { id: "requires_appointment", label: "Requires Appointment", icon: Clock },
                  { id: "offers_online_appointments", label: "Online Appointments", icon: Globe },
                ].map((attr) => {
                  const currentAttr = formData.attributes?.find((a: any) => a.name.endsWith(attr.id));
                  const isEnabled = currentAttr?.values?.[0] === true;

                  return (
                    <button
                      key={attr.id}
                      onClick={() => {
                        let newAttrs = [...(formData.attributes || [])];
                        const idx = newAttrs.findIndex((a: any) => a.name.endsWith(attr.id));
                        
                        if (idx > -1) {
                          newAttrs[idx] = { ...newAttrs[idx], values: [!isEnabled] };
                        } else {
                          // This is simplified; real attribute names need the full location prefix
                          // But we can extract it from existing attributes or just use a placeholder
                          const prefix = formData.attributes?.[0]?.name?.split('/attributes/')[0] || `locations/${id}`;
                          newAttrs.push({ name: `${prefix}/attributes/${attr.id}`, values: [true] });
                        }
                        setFormData({ ...formData, attributes: newAttrs });
                      }}
                      className={`p-5 border rounded-2xl flex items-center justify-between transition-all group ${
                        isEnabled ? "bg-white border-[#2563eb] shadow-md" : "bg-[#f8fafc] border-[#e2e8f0] opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isEnabled ? "bg-blue-50 text-[#2563eb]" : "bg-white text-[#94a3b8]"}`}>
                          <attr.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`text-[14px] font-black tracking-tight ${isEnabled ? "text-[#0f172a]" : "text-[#64748b]"}`}>{attr.label}</p>
                          <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-wider">{isEnabled ? "Enabled" : "Off"}</p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-all ${isEnabled ? "bg-[#2563eb]" : "bg-[#e2e8f0]"}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${isEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-8 py-6 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between">
           <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
             <CheckCircle2 className="w-4 h-4 text-green-500" />
             Direct Google Sync Active
           </p>
           <button 
             onClick={() => handleSave()}
             disabled={saving}
             className="px-8 py-3 bg-[#0f172a] text-white rounded-xl font-bold text-[14px] shadow-sm hover:bg-[#1e293b] transition-all disabled:opacity-50 uppercase tracking-wide flex items-center gap-2"
           >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Save All Changes
           </button>
        </div>
      </div>
    </div>
  );
}

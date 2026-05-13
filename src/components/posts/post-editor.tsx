"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, Clock, Loader2, ImagePlus, X, Send, MapPin, Link as LinkIcon, Copy, Check, Lock, Phone, Sparkles } from "lucide-react";
import Link from "next/link";
import { embedGPSInImage, CAMERA_TEMPLATES } from "@/lib/geo-exif";
import Lottie from "lottie-react";

// Lottie Animation URLs
const ANIMATIONS = {
  PUBLISH: "https://assets2.lottiefiles.com/packages/lf20_m6cuL6.json", 
  SCHEDULED: "https://assets10.lottiefiles.com/packages/lf20_unp7v8.json", 
  DRAFT: "https://assets5.lottiefiles.com/packages/lf20_vnikbe.json", 
  SUCCESS: "https://assets3.lottiefiles.com/packages/lf20_yupe0msc.json", 
};

function LottieWrapper({ url, className }: { url: string; className?: string }) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Lottie fetch error:", err));
  }, [url]);

  if (!animationData) return <Loader2 className={`animate-spin ${className}`} />;

  return <Lottie animationData={animationData} loop={true} className={className} />;
}

// No fallback sample data — profiles load from /api/profiles only
const fallbackLocations: {id:string;name:string;client:string}[] = [];

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

function getMonthDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  return { daysInMonth, firstDay };
}

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

import { PostTimeline } from "./post-timeline";

export function PostEditor({ 
  initialData = null, 
  timelineDate, 
  onDateChange, 
  lockedProfileId, 
  returnUrl,
  showTimelineTop = false
}: { 
  initialData?: any; 
  timelineDate?: string; 
  onDateChange?: (d: string) => void; 
  lockedProfileId?: string; 
  returnUrl?: string;
  showTimelineTop?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = (session as any)?.user;
  const role = user?.role;
  const canPublishNow = role === "SUPER_ADMIN" || role === "AGENCY_OWNER" || user?.canPublishNow !== false;
  const canSchedule = role === "SUPER_ADMIN" || role === "AGENCY_OWNER" || user?.canSchedule !== false;
  const minScheduleDays = role === "TEAM_MEMBER" ? (user?.minScheduleDays || 0) : 0;

  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locations, setLocations] = useState<{id:string;name:string;client:string}[]>(fallbackLocations);

  // Fetch real profiles from API
  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data?.length > 0) {
          setLocations(d.data.map((p: any) => ({ id: p.id, name: p.name, client: p.accountName })));
        }
      })
      .catch(() => {});
  }, []);

  // Lock profile if provided
  useEffect(() => {
    if (lockedProfileId) {
      setForm(f => ({ ...f, locationId: lockedProfileId }));
    }
  }, [lockedProfileId]);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoLat, setGeoLat] = useState("");
  const [geoLatRef, setGeoLatRef] = useState("N");
  const [geoLng, setGeoLng] = useState("");
  const [geoLngRef, setGeoLngRef] = useState("E");
  const [geoTemplate, setGeoTemplate] = useState("samsung_s23_ultra");
  const [geoDate, setGeoDate] = useState("2026-01-20");
  const [geoApplied, setGeoApplied] = useState(false);

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (!initialData?.scheduledAt) return "";
    const d = new Date(initialData.scheduledAt);
    // Use LOCAL date components so the edit form shows what the user originally picked
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (!initialData?.scheduledAt) return "";
    const d = new Date(initialData.scheduledAt);
    // Use LOCAL time components
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  // Sync timeline date → schedule calendar
  useEffect(() => {
    if (timelineDate) {
      setSelectedDate(timelineDate);
      if (!selectedTime) setSelectedTime("10:00");
      const d = new Date(timelineDate);
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());
    }
  }, [timelineDate]);

  const [form, setForm] = useState({
    locationId: initialData?.locationId || initialData?.profileId || "",
    summary: initialData?.summary || "",
    focusKeyword: initialData?.focusKeyword || "",
    topicType: initialData?.topicType || "STANDARD",
    ctaType: initialData?.ctaType || "",
    ctaUrl: initialData?.ctaUrl || "",
    eventTitle: initialData?.eventTitle || "",
    eventStart: initialData?.eventStart || "",
    eventEnd: initialData?.eventEnd || "",
  });

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const [converting, setConverting] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");
    if (file.size > 10 * 1024 * 1024) return alert("Image must be under 10MB.");

    // If already JPEG, use directly
    if (file.type === "image/jpeg") {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    // Convert any other format (WebP, PNG, BMP, TIFF, GIF, AVIF, etc.) to JPEG
    setConverting(true);
    try {
      const jpegFile = await convertToJpeg(file);
      setImageFile(jpegFile);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(jpegFile);
    } catch {
      alert("Failed to convert image. Try a different file.");
    }
    setConverting(false);
  };

  const convertToJpeg = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#FFFFFF"; // white bg for transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Conversion failed"));
            const newName = file.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], newName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          1.0
        );
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Quick date helpers
  const toLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = toLocalDateString(now);
  const tomorrowStr = toLocalDateString(new Date(now.getTime() + 86400000));
  const dayAfterStr = toLocalDateString(new Date(now.getTime() + 2 * 86400000));

  // Current time as HH:MM string (local) — used as the min time when today is selected
  const nowTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Next rounded-up 15-min slot from now (e.g. 13:47 → 14:00)
  const getDefaultTimeForToday = () => {
    const d = new Date(now.getTime() + 15 * 60 * 1000); // +15 min buffer
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(Math.ceil(d.getMinutes() / 15) * 15 % 60).padStart(2, "0");
    const hAdj = d.getMinutes() >= 45 ? String(d.getHours() + 1).padStart(2, "0") : h;
    return `${hAdj}:${m}`;
  };

  const setQuickDate = (type: "tomorrow" | "dayafter") => {
    const targetD = type === "tomorrow"
      ? new Date(now.getTime() + 86400000)
      : new Date(now.getTime() + 2 * 86400000);
    const dateStr = type === "tomorrow" ? tomorrowStr : dayAfterStr;
    setCalMonth(targetD.getMonth());
    setCalYear(targetD.getFullYear());
    setSelectedDate(dateStr);
    onDateChange?.(dateStr);
    setSelectedTime("10:00");
  };

  const selectCalDay = (day: number) => {
    const d = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(d);
    onDateChange?.(d);
    if (d === todayStr) {
      // For today, always default to a future time slot
      setSelectedTime(getDefaultTimeForToday());
    } else if (!selectedTime) {
      setSelectedTime("10:00");
    }
  };

  const clearSchedule = () => {
    setSelectedDate("");
    setSelectedTime("");
    onDateChange?.("");
  };

  const getScheduledAt = () => {
    if (!selectedDate || !selectedTime) return null;
    // Build a Date from the local date/time strings — this correctly applies
    // the browser's local timezone offset when converting to UTC ISO string
    const localDt = new Date(`${selectedDate}T${selectedTime}:00`);
    if (isNaN(localDt.getTime())) return null;
    return localDt.toISOString(); // always UTC, e.g. "2026-05-06T09:15:00.000Z"
  };

  // True when a date+time is set AND the resulting datetime is in the future
  const isFutureScheduled = (() => {
    const s = getScheduledAt();
    if (!s) return false;
    return new Date(s).getTime() > Date.now();
  })();

  const handleSave = async (type: string) => {
    setSaving(true);
    setSavingType(type);
    try {
      let finalImageUrl = imagePreview;

      // Apply Geo-Tagging if enabled and coordinates exist
      if (geoEnabled && imagePreview && geoLat && geoLng) {
        try {
          const { embedGPSInImage } = await import("@/lib/geo-exif");
          finalImageUrl = await embedGPSInImage(
            imagePreview,
            parseFloat(geoLat),
            parseFloat(geoLng),
            geoLatRef,
            geoLngRef,
            geoTemplate,
            geoDate
          );
        } catch (err) {
          console.error("Failed to inject GPS metadata:", err);
          // Continue with original image if metadata injection fails
        }
      }

      const profile = locations.find((l: any) => l.id === form.locationId);
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/posts/${initialData.id}` : "/api/posts";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: form.locationId,
          profileName: profile?.name || "",
          clientName: profile?.client || "",
          summary: form.summary,
          focusKeyword: form.focusKeyword,
          topicType: form.topicType,
          ctaType: form.ctaType,
          ctaUrl: form.ctaType === "CALL" ? "" : form.ctaUrl,
          imageUrl: finalImageUrl,
          geoLat: geoLat,
          geoLng: geoLng,
          eventTitle: form.eventTitle,
          eventStart: form.eventStart,
          eventEnd: form.eventEnd,
          status: type === "PUBLISH" ? "PUBLISHED" : type === "SCHEDULED" ? "SCHEDULED" : "DRAFT",
          scheduledAt: getScheduledAt(),
        }),
      });
      const responseData = await res.json();
      if (res.status === 201 || res.status === 200) {
        let msg = "Post saved successfully!";
        if (type === "PUBLISH") msg = "Post published successfully!";
        else if (type === "SCHEDULED") msg = "Post scheduled successfully!";
        else if (type === "DRAFT") msg = "Draft saved successfully!";
        await new Promise(r => setTimeout(r, 800));
        setSuccessMessage(msg);
        setSaving(false);
        setSavingType("");
        setTimeout(() => {
          router.push(returnUrl || (form.locationId ? `/profiles/${form.locationId}` : "/profiles"));
        }, 3000);
        return;
      } else if (res.status === 207) {
        // Partial success — saved to DB but GBP publish failed
        alert(`⚠️ Post saved but could not publish to Google:\n\n${responseData.error}\n\nCheck Settings to reconnect your Google account.`);
        router.push(returnUrl || (form.locationId ? `/profiles/${form.locationId}` : "/profiles"));
      } else {
        alert(responseData.error || "Failed to save post");
      }
    } catch (err) {
      alert("Network error — could not save post.");
    }
    setSaving(false);
    setSavingType("");
  };

  // PUBLISHED posts are locked — already sent to GBP, cannot be modified
  const isLocked = initialData?.status === "PUBLISHED";
  const isPublished = isLocked;
  const { daysInMonth, firstDay } = getMonthDays(calYear, calMonth);
  const todayDay = now.getDate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {(saving || successMessage) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/40 backdrop-blur-sm transition-opacity duration-500">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-10 flex flex-col items-center justify-center max-w-sm w-full mx-4 transform transition-transform duration-300 scale-100 border border-[#f1f5f9]">
            {successMessage ? (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 mb-6">
                  <LottieWrapper url={ANIMATIONS.SUCCESS} className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a] mb-2 text-center tracking-tight">{successMessage}</h3>
                <p className="text-[15px] text-[#64748b] text-center font-medium">
                  Redirecting back to dashboard...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 mb-6">
                  <LottieWrapper 
                    url={savingType === "PUBLISH" ? ANIMATIONS.PUBLISH : 
                         savingType === "SCHEDULED" ? ANIMATIONS.SCHEDULED : 
                         ANIMATIONS.DRAFT} 
                    className="w-full h-full" 
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a] mb-2 text-center tracking-tight">
                  {savingType === "PUBLISH" ? "Publishing Now" : 
                   savingType === "SCHEDULED" ? "Scheduling Post" : 
                   savingType === "PENDING_APPROVAL" ? "Submitting Post" :
                   "Saving Draft"}
                </h3>
                <p className="text-[15px] text-[#64748b] text-center font-medium">
                  Sit tight, we're syncing with Google...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Integration at Top */}
      {showTimelineTop && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <PostTimeline 
            onDateSelect={onDateChange} 
            selectedDate={timelineDate} 
            profileId={lockedProfileId || form.locationId} 
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Card 1: Business Profile Selection */}
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Business Profile</label>
              {lockedProfileId ? (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <MapPin size={16} className="text-[#2563eb]" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{locations.find(l => l.id === lockedProfileId)?.name || "Selected Profile"}</span>
                  <div style={{ marginLeft: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>Selected</div>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <select name="locationId" value={form.locationId} onChange={handleChange} disabled={isPublished}
                    style={{ width: "100%", padding: "14px 16px 14px 44px", border: "1px solid #eaeaea", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#0f172a", background: "#fff", appearance: "none" }}>
                    <option value="">Select a business profile...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <MapPin size={18} className="text-[#64748b]" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Visual Content */}
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Visual Content</label>
              {imagePreview ? (
                <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
                  {!isPublished && (
                    <button onClick={removeImage} style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 12, background: "#fff", border: "1px solid #eaeaea", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => !isPublished && fileRef.current?.click()}
                  style={{ height: 200, border: "2px dashed #e2e8f0", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: isPublished ? "default" : "pointer", background: "#fcfcfc", transition: "all 0.2s" }}
                  className="hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    <ImagePlus size={24} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Upload Image</p>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              )}
              <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>
          </div>

          {/* Card 3: Post Content */}
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div className="space-y-4">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Post Content</label>
                <span style={{ fontSize: 11, fontWeight: 600, color: form.summary.length > 1500 ? "#ef4444" : "#94a3b8" }}>{form.summary.length}/1500</span>
              </div>
              
              <textarea
                name="summary" value={form.summary} onChange={handleChange} disabled={isPublished}
                placeholder="What's new with your business?"
                style={{ width: "100%", minHeight: 220, padding: "16px", border: "1px solid #eaeaea", borderRadius: 12, fontSize: 15, fontWeight: 500, color: "#0f172a", background: "#fff", outline: "none", resize: "vertical" }}
                className="focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.05em]">Button Type</label>
                  <select name="ctaType" value={form.ctaType} onChange={handleChange} disabled={isPublished}
                    style={{ width: "100%", padding: "12px", border: "1px solid #eaeaea", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#0f172a", background: "#fff" }}>
                    <option value="">No Button</option>
                    <option value="BOOK">Book</option>
                    <option value="ORDER">Order Online</option>
                    <option value="SHOP">Buy</option>
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="SIGN_UP">Sign Up</option>
                    <option value="CALL">Call Now</option>
                  </select>
                </div>
                {form.ctaType && form.ctaType !== "CALL" && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-[0.05em]">Button Link</label>
                    <div style={{ position: "relative" }}>
                      <input type="url" name="ctaUrl" value={form.ctaUrl} onChange={handleChange} disabled={isPublished}
                        style={{ width: "100%", padding: "12px 12px 12px 36px", border: "1px solid #eaeaea", borderRadius: 10, fontSize: 14, fontWeight: 500 }}
                        placeholder="https://..." />
                      <LinkIcon size={14} className="text-[#64748b]" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sidebar Panel */}
        <div style={{ width: 340, flexShrink: 0, position: "sticky", top: 32, display: "flex", flexDirection: "column", gap: 24, zIndex: 10 }}>
          
          {/* Scheduling Card */}
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#fcfcfc", display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={16} className="text-[#2563eb]" />
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Publishing</h3>
            </div>
            
            <div style={{ padding: "20px" }}>
              {/* Quick Date Selectors */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button onClick={() => setQuickDate("tomorrow")} style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, border: "1px solid #eaeaea", borderRadius: 8, background: "#fff", color: "#64748b", cursor: "pointer" }}>Tomorrow</button>
                <button onClick={() => setQuickDate("dayafter")} style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, border: "1px solid #eaeaea", borderRadius: 8, background: "#fff", color: "#64748b", cursor: "pointer" }}>Day After</button>
              </div>

              {/* Mini Calendar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>‹</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>›</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>
                  {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = day === todayDay && calMonth === now.getMonth() && calYear === now.getFullYear();
                    const isPast = new Date(dateStr).getTime() < new Date(todayStr).getTime();
                    return (
                      <button key={day} onClick={() => !isPast && selectCalDay(day)} disabled={isPast}
                        style={{ width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 700, background: isSelected ? "#2563eb" : "transparent", color: isSelected ? "#fff" : isPast ? "#eee" : "#64748b", border: isToday && !isSelected ? "1px solid #2563eb" : "none", cursor: isPast ? "default" : "pointer" }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Target Time (IST)</label>
                <select 
                  value={selectedTime} 
                  onChange={(e) => setSelectedTime(e.target.value)} 
                  disabled={isPublished}
                  style={{ width: "100%", padding: "12px", border: "1px solid #eaeaea", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#0f172a", background: "#fff", outline: "none" }}
                  className="focus:ring-2 focus:ring-[#2563eb] transition-all"
                >
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Main Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {!isLocked ? (
                  <>
                    <button 
                      onClick={() => handleSave("SCHEDULED")}
                      disabled={saving}
                      style={{ 
                        width: "100%", padding: "14px", background: "#2563eb", color: "#fff", 
                        borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, 
                        cursor: "pointer", display: "flex", alignItems: "center", 
                        justifyContent: "center", gap: 10, boxShadow: "0 4px 12px rgba(37,99,235,0.2)" 
                      }}
                    >
                      {saving && savingType === "SCHEDULED" ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                      {initialData ? "Update Schedule" : "Schedule Post"}
                    </button>
                    
                    <button 
                      onClick={() => handleSave("PUBLISH")}
                      disabled={saving || !canPublishNow}
                      style={{ 
                        width: "100%", padding: "13px", background: "#fff", color: "#2563eb", 
                        border: "1px solid #2563eb", borderRadius: 12, fontSize: 14, fontWeight: 700, 
                        cursor: "pointer", display: "flex", alignItems: "center", 
                        justifyContent: "center", gap: 8 
                      }}
                    >
                      {saving && savingType === "PUBLISH" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Publish Now
                    </button>

                    <button 
                      onClick={() => handleSave("DRAFT")}
                      disabled={saving}
                      style={{ 
                        width: "100%", padding: "10px", background: "#f8fafc", color: "#64748b", 
                        border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, fontWeight: 600, 
                        cursor: "pointer" 
                      }}
                    >
                      Save Draft
                    </button>
                  </>
                ) : (
                  <Link 
                    href={returnUrl || "/profiles"} 
                    style={{ 
                      width: "100%", padding: "14px", background: "#f1f5f9", color: "#64748b", 
                      borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", 
                      textAlign: "center" 
                    }}
                  >
                    Back to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Pro Tip Card */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 16, padding: "20px" }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#1e40af", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} /> Pro Tip
            </h4>
            <p style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.6, fontWeight: 500 }}>
              Posts with high-quality images and a clear Call-to-Action button get up to 3x more engagement on Google Maps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

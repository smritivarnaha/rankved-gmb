"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, Clock, Loader2, ImagePlus, X, Send, MapPin, Link as LinkIcon, Copy, Check, Lock, Phone } from "lucide-react";
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

export function PostEditor({ initialData = null, timelineDate, onDateChange, lockedProfileId, returnUrl }: { initialData?: any; timelineDate?: string; onDateChange?: (d: string) => void; lockedProfileId?: string; returnUrl?: string }) {
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
    <>
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
      <div className="bg-white border border-[#e2e8f0] rounded-xl relative z-[10] shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Lock banner — shown for PUBLISHED posts */}
        {isLocked && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Lock style={{ width: 18, height: 18, color: "#166534" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#166534", margin: 0 }}>
                Published & Locked
              </p>
              <p style={{ fontSize: 13, color: "#15803d", margin: "2px 0 0", opacity: 0.8 }}>
                This post is live on Google Business Profile and cannot be edited.
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile */}
            {/* Profile Selection */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Business Profile</label>
              {lockedProfileId ? (
                <div className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[14px] text-[#0f172a] bg-[#f8fafc] flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#64748b] shrink-0" />
                  <span className="font-semibold">{locations.find(l => l.id === lockedProfileId)?.name || "Loading Profile..."}</span>
                  <div className="ml-auto flex items-center gap-1.5 bg-white border border-[#e2e8f0] px-2.5 py-1 rounded-full shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    <span className="text-[11px] font-bold text-[#2563eb] uppercase">Selected</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select name="locationId" value={form.locationId} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#e2e8f0] rounded-xl py-3 pl-11 pr-4 text-[15px] font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 appearance-none transition-all">
                    <option value="">Select a business profile...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                </div>
              )}
            </div>

            {/* Image — ABOVE post content */}
            {/* Image Selection */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Visual Content</label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc] shadow-sm">
                  <img src={imagePreview} alt="Post preview" className="w-full max-h-[320px] object-cover" />
                  {!isPublished && (
                    <button onClick={removeImage}
                      className="absolute top-3 right-3 p-2 rounded-xl border border-[#e2e8f0] bg-white transition-all shadow-lg hover:bg-red-50 hover:border-red-100 group">
                      <X className="w-4 h-4 text-[#64748b] group-hover:text-red-500" />
                    </button>
                  )}
                  {imageFile && (
                    <div className="px-4 py-3 bg-white border-t border-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                           <ImagePlus className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[13px] font-semibold text-[#1e293b] truncate max-w-[200px]">{imageFile.name}</span>
                      </div>
                      <span className="text-[12px] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md">{(imageFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                </div>
              ) : converting ? (
                <div className="w-full border-2 border-dashed border-blue-200 rounded-2xl py-12 flex flex-col items-center justify-center bg-blue-50/30">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                  <span className="text-[15px] font-bold text-blue-600">Processing Image...</span>
                  <p className="text-[12px] text-blue-400 mt-1">Optimizing for Google Business Profile</p>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={isPublished}
                  className="w-full border-2 border-dashed border-[#cbd5e1] rounded-2xl py-12 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-50 group">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-all mb-4">
                    <ImagePlus className="w-7 h-7 text-[#94a3b8] group-hover:text-blue-500 transition-all" />
                  </div>
                  <span className="text-[15px] font-bold text-[#1e293b] group-hover:text-blue-600">Upload Media</span>
                  <p className="text-[12px] text-[#64748b] mt-1">High-quality JPG, PNG or WebP (Max 10MB)</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              {/* SEO: Focus Keyword */}
              <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">SEO Filename Keyword</label>
                  <span className="text-[10px] font-bold text-[#94a3b8] bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e2e8f0]">GOOGLE SEO</span>
                </div>
                <div className="relative">
                  <input type="text" name="focusKeyword" value={form.focusKeyword}
                    onChange={handleChange} disabled={isPublished}
                    placeholder="e.g. dental-implants-nyc"
                    className="w-full border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-[14px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 placeholder:text-gray-400 transition-all" />
                </div>
                <p className="text-[11px] text-[#64748b] mt-2 italic flex items-center gap-1.5">
                   <div className="w-1 h-1 rounded-full bg-blue-400" />
                   We use this keyword to automatically rename your image for better local SEO ranking.
                </p>
              </div>
            </div>

              {/* Geo-tagging */}
              {imagePreview && (
                <div className="mt-3 border border-[var(--border)] rounded-lg overflow-hidden">
                  <button onClick={() => setGeoEnabled(!geoEnabled)} type="button"
                    className="w-full px-3 py-2.5 flex items-center justify-between bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]">
                      <MapPin className="w-4 h-4 text-[var(--text-tertiary)]" />
                      Geo-tag this image
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      geoApplied ? 'text-[var(--success)] bg-[var(--success-bg)]' :
                      geoEnabled ? 'text-[var(--accent)] bg-[var(--accent-light)]' :
                      'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]'
                    }`}>
                      {geoApplied ? 'Applied' : geoEnabled ? 'Open' : 'Off'}
                    </span>
                  </button>
                  {geoEnabled && (
                    <div className="p-3 border-t border-[var(--border-light)] space-y-3">
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Embed GPS coordinates into the image EXIF metadata for local SEO.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Camera Template</label>
                          <select value={geoTemplate} onChange={(e) => { setGeoTemplate(e.target.value); setGeoApplied(false); }} className="w-full border border-[var(--border)] rounded-md py-2 px-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white">
                            {CAMERA_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Date of Capture</label>
                          <input type="date" value={geoDate} onChange={(e) => { setGeoDate(e.target.value); setGeoApplied(false); }} className="w-full border border-[var(--border)] rounded-md py-2 px-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Latitude</label>
                          <div className="flex border border-[var(--border)] rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:border-transparent">
                            <input type="text" value={geoLat} onChange={(e) => { 
                                let val = e.target.value.replace(/[^\d.-]/g, '');
                                val = val.replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1');
                                if (val.startsWith('-')) {
                                  setGeoLatRef('S');
                                  val = val.substring(1);
                                }
                                setGeoLat(val); 
                                setGeoApplied(false); 
                              }}
                              placeholder="e.g. 45.5152"
                              className="w-full py-2 pl-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none bg-transparent" />
                            <div className="flex items-center bg-[var(--bg-secondary)] border-l border-[var(--border)] px-1 shrink-0">
                              <span className="text-[12px] font-medium text-[var(--text-tertiary)] pl-1 select-none">°</span>
                              <select value={geoLatRef} onChange={(e) => { setGeoLatRef(e.target.value); setGeoApplied(false); }} className="bg-transparent text-[12px] font-medium text-[var(--text-secondary)] focus:outline-none py-1 pr-1 cursor-pointer">
                                <option value="N">N</option>
                                <option value="S">S</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Longitude</label>
                          <div className="flex border border-[var(--border)] rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:border-transparent">
                            <input type="text" value={geoLng} onChange={(e) => { 
                                let val = e.target.value.replace(/[^\d.-]/g, '');
                                val = val.replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1');
                                if (val.startsWith('-')) {
                                  setGeoLngRef('W');
                                  val = val.substring(1);
                                }
                                setGeoLng(val); 
                                setGeoApplied(false); 
                              }}
                              placeholder="e.g. 122.6784"
                              className="w-full py-2 pl-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none bg-transparent" />
                            <div className="flex items-center bg-[var(--bg-secondary)] border-l border-[var(--border)] px-1 shrink-0">
                              <span className="text-[12px] font-medium text-[var(--text-tertiary)] pl-1 select-none">°</span>
                              <select value={geoLngRef} onChange={(e) => { setGeoLngRef(e.target.value); setGeoApplied(false); }} className="bg-transparent text-[12px] font-medium text-[var(--text-secondary)] focus:outline-none py-1 pr-1 cursor-pointer">
                                <option value="E">E</option>
                                <option value="W">W</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button type="button" disabled={!geoLat || !geoLng || !imageFile || geoApplied}
                        onClick={async () => {
                          if (!imageFile || !geoLat || !geoLng) return;
                          try {
                            const latNum = parseFloat(geoLat);
                            const lngNum = parseFloat(geoLng);
                            const lat = geoLatRef === 'S' ? -latNum : latNum;
                            const lng = geoLngRef === 'W' ? -lngNum : lngNum;
                            
                            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                              alert('Invalid coordinates. Lat: -90 to 90, Lng: -180 to 180');
                              return;
                            }
                            const { embedGPSInImage } = await import("@/lib/geo-exif");
                            const geoDataUrl = await embedGPSInImage(imagePreview!, lat, lng, geoLatRef, geoLngRef, geoTemplate, geoDate || "2026-01-20");
                            
                            // Update preview and convert to File for persistence
                            setImagePreview(geoDataUrl);
                            const byteString = atob(geoDataUrl.split(',')[1]);
                            const ab = new ArrayBuffer(byteString.length);
                            const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                            const geoFile = new File([ab], imageFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                            setImageFile(geoFile);
                            setGeoApplied(true);
                          } catch (err) {
                            alert('Failed to embed GPS data.');
                          }
                        }}
                        className="w-full py-2 text-[12px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-md transition-colors flex items-center justify-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {geoApplied ? 'GPS data embedded' : 'Apply geo-tag'}
                      </button>
                      {geoApplied && imageFile && (
                        <button type="button"
                          onClick={() => {
                            const url = URL.createObjectURL(imageFile);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = imageFile.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="w-full py-2 text-[12px] font-medium border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:bg-white transition-colors flex items-center justify-center gap-1.5">
                          Download to verify
                        </button>
                      )}
                    </div>
                  )}
            </div>
            )}
            {/* Post content */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Post Content</label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${form.summary.length > 1500 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50'}`}>
                  {form.summary.length} / 1500
                </span>
              </div>
              <textarea name="summary" value={form.summary} onChange={handleChange} disabled={isPublished}
                rows={10}
                className="w-full border border-[#e2e8f0] rounded-xl py-3.5 px-4 text-[15px] leading-relaxed text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent resize-none disabled:opacity-50 disabled:bg-[#f8fafc] placeholder:text-gray-400 shadow-sm transition-all"
                placeholder="What would you like to share with your customers?"
              />
            </div>

            {/* Type & CTA */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Post Type</label>
                <div className="relative">
                  <select name="topicType" value={form.topicType} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[14px] font-semibold text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 transition-all appearance-none">
                    <option value="STANDARD">✨ Standard Update</option>
                    <option value="EVENT">📅 Special Event</option>
                    <option value="OFFER">🎁 Exclusive Offer</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Call to Action</label>
                <div className="relative">
                  <select name="ctaType" value={form.ctaType} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[14px] font-semibold text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 transition-all appearance-none">
                    <option value="">🚫 No Button</option>
                    <option value="BOOK">📖 Book Now</option>
                    <option value="ORDER">🛒 Order Online</option>
                    <option value="LEARN_MORE">🔍 Learn More</option>
                    <option value="SIGN_UP">✍️ Sign Up</option>
                    <option value="CALL">📞 Call Now</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Event fields */}
            {form.topicType === "EVENT" && (
              <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/20 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-100/50">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h4 className="text-[14px] font-bold text-[#0f172a] uppercase tracking-tight">Event Logistics</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#64748b] uppercase">Event Title</label>
                  <input type="text" name="eventTitle" value={form.eventTitle} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[14px] font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm"
                    placeholder="e.g. Grand Opening Celebration" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#64748b] uppercase">Start Date</label>
                    <input type="date" name="eventStart" value={form.eventStart} onChange={handleChange} disabled={isPublished}
                      className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[14px] font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#64748b] uppercase">End Date</label>
                    <input type="date" name="eventEnd" value={form.eventEnd} onChange={handleChange} disabled={isPublished}
                      className="w-full border border-[#e2e8f0] rounded-xl py-3 px-4 text-[14px] font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm" />
                  </div>
                </div>
              </div>
            )}

            {form.ctaType === "CALL" && (
              <div className="flex items-start gap-3 px-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-[13px] text-blue-800 font-medium">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div className="pt-1">
                  <span className="font-bold block mb-0.5">Direct Call Integration</span>
                  <p className="text-blue-600/80 leading-relaxed">Google will automatically use the primary phone number from your Business Profile. No URL is required for this action type.</p>
                </div>
              </div>
            )}

            {form.ctaType && form.ctaType !== "CALL" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Button Destination Link</label>
                <div className="relative">
                  <input type="url" name="ctaUrl" value={form.ctaUrl} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#e2e8f0] rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 placeholder:text-gray-400 shadow-sm transition-all"
                    placeholder="https://yourwebsite.com/promotion" />
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Schedule */}
          <div className="space-y-6">
            <div className="border border-[#e2e8f0] rounded-2xl bg-[#f8fafc] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#f1f5f9] bg-white">
                <h3 className="text-[14px] font-bold text-[#0f172a] flex items-center gap-2.5 uppercase tracking-tight">
                  <Clock className="w-4 h-4 text-[#2563eb]" />
                  Publish Schedule
                </h3>
              </div>

              {/* Quick picks */}
              <div className="px-4 py-4 border-b border-[#f1f5f9] flex gap-3">
                <button onClick={() => setQuickDate("tomorrow")} disabled={minScheduleDays > 1} className={`flex-1 py-2 text-[12px] font-bold border border-[#e2e8f0] rounded-xl transition-all shadow-sm ${minScheduleDays > 1 ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400" : "bg-white hover:border-blue-300 hover:text-blue-600 text-[#475569]"}`}>Tomorrow</button>
                <button onClick={() => setQuickDate("dayafter")} disabled={minScheduleDays > 2} className={`flex-1 py-2 text-[12px] font-bold border border-[#e2e8f0] rounded-xl transition-all shadow-sm ${minScheduleDays > 2 ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400" : "bg-white hover:border-blue-300 hover:text-blue-600 text-[#475569]"}`}>Day After</button>
              </div>

              {/* Mini calendar */}
              <div className="px-4 py-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">‹</button>
                  <span className="text-[13px] font-bold text-[#0f172a] tracking-tight">{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">›</button>
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] text-[#94a3b8] font-bold mb-2 uppercase tracking-widest">
                  {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} className="py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 text-center gap-y-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = day === todayDay && calMonth === now.getMonth() && calYear === now.getFullYear();
                    
                    const dateObj = new Date(dateStr);
                    const todayObj = new Date(todayStr);
                    const diffTime = dateObj.getTime() - todayObj.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isPast = diffDays < 0 || diffDays < minScheduleDays;
                    
                    return (
                      <button key={day} onClick={() => !isPast && selectCalDay(day)} disabled={isPast}
                        className={`w-8 h-8 mx-auto rounded-xl text-[12px] font-bold transition-all ${
                          isSelected ? "bg-[#2563eb] text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] scale-110" :
                          isToday && !isPast ? "border-2 border-[#2563eb] text-[#2563eb]" :
                          isPast ? "text-gray-200 cursor-not-allowed" :
                          "text-[#475569] hover:bg-gray-100"
                        }`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time picker */}
              {selectedDate && (
                <div className="px-5 py-5 border-t border-[#f1f5f9] bg-[#f8fafc]">
                  <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-widest mb-3">Target Time</label>
                  <input 
                    type="time" 
                    value={selectedTime}
                    min={selectedDate === todayStr ? nowTimeStr : undefined}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (selectedDate === todayStr && val < nowTimeStr) {
                        setSelectedTime(getDefaultTimeForToday());
                      } else {
                        setSelectedTime(val);
                      }
                    }}
                    className="w-full border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-[14px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white shadow-sm transition-all"
                  />
                  {selectedDate === todayStr && (
                    <p className="text-[11px] text-blue-500 font-medium mt-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Future times only for today
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="px-5 py-4 border-t border-[#f1f5f9] bg-white">
                {selectedDate && selectedTime ? (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Selected Slot</span>
                      <p className="text-[13px] text-[#0f172a] font-bold">
                        {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} @ {selectedTime}
                      </p>
                    </div>
                    <button onClick={clearSchedule} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <p className="text-[12px] font-medium italic">No schedule — will save as draft</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f1f5f9] px-8 py-6 flex justify-end gap-4 bg-white">
        {isPublished ? (
          <div className="text-[14px] font-bold text-[#94a3b8] flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-widest">
            <Lock className="w-4 h-4" /> This post is live
          </div>
        ) : (
          <>
            {!canPublishNow && !canSchedule ? (
              <button onClick={() => handleSave("PENDING_APPROVAL")} disabled={saving || !form.locationId || !form.summary}
                className="px-8 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2.5 uppercase tracking-wide">
                {saving && savingType === "PENDING_APPROVAL" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Submit for Approval
              </button>
            ) : (
              <>
                {/* Save Draft */}
                <button onClick={() => handleSave("DRAFT")} disabled={saving || !form.locationId || !form.summary}
                  className="px-8 py-3 border-2 border-[#e2e8f0] text-[15px] font-bold text-[#475569] rounded-xl hover:bg-gray-50 hover:border-[#cbd5e1] transition-all disabled:opacity-50 flex items-center gap-2.5 uppercase tracking-wide">
                  {saving && savingType === "DRAFT" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>

                {isFutureScheduled ? (
                  canSchedule ? (
                    <button
                      onClick={() => handleSave("SCHEDULED")}
                      disabled={saving || !form.locationId || !form.summary}
                      className="px-8 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2.5 uppercase tracking-wide"
                    >
                      {saving && savingType === "SCHEDULED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Schedule Post
                    </button>
                  ) : (
                    <div
                      className="px-8 py-3 bg-gray-100 text-[#94a3b8] text-[15px] font-bold rounded-xl flex items-center gap-2.5 cursor-not-allowed border-2 border-gray-200 uppercase tracking-wide opacity-50"
                      title="You do not have permission to schedule posts."
                    >
                      <Clock className="w-4 h-4" /> Schedule (Disabled)
                    </div>
                  )
                ) : (
                  canPublishNow ? (
                    <button
                      onClick={() => handleSave("PUBLISH")}
                      disabled={saving || !form.locationId || !form.summary}
                      className="px-8 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2.5 uppercase tracking-wide"
                    >
                      {saving && savingType === "PUBLISH" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Publish Now
                    </button>
                  ) : (
                    <div
                      className="px-8 py-3 bg-gray-100 text-[#94a3b8] text-[15px] font-bold rounded-xl flex items-center gap-2.5 cursor-not-allowed border-2 border-gray-200 uppercase tracking-wide opacity-50"
                      title={`You must schedule posts at least ${minScheduleDays} days in advance.`}
                    >
                      <Send className="w-4 h-4" /> Publish (Disabled)
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

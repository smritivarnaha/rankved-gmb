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
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Editor Card */}
        <div style={{ flex: 1, background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div className="space-y-8">
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
            {/* Profile Selection */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Business Profile</label>
              {lockedProfileId ? (
                <div className="w-full border border-[#eaeaea] rounded-xl py-3 px-4 text-[14px] text-[#111] bg-[#fcfcfc] flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#2563eb] shrink-0" />
                  <span className="font-semibold">{locations.find(l => l.id === lockedProfileId)?.name || "Loading Profile..."}</span>
                  <div className="ml-auto flex items-center gap-1.5 bg-white border border-[#eaeaea] px-2.5 py-1 rounded-full shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    <span className="text-[10px] font-bold text-[#2563eb] uppercase">Selected</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select name="locationId" value={form.locationId} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#eaeaea] rounded-xl py-3 pl-11 pr-4 text-[15px] font-semibold text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 appearance-none transition-all">
                    <option value="">Select a business profile...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                </div>
              )}
            </div>

            {/* Media Section */}
            <div className="space-y-3">
              <label className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Visual Content</label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#eaeaea] bg-[#fcfcfc] shadow-sm">
                  <img src={imagePreview} alt="Post preview" className="w-full max-h-[400px] object-cover" />
                  {!isPublished && (
                    <button onClick={removeImage}
                      className="absolute top-4 right-4 p-2 rounded-xl border border-[#eaeaea] bg-white transition-all shadow-lg hover:bg-red-50 hover:border-red-100 group">
                      <X className="w-4 h-4 text-[#64748b] group-hover:text-red-500" />
                    </button>
                  )}
                  {imageFile && (
                    <div className="px-4 py-3 bg-white border-t border-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <ImagePlus className="w-4 h-4 text-[#2563eb]" />
                        </div>
                        <span className="text-[13px] font-semibold text-[#111] truncate max-w-[200px]">{imageFile.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md">{(imageFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={isPublished}
                  className="w-full border-2 border-dashed border-[#eaeaea] rounded-2xl py-16 flex flex-col items-center justify-center hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all disabled:opacity-50 group">
                  <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center group-hover:bg-[#dbeafe] transition-all mb-4">
                    <ImagePlus className="w-8 h-8 text-[#94a3b8] group-hover:text-[#2563eb] transition-all" />
                  </div>
                  <span className="text-[16px] font-bold text-[#111]">Upload Media</span>
                  <p className="text-[13px] text-[#666] mt-1">High-quality JPG, PNG or WebP (Max 10MB)</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              {/* SEO Keyword */}
              <div style={{ marginTop: 16 }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest">SEO Filename Keyword</label>
                </div>
                <input type="text" name="focusKeyword" value={form.focusKeyword}
                  onChange={handleChange} disabled={isPublished}
                  placeholder="e.g. dental-implants-nyc"
                  className="w-full border border-[#eaeaea] rounded-xl py-3 px-4 text-[14px] font-medium text-[#111] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent disabled:opacity-50 placeholder:text-gray-400 transition-all" />
                <p className="text-[11px] text-[#666] mt-2 flex items-center gap-2">
                  <Sparkles size={12} className="text-[#2563eb]" />
                  Used to automatically rename your image for better local SEO ranking.
                </p>
              </div>
            </div>

            {/* Post Content Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Post Content</label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.summary.length > 1500 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50'}`}>
                  {form.summary.length} / 1500
                </span>
              </div>
              <textarea name="summary" value={form.summary} onChange={handleChange} disabled={isPublished}
                rows={10}
                className="w-full border border-[#eaeaea] rounded-xl py-4 px-5 text-[15px] leading-relaxed text-[#111] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent resize-none disabled:opacity-50 disabled:bg-[#fcfcfc] placeholder:text-gray-400 shadow-sm transition-all"
                placeholder="What would you like to share with your customers?"
              />
            </div>

            {/* Type & CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Post Type</label>
                <select name="topicType" value={form.topicType} onChange={handleChange} disabled={isPublished}
                  className="w-full border border-[#eaeaea] rounded-xl py-3 px-4 text-[14px] font-bold text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] appearance-none">
                  <option value="STANDARD">✨ Standard Update</option>
                  <option value="EVENT">📅 Special Event</option>
                  <option value="OFFER">🎁 Exclusive Offer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Call to Action</label>
                <select name="ctaType" value={form.ctaType} onChange={handleChange} disabled={isPublished}
                  className="w-full border border-[#eaeaea] rounded-xl py-3 px-4 text-[14px] font-bold text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] appearance-none">
                  <option value="">🚫 No Button</option>
                  <option value="BOOK">📖 Book Now</option>
                  <option value="ORDER">🛒 Order Online</option>
                  <option value="LEARN_MORE">🔍 Learn More</option>
                  <option value="SIGN_UP">✍️ Sign Up</option>
                  <option value="CALL">📞 Call Now</option>
                </select>
              </div>
            </div>

            {/* Conditional CTA Link */}
            {form.ctaType && form.ctaType !== "CALL" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Button Destination Link</label>
                <div className="relative">
                  <input type="url" name="ctaUrl" value={form.ctaUrl} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#eaeaea] rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-[#111] focus:outline-none focus:ring-2 focus:ring-[#2563eb] placeholder:text-gray-400"
                    placeholder="https://yourwebsite.com/promotion" />
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div style={{ width: 340, flexShrink: 0, position: "sticky", top: 24, height: "fit-content" }}>
          {/* Publish Panel */}
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", background: "#fcfcfc" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Clock size={16} className="text-[#2563eb]" />
                Publish Schedule
              </h3>
            </div>
            
            <div style={{ padding: "24px" }}>
              {/* Quick Picks */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button onClick={() => setQuickDate("tomorrow")} disabled={minScheduleDays > 1} style={{ flex: 1, padding: "10px", fontSize: 12, fontWeight: 700, border: "1px solid #eaeaea", borderRadius: 10, background: "#fff", color: "#666", cursor: "pointer" }}>Tomorrow</button>
                <button onClick={() => setQuickDate("dayafter")} disabled={minScheduleDays > 2} style={{ flex: 1, padding: "10px", fontSize: 12, fontWeight: 700, border: "1px solid #eaeaea", borderRadius: 10, background: "#fff", color: "#666", cursor: "pointer" }}>Day After</button>
              </div>

              {/* Mini Calendar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#999" }}>‹</button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#999" }}>›</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>
                  {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = day === todayDay && calMonth === now.getMonth() && calYear === now.getFullYear();
                    const isPast = new Date(dateStr).getTime() < new Date(todayStr).getTime();
                    
                    return (
                      <button key={day} onClick={() => !isPast && selectCalDay(day)} disabled={isPast}
                        style={{
                          width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: isSelected ? "#2563eb" : "transparent",
                          color: isSelected ? "#fff" : isPast ? "#eee" : "#666",
                          border: isToday && !isSelected ? "1px solid #2563eb" : "none",
                          cursor: isPast ? "default" : "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time & Final Actions */}
              {selectedDate && (
                <div style={{ paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 10 }}>Target Time</label>
                  <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} 
                    style={{ width: "100%", padding: "12px", border: "1px solid #eaeaea", borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: 24 }} />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {!isLocked && (
                  <>
                    {canPublishNow && (
                      <button onClick={() => handleSave("PUBLISH")} disabled={saving} style={{ width: "100%", padding: "14px", background: "#111", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <Send size={16} /> Publish Now
                      </button>
                    )}
                    {canSchedule && isFutureScheduled && (
                      <button onClick={() => handleSave("SCHEDULED")} disabled={saving} style={{ width: "100%", padding: "14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <Clock size={16} /> Schedule Post
                      </button>
                    )}
                    <button onClick={() => handleSave("DRAFT")} disabled={saving} style={{ width: "100%", padding: "14px", background: "#fff", color: "#111", border: "1px solid #eaeaea", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Save size={16} /> Save as Draft
                    </button>
                  </>
                )}
                {isLocked && (
                  <Link href={returnUrl || "/profiles"} style={{ width: "100%", padding: "14px", background: "#f1f5f9", color: "#64748b", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                    Back to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

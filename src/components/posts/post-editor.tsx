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
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-10 flex flex-col items-center justify-center max-w-sm w-full mx-4 border border-[#f1f5f9]">
            {successMessage ? (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 mb-6">
                  <LottieWrapper url={ANIMATIONS.SUCCESS} className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a] mb-2 text-center tracking-tight">{successMessage}</h3>
                <p className="text-[15px] text-[#64748b] text-center font-medium">Redirecting back...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 mb-6">
                  <LottieWrapper url={savingType === "PUBLISH" ? ANIMATIONS.PUBLISH : savingType === "SCHEDULED" ? ANIMATIONS.SCHEDULED : ANIMATIONS.DRAFT} className="w-full h-full" />
                </div>
                <h3 className="text-2xl font-bold text-[#0f172a] mb-2 text-center tracking-tight">{savingType === "PUBLISH" ? "Publishing Now" : "Scheduling Post"}</h3>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* ─── Top Selection Row ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Column 1: Business Profile */}
          <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Business Profile</h3>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f8fafc] border border-[#eaeaea] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#64748b]" />
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-[15px] font-semibold text-[#000]">
                  {locations.find(l => l.id === form.locationId)?.name || "Select Profile"}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0369a1]" />
                  <span className="text-[11px] font-bold text-[#0369a1] uppercase">Selected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Visual Content */}
          <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Visual Content</h3>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#eaeaea] bg-[#f8fafc] group">
                <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover" />
                {!isPublished && (
                  <button onClick={removeImage} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 shadow-sm hover:bg-white text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => fileRef.current?.click()} 
                disabled={isPublished}
                className="w-full aspect-square border-2 border-dashed border-[#eaeaea] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#2563eb] hover:bg-[#f0f9ff] transition-all group"
              >
                <ImagePlus className="w-8 h-8 text-[#94a3b8] group-hover:text-[#2563eb]" />
                <span className="text-[13px] font-bold text-[#1e293b]">Upload Media</span>
                <p className="text-[11px] text-[#64748b]">High-quality JPG, PNG or WebP</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          {/* Column 3: Publish Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Clock size={16} />
               <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Publish Schedule</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <button onClick={() => setQuickDate("tomorrow")} className="flex-1 py-1.5 text-[13px] font-semibold text-[#000] hover:text-[#2563eb] transition-colors">Tomorrow</button>
                <button onClick={() => setQuickDate("dayafter")} className="flex-1 py-1.5 text-[13px] font-semibold text-[#000] hover:text-[#2563eb] transition-colors">Day After</button>
              </div>

              {/* Mini Calendar */}
              <div className="bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-bold text-[#000]">{monthNames[calMonth]} {calYear}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }} className="p-1 hover:bg-gray-100 rounded">‹</button>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }} className="p-1 hover:bg-gray-100 rounded">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#94a3b8] mb-2">
                  {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 text-center gap-y-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = day === todayDay && calMonth === now.getMonth() && calYear === now.getFullYear();
                    const isPast = new Date(dateStr) < new Date(todayStr);

                    return (
                      <button 
                        key={day} 
                        onClick={() => !isPast && selectCalDay(day)}
                        disabled={isPast}
                        className={`w-7 h-7 mx-auto rounded-lg text-[12px] font-bold flex items-center justify-center transition-all ${
                          isSelected ? "bg-[#000] text-[#fff]" :
                          isToday ? "text-[#2563eb] font-extrabold" :
                          isPast ? "text-gray-200" : "text-[#475569] hover:bg-gray-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="pt-2">
                  <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} 
                    className="w-full border-none p-0 text-[24px] font-bold text-[#000] focus:ring-0 cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Main Content Area ─── */}
        <div className="border-t border-[#f5f5f7] pt-12 space-y-8">
           <div className="max-w-3xl space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Post Content</h3>
                  <span className="text-[11px] font-bold text-[#94a3b8]">{form.summary.length} / 1500</span>
                </div>
                <textarea 
                  name="summary" 
                  value={form.summary} 
                  onChange={handleChange} 
                  disabled={isPublished}
                  rows={8}
                  placeholder="What would you like to share?"
                  className="w-full border-none p-0 text-[18px] text-[#000] focus:ring-0 resize-none placeholder:text-[#94a3b8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Post Type</h3>
                  <select name="topicType" value={form.topicType} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#eaeaea] rounded-lg py-2.5 px-3 text-[14px] font-medium bg-white outline-none">
                    <option value="STANDARD">Standard Update</option>
                    <option value="EVENT">Special Event</option>
                    <option value="OFFER">Exclusive Offer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Call to Action</h3>
                  <select name="ctaType" value={form.ctaType} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[#eaeaea] rounded-lg py-2.5 px-3 text-[14px] font-medium bg-white outline-none">
                    <option value="">No Button</option>
                    <option value="BOOK">Book Now</option>
                    <option value="ORDER">Order Online</option>
                    <option value="LEARN_MORE">Learn More</option>
                    <option value="SIGN_UP">Sign Up</option>
                    <option value="CALL">Call Now</option>
                  </select>
                </div>
              </div>

              {form.ctaType && form.ctaType !== "CALL" && (
                <div className="space-y-2">
                  <h3 className="text-[14px] font-bold text-[#000] uppercase tracking-wider">Button Link</h3>
                  <input type="url" name="ctaUrl" value={form.ctaUrl} onChange={handleChange} disabled={isPublished}
                    placeholder="https://example.com"
                    className="w-full border border-[#eaeaea] rounded-lg py-2.5 px-4 text-[14px] font-medium outline-none" />
                </div>
              )}
           </div>

           {/* Actions Row */}
           <div className="flex items-center gap-4 pt-8 border-t border-[#f5f5f7]">
              <button 
                onClick={() => handleSave("PUBLISH")} 
                disabled={saving || isPublished || !form.locationId || !form.summary}
                className="px-8 py-3 bg-[#000] text-[#fff] rounded-lg text-[14px] font-bold hover:bg-[#222] disabled:opacity-30 transition-all shadow-sm"
              >
                Publish Now
              </button>
              <button 
                onClick={() => handleSave("SCHEDULED")} 
                disabled={saving || isPublished || !selectedDate || !form.locationId || !form.summary}
                className="px-8 py-3 bg-[#fff] text-[#000] border border-[#eaeaea] rounded-lg text-[14px] font-bold hover:bg-[#fafafa] disabled:opacity-30 transition-all"
              >
                Schedule Post
              </button>
              <button 
                onClick={() => handleSave("DRAFT")} 
                disabled={saving || isPublished || !form.locationId || !form.summary}
                className="px-6 py-3 bg-transparent text-[#64748b] text-[14px] font-bold hover:text-[#000] transition-all"
              >
                Save as Draft
              </button>
           </div>
        </div>
      </div>
    </>
  );
}
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

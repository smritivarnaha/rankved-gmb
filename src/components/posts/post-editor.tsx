"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, Clock, Loader2, ImagePlus, X, Send, MapPin, Link as LinkIcon, Copy, Check } from "lucide-react";
import { embedGPSInImage, CAMERA_TEMPLATES } from "@/lib/geo-exif";

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

export function PostEditor({ initialData = null, timelineDate, onDateChange }: { initialData?: any; timelineDate?: string; onDateChange?: (d: string) => void }) {
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
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [geoLat, setGeoLat] = useState("");
  const [geoLatRef, setGeoLatRef] = useState("N");
  const [geoLng, setGeoLng] = useState("");
  const [geoLngRef, setGeoLngRef] = useState("E");
  const [geoTemplate, setGeoTemplate] = useState("samsung_s23_ultra");
  const [geoDate, setGeoDate] = useState("2026-01-20");
  const [geoApplied, setGeoApplied] = useState(false);
  const [imageKeyword, setImageKeyword] = useState("");

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().split("T")[0] : ""
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt).toTimeString().slice(0, 5) : ""
  );

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
    topicType: initialData?.topicType || "STANDARD",
    ctaType: initialData?.ctaType || "",
    ctaUrl: initialData?.ctaUrl || "",
    eventTitle: initialData?.eventTitle || "",
    eventStart: initialData?.eventStart || "",
    eventEnd: initialData?.eventEnd || "",
  });

  const [utmSource, setUtmSource] = useState("google_business_profile");
  const [utmMedium, setUtmMedium] = useState("organic");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-generate campaign name from selected profile
  const selectedProfile = locations.find(l => l.id === form.locationId);

  const buildUtmUrl = () => {
    if (!form.ctaUrl) return "";
    try {
      const url = new URL(form.ctaUrl);
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      const campaign = utmCampaign || (selectedProfile ? `gbp_${selectedProfile.client.toLowerCase().replace(/\s+/g, "_")}_${selectedProfile.name.toLowerCase().replace(/\s+/g, "_")}` : "");
      if (campaign) url.searchParams.set("utm_campaign", campaign);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      return url.toString();
    } catch {
      return form.ctaUrl;
    }
  };

  const finalUrl = buildUtmUrl();

  const copyUrl = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          0.92
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

  const setQuickDate = (type: "now" | "today" | "tomorrow") => {
    if (type === "now") {
      setSelectedDate(todayStr);
      onDateChange?.(todayStr);
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setSelectedTime(`${h}:${m}`);
    } else if (type === "today") {
      setSelectedDate(todayStr);
      onDateChange?.(todayStr);
      setSelectedTime("10:00");
    } else {
      setSelectedDate(tomorrowStr);
      onDateChange?.(tomorrowStr);
      setSelectedTime("10:00");
    }
  };

  const selectCalDay = (day: number) => {
    const d = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(d);
    onDateChange?.(d);
    if (!selectedTime) setSelectedTime("10:00");
  };

  const clearSchedule = () => {
    setSelectedDate("");
    setSelectedTime("");
    onDateChange?.("");
  };

  const getScheduledAt = () => {
    if (!selectedDate || !selectedTime) return null;
    return `${selectedDate}T${selectedTime}:00`;
  };

  const handleSave = async (type: string) => {
    setSaving(true);
    setSavingType(type);
    try {
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
          topicType: form.topicType,
          ctaType: form.ctaType,
          ctaUrl: form.ctaType === "CALL" ? "" : form.ctaUrl,
          finalUrl: form.ctaType === "CALL" ? "" : (finalUrl || form.ctaUrl),
          imageUrl: imagePreview,
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
        router.push("/posts");
      } else if (res.status === 207) {
        // Partial success — saved to DB but GBP publish failed
        alert(`⚠️ Post saved but could not publish to Google:\n\n${responseData.error}\n\nCheck Settings to reconnect your Google account.`);
        router.push("/posts");
      } else {
        alert(responseData.error || "Failed to save post");
      }
    } catch (err) {
      alert("Network error — could not save post.");
    }
    setSaving(false);
    setSavingType("");
  };

  const isPublished = false; // GBP allows editing published posts
  const { daysInMonth, firstDay } = getMonthDays(calYear, calMonth);
  const todayDay = now.getDate();

  return (
    <div className="bg-white border border-[var(--border)] rounded-lg">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Profile</label>
              <select name="locationId" value={form.locationId} onChange={handleChange} disabled={isPublished}
                className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:bg-[var(--bg-secondary)]">
                <option value="">Select a profile</option>
                {locations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>{loc.client} — {loc.name}</option>
                ))}
              </select>
            </div>

            {/* Image — ABOVE post content */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Photo</label>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <img src={imagePreview} alt="Post preview" className="w-full max-h-[240px] object-cover" />
                  {!isPublished && (
                    <button onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full border border-[var(--border)] transition-colors shadow-sm"
                      style={{ backgroundColor: "#ffffff" }}>
                      <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                    </button>
                  )}
                  {imageFile && (
                    <div className="px-3 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)] truncate">{imageFile.name}</span>
                      <span className="text-[11px] text-[var(--text-tertiary)] shrink-0 ml-2">{(imageFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                </div>
              ) : converting ? (
                <div className="w-full border-2 border-dashed border-[var(--accent)] rounded-lg py-8 flex flex-col items-center justify-center bg-[var(--accent-light)]/10">
                  <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin mb-1.5" />
                  <span className="text-[13px] font-medium text-[var(--accent)]">Converting to JPEG...</span>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={isPublished}
                  className="w-full border-2 border-dashed border-[var(--border)] rounded-lg py-8 flex flex-col items-center justify-center hover:border-[var(--accent)] hover:bg-[var(--accent-light)]/20 transition-colors disabled:opacity-50 group">
                  <ImagePlus className="w-7 h-7 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors mb-1.5" />
                  <span className="text-[13px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent)]">Upload image</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Any format — auto-converts to JPEG</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              {/* Image keyword / filename */}
              {imagePreview && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Image keyword <span className="text-[var(--text-tertiary)]">(becomes filename)</span></label>
                    <div className="flex items-center gap-0">
                      <input type="text" value={imageKeyword}
                        onChange={(e) => {
                          const kw = e.target.value;
                          setImageKeyword(kw);
                          if (kw.trim() && imageFile) {
                            const slug = kw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                            const renamed = new File([imageFile], `${slug}.jpg`, { type: "image/jpeg" });
                            setImageFile(renamed);
                          }
                        }}
                        placeholder="e.g. best-dentist-portland-downtown"
                        className="w-full border border-[var(--border)] rounded-l-md py-1.5 px-2.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent" />
                      <div className="px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-l-0 border-[var(--border)] rounded-r-md text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">.jpg</div>
                    </div>
                  </div>
                </div>
              )}

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
                            const geoBlob = await embedGPSInImage(imageFile, lat, lng, geoTemplate, geoDate || "2026-01-20");
                            const geoFile = new File([geoBlob], imageFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                            setImageFile(geoFile);
                            const reader = new FileReader();
                            reader.onload = () => setImagePreview(reader.result as string);
                            reader.readAsDataURL(geoFile);
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
            </div>

            {/* Post content — taller */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-medium text-[var(--text-primary)]">Post content</label>
                <span className={`text-[11px] ${form.summary.length > 1500 ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}>
                  {form.summary.length} / 1500
                </span>
              </div>
              <textarea name="summary" value={form.summary} onChange={handleChange} disabled={isPublished}
                rows={8}
                className="w-full border border-[var(--border)] rounded-lg py-3 px-3 text-[14px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none disabled:opacity-50 disabled:bg-[var(--bg-secondary)]"
                placeholder="What's new with this business?"
              />
            </div>

            {/* Type & CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Post type</label>
                <select name="topicType" value={form.topicType} onChange={handleChange} disabled={isPublished}
                  className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50">
                  <option value="STANDARD">Update</option>
                  <option value="EVENT">Event</option>
                  <option value="OFFER">Offer</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Call to action</label>
                <select name="ctaType" value={form.ctaType} onChange={handleChange} disabled={isPublished}
                  className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50">
                  <option value="">None</option>
                  <option value="BOOK">Book</option>
                  <option value="ORDER">Order online</option>
                  <option value="LEARN_MORE">Learn more</option>
                  <option value="SIGN_UP">Sign up</option>
                  <option value="CALL">Call now</option>
                </select>
              </div>
            </div>

            {/* Event fields */}
            {form.topicType === "EVENT" && (
              <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg-secondary)]/50 space-y-4">
                <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">Event details</h4>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Event title</label>
                  <input type="text" name="eventTitle" value={form.eventTitle} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
                    placeholder="e.g. Free Dental Checkup Day" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Start date</label>
                    <input type="date" name="eventStart" value={form.eventStart} onChange={handleChange} disabled={isPublished}
                      className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">End date</label>
                    <input type="date" name="eventEnd" value={form.eventEnd} onChange={handleChange} disabled={isPublished}
                      className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[13px] text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50" />
                  </div>
                </div>
              </div>
            )}

            {form.ctaType === "CALL" && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-[12px] text-blue-700">
                <span className="font-semibold shrink-0">📞 Call Now:</span>
                <span>Google will use the phone number already on your Business Profile. No URL needed.</span>
              </div>
            )}

            {form.ctaType && form.ctaType !== "CALL" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-1.5">Landing page URL</label>
                  <input type="url" name="ctaUrl" value={form.ctaUrl} onChange={handleChange} disabled={isPublished}
                    className="w-full border border-[var(--border)] rounded-lg py-2.5 px-3 text-[14px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
                    placeholder="https://example.com/page" />
                </div>

                {form.ctaUrl && (
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <div className="px-3 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border-light)] flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">UTM Tracking</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded ml-auto">Auto-generated</span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Source</label>
                          <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                            className="w-full border border-[var(--border)] rounded-md py-1.5 px-2.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Medium</label>
                          <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)}
                            className="w-full border border-[var(--border)] rounded-md py-1.5 px-2.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Campaign</label>
                        <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                          placeholder={selectedProfile ? `gbp_${selectedProfile.client.toLowerCase().replace(/\s+/g, "_")}_${selectedProfile.name.toLowerCase().replace(/\s+/g, "_")}` : "auto-generated from profile"}
                          className="w-full border border-[var(--border)] rounded-md py-1.5 px-2.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white placeholder:text-[var(--text-tertiary)]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Content <span className="text-[var(--text-tertiary)]">(optional)</span></label>
                        <input type="text" value={utmContent} onChange={(e) => setUtmContent(e.target.value)}
                          placeholder="e.g. spring_sale_post"
                          className="w-full border border-[var(--border)] rounded-md py-1.5 px-2.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white placeholder:text-[var(--text-tertiary)]" />
                      </div>

                      {/* Final URL preview */}
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Final URL</label>
                        <div className="flex gap-1.5">
                          <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md py-1.5 px-2.5 text-[11px] text-[var(--text-secondary)] break-all leading-relaxed max-h-[52px] overflow-y-auto">
                            {finalUrl}
                          </div>
                          <button type="button" onClick={copyUrl}
                            className="p-2 border border-[var(--border)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors shrink-0">
                            {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — Schedule */}
          <div>
            <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-secondary)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border-light)]">
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                  Schedule
                </h3>
              </div>

              {/* Quick picks */}
              <div className="px-4 py-3 border-b border-[var(--border-light)] flex gap-2">
                <button onClick={() => setQuickDate("now")} className="flex-1 py-1.5 text-[12px] font-medium border border-[var(--border)] rounded-md hover:bg-white transition-colors text-[var(--text-secondary)]">Now</button>
                <button onClick={() => setQuickDate("today")} className="flex-1 py-1.5 text-[12px] font-medium border border-[var(--border)] rounded-md hover:bg-white transition-colors text-[var(--text-secondary)]">Today</button>
                <button onClick={() => setQuickDate("tomorrow")} className="flex-1 py-1.5 text-[12px] font-medium border border-[var(--border)] rounded-md hover:bg-white transition-colors text-[var(--text-secondary)]">Tomorrow</button>
              </div>

              {/* Mini calendar */}
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }}
                    className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-tertiary)]">‹</button>
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }}
                    className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-tertiary)]">›</button>
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] text-[var(--text-tertiary)] font-medium mb-1">
                  {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} className="py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 text-center">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;
                    const isToday = day === todayDay && calMonth === now.getMonth() && calYear === now.getFullYear();
                    
                    // Min schedule logic
                    const dateObj = new Date(dateStr);
                    const todayObj = new Date(todayStr);
                    const diffTime = dateObj.getTime() - todayObj.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isPast = diffDays < minScheduleDays;
                    
                    return (
                      <button key={day} onClick={() => !isPast && selectCalDay(day)} disabled={isPast}
                        style={isSelected ? { backgroundColor: "var(--accent)", color: "white" } : {}}
                        className={`w-7 h-7 mx-auto rounded-full text-[11px] font-medium transition-colors ${
                          isSelected ? "" :
                          isToday && !isPast ? "border border-[var(--accent)] text-[var(--accent)]" :
                          isPast ? "text-[var(--border)] cursor-not-allowed" :
                          "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                        }`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time picker */}
              {selectedDate && (
                <div className="px-4 py-3 border-t border-[var(--border-light)]">
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Time</label>
                  <input 
                    type="time" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-md py-2 px-3 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
                  />
                </div>
              )}

              {/* Summary */}
              <div className="px-4 py-3 border-t border-[var(--border-light)]">
                {selectedDate && selectedTime ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[var(--text-primary)] font-medium">
                      {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {selectedTime}
                    </p>
                    <button onClick={clearSchedule} className="text-[11px] text-[var(--error)] hover:underline">Clear</button>
                  </div>
                ) : (
                  <p className="text-[12px] text-[var(--text-tertiary)]">No schedule — will save as draft.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-6 py-4 flex justify-end gap-3 bg-[var(--bg-secondary)]">
        {isPublished ? (
          <button onClick={() => handleSave("PUBLISH")} disabled={saving || !form.locationId || !form.summary}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && savingType === "PUBLISH" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Update published post
          </button>
        ) : (
          <>
            {!canPublishNow && !canSchedule ? (
              <button onClick={() => handleSave("PENDING_APPROVAL")} disabled={saving || !form.locationId || !form.summary}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving && savingType === "PENDING_APPROVAL" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Submit for Approval
              </button>
            ) : (
              <>
                <button onClick={() => handleSave("DRAFT")} disabled={saving || !form.locationId || !form.summary}
                  className="px-4 py-2 border border-[var(--border)] text-[13px] font-medium text-[var(--text-secondary)] rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && savingType === "DRAFT" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save draft
                </button>

                {canPublishNow ? (
                  <button onClick={() => { clearSchedule(); handleSave("PUBLISH"); }} disabled={saving || !form.locationId || !form.summary}
                    className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${getScheduledAt() ? 'border border-[var(--accent)] text-[var(--accent)] hover:bg-white' : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'}`}>
                    {saving && savingType === "PUBLISH" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Publish now
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-gray-100 text-gray-500 text-[13px] font-medium rounded-lg flex items-center gap-2 cursor-not-allowed border border-gray-200" title={`You must schedule posts at least ${minScheduleDays} days in advance.`}>
                    <Send className="w-3.5 h-3.5" /> Publish now (Disabled)
                  </div>
                )}

                {getScheduledAt() && (
                  canSchedule ? (
                    <button onClick={() => handleSave("SCHEDULED")} disabled={saving || !form.locationId || !form.summary}
                      className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                      {saving && savingType === "SCHEDULED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      Schedule
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 text-[13px] font-medium rounded-lg flex items-center gap-2 cursor-not-allowed border border-gray-200" title="You do not have permission to schedule posts.">
                      <Clock className="w-3.5 h-3.5" /> Schedule (Disabled)
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

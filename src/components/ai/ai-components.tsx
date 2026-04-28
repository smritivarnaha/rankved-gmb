"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Wand2, RefreshCw, Check, AlertCircle, X, ExternalLink, Calendar, Layers } from "lucide-react";
import { addDays, format } from "date-fns";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ─── AI Settings Tab ────────────────────────────────────────── */
export function AiSettingsTab({ locationId, profileName }: { locationId: string; profileName?: string }) {
  const { data: settings, mutate } = useSWR(`/api/profiles/${locationId}/ai-settings`, fetcher);
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    aiInstructions: "",
    aiKeywords: "",
    aiTone: "Professional",
    aiCompetitorData: "",
    aiKeywordSequence: "",
    aiCurrentSequenceIndex: 0,
    aiWebsite: "",
    aiPhone: "",
    aiImageInstructions: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        aiInstructions: settings.aiInstructions || "",
        aiKeywords: settings.aiKeywords || "",
        aiTone: settings.aiTone || "Professional",
        aiCompetitorData: settings.aiCompetitorData || "",
        aiKeywordSequence: settings.aiKeywordSequence || "",
        aiCurrentSequenceIndex: settings.aiCurrentSequenceIndex || 0,
        aiWebsite: settings.aiWebsite || "",
        aiPhone: settings.aiPhone || "",
        aiImageInstructions: settings.aiImageInstructions || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/profiles/${locationId}/ai-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    mutate();
    setSaving(false);
  };

  const fetchFromProfile = () => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        aiWebsite: settings.client?.website || settings.aiWebsite || "",
        aiPhone: settings.phone || settings.aiPhone || "",
      }));
    }
  };

  if (!settings) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="anim-spin" /></div>;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <Wand2 size={18} color="#2563eb" />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Configuring AI for</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{profileName || "this location"}</p>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>AI Profile Brief</h2>
        <p style={{ fontSize: 13, color: "#64748b" }}>Train the AI on how to write for this specific location.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Custom Instructions (The Prompt)</label>
            <textarea 
              value={formData.aiInstructions}
              onChange={e => setFormData({ ...formData, aiInstructions: e.target.value })}
              placeholder="Example: Always mention our specific expertise in dental implants. Focus on local families in Gwalior. Avoid clinical jargon."
              style={{ width: "100%", height: 120, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Keyword Sequence (Ordered List)</label>
            <textarea 
              value={formData.aiKeywordSequence}
              onChange={e => setFormData({ ...formData, aiKeywordSequence: e.target.value })}
              placeholder="Topic 1, Topic 2, Topic 3..."
              style={{ width: "100%", height: 80, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
            />
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>AI will use these keywords in order for subsequent posts.</p>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Tone of Voice</label>
            <select 
              value={formData.aiTone}
              onChange={e => setFormData({ ...formData, aiTone: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
            >
              <option>Professional</option>
              <option>Friendly & Approachable</option>
              <option>Expert / Authoritative</option>
              <option>Clinical & Precise</option>
              <option>Energetic & Promotional</option>
            </select>
          </div>

          {/* No AI Engine controls here — manage via API Keys in sidebar */}

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Default Website & Phone</label>
              <button 
                onClick={fetchFromProfile}
                style={{ background: "none", border: "none", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Fetch from Profile
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input 
                type="text"
                placeholder="Website URL"
                value={formData.aiWebsite}
                onChange={e => setFormData({ ...formData, aiWebsite: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
              />
              <input 
                type="text"
                placeholder="Phone Number"
                value={formData.aiPhone}
                onChange={e => setFormData({ ...formData, aiPhone: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Competitor Data (Reference Content)</label>
            <textarea 
              value={formData.aiCompetitorData}
              onChange={e => setFormData({ ...formData, aiCompetitorData: e.target.value })}
              placeholder="Paste snippets of high-performing competitor posts here for style reference."
              style={{ width: "100%", height: 100, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
              Image Generation Instructions
            </label>
            <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
              Describe the visual style, setting, or elements you always want in generated images for this profile. E.g. "modern clinic interior with soft lighting", "bright outdoor signage", "close-up of equipment".
            </p>
            <textarea 
              value={formData.aiImageInstructions}
              onChange={e => setFormData({ ...formData, aiImageInstructions: e.target.value })}
              placeholder="E.g. Always show a clean, modern clinic interior. Use warm lighting. No text or logos visible."
              style={{ width: "100%", height: 90, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
            />
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ 
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", 
            background: "#0f172a", color: "#fff", borderRadius: 8, border: "none", 
            fontSize: 13, fontWeight: 600, cursor: "pointer" 
          }}
        >
          {saving ? <Loader2 size={16} className="anim-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save AI Profile Settings"}
        </button>
      </div>
    </div>
  );
}

/* ─── AI Generation Modal ────────────────────────────────────── */
export function AiGenerationModal({ 
  locationId, isOpen, onClose, onGenerated 
}: { 
  locationId: string; isOpen: boolean; onClose: () => void; onGenerated: () => void 
}) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<"BOTH" | "CONTENT" | "IMAGE">("BOTH");

  const triggerGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, mode: generationMode }),
      });
      const data = await res.json();
      if (res.ok) setPreview(data);
      else setError(data.error || "Generation failed");
    } catch {
      setError("Network error. Check your API keys.");
    }
    setGenerating(false);
  };

  const handleSaveAsDraft = async () => {
    if (!preview) return;
    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: locationId,
        summary: preview.content,
        topicType: preview.topicType || "STANDARD",
        status: "DRAFT",
        imageUrl: preview.imageUrl,
        ctaType: preview.ctaType,
        ctaUrl: preview.ctaUrl,
      }),
    });
    if (res.ok) {
      onGenerated();
      onClose();
    } else {
      alert("Failed to save draft.");
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20
    }}>
      <div style={{ 
        background: "#fff", width: "100%", maxWidth: 800, borderRadius: 16, 
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh"
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wand2 size={20} color="#2563eb" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>AI Post Generator</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {!preview && !generating && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <RefreshCw size={32} color="#2563eb" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Ready to generate?</p>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                The AI will use your profile instructions, competitor style, and keyword sequence to create your post.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                {[
                  { id: "BOTH", label: "Content & Image" },
                  { id: "CONTENT", label: "Content Only" },
                  { id: "IMAGE", label: "Image Only" },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setGenerationMode(mode.id as any)}
                    style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      background: generationMode === mode.id ? "#0f172a" : "#fff",
                      color: generationMode === mode.id ? "#fff" : "#64748b",
                      border: "1px solid " + (generationMode === mode.id ? "#0f172a" : "#e2e8f0"),
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <button 
                onClick={triggerGenerate}
                style={{ background: "#2563eb", color: "#fff", padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Wand2 size={16} /> Generate {generationMode === "BOTH" ? "Post" : generationMode === "CONTENT" ? "Content" : "Image"}
              </button>
            </div>
          )}

          {generating && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Loader2 size={48} className="anim-spin" color="#2563eb" style={{ margin: "0 auto 20px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>AI is thinking...</p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>AI is drafting content and painting an image based on your instructions.</p>
            </div>
          )}

          {error && (
            <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, display: "flex", gap: 12, marginBottom: 20 }}>
              <AlertCircle color="#dc2626" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>Generation Failed</p>
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>{error}</p>
              </div>
            </div>
          )}

          {preview && !generating && (
            <div style={{ display: "grid", gridTemplateColumns: preview.imageUrl && preview.content ? "1fr 300px" : "1fr", gap: 24 }}>
              {preview.content && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 8 }}>Generated Content</label>
                  <div style={{ padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, lineHeight: 1.6, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                    {preview.content}
                  </div>
                  
                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>Post Type</label>
                        <select 
                          value={preview.topicType || "STANDARD"}
                          onChange={e => setPreview({ ...preview, topicType: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", outline: "none" }}
                        >
                          <option value="STANDARD">Standard</option>
                          <option value="EVENT">Event</option>
                          <option value="OFFER">Offer</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>Call to Action</label>
                        <select 
                          value={preview.ctaType || ""}
                          onChange={e => setPreview({ ...preview, ctaType: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", outline: "none" }}
                        >
                          <option value="">None</option>
                          <option value="BOOK">Book</option>
                          <option value="ORDER">Order online</option>
                          <option value="LEARN_MORE">Learn more</option>
                          <option value="SIGN_UP">Sign up</option>
                          <option value="CALL">Call now</option>
                        </select>
                      </div>
                    </div>
                    {preview.ctaType === "CALL" ? (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 12, color: "#1e3a8a" }}>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>📞 Call Now:</span>
                        <span>Google will use the phone number already on your Business Profile. No URL needed.</span>
                      </div>
                    ) : preview.ctaType && preview.ctaType !== "" ? (
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>
                          Action Link URL
                        </label>
                        <input 
                          type="text"
                          value={preview.ctaUrl || ""}
                          onChange={e => setPreview({ ...preview, ctaUrl: e.target.value })}
                          placeholder="https://..."
                          style={{ width: "100%", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", outline: "none" }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {preview.imageUrl && (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 8 }}>AI Image</label>
                  <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 10, background: "#f1f5f9", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img src={preview.imageUrl} alt="AI Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>
                    AI generated image based on the content brief.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && !generating && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              onClick={triggerGenerate}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} /> Regenerate
            </button>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={onClose}
                style={{ padding: "9px 16px", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAsDraft}
                disabled={saving}
                style={{ padding: "9px 24px", background: "#16a34a", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                {saving ? <Loader2 size={16} className="anim-spin" /> : <Check size={16} />}
                {saving ? "Saving..." : "Save to Drafts"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── AI Bulk Generation Modal ────────────────────────────────────── */
export function AiBulkGenerationModal({ 
  locationId, isOpen, onClose, onGenerated 
}: { 
  locationId: string; isOpen: boolean; onClose: () => void; onGenerated: () => void 
}) {
  const [numPosts, setNumPosts] = useState(15);
  const [frequency, setFrequency] = useState(1);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [generateMode, setGenerateMode] = useState<"BOTH"|"CONTENT_ONLY">("BOTH");
  const [keywords, setKeywords] = useState<string[]>(Array(15).fill(""));
  const [ctas, setCtas] = useState<{type: string; url: string}[]>(Array(15).fill(null).map(() => ({ type: "AI_DEFAULT", url: "" })));
  const [applyAllCta, setApplyAllCta] = useState("AI_DEFAULT");
  const [applyAllUrl, setApplyAllUrl] = useState("");
  const [step, setStep] = useState<1|2|3>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{status: 'success'|'error', msg: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const cancelledRef = useRef(false);

  // CTA options matching GBP standards
  const CTA_OPTIONS = [
    { value: "AI_DEFAULT",   label: "AI decides" },
    { value: "CALL",         label: "Call now" },
    { value: "LEARN_MORE",   label: "Learn more" },
    { value: "BOOK",         label: "Book" },
    { value: "ORDER",        label: "Order online" },
    { value: "SIGN_UP",      label: "Sign up" },
    { value: "SHOP",         label: "Shop" },
    { value: "NONE",         label: "No button" },
  ];
  const URL_REQUIRED = ["LEARN_MORE", "BOOK", "ORDER", "SIGN_UP", "SHOP"];

  const applyToAll = () => {
    setCtas(prev => prev.map(() => ({ type: applyAllCta, url: applyAllUrl })));
  };

  useEffect(() => {
    setKeywords(prev => {
      const next = [...prev];
      if (next.length < numPosts) return [...next, ...Array(numPosts - next.length).fill("")];
      return next.slice(0, numPosts);
    });
    setCtas(prev => {
      const next = [...prev];
      if (next.length < numPosts) return [...next, ...Array(numPosts - next.length).fill(null).map(() => ({ type: "AI_DEFAULT", url: "" }))];
      return next.slice(0, numPosts);
    });
  }, [numPosts]);

  const handleStartGeneration = async () => {
    cancelledRef.current = false;
    setIsGenerating(true);
    setStep(3);
    setCurrentIndex(0);
    setResults([]);
    
    let currentResults: {status: 'success'|'error', msg: string}[] = [];

    for (let i = 0; i < numPosts; i++) {
      if (cancelledRef.current) {
        currentResults.push({ status: "error", msg: `Generation cancelled at post ${i + 1}.` });
        setResults([...currentResults]);
        break;
      }

      setCurrentIndex(i);
      const postDate = addDays(new Date(startDate), i * frequency);
      const customKeyword = keywords[i]?.trim();

      let success = false;
      let lastError = "";

      // Up to 3 retries per post
      for (let attempt = 0; attempt < 3 && !success && !cancelledRef.current; attempt++) {
        try {
          const genRes = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locationId, mode: generateMode, customKeyword: customKeyword || undefined }),
          });
          
          const genData = await genRes.json();
          
          if (!genRes.ok) {
            lastError = genData.error || "Generation failed";
            continue; // retry
          }

          const saveRes = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: locationId,
              summary: genData.content,
              topicType: genData.topicType || "STANDARD",
              status: "DRAFT",
              scheduledAt: postDate.toISOString(),
              imageUrl: genData.imageUrl,
              // Per-row CTA overrides AI default if set
              ctaType:  ctas[i]?.type && ctas[i].type !== "AI_DEFAULT" && ctas[i].type !== "NONE" ? ctas[i].type : ctas[i]?.type === "NONE" ? null : genData.ctaType,
              ctaUrl:   ctas[i]?.type && ctas[i].type !== "AI_DEFAULT" && ctas[i].type !== "NONE" ? ctas[i].url || genData.ctaUrl : ctas[i]?.type === "NONE" ? null : genData.ctaUrl,
            }),
          });

          if (!saveRes.ok) {
            lastError = "Failed to save to drafts";
            continue; // retry
          }

          currentResults.push({ status: "success", msg: `Post ${i+1}: Drafted for ${format(postDate, "MMM d")}` });
          success = true;
        } catch (err: any) {
          lastError = err.message;
        }
      }

      if (!success && !cancelledRef.current) {
        currentResults.push({ status: "error", msg: `Post ${i+1}: ${lastError} (3 retries exhausted)` });
      }

      setResults([...currentResults]);
    }

    setCurrentIndex(numPosts);
    setIsGenerating(false);
  };

  const handleCancel = () => {
    cancelledRef.current = true;
  };

  const resetAndClose = () => {
    if (isGenerating) {
      cancelledRef.current = true;
    }
    setStep(1);
    setCurrentIndex(0);
    setResults([]);
    setIsGenerating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20
    }}>
      <div style={{ 
        background: "#fff", width: "100%", maxWidth: 820, borderRadius: 16, 
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh"
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Layers size={20} color="#8b5cf6" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Bulk AI Post Generator</h3>
          </div>
          <button onClick={step === 3 && currentIndex < numPosts ? undefined : resetAndClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Number of Posts to Generate</label>
                <input 
                  type="number" min={1} max={30} value={numPosts}
                  onChange={e => setNumPosts(Number(e.target.value))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Start Date</label>
                  <input 
                    type="date" value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Frequency</label>
                  <select 
                    value={frequency}
                    onChange={e => setFrequency(Number(e.target.value))}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
                  >
                    <option value={1}>Daily</option>
                    <option value={2}>Alternate Days</option>
                    <option value={3}>Every 3 Days</option>
                    <option value={7}>Weekly</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Generation Mode</label>
                <select 
                  value={generateMode}
                  onChange={e => setGenerateMode(e.target.value as "BOTH"|"CONTENT_ONLY")}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
                >
                  <option value="BOTH">Content + Image (Uses more credits/time)</option>
                  <option value="CONTENT_ONLY">Content Only (Faster)</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              
              {/* Tip */}
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>
                Provide a keyword per post. <strong>Tip: Paste comma-separated keywords</strong> to auto-fill multiple boxes!
              </p>

              {/* Apply to all bar */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>Apply to all:</span>
                <select
                  value={applyAllCta}
                  onChange={e => setApplyAllCta(e.target.value)}
                  style={{ padding: "6px 8px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#fff" }}
                >
                  {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {URL_REQUIRED.includes(applyAllCta) && (
                  <input
                    type="text"
                    placeholder="URL for all"
                    value={applyAllUrl}
                    onChange={e => setApplyAllUrl(e.target.value)}
                    style={{ flex: 1, minWidth: 120, padding: "6px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                )}
                <button
                  onClick={applyToAll}
                  style={{ padding: "6px 14px", borderRadius: 7, background: "#0f172a", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Apply
                </button>
              </div>

              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 130px 120px", gap: 8, padding: "0 2px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Date</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Keyword</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>CTA</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>URL</span>
              </div>

              {/* Per-row inputs */}
              {keywords.map((kw, idx) => {
                const pDate = addDays(new Date(startDate), idx * frequency);
                const rowCta = ctas[idx] || { type: "AI_DEFAULT", url: "" };
                const needsUrl = URL_REQUIRED.includes(rowCta.type);
                return (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr 130px 120px", gap: 8, alignItems: "center" }}>
                    {/* Date */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={11} />
                      {format(pDate, "MMM d")}
                    </div>

                    {/* Keyword */}
                    <input
                      type="text"
                      placeholder={`Post ${idx + 1} keyword`}
                      value={kw}
                      onChange={e => {
                        const value = e.target.value;
                        if (value.includes(",")) {
                          const parts = value.split(",").map(s => s.trim()).filter(s => s);
                          const next = [...keywords];
                          for (let i = 0; i < parts.length && idx + i < numPosts; i++) next[idx + i] = parts[i];
                          setKeywords(next);
                        } else {
                          const next = [...keywords]; next[idx] = value; setKeywords(next);
                        }
                      }}
                      style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${!kw.trim() ? "#fca5a5" : "#e2e8f0"}`, fontSize: 12 }}
                    />

                    {/* CTA dropdown */}
                    <select
                      value={rowCta.type}
                      onChange={e => {
                        const next = [...ctas];
                        next[idx] = { ...next[idx], type: e.target.value, url: "" };
                        setCtas(next);
                      }}
                      style={{ padding: "7px 6px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, color: rowCta.type === "AI_DEFAULT" ? "#94a3b8" : "#334155", background: "#fff" }}
                    >
                      {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    {/* URL — only if CTA needs it */}
                    {needsUrl ? (
                      <input
                        type="text"
                        placeholder="https://..."
                        value={rowCta.url}
                        onChange={e => {
                          const next = [...ctas];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setCtas(next);
                        }}
                        style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 11 }}
                      />
                    ) : (
                      <div style={{ fontSize: 11, color: "#cbd5e1", paddingLeft: 4 }}>
                        {rowCta.type === "AI_DEFAULT" ? "auto" : rowCta.type === "NONE" ? "—" : "phone"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isGenerating ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Loader2 size={40} className="anim-spin" color="#8b5cf6" style={{ margin: "0 auto 16px" }} />
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Generating Post {currentIndex + 1} of {numPosts}...</h4>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Each post retries up to 3 times automatically.</p>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: cancelledRef.current ? "#fef9c3" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    {cancelledRef.current ? <X size={24} color="#d97706" /> : <Check size={24} color="#16a34a" />}
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{cancelledRef.current ? "Generation Cancelled" : "Generation Complete"}</h4>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{results.filter(r => r.status === "success").length} of {numPosts} posts drafted successfully.</p>
                </div>
              )}

              <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: 12, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((r, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: r.status === 'success' ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                    {r.status === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                    {r.msg}
                  </div>
                ))}
                {currentIndex < numPosts && (
                  <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    <Loader2 size={12} className="anim-spin" /> In progress...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {step === 1 && (
            <>
              <button onClick={resetAndClose} style={{ padding: "9px 16px", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setStep(2)} style={{ padding: "9px 24px", background: "#0f172a", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Next</button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} style={{ padding: "9px 16px", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Back</button>
              <button 
                onClick={() => {
                  if (keywords.some(k => !k.trim())) {
                    alert("Please provide a keyword for every post, or reduce the number of posts.");
                    return;
                  }
                  handleStartGeneration();
                }} 
                disabled={keywords.some(k => !k.trim())}
                style={{ padding: "9px 24px", background: keywords.some(k => !k.trim()) ? "#cbd5e1" : "#8b5cf6", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: keywords.some(k => !k.trim()) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Wand2 size={16} /> Generate & Draft All
              </button>
            </>
          )}
          {step === 3 && isGenerating && (
            <button 
              onClick={handleCancel}
              style={{ padding: "9px 20px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <X size={14} /> Cancel Generation
            </button>
          )}
          {step === 3 && !isGenerating && (
            <button onClick={() => { onGenerated(); resetAndClose(); }} style={{ padding: "9px 24px", background: "#0f172a", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

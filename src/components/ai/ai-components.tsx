"use client";

import { useState, useEffect } from "react";
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
    aiContentProvider: "CLAUDE",
    aiImageProvider: "DALL-E-3",
    aiImageEnabled: true,
    aiWebsite: "",
    aiPhone: "",
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
        aiContentProvider: settings.aiContentProvider || "CLAUDE",
        aiImageProvider: settings.aiImageProvider || "DALL-E-3",
        aiImageEnabled: settings.aiImageEnabled ?? true,
        aiWebsite: settings.aiWebsite || "",
        aiPhone: settings.aiPhone || "",
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Content Engine</label>
              <select 
                value={formData.aiContentProvider}
                onChange={e => setFormData({ ...formData, aiContentProvider: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
              >
                <option value="DEFAULT">System Default</option>
                <option value="CLAUDE">Anthropic Claude</option>
                <option value="GPT">OpenAI GPT</option>
                <option value="GEMINI">Google Gemini</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Image Engine</label>
              <select 
                value={formData.aiImageProvider}
                onChange={e => setFormData({ ...formData, aiImageProvider: e.target.value })}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
              >
                <option value="DEFAULT">System Default</option>
                <option value="DALL-E-3">OpenAI DALL-E</option>
                <option value="GEMINI">Google Gemini</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
            <input 
              type="checkbox"
              id="aiImageEnabled"
              checked={formData.aiImageEnabled}
              onChange={e => setFormData({ ...formData, aiImageEnabled: e.target.checked })}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <label htmlFor="aiImageEnabled" style={{ fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
              Enable Image Generation by Default
            </label>
          </div>

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
              style={{ width: "100%", height: 120, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit" }}
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
                          <option value="LEARN_MORE">Learn More</option>
                          <option value="CALL">Call Now</option>
                          <option value="BOOK">Book</option>
                          <option value="ORDER">Order</option>
                          <option value="SHOP">Shop</option>
                          <option value="SIGN_UP">Sign Up</option>
                        </select>
                      </div>
                    </div>
                    {preview.ctaType && preview.ctaType !== "" && (
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>
                          {preview.ctaType === "CALL" ? "Phone Number" : "Action Link URL"}
                        </label>
                        <input 
                          type="text"
                          value={preview.ctaUrl || ""}
                          onChange={e => setPreview({ ...preview, ctaUrl: e.target.value })}
                          placeholder={preview.ctaType === "CALL" ? "e.g. +1234567890" : "https://..."}
                          style={{ width: "100%", padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", outline: "none" }}
                        />
                      </div>
                    )}
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
  const [keywords, setKeywords] = useState<string[]>(Array(15).fill(""));
  const [step, setStep] = useState<1|2|3>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{status: 'success'|'error', msg: string}[]>([]);

  useEffect(() => {
    setKeywords(prev => {
      const next = [...prev];
      if (next.length < numPosts) {
        return [...next, ...Array(numPosts - next.length).fill("")];
      }
      return next.slice(0, numPosts);
    });
  }, [numPosts]);

  const handleStartGeneration = async () => {
    setStep(3);
    setCurrentIndex(0);
    setResults([]);
    
    let currentResults: {status: 'success'|'error', msg: string}[] = [];

    for (let i = 0; i < numPosts; i++) {
      setCurrentIndex(i);
      const postDate = addDays(new Date(startDate), i * frequency);
      const customKeyword = keywords[i]?.trim();

      try {
        const genRes = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId, mode: "BOTH", customKeyword: customKeyword || undefined }),
        });
        
        const genData = await genRes.json();
        
        if (!genRes.ok) {
          currentResults.push({ status: "error", msg: `Post ${i+1}: ${genData.error || "Generation failed"}` });
          setResults([...currentResults]);
          continue;
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
            ctaType: genData.ctaType,
            ctaUrl: genData.ctaUrl,
          }),
        });

        if (!saveRes.ok) {
          currentResults.push({ status: "error", msg: `Post ${i+1}: Failed to save` });
        } else {
          currentResults.push({ status: "success", msg: `Post ${i+1}: Drafted for ${format(postDate, "MMM d")}` });
        }
      } catch (err: any) {
         currentResults.push({ status: "error", msg: `Post ${i+1}: ${err.message}` });
      }
      setResults([...currentResults]);
    }
    setCurrentIndex(numPosts);
  };

  const resetAndClose = () => {
    setStep(1);
    setCurrentIndex(0);
    setResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20
    }}>
      <div style={{ 
        background: "#fff", width: "100%", maxWidth: 600, borderRadius: 16, 
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
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                Provide a primary keyword or topic for each post. Leave blank to let the AI decide based on your sequence.
              </p>
              {keywords.map((kw, idx) => {
                const pDate = addDays(new Date(startDate), idx * frequency);
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={12} /> {format(pDate, "MMM d")}
                    </div>
                    <input 
                      type="text"
                      placeholder={`Post ${idx + 1} Keyword`}
                      value={kw}
                      onChange={e => {
                        const next = [...keywords];
                        next[idx] = e.target.value;
                        setKeywords(next);
                      }}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {currentIndex < numPosts ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Loader2 size={40} className="anim-spin" color="#8b5cf6" style={{ margin: "0 auto 16px" }} />
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Generating Post {currentIndex + 1} of {numPosts}...</h4>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Please don't close this window.</p>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Check size={24} color="#16a34a" />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Generation Complete</h4>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>All posts have been drafted and scheduled.</p>
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
              <button onClick={handleStartGeneration} style={{ padding: "9px 24px", background: "#8b5cf6", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Wand2 size={16} /> Generate & Draft All
              </button>
            </>
          )}
          {step === 3 && currentIndex === numPosts && (
            <button onClick={() => { onGenerated(); resetAndClose(); }} style={{ padding: "9px 24px", background: "#0f172a", color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

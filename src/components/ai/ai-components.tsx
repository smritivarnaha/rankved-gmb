"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Wand2, RefreshCw, Check, AlertCircle, X, ExternalLink } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ─── AI Settings Tab ────────────────────────────────────────── */
export function AiSettingsTab({ locationId }: { locationId: string }) {
  const { data: settings, mutate } = useSWR(`/api/profiles/${locationId}/ai-settings`, fetcher);
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    aiInstructions: "",
    aiKeywords: "",
    aiTone: "Professional",
    aiCompetitorData: "",
    aiKeywordSequence: "",
    aiCurrentSequenceIndex: 0,
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

  if (!settings) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="anim-spin" /></div>;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
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

  const triggerGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
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
        locationId,
        summary: preview.content,
        topicType: preview.topicType || "STANDARD",
        status: "DRAFT",
        mediaUrl: preview.imageUrl,
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
                The AI will use your profile instructions, competitor style, and keyword sequence to create a post and a professional image.
              </p>
              <button 
                onClick={triggerGenerate}
                style={{ background: "#2563eb", color: "#fff", padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Wand2 size={16} /> Generate Post
              </button>
            </div>
          )}

          {generating && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Loader2 size={48} className="anim-spin" color="#2563eb" style={{ margin: "0 auto 20px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>AI is thinking...</p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Claude is drafting content and DALL-E is painting an image.</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 8 }}>Generated Content</label>
                <div style={{ padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, lineHeight: 1.6, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                  {preview.content}
                </div>
                
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>Post Type</label>
                    <div style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{preview.topicType}</div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>Call to Action</label>
                    <div style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{preview.ctaType || "None"}</div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 8 }}>AI Image</label>
                <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 10, background: "#f1f5f9", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <img src={preview.imageUrl} alt="AI Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>
                  DALL-E 3 generated based on Claude's content brief.
                </p>
              </div>
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

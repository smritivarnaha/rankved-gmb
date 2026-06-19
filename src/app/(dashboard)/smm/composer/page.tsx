"use client";

import { useState, useEffect, useRef } from "react";
import { useActiveClient } from "@/hooks/useActiveClient";
import Link from "next/link";
import { 
  Edit3, AlertCircle, ArrowRight, Image as ImageIcon, Upload, 
  Database, Check, Clock, Send, FileText, Trash2, Loader2, Play, 
  ChevronLeft, ChevronRight, X
} from "lucide-react";

const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Linkedin = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function SmmComposerPage() {
  const { activeClient, loading: loadingActive } = useActiveClient();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [attachedUrls, setAttachedUrls] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState("FACEBOOK");

  // Media library picker modal
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConnections = async () => {
    if (!activeClient) return;
    try {
      const res = await fetch(`/api/smm/connections?clientId=${activeClient.id}`);
      const data = await res.json();
      if (data.data) {
        setConnections(data.data);
        // Pre-select platforms that are connected
        const connectedPlatforms = data.data
          .filter((c: any) => c.status === "CONNECTED")
          .map((c: any) => c.platform);
        setSelectedPlatforms(connectedPlatforms);
        if (connectedPlatforms.length > 0) {
          setActivePreviewTab(connectedPlatforms[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeClient) {
      setLoading(true);
      fetchConnections().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeClient]);

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  // Upload local media and immediately attach
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClient) return;

    setSubmitting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result as string;
      const type = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
      try {
        const res = await fetch("/api/smm/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: activeClient.id,
            name: file.name,
            type,
            fileData
          })
        });
        const data = await res.json();
        if (data.data) {
          setAttachedUrls(prev => [...prev, data.data.url]);
        } else if (data.error) {
          alert(data.error);
        }
      } catch (err) {
        console.error(err);
        alert("Upload failed");
      } finally {
        setSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenMediaPicker = async () => {
    if (!activeClient) return;
    setMediaPickerOpen(true);
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/smm/media?clientId=${activeClient.id}`);
      const data = await res.json();
      if (data.data) {
        setMediaAssets(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSelectAsset = (url: string) => {
    setAttachedUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleRemoveAttached = (url: string) => {
    setAttachedUrls(prev => prev.filter(u => u !== url));
  };

  const handleSavePost = async (status: string) => {
    if (!activeClient) return;
    if (!caption.trim()) {
      alert("Post caption is required");
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one social media platform");
      return;
    }
    if (status === "SCHEDULED" && !scheduledAt) {
      alert("Please specify a scheduled date and time");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/smm/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          caption,
          hashtags,
          internalNotes,
          mediaUrls: attachedUrls,
          platforms: selectedPlatforms,
          status,
          scheduledAt: status === "SCHEDULED" ? scheduledAt : null
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(status === "PUBLISHED" 
          ? "Post successfully published!" 
          : status === "PENDING_APPROVAL" 
            ? "Post saved and sent for approval!"
            : status === "SCHEDULED"
              ? "Post scheduled successfully!"
              : "Draft saved successfully!"
        );
        // Reset composer
        setCaption("");
        setHashtags("");
        setInternalNotes("");
        setAttachedUrls([]);
        setScheduledAt("");
        setShowDatePicker(false);
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred saving post.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformAccount = (platform: string) => {
    return connections.find(c => c.platform === platform);
  };

  if (loadingActive) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (!activeClient) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 600, margin: "60px auto", padding: "0 16px" }}>
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Edit3 size={24} color="#7e22ce" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Select Client Workspace</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
            You must choose an active client workspace before composing social media updates.
          </p>
          <Link href="/smm/clients" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 42,
            padding: "0 20px",
            background: "#7e22ce",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none"
          }}>
            Choose SMM Client <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Content Composer</h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
          Create and schedule cross-platform posts for: <strong style={{ color: "#7e22ce" }}>{activeClient.name}</strong>
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 32 }} className="composer-grid">
          {/* Left panel: Post Composer */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.01)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Compose Update</h3>

            {/* Platform checkboxes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Select Platforms</label>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { id: "FACEBOOK", name: "Facebook", icon: Facebook, color: "#1877F2" },
                  { id: "INSTAGRAM", name: "Instagram", icon: Instagram, color: "#E1306C" },
                  { id: "LINKEDIN", name: "LinkedIn", icon: Linkedin, color: "#0A66C2" }
                ].map(plat => {
                  const conn = getPlatformAccount(plat.id);
                  const isConnected = conn && conn.status === "CONNECTED";
                  const isSelected = selectedPlatforms.includes(plat.id);
                  const Icon = plat.icon;

                  return (
                    <button
                      key={plat.id}
                      type="button"
                      disabled={!isConnected}
                      onClick={() => handleTogglePlatform(plat.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: 38,
                        padding: "0 14px",
                        borderRadius: 8,
                        border: isSelected 
                          ? `2px solid ${plat.color}` 
                          : "1px solid #e2e8f0",
                        background: isSelected ? `${plat.color}0a` : "#fff",
                        color: isSelected ? plat.color : isConnected ? "#475569" : "#cbd5e1",
                        cursor: isConnected ? "pointer" : "not-allowed",
                        opacity: isConnected ? 1 : 0.5,
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.15s"
                      }}
                      title={!isConnected ? `Connect ${plat.name} first in Connections` : plat.name}
                    >
                      <Icon size={16} color={isSelected ? plat.color : isConnected ? "#64748b" : "#cbd5e1"} />
                      {plat.name}
                      {isSelected && <Check size={14} color={plat.color} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Caption *</label>
                <span style={{ fontSize: 11, color: caption.length > 2000 ? "#ef4444" : "#94a3b8", fontWeight: 500 }}>
                  {caption.length} characters
                </span>
              </div>
              <textarea
                placeholder="What would you like to share? Write your clinic updates, doctor profile tips, or patient guidelines..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={{
                  width: "100%",
                  height: 150,
                  padding: 14,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  fontSize: 13,
                  resize: "none",
                  lineHeight: 1.5,
                  outline: "none"
                }}
                required
              />
            </div>

            {/* Hashtags & Internal Notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Hashtags</label>
                <input
                  type="text"
                  placeholder="#healthcare #orthopedics"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Internal Notes (Private)</label>
                <input
                  type="text"
                  placeholder="Need review on clinic phone number"
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Media Upload and Attach */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Media Attachments</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: "none" }}
                  accept="image/*,video/*"
                />
                <button
                  type="button"
                  onClick={handleUploadClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    padding: "0 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    background: "#f8fafc"
                  }}
                >
                  <Upload size={14} /> Upload File
                </button>
                <button
                  type="button"
                  onClick={handleOpenMediaPicker}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    padding: "0 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#7e22ce",
                    cursor: "pointer",
                    background: "#fdf4ff"
                  }}
                >
                  <Database size={14} /> Choose from Library
                </button>
              </div>

              {/* Attached list preview */}
              {attachedUrls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {attachedUrls.map((url, idx) => (
                    <div key={idx} style={{ position: "relative", width: 70, height: 70, borderRadius: 8, overflow: "hidden", border: "1px solid #cbd5e1" }}>
                      <img src={url} alt="attached" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttached(url)}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: 10
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date time scheduler panel */}
            {showDatePicker && (
              <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #cbd5e1", marginBottom: 24 }} className="anim-fade-up">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Schedule Publish Date & Time</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{ height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                  />
                  <button 
                    onClick={() => setShowDatePicker(false)}
                    style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleSavePost("DRAFT")}
                  disabled={submitting}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer"
                  }}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePost("PENDING_APPROVAL")}
                  disabled={submitting}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    border: "1px solid #ddd6fe",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7e22ce",
                    background: "#fdf4ff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <FileText size={14} /> Send for Approval
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDatePicker(true);
                    if (!scheduledAt) {
                      // Set default time to 24h from now
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                      tomorrow.setMinutes(0);
                      setScheduledAt(tomorrow.toISOString().slice(0, 16));
                    }
                  }}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Clock size={14} /> Schedule
                </button>
                
                {showDatePicker ? (
                  <button
                    type="button"
                    onClick={() => handleSavePost("SCHEDULED")}
                    disabled={submitting}
                    style={{
                      height: 38,
                      padding: "0 16px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Confirm Schedule
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSavePost("PUBLISHED")}
                    disabled={submitting}
                    style={{
                      height: 38,
                      padding: "0 16px",
                      background: "#7e22ce",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Publish Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Social Post Live Preview simulation */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Live Preview</h3>
            
            {/* Preview tabs */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 8, gap: 2, marginBottom: 16 }}>
              {selectedPlatforms.length === 0 ? (
                <span style={{ fontSize: 12, color: "#64748b", padding: "6px 12px", fontStyle: "italic" }}>No platform selected</span>
              ) : (
                selectedPlatforms.map(plat => (
                  <button
                    key={plat}
                    onClick={() => setActivePreviewTab(plat)}
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "5px 0",
                      borderRadius: 6,
                      background: activePreviewTab === plat ? "#fff" : "transparent",
                      color: activePreviewTab === plat 
                        ? plat === "FACEBOOK" ? "#1877F2" : plat === "INSTAGRAM" ? "#E1306C" : "#0A66C2"
                        : "#64748b",
                      cursor: "pointer",
                      border: "none",
                      boxShadow: activePreviewTab === plat ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                    }}
                  >
                    {plat.charAt(0) + plat.slice(1).toLowerCase()}
                  </button>
                ))
              )}
            </div>

            {/* Post Mock Rendering Box */}
            {selectedPlatforms.includes(activePreviewTab) && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                
                {/* ─── Facebook Preview ─── */}
                {activePreviewTab === "FACEBOOK" && (
                  <div style={{ padding: 16 }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <img 
                        src={getPlatformAccount("FACEBOOK")?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=FB`} 
                        alt="FB avatar" 
                        style={{ width: 38, height: 38, borderRadius: "50%", background: "#f1f5f9" }}
                      />
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#1c1e21", margin: 0 }}>
                          {getPlatformAccount("FACEBOOK")?.accountName || "Facebook Page Name"}
                        </h4>
                        <p style={{ fontSize: 11, color: "#606770", margin: 0 }}>Just now · Public 🌎</p>
                      </div>
                    </div>
                    {/* Content */}
                    <p style={{ fontSize: 13, color: "#1c1e21", lineHeight: 1.5, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
                      {caption || "Write a caption to see preview..."} {hashtags}
                    </p>
                    {/* Media */}
                    {attachedUrls.length > 0 && (
                      <div style={{ width: "100%", borderRadius: 6, overflow: "hidden", border: "1px solid #dddfe2" }}>
                        <img src={attachedUrls[0]} alt="preview" style={{ width: "100%", objectFit: "contain", maxHeight: 300 }} />
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Instagram Preview ─── */}
                {activePreviewTab === "INSTAGRAM" && (
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 12 }}>
                      <img 
                        src={getPlatformAccount("INSTAGRAM")?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=IG`} 
                        alt="IG avatar" 
                        style={{ width: 30, height: 30, borderRadius: "50%", background: "#f1f5f9" }}
                      />
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#262626", margin: 0 }}>
                        {getPlatformAccount("INSTAGRAM")?.accountName || "instagram_profile"}
                      </h4>
                    </div>
                    {/* Media */}
                    <div style={{ width: "100%", paddingTop: "100%", background: "#fafafa", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {attachedUrls.length > 0 ? (
                          <img src={attachedUrls[0]} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <ImageIcon size={48} color="#cbd5e1" />
                        )}
                      </div>
                    </div>
                    {/* Bottom bar */}
                    <div style={{ padding: 12 }}>
                      <p style={{ fontSize: 13, color: "#262626", margin: 0, lineHeight: 1.5 }}>
                        <strong style={{ marginRight: 6 }}>
                          {getPlatformAccount("INSTAGRAM")?.accountName || "instagram_profile"}
                        </strong>
                        <span style={{ whiteSpace: "pre-wrap" }}>{caption || "Write a caption..."} {hashtags}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ─── LinkedIn Preview ─── */}
                {activePreviewTab === "LINKEDIN" && (
                  <div style={{ padding: 16 }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <img 
                        src={getPlatformAccount("LINKEDIN")?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=LI`} 
                        alt="LI avatar" 
                        style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9" }}
                      />
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#000000e6", margin: 0 }}>
                          {getPlatformAccount("LINKEDIN")?.accountName || "LinkedIn Organization Name"}
                        </h4>
                        <p style={{ fontSize: 11, color: "#00000099", margin: 0 }}>Company Page · Professional</p>
                      </div>
                    </div>
                    {/* Content */}
                    <p style={{ fontSize: 13, color: "#000000e6", lineHeight: 1.5, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
                      {caption || "Write a caption..."} {hashtags}
                    </p>
                    {/* Media */}
                    {attachedUrls.length > 0 && (
                      <div style={{ width: "100%", borderRadius: 4, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                        <img src={attachedUrls[0]} alt="preview" style={{ width: "100%", objectFit: "contain", maxHeight: 300 }} />
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "90%",
            maxWidth: 680,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: 24,
            position: "relative"
          }} className="anim-scale">
            <button 
              onClick={() => setMediaPickerOpen(false)}
              style={{ position: "absolute", right: 16, top: 16, color: "#64748b", cursor: "pointer" }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Select Media Assets</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Select existing graphics from client library to attach to this post.</p>

            <div style={{ flex: 1, overflowY: "auto", minHeight: 240, border: "1px solid #cbd5e1", borderRadius: 8, padding: 12 }}>
              {loadingMedia ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Loader2 className="animate-spin text-purple-600" size={24} />
                </div>
              ) : mediaAssets.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: 40, textAlign: "center" }}>
                  <ImageIcon size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13, color: "#64748b" }}>Your media library is empty. Please upload assets first or select files locally.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {mediaAssets.map((asset) => {
                    const isAttached = attachedUrls.includes(asset.url);
                    return (
                      <div 
                        key={asset.id} 
                        onClick={() => handleSelectAsset(asset.url)}
                        style={{
                          position: "relative",
                          aspectRatio: "1/1",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: isAttached ? "3px solid #7e22ce" : "1px solid #e2e8f0",
                          cursor: "pointer",
                          background: "#fafafa"
                        }}
                      >
                        {asset.type === "IMAGE" ? (
                          <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <FileText size={24} color="#94a3b8" />
                          </div>
                        )}
                        {isAttached && (
                          <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(126, 34, 206, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#7e22ce", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Check size={12} color="#fff" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button 
                onClick={() => setMediaPickerOpen(false)}
                style={{
                  height: 38,
                  padding: "0 20px",
                  background: "#7e22ce",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none"
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

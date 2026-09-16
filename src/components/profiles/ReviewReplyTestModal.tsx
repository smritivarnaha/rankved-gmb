"use client";

import { useState, useEffect } from "react";
import {
  X, Star, Sparkles, Send, Copy, Check, RefreshCw, MessageSquare,
  AlertCircle, ThumbsUp, ShieldAlert, BookOpen, User, Building2,
  CheckCircle2, ArrowRight, Zap, Info
} from "lucide-react";
import useSWR from "swr";

interface ReviewReplyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfileId?: string;
  onOpenTemplatesModal?: () => void;
}

const PRESET_SCENARIOS = [
  {
    label: "🔴 1★ Wait Time Delay",
    rating: 1,
    reviewer: "Amit Kumar",
    text: "I had an appointment booked for 11:00 AM, but I had to wait for more than 1.5 hours without any update from the staff. Very frustrating experience.",
  },
  {
    label: "🔴 1★ Doctor Communication",
    rating: 1,
    reviewer: "Priya Mehra",
    text: "Doctor barely spent 2 minutes with us and didn't explain the diagnosis or medicines properly. Felt rushed and unheard.",
  },
  {
    label: "🔴 2★ Front Desk / Staff",
    rating: 2,
    reviewer: "Rohan Verma",
    text: "The consultation was ok but the reception staff was extremely rude and billing took forever.",
  },
  {
    label: "🔴 1★ Star Only (No Text)",
    rating: 1,
    reviewer: "Google User",
    text: "",
  },
  {
    label: "🟡 3★ Average / Mixed Visit",
    rating: 3,
    reviewer: "Vikram Malhotra",
    text: "The doctor is experienced, but the waiting room was very crowded and parking was difficult.",
  },
  {
    label: "🟡 3★ Concise Feedback",
    rating: 3,
    reviewer: "Sunita Joshi",
    text: "Decent consultation, but expected a bit more detailed explanation.",
  },
  {
    label: "🟢 5★ Doctor Guidance",
    rating: 5,
    reviewer: "Dr. Ananya Sen",
    text: "The doctor explained the root cause of my condition so clearly and guided us step by step. Truly reassuring and compassionate care!",
  },
  {
    label: "🟢 5★ Staff & Clinic Excellence",
    rating: 5,
    reviewer: "Rajesh Kapoor",
    text: "Extremely clean clinic, polite nursing staff, and very well coordinated appointment. Highly recommend to everyone!",
  },
  {
    label: "🟢 5★ Surgery & Recovery",
    rating: 5,
    reviewer: "Harpreet Singh",
    text: "Underwent spine surgery here under the expert team. My recovery has been smooth and pain-free. Thank you so much!",
  },
  {
    label: "🟢 5★ Family Recommendation",
    rating: 5,
    reviewer: "Meenakshi Gupta",
    text: "Our entire family has trusted this practice for years. The doctors and staff treat every patient like family.",
  },
];

export function ReviewReplyTestModal({
  isOpen,
  onClose,
  initialProfileId,
  onOpenTemplatesModal
}: ReviewReplyTestModalProps) {
  const { data: profilesData } = useSWR("/api/profiles", (url: string) => fetch(url).then(r => r.json()));
  const profiles = profilesData?.data || profilesData?.profiles || [];

  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfileId || "mock-custom");
  const [reviewerName, setReviewerName] = useState<string>("Rahul Sharma");
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("The doctor explained the root cause of my condition clearly and guided us step by step. Truly reassuring care!");
  const [preferredTone, setPreferredTone] = useState<"WARM" | "SHORT" | "SEO_FOCUSED">("WARM");

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"WARM" | "SHORT" | "SEO_FOCUSED">("WARM");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId);
    } else if (profiles.length > 0 && selectedProfileId === "mock-custom") {
      setSelectedProfileId(profiles[0].id);
    }
  }, [initialProfileId, profiles]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setRating(preset.rating);
    setReviewerName(preset.reviewer);
    setReviewText(preset.text);
  };

  const handleRunTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const selectedLoc = profiles.find((p: any) => p.id === selectedProfileId);
      const res = await fetch("/api/reviews/test-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfileId === "mock-custom" ? undefined : selectedProfileId,
          reviewText,
          reviewerName,
          rating,
          preferredTone,
          customBusinessName: selectedLoc?.name || "LifeCare Neurology & Spine Clinic",
          customCityOrArea: selectedLoc?.address ? selectedLoc.address.split(",")[0] : "Mohali",
          customTargetKeyword: "neurologist in Mohali",
          customPhone: selectedLoc?.phone || "+91 98765 43210",
          customEmail: selectedLoc?.googleEmail || "care@lifecareclinic.com",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setActiveTab(preferredTone);
      } else {
        alert(data.error || "Failed to generate test reply");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error generating test reply: " + (err.message || "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, tabKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const selectedLoc = profiles.find((p: any) => p.id === selectedProfileId);
  const currentBusinessName = result?.clinicMeta?.businessName || selectedLoc?.name || "LifeCare Clinic";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 960,
        maxHeight: "92vh",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)"
            }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Review Auto-Reply Tester & Simulator
                </h2>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: "#dbeafe",
                  color: "#1e40af",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  Live AI + 15 Templates
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                Simulate any customer review scenario, test AI generation & dynamic template auto-selection with 100% accuracy.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {onOpenTemplatesModal && (
              <button
                onClick={onOpenTemplatesModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #bfdbfe",
                  background: "#ffffff",
                  color: "#2563eb",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <BookOpen size={14} /> View 15 Templates
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: 24,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          background: "#f8fafc"
        }}>
          {/* Top Quick Scenarios */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
              ⚡ 1-Click Test Scenarios (Pick one to auto-fill):
            </label>
            <div style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}>
              {PRESET_SCENARIOS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: preset.rating <= 2 
                      ? "1px solid #fecaca" 
                      : preset.rating === 3 
                      ? "1px solid #fde68a" 
                      : "1px solid #bbf7d0",
                    background: preset.rating <= 2 
                      ? "#fef2f2" 
                      : preset.rating === 3 
                      ? "#fffbeb" 
                      : "#f0fdf4",
                    color: preset.rating <= 2 
                      ? "#b91c1c" 
                      : preset.rating === 3 
                      ? "#b45309" 
                      : "#15803d",
                    transition: "all 0.15s"
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            background: "#ffffff",
            padding: 18,
            borderRadius: 14,
            border: "1px solid #e2e8f0"
          }}>
            {/* Target Profile */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                🏥 Test Google Profile / Clinic
              </label>
              <select
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                  outline: "none"
                }}
              >
                <option value="mock-custom">🏥 Demo / Simulated Clinic (LifeCare Neurology & Spine)</option>
                {profiles.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.address ? `(${p.address.split(",")[0]})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Reviewer Name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                👤 Reviewer Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                placeholder="e.g. Dr. Rahul Sharma or Anonymous"
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Star Rating Buttons */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                ⭐ Star Rating ({rating} {rating === 1 ? "Star" : "Stars"})
              </label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const isSelected = rating === s;
                  const isLow = s <= 2;
                  const isNeutral = s === 3;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 8,
                        border: isSelected 
                          ? (isLow ? "2px solid #ef4444" : isNeutral ? "2px solid #f59e0b" : "2px solid #10b981")
                          : "1px solid #e2e8f0",
                        background: isSelected 
                          ? (isLow ? "#fef2f2" : isNeutral ? "#fffbeb" : "#f0fdf4")
                          : "#f8fafc",
                        color: isSelected 
                          ? (isLow ? "#dc2626" : isNeutral ? "#d97706" : "#16a34a")
                          : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.1s"
                      }}
                    >
                      <Star size={14} fill={isSelected ? "currentColor" : "none"} />
                      {s}★
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone Preference */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                🎨 Preferred Tone
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "WARM", label: "Warm & Empathetic" },
                  { id: "SHORT", label: "Short & Direct" },
                  { id: "SEO_FOCUSED", label: "SEO Authority" },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPreferredTone(t.id as any)}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: 8,
                      border: preferredTone === t.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: preferredTone === t.id ? "#eff6ff" : "#f8fafc",
                      color: preferredTone === t.id ? "#1d4ed8" : "#64748b",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.1s"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Review Textarea */}
          <div style={{
            background: "#ffffff",
            padding: 18,
            borderRadius: 14,
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                💬 Customer Review Comment (leave blank for star-only rating):
              </label>
              <button
                type="button"
                onClick={() => setReviewText("")}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
              >
                Clear text
              </button>
            </div>
            <textarea
              rows={3}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Enter or paste review text..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: 13,
                color: "#1e293b",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                lineHeight: 1.5
              }}
            />

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleRunTest}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.15s"
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Generating Test Reply...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> 🚀 Run Reply Test
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Results Section */}
          {result && (
            <div style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #bfdbfe",
              boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.1)",
              overflow: "hidden"
            }}>
              {/* Results Diagnostics Bar */}
              <div style={{
                padding: "14px 20px",
                background: "#eff6ff",
                borderBottom: "1px solid #dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Sentiment Badge */}
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800,
                    background: result.sentiment === "NEGATIVE" ? "#fee2e2" : result.sentiment === "NEUTRAL" ? "#fef3c7" : "#dcfce7",
                    color: result.sentiment === "NEGATIVE" ? "#991b1b" : result.sentiment === "NEUTRAL" ? "#92400e" : "#166534",
                    border: `1px solid ${result.sentiment === "NEGATIVE" ? "#fca5a5" : result.sentiment === "NEUTRAL" ? "#fde68a" : "#86efac"}`
                  }}>
                    {result.sentiment === "NEGATIVE" ? "🔴 Negative (1-2★)" : result.sentiment === "NEUTRAL" ? "🟡 Neutral (3★)" : "🟢 Positive (4-5★)"}
                  </span>

                  {/* Matched Dynamic Template */}
                  {result.smartTemplate && (
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#ffffff",
                      color: "#1e40af",
                      border: "1px solid #bfdbfe",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <BookOpen size={12} /> Template: {result.smartTemplate.title} ({result.smartTemplate.id})
                    </span>
                  )}

                  {/* Target SEO Keyword */}
                  {result.keywordUsed && (
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1"
                    }}>
                      🎯 Keyword: <strong>{result.keywordUsed}</strong>
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>
                  Source: {result.source === "AI_ENGINE" ? "✨ AI Generated (with fallback grounding)" : "📋 15 Dynamic Templates Engine"}
                </div>
              </div>

              {/* Variations Tabs */}
              <div style={{
                padding: "10px 20px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fafafa",
                display: "flex",
                gap: 8,
                alignItems: "center"
              }}>
                {[
                  { key: "WARM", label: "Option 1: Warm & Empathetic", count: result.allWordCounts?.warm },
                  { key: "SHORT", label: "Option 2: Short & Direct", count: result.allWordCounts?.short },
                  { key: "SEO_FOCUSED", label: "Option 3: SEO Authority", count: result.allWordCounts?.seoFocused },
                ].map(tab => {
                  const isCurrent = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: isCurrent ? "1px solid #2563eb" : "1px solid #e2e8f0",
                        background: isCurrent ? "#2563eb" : "#ffffff",
                        color: isCurrent ? "#ffffff" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {tab.label}
                      <span style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 10,
                        background: isCurrent ? "#1d4ed8" : "#f1f5f9",
                        color: isCurrent ? "#ffffff" : "#64748b"
                      }}>
                        {tab.count || 0} words
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Reply Output Box */}
              <div style={{ padding: 20 }}>
                {(() => {
                  const activeReplyText = result.options?.[activeTab === "WARM" ? "warm" : activeTab === "SHORT" ? "short" : "seoFocused"] || result.reply;
                  const wordCount = result.allWordCounts?.[activeTab === "WARM" ? "warm" : activeTab === "SHORT" ? "short" : "seoFocused"] || result.wordCount;

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Live Google Maps Realistic Preview */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                          🗺️ Live Google Maps Review & Reply Preview:
                        </div>
                        <div style={{
                          background: "#ffffff",
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          padding: 18,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                        }}>
                          {/* Reviewer Header */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#3b82f6",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14
                            }}>
                              {(reviewerName || "P").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                {reviewerName || "Valued Patient"}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={13}
                                    fill={i < rating ? "#f59e0b" : "none"}
                                    color={i < rating ? "#f59e0b" : "#cbd5e1"}
                                  />
                                ))}
                                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>Just now</span>
                              </div>
                            </div>
                          </div>

                          {/* Review Text */}
                          {reviewText && (
                            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                              "{reviewText}"
                            </p>
                          )}

                          {/* Owner Response Bubble */}
                          <div style={{
                            marginLeft: 16,
                            padding: "14px 16px",
                            borderRadius: 12,
                            background: "#f8fafc",
                            borderLeft: "4px solid #2563eb",
                            borderTop: "1px solid #f1f5f9",
                            borderRight: "1px solid #f1f5f9",
                            borderBottom: "1px solid #f1f5f9"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Building2 size={14} color="#2563eb" />
                                <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                                  Response from the owner ({currentBusinessName})
                                </span>
                              </div>
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>Just now</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                              {activeReplyText}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          📊 Word Count: <strong>{wordCount} words</strong> (Ideal range: 30–75 words)
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => handleCopy(activeReplyText, activeTab)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 16px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: copiedTab === activeTab ? "#16a34a" : "#1e293b",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            {copiedTab === activeTab ? <Check size={14} /> : <Copy size={14} />}
                            {copiedTab === activeTab ? "Copied to Clipboard!" : "Copy This Reply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            💡 <strong>Tip:</strong> Test different ratings (1★ vs 3★ vs 5★) to verify how tones and clinic info dynamically adjust.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#475569",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}

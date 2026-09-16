"use client";

import { useState, useEffect } from "react";
import { 
  X, Star, Copy, Check, Sparkles, MessageSquare, 
  ShieldAlert, ThumbsUp, AlertCircle, HelpCircle, Filter
} from "lucide-react";
import { REVIEW_TEMPLATES, ReviewTemplate, renderReviewTemplate } from "@/lib/review-templates";

interface ReviewTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (renderedText: string) => void;
  currentProfile?: {
    name: string;
    phone?: string;
    googleEmail?: string;
    address?: string;
  };
  reviewerName?: string;
  targetRating?: number;
}

export function ReviewTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  currentProfile,
  reviewerName = "Patient",
  targetRating
}: ReviewTemplatesModalProps) {
  const getInitialTier = (rating?: number): "ALL" | "LOW" | "NEUTRAL" | "HIGH" => {
    if (!rating) return "ALL";
    if (rating <= 2) return "LOW";
    if (rating === 3) return "NEUTRAL";
    return "HIGH";
  };

  const [activeTier, setActiveTier] = useState<"ALL" | "LOW" | "NEUTRAL" | "HIGH">(getInitialTier(targetRating));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTier(getInitialTier(targetRating));
    }
  }, [isOpen, targetRating]);

  if (!isOpen) return null;

  const filteredTemplates = REVIEW_TEMPLATES.filter(t => {
    if (activeTier === "ALL") return true;
    return t.tier === activeTier;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "LOW":
        return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "1-2★ Low Review" };
      case "NEUTRAL":
        return { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "3★ Neutral Review" };
      case "HIGH":
        return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "4-5★ High Review" };
      default:
        return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Template" };
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 820,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh"
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fafafa"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#eff6ff", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#2563eb"
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                15 Dynamic Auto-Reply Review Templates
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                100% accurate, sentiment-graded templates with dynamic placeholder interpolation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          padding: "12px 24px",
          borderBottom: "1px solid #f1f5f9",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap"
        }}>
          {[
            { id: "ALL", label: `All 15 Templates (${REVIEW_TEMPLATES.length})` },
            { id: "HIGH", label: "⭐⭐⭐⭐⭐ High (4-5★) · 6 Templates" },
            { id: "NEUTRAL", label: "⭐⭐⭐ Neutral (3★) · 4 Templates" },
            { id: "LOW", label: "⭐ / ⭐⭐ Low (1-2★) · 5 Templates" },
          ].map(tab => {
            const isActive = activeTier === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTier(tab.id as any)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `1px solid ${isActive ? "#2563eb" : "#e2e8f0"}`,
                  background: isActive ? "#2563eb" : "#f8fafc",
                  color: isActive ? "#ffffff" : "#475569",
                  transition: "all 0.15s"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Templates List */}
        <div style={{
          padding: "20px 24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: "#f8fafc"
        }}>
          {filteredTemplates.map((item, idx) => {
            const badge = getTierBadge(item.tier);
            const renderedPreview = renderReviewTemplate({
              template: item.template,
              reviewerName: reviewerName || "Dr. Sharma",
              businessName: currentProfile?.name || "LifeCare Neurology & Spine Clinic",
              cityOrArea: currentProfile?.address ? currentProfile.address.split(",")[0] : "Mohali",
              targetKeyword: "neurologist in Mohali",
              contactPhone: currentProfile?.phone || "+91 98765 43210",
              contactEmail: currentProfile?.googleEmail || "care@clinic.com"
            });

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color 0.15s"
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                      {idx + 1}. {item.title}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>
                      {item.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleCopy(renderedPreview, item.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: copiedId === item.id ? "#16a34a" : "#475569",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                      title="Copy rendered template text"
                    >
                      {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </button>

                    {onSelectTemplate && (
                      <button
                        onClick={() => {
                          onSelectTemplate(renderedPreview);
                          onClose();
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        <Sparkles size={12} /> Use Template
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                  {item.description}
                </p>

                {/* Rendered Preview Box */}
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#1e293b",
                  lineHeight: 1.6
                }}>
                  "{renderedPreview}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Showing <strong>{filteredTemplates.length}</strong> of 15 dynamic templates
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#475569",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

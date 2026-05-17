"use client";

import { 
  CheckCircle2, Search, TrendingUp, MessageSquare, ShieldCheck, 
  AlertCircle, Star, Eye, LayoutDashboard, ArrowUpRight, Sparkles
} from "lucide-react";

// ─── Score config ─────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 50) return "Needs Work";
  return "Critical";
}

export function AuditDashboard({ auditData, isPublic = false }: { auditData: any, isPublic?: boolean }) {
  if (!auditData) return null;
  const checklist = auditData.checklist || {};

  const metrics = [
    { label: "Profile Quality", value: auditData.completionScore, suffix: "%", icon: ShieldCheck, sub: "Completion Score" },
    { label: "Visibility Score", value: auditData.visibilityScore, suffix: "%", icon: Eye, sub: "Search Index" },
    { label: "Reply Rate", value: auditData.replyRate, suffix: "%", icon: MessageSquare, sub: "Review Responses" },
    { label: "Review Velocity", value: auditData.reviewsPerWeek, suffix: "", icon: TrendingUp, sub: "Per Week" },
  ];

  const checkItems = [
    { key: "businessName", label: "Business Name" },
    { key: "address", label: "Address & Location" },
    { key: "phone", label: "Primary Phone Number" },
    { key: "website", label: "Website URL" },
    { key: "hours", label: "Business Hours" },
    { key: "description", label: "Business Description" },
    { key: "category", label: "Primary Category" },
    { key: "__verified", label: "Verified Business Status", forceTrue: true },
  ];

  const passed = checkItems.filter(i => i.forceTrue || checklist[i.key]).length;
  const total  = checkItems.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @keyframes barGrow { from { width: 0 } }
        .audit-bar { animation: barGrow 0.9s ease-out forwards; }
        .audit-check-row:hover { background: #f8fafc !important; }
        .audit-metric-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
        .audit-metric-card { transition: box-shadow 0.2s, transform 0.2s; }
        @media (max-width: 700px) {
          .audit-metric-row { grid-template-columns: 1fr 1fr !important; }
          .audit-body-grid { flex-direction: column !important; }
        }
      `}</style>

      {/* ── 4 Metric Cards ──────────────────────────────────────────────── */}
      <div className="audit-metric-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        {metrics.map(m => {
          const color = getScoreColor(typeof m.value === "number" ? m.value : 0);
          const label = typeof m.value === "number" && m.suffix === "%" ? getScoreLabel(m.value) : "";
          return (
            <div key={m.label} className="audit-metric-card" style={{
              background: "#fff", border: "1px solid #eaeaea", borderRadius: 12,
              padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.icon style={{ width: 15, height: 15, color: "#64748b" }} />
                </div>
                {label && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                    padding: "2px 8px", borderRadius: 20, textTransform: "uppercase",
                    background: color + "18", color
                  }}>{label}</span>
                )}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1, marginBottom: 4 }}>
                {m.value}{m.suffix}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.label}</div>
              <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 2 }}>{m.sub}</div>
              {m.suffix === "%" && typeof m.value === "number" && (
                <div style={{ marginTop: 10, height: 3, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                  <div className="audit-bar" style={{ height: "100%", width: `${m.value}%`, background: color, borderRadius: 10 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Body: Checklist + Sidebar ────────────────────────────────────── */}
      <div className="audit-body-grid" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        
        {/* Left: Checklist */}
        <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Audit Checklist</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{passed} of {total} optimizations complete</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: getScoreColor(Math.round(passed / total * 100)),
                  background: getScoreColor(Math.round(passed / total * 100)) + "18",
                  padding: "3px 10px", borderRadius: 20
                }}>{Math.round(passed / total * 100)}%</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck style={{ width: 14, height: 14, color: "#64748b" }} />
                </div>
              </div>
            </div>

            {/* Rows */}
            <div>
              {checkItems.map(item => {
                const ok = item.forceTrue || !!checklist[item.key];
                return (
                  <div key={item.key} className="audit-check-row" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 18px", borderBottom: "1px solid #f8fafc", background: "#fff"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {ok
                        ? <CheckCircle2 style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />
                        : <AlertCircle style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 13, fontWeight: 500, color: ok ? "#0f172a" : "#64748b" }}>{item.label}</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                      padding: "2px 8px", borderRadius: 20,
                      background: ok ? "#ecfdf5" : "#fef2f2",
                      color: ok ? "#059669" : "#dc2626"
                    }}>{ok ? "Optimized" : "Missing"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Insight strip */}
          <div style={{
            background: "#0f172a", borderRadius: 12, padding: "18px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Strategic Insight</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>
                Fill {total - passed} missing {total - passed === 1 ? "field" : "fields"} to boost your visibility score.
              </div>
            </div>
            <button style={{
              flexShrink: 0, height: 36, padding: "0 16px",
              background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
              fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
            }}>
              Growth Plan
            </button>
          </div>
        </div>

        {/* Right: Reputation Health + Download */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Reputation Health</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <GaugeRow label="Avg Rating" value={auditData.averageRating} max={5} color="#f59e0b" suffix=" ★" />
              <GaugeRow label="Total Reviews" value={auditData.totalReviews} max={Math.max(100, auditData.totalReviews)} color="#3b82f6" />
              <GaugeRow label="Reply Rate" value={auditData.replyRate} max={100} color="#10b981" suffix="%" />
              <GaugeRow label="Weekly Velocity" value={auditData.reviewsPerWeek} max={Math.max(5, auditData.reviewsPerWeek)} color="#8b5cf6" />
            </div>
          </div>

          {/* Ratings badge */}
          <div style={{
            background: "#fff", border: "1px solid #eaeaea", borderRadius: 12,
            padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
          }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Overall Rating</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{auditData.averageRating}</div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} style={{ width: 12, height: 12, color: i <= Math.round(auditData.averageRating) ? "#f59e0b" : "#e2e8f0", fill: i <= Math.round(auditData.averageRating) ? "#f59e0b" : "#e2e8f0" }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{auditData.totalReviews} reviews</div>
              </div>
            </div>
          </div>

          {/* Download CTA */}
          <div style={{
            background: "#6366f1", borderRadius: 12, padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LayoutDashboard style={{ width: 18, height: 18, color: "#fff" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Download Report</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Share with client</div>
              </div>
            </div>
            <ArrowUpRight style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeRow({ label, value, max, color, suffix = "" }: any) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div className="audit-bar" style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

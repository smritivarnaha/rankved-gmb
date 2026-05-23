"use client";

import { CheckCircle2, TrendingUp, MessageSquare, ShieldCheck, AlertCircle, Star, Eye, Sparkles, Camera, Calendar, Award } from "lucide-react";

function getScoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}
function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 50) return "Needs Work";
  return "Critical";
}

function CircularGauge({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2, textAlign: "center" }}>{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color, suffix = "" }: any) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: "#64748b" }}>{label}</span>
        <span style={{ color: "#0f172a" }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function StarBar({ rating }: { rating: number }) {
  const rows = [
    { s: 5, pct: rating >= 4.5 ? 80 : rating >= 4 ? 62 : 38 },
    { s: 4, pct: rating >= 4.5 ? 13 : rating >= 4 ? 22 : 24 },
    { s: 3, pct: rating >= 4.5 ? 4  : rating >= 4 ? 9  : 16 },
    { s: 2, pct: rating >= 4.5 ? 2  : rating >= 4 ? 4  : 12 },
    { s: 1, pct: rating >= 4.5 ? 1  : rating >= 4 ? 3  : 10 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
      {rows.map(r => (
        <div key={r.s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", width: 8 }}>{r.s}</span>
          <Star style={{ width: 11, height: 11, color: "#f59e0b", fill: "#f59e0b", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${r.pct}%`, background: "linear-gradient(90deg,#fbbf24,#f59e0b)", borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 10, color: "#94a3b8", width: 28, textAlign: "right" }}>{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}

export function AuditDashboard({ auditData, isPublic = false, publicData = null }: { auditData: any; isPublic?: boolean; publicData?: any }) {
  if (!auditData) return null;
  const checklist = auditData.checklist || {};

  const checkItems = [
    { key: "businessName",         label: "Business Name",          desc: "Identity & branding" },
    { key: "address",              label: "Address & Location",      desc: "Storefront presence" },
    { key: "phone",                label: "Primary Phone Number",    desc: "Direct call link" },
    { key: "website",              label: "Website URL",             desc: "Authority link" },
    { key: "hours",                label: "Business Hours",          desc: "Schedule clarity" },
    { key: "description",          label: "Profile Description",     desc: "SEO keyword pitch" },
    { key: "category",             label: "Primary Category",        desc: "Search index match" },
    { key: "additionalCategories", label: "Secondary Categories",    desc: "Broader discovery" },
    { key: "specialHours",         label: "Special/Holiday Hours",   desc: "Active management" },
    { key: "serviceArea",          label: "Service Area",            desc: "Local reach bounds" },
    { key: "photos",               label: "Photos (10+)",            desc: "Visual trust proof" },
    { key: "googlePosts",          label: "Recent Post Activity",    desc: "Activity signal" },
  ];

  const passed = checkItems.filter(i => checklist[i.key]).length;
  const total  = checkItems.length;
  const passedPct = Math.round((passed / total) * 100);
  const rawReviews = auditData.reviewsList || publicData?.reviews || [];

  const CS = {
    card:   { background: "#fff", border: "1px solid #eaeaea", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden" } as React.CSSProperties,
    head:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9" } as React.CSSProperties,
    body:   { padding: "16px 20px" } as React.CSSProperties,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "Inter,-apple-system,sans-serif" }}>
      <style>{`
        @keyframes auditBarGrow { from { width: 0 } }
        .aud-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07) !important; transform: translateY(-1px); }
        .aud-card { transition: box-shadow 0.2s, transform 0.2s; }
        .aud-chk:hover { background: #fafafa !important; }
        @media (max-width:680px) {
          .aud-metrics { grid-template-columns: 1fr 1fr !important; }
          .aud-body    { flex-direction: column !important; }
          .aud-chk-grid { grid-template-columns: 1fr !important; }
        }
        @media print {
          .no-print { display: none !important; }
          .aud-card  { box-shadow: none !important; break-inside: avoid; }
        }
      `}</style>

      {/* ── 4 Metric Cards ── */}
      <div className="aud-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Profile Quality",  value: auditData.completionScore, suffix: "%", sub: "Completion Score", icon: ShieldCheck },
          { label: "Visibility Score", value: auditData.visibilityScore,  suffix: "%", sub: "Search Index",     icon: Eye },
          { label: "Reply Rate",       value: auditData.replyRate,        suffix: "%", sub: "Review Responses", icon: MessageSquare },
          { label: "Review Velocity",  value: auditData.reviewsPerWeek,   suffix: "/wk", sub: "Per Week",       icon: TrendingUp },
        ].map(m => {
          const color = m.suffix === "%" ? getScoreColor(m.value) : "#8b5cf6";
          return (
            <div key={m.label} className="aud-card" style={{ ...CS.card, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", lineHeight: 1, marginBottom: 3 }}>{m.value}{m.suffix}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.sub}</div>
              </div>
              {m.suffix === "%" ? (
                <CircularGauge score={m.value} color={color} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <m.icon style={{ width: 20, height: 20, color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Main Body ── */}
      <div className="aud-body" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* Left Column */}
        <div style={{ flex: "0 0 62%", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* SEO Checklist */}
          <div className="aud-card" style={CS.card}>
            <div style={CS.head}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>SEO Optimization Checklist</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{passed} of {total} ranking signals complete</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: getScoreColor(passedPct), background: getScoreColor(passedPct) + "18", padding: "3px 10px", borderRadius: 99 }}>{passedPct}%</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck style={{ width: 14, height: 14, color: "#64748b" }} />
                </div>
              </div>
            </div>
            <div className="aud-chk-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {checkItems.map((item, idx) => {
                const ok = !!checklist[item.key];
                return (
                  <div key={item.key} className="aud-chk" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 18px", borderBottom: "1px solid #f8fafc",
                    borderRight: idx % 2 === 0 ? "1px solid #f8fafc" : "none", background: "#fff"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {ok
                        ? <CheckCircle2 style={{ width: 15, height: 15, color: "#10b981", flexShrink: 0 }} />
                        : <AlertCircle  style={{ width: 15, height: 15, color: "#ef4444", flexShrink: 0 }} />
                      }
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: ok ? "#0f172a" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.3 }}>{item.desc}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 99, flexShrink: 0, marginLeft: 6,
                      background: ok ? "#ecfdf5" : "#fef2f2", color: ok ? "#059669" : "#dc2626" }}>
                      {ok ? "Done" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Insight Strip */}
          <div style={{ background: "#0f172a", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }} className="no-print">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles style={{ width: 18, height: 18, color: "#818cf8" }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Local Growth Multiplier</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4 }}>
                  {total - passed > 0
                    ? `Fill ${total - passed} missing signals to unlock up to 35% more local visibility.`
                    : "Fully optimized! Keep posting weekly to sustain your rankings."}
                </div>
              </div>
            </div>
            <button onClick={() => window.open(isPublic ? "/connect" : "https://business.google.com", "_blank")}
              style={{ flexShrink: 0, height: 38, padding: "0 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {isPublic ? "Connect Profile" : "Improve Profile"}
            </button>
          </div>

          {/* Reviews Feed */}
          <div className="aud-card" style={CS.card}>
            <div style={CS.head}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Recent Customer Reviews Audit</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Reply rate & sentiment health check</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare style={{ width: 14, height: 14, color: "#64748b" }} />
              </div>
            </div>
            {rawReviews.length > 0 ? rawReviews.map((rev: any, i: number) => {
              const stars = rev.starRating ? ({ FIVE:5,FOUR:4,THREE:3,TWO:2,ONE:1 } as any)[rev.starRating] ?? 5 : (rev.rating || 5);
              const isReplied = !!(rev.reviewReply || rev.reply);
              const name = rev.reviewer?.displayName || rev.authorAttribution?.displayName || "Customer";
              const comment = rev.comment || rev.text || "";
              const replyText = rev.reviewReply?.comment || rev.reply?.text || "";
              return (
                <div key={i} style={{ padding: "14px 20px", borderBottom: i < rawReviews.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: comment ? 8 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                        {name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{name}</div>
                        <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                          {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 10, height: 10, color: s <= stars ? "#f59e0b" : "#e2e8f0", fill: s <= stars ? "#f59e0b" : "#e2e8f0" }} />)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                      background: isReplied ? "#ecfdf5" : "#fffbeb", color: isReplied ? "#059669" : "#d97706" }}>
                      {isReplied ? "Replied" : "Unanswered"}
                    </span>
                  </div>
                  {comment && <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, marginLeft: 40, fontStyle: "italic" }}>"{comment}"</p>}
                  {isReplied && replyText && (
                    <div style={{ marginLeft: 40, marginTop: 8, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, borderLeft: "2px solid #6366f1" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Owner Reply</div>
                      <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, fontStyle: "italic" }}>"{replyText}"</p>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                No reviews available to audit.
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Reputation Card */}
          <div className="aud-card" style={{ ...CS.card, ...CS.body }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Reputation Health</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{auditData.averageRating}</span>
              <div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 13, height: 13, color: s <= Math.round(auditData.averageRating) ? "#f59e0b" : "#e2e8f0", fill: s <= Math.round(auditData.averageRating) ? "#f59e0b" : "#e2e8f0" }} />)}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontWeight: 600 }}>{auditData.totalReviews} reviews</div>
              </div>
            </div>
            <StarBar rating={auditData.averageRating} />
          </div>

          {/* Activity & Media */}
          <div className="aud-card" style={{ ...CS.card, ...CS.body }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Activity & Media Audit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                  <Camera style={{ width: 13, height: 13, color: "#94a3b8" }} /> Photo Engagement
                </div>
                <BarRow label="" value={auditData.photoCount ?? 0} max={15} color="#6366f1" suffix=" photos" />
                <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>Target: 15+ photos. {(auditData.photoCount ?? 0) >= 10 ? "✓ Optimal" : "Needs more uploads"}</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                  <Calendar style={{ width: 13, height: 13, color: "#94a3b8" }} /> Posting Frequency
                </div>
                <BarRow label="" value={auditData.recentPostCount ?? 0} max={4} color="#8b5cf6" suffix=" posts/mo" />
                <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>
                  {auditData.lastPostDaysAgo != null ? `Last post: ${auditData.lastPostDaysAgo} days ago` : "No recent posts found"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <ActionSteps auditData={auditData} checklist={checklist} />
        </div>
      </div>
    </div>
  );
}

// ─── Action Steps ─────────────────────────────────────────────────────────────
function ActionSteps({ auditData, checklist }: { auditData: any; checklist: any }) {
  const actions: { priority: "high"|"medium"|"low"; title: string; desc: string; impact: string }[] = [];
  if (!checklist.description) actions.push({ priority:"high",   title:"Add Profile Description",  desc:"Add keyword-rich text to boost local search matching.",           impact:"+15% Reach" });
  if (!checklist.website)     actions.push({ priority:"high",   title:"Connect Website URL",      desc:"Profiles with websites get 2× more click-throughs from search.", impact:"+20% Clicks" });
  if (!checklist.hours)       actions.push({ priority:"high",   title:"Set Business Hours",       desc:"Missing hours reduce trust and lower your search index ranking.",  impact:"+12% Views" });
  if (!checklist.photos)      actions.push({ priority:"medium", title:"Upload More Photos",       desc:"Upload 10+ photos — businesses with photos get 35% more traffic.", impact:"+35% Traffic" });
  if (!checklist.googlePosts) actions.push({ priority:"medium", title:"Publish a Weekly Post",   desc:"Posting weekly signals activity to Google and boosts rankings.",    impact:"+12% Ranking" });
  if (auditData.replyRate < 80) actions.push({ priority:"low",  title:"Reply to Reviews",        desc:`You've replied to ${auditData.replyRate}% of reviews. Aim for 100%.`, impact:"+8% Signal" });
  if (!checklist.additionalCategories) actions.push({ priority:"low", title:"Add Secondary Categories", desc:"Rank for more searches by setting 2–3 additional categories.", impact:"+15% Reach" });
  if (actions.length === 0) actions.push({ priority:"low", title:"Build Review Links", desc:"Share a direct Google Review link to accelerate review velocity.", impact:"+10% Velocity" });

  const pm: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    high:   { bg:"#fef2f2", dot:"#ef4444", text:"#dc2626", label:"Urgent" },
    medium: { bg:"#fffbeb", dot:"#f59e0b", text:"#d97706", label:"Medium" },
    low:    { bg:"#f0fdf4", dot:"#10b981", text:"#16a34a", label:"Quick Win" },
  };

  return (
    <div className="aud-card" style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Recommended Actions</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 99 }}>
          {actions.filter(a => a.priority === "high").length} urgent
        </span>
      </div>
      <div>
        {actions.slice(0, 4).map((act, i) => {
          const p = pm[act.priority];
          return (
            <div key={i} style={{ padding: "12px 18px", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", background: "#fff", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.dot, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{act.title}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", padding: "1px 6px", borderRadius: 99, background: p.bg, color: p.text }}>{p.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", padding: "1px 6px", borderRadius: 99, background: "#ecfdf5", color: "#059669" }}>{act.impact}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{act.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

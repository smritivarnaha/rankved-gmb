"use client";

import { 
  CheckCircle2, Search, TrendingUp, MessageSquare, ShieldCheck, 
  AlertCircle, Star, Eye, LayoutDashboard, ArrowUpRight, Sparkles,
  Camera, Calendar, Clock, Phone, Globe, MapPin, Check, Award
} from "lucide-react";

// Helper: Score color config
function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981"; // Emerald
  if (score >= 50) return "#f59e0b"; // Amber
  return "#ef4444"; // Rose/Red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 50) return "Needs Work";
  return "Critical";
}

// ─── Score circular gauge ──────────────────────────────────────────────────
function CircularProgress({ score, label, color, size = 120, strokeWidth = 8 }: { score: number; label: string; color: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>{score}%</span>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">{label}</span>
      </div>
    </div>
  );
}

// ─── Star Distribution Graph ───────────────────────────────────────────────
function RatingDistribution({ rating }: { rating: number }) {
  // Calculate distribution based on actual average rating
  const rates = [
    { stars: 5, pct: rating >= 4.5 ? 82 : rating >= 4.0 ? 65 : 40 },
    { stars: 4, pct: rating >= 4.5 ? 12 : rating >= 4.0 ? 20 : 25 },
    { stars: 3, pct: rating >= 4.5 ? 4 : rating >= 4.0 ? 8 : 15 },
    { stars: 2, pct: rating >= 4.5 ? 1 : rating >= 4.0 ? 4 : 12 },
    { stars: 1, pct: rating >= 4.5 ? 1 : rating >= 4.0 ? 3 : 8 },
  ];

  return (
    <div className="space-y-2 mt-3">
      {rates.map(r => (
        <div key={r.stars} className="flex items-center gap-3 text-xs">
          <span className="w-3 text-slate-500 font-bold">{r.stars}</span>
          <Star className="w-3 h-3 text-amber-400 fill-current flex-shrink-0" />
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" 
              style={{ width: `${r.pct}%` }} 
            />
          </div>
          <span className="w-8 text-right text-slate-400 font-medium">{r.pct}%</span>
        </div>
      ))}
    </div>
  );
}

export function AuditDashboard({ auditData, isPublic = false, publicData = null }: { auditData: any, isPublic?: boolean, publicData?: any }) {
  if (!auditData) return null;
  const checklist = auditData.checklist || {};

  const metrics = [
    { label: "Profile Quality", value: auditData.completionScore, suffix: "%", icon: ShieldCheck, sub: "Checklist Score", color: getScoreColor(auditData.completionScore) },
    { label: "Visibility Score", value: auditData.visibilityScore, suffix: "%", icon: Eye, sub: "Local Search Index", color: getScoreColor(auditData.visibilityScore) },
    { label: "Reply Rate", value: auditData.replyRate, suffix: "%", icon: MessageSquare, sub: "Review Response", color: getScoreColor(auditData.replyRate) },
    { label: "Review Velocity", value: auditData.reviewsPerWeek, suffix: "/wk", icon: TrendingUp, sub: "Reviews Recency", color: "#8b5cf6" },
  ];

  const checkItems = [
    { key: "businessName", label: "Business Name", desc: "Identity & naming accuracy" },
    { key: "address", label: "Address & Location", desc: "Listing storefront presence" },
    { key: "phone", label: "Primary Phone Number", desc: "Direct voice call connection" },
    { key: "website", label: "Website URL Link", desc: "Digital authority link" },
    { key: "hours", label: "Business Hours", desc: "Operation schedule clarity" },
    { key: "description", label: "Profile Description", desc: "SEO keyword rich pitch" },
    { key: "category", label: "Primary Category", desc: "Core search index matching" },
    { key: "additionalCategories", label: "Secondary Categories", desc: "Broader discoverability match" },
    { key: "specialHours", label: "Special/Holiday Hours", desc: "Active management signals" },
    { key: "serviceArea", label: "Service Area Reach", desc: "Local service reach bounds" },
    { key: "photos", label: "Photo Count (10+)", desc: "Customer visual trust proof" },
    { key: "googlePosts", label: "Recent Post Activity", desc: "Active ranking signals check" },
  ];

  const passed = checkItems.filter(i => checklist[i.key]).length;
  const total  = checkItems.length;
  const passedPct = Math.round((passed / total) * 100);

  // Extract reviews to display in the audit review feed
  const rawReviews = auditData.reviewsList || (publicData?.reviews || []);
  
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-1 text-slate-800">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 100 } }
        .audit-metric-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .audit-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }
        .audit-check-row {
          transition: background-color 0.15s ease;
        }
        .audit-check-row:hover {
          background-color: #fafafa !important;
        }
        
        /* Premium Print Stylesheet for Executive PDF Proposals */
        @media print {
          body {
            background: white !important;
            color: #000 !important;
            font-size: 12px !important;
          }
          .no-print, button, a.btn, a.audit-action-cta, .strategic-insight-cta {
            display: none !important;
          }
          .audit-container, .print-section {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
          .page-break {
            page-break-before: always !important;
          }
          .card-print {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            padding: 15px !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── 4 Top-Tier Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {metrics.map(m => (
          <div 
            key={m.label} 
            className="audit-metric-card bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 block mb-1">
                {m.label}
              </span>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {m.value}{m.suffix}
              </h3>
              <p className="text-xs font-semibold text-slate-500 leading-snug">{m.sub}</p>
            </div>
            
            <div className="flex-shrink-0">
              {m.suffix === "%" ? (
                <CircularProgress score={m.value} label={getScoreLabel(m.value)} color={m.color} size={76} strokeWidth={6} />
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center" 
                  style={{ background: `${m.color}12`, color: m.color }}
                >
                  <m.icon className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Executive Print Header (Only visible on print) ── */}
      <div className="hidden print:flex flex-col gap-2 border-b-2 border-slate-800 pb-5 mb-5">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Google Profile Audit Report</h1>
            <p className="text-slate-500 text-sm font-semibold">RankVed Local SEO Engine • Live Intelligence Report</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-slate-900">{isPublic ? publicData?.displayName?.text : "Business Profile"}</h3>
            <p className="text-xs text-slate-400">{new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Checklist + Activity/Reviews Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN (2/3 width on desktop): Checklist & Audit Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Optimization Checklist Card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden card-print">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">SEO Optimization Checklist</h3>
                <p className="text-xs text-slate-400 mt-0.5">{passed} of {total} high-ranking signals complete</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {passedPct}% Match
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            </div>

            {/* Checklist Rows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-slate-50 divide-y md:divide-y-0 divide-slate-100 md:gap-x-0">
              {checkItems.map((item, idx) => {
                const ok = !!checklist[item.key];
                return (
                  <div 
                    key={item.key} 
                    className={`audit-check-row flex items-center justify-between px-6 py-4 border-b border-slate-50`}
                    style={{ borderRight: idx % 2 === 0 ? "1px solid #f8fafc" : "none" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ok
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        : <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${ok ? "text-slate-800" : "text-slate-500"}`}>{item.label}</p>
                        <p className="text-[10px] text-slate-400 truncate leading-snug">{item.desc}</p>
                      </div>
                    </div>
                    <span 
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        ok 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                          : "bg-rose-50 border-rose-100 text-rose-600"
                      }`}
                    >
                      {ok ? "Complete" : "Action Needed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Insight Alert Strip */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-print no-print">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Local Growth Multiplier</span>
                <p className="text-sm font-bold leading-normal text-slate-200">
                  {total - passed > 0 
                    ? `Resolve the remaining ${total - passed} missing ranking signals to unlock up to 35% higher local visibility.`
                    : "Excellent profile! Your listing is fully optimized. Keep posting weekly to sustain domain authority."}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => window.open(isPublic ? "/connect" : "https://business.google.com", "_blank")}
              className="strategic-insight-cta flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              {isPublic ? "Connect Profile Now" : "Manage Profile"}
            </button>
          </div>

          {/* Customer Reviews Audit & Feed Card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden card-print">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Customer Reviews Audit</h3>
                <p className="text-xs text-slate-400 mt-0.5">Evaluating response health and sentiment metrics</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-slate-600" />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {rawReviews.length > 0 ? (
                rawReviews.map((rev: any, i: number) => {
                  const stars = rev.starRating ? (
                    rev.starRating === "FIVE" ? 5 : rev.starRating === "FOUR" ? 4 : rev.starRating === "THREE" ? 3 : rev.starRating === "TWO" ? 2 : 1
                  ) : (rev.rating || 5);
                  
                  const isReplied = !!(rev.reviewReply || rev.reply);
                  const reviewerName = rev.reviewer?.displayName || rev.authorAttribution?.displayName || "Local Customer";
                  const comment = rev.comment || rev.text || "";
                  const publishDate = rev.createTime || rev.publishTime 
                    ? new Date(rev.createTime || rev.publishTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : rev.relativePublishTimeDescription || "Recently";

                  return (
                    <div key={i} className="p-6 flex flex-col gap-3">
                      {/* Reviewer Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                            {reviewerName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-snug">{reviewerName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star 
                                    key={s} 
                                    className={`w-2.5 h-2.5 ${s <= stars ? "text-amber-400 fill-current" : "text-slate-200"}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">• {publishDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reply Status Badge */}
                        <span 
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isReplied 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                              : "bg-amber-50 border-amber-100 text-amber-600"
                          }`}
                        >
                          {isReplied ? "Replied" : "Unanswered"}
                        </span>
                      </div>

                      {/* Comment body */}
                      {comment && (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium pl-11">
                          "{comment}"
                        </p>
                      )}

                      {/* Reply Text if present */}
                      {isReplied && (
                        <div className="ml-11 p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2.5">
                          <Award className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">Business Owner Response</p>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                              "{rev.reviewReply?.comment || rev.reply?.text}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No reviews detected to audit. Connect this profile to fetch full reviews.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width on desktop): Reputation spreads, Photos, CTAs */}
        <div className="flex flex-col gap-6">
          
          {/* Overall Reputation Star Card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 card-print">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Reputation Health Spread</h3>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                {auditData.averageRating}
              </span>
              <div className="flex flex-col">
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(s => (
                    <Star 
                      key={s} 
                      className={`w-3.5 h-3.5 ${s <= Math.round(auditData.averageRating) ? "text-amber-400 fill-current" : "text-slate-200"}`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {auditData.totalReviews} Overall Reviews
                </span>
              </div>
            </div>

            <RatingDistribution rating={auditData.averageRating} />
          </div>

          {/* Connected Engagement Performance Stats */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 card-print">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Activity & Media Audit</h3>
            
            <div className="space-y-4">
              {/* Photos Gauge */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-400" /> Photo Engagement
                  </span>
                  <span className="font-black text-slate-900">{auditData.photoCount ?? 0} photos</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${Math.min(((auditData.photoCount ?? 0) / 15) * 100, 100)}%` }} 
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Target: 15+ rich high-res photos. Current standing: {auditData.photoCount >= 10 ? "Optimal" : "Needs upload"}.
                </p>
              </div>

              {/* Posting Frequency Gauge */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Posting Frequency
                  </span>
                  <span className="font-black text-slate-900">
                    {auditData.recentPostCount > 0 ? `${auditData.recentPostCount} posts/mo` : "Inactive"}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500 rounded-full" 
                    style={{ width: `${Math.min(((auditData.recentPostCount ?? 0) / 4) * 100, 100)}%` }} 
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {auditData.lastPostDaysAgo !== null 
                    ? `Last post made ${auditData.lastPostDaysAgo} days ago. Target: 1 post/week.` 
                    : "No posts found in the last 30 days. Action highly recommended."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Steps Executive Callout */}
          <ActionSteps auditData={auditData} checklist={checklist} />
        </div>
      </div>
    </div>
  );
}

// ─── Action Steps Sub-Component ─────────────────────────────────────────────
function ActionSteps({ auditData, checklist }: { auditData: any, checklist: any }) {
  const actions: { priority: "high" | "medium" | "low"; title: string; desc: string; impact: string }[] = [];

  // 1. Missing Listing details (High priority)
  if (!checklist.description) actions.push({
    priority: "high", title: "Add Profile Description",
    desc: "Introduce primary service keywords into your profile pitch to boost SEO discoverability.",
    impact: "+15% Reach"
  });
  if (!checklist.website) actions.push({
    priority: "high", title: "Connect Website Link",
    desc: "A profile with a website URL gets 2x more user action clicks from search views.",
    impact: "+25% Clicks"
  });
  if (!checklist.hours) actions.push({
    priority: "high", title: "List Business Hours",
    desc: "Businesses without hours generate high customer drop-offs and lower search indexing.",
    impact: "+10% Views"
  });

  // 2. Photos & Posts (Medium Priority)
  if (!checklist.photos) actions.push({
    priority: "medium", title: "Upload Profile Photos",
    desc: "Having fewer than 10 photos reduces customer trust. Upload logo, storefront, and products.",
    impact: "+35% Traffic"
  });
  if (!checklist.googlePosts) actions.push({
    priority: "medium", title: "Publish a Weekly Post",
    desc: "Your profile lacks recent post updates. Posting once a week alerts Google your business is active.",
    impact: "+12% Ranking"
  });

  // 3. Review Responses (Quick wins)
  if (auditData.replyRate < 80) actions.push({
    priority: "low", title: "Reply to Unresolved Reviews",
    desc: "You've left reviews without a response. Respond to reviews to increase customer engagement by 8%.",
    impact: "+8% Signal"
  });
  if (!checklist.additionalCategories) actions.push({
    priority: "low", title: "Add Secondary Categories",
    desc: "Set up 1-3 secondary categories in your dashboard to rank for broader customer searches.",
    impact: "+15% Reach"
  });

  // If no actions are triggered, provide fallback optimization recommendations
  if (actions.length === 0) {
    actions.push({
      priority: "low", title: "Build Customer Review Links",
      desc: "Distribute direct Google Review short links to customers to trigger organic growth velocity.",
      impact: "+10% Velocity"
    });
  }

  const priorityMeta = {
    high:   { bg: "bg-rose-50 border-rose-100", dot: "bg-rose-500", text: "text-rose-700", label: "Urgent Action" },
    medium: { bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500", text: "text-amber-700", label: "Medium Task" },
    low:    { bg: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500", text: "text-emerald-700", label: "Quick Win" }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 card-print">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Recommended Action Steps</h3>
      
      <div className="flex flex-col gap-3">
        {actions.slice(0, 3).map((act, i) => {
          const pm = priorityMeta[act.priority];
          return (
            <div key={i} className={`p-4 border rounded-xl flex gap-3 ${pm.bg}`}>
              <div className={`w-2 h-2 rounded-full ${pm.dot} flex-shrink-0 mt-1.5`} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold text-slate-800">{act.title}</span>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-white ${pm.text}`}>
                    {pm.label}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-white text-emerald-600 border-emerald-100">
                    {act.impact}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">{act.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

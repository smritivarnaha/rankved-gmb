"use client";

import { 
  CheckCircle2, AlertTriangle, Search, 
  TrendingUp, MessageSquare, ShieldCheck, 
  ChevronRight, Sparkles, LayoutDashboard, ArrowUpRight
} from "lucide-react";

export function AuditDashboard({ auditData, isPublic = false }: { auditData: any, isPublic?: boolean }) {
  if (!auditData) return null;

  return (
    <div className="anim-fade-up space-y-8">
      {/* Stat Grid */}
      <div className="grid grid-cols-4 gap-6">
        <ScoreCard 
          label="Profile Quality" 
          value={auditData.completionScore} 
          subtext="Completion"
          icon={ShieldCheck}
        />
        <ScoreCard 
          label="Google Search" 
          value={auditData.searchRank} 
          subtext="Avg Position"
          icon={Search}
          isRank
        />
        <ScoreCard 
          label="Reply Rate" 
          value={auditData.replyRate} 
          subtext="Response %"
          icon={MessageSquare}
        />
        <ScoreCard 
          label="Weekly Velocity" 
          value={auditData.reviewsPerWeek} 
          subtext="Reviews / Week"
          icon={TrendingUp}
          isVelocity
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Checklist Section */}
        <div className="col-span-7 space-y-6">
          <div className="ds-card">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="heading-card">Audit Checklist</h3>
                  <p className="text-meta">Required optimizations for 100% visibility.</p>
               </div>
               <div className="w-10 h-10 bg-brand-subtle rounded-lg flex items-center justify-center text-brand">
                  <ShieldCheck className="w-5 h-5" />
               </div>
            </div>

            <div className="space-y-2">
              <CheckItem label="Verified Business Status" isComplete={true} />
              <CheckItem label="High-Resolution Photos" isComplete={auditData.completionScore > 50} />
              <CheckItem label="Detailed Business Description" isComplete={auditData.completionScore > 30} />
              <CheckItem label="Primary Category Selection" isComplete={true} />
              <CheckItem label="Active Service Areas" isComplete={auditData.completionScore > 70} />
              <CheckItem label="Business Hours Configuration" isComplete={auditData.completionScore > 90} />
            </div>
          </div>

          <div className="ds-card bg-neutral-900 border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-4">Strategic Insight</p>
              <h3 className="text-xl font-bold text-white mb-4 leading-tight">Increase visibility by <span className="text-brand">42%</span>.</h3>
              <p className="text-neutral-400 text-sm mb-6 max-w-md">
                By optimizing missing attributes and maintaining a 90% reply rate, your profile will prioritize in local search results.
              </p>
              <button className="ds-btn ds-btn-primary h-10 px-6">
                Generate Growth Plan
              </button>
            </div>
          </div>
        </div>

        {/* Health Sidebar */}
        <div className="col-span-5 space-y-6">
           <div className="ds-card">
              <h3 className="heading-card mb-8">Reputation Health</h3>
              
              <div className="space-y-10">
                <GaugeBlock label="Average Rating" value={auditData.averageRating} max={5} />
                <GaugeBlock label="Review Volume" value={auditData.totalReviews} max={1000} />
                <GaugeBlock label="Reply Rate" value={auditData.replyRate} max={100} />
              </div>
           </div>

           <div className="ds-card bg-brand border-none flex items-center justify-between shadow-lg shadow-brand/20">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                    <LayoutDashboard className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="font-bold text-white text-sm">Download Report</p>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Share with client</p>
                 </div>
              </div>
              <button className="w-8 h-8 bg-white/10 text-white rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                 <ArrowUpRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, subtext, icon: Icon, isRank = false, isVelocity = false }: any) {
  return (
    <div className="ds-card ds-card-hover">
      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 mb-6 transition-all">
         <Icon className="w-5 h-5" />
      </div>
      <p className="label-stat mb-1">{label}</p>
      <h4 className="value-stat mb-1">
        {value}{(!isRank && !isVelocity) && "%"}
      </h4>
      <p className="text-meta uppercase text-[10px] tracking-wider">{subtext}</p>
    </div>
  );
}

function CheckItem({ label, isComplete }: { label: string, isComplete: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-all border border-transparent hover:border-neutral-200">
      <div className="flex items-center gap-3">
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-neutral-200" />
        )}
        <span className={`text-sm font-medium ${isComplete ? "text-neutral-900" : "text-neutral-400"}`}>{label}</span>
      </div>
      {isComplete ? (
        <span className="ds-badge ds-badge-success">Optimized</span>
      ) : (
        <button className="text-xs font-bold text-brand hover:underline">Improve</button>
      )}
    </div>
  );
}

function GaugeBlock({ label, value, max }: any) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
         <span className="text-neutral-400">{label}</span>
         <span className="text-neutral-900 font-bold">{value} / {max}</span>
      </div>
      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
         <div 
           className="h-full bg-brand rounded-full transition-all duration-1000" 
           style={{ width: `${percentage}%` }}
         />
      </div>
    </div>
  );
}

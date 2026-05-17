"use client";

import { 
  CheckCircle2, AlertTriangle, Search, 
  TrendingUp, MessageSquare, ShieldCheck, 
  ChevronRight, Sparkles, LayoutDashboard, ArrowUpRight,
  XCircle, AlertCircle
} from "lucide-react";

export function AuditDashboard({ auditData, isPublic = false }: { auditData: any, isPublic?: boolean }) {
  if (!auditData) return null;

  const checklist = auditData.checklist || {};

  return (
    <div className="anim-fade-up space-y-8">
      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard 
          label="Profile Quality" 
          value={auditData.completionScore} 
          subtext="Completion"
          icon={ShieldCheck}
          suffix="%"
        />
        <ScoreCard 
          label="Visibility Score" 
          value={auditData.visibilityScore} 
          subtext="Search Index"
          icon={Search}
          suffix="%"
        />
        <ScoreCard 
          label="Reply Rate" 
          value={auditData.replyRate} 
          subtext="Response Rate"
          icon={MessageSquare}
          suffix="%"
        />
        <ScoreCard 
          label="Weekly Velocity" 
          value={auditData.reviewsPerWeek} 
          subtext="Reviews / Week"
          icon={TrendingUp}
          suffix=""
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Checklist Section */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Audit Checklist</h3>
                  <p className="text-slate-500 text-sm font-medium">Required optimizations for 100% visibility.</p>
               </div>
               <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
               </div>
            </div>

            <div className="space-y-3">
              <CheckItem label="Verified Business Status" isComplete={true} />
              <CheckItem label="Business Name" isComplete={checklist.businessName ?? false} />
              <CheckItem label="Address & Location" isComplete={checklist.address ?? false} />
              <CheckItem label="Primary Phone Number" isComplete={checklist.phone ?? false} />
              <CheckItem label="Website Link" isComplete={checklist.website ?? false} />
              <CheckItem label="Business Hours Configuration" isComplete={checklist.hours ?? false} />
              <CheckItem label="Detailed Business Description" isComplete={checklist.description ?? false} />
              <CheckItem label="Primary Category Selection" isComplete={checklist.category ?? false} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Strategic Insight</p>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">Increase visibility by <span className="text-indigo-400">42%</span>.</h3>
              <p className="text-slate-400 text-sm mb-8 max-w-md font-medium leading-relaxed">
                By optimizing missing attributes and maintaining a high reply rate, your profile will prioritize higher in local search results.
              </p>
              <button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide transition-colors shadow-lg shadow-indigo-600/30">
                Generate Growth Plan
              </button>
            </div>
          </div>
        </div>

        {/* Health Sidebar */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
           <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Reputation Health</h3>
              
              <div className="space-y-8">
                <GaugeBlock label="Average Rating" value={auditData.averageRating} max={5} color="bg-amber-400" />
                <GaugeBlock label="Review Volume" value={auditData.totalReviews} max={1000} color="bg-blue-500" />
                <GaugeBlock label="Reply Rate" value={auditData.replyRate} max={100} color="bg-emerald-500" suffix="%" />
              </div>
           </div>

           <div className="bg-indigo-600 rounded-2xl p-6 flex items-center justify-between shadow-xl shadow-indigo-600/20 group cursor-pointer hover:bg-indigo-700 transition-colors">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20">
                    <LayoutDashboard className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="font-bold text-white text-base tracking-tight mb-1">Download Report</p>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Share with client</p>
                 </div>
              </div>
              <button className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center group-hover:bg-white/20 group-hover:scale-105 transition-all">
                 <ArrowUpRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, subtext, icon: Icon, suffix = "" }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 group-hover:bg-indigo-50/50 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-100 transition-colors">
           <Icon className="w-5 h-5" />
        </div>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">{label}</p>
        <h4 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
          {value}{suffix}
        </h4>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{subtext}</p>
      </div>
    </div>
  );
}

function CheckItem({ label, isComplete }: { label: string, isComplete: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-slate-100/50 transition-colors">
      <div className="flex items-center gap-4">
        {isComplete ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
        )}
        <span className={`text-sm font-semibold ${isComplete ? "text-slate-900" : "text-slate-700"}`}>{label}</span>
      </div>
      {isComplete ? (
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">Optimized</span>
      ) : (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold uppercase tracking-wider">Missing</span>
      )}
    </div>
  );
}

function GaugeBlock({ label, value, max, color, suffix = "" }: any) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
         <span className="text-slate-500">{label}</span>
         <span className="text-slate-900 font-black text-sm">{value}{suffix} <span className="text-slate-400 font-medium text-xs">/ {max}{suffix}</span></span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
         <div 
           className={`h-full ${color} rounded-full transition-all duration-1000`} 
           style={{ width: \`\${percentage}%\` }}
         />
      </div>
    </div>
  );
}

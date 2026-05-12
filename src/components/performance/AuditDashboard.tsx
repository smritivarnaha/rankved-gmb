"use client";

import { useState, useMemo } from "react";
import { 
  CheckCircle2, XCircle, AlertTriangle, Star, 
  TrendingUp, MessageSquare, MapPin, Search, 
  ArrowUpRight, Zap, Info, ShieldCheck, 
  ChevronRight, Sparkles, LayoutDashboard
} from "lucide-react";

export function AuditDashboard({ auditData, isPublic = false }: { auditData: any, isPublic?: boolean }) {
  if (!auditData) return null;

  return (
    <div className="anim-fade-up space-y-12 pb-32">
      {/* Header Stat Bar */}
      <div className="grid grid-cols-4 gap-6">
        <ScoreCard 
          label="Overall Score" 
          value={auditData.completionScore} 
          subtext="Profile Quality"
          icon={Zap}
          color="indigo"
        />
        <ScoreCard 
          label="Search Rank" 
          value={auditData.searchRank} 
          subtext="Visibility"
          icon={Search}
          color="cyan"
          isRank
        />
        <ScoreCard 
          label="Reply Rate" 
          value={auditData.replyRate} 
          subtext="Engagement"
          icon={MessageSquare}
          color="emerald"
        />
        <ScoreCard 
          label="Review Velocity" 
          value={auditData.reviewsPerWeek} 
          subtext="Growth / week"
          icon={TrendingUp}
          color="amber"
          isVelocity
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Profile Completion Detail */}
        <div className="col-span-7 space-y-8">
          <div className="bg-white rounded-[48px] p-10 border-2 border-slate-50 shadow-2xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Checklist</h3>
                  <p className="text-slate-500 font-medium text-sm">Critical items needed for 100% visibility.</p>
               </div>
               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-7 h-7" />
               </div>
            </div>

            <div className="space-y-4">
              <CheckItem label="Verified Business Status" isComplete={true} />
              <CheckItem label="High-Resolution Cover Photo" isComplete={auditData.completionScore > 50} />
              <CheckItem label="Detailed Business Description" isComplete={auditData.completionScore > 30} />
              <CheckItem label="Primary Category Optimization" isComplete={true} />
              <CheckItem label="Active Service Areas" isComplete={auditData.completionScore > 70} />
              <CheckItem label="Special Hours Configuration" isComplete={auditData.completionScore > 90} />
            </div>
          </div>

          <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h4 className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Strategic Advice</h4>
              <h3 className="text-3xl font-black mb-6 leading-tight">Your visibility could increase <br/> by <span className="text-indigo-400">42%</span> next month.</h3>
              <p className="text-slate-400 font-medium mb-8 max-w-md">
                By resolving the missing attributes and increasing your review reply rate, Google's algorithm will prioritize your profile in local searches.
              </p>
              <button className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-400 transition-all">
                Execute Growth Plan <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Competitive Radar / Sidebar */}
        <div className="col-span-5 space-y-8">
           <div className="bg-white rounded-[48px] p-10 border-2 border-slate-50 shadow-2xl shadow-slate-100/50">
              <h3 className="text-xl font-black text-slate-900 mb-8">Reputation Health</h3>
              
              <div className="space-y-10">
                <GaugeBlock label="Average Rating" value={auditData.averageRating} max={5} color="#f59e0b" />
                <GaugeBlock label="Review Volume" value={auditData.totalReviews} max={1000} color="#10b981" />
                <GaugeBlock label="Response Speed" value={auditData.replyRate} max={100} color="#6366f1" />
              </div>
           </div>

           <div className="bg-indigo-600 rounded-[40px] p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-100">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="font-black text-sm tracking-tight">Generate Report</p>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Share with client</p>
                 </div>
              </div>
              <button className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                 <ArrowUpRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, subtext, icon: Icon, color, isRank = false, isVelocity = false }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/20",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100 shadow-cyan-100/20",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/20",
    amber: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/20",
  };

  return (
    <div className={`p-8 rounded-[40px] border-2 bg-white shadow-xl ${colors[color]} relative overflow-hidden group hover:-translate-y-2 transition-all duration-500`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${colors[color]} border-none shadow-md`}>
         <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
      <h4 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">
        {value}{(!isRank && !isVelocity) && "%"}
      </h4>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subtext}</p>
    </div>
  );
}

function CheckItem({ label, isComplete }: { label: string, isComplete: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
      <div className="flex items-center gap-4">
        {isComplete ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
        )}
        <span className={`font-bold text-sm ${isComplete ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
      </div>
      {isComplete ? (
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Optimized</span>
      ) : (
        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Fix Now</button>
      )}
    </div>
  );
}

function GaugeBlock({ label, value, max, color }: any) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
         <span className="text-slate-400">{label}</span>
         <span className="text-slate-900">{value} / {max}</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
         <div 
           className="h-full rounded-full transition-all duration-1000" 
           style={{ width: `${percentage}%`, backgroundColor: color }}
         />
      </div>
    </div>
  );
}

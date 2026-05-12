"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Loader2, AlertCircle, CheckCircle2, XCircle, HelpCircle, Star, Search, Zap } from "lucide-react";
import { AuditDashboard } from "./AuditDashboard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function AuditReport({ profileId, publicData }: { profileId: string, publicData?: any }) {
  const isPublic = profileId === "PUBLIC_MODE" && publicData;
  const { data, isLoading, error } = useSWR(!isPublic ? `/api/profiles/${profileId}/audit` : null, fetcher);

  const handleDownloadPDF = () => {
    window.print();
  };

  // Mock public audit logic
  const publicAudit = useMemo(() => {
    if (!isPublic) return null;
    
    const fields = ['name', 'formatted_address', 'rating', 'user_ratings_total', 'photos', 'types'];
    let filled = 0;
    if (publicData.name) filled++;
    if (publicData.formatted_address) filled++;
    if (publicData.rating) filled++;
    if (publicData.user_ratings_total) filled++;
    if (publicData.photos?.length > 0) filled++;
    if (publicData.types?.length > 0) filled++;

    return {
      completionScore: Math.round((filled / fields.length) * 100),
      searchRank: "N/A",
      reviewsPerWeek: 0,
      replyRate: 0,
      totalReviews: publicData.user_ratings_total || 0,
      averageRating: publicData.rating || 0,
      missingFields: ["Connect account to view full report"]
    };
  }, [isPublic, publicData]);

  const audit = isPublic ? publicAudit : data?.data;

  if (isLoading) return (
    <div className="p-12 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating Business Audit...</p>
    </div>
  );

  if (!isPublic && (error || data?.error)) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3">
      <AlertCircle className="w-5 h-5" />
      <p className="font-semibold">{data?.error || "Failed to generate report"}</p>
    </div>
  );

  if (!audit) return null;

  const getStatus = (val: any, type: 'completion' | 'reply' | 'velocity' | 'rank') => {
    if (type === 'completion' || type === 'reply') {
      const num = parseInt(val) || 0;
      if (num >= 80) return { label: 'Good', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      if (num >= 50) return { label: 'Average', color: 'bg-amber-50 text-amber-600 border-amber-100' };
      return { label: 'Poor', color: 'bg-red-50 text-red-600 border-red-100' };
    }
    if (type === 'velocity') {
      const num = parseFloat(val) || 0;
      if (num >= 2) return { label: 'Good', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      if (num >= 0.5) return { label: 'Average', color: 'bg-amber-50 text-amber-600 border-amber-100' };
      return { label: 'Poor', color: 'bg-red-50 text-red-600 border-red-100' };
    }
    if (type === 'rank') {
      const num = parseFloat(val);
      if (isNaN(num)) return { label: 'N/A', color: 'bg-slate-50 text-slate-400 border-slate-100' };
      if (num <= 5) return { label: 'Good', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      if (num <= 10) return { label: 'Average', color: 'bg-amber-50 text-amber-600 border-amber-100' };
      return { label: 'Poor', color: 'bg-red-50 text-red-600 border-red-100' };
    }
    return { label: 'N/A', color: 'bg-slate-50 text-slate-400 border-slate-100' };
  };

  const rankStatus = getStatus(audit.searchRank, 'rank');
  const completionStatus = getStatus(audit.completionScore, 'completion');
  const velocityStatus = getStatus(audit.reviewsPerWeek, 'velocity');
  const replyStatus = getStatus(audit.replyRate, 'reply');

  return (
    <div className="space-y-6 audit-container">
      <div className="flex justify-between items-center mb-12 no-print">
        <div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live Intelligence</h4>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">On-Screen Audit</h2>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl flex items-center gap-3"
        >
          <Zap className="w-4 h-4 fill-current" />
          Download Client PDF
        </button>
      </div>

      <AuditDashboard auditData={audit} isPublic={isPublic} />

      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Powered by Rankved</p>
        <img src="/rankved-logo.png" alt="Rankved" className="h-6 mx-auto opacity-30 grayscale" />
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .audit-container, .audit-container * {
            visibility: visible;
          }
          .audit-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .bg-white {
            background-color: white !important;
            border-color: #f1f5f9 !important;
            box-shadow: none !important;
          }
          .shadow-xl, .shadow-md {
            box-shadow: none !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

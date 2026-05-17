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
    
    const checklist = {
      businessName: !!publicData.name,
      address: !!publicData.formatted_address,
      phone: !!publicData.formatted_phone_number,
      website: !!publicData.website,
      hours: !!publicData.opening_hours,
      description: false,
      category: !!publicData.types?.length
    };

    const fieldsToTrack = Object.values(checklist);
    const filledFields = fieldsToTrack.filter(Boolean).length;
    const completionScore = Math.round((filledFields / fieldsToTrack.length) * 100);
    
    // Simplistic visibility for public data since we lack reply/velocity
    const visibilityScore = Math.min(100, Math.round(completionScore * 0.5));

    return {
      completionScore,
      checklist,
      visibilityScore,
      reviewsPerWeek: 0,
      replyRate: 0,
      totalReviews: publicData.user_ratings_total || 0,
      averageRating: publicData.rating || 0,
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

  return (
    <div className="space-y-6 audit-container">
      <div className="flex justify-between items-center mb-6 no-print audit-header-row">
        <div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live Intelligence</h4>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">On-Screen Audit</h2>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-3"
        >
          <Zap className="w-4 h-4 fill-current" />
          Download PDF
        </button>
      </div>

      <AuditDashboard auditData={audit} isPublic={isPublic} />



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

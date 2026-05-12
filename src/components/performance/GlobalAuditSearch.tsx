"use client";

import { useState } from "react";
import { Search, Zap, MapPin, Globe, Star, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { AuditDashboard } from "./AuditDashboard";

export function GlobalAuditSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.places || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="anim-fade-up max-w-6xl mx-auto py-12">
      {/* Header Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-subtle text-brand rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          <Sparkles className="w-3 h-3" />
          RankVed Intelligence
        </div>
        <h1 className="text-5xl font-black text-neutral-900 tracking-tighter mb-4">Command Center</h1>
        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
          Audit any business on Google instantly. Enter a business name or location to generate a professional performance report.
        </p>
      </div>

      {/* Search Input — 2026 SaaS Style */}
      <div className="relative max-w-3xl mx-auto mb-20 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand to-cyan-400 rounded-[28px] opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
        <div className="relative flex items-center bg-white border-2 border-neutral-100 rounded-[24px] p-2 shadow-2xl shadow-neutral-200/50">
          <div className="flex-1 flex items-center px-6">
            <Search className="w-6 h-6 text-neutral-400 mr-4" />
            <input 
              type="text" 
              placeholder="Business name, address, or phone..."
              className="w-full h-14 bg-transparent text-lg font-medium text-neutral-900 outline-none placeholder:text-neutral-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className="flex items-center gap-3 px-10 h-14 bg-neutral-900 text-white rounded-[20px] font-bold uppercase tracking-widest text-xs hover:bg-brand transition-all active:scale-95 disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4 fill-current" /> Search</>}
          </button>
        </div>
      </div>

      {/* Results or Audit Dashboard */}
      {selectedBusiness ? (
        <div className="ds-anim-fade">
          <div className="flex items-center justify-between mb-12">
            <button 
              onClick={() => setSelectedBusiness(null)}
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 font-bold text-xs uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Search
            </button>
            <div className="flex items-center gap-4">
               <div className="px-4 py-2 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Business: {selectedBusiness.displayName?.text}
               </div>
            </div>
          </div>
          <AuditDashboard auditData={selectedBusiness.mockAudit} isPublic />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((biz, i) => (
            <BusinessResultCard 
              key={i} 
              biz={biz} 
              onClick={() => {
                // Mocking audit data for demo
                const mockAudit = {
                  completionScore: 68,
                  searchRank: 4.2,
                  replyRate: 15,
                  reviewsPerWeek: 0.5,
                  totalReviews: biz.userRatingCount || 0,
                  averageRating: biz.rating || 0,
                  missingFields: ["Website", "Description", "Service Areas"]
                };
                setSelectedBusiness({ ...biz, mockAudit });
              }}
            />
          ))}
          {!isSearching && results.length === 0 && query && (
             <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-neutral-400 font-medium">No businesses found. Try a different search query.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function BusinessResultCard({ biz, onClick }: { biz: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border-2 border-neutral-100 rounded-[32px] p-8 hover:border-brand hover:shadow-2xl hover:shadow-neutral-200 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
         <ArrowRight className="w-6 h-6 text-brand" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:bg-brand-subtle group-hover:text-brand transition-all">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Star className="w-3.5 h-3.5 text-warning fill-current" />
              <span className="text-xs font-bold text-neutral-900">{biz.rating || "N/A"}</span>
              <span className="text-xs text-neutral-400 font-medium">({biz.userRatingCount || 0})</span>
           </div>
           <p className="text-[10px] font-bold text-brand uppercase tracking-widest">{biz.primaryType?.replace(/_/g, ' ') || "Business"}</p>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-tight">{biz.displayName?.text}</h3>
      <p className="text-neutral-400 text-sm mb-8 line-clamp-2">{biz.formattedAddress}</p>
      
      <div className="flex items-center justify-between pt-6 border-t border-neutral-50">
         <div className="flex items-center gap-2 text-neutral-400">
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{biz.websiteUri ? "Website Found" : "No Website"}</span>
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-brand group-hover:underline">Audit Profile</span>
      </div>
    </div>
  );
}

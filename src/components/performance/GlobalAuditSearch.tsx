"use client";

import { useState, useEffect } from "react";
import { Search, Zap, MapPin, Globe, Star, ArrowRight, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { AuditDashboard } from "./AuditDashboard";

export function GlobalAuditSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle Autocomplete
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/gbp/autocomplete?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (suggestion: any) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    setIsSearching(true);

    try {
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(suggestion.text)}`);
      const data = await res.json();
      setResults(data.places || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    setShowDropdown(false);
    setIsSearching(true);
    setResults([]);
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

  const copyLink = () => {
    const link = `${window.location.origin}/connect`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="anim-fade-up max-w-6xl mx-auto py-12">
      {/* 2026 SaaS Hero Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-100">
          <Sparkles size={14} />
          Intelligence Engine
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Command Center</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Search and audit any business profile on Google instantly.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-20">
        {/* Main Search Bar */}
        <div className="col-span-8 relative">
           <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[24px] opacity-10 blur-lg group-hover:opacity-20 transition-opacity"></div>
              <div className="relative flex items-center bg-white border border-slate-200 rounded-[20px] p-2 shadow-xl shadow-slate-100/50">
                <div className="flex-1 flex items-center px-6">
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-4" /> : <Search className="w-5 h-5 text-slate-400 mr-4" />}
                  <input 
                    type="text" 
                    placeholder="Search business name or address..."
                    className="w-full h-14 bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="flex items-center gap-3 px-10 h-14 bg-slate-900 text-white rounded-[16px] font-bold uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  Find Results
                </button>
              </div>
           </div>

           {/* Suggestions Dropdown */}
           {showDropdown && suggestions.length > 0 && (
             <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white rounded-[24px] border border-slate-200 shadow-2xl shadow-slate-200/50 z-[100] overflow-hidden">
                {suggestions.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="p-4 px-6 hover:bg-slate-50 cursor-pointer border-bottom border-slate-100 transition-all flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                       <MapPin size={18} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-900">{s.mainText}</p>
                       <p className="text-[11px] text-slate-400">{s.secondaryText}</p>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Public Onboarding Link Card */}
        <div className="col-span-4">
           <div className="bg-indigo-600 rounded-[20px] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Public Onboarding Link</p>
                 <h3 className="text-lg font-bold mb-4">Client Authorization</h3>
                 <button 
                  onClick={copyLink}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-3 transition-all border border-white/20"
                 >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {copied ? 'Copied Link' : 'Copy Link to Send'}
                    </span>
                 </button>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Globe className="w-20 h-20" />
              </div>
           </div>
        </div>
      </div>

      {/* Results Section */}
      {selectedBusiness ? (
        <div className="ds-anim-fade">
          <div className="flex items-center justify-between mb-12">
            <button 
              onClick={() => setSelectedBusiness(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Search
            </button>
            <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
               Live Report: {selectedBusiness.displayName?.text}
            </div>
          </div>
          <AuditDashboard auditData={selectedBusiness.mockAudit} isPublic />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((biz, i) => (
            <div 
              key={biz.id || i}
              onClick={() => {
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
              className="bg-white border border-slate-200 rounded-[24px] p-8 hover:border-indigo-600 hover:shadow-2xl hover:shadow-slate-100 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span className="text-xs font-bold text-slate-900">{biz.rating || "N/A"}</span>
                      <span className="text-xs text-slate-400 font-medium">({biz.userRatingCount || 0})</span>
                   </div>
                   <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{biz.primaryType?.replace(/_/g, ' ') || "Business"}</p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{biz.displayName?.text}</h3>
              <p className="text-slate-400 text-sm mb-8 line-clamp-2">{biz.formattedAddress}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                 <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{biz.websiteUri ? "Live Website" : "No Site"}</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:underline">Audit Profile</span>
              </div>
            </div>
          ))}
          {!isSearching && results.length === 0 && query.length > 5 && (
             <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">No businesses found. Try a different search query.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

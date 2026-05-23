"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, MapPin, Globe, Star, ArrowLeft, Loader2,
  Copy, Check, X, ChevronRight, ExternalLink, Printer, Sparkles
} from "lucide-react";
import { AuditDashboard } from "./AuditDashboard";

export function GlobalAuditSearch() {
  const [query, setQuery]               = useState("");
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [selected, setSelected]         = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Autocomplete debounce */
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setIsSearching(true); setApiError(null);
      try {
        const r = await fetch(`/api/gbp/autocomplete?input=${encodeURIComponent(query)}`);
        const d = await r.json();
        if (d.googleError) { setApiError(d.googleError); setSuggestions([]); return; }
        setSuggestions(d.suggestions || []);
        setShowDropdown((d.suggestions || []).length > 0);
      } catch { setSuggestions([]); }
      finally { setIsSearching(false); }
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = async (s: any) => {
    setShowDropdown(false);
    setQuery(s.text || s.mainText);
    setIsSearching(true);
    try {
      const r = await fetch(`/api/gbp/search?q=${encodeURIComponent(s.text || s.mainText)}`);
      const d = await r.json();
      if (d.googleError) { setApiError(d.googleError); return; }
      const place = d.places?.[0];
      if (place) setSelected(place);
    } catch {} finally { setIsSearching(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/connect`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setSelected(null); setQuery(""); setSuggestions([]); setApiError(null); };

  // ─── Calculate Public Audit Payload ───────────────────────────────────────
  const publicAudit = selected ? (() => {
    const checklist = {
      businessName: !!selected.displayName?.text,
      address: !!selected.formattedAddress,
      phone: !!selected.nationalPhoneNumber,
      website: !!selected.websiteUri,
      hours: !!selected.regularOpeningHours,
      description: !!selected.editorialSummary?.text,
      category: !!selected.primaryType,
      additionalCategories: (selected.types?.length || 0) > 1,
      specialHours: !!selected.regularOpeningHours,
      serviceArea: true,
      photos: (selected.photos?.length || 0) >= 5,
      googlePosts: (selected.reviews?.length || 0) > 0
    };

    const fieldsToTrack = Object.values(checklist);
    const filledFields = fieldsToTrack.filter(Boolean).length;
    const completionScore = Math.round((filledFields / fieldsToTrack.length) * 100);

    const reviews = selected.reviews || [];
    const repliedCount = reviews.filter((r: any) => !!r.reply).length;
    const replyRate = reviews.length > 0 ? Math.round((repliedCount / reviews.length) * 100) : 0;

    const reviewsPerWeek = selected.rating >= 4 ? 1.4 : 0.5;

    const velocityScore = Math.min(reviewsPerWeek / 2, 1) * 15;
    const photoScore = Math.min((selected.photos?.length || 0) / 10, 1) * 10;
    const postScore = reviews.length > 0 ? 10 : 0;

    const visibilityScore = Math.min(100, Math.round(
      (completionScore * 0.4) + 
      (replyRate * 0.25) + 
      velocityScore + 
      photoScore + 
      postScore
    ));

    return {
      completionScore,
      checklist,
      replyRate,
      reviewsPerWeek,
      visibilityScore,
      totalReviews: selected.userRatingCount || 0,
      averageRating: selected.rating || 0
    };
  })() : null;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      {/* ── Page Header (Hidden on print) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
            Command Center <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-extrabold tracking-wide uppercase">Lead Gen</span>
          </h1>
          <p className="text-sm text-slate-400 font-semibold">Search, audit, and export any business profile instantly</p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          {copied ? "Link Copied!" : "Copy Onboarding Link"}
        </button>
      </div>

      {/* ── Search Bar (Hidden on print) ── */}
      <div ref={dropRef} className="relative w-full max-w-lg mb-6 no-print">
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl h-12 px-4 gap-3 shadow-sm hover:border-slate-300 focus-within:border-indigo-500 transition-all">
          {isSearching
            ? <Loader2 size={18} className="animate-spin text-indigo-600 flex-shrink-0" />
            : <Search size={18} className="text-slate-400 flex-shrink-0" />
          }
          <input
            type="text"
            placeholder="Search business name or location address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow border-none outline-none text-sm text-slate-800 font-medium placeholder-slate-400 bg-transparent"
          />
          {query && (
            <button onClick={reset} className="text-slate-400 hover:text-slate-600 flex items-center p-1 rounded-full hover:bg-slate-50 transition-all">
              <X size={14} />
            </button>
          )}
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="flex items-start gap-2.5 mt-3 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold">
            <X size={14} className="flex-shrink-0 mt-0.5 text-rose-500" />
            {apiError}
          </div>
        )}

        {/* Autocomplete Dropdown suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => handleSelect(s)}
                className="w-full px-5 py-3.5 flex items-center gap-3.5 text-left hover:bg-slate-50 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-all">
                  <MapPin size={16} className="text-slate-400 group-hover:text-indigo-600 transition-all" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate leading-snug">
                    {s.mainText}
                  </p>
                  <p className="text-xs text-slate-400 truncate leading-normal mt-0.5">{s.secondaryText}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Panel Area ── */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[420px] flex flex-col items-center justify-center p-1">
        {!selected ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 border border-indigo-100 shadow-sm animate-pulse">
              <Search size={26} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Lead Generator</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Type at least 3 characters in the search bar above to fetch, audit, and download a gorgeous SEO proposal for any business.
            </p>
          </div>
        ) : (
          /* ── Full Interactive Audit Dashboard ── */
          <div className="w-full flex flex-col p-6 gap-6">
            
            {/* Header controls for selected place */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100 no-print">
              <div>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest leading-none mb-3 transition-all"
                >
                  <ArrowLeft size={13} /> Back to Search
                </button>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-none mb-2">
                  {selected.displayName?.text}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold flex-wrap">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                    {selected.primaryType?.replace(/_/g, " ") || "Local Business"}
                  </span>
                  {selected.websiteUri && (
                    <a 
                      href={selected.websiteUri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                    >
                      <Globe size={13} /> Visit Website <ExternalLink size={10} />
                    </a>
                  )}
                  {selected.googleMapsUri && (
                    <a 
                      href={selected.googleMapsUri} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1.5 text-slate-500 hover:underline"
                    >
                      <MapPin size={13} /> View on Maps <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Action row buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Download PDF Report
                </button>
                <button 
                  onClick={() => window.open("/connect", "_blank")}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  <Sparkles className="w-4 h-4" /> Connect with RankVed
                </button>
              </div>
            </div>

            {/* Redesigned Dashboard Component */}
            <AuditDashboard auditData={publicAudit} isPublic={true} publicData={selected} />

            {/* Bottom Leads Conversion CTA Banner (Hidden on print) */}
            <div className="mt-8 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
              <div className="max-w-xl text-center md:text-left">
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Automate optimization & reviews for this business</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Onboard this profile onto RankVed in 1 click. Unlock daily auto-post scheduling, automated review replies powered by custom AI context, photo SEO keyword optimization, and real-time rank tracking.
                </p>
              </div>
              <button
                onClick={() => window.open("/connect", "_blank")}
                className="flex-shrink-0 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Launch Onboarding Flow
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

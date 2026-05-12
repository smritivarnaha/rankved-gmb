"use client";

import { useState } from "react";
import { Search, MapPin, Star, Zap, Loader2, Info } from "lucide-react";
import { AuditReport } from "./AuditReport";

export function GlobalAuditSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 3) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (placeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gbp/search?placeId=${placeId}`);
      const data = await res.json();
      setSelectedBusiness(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="bg-white rounded-[32px] p-10 border-2 border-slate-100 shadow-xl shadow-slate-100/50">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Command Center</h2>
        <p className="text-slate-500 font-medium mb-8">Search and audit any business profile on Google.</p>
        
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            className="w-full pl-14 pr-32 py-6 bg-slate-50 border-2 border-transparent rounded-2xl text-lg font-bold placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all"
            placeholder="Type business name or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <button
            type="submit"
            className="absolute inset-y-3 right-3 px-8 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Results List */}
        {!selectedBusiness && results.length > 0 && (
          <div className="mt-6 space-y-3 anim-fade-up">
            {results.map((r) => (
              <button
                key={r.placeId}
                onClick={() => handleSelect(r.placeId)}
                className="w-full p-4 text-left bg-white border border-slate-100 rounded-xl hover:border-indigo-600 hover:shadow-lg transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{r.mainText}</p>
                    <p className="text-xs text-slate-400 font-medium">{r.secondaryText}</p>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-slate-200 group-hover:text-indigo-600 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audit View */}
      {selectedBusiness && (
        <div className="anim-fade-up space-y-6">
          <div className="flex items-center justify-between bg-indigo-900 text-white p-6 rounded-[24px] shadow-xl">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                   <Info className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black">{selectedBusiness.name}</h3>
                   <p className="text-indigo-200 text-sm font-medium">{selectedBusiness.formatted_address}</p>
                </div>
             </div>
             <button 
              onClick={() => setSelectedBusiness(null)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
             >
              Back to Search
             </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px] flex items-start gap-4">
             <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                <Zap className="w-5 h-5 fill-current" />
             </div>
             <div>
                <h4 className="font-black text-amber-900 uppercase tracking-widest text-xs mb-1">Public Audit Mode</h4>
                <p className="text-amber-800 text-sm font-medium leading-relaxed">
                  You are auditing a business that is not yet connected. Keyword and Impression data are hidden. 
                  Use this report to demonstrate value to the business owner.
                </p>
             </div>
          </div>

          {/* We will pass a "mock" ID for public audits or adapt the AuditReport to handle public objects */}
          <AuditReport profileId="PUBLIC_MODE" publicData={selectedBusiness} />
        </div>
      )}
    </div>
  );
}

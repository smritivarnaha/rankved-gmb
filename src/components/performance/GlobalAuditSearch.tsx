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
      } catch (err) { console.error(err); } 
      finally { setIsSearching(false); }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (suggestion: any) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    setIsSearching(true);
    setSelectedBusiness(null); // Reset
    try {
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(suggestion.text)}`);
      const data = await res.json();
      const place = data.places?.[0];
      if (place) {
        const mockAudit = {
          completionScore: 68, searchRank: 4.2, replyRate: 15, reviewsPerWeek: 0.5,
          totalReviews: place.userRatingCount || 0, averageRating: place.rating || 0,
          missingFields: ["Website", "Description", "Service Areas"]
        };
        setSelectedBusiness({ ...place, mockAudit });
      }
    } catch (err) { console.error(err); } 
    finally { setIsSearching(false); }
  };

  const handleSearch = async () => {
    setShowDropdown(false);
    setIsSearching(true);
    setResults([]);
    setSelectedBusiness(null);
    try {
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.places || []);
    } catch (err) { console.error(err); } 
    finally { setIsSearching(false); }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/connect`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F5F3FF', color: '#4F46E5', borderRadius: '99px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', border: '1px solid #DDD6FE' }}>
          <Sparkles size={14} />
          Intelligence Engine
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#111827', letterSpacing: '-0.04em', marginBottom: '16px' }}>Command Center</h1>
        <p style={{ color: '#64748B', fontSize: '18px', maxWidth: '600px', margin: '0 auto', fontWeight: '500' }}>
          Search and audit any business profile on Google instantly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '32px', marginBottom: '80px' }}>
        {/* Search Bar Container */}
        <div style={{ gridColumn: 'span 8', position: 'relative' }}>
           <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
               {isSearching ? <Loader2 size={20} className="anim-spin" style={{ color: '#4F46E5', marginRight: '16px' }} /> : <Search size={20} style={{ color: '#94A3B8', marginRight: '16px' }} />}
               <input 
                 type="text" 
                 placeholder="Search business name..."
                 style={{ width: '100%', height: '56px', border: 'none', outline: 'none', fontSize: '18px', fontWeight: '600', color: '#111827' }}
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               />
             </div>
             <button 
               onClick={handleSearch}
               style={{ padding: '0 40px', height: '56px', background: '#111827', color: '#fff', borderRadius: '18px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
             >
               Audit Now
             </button>
           </div>

           {/* Suggestions Dropdown */}
           {showDropdown && suggestions.length > 0 && (
             <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0, background: '#fff', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 30px 60px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
                {suggestions.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    style={{ padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ width: '40px', height: '40px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                       <MapPin size={18} />
                    </div>
                    <div>
                       <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{s.mainText}</p>
                       <p style={{ fontSize: '11px', color: '#94A3B8' }}>{s.secondaryText}</p>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Public Link Card */}
        <div style={{ gridColumn: 'span 4' }}>
           <div style={{ background: '#4F46E5', borderRadius: '24px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '8px' }}>Onboarding</p>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>Public Link</h3>
              <button 
                onClick={copyLink}
                style={{ width: '100%', height: '48px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied URL' : 'Copy Onboarding Link'}
              </button>
              <Globe size={80} style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }} />
           </div>
        </div>
      </div>

      {/* Results / Audit Section */}
      {selectedBusiness ? (
        <div className="anim-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
            <button 
              onClick={() => setSelectedBusiness(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: 'none' }}
            >
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> New Search
            </button>
            <div style={{ padding: '8px 24px', background: '#F1F5F9', borderRadius: '99px', fontSize: '11px', fontWeight: 'bold', color: '#475569', border: '1px solid #E2E8F0' }}>
               Current Audit: {selectedBusiness.displayName?.text}
            </div>
          </div>
          <AuditDashboard auditData={selectedBusiness.mockAudit} isPublic />
        </div>
      ) : results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {results.map((biz) => (
            <div 
              key={biz.id}
              onClick={() => {
                const mockAudit = {
                  completionScore: 68, searchRank: 4.2, replyRate: 15, reviewsPerWeek: 0.5,
                  totalReviews: biz.userRatingCount || 0, averageRating: biz.rating || 0,
                  missingFields: ["Website", "Description", "Service Areas"]
                };
                setSelectedBusiness({ ...biz, mockAudit });
              }}
              style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '32px', padding: '32px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', background: '#F8FAFC', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <MapPin size={24} />
                </div>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Star size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{biz.rating || "N/A"}</span>
                      <span style={{ fontSize: '13px', color: '#94A3B8' }}>({biz.userRatingCount || 0})</span>
                   </div>
                   <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{biz.primaryType?.replace(/_/g, ' ') || "Business"}</p>
                </div>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', lineHeight: '1.2' }}>{biz.displayName?.text}</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '32px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{biz.formattedAddress}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                    <Globe size={16} />
                    <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{biz.websiteUri ? "Live" : "No Site"}</span>
                 </div>
                 <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#4F46E5' }}>Audit Profile</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px' }} className="anim-fade-up">
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 16px', 
          backgroundColor: 'var(--brand-subtle)', 
          color: 'var(--brand)', 
          borderRadius: '99px', 
          fontSize: '11px', 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          marginBottom: '24px'
        }}>
          <Sparkles size={14} />
          RankVed Intelligence
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--neutral-900)', letterSpacing: '-0.04em', marginBottom: '16px' }}>
          Command Center
        </h1>
        <p style={{ color: 'var(--neutral-500)', fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Audit any business on Google instantly. Enter a business name or location to generate a professional performance report.
        </p>
      </div>

      {/* Search Input — 2026 SaaS Style (Inline Fixed) */}
      <div style={{ maxWidth: '800px', margin: '0 auto 80px', position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-default)',
          borderRadius: '24px',
          padding: '8px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <Search size={22} color="var(--neutral-400)" style={{ marginRight: '16px' }} />
            <input 
              type="text" 
              placeholder="Search business name or address..."
              style={{ 
                width: '100%', 
                height: '56px', 
                backgroundColor: 'transparent', 
                border: 'none', 
                fontSize: '18px', 
                fontWeight: '500', 
                color: 'var(--neutral-900)', 
                outline: 'none'
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 32px',
              height: '56px',
              backgroundColor: 'var(--neutral-900)',
              color: '#ffffff',
              borderRadius: '18px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '12px',
              cursor: 'pointer',
              border: 'none',
              opacity: isSearching ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isSearching ? <Loader2 size={18} className="anim-spin" /> : <><Zap size={16} fill="currentColor" /> Search</>}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {selectedBusiness ? (
        <div className="ds-anim-fade">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
            <button 
              onClick={() => setSelectedBusiness(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-400)', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
            >
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Search
            </button>
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--neutral-100)', borderRadius: '99px', fontSize: '12px', fontWeight: 'bold', color: 'var(--neutral-600)' }}>
              Target: {selectedBusiness.displayName?.text}
            </div>
          </div>
          <AuditDashboard auditData={selectedBusiness.mockAudit} isPublic />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
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
              style={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid var(--border-default)', 
                borderRadius: '32px', 
                padding: '32px', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--neutral-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)' }}>
                  <MapPin size={24} style={{ margin: 'auto' }} />
                </div>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Star size={14} color="var(--warning)" fill="var(--warning)" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--neutral-900)' }}>{biz.rating || "N/A"}</span>
                      <span style={{ fontSize: '13px', color: 'var(--neutral-400)', fontWeight: '500' }}>({biz.userRatingCount || 0})</span>
                   </div>
                   <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                     {biz.primaryType?.replace(/_/g, ' ') || "Business"}
                   </p>
                </div>
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neutral-900)', marginBottom: '8px', lineHeight: '1.2' }}>
                {biz.displayName?.text}
              </h3>
              <p style={{ color: 'var(--neutral-400)', fontSize: '14px', marginBottom: '32px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {biz.formattedAddress}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--neutral-50)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-400)' }}>
                    <Globe size={16} />
                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {biz.websiteUri ? "Live Website" : "No Site"}
                    </span>
                 </div>
                 <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>
                   Audit Profile
                 </span>
              </div>
            </div>
          ))}
          {!isSearching && results.length === 0 && query && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--neutral-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                   <Search size={32} color="var(--neutral-200)" />
                </div>
                <p style={{ color: 'var(--neutral-400)', fontWeight: '500' }}>No businesses found. Try a different search query.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

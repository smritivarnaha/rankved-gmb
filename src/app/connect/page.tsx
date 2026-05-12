"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Search, Zap, MapPin, CheckCircle2, Sparkles, ArrowRight, Loader2, Shield } from "lucide-react";
import Image from "next/image";

export default function ConnectPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
      // Fetch full place details using place ID
      const res = await fetch(`/api/gbp/search?q=${encodeURIComponent(suggestion.text)}`);
      const data = await res.json();
      const place = data.places?.[0];
      if (place) {
        setSelected(place);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = () => {
    signIn("google", { callbackUrl: "/success" });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <nav style={{ padding: '32px 48px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Image 
              src="https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif" 
              alt="RankVed" 
              width={18} 
              height={18} 
              style={{ filter: 'invert(1)' }}
            />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.04em' }}>RANKVED</span>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        
        {!selected ? (
          <div className="anim-fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '99px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
              <Sparkles size={14} />
              Business Onboarding
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#111827', letterSpacing: '-0.04em', marginBottom: '24px', lineHeight: '1.1' }}>
              Maximize your <span style={{ color: '#2563EB' }}>Local Visibility</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '48px', lineHeight: '1.6' }}>
              Connect your Google Business Profile to our intelligence engine to start automating reviews, posts, and SEO audits.
            </p>

            {/* Search Input Container */}
            <div style={{ position: 'relative', maxWidth: '650px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '24px', padding: '8px', border: '1px solid #E5E7EB', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                  {isSearching ? <Loader2 size={20} className="anim-spin" color="#2563EB" style={{ marginRight: '16px' }} /> : <Search size={20} color="#9CA3AF" style={{ marginRight: '16px' }} />}
                  <input 
                    type="text" 
                    placeholder="Type your business name..."
                    style={{ width: '100%', height: '56px', border: 'none', outline: 'none', fontSize: '18px', fontWeight: '500' }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Suggestions Dropdown — Grexa Style */}
              {showDropdown && suggestions.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 8px)', 
                  left: 0, 
                  right: 0, 
                  background: '#fff', 
                  borderRadius: '20px', 
                  border: '1px solid #E5E7EB', 
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  overflow: 'hidden',
                  textAlign: 'left'
                }}>
                  {suggestions.map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => handleSelect(s)}
                      style={{ padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                         <div style={{ width: '32px', height: '32px', background: '#F3F4F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={16} color="#9CA3AF" />
                         </div>
                         <div>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{s.mainText}</p>
                            <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{s.secondaryText}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="anim-fade-up">
             <div style={{ width: '100px', height: '100px', background: '#DBEAFE', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <CheckCircle2 size={48} color="#2563EB" />
             </div>
             <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '16px' }}>Perfect. Business identified.</h2>
             <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '48px' }}>
               Confirm you want to connect <span style={{ fontWeight: '700', color: '#111827' }}>{selected.displayName?.text}</span> to RankVed GMB Manager.
             </p>

             <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '24px', padding: '32px', marginBottom: '48px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                   <Shield size={20} color="#10B981" />
                   <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Secure Authorization</p>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  RankVed will request management access to your profile to respond to reviews and schedule posts.
                </p>
             </div>

             <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setSelected(null); setQuery(""); }}
                  style={{ 
                    height: '52px', padding: '0 28px', 
                    background: '#fff', 
                    border: '1.5px solid #D1D5DB', 
                    borderRadius: '12px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  ← Change Business
                </button>
                <button 
                  onClick={handleConnect}
                  style={{ 
                    height: '52px', padding: '0 32px', 
                    background: '#2563EB', color: '#fff', 
                    borderRadius: '12px', fontWeight: '600', 
                    fontSize: '14px',
                    border: 'none', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <Zap size={16} fill="currentColor" />
                  Connect with Google
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Footer Trust */}
      <footer style={{ position: 'fixed', bottom: '40px', width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Trusted by 500+ Local Agencies & Businesses
        </p>
      </footer>
    </div>
  );
}

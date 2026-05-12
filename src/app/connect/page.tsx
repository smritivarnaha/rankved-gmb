"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Search, Zap, MapPin, CheckCircle2, Sparkles, ArrowRight, Loader2, Shield } from "lucide-react";
import Image from "next/image";

export default function ConnectPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

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

  const handleConnect = () => {
    // Start OAuth flow with GBP scopes
    // We'll redirect to the standard next-auth signin which handles the scopes defined in authOptions
    signIn("google", { callbackUrl: "/success" });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
      {/* Header / Logo */}
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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        
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

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '64px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '24px', padding: '8px', border: '1px solid #E5E7EB', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                  <Search size={20} color="#9CA3AF" style={{ marginRight: '16px' }} />
                  <input 
                    type="text" 
                    placeholder="Type your business name..."
                    style={{ width: '100%', height: '56px', border: 'none', outline: 'none', fontSize: '18px', fontWeight: '500' }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  style={{ height: '56px', padding: '0 32px', background: '#111827', color: '#fff', borderRadius: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                >
                  {isSearching ? <Loader2 size={18} className="anim-spin" /> : 'Find Business'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div style={{ display: 'grid', gap: '16px' }}>
              {results.map((biz) => (
                <div 
                  key={biz.id}
                  onClick={() => setSelected(biz)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#F9FAFB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={20} color="#9CA3AF" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: '700', color: '#111827', marginBottom: '2px' }}>{biz.displayName?.text}</p>
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>{biz.formattedAddress}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} color="#D1D5DB" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="anim-fade-up">
             <div style={{ width: '100px', height: '100px', background: '#DBEAFE', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <CheckCircle2 size={48} color="#2563EB" />
             </div>
             <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', marginBottom: '16px' }}>Great! We found your profile.</h2>
             <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '48px' }}>
               Confirm you want to connect <span style={{ fontWeight: '700', color: '#111827' }}>{selected.displayName?.text}</span> to RankVed GMB Manager.
             </p>

             <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '24px', padding: '32px', marginBottom: '48px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                   <Shield size={20} color="#10B981" />
                   <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Secure Authorization</p>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  RankVed will only request permission to manage your Business Profile locations, respond to reviews, and post updates on your behalf. We will never access your private emails or other Google data.
                </p>
             </div>

             <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button 
                  onClick={() => setSelected(null)}
                  style={{ height: '64px', padding: '0 32px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Change Business
                </button>
                <button 
                  onClick={handleConnect}
                  style={{ height: '64px', padding: '0 40px', background: '#2563EB', color: '#fff', borderRadius: '20px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}
                >
                  <Zap size={20} fill="currentColor" />
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

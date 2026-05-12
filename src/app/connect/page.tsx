"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FindBusinessSearch } from "@/components/onboarding/FindBusinessSearch";
import { ShieldCheck, Sparkles, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PublicOnboardPage() {
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    if (selectedPlace) {
      localStorage.setItem("pendingOnboardPlace", JSON.stringify(selectedPlace));
    }
    // Trigger Google Auth - the Admin will receive the access
    signIn("google", { callbackUrl: "/connect/success" });
  };

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <nav className="relative z-10 px-8 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/rankved-logo.png" alt="Rankved" className="h-8" />
          <span className="text-xl font-black text-slate-900 tracking-tighter">GMB Manager</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          Secure Google Cloud Partner
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[11px] font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100 shadow-sm animate-bounce-subtle">
          <Sparkles className="w-3.5 h-3.5" />
          Magic Authorization
        </div>

        <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
          Connect Your Business <br /> 
          <span className="text-indigo-600">In 30 Seconds.</span>
        </h1>
        
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-16 leading-relaxed">
          Search for your business on Google Maps below to authorize management access. It's fast, secure, and permanent.
        </p>

        <div className="mb-12">
          <FindBusinessSearch onSelect={setSelectedPlace} />
        </div>

        {selectedPlace && (
          <div className="anim-fade-up flex flex-col items-center">
            <div className="flex items-center gap-3 text-emerald-600 font-bold mb-8 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
              Business Identified! Ready to connect.
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="group relative px-12 py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Authorize Management Access</span>
              <Zap className="relative z-10 w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
            </button>
            
            <p className="mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Official Google My Business API Integration
            </p>
          </div>
        )}

        <div className="mt-32 grid grid-cols-3 gap-12 border-t border-slate-100 pt-16">
          <div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-4 border border-slate-100">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-2">Instant Sync</h4>
            <p className="text-slate-400 text-sm font-medium">Data appears in the dashboard within seconds of connection.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-4 border border-slate-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-2">Secure Link</h4>
            <p className="text-slate-400 text-sm font-medium">We use Google's official OAuth protocol for your security.</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-4 border border-slate-100">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-2">Full Control</h4>
            <p className="text-slate-400 text-sm font-medium">You can revoke access at any time through your Google settings.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-50 text-center">
        <p className="text-xs text-slate-300 font-bold uppercase tracking-[0.3em]">
          Powered by Rankved GMB Scheduler
        </p>
      </footer>

      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        .anim-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

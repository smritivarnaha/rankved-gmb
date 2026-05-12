"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PartyPopper, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ConnectionSuccessPage() {
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    const pending = localStorage.getItem("pendingOnboardPlace");
    if (pending) {
      try {
        const place = JSON.parse(pending);
        setBusinessName(place.name);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[100px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-xl anim-fade-up">
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center text-emerald-600 mx-auto mb-10 shadow-xl shadow-emerald-100/50">
          <PartyPopper className="w-12 h-12" />
        </div>

        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">
          Connection Successful!
        </h1>
        
        <p className="text-xl text-slate-500 font-medium mb-12 leading-relaxed px-4">
          Great news! <span className="text-slate-900 font-bold">{businessName || "Your business"}</span> is now securely connected to our management hub.
        </p>

        <div className="bg-slate-50 border-2 border-slate-100 rounded-[32px] p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">Access Granted</h4>
              <p className="text-slate-400 text-sm font-semibold">Management sync active</p>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between py-3 border-b border-slate-100 text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Security</span>
                <span className="text-slate-900 font-black flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Encrypted
                </span>
             </div>
             <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Status</span>
                <span className="text-emerald-600 font-black px-3 py-1 bg-emerald-50 rounded-full text-xs">Live</span>
             </div>
          </div>
        </div>

        <p className="text-slate-400 text-sm font-semibold mb-8">
          You can now close this window. Our team will handle the rest!
        </p>

        <div className="flex flex-col items-center gap-4">
           <img src="/rankved-logo.png" alt="Rankved" className="h-6 grayscale opacity-30" />
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Official Integration Partner</p>
        </div>
      </div>

      <style jsx global>{`
        .anim-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

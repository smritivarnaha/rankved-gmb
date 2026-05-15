"use client";

import { signIn } from "next-auth/react";
import { ShieldCheck, ArrowRight, Zap, Globe, BarChart3, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function OnboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    // Admin ID: cmo33rkyy0000jm04n975frer (rankved.business@gmail.com)
    // By setting linkUserId, the Google login will automatically link to the admin context
    document.cookie = "linkUserId=cmo33rkyy0000jm04n975frer; path=/; max-age=3600";
    signIn("google", { callbackUrl: "/onboard/success" });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-[480px] w-full">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-[#2563eb] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6 transform hover:scale-105 transition-transform">
            <Globe className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-[#0f172a] tracking-tight text-center mb-3">
            Connect Your <span className="text-[#2563eb]">Business Profile</span>
          </h1>
          <p className="text-[#64748b] text-center text-[15px] font-medium leading-relaxed max-w-[360px]">
            Grant RankVed access to manage and automate your Google Business Profile posts.
          </p>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-3xl border border-[#f1f5f9] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Zap className="text-[#2563eb]" size={20} />
              </div>
              <div>
                <h3 className="text-[#1e293b] font-bold text-[15px] mb-1">Automated Publishing</h3>
                <p className="text-[#64748b] text-sm leading-snug">We'll handle your daily post updates automatically.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <BarChart3 className="text-[#4f46e5]" size={20} />
              </div>
              <div>
                <h3 className="text-[#1e293b] font-bold text-[15px] mb-1">Advanced Performance</h3>
                <p className="text-[#64748b] text-sm leading-snug">Track engagement and optimization directly from our dashboard.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-[#059669]" size={20} />
              </div>
              <div>
                <h3 className="text-[#1e293b] font-bold text-[15px] mb-1">Secure Management</h3>
                <p className="text-[#64748b] text-sm leading-snug">Safe, official Google API integration with granular control.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-[#f1f5f9]">
            <button 
              onClick={handleConnect}
              className="w-full h-14 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200"
            >
              Connect with Google <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-[#94a3b8] text-sm font-medium animate-in fade-in duration-1000 delay-500">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Powered by RankVed Technology
        </div>
      </div>
    </div>
  );
}

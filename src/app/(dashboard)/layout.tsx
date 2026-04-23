import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Suspense } from "react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  
  const isApproved = user?.isApproved;
  const role = user?.role;
  
  // Super Admins and Agency Owners created by Admin should ALWAYS have access
  const hasAccess = isApproved || role === "SUPER_ADMIN" || role === "AGENCY_OWNER";

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">
          {hasAccess ? (
            <Suspense fallback={
              <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
              </div>
            }>
              <div className="app-content-inner anim-fade-up">{children}</div>
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center anim-fade">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                <ShieldAlert className="w-10 h-10 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Account Pending Review</h1>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
                Your account has been created successfully. For security, a workspace administrator 
                (<span className="font-semibold text-slate-700">rankved.business@gmail.com</span>) 
                needs to verify your profile before you can start posting.
              </p>
              
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full anim-pulse" />
                <span className="text-sm font-bold text-amber-800 tracking-tight uppercase">Waiting for Review</span>
              </div>
              
              <p className="mt-12 text-xs text-slate-400">
                Usually takes less than 24 hours. You'll be notified via email.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

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
          <Suspense fallback={
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
          }>
            <div className="app-content-inner anim-fade-up">{children}</div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

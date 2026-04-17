import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  const isApproved = user?.isApproved;
  const role = user?.role;

  // Let SUPER_ADMIN see the admin page even if somehow isApproved is false
  const hasAccess = isApproved || role === "SUPER_ADMIN";
  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)] overflow-hidden">
      <Sidebar />
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 relative">
          {hasAccess ? (
            <div className="mx-auto max-w-[1100px]">{children}</div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50 bg-white">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Pending Approval</h1>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                Your account has been created, but you must be approved by the workspace administrator (<span className="font-semibold text-[var(--text-primary)]">rankved.business@gmail.com</span>) before you can connect Google accounts and create posts.
              </p>
              <div className="mt-8 p-4 bg-gray-50 border border-gray-100 rounded-xl max-w-sm w-full mx-auto shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">Status</p>
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for Admin Review
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

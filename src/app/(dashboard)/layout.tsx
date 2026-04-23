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
  const hasAccess = isApproved || role === "SUPER_ADMIN";


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
            <div className="approval-screen">
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <ShieldAlert style={{ width: 36, height: 36, color: "var(--accent)" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Pending Approval</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400, lineHeight: 1.7 }}>
                Your account has been created, but you must be approved by the workspace administrator (<strong>rankved.business@gmail.com</strong>) before you can connect Google accounts and create posts.
              </p>
              <div style={{ marginTop: 24, padding: "14px 20px", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius-md)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 4 }}>Status</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--warning)" }}>
                  <span className="anim-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warning)" }} />
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

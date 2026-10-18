import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileLayoutProvider } from "@/components/layout/mobile-layout";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayoutProvider>
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
              <div className="app-content-inner">{children}</div>
            </Suspense>
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </MobileLayoutProvider>
  );
}

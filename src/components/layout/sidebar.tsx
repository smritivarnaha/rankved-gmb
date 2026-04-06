"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  MapPin,
  FileText,
  Users,
  Building2
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Profiles", href: "/profiles", icon: MapPin },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const teamNav = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profiles", href: "/profiles", icon: MapPin },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
];

// Mobile bottom bar shows only the most important items
const mobileAdminNav = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Settings", href: "/settings", icon: Settings },
];

const mobileTeamNav = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profiles", href: "/profiles", icon: MapPin },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const navItems = role === "ADMIN" ? adminNav : teamNav;
  const mobileNavItems = role === "ADMIN" ? mobileAdminNav : mobileTeamNav;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[240px] border-r border-[var(--border)] bg-white min-h-screen hidden md:flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-[var(--border)]">
          <span className="font-semibold text-[15px] text-[var(--text-primary)] tracking-[-0.01em]">
            Rankved GMB Manager
          </span>
        </div>
        
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-colors",
                    isActive 
                      ? "bg-[var(--accent-light)] text-[var(--accent)]" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pb-4">
          <div className="px-3 py-2 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            {role === "ADMIN" ? "Admin" : "Team Member"}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--border)] px-1 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-2 min-w-[56px] rounded-lg transition-colors",
                  isActive
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.6} />
                <span className="text-[10px] font-medium leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

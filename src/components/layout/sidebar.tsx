"use client";

import Link from "next/link";
import Image from "next/image";
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
  Building2,
  Map,
  Shield
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Locations", href: "/locations", icon: Map },
  { name: "Profiles", href: "/profiles", icon: MapPin },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const superAdminNav = [
  ...adminNav,
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
];

const teamNav = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Locations", href: "/locations", icon: Map },
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
  const navItems = role === "SUPER_ADMIN" ? superAdminNav : (role === "ADMIN" ? adminNav : teamNav);
  const mobileNavItems = role === "ADMIN" || role === "SUPER_ADMIN" ? mobileAdminNav : mobileTeamNav;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[250px] border-r border-[var(--border-light)] bg-white min-h-screen hidden md:flex flex-col shrink-0">
        <div className="h-[60px] flex items-center gap-3 px-5 border-b border-[var(--border-light)]">
          <Image src="/rankved-logo.png" alt="Rankved" width={32} height={32} className="rounded-lg" />
          <div>
            <span className="font-bold text-[15px] text-[var(--text-primary)] tracking-tight leading-tight block">
              RankVed
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-medium">GMB Manager</span>
          </div>
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
                    "flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium transition-all duration-150",
                    isActive 
                      ? "bg-[var(--accent-light)] text-[var(--accent)] shadow-[0_1px_3px_rgba(79,70,229,0.08)]" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.7} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pb-4">
          <div className="px-3 py-2.5 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${role === "SUPER_ADMIN" || role === "ADMIN" ? "bg-[var(--accent)]" : "bg-[var(--text-tertiary)]"}`} />
            {role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : "Team Member"}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[var(--border-light)] px-1 pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-2 min-w-[56px] rounded-xl transition-all",
                  isActive
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-bold" : "font-medium"
                )}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

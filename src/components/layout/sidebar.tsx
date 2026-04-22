"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  MapPin,
  FileText,
  Users,
  Shield
} from "lucide-react";

const adminNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profiles", href: "/profiles", icon: MapPin },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const superAdminNav = [
  ...adminNav,
  { name: "Admin Setup", href: "/admin", icon: Shield },
];

const teamNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profiles", href: "/profiles", icon: MapPin },
  { name: "Posts", href: "/posts", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
];

// Mobile bottom bar shows only the most important items
const mobileAdminNav = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
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
      <aside className="w-[240px] border-r border-[var(--border-light)] bg-[var(--bg-primary)] min-h-screen hidden md:flex flex-col shrink-0 transition-colors">
        
        {/* Product header */}
        <div className="h-[70px] flex items-center justify-center border-b border-[var(--border-light)]">
          <Image src="/rankved-logo.png" alt="RankVed" width={140} height={40} className="object-contain" priority />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          <div className="space-y-1.5 whitespace-nowrap">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-[var(--accent)] text-white shadow-md shadow-blue-500/20" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2 : 1.8} />
                  <span className={`font-medium tracking-tight text-[14px] ${isActive ? "font-semibold" : ""}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Role badge */}
        <div className="p-5 border-t border-[var(--border-light)] bg-[var(--bg-tertiary)]/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${role === "SUPER_ADMIN" || role === "ADMIN" ? "bg-[var(--success)] shadow-[0_0_8px_var(--success)]" : "bg-[var(--text-tertiary)]"}`} />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : "Team Member"}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border-light)] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 mt-1 py-1 px-3 min-w-[64px] rounded-2xl transition-all ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div className={`p-1.5 rounded-full transition-all ${isActive ? "bg-[var(--accent-light)] scale-110" : ""}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] tracking-wide ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

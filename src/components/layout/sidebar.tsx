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
      {/* Desktop Sidebar — Google MD3 Navigation Drawer style */}
      <aside className="w-[240px] border-r border-[var(--border-light)] bg-white min-h-screen hidden md:flex flex-col shrink-0"
        style={{ boxShadow: "1px 0 0 var(--border-light)" }}>

        {/* Product header — Google Workspace style */}
        <div className="h-[64px] flex items-center gap-3 px-5 border-b border-[var(--border-light)]">
          <Image src="/rankved-logo.png" alt="Rankved" width={28} height={28} className="rounded-md" />
          <div>
            <span style={{ fontFamily: "'Google Sans','Roboto',sans-serif", fontWeight: 500, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em", display: "block", lineHeight: 1.2 }}>
              RankVed
            </span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 400, letterSpacing: "0.01em" }}>GMB Manager</span>
          </div>
        </div>

        {/* Nav items — Google MD3 pill style */}
        <nav className="flex-1 px-2 py-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 24, // Google uses full-pill for active nav items
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: "'Google Sans','Roboto',sans-serif",
                    letterSpacing: "0.01em",
                    textDecoration: "none",
                    background: isActive ? "var(--accent-light)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-secondary)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} strokeWidth={isActive ? 2.2 : 1.6} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Role badge */}
        <div style={{ padding: "12px 16px 20px", borderTop: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: role === "SUPER_ADMIN" || role === "ADMIN" ? "var(--accent)" : "var(--text-tertiary)"
            }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : "Team Member"}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar — Google MD3 style */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--border-light)] px-1 pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -1px 0 var(--border-light)" }}
      >
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] rounded-xl transition-colors"
                style={{ color: isActive ? "var(--accent)" : "var(--text-tertiary)" }}
              >
                {/* MD3 pill indicator on active */}
                <div style={{
                  padding: "4px 12px",
                  borderRadius: 16,
                  background: isActive ? "var(--accent-light)" : "transparent",
                  marginBottom: 2,
                }}>
                  <Icon style={{ width: 20, height: 20 }} strokeWidth={isActive ? 2.2 : 1.6} />
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, fontFamily: "'Google Sans','Roboto',sans-serif" }}>
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

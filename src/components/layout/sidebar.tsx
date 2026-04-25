"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, Settings, MapPin,
  FileText, Users, Shield, BarChart3, Key
} from "lucide-react";

const adminNav = [
  { name: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { name: "Performance", href: "/performance", icon: BarChart3 },
  { name: "Profiles",    href: "/profiles",    icon: MapPin },
  { name: "Posts",       href: "/posts",       icon: FileText },
  { name: "Calendar",    href: "/calendar",    icon: CalendarDays },
  { name: "Team",        href: "/team",        icon: Users },
  { name: "API Keys",    href: "/api-keys",    icon: Key },
  { name: "Settings",    href: "/settings",    icon: Settings },
];

const superAdminNav = [
  ...adminNav,
  { name: "Admin Setup", href: "/admin", icon: Shield },
];

const teamNav = [
  { name: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { name: "Performance", href: "/performance", icon: BarChart3 },
  { name: "Profiles",    href: "/profiles",    icon: MapPin },
  { name: "Posts",       href: "/posts",       icon: FileText },
  { name: "Calendar",    href: "/calendar",    icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = (session as any)?.user;
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN" || user?.email?.toLowerCase() === "rankved.business@gmail.com";
  
  const navItems =
    isSuperAdmin ? superAdminNav :
    role === "AGENCY_OWNER" ? adminNav :
    teamNav;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Image
          src="/logo.png"
          alt="RankVed"
          width={110}
          height={36}
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`sidebar-link${isActive ? " active" : ""}`}
            >
              <Icon
                style={{ width: 20, height: 20, flexShrink: 0 }}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-role">
          {isSuperAdmin
            ? "Super Admin"
            : role === "AGENCY_OWNER"
            ? "Agency Owner"
            : "Team Member"}
        </div>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, Settings, MapPin,
  FileText, Users, Shield
} from "lucide-react";

const adminNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profiles",  href: "/profiles",  icon: MapPin },
  { name: "Posts",     href: "/posts",     icon: FileText },
  { name: "Calendar",  href: "/calendar",  icon: CalendarDays },
  { name: "Team",      href: "/team",      icon: Users },
  { name: "Settings",  href: "/settings",  icon: Settings },
];

const superAdminNav = [
  ...adminNav,
  { name: "Admin Setup", href: "/admin", icon: Shield },
];

const teamNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profiles",  href: "/profiles",  icon: MapPin },
  { name: "Posts",     href: "/posts",     icon: FileText },
  { name: "Calendar",  href: "/calendar",  icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const navItems =
    role === "SUPER_ADMIN" ? superAdminNav :
    role === "ADMIN"       ? adminNav       :
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
          {role === "SUPER_ADMIN"
            ? "Super Admin"
            : role === "ADMIN"
            ? "Admin"
            : "Team Member"}
        </div>
      </div>
    </aside>
  );
}

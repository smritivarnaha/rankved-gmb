"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, Settings, MapPin,
  FileText, Users, Shield, BarChart3, Key, Zap
} from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

const adminNav = [
  { name: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { name: "Command Center", href: "/command-center", icon: Zap },
  { name: "Performance", href: "/performance", icon: BarChart3 },
  { name: "Profiles",    href: "/profiles",    icon: MapPin },
  { name: "Calendar",    href: "/calendar",    icon: CalendarDays },
  { name: "Prompts",     href: "/prompts",     icon: FileText },
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
  { name: "Calendar",    href: "/calendar",    icon: CalendarDays },
  { name: "Prompts",     href: "/prompts",     icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useGlobalSettings();
  const aiFeaturesEnabled = settings?.aiFeaturesEnabled ?? false;

  const user = (session as any)?.user;
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN" || user?.email?.toLowerCase() === "rankved.business@gmail.com";
  
  let navItems =
    isSuperAdmin ? superAdminNav :
    role === "AGENCY_OWNER" ? adminNav :
    teamNav;

  if (!aiFeaturesEnabled) {
    navItems = navItems.filter(item => item.name !== "Prompts");
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center">
             <Image
              src="https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
              alt="RankVed"
              width={18}
              height={18}
              className="invert"
              priority
            />
          </div>
          <span className="text-md font-bold tracking-tight">
            GMB Manager
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-role">
          <Shield className="w-4 h-4" />
          <span>
            {isSuperAdmin ? "Super Admin" : role === "AGENCY_OWNER" ? "Agency Owner" : "Team Member"}
          </span>
        </div>
      </div>
    </aside>
  );
}

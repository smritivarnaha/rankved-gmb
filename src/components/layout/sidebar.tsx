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
    <aside className="sidebar bg-white border-r-2 border-slate-50 flex flex-col h-screen sticky top-0 w-72">
      {/* Logo */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
             <Image
              src="https://rankved.com/wp-content/uploads/2025/04/Rankved-Logo-Official-Black.avif"
              alt="RankVed"
              width={20}
              height={20}
              className="invert"
              priority
            />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">
            GMB Manager
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`group flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? "bg-slate-900 text-white shadow-2xl shadow-slate-300" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-8 border-t border-slate-50">
        <div className="px-4 py-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border border-slate-100">
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

"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Search, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Topbar() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="topbar">
      {/* Left: Mobile logo + Search */}
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 16 }}>
        <div className="mobile-logo" style={{ display: "none" }}>
          <Image src="/logo.png" alt="RankVed" width={100} height={30} style={{ objectFit: "contain" }} priority />
        </div>
        <div className="topbar-search">
          <Search className="topbar-search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>
      </div>

      {/* Right: Avatar */}
      <div className="topbar-right">
        <div style={{ position: "relative" }} ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} title={name} className="topbar-avatar-btn">
            {session?.user?.image ? (
              <img src={session.user.image} alt={name} className="topbar-avatar" />
            ) : (
              <div className="topbar-avatar-fallback">{initials}</div>
            )}
            <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)", transition: "transform 0.2s", transform: showMenu ? "rotate(180deg)" : "none" }} />
          </button>

          {showMenu && (
            <div className="topbar-dropdown anim-fade-up">
              <div className="topbar-dropdown-header">
                <p className="topbar-dropdown-name">{name}</p>
                <p className="topbar-dropdown-email">{email}</p>
              </div>
              <div className="topbar-dropdown-actions">
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="topbar-signout">
                  <LogOut style={{ width: 16, height: 16 }} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

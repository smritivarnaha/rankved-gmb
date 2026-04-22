"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Search, LogOut, ChevronDown, Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";

export function Topbar() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme(systemTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-[70px] border-b border-[var(--border-light)] glass px-6 flex items-center justify-between sticky top-0 z-10 gap-3 transition-colors duration-200">
      {/* Left: Mobile logo + Search bar */}
      <div className="flex items-center flex-1 gap-4">
        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <Image src="/rankved-logo.png" alt="RankVed" width={100} height={30} className="object-contain" priority />
        </div>

        {/* Search */}
        <div className="hidden sm:block relative w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-[var(--bg-secondary)] border border-transparent rounded-[12px] py-2 pl-10 pr-4 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all duration-200"
          />
        </div>
      </div>

      {/* Right: Theme Toggle + Avatar */}
      <div className="flex items-center gap-4">
        
        {/* Dark Mode Toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all duration-200"
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" || (theme === "system" && systemTheme === "dark") ? (
              <Moon className="w-5 h-5 transition-transform duration-300" />
            ) : (
              <Sun className="w-5 h-5 transition-transform duration-300" />
            )}
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            title={name}
            className="flex items-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-light)] p-1 pr-3 rounded-full transition-all duration-200 border border-[var(--border-light)]"
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                {initials}
              </div>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-[240px] bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[16px] shadow-xl overflow-hidden z-50 animate-fade-in-up origin-top-right">
              {/* Account info */}
              <div className="px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]/50">
                <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-0.5">{name}</p>
                <p className="text-[12px] text-[var(--text-tertiary)] truncate">{email}</p>
              </div>
              
              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
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

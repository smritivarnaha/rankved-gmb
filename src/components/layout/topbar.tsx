"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Search, User, LogOut, ChevronDown } from "lucide-react";
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

  return (
    <header className="h-[60px] border-b border-[var(--border-light)] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="flex items-center flex-1 gap-3">
        {/* Show app name on mobile since sidebar is hidden */}
        <div className="md:hidden flex items-center gap-2.5">
          <Image src="/rankved-logo.png" alt="Rankved" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-[14px] text-[var(--text-primary)] tracking-tight whitespace-nowrap">
            RankVed
          </span>
        </div>
        <div className="relative w-72 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl pl-10 pr-4 py-[8px] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border)] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
        >
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{session?.user?.name || "User"}</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{session?.user?.email || ""}</span>
          </div>
          
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-lg ring-2 ring-[var(--border-light)]" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--accent)]" />
            </div>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-tertiary)] hidden sm:block transition-transform ${showMenu ? "rotate-180" : ""}`} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[var(--border-light)] rounded-xl shadow-[var(--shadow-lg)] py-1.5 z-50">
            <div className="px-4 py-2.5 border-b border-[var(--border-light)] sm:hidden">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{session?.user?.name || "User"}</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">{session?.user?.email || ""}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors flex items-center gap-2.5"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import { Search, User, LogOut } from "lucide-react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-[var(--border)] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center flex-1 gap-3">
        {/* Show app name on mobile since sidebar is hidden */}
        <span className="md:hidden font-semibold text-[14px] text-[var(--text-primary)] tracking-[-0.01em] whitespace-nowrap">
          Rankved GMB
        </span>
        <div className="relative w-72 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg pl-9 pr-4 py-[7px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[13px] font-medium text-[var(--text-primary)] leading-tight">{session?.user?.name || "User"}</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{session?.user?.email || ""}</span>
          </div>
          
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

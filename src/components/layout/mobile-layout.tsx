"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface MobileLayoutCtx {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const Ctx = createContext<MobileLayoutCtx>({ mobileOpen: false, openMobile: () => {}, closeMobile: () => {} });

export function MobileLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  return <Ctx.Provider value={{ mobileOpen, openMobile, closeMobile }}>{children}</Ctx.Provider>;
}

export function useMobileLayout() {
  return useContext(Ctx);
}

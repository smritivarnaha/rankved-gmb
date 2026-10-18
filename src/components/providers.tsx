"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateIfStale: false,
          dedupingInterval: 30000,
          keepPreviousData: true,
        }}
      >
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </NextThemesProvider>
      </SWRConfig>
    </SessionProvider>
  );
}


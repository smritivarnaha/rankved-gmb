"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress once
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
});

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When the component mounts, or when the pathname/searchParams change,
    // it means a route transition just finished, so we complete the progress bar.
    NProgress.done();

    // Since Next.js 13+ App Router doesn't natively expose router events yet,
    // a common workaround is to intercept clicks on <Link> or just rely on 
    // starting the progress bar on interaction, and finishing it here.
    // However, for simplicity without complex interceptors, we can just ensure 
    // it finishes whenever the route changes.
    return () => {
      NProgress.start();
    };
  }, [pathname, searchParams]);

  return null;
}

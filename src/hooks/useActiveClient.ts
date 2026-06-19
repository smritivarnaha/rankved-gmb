"use client";

import { useState, useEffect } from "react";

export function useActiveClient() {
  const [activeClient, setActiveClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getCookie = (name: string) => {
    if (typeof window === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  const setCookie = (name: string, val: string, days = 7) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${val || ""}${expires}; path=/; SameSite=Strict`;
  };

  useEffect(() => {
    const storedClient = localStorage.getItem("smm_active_client");
    if (storedClient) {
      try {
        setActiveClient(JSON.parse(storedClient));
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);

    // Listen to changes from other tabs or components
    const handleChanged = () => {
      const updated = localStorage.getItem("smm_active_client");
      if (updated) {
        setActiveClient(JSON.parse(updated));
      } else {
        setActiveClient(null);
      }
    };

    window.addEventListener("smm_active_client_changed", handleChanged);
    return () => window.removeEventListener("smm_active_client_changed", handleChanged);
  }, []);

  const selectClient = (client: any) => {
    setActiveClient(client);
    if (client) {
      localStorage.setItem("smm_active_client", JSON.stringify(client));
      setCookie("smm_active_client_id", client.id);
    } else {
      localStorage.removeItem("smm_active_client");
      setCookie("smm_active_client_id", "");
    }
    window.dispatchEvent(new Event("smm_active_client_changed"));
  };

  return { activeClient, selectClient, loading };
}

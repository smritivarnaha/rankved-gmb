"use client";

import { useState, useEffect } from "react";
import { useActiveClient } from "@/hooks/useActiveClient";
import Link from "next/link";
import { 
  Share2, AlertCircle, ArrowRight, CheckCircle2, 
  XCircle, RefreshCw, LogOut, Loader2
} from "lucide-react";

const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Instagram = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad)" />
    <rect x="5" y="5" width="14" height="14" rx="3.5" ry="3.5" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="16.5" cy="7.5" r="0.9" fill="#fff" />
  </svg>
);

const Linkedin = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#0A66C2" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export default function SmmConnectionsPage() {
  const { activeClient, loading: loadingActive } = useActiveClient();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [copiedOnboard, setCopiedOnboard] = useState(false);

  const getOnboardLink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/smm/onboard/${activeClient.id}`;
  };

  const handleCopyOnboard = () => {
    navigator.clipboard.writeText(getOnboardLink());
    setCopiedOnboard(true);
    setTimeout(() => setCopiedOnboard(false), 2000);
  };

  const handleShareOnboardWhatsApp = () => {
    const link = getOnboardLink();
    const contact = activeClient.contactPerson || "Doctor";
    const text = `Hi ${contact},\n\nPlease connect your clinic's Facebook, Instagram, or LinkedIn accounts to our agency portal using this secure onboarding link:\n\n${link}\n\nThank you!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const fetchConnections = async () => {
    if (!activeClient) return;
    try {
      const res = await fetch(`/api/smm/connections?clientId=${activeClient.id}`);
      const data = await res.json();
      if (data.data) {
        setConnections(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeClient) {
      setLoading(true);
      fetchConnections().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeClient]);

  const handleConnectSimulated = async (platform: string) => {
    if (!activeClient) return;
    setSubmitting(platform);
    
    // Generate simulated names and IDs based on client business name
    const bizName = activeClient.businessClinicName || activeClient.name;
    let accountName = "";
    let accountId = "";
    let avatarUrl = "";

    if (platform === "FACEBOOK") {
      accountName = `${bizName} Facebook Page`;
      accountId = `fb_${Math.floor(100000000 + Math.random() * 900000000)}`;
      avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=fb-${activeClient.id}`;
    } else if (platform === "INSTAGRAM") {
      accountName = `@${bizName.toLowerCase().replace(/[^a-z0-9]/g, "")}_clinic`;
      accountId = `ig_${Math.floor(100000000 + Math.random() * 900000000)}`;
      avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=ig-${activeClient.id}`;
    } else if (platform === "LINKEDIN") {
      accountName = `${bizName} LinkedIn Page`;
      accountId = `li_${Math.floor(100000000 + Math.random() * 900000000)}`;
      avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=li-${activeClient.id}`;
    }

    try {
      const res = await fetch("/api/smm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          platform,
          accountId,
          accountName,
          accessToken: `simulated_token_${platform.toLowerCase()}_12345`,
          avatarUrl,
          status: "CONNECTED"
        })
      });
      const data = await res.json();
      if (data.data) {
        await fetchConnections();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(null);
    }
  };

  const handleDisconnect = async (id: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect this ${platform} account?`)) return;
    setSubmitting(platform);
    try {
      const res = await fetch(`/api/smm/connections?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        await fetchConnections();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to disconnect account");
    } finally {
      setSubmitting(null);
    }
  };

  if (loadingActive) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (!activeClient) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 600, margin: "60px auto", padding: "0 16px" }}>
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Share2 size={24} color="#7e22ce" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Select Client Workspace</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
            SMM connections are client-specific. Please select a client workspace first to configure Facebook, Instagram, or LinkedIn accounts.
          </p>
          <Link href="/smm/clients" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 42,
            padding: "0 20px",
            background: "#7e22ce",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none"
          }}>
            Choose SMM Client <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const getConnection = (platform: string) => connections.find(c => c.platform === platform);

  const platforms = [
    {
      id: "FACEBOOK",
      name: "Facebook Page",
      description: "Publish updates, photos, and events directly to your business page.",
      icon: Facebook,
      color: "#1877F2",
      bgLight: "#e8f2ff",
    },
    {
      id: "INSTAGRAM",
      name: "Instagram Business",
      description: "Share photos and visual content to direct patient engagement feed.",
      icon: Instagram,
      color: "#E1306C",
      bgLight: "#fff0f5",
    },
    {
      id: "LINKEDIN",
      name: "LinkedIn Page",
      description: "Connect to organization page for professional networking and career posts.",
      icon: Linkedin,
      color: "#0A66C2",
      bgLight: "#edf3f9",
    }
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Social Account Connections</h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
          Manage API bindings for workspace: <strong style={{ color: "#7e22ce" }}>{activeClient.name}</strong>
        </p>
      </div>

      {/* Client Onboarding Link Card */}
      <div style={{
        background: "linear-gradient(135deg, #fdf4ff 0%, #eff6ff 100%)",
        border: "1px solid #f3e8ff",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h4 style={{ fontSize: 13.5, fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px" }}>Client Self-Onboarding Link</h4>
          <p style={{ fontSize: 12.5, color: "#475569", margin: 0 }}>
            Send this secure link to allow the doctor or clinic manager to connect their own social accounts without logging in.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={handleCopyOnboard}
            style={{
              height: 34,
              padding: "0 12px",
              background: copiedOnboard ? "#ecfdf5" : "#fff",
              border: "1px solid #e2e8f0",
              color: copiedOnboard ? "#059669" : "#475569",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {copiedOnboard ? <CheckCircle2 size={13} /> : <Share2 size={13} />}
            {copiedOnboard ? "Copied Link" : "Copy Link"}
          </button>
          <button
            onClick={handleShareOnboardWhatsApp}
            style={{
              height: 34,
              padding: "0 12px",
              background: "#25d366",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Share2 size={13} /> WhatsApp Invitation
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {platforms.map(platform => {
            const conn = getConnection(platform.id);
            const IconComponent = platform.icon;
            
            return (
              <div key={platform.id} style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 28,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 24
              }}>
                <div style={{ display: "flex", gap: 20, flex: 1, minWidth: 280 }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: 12,
                    background: platform.bgLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <IconComponent size={28} color={platform.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                      {platform.name}
                      {conn && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 100,
                          background: conn.status === "CONNECTED" ? "#ecfdf5" : "#fef2f2",
                          color: conn.status === "CONNECTED" ? "#059669" : "#ef4444",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}>
                          {conn.status === "CONNECTED" ? (
                            <><CheckCircle2 size={10} /> Connected</>
                          ) : (
                            <><XCircle size={10} /> Token Expired</>
                          )}
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                      {platform.description}
                    </p>
                  </div>
                </div>

                {/* Connection Action / Details */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {conn ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {conn.avatarUrl ? (
                          <img 
                            src={conn.avatarUrl} 
                            alt={conn.accountName}
                            style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9" }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Share2 size={16} color="#64748b" />
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 1px" }}>{conn.accountName}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>ID: {conn.accountId}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDisconnect(conn.id, platform.id)}
                        disabled={submitting === platform.id}
                        style={{
                          height: 36,
                          padding: "0 12px",
                          background: "#fff",
                          border: "1px solid #fee2e2",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {submitting === platform.id ? <RefreshCw className="animate-spin" size={13} /> : <LogOut size={13} />} Disconnect
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      {/* Simulation Button */}
                      <button 
                        onClick={() => handleConnectSimulated(platform.id)}
                        disabled={submitting === platform.id}
                        style={{
                          height: 38,
                          padding: "0 16px",
                          background: "#7e22ce",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {submitting === platform.id ? <RefreshCw className="animate-spin" size={13} /> : <RefreshCw size={13} />} Simulated Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

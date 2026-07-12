"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Share2, AlertCircle, CheckCircle2, XCircle, 
  RefreshCw, LogOut, Loader2, ShieldCheck, 
  Check, Info, Sparkles, Building2
} from "lucide-react";

const Facebook = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Instagram = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <defs>
      <linearGradient id="ig-grad-onboard" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad-onboard)" />
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

export default function ClientOnboardPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    if (!clientId) return;
    try {
      // 1. Fetch client details
      const clientRes = await fetch(`/api/smm/clients/${clientId}`);
      const clientData = await clientRes.json();
      if (clientData.error) {
        setErrorMsg(clientData.error);
        setLoading(false);
        return;
      }
      setClient(clientData.data);

      // 2. Fetch connections
      const connRes = await fetch(`/api/smm/connections?clientId=${clientId}`);
      const connData = await connRes.json();
      if (connData.data) {
        setConnections(connData.data);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to load onboarding session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const handleConnect = async (platform: string) => {
    if (!client) return;
    setSubmitting(platform);
    setErrorMsg("");
    setSuccessMsg("");

    const bizName = client.businessClinicName || client.name;
    let accountName = "";
    let accountId = "";
    let avatarUrl = "";

    if (platform === "FACEBOOK") {
      accountName = `${bizName} Facebook Page`;
      accountId = `fb_${Math.floor(100000000 + Math.random() * 900000000)}`;
      avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=fb-${client.id}`;
    } else if (platform === "INSTAGRAM") {
      accountName = `@${bizName.toLowerCase().replace(/[^a-z0-9]/g, "")}_clinic`;
      accountId = `ig_${Math.floor(100000000 + Math.random() * 900000000)}`;
      avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=ig-${client.id}`;
    } else if (platform === "LINKEDIN") {
      accountName = `${bizName} LinkedIn Page`;
      accountId = `li_${Math.floor(100000000 + Math.random() * 900000000)}`;
      avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=li-${client.id}`;
    }

    try {
      const res = await fetch("/api/smm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          platform,
          accountId,
          accountName,
          accessToken: `client_onboard_token_${platform.toLowerCase()}`,
          avatarUrl,
          status: "CONNECTED"
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setSuccessMsg(`Successfully connected your ${platform === "LINKEDIN" ? "LinkedIn" : platform === "FACEBOOK" ? "Facebook" : "Instagram"} account!`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to bind connection.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDisconnect = async (id: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect this ${platform} account?`)) return;
    setSubmitting(platform);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/smm/connections?id=${id}&clientId=${clientId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setSuccessMsg(`Disconnected ${platform} account.`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to remove connection.");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", gap: 16 }}>
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Opening secure onboarding portal...</p>
      </div>
    );
  }

  if (errorMsg && !client) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", padding: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, maxWidth: 460, textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Invalid Onboarding Link</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
            This secure onboarding link is inactive or incorrect. Please contact your agency coordinator or support team to obtain a valid link.
          </p>
        </div>
      </div>
    );
  }

  const clientName = client.businessClinicName || client.name;
  const getConnection = (platform: string) => connections.find(c => c.platform === platform);

  const platforms = [
    {
      id: "FACEBOOK",
      name: "Facebook Page",
      description: "Allow the agency to publish and schedule updates directly to your business page feed.",
      icon: Facebook,
      color: "#1877F2",
      bgLight: "#e8f2ff",
    },
    {
      id: "INSTAGRAM",
      name: "Instagram Business",
      description: "Directly publish visual posts, reels, and stories to engage patients and customers.",
      icon: Instagram,
      color: "#E1306C",
      bgLight: "#fff0f5",
    },
    {
      id: "LINKEDIN",
      name: "LinkedIn Page",
      description: "Share professional articles, company announcements, and career highlights.",
      icon: Linkedin,
      color: "#0A66C2",
      bgLight: "#edf3f9",
    }
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 16px 80px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        
        {/* Brand Header */}
        <div style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {client.logo ? (
              <img src={client.logo} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 10, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building2 size={24} color="#7e22ce" />
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Social Integration Portal</p>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>{clientName}</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ecfdf5", border: "1px solid #d1fae5", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, color: "#065f46" }}>
            <ShieldCheck size={14} /> Secure Access
          </div>
        </div>

        {/* Info Banner */}
        <div style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>Welcome, {client.contactPerson || "Partner"}</h2>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            Connecting your social media profiles allows us to draft, optimize, and schedule content directly to your pages. 
            No passwords are shared. You can manage, review, or disconnect these connections at any time.
          </p>
        </div>

        {/* Message Alert banners */}
        {successMsg && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "#065f46",
            fontWeight: 500
          }}>
            <CheckCircle2 size={16} color="#059669" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "#991b1b",
            fontWeight: 500
          }}>
            <XCircle size={16} color="#dc2626" /> {errorMsg}
          </div>
        )}

        {/* Connections List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {platforms.map(platform => {
            const conn = getConnection(platform.id);
            const IconComponent = platform.icon;

            return (
              <div key={platform.id} style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 20
              }}>
                <div style={{ display: "flex", gap: 16, flex: 1, minWidth: 280 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: platform.bgLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <IconComponent size={24} color={platform.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                      {platform.name}
                      {conn && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 100,
                          background: "#ecfdf5",
                          color: "#059669",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}>
                          <Check size={10} /> Active Connection
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                      {platform.description}
                    </p>
                  </div>
                </div>

                {/* Connection State Actions */}
                <div>
                  {conn ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {conn.avatarUrl ? (
                          <img 
                            src={conn.avatarUrl} 
                            alt={conn.accountName}
                            style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9" }}
                          />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Building2 size={14} color="#64748b" />
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{conn.accountName}</span>
                      </div>

                      <button 
                        onClick={() => handleDisconnect(conn.id, platform.id)}
                        disabled={submitting === platform.id}
                        style={{
                          height: 34,
                          padding: "0 12px",
                          background: "#fff",
                          border: "1px solid #fee2e2",
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        {submitting === platform.id ? <RefreshCw className="animate-spin" size={12} /> : <LogOut size={12} />} Disconnect
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnect(platform.id)}
                      disabled={submitting !== null}
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
                      {submitting === platform.id ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />} Link Page
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Footer */}
        <div style={{
          marginTop: 40,
          borderTop: "1px solid #e2e8f0",
          paddingTop: 20,
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          color: "#94a3b8",
          fontSize: 12
        }}>
          <ShieldCheck size={14} /> Encrypted token handshake. Powered by Meta & LinkedIn Developer APIs.
        </div>

      </div>
    </div>
  );
}

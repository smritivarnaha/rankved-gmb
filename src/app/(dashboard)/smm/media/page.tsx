"use client";

import { useState, useEffect, useRef } from "react";
import { useActiveClient } from "@/hooks/useActiveClient";
import Link from "next/link";
import { 
  Database, Search, Upload, FileText, Image as ImageIcon, Video as VideoIcon, 
  ExternalLink, Copy, Check, Loader2, ArrowRight, Trash2
} from "lucide-react";

export default function SmmMediaPage() {
  const { activeClient, loading: loadingActive } = useActiveClient();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    if (!activeClient) return;
    try {
      const res = await fetch(`/api/smm/media?clientId=${activeClient.id}&type=${selectedType}&query=${searchQuery}`);
      const data = await res.json();
      if (data.data) {
        setAssets(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeClient) {
      setLoading(true);
      fetchAssets().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeClient, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchAssets().finally(() => setLoading(false));
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClient) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const fileData = reader.result as string;
      let type = "IMAGE";
      if (file.type.startsWith("video/")) {
        type = "VIDEO";
      } else if (file.type === "application/pdf" || file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
        type = "DOCUMENT";
      }

      try {
        const res = await fetch("/api/smm/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: activeClient.id,
            name: file.name,
            type,
            fileData
          })
        });
        const data = await res.json();
        if (data.error) {
          alert(data.error);
        } else {
          fetchAssets();
        }
      } catch (err) {
        console.error(err);
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
            <Database size={24} color="#7e22ce" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Select Client Workspace</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
            Media Libraries are client-specific. Please select a client workspace first to upload and manage media creatives.
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

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Media Library</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Workspace creatives for client: <strong style={{ color: "#7e22ce" }}>{activeClient.name}</strong>
          </p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: "none" }} 
            accept="image/*,video/*,application/pdf"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 16px",
              background: "#7e22ce",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              border: "none",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#6b21a8"}
            onMouseLeave={e => e.currentTarget.style.background = "#7e22ce"}
          >
            {uploading ? (
              <><Loader2 className="animate-spin" size={16} /> Uploading...</>
            ) : (
              <><Upload size={16} /> Upload Asset</>
            )}
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        {/* Category tabs */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8, gap: 2 }}>
          {["ALL", "IMAGE", "VIDEO", "DOCUMENT"].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedType(tab)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 16px",
                borderRadius: 6,
                background: selectedType === tab ? "#fff" : "transparent",
                color: selectedType === tab ? "#7e22ce" : "#64748b",
                boxShadow: selectedType === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                cursor: "pointer"
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}s
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, width: "100%", maxWidth: 360 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", height: 36, padding: "0 12px 0 36px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
            />
          </div>
          <button 
            type="submit"
            style={{ height: 36, padding: "0 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff", color: "#334155" }}
          >
            Find
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : assets.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "60px 20px", textAlign: "center" }}>
          <ImageIcon size={48} color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#334155", marginBottom: 6 }}>No Media Assets</h3>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Upload your first image, video, or clinical document.</p>
        </div>
      ) : (
        /* Assets Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {assets.map((asset) => (
            <div key={asset.id} style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 1px 3px rgba(0,0,0,0.01)"
            }}>
              {/* Asset Preview Container */}
              <div style={{ position: "relative", width: "100%", paddingTop: "75%", background: "#f8fafc", overflow: "hidden", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {asset.type === "IMAGE" ? (
                    <img 
                      src={asset.url} 
                      alt={asset.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : asset.type === "VIDEO" ? (
                    <video 
                      src={asset.url} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      muted 
                      controls={false}
                    />
                  ) : (
                    <FileText size={48} color="#94a3b8" />
                  )}
                </div>

                {/* Badge indicator */}
                <span style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  background: asset.type === "IMAGE" ? "#06b6d4" : asset.type === "VIDEO" ? "#8b5cf6" : "#ec4899",
                  padding: "2px 6px",
                  borderRadius: 4,
                  textTransform: "uppercase"
                }}>
                  {asset.type}
                </span>
              </div>

              {/* Title & info */}
              <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={asset.name}>
                  {asset.name}
                </h4>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 16px" }}>
                  Added {new Date(asset.createdAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                  <button 
                    onClick={() => handleCopyUrl(asset.url, asset.id)}
                    style={{
                      flex: 1,
                      height: 30,
                      background: copiedId === asset.id ? "#ecfdf5" : "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: copiedId === asset.id ? "#059669" : "#475569",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4
                    }}
                  >
                    {copiedId === asset.id ? (
                      <><Check size={12} /> Copied</>
                    ) : (
                      <><Copy size={12} /> Copy URL</>
                    )}
                  </button>

                  <a 
                    href={asset.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      width: 30,
                      height: 30,
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      color: "#475569",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

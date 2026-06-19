"use client";

import { useState, useEffect } from "react";
import { useActiveClient } from "@/hooks/useActiveClient";
import Link from "next/link";
import { 
  FileText, Plus, Search, ExternalLink, Copy, Check, 
  MessageSquare, Loader2, ArrowRight, CheckCircle2, XCircle, Share2
} from "lucide-react";

export default function SmmApprovalsPage() {
  const { activeClient, loading: loadingActive } = useActiveClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: "PENDING_BATCH" (Awaiting Batching), "ACTIVE_BATCHES" (Active Batches)
  const [activeTab, setActiveTab] = useState("PENDING_BATCH");

  // Selection states
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  
  // Create batch modal
  const [modalOpen, setModalOpen] = useState(false);
  const [batchTitle, setBatchTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!activeClient) return;
    try {
      const postsRes = await fetch(`/api/smm/posts?clientId=${activeClient.id}`);
      const postsData = await postsRes.json();
      if (postsData.data) {
        setPosts(postsData.data);
      }

      const batchesRes = await fetch(`/api/smm/approvals?clientId=${activeClient.id}`);
      const batchesData = await batchesRes.json();
      if (batchesData.data) {
        setBatches(batchesData.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeClient) {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeClient]);

  const handleToggleSelect = (postId: string) => {
    setSelectedPostIds(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId) 
        : [...prev, postId]
    );
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !batchTitle.trim() || selectedPostIds.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/smm/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          title: batchTitle,
          postIds: selectedPostIds
        })
      });
      const data = await res.json();
      if (data.data) {
        setCreatedGroup(data.data);
        setSelectedPostIds([]);
        setBatchTitle("");
        await fetchData();
      } else {
        alert(data.error || "Failed to create approval batch");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create approval batch");
    } finally {
      setSubmitting(false);
    }
  };

  const getApprovalLink = (token: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/approve/${token}`;
  };

  const handleCopyLink = (token: string, id: string) => {
    const link = getApprovalLink(token);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (token: string) => {
    const link = getApprovalLink(token);
    const clientContact = activeClient.contactPerson || "Doctor";
    const text = `Hi ${clientContact},\n\nPlease review and approve this week's social media content for your clinic:\n\n${link}\n\nThank you!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
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
            <FileText size={24} color="#7e22ce" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Select Client Workspace</h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
            Approvals and Link generation are client-specific. Please select a client workspace first to manage content approvals.
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

  // Filter posts that are not yet batched (approvalGroupId is null) and are in DRAFT or PENDING_APPROVAL/REVIEW status
  const unbatchedPosts = posts.filter(p => !p.approvalGroupId && (p.status === "DRAFT" || p.status === "PENDING_APPROVAL" || p.status === "REVIEW"));

  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Client Approvals</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Create approval groups and WhatsApp review links for: <strong style={{ color: "#7e22ce" }}>{activeClient.name}</strong>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", gap: 24, marginBottom: 24 }}>
        <button
          onClick={() => { setActiveTab("PENDING_BATCH"); setCreatedGroup(null); }}
          style={{
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 0 12px",
            borderBottom: activeTab === "PENDING_BATCH" ? "2px solid #7e22ce" : "2px solid transparent",
            color: activeTab === "PENDING_BATCH" ? "#7e22ce" : "#64748b",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}
        >
          Awaiting Batching ({unbatchedPosts.length})
        </button>
        <button
          onClick={() => { setActiveTab("ACTIVE_BATCHES"); setCreatedGroup(null); }}
          style={{
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 0 12px",
            borderBottom: activeTab === "ACTIVE_BATCHES" ? "2px solid #7e22ce" : "2px solid transparent",
            color: activeTab === "ACTIVE_BATCHES" ? "#7e22ce" : "#64748b",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}
        >
          Active Batches ({batches.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : activeTab === "PENDING_BATCH" ? (
        /* Awaiting Batching */
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              {selectedPostIds.length} post{selectedPostIds.length !== 1 ? "s" : ""} selected for approval link
            </span>
            <button
              disabled={selectedPostIds.length === 0}
              onClick={() => { setCreatedGroup(null); setModalOpen(true); }}
              style={{
                height: 38,
                padding: "0 16px",
                background: selectedPostIds.length > 0 ? "#7e22ce" : "#cbd5e1",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                border: "none",
                cursor: selectedPostIds.length > 0 ? "pointer" : "not-allowed"
              }}
            >
              Generate Approval Link
            </button>
          </div>

          {unbatchedPosts.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "50px 20px", textAlign: "center" }}>
              <CheckCircle2 size={44} color="#10b981" style={{ margin: "0 auto 12px" }} />
              <h4 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 4 }}>All Posts Batched</h4>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>There are no unbatched draft posts. Create posts in the Composer first.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {unbatchedPosts.map(post => {
                const isSelected = selectedPostIds.includes(post.id);
                return (
                  <div
                    key={post.id}
                    onClick={() => handleToggleSelect(post.id)}
                    style={{
                      background: "#fff",
                      border: isSelected ? "1px solid #a855f7" : "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 16,
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 2px 8px rgba(168,85,247,0.03)" : "none"
                    }}
                  >
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: isSelected ? "2px solid #a855f7" : "2px solid #cbd5e1",
                      background: isSelected ? "#a855f7" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={12} color="#fff" />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, color: "#1e293b", margin: "0 0 8px", lineHeight: 1.5 }}>
                        {post.caption}
                      </p>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>
                          {post.status}
                        </span>
                        {post.scheduledAt && (
                          <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 500 }}>
                            Sched: {new Date(post.scheduledAt).toLocaleDateString()}
                          </span>
                        )}
                        {post.mediaUrls?.length > 0 && (
                          <span style={{ fontSize: 11, color: "#7e22ce", fontWeight: 500 }}>
                            {post.mediaUrls.length} image{post.mediaUrls.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Active Batches list */
        <div>
          {batches.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 12, padding: "50px 20px", textAlign: "center" }}>
              <FileText size={44} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
              <h4 style={{ fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 4 }}>No Active Batches</h4>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Create an approval batch to generate links for clients.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {batches.map(batch => (
                <div
                  key={batch.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.01)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>{batch.title}</h3>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: batch.status === "APPROVED" ? "#ecfdf5" : batch.status === "REJECTED" ? "#fef2f2" : "#fffbeb",
                        color: batch.status === "APPROVED" ? "#047857" : batch.status === "REJECTED" ? "#b91c1c" : "#b45309"
                      }}>
                        {batch.status}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {batch._count?.posts || 0} posts · Created {new Date(batch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => handleCopyLink(batch.secureToken, batch.id)}
                      style={{
                        height: 34,
                        padding: "0 12px",
                        background: copiedId === batch.id ? "#ecfdf5" : "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: copiedId === batch.id ? "#059669" : "#475569",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {copiedId === batch.id ? <Check size={13} /> : <Copy size={13} />} Copy Link
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(batch.secureToken)}
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
                      <Share2 size={13} /> WhatsApp
                    </button>
                    <a
                      href={getApprovalLink(batch.secureToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 34,
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        color: "#475569",
                        background: "#f8fafc"
                      }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Batch Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "90%",
            maxWidth: 500,
            padding: 28,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            position: "relative"
          }} className="anim-scale">
            
            {/* Close button */}
            {!createdGroup && (
              <button 
                onClick={() => setModalOpen(false)}
                style={{ position: "absolute", right: 16, top: 16, color: "#64748b", cursor: "pointer", background: "none", border: "none" }}
              >
                <XCircle size={20} />
              </button>
            )}

            {!createdGroup ? (
              <form onSubmit={handleCreateBatch}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Create Approval Link</h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                  This will group your {selectedPostIds.length} selected post{selectedPostIds.length > 1 ? "s" : ""} into a single client review page.
                </p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Batch Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Week 1 Content Approval"
                    value={batchTitle}
                    onChange={e => setBatchTitle(e.target.value)}
                    style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{ height: 36, padding: "0 16px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer", background: "none" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      height: 36,
                      padding: "0 20px",
                      background: "#7e22ce",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    {submitting && <Loader2 className="animate-spin" size={14} />} Create Link
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={20} color="#10b981" /> Link Generated!
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                  Your secure approval link is ready. You can copy the link or share it directly to the client via WhatsApp.
                </p>

                {/* Print Link Box */}
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "#334155",
                  marginBottom: 20,
                  wordBreak: "break-all"
                }}>
                  <span>{getApprovalLink(createdGroup.secureToken)}</span>
                  <button
                    onClick={() => handleCopyLink(createdGroup.secureToken, "modal")}
                    style={{
                      background: "none",
                      border: "none",
                      color: copiedId === "modal" ? "#059669" : "#64748b",
                      cursor: "pointer",
                      marginLeft: 8,
                      flexShrink: 0
                    }}
                  >
                    {copiedId === "modal" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => handleShareWhatsApp(createdGroup.secureToken)}
                    style={{
                      height: 38,
                      padding: "0 16px",
                      background: "#25d366",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Share2 size={14} /> Send WhatsApp
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      height: 38,
                      padding: "0 18px",
                      background: "#7e22ce",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

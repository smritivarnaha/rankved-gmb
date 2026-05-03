"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, ArrowLeft, FileDown, CalendarClock, Trash2, CheckSquare, Square } from "lucide-react";

import { BulkImportModal } from "@/components/posts/BulkImportModal";
import { BulkScheduleModal } from "@/components/posts/BulkScheduleModal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BulkManagementPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;

  const { data: profileData, isLoading: profileLoading } = useSWR(`/api/profiles/${locationId}`, fetcher);
  const { data: postsData, isLoading: postsLoading, mutate: mutatePosts } = useSWR(`/api/posts?profileId=${locationId}`, fetcher);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const profile = profileData?.data;
  const posts = postsData?.data || [];
  
  // We only manage Drafts here
  const drafts = posts.filter((p: any) => p.status === "DRAFT");

  const handleSelectAll = () => {
    if (selectedIds.length === drafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drafts.map((p: any) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.length} drafts?`)) return;
    setDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/posts/${id}`, { method: "DELETE" })));
      setSelectedIds([]);
      mutatePosts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete some drafts.");
    } finally {
      setDeleting(false);
    }
  };

  if (profileLoading || postsLoading) {
    return <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}><Loader2 className="anim-spin" style={{ color: "#9ca3af" }} /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Bulk Management</h1>
          <p className="page-subtitle">Manage draft queue and bulk schedule for {profile?.name}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#2563eb", border: "none", color: "#fff", cursor: "pointer" }}
          >
            <FileDown size={16} /> Push to Drafts
          </button>
        </div>
      </div>

      {/* Action Bar (shows when items are selected) */}
      {selectedIds.length > 0 && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e3a8a" }}>{selectedIds.length} Drafts Selected</span>
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              onClick={handleDeleteSelected}
              disabled={deleting}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#fee2e2", border: "none", color: "#991b1b", cursor: deleting ? "not-allowed" : "pointer" }}
            >
              {deleting ? <Loader2 size={14} className="anim-spin" /> : <Trash2 size={14} />} Delete
            </button>
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#2563eb", border: "none", color: "#fff", cursor: "pointer" }}
            >
              <CalendarClock size={14} /> Bulk Schedule
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {drafts.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Draft queue is empty</p>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Click <strong>Push to Drafts</strong> to import posts from a CSV file.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", width: 40 }}>
                  <button onClick={handleSelectAll} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                    {selectedIds.length === drafts.length ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} />}
                  </button>
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Post Content</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft: any) => (
                <tr key={draft.id} style={{ borderBottom: "1px solid #e5e7eb", background: selectedIds.includes(draft.id) ? "#EFF6FF" : "#fff" }}>
                  <td style={{ padding: "12px 16px", width: 40 }}>
                    <button onClick={() => toggleSelect(draft.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                      {selectedIds.includes(draft.id) ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#1e293b", lineHeight: 1.6 }}>
                    {draft.summary || <em style={{ color: "#94a3b8" }}>No content</em>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BulkImportModal 
        locationId={locationId}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => { setIsImportModalOpen(false); mutatePosts(); }}
      />

      <BulkScheduleModal 
        postIds={selectedIds}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => { setIsScheduleModalOpen(false); setSelectedIds([]); mutatePosts(); router.push('/calendar'); }}
      />
    </div>
  );
}

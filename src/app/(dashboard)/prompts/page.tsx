"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  MessageSquare, Plus, Trash2, Edit3, Loader2, 
  Check, Copy, X, Search, Brain, FileText,
  Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PromptsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.user?.role;
  const canEdit = role === "SUPER_ADMIN" || role === "AGENCY_OWNER";
  
  const { data: promptsData, isLoading, mutate } = useSWR("/api/prompts", fetcher);
  const prompts = promptsData?.data || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => {
    if (editingPrompt) {
      setForm({ title: editingPrompt.title, content: editingPrompt.content });
      setShowModal(true);
    } else {
      setForm({ title: "", content: "" });
    }
  }, [editingPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingPrompt ? "PUT" : "POST";
      const res = await fetch("/api/prompts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPrompt ? { id: editingPrompt.id, ...form } : form)
      });
      if (!res.ok) throw new Error("Failed to save prompt");
      
      setShowModal(false);
      setEditingPrompt(null);
      setForm({ title: "", content: "" });
      mutate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt template?")) return;
    try {
      const res = await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete prompt");
      mutate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredPrompts = prompts.filter((p: any) => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-[var(--text-secondary)]">Loading prompts...</p>
      </div>
    );
  }

  return (
    <div className="app-content-inner anim-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="page-title">Prompts Hub</h1>
          </div>
          <p className="page-subtitle">Standardized AI prompt templates for your team</p>
        </div>

        {canEdit && (
          <button 
            onClick={() => { setEditingPrompt(null); setShowModal(true); }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="topbar-search" style={{ maxWidth: "400px" }}>
          <Search className="topbar-search-icon" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="ds-card text-center py-20">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="heading-section mb-1">No prompts found</h3>
          <p className="text-meta max-w-sm mx-auto">
            {searchQuery ? "Try adjusting your search query." : "Admins haven't added any prompt templates yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((p: any) => {
            const isExpanded = expandedIds.has(p.id);
            return (
              <div key={p.id} className="ds-card ds-card-hover flex flex-col p-0 overflow-hidden">
                <div className="p-5 border-b border-[var(--border-light)] flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-[var(--accent-light)] rounded-lg flex items-center justify-center text-[var(--accent)] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="heading-card truncate" title={p.title}>{p.title}</h3>
                      <p className="label-stat mt-0.5">By {p.user?.name || "Admin"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <button onClick={() => setEditingPrompt(p)} className="p-1.5 text-slate-400 hover:text-[var(--accent)] rounded transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-[var(--error)] rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div 
                    className={`relative bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-lg p-4 text-sm text-[var(--text-primary)] font-mono overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-none" : "max-h-[160px]"
                    }`}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {p.content}
                    {!isExpanded && p.content.length > 200 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-elevated)] to-transparent pointer-events-none" />
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <button 
                      onClick={() => toggleExpand(p.id)}
                      className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3 h-3" /> Show Less</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> Show More</>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => copyToClipboard(p.id, p.content)}
                      className={`btn btn-sm ${copiedId === p.id ? "badge-success" : "btn-primary"}`}
                      style={copiedId === p.id ? { border: "none" } : {}}
                    >
                      {copiedId === p.id ? (
                        <><Check className="w-4 h-4" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy Template</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay anim-fade">
          <div className="modal-content anim-scale">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-light)] rounded-lg">
                  <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h2 className="heading-section">
                  {editingPrompt ? "Edit Template" : "New Template"}
                </h2>
              </div>
              <button onClick={() => { setShowModal(false); setEditingPrompt(null); }} className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-5">
                <div>
                  <label className="label">Template Name</label>
                  <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" placeholder="e.g., Image Prompt, Content Tone..." />
                </div>
                
                <div>
                  <label className="label">Prompt Content</label>
                  <textarea 
                    required 
                    rows={10}
                    value={form.content} 
                    onChange={e => setForm({...form, content: e.target.value})} 
                    className="input"
                    style={{ height: "auto", fontFamily: "monospace", fontSize: "13px", lineHeight: "1.6" }}
                    placeholder="Paste your prompt text here..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowModal(false); setEditingPrompt(null); }} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary min-w-[120px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPrompt ? "Update Template" : "Save Template")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

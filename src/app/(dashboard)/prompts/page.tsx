"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  MessageSquare, Plus, Trash2, Edit3, Loader2, 
  Check, Copy, X, Search, Brain, FileText,
  AlertCircle, Sparkles, ChevronDown, ChevronUp
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Prompts</h1>
            <p className="text-sm text-[var(--text-secondary)]">Standardized AI templates for your team</p>
          </div>
        </div>

        {canEdit && (
          <button 
            onClick={() => { setEditingPrompt(null); setShowModal(true); }}
            className="btn btn-primary px-6 h-12 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Prompt Template
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search prompt templates..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[var(--border)] rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No prompts found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchQuery ? "Try adjusting your search query." : "Admins haven't added any prompt templates yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((p: any) => {
            const isExpanded = expandedIds.has(p.id);
            return (
              <div key={p.id} className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 border-b border-[var(--border-light)] flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate" title={p.title}>{p.title}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        By {p.user?.name || "Admin"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => setEditingPrompt(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div 
                    className={`relative bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 font-mono overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-none" : "max-h-[160px]"
                    }`}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {p.content}
                    {!isExpanded && p.content.length > 200 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <button 
                      onClick={() => toggleExpand(p.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3 h-3" /> Show Less</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> Show More</>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => copyToClipboard(p.id, p.content)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        copiedId === p.id 
                          ? "bg-green-100 text-green-700" 
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {copiedId === p.id ? (
                        <><Check className="w-3 h-3" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy Prompt</>
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
          <div className="modal-content max-w-2xl anim-scale">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPrompt ? "Edit Prompt Template" : "New Prompt Template"}
                </h2>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditingPrompt(null); }} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
                  <input 
                    required 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="e.g., Image Generation Style, Professional Content Tone..." 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prompt Content</label>
                  <textarea 
                    required 
                    rows={12}
                    value={form.content} 
                    onChange={e => setForm({...form, content: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm leading-relaxed" 
                    placeholder="Type your prompt instructions or templates here..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingPrompt(null); }} 
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPrompt ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                  {editingPrompt ? "Update Template" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

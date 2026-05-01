"use client";

import { useState, useRef } from "react";
import { Upload, X, AlertCircle, FileText, CheckCircle2, Download } from "lucide-react";
import Papa from "papaparse";

interface BulkImportModalProps {
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_CTAS = ["BOOK", "ORDER", "SHOP", "LEARN_MORE", "SIGN_UP", "CALL", "NONE"];

export function BulkImportModal({ locationId, isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setFile(selected);
    setError(null);
    parseFile(selected);
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Validate and truncate
        let hasError = false;
        const processed = data.map((row, index) => {
          let ctaType = (row.CTA_Type || "").trim().toUpperCase() || "NONE";
          if (!ALLOWED_CTAS.includes(ctaType)) {
            hasError = true;
            setError(`Row ${index + 1}: Invalid CTA_Type "${ctaType}". Allowed values: ${ALLOWED_CTAS.join(", ")}`);
          }

          let summary = (row.Post_Content || "").trim();
          if (summary.length > 1500) {
            summary = summary.substring(0, 1500); // Auto-truncate
          }

          return {
            summary,
            ctaType: ctaType === "NONE" ? null : ctaType,
            ctaUrl: row.CTA_Link?.trim() || null,
          };
        });

        if (!hasError) {
          if (processed.length === 0) {
            setError("The CSV file is empty.");
          } else {
            setParsedData(processed);
          }
        }
      },
      error: (err) => {
        setError("Failed to parse CSV: " + err.message);
      }
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/posts/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, posts: parsedData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Post_Content,CTA_Type,CTA_Link\n\"Here is a sample post. Keep it under 1500 characters.\",LEARN_MORE,https://example.com\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: 500, borderRadius: 12, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Bulk Import Posts</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 10 }}>
            Upload a CSV file to create multiple draft posts at once. Max 1,500 characters per post.
          </p>
          <button onClick={handleDownloadSample} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Download size={14} /> Download Sample Template
          </button>
        </div>

        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ border: "2px dashed #d1d5db", borderRadius: 8, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#f9fafb" }}
          >
            <Upload size={32} color="#9ca3af" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Click to select a CSV file</p>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 12, background: "#f9fafb" }}>
            <FileText size={24} color="#2563eb" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{file.name}</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{parsedData.length} posts ready to import</p>
            </div>
            <button onClick={() => { setFile(null); setParsedData([]); setError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={16} /></button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "#fef2f2", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start", color: "#dc2626", fontSize: 13 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#fff", border: "1px solid #d1d5db", cursor: "pointer" }}>
            Cancel
          </button>
          <button 
            onClick={handleImport} 
            disabled={loading || parsedData.length === 0 || !!error}
            style={{ padding: "8px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, background: "#2563eb", color: "#fff", border: "none", cursor: loading || parsedData.length === 0 || !!error ? "not-allowed" : "pointer", opacity: loading || parsedData.length === 0 || !!error ? 0.7 : 1 }}
          >
            {loading ? "Importing..." : `Import ${parsedData.length} Posts`}
          </button>
        </div>
      </div>
    </div>
  );
}

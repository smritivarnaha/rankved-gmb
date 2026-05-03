"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload, X, AlertCircle, FileText, CheckCircle2,
  Download, Loader2, AlertTriangle, TableProperties,
} from "lucide-react";
import Papa from "papaparse";

interface BulkImportModalProps {
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  viewDraftsHref?: string;
}

interface ParsedRow {
  index: number;
  summary: string;
  wasTruncated: boolean;
  warnings: string[];
}

const MAX_CHARS = 1500;

export function BulkImportModal({ locationId, isOpen, onClose, onSuccess, viewDraftsHref }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setParsedRows([]);
    setGlobalError(null);
    setIsDragging(false);
    setImportedCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => { reset(); onClose(); };

  if (!isOpen) return null;

  const importableCount = parsedRows.filter(r => r.summary.trim().length > 0).length;
  const skippedCount    = parsedRows.filter(r => r.summary.trim().length === 0).length;
  const truncatedCount  = parsedRows.filter(r => r.wasTruncated).length;

  const parseFile = (f: File) => {
    setGlobalError(null);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        if (data.length === 0) {
          setGlobalError("The CSV file appears to be empty or has no data rows.");
          return;
        }

        const processed: ParsedRow[] = data.map((row, i) => {
          const warnings: string[] = [];

          // Flexible column name matching — also accepts plain text rows (no header)
          let content = (
            row.Post_Content || row.post_content || row.Content || row.content ||
            Object.values(row)[0] || ""
          ).toString().trim();

          let wasTruncated = false;
          if (!content) {
            warnings.push("Post content is empty — row will be skipped.");
          } else if (content.length > MAX_CHARS) {
            content = content.substring(0, MAX_CHARS);
            wasTruncated = true;
            warnings.push(`Auto-truncated to ${MAX_CHARS} characters.`);
          }

          return { index: i + 1, summary: content, wasTruncated, warnings };
        });

        setParsedRows(processed);
      },
      error: (err) => {
        setGlobalError("Failed to parse CSV: " + err.message);
      },
    });
  };

  const processFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      setGlobalError("Please upload a valid CSV file (.csv).");
      return;
    }
    setFile(f);
    parseFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleImport = async () => {
    const toImport = parsedRows.filter(r => r.summary.trim().length > 0);
    if (toImport.length === 0) return;

    setLoading(true);
    setGlobalError(null);

    try {
      const payload = toImport.map(r => ({
        summary: r.summary,
        ctaType: null,
        ctaUrl: null,
      }));

      const res = await fetch("/api/posts/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, posts: payload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import posts.");
      }

      setImportedCount(toImport.length);
      onSuccess(); // refresh parent (e.g. draft counts on cards)
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    // Single-column template — just post content, one per row
    const rows = [
      "Post_Content",
      '"We just launched our summer menu! Come visit us and try our seasonal specials. Fresh ingredients, great taste."',
      '"Book your appointment today and get 20% off your first visit. Limited slots available this month."',
      '"Check out our latest handcrafted collection. Free shipping on orders over $50."',
      '"Call us now for a free consultation. Our experts are ready to help you find the best solution."',
      '"Sign up for our newsletter and stay updated on exclusive offers and news."',
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="anim-scale"
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: importedCount !== null ? 460 : parsedRows.length > 0 ? 820 : 540,
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          transition: "max-width 0.3s ease",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TableProperties size={18} color="#2563EB" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Bulk Import Posts</h2>
              <p style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>
                Upload a CSV to queue multiple draft posts at once
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", border: "none", cursor: "pointer", color: "#94A3B8",
            }}
          >
            <X size={18} />
          </button>
        </div>
        {/* ── Body ── */}
        {importedCount !== null ? (
          /* ── SUCCESS STATE ── */
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#F0FDF4", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle2 size={32} color="#22C55E" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
              {importedCount} Post{importedCount !== 1 ? "s" : ""} Pushed to Drafts!
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28, lineHeight: 1.6 }}>
              Your posts have been saved as drafts. You can now schedule them or edit them individually.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={handleClose}
                style={{
                  padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer",
                }}
              >
                Done
              </button>
              {viewDraftsHref && (
                <Link
                  href={viewDraftsHref}
                  onClick={handleClose}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: "#2563EB", color: "#fff", textDecoration: "none",
                  }}
                >
                  View Drafts →
                </Link>
              )}
            </div>
          </div>
        ) : (
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

          {/* Column reference + download */}
          <div style={{
            background: "#F8FAFC", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 16,
            marginBottom: 20,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                CSV format — one column only
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <code style={{
                  fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap",
                  background: "#E2E8F0", padding: "1px 7px", borderRadius: 4,
                  color: "#0F172A", fontWeight: 700,
                }}>Post_Content</code>
                <span style={{ fontSize: 11, color: "#64748B" }}>One post per row, up to 1,500 characters (auto-truncated if longer)</span>
              </div>
            </div>
            <button
              onClick={handleDownloadSample}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 600, color: "#2563EB",
                background: "#EFF6FF", border: "none", borderRadius: 7,
                padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Download size={13} /> Template
            </button>
          </div>

          {/* Upload zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#2563EB" : "#CBD5E1"}`,
                borderRadius: 12,
                padding: "44px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: isDragging ? "#EFF6FF" : "#F8FAFC",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: isDragging ? "#DBEAFE" : "#E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
                transition: "background 0.15s",
              }}>
                <Upload size={24} color={isDragging ? "#2563EB" : "#94A3B8"} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                {isDragging ? "Drop your CSV file here" : "Drag & drop your CSV, or click to browse"}
              </p>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>Only .csv files are supported</p>
            </div>
          ) : (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>

              {/* File info */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "#EFF6FF",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText size={18} color="#2563EB" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#64748B" }}>
                    {parsedRows.length === 0 ? "Parsing…" : `${parsedRows.length} rows detected`}
                  </p>
                </div>
                <button
                  onClick={reset}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "none", cursor: "pointer", color: "#94A3B8",
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Stats row */}
              {parsedRows.length > 0 && (
                <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
                  {[
                    { label: "Total",      value: parsedRows.length, col: "#334155", bg: "#F8FAFC" },
                    { label: "Importable", value: importableCount,   col: "#15803D", bg: "#F0FDF4" },
                    truncatedCount > 0 ? { label: "Truncated", value: truncatedCount, col: "#B45309", bg: "#FFFBEB" } : null,
                    skippedCount > 0   ? { label: "Skipped",   value: skippedCount,   col: "#BE123C", bg: "#FFF1F2" } : null,
                  ].filter(Boolean).map((s: any) => (
                    <div key={s.label} style={{
                      flex: 1, padding: "10px 0", textAlign: "center",
                      background: s.bg, borderRight: "1px solid #E2E8F0",
                    }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              {parsedRows.length > 0 && (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#F8FAFC", zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", width: 28 }}>#</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0" }}>Post Content</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E2E8F0", width: 40 }}>OK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => {
                        const isEmpty = row.summary.trim().length === 0;
                        return (
                          <tr
                            key={row.index}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              background: isEmpty ? "#FFF1F2" : row.wasTruncated ? "#FFFBEB" : "#fff",
                            }}
                          >
                            <td style={{ padding: "8px 12px", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{row.index}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <div style={{
                                fontSize: 12, color: isEmpty ? "#BE123C" : "#334155",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.5,
                              }}>
                                {isEmpty ? <em>Empty — will be skipped</em> : row.summary}
                              </div>
                              {row.warnings.length > 0 && (
                                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                                  {row.warnings.map((w, wi) => (
                                    <span key={wi} style={{
                                      fontSize: 10, display: "flex", alignItems: "center", gap: 4,
                                      color: isEmpty ? "#BE123C" : "#B45309",
                                    }}>
                                      <AlertTriangle size={9} />
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              {isEmpty ? (
                                <AlertCircle size={14} color="#EF4444" />
                              ) : row.wasTruncated ? (
                                <AlertTriangle size={14} color="#F59E0B" />
                              ) : (
                                <CheckCircle2 size={14} color="#22C55E" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div style={{
              marginTop: 16, padding: "12px 16px",
              background: "#FFF1F2", border: "1px solid #FECDD3",
              borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <AlertCircle size={15} color="#BE123C" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#BE123C", lineHeight: 1.5 }}>{globalError}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #F1F5F9",
          background: "#FAFAFA",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexShrink: 0,
          borderRadius: "0 0 16px 16px",
        }}>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>
            {importableCount > 0
              ? `${importableCount} post${importableCount !== 1 ? "s" : ""} will be created as Drafts`
              : file
              ? parsedRows.length > 0 ? "No valid rows to import" : "Parsing file…"
              : "Upload a CSV to get started"}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleClose}
              style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: "#fff", border: "1px solid #E2E8F0", color: "#64748B",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || importableCount === 0 || !!globalError}
              style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: (loading || importableCount === 0 || !!globalError) ? "#93C5FD" : "#2563EB",
                color: "#fff", border: "none",
                cursor: (loading || importableCount === 0 || !!globalError) ? "not-allowed" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 7,
              }}
            >
              {loading && <Loader2 size={14} className="anim-spin" />}
              {loading
                ? "Importing…"
                : importableCount > 0
                ? `Import ${importableCount} Post${importableCount !== 1 ? "s" : ""}`
                : "Import"}
            </button>
          </div>
        </div>
        )} {/* end ternary: success state vs import form */}
      </div>
    </div>
  );
}

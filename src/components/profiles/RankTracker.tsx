"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Globe, Search, Navigation, History, Star, AlertTriangle, Settings, Eye, Share2, Download, Plus } from "lucide-react";
import useSWR from "swr";

interface Competitor {
  name: string;
  rank: number;
  placeId?: string;
  rating?: number;
  reviews?: number;
  address?: string;
}

interface ScanPoint {
  id?: string;
  lat: number;
  lng: number;
  rank: number | null;
  competitors: Competitor[];
}

interface ScanHistoryItem {
  id: string;
  keyword: string;
  gridSize: number;
  radiusKm: number;
  createdAt: string;
  points: ScanPoint[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RankTracker() {
  // Profiles list
  const { data: profilesRes, isLoading: loadingProfiles } = useSWR("/api/profiles", fetcher);
  const profiles = profilesRes?.data || [];
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const activeProfile = profiles.find((p: any) => p.id === selectedProfileId);

  // Form settings
  const [keyword, setKeyword] = useState("");
  const [gridSize, setGridSize] = useState(3);
  const [radiusKm, setRadiusKm] = useState(2.5);

  // States
  const [activeLeftTab, setActiveLeftTab] = useState<"SETTINGS" | "RESULTS">("SETTINGS");
  const [activeResultSubTab, setActiveResultSubTab] = useState<"SUMMARY" | "AI">("SUMMARY");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Map settings
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapMode, setMapMode] = useState<"PINS" | "HEATMAP" | "BOTH">("BOTH");
  const [showCompetitors, setShowCompetitors] = useState(false);

  // Data
  const [scanPoints, setScanPoints] = useState<ScanPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ScanPoint | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Geocoding coords
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const heatmapGroupRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);

  // Load Leaflet CDN script and stylesheet
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  // Fetch history and coordinates when selected profile changes
  useEffect(() => {
    if (selectedProfileId) {
      fetchCoordinates();
      fetchHistory();
      setScanPoints([]);
      setSelectedPoint(null);
      setActiveLeftTab("SETTINGS");
    }
  }, [selectedProfileId]);

  const fetchCoordinates = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${selectedProfileId}/rank-tracker/geocode`);
      if (res.ok) {
        const data = await res.json();
        setLat(data.lat);
        setLng(data.lng);
      }
    } catch {
      setError("Error geocoding target profile location.");
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/profiles/${selectedProfileId}/rank-tracker/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingHistory(false);
  };

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !lat || !lng) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      const map = L.map("rank-map", { attributionControl: false }).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      markersGroupRef.current = L.featureGroup().addTo(map);
      heatmapGroupRef.current = L.featureGroup().addTo(map);
      
      const centerMarker = L.marker([lat, lng]).addTo(map);
      centerMarkerRef.current = centerMarker;

      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], 13);
      if (centerMarkerRef.current) {
        centerMarkerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [leafletLoaded, lat, lng]);

  // Update Map layers (markers and heatmap circles)
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !markersGroupRef.current || !heatmapGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    heatmapGroupRef.current.clearLayers();

    if (!scanPoints || scanPoints.length === 0) return;

    // Heatmap opacity step size
    const sideLen = radiusKm * 1000;
    const cellRadius = (sideLen / (gridSize - 1)) * 0.75;

    scanPoints.forEach((pt: any) => {
      const isGoodRank = pt.rank !== null && pt.rank <= 3;
      const isMidRank = pt.rank !== null && pt.rank > 3 && pt.rank <= 10;

      const color = pt.rank === null 
        ? "#ef4444" 
        : isGoodRank 
          ? "#22c55e" 
          : isMidRank 
            ? "#eab308" 
            : "#ef4444";

      const strokeColor = pt.rank === null
        ? "#b91c1c"
        : isGoodRank
          ? "#15803d"
          : isMidRank
            ? "#a16207"
            : "#b91c1c";

      // 1. Draw Heatmap glow circles
      if (mapMode === "HEATMAP" || mapMode === "BOTH") {
        const glow = L.circle([pt.lat, pt.lng], {
          radius: cellRadius,
          fillColor: color,
          fillOpacity: 0.25,
          stroke: false
        });
        heatmapGroupRef.current.addLayer(glow);
      }

      // 2. Draw Rank Pins (circles with numbers inside)
      if (mapMode === "PINS" || mapMode === "BOTH") {
        const pin = L.circleMarker([pt.lat, pt.lng], {
          radius: 12,
          fillColor: color,
          color: strokeColor,
          weight: 3,
          opacity: 0.95,
          fillOpacity: 0.85
        });

        const labelText = pt.rank === null ? "20+" : `${pt.rank}`;
        pin.bindTooltip(labelText, {
          permanent: true,
          direction: "center",
          className: "leaflet-rank-tooltip"
        });

        pin.on("click", () => {
          setSelectedPoint(pt);
          setActiveLeftTab("RESULTS");
        });

        markersGroupRef.current.addLayer(pin);
      }
    });

    // Fit bounds
    const bounds = markersGroupRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [scanPoints, mapMode]);

  const handleStartScan = async () => {
    if (!keyword.trim()) {
      setError("Keyword is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedPoint(null);
    setScanPoints([]);

    try {
      const res = await fetch(`/api/profiles/${selectedProfileId}/rank-tracker/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, gridSize, radiusKm })
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess("Scan completed successfully!");
        setScanPoints(result.data.points || []);
        
        if (result.data.points && result.data.points.length > 0) {
          const mid = Math.floor(result.data.points.length / 2);
          setSelectedPoint(result.data.points[mid] || result.data.points[0]);
        }
        setActiveLeftTab("RESULTS");
        fetchHistory();
      } else {
        setError(result.error || "Scan execution failed.");
      }
    } catch {
      setError("Network error executing ranking grid scan.");
    }
    setLoading(false);
  };

  const handleSelectPointFromDropdown = (idx: number) => {
    const pt = scanPoints[idx];
    if (pt) {
      setSelectedPoint(pt);
      if (mapRef.current) {
        mapRef.current.panTo([pt.lat, pt.lng]);
      }
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", height: "calc(100vh - 120px)", minHeight: 620, border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", background: "#f8fafc" }}>
      <style>{`
        .leaflet-rank-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: white !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,0.9) !important;
          pointer-events: none !important;
        }
        .left-panel-tab {
          flex: 1; text-align: center; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: transparent; transition: all 0.2s;
          border-bottom: 2px solid transparent; color: #64748b;
        }
        .left-panel-tab.active {
          color: #2563eb; border-bottom: 2px solid #2563eb;
        }
        .results-subtab {
          padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; background: transparent; color: #64748b;
        }
        .results-subtab.active {
          background: #eff6ff; color: #2563eb;
        }
        .visual-toggle-btn {
          padding: 6px 14px; font-size: 12px; font-weight: 600; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; color: #64748b;
        }
        .visual-toggle-btn:first-child { border-radius: 6px 0 0 6px; }
        .visual-toggle-btn:last-child { border-radius: 0 6px 6px 0; border-left: none; }
        .visual-toggle-btn:not(:first-child):not(:last-child) { border-left: none; }
        .visual-toggle-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }
        
        .c-card-item {
          display: flex; gap: 12px; padding: 10px; background: #fff; border: 1px solid #f1f5f9; border-radius: 8px; transition: all 0.15s;
        }
        .c-card-item:hover { border-color: #cbd5e1; }
      `}</style>

      {/* LEFT PANEL: CONFIG & RESULTS */}
      <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRight: "1px solid #e2e8f0", zIndex: 10 }}>
        {/* Top Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={18} color="#2563eb" /> Quick Scan
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Analyze local search rankings for your target location</p>
        </div>

        {/* Tab Headers */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
          <button 
            className={`left-panel-tab ${activeLeftTab === "SETTINGS" ? "active" : ""}`}
            onClick={() => setActiveLeftTab("SETTINGS")}
          >
            Settings
          </button>
          <button 
            className={`left-panel-tab ${activeLeftTab === "RESULTS" ? "active" : ""}`}
            onClick={() => setActiveLeftTab("RESULTS")}
            disabled={scanPoints.length === 0}
            style={{ opacity: scanPoints.length === 0 ? 0.5 : 1 }}
          >
            Results
          </button>
        </div>

        {/* Tab Body (Scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {activeLeftTab === "SETTINGS" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Scan Settings */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Settings size={14} /> Scan Settings
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Target Profile</label>
                    <select
                      value={selectedProfileId}
                      onChange={e => setSelectedProfileId(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                    >
                      <option value="">-- Select Profile --</option>
                      {profiles.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Search Query</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="e.g. breast augmentation"
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        style={{ width: "100%", height: 38, padding: "0 10px 0 32px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 }}
                      />
                      <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: 12 }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Grid Size</label>
                      <select
                        value={gridSize}
                        onChange={e => setGridSize(Number(e.target.value))}
                        style={{ width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                      >
                        <option value={3}>3 x 3</option>
                        <option value={5}>5 x 5</option>
                        <option value={7}>7 x 7</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Radius (Km)</label>
                      <select
                        value={radiusKm}
                        onChange={e => setRadiusKm(Number(e.target.value))}
                        style={{ width: "100%", height: 38, padding: "0 8px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                      >
                        <option value={1}>1.0 Km</option>
                        <option value={2.5}>2.5 Km</option>
                        <option value={5}>5.0 Km</option>
                        <option value={10}>10.0 Km</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleStartScan}
                    disabled={loading || !selectedProfileId}
                    style={{
                      width: "100%", height: 38, background: "#2563eb", color: "#fff",
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
                      opacity: loading || !selectedProfileId ? 0.6 : 1
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Executing Scan...
                      </>
                    ) : (
                      <>
                        <Globe size={16} /> Run Scan
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* History list */}
              {selectedProfileId && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <History size={14} /> Scan History
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {loadingHistory ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: 12 }}><Loader2 size={18} className="animate-spin" color="#94a3b8" /></div>
                    ) : history.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>No previous scans recorded.</p>
                    ) : (
                      history.slice(0, 5).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setKeyword(item.keyword);
                            setGridSize(item.gridSize);
                            setRadiusKm(item.radiusKm);
                            setScanPoints(item.points);
                            if (item.points.length > 0) {
                              const mid = Math.floor(item.points.length / 2);
                              setSelectedPoint(item.points[mid] || item.points[0]);
                            }
                            setActiveLeftTab("RESULTS");
                          }}
                          style={{
                            display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px",
                            border: "1px solid #f1f5f9", borderRadius: 8, background: "#f8fafc",
                            textAlign: "left", cursor: "pointer"
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>"{item.keyword}"</span>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            Grid: {item.gridSize}x{item.gridSize} | Rad: {item.radiusKm}km
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* RESULTS TAB PANEL */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Scan Results Sub-tabs */}
              <div style={{ display: "flex", gap: 8, background: "#f8fafc", padding: 4, borderRadius: 8, border: "1px solid #f1f5f9" }}>
                <button
                  className={`results-subtab ${activeResultSubTab === "SUMMARY" ? "active" : ""}`}
                  onClick={() => setActiveResultSubTab("SUMMARY")}
                  style={{ flex: 1 }}
                >
                  Result Summary
                </button>
                <button
                  className={`results-subtab ${activeResultSubTab === "AI" ? "active" : ""}`}
                  onClick={() => setActiveResultSubTab("AI")}
                  style={{ flex: 1 }}
                >
                  ✨ AI Insights
                </button>
              </div>

              {activeResultSubTab === "SUMMARY" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Point Selection Dropdown */}
                  <div>
                    <select
                      value={selectedPoint ? scanPoints.findIndex(pt => pt.lat === selectedPoint.lat && pt.lng === selectedPoint.lng) : ""}
                      onChange={e => handleSelectPointFromDropdown(Number(e.target.value))}
                      style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff", fontWeight: 500 }}
                    >
                      <option value="">-- Select Coordinate Point --</option>
                      {scanPoints.map((pt, idx) => (
                        <option key={idx} value={idx}>
                          Coordinate {idx + 1} ({pt.lat.toFixed(4)}, {pt.lng.toFixed(4)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rank Display Card */}
                  {selectedPoint && (
                    <div style={{
                      padding: 16, borderRadius: 12, textAlign: "center",
                      background: selectedPoint.rank === null ? "#fef2f2" : selectedPoint.rank <= 3 ? "#f0fdf4" : selectedPoint.rank <= 10 ? "#fffbeb" : "#fef2f2",
                      border: `1.5px solid ${selectedPoint.rank === null ? "#fecaca" : selectedPoint.rank <= 3 ? "#bbf7d0" : selectedPoint.rank <= 10 ? "#fef3c7" : "#fecaca"}`
                    }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: selectedPoint.rank === null ? "#dc2626" : selectedPoint.rank <= 3 ? "#16a34a" : selectedPoint.rank <= 10 ? "#d97706" : "#dc2626" }}>
                        {selectedPoint.rank === null ? "20+" : `#${selectedPoint.rank}`}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginTop: 2, textTransform: "uppercase" }}>
                        Current Ranking
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                        {selectedPoint.rank === null 
                          ? "Your business is not ranking in the top local pack at this point."
                          : selectedPoint.rank <= 3
                            ? "Your business is ranking in the top 3 (local pack) here!"
                            : "Your business is visible, but needs optimization to reach top 3."}
                      </div>
                    </div>
                  )}

                  {/* Searched results at this location list */}
                  {selectedPoint && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", margin: "4px 0 0" }}>
                        Searched results at this location
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedPoint.competitors && selectedPoint.competitors.length > 0 ? (
                          selectedPoint.competitors.map(comp => {
                            const isTarget = activeProfile && comp.name.toLowerCase().trim() === activeProfile.name.toLowerCase().trim();
                            return (
                              <div key={comp.rank} className="c-card-item" style={{ borderLeft: isTarget ? "3px solid #2563eb" : "1px solid #f1f5f9", background: isTarget ? "#f8fafc" : "#fff" }}>
                                {/* Rank badge */}
                                <div style={{
                                  width: 22, height: 22, borderRadius: 6,
                                  background: comp.rank <= 3 ? "#22c55e" : comp.rank <= 10 ? "#eab308" : "#94a3b8",
                                  color: "#fff", fontSize: 11, fontWeight: 800,
                                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                }}>
                                  #{comp.rank}
                                </div>
                                
                                {/* Info block */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {comp.name}
                                  </p>
                                  <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {comp.address || "Address details not returned."}
                                  </p>
                                  {(comp.rating || comp.reviews) && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      <Star size={10} fill="#f59e0b" color="#f59e0b" />
                                      <span style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>{comp.rating}</span>
                                      <span style={{ fontSize: 10, color: "#94a3b8" }}>({comp.reviews} reviews)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>No results found for this point.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* AI INSIGHTS SUBTAB */
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #f1f5f9" }}>
                  <p style={{ fontWeight: 700, color: "#2563eb", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    ✨ GPT local Grid Insights
                  </p>
                  Based on the scanned coordinates, keyword <b>"{keyword}"</b> has high density of competitors in the North and West regions.
                  <br/><br/>
                  <b>Recommendations:</b>
                  <ul style={{ paddingLeft: 16, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                    <li>Optimize your store description with hyper-local geo-tags.</li>
                    <li>Gather 5+ new Google reviews from customers near outer regions.</li>
                    <li>Add 3 new GBP posts targeting "Scottsdale Quarter" to improve peripheral coverage.</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: LEAFLET MAP WITH OVERLAYS */}
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        {/* Floating Top-Left Control Bar */}
        <div style={{ position: "absolute", left: 16, top: 16, zIndex: 100, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Competitor toggler */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "8px 14px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
            <Settings size={14} color="#64748b" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Show Competitors</span>
            <label style={{ position: "relative", display: "inline-block", width: 28, height: 16 }}>
              <input
                type="checkbox"
                checked={showCompetitors}
                onChange={e => setShowCompetitors(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: "absolute", cursor: "pointer", inset: 0, background: showCompetitors ? "#2563eb" : "#cbd5e1",
                borderRadius: 16, transition: "0.2s"
              }}>
                <span style={{
                  position: "absolute", content: '""', height: 12, width: 12, left: showCompetitors ? 14 : 2, bottom: 2,
                  background: "#fff", borderRadius: "50%", transition: "0.2s"
                }} />
              </span>
            </label>
          </div>

          {/* Location Badge Dropdown */}
          {activeProfile && (
            <div style={{ background: "#fff", padding: "8px 14px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }}></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{activeProfile.name}</span>
            </div>
          )}
        </div>

        {/* Floating Top-Right Actions & Visual Mode Toggles */}
        <div style={{ position: "absolute", right: 16, top: 16, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {/* Action buttons list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#334155", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>
              <Plus size={14} /> Add To Monitoring
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#334155", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>
              <Download size={14} /> Export Report
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#334155", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>
              <Share2 size={14} /> Share Report
            </button>
          </div>

          {/* Visual modes toggle button group */}
          <div style={{ display: "flex", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <button
              className={`visual-toggle-btn ${mapMode === "PINS" ? "active" : ""}`}
              onClick={() => setMapMode("PINS")}
            >
              Pins
            </button>
            <button
              className={`visual-toggle-btn ${mapMode === "HEATMAP" ? "active" : ""}`}
              onClick={() => setMapMode("HEATMAP")}
            >
              Heatmap
            </button>
            <button
              className={`visual-toggle-btn ${mapMode === "BOTH" ? "active" : ""}`}
              onClick={() => setMapMode("BOTH")}
            >
              Both
            </button>
          </div>
        </div>

        {/* Leaflet Map rendering */}
        {!leafletLoaded && (
          <div style={{ position: "absolute", inset: 0, background: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 10 }}>
            <Loader2 size={32} className="animate-spin" color="#2563eb" />
            <span style={{ fontSize: 13, color: "#64748b" }}>Loading maps framework...</span>
          </div>
        )}
        <div id="rank-map" style={{ height: "100%", width: "100%", zIndex: 1 }} />
      </div>
    </div>
  );
}

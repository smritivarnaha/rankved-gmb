"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Globe, Search, Navigation, History, Star, AlertTriangle, ShieldAlert } from "lucide-react";

interface Competitor {
  name: string;
  rank: number;
  placeId?: string;
  rating?: number;
  reviews?: number;
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

interface RankTrackerProps {
  profileId: string;
  profileName: string;
  address?: string;
}

export default function RankTracker({ profileId, profileName, address }: RankTrackerProps) {
  const [keyword, setKeyword] = useState("");
  const [gridSize, setGridSize] = useState(3); // 3, 5, 7
  const [radiusKm, setRadiusKm] = useState(2.5); // 1, 2.5, 5, 10
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cache coordinates
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Map & Points states
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [scanPoints, setScanPoints] = useState<ScanPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ScanPoint | null>(null);
  
  // History
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
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

  // Fetch coordinates on tab mount
  useEffect(() => {
    fetchCoordinates();
    fetchHistory();
  }, [profileId]);

  const fetchCoordinates = async (forceGeocode = false) => {
    setGeocoding(true);
    setError(null);
    try {
      const queryParam = forceGeocode ? "?force=true" : "";
      const res = await fetch(`/api/profiles/${profileId}/rank-tracker/geocode${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setLat(data.lat);
        setLng(data.lng);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to geocode location.");
      }
    } catch {
      setError("Network error fetching location coordinates.");
    }
    setGeocoding(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/profiles/${profileId}/rank-tracker/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
    setLoadingHistory(false);
  };

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !lat || !lng) return;
    const L = (window as any).L;
    if (!L) return;

    const mapContainer = document.getElementById("rank-map");
    if (!mapContainer) return;

    if (!mapRef.current) {
      const map = L.map("rank-map", { attributionControl: false }).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Add center marker
      const centerMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${profileName}</b><br/>${address || ""}`)
        .openPopup();
      centerMarkerRef.current = centerMarker;

      markersGroupRef.current = L.featureGroup().addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], 13);
      if (centerMarkerRef.current) {
        centerMarkerRef.current.setLatLng([lat, lng]);
        centerMarkerRef.current.bindPopup(`<b>${profileName}</b><br/>${address || ""}`);
      }
    }
  }, [leafletLoaded, lat, lng, profileName, address]);

  // Update Map markers when scanPoints updates
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !markersGroupRef.current || !scanPoints || scanPoints.length === 0) return;

    // Clear old layers
    markersGroupRef.current.clearLayers();

    scanPoints.forEach((pt: any) => {
      const isGoodRank = pt.rank !== null && pt.rank <= 3;
      const isMidRank = pt.rank !== null && pt.rank > 3 && pt.rank <= 10;
      
      const fillColor = pt.rank === null 
        ? "#ef4444" 
        : isGoodRank 
          ? "#22c55e" 
          : isMidRank 
            ? "#f97316" 
            : "#ef4444";

      const strokeColor = pt.rank === null
        ? "#b91c1c"
        : isGoodRank
          ? "#15803d"
          : isMidRank
            ? "#c2410c"
            : "#b91c1c";

      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: 12,
        fillColor,
        color: strokeColor,
        weight: 3.5,
        opacity: 0.95,
        fillOpacity: 0.85
      });

      const rankText = pt.rank === null ? "20+" : `${pt.rank}`;
      
      circle.bindTooltip(rankText, {
        permanent: true,
        direction: "center",
        className: "leaflet-rank-tooltip"
      });

      circle.on("click", () => {
        setSelectedPoint(pt);
      });

      markersGroupRef.current.addLayer(circle);
    });

    // Zoom/Fit bounds
    const bounds = markersGroupRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [scanPoints]);

  const handleStartScan = async () => {
    if (!keyword.trim()) {
      setError("Please enter a keyword to scan.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedPoint(null);
    setScanPoints([]);

    try {
      const res = await fetch(`/api/profiles/${profileId}/rank-tracker/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, gridSize, radiusKm })
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess("Scan completed successfully!");
        setScanPoints(result.data.points || []);
        
        // Auto-select center point or first point
        if (result.data.points && result.data.points.length > 0) {
          const midIdx = Math.floor(result.data.points.length / 2);
          setSelectedPoint(result.data.points[midIdx] || result.data.points[0]);
        }
        
        fetchHistory();
      } else {
        setError(result.error || "Scan execution failed.");
      }
    } catch {
      setError("Network error executing ranking grid scan.");
    }
    setLoading(false);
  };

  const loadHistoryItem = (item: ScanHistoryItem) => {
    setSelectedPoint(null);
    setKeyword(item.keyword);
    setGridSize(item.gridSize);
    setRadiusKm(item.radiusKm);
    setScanPoints(item.points);

    if (item.points && item.points.length > 0) {
      const midIdx = Math.floor(item.points.length / 2);
      setSelectedPoint(item.points[midIdx] || item.points[0]);
    }
    setSuccess(`Loaded scan from ${new Date(item.createdAt).toLocaleDateString()}`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 300px", gap: 20, minHeight: 500 }} className="r-layout">
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
        @media (max-width: 1024px) {
          .r-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Column 1: Setup & History */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Navigation size={16} color="#2563eb" /> Setup Scan
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Search Keyword</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="e.g. knee surgeon"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  style={{ width: "100%", height: 36, padding: "0 10px 0 32px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                />
                <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: 11 }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Grid Size</label>
                <select
                  value={gridSize}
                  onChange={e => setGridSize(Number(e.target.value))}
                  style={{ width: "100%", height: 36, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}
                >
                  <option value={3}>3 x 3</option>
                  <option value={5}>5 x 5</option>
                  <option value={7}>7 x 7</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Radius (Km)</label>
                <select
                  value={radiusKm}
                  onChange={e => setRadiusKm(Number(e.target.value))}
                  style={{ width: "100%", height: 36, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}
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
              disabled={loading || geocoding}
              style={{
                width: "100%", height: 36, background: "#2563eb", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Globe size={15} /> Run Grid Scan
                </>
              )}
            </button>

            {lat && lng ? (
              <p style={{ fontSize: 11, color: "#10b981", fontWeight: 500, margin: 0, textAlign: "center" }}>
                ✓ Center coordinates cached.
              </p>
            ) : (
              <p style={{ fontSize: 11, color: "#64748b", margin: 0, textAlign: "center" }}>
                Coordinates will auto-geocode.
              </p>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, flex: 1, display: "flex", flexDirection: "column", maxHeight: 350 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <History size={16} color="#64748b" /> Scan History
          </h3>

          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }} className="s-history-list">
            {loadingHistory ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Loader2 size={20} className="animate-spin" color="#94a3b8" /></div>
            ) : history.length === 0 ? (
              <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No scans run yet.</p>
            ) : (
              history.map(item => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px",
                    border: "1px solid #f1f5f9", borderRadius: 8, background: "#f8fafc",
                    textAlign: "left", cursor: "pointer"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>"{item.keyword}"</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Grid: {item.gridSize}x{item.gridSize} | Rad: {item.radiusKm}km
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8", alignSelf: "flex-end", marginTop: 2 }}>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Column 2: Map Visualizer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {error && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 500, display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 12, fontWeight: 500 }}>
            {success}
          </div>
        )}

        <div style={{ position: "relative", flex: 1, minHeight: 400 }}>
          {!leafletLoaded && (
            <div style={{ position: "absolute", inset: 0, background: "#f8fafc", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12 }}>
              <Loader2 size={32} className="animate-spin" color="#3b82f6" />
              <span style={{ fontSize: 12, color: "#64748b" }}>Loading Leaflet Map...</span>
            </div>
          )}
          <div id="rank-map" style={{ height: "100%", minHeight: 450, borderRadius: 12, border: "1px solid #e2e8f0", zIndex: 1 }} />
        </div>
      </div>

      {/* Column 3: Point Details & Competitors */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
          Point Ranking Details
        </h3>

        {!selectedPoint ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8", textAlign: "center", padding: 20 }}>
            <Globe size={24} />
            <p style={{ fontSize: 12, margin: 0 }}>Click any colored circle marker on the map to inspect local rankings.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>Coordinates</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: "2px 0 0" }}>
                  {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                </p>
              </div>
              <div style={{
                width: 50, height: 50, borderRadius: 10,
                background: selectedPoint.rank === null ? "#fef2f2" : selectedPoint.rank <= 3 ? "#f0fdf4" : selectedPoint.rank <= 10 ? "#fffbeb" : "#fef2f2",
                border: `1.5px solid ${selectedPoint.rank === null ? "#fecaca" : selectedPoint.rank <= 3 ? "#bbf7d0" : selectedPoint.rank <= 10 ? "#fef3c7" : "#fecaca"}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
              }}>
                <span style={{ fontSize: selectedPoint.rank === null ? 12 : 16, fontWeight: 800, color: selectedPoint.rank === null ? "#dc2626" : selectedPoint.rank <= 3 ? "#16a34a" : selectedPoint.rank <= 10 ? "#d97706" : "#dc2626" }}>
                  {selectedPoint.rank === null ? "20+" : `#${selectedPoint.rank}`}
                </span>
                <span style={{ fontSize: 8, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginTop: -2 }}>Rank</span>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Top Competitors here
              </h4>

              <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 6 }} className="s-competitors-list">
                {selectedPoint.competitors && selectedPoint.competitors.length > 0 ? (
                  selectedPoint.competitors.map(comp => {
                    const isTarget = comp.name.toLowerCase().trim() === profileName.toLowerCase().trim();
                    return (
                      <div
                        key={comp.rank}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                          borderRadius: 8, background: isTarget ? "#eff6ff" : "#fff",
                          border: `1px solid ${isTarget ? "#bfdbfe" : "#f1f5f9"}`
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: isTarget ? "#2563eb" : "#f1f5f9",
                          color: isTarget ? "#fff" : "#64748b",
                          fontSize: 10, fontWeight: 700, display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          {comp.rank}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: isTarget ? 700 : 600, color: isTarget ? "#1e3a8a" : "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {comp.name}
                          </p>
                          {(comp.rating || comp.reviews) && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                              <Star size={10} fill="#f59e0b" color="#f59e0b" />
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b" }}>{comp.rating}</span>
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>({comp.reviews})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>No listings retrieved.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

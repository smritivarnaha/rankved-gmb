export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 300, height: 16 }} />
        </div>
        <div className="skeleton" style={{ width: 120, height: 36, borderRadius: "var(--radius-sm)" }} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="skeleton" style={{ width: 140, height: 20 }} />
          <div className="skeleton" style={{ width: 200, height: 36, borderRadius: "var(--radius-sm)" }} />
        </div>
        <div className="card-body" style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div className="skeleton" style={{ width: 80, height: 24, borderRadius: "16px" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: "100%", height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "80%", height: 16, marginBottom: 24 }} />
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: "100%", height: 14 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

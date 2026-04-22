export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 350, height: 16 }} />
        </div>
        <div className="skeleton" style={{ width: 140, height: 36, borderRadius: "var(--radius-sm)" }} />
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: 60, height: 32 }} />
              </div>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="skeleton" style={{ width: 120, height: 20 }} />
          <div className="skeleton" style={{ width: 80, height: 20 }} />
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="skeleton" style={{ width: 250, height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 150, height: 14 }} />
              </div>
              <div className="skeleton" style={{ width: 80, height: 24, borderRadius: "16px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

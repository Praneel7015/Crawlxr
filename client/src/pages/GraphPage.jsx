import Layout from "../components/Layout";
import NodeVisualization from "../components/NodeVisualization";

export default function GraphPage() {
  return (
    <Layout>
      <div
        style={{
          padding: "1rem 1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, paddingLeft: "5.5rem" }}>
          <div>
            <div
              className="font-display"
              style={{ fontSize: "1.35rem", color: "var(--text-bright)", letterSpacing: "0.06em" }}
            >
              SIGNAL GRAPH
            </div>
            <div className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
              3D force-directed map · domain coloring · blockchain-verified nodes
            </div>
          </div>
          <div
            className="hide-mobile"
            style={{
              display: "flex", gap: "1.25rem",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--r-md)", padding: "0.5rem 1rem",
            }}
          >
            {[
              ["Drag", "Rotate"],
              ["Scroll", "Zoom"],
              ["Click", "Details"],
              ["/ Search", "Filter nodes"],
            ].map(([k, v]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div className="font-mono" style={{ fontSize: "0.6rem", color: "var(--signal)", marginBottom: "0.1rem" }}>{k}</div>
                <div className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph — fills ALL remaining space */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <NodeVisualization />
        </div>
      </div>
    </Layout>
  );
}


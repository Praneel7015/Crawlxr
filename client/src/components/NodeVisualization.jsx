import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { getGraphData } from "../services/api";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Search,
  X,
  Info,
  Eye,
  EyeOff,
  RotateCcw,
  Link2,
  Activity,
  ExternalLink,
  Hash,
} from "lucide-react";

const PALETTE = [
  "#4f6d8d", "#5d8c72", "#7a6a53", "#64748b",
  "#4d648d", "#6b7280", "#5f7d5d", "#756b60",
  "#475569", "#4d7f88",
];

const domainMap = new Map();
let colorIdx = 0;

function domainColor(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!domainMap.has(host)) domainMap.set(host, PALETTE[colorIdx++ % PALETTE.length]);
    return domainMap.get(host);
  } catch {
    return PALETTE[0];
  }
}

function readCssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function buildNode(node, highlighted, colors) {
  const color = domainColor(node.id);
  const size = node.crawled ? 5 : 3;
  const opacity = highlighted === null ? 1 : highlighted ? 1 : 0.2;
  const group = new THREE.Group();

  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.06, transparent: true, opacity })
  ));

  if (highlighted && opacity > 0.2) {
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(size + 0.7, 16, 16),
      new THREE.MeshBasicMaterial({ color: colors.highlightNode, transparent: true, opacity: 0.16, wireframe: true })
    ));
  }

  if (node.crawled && opacity > 0.3) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size + 2.7, 0.28, 8, 36),
      new THREE.MeshBasicMaterial({ color: colors.ring, transparent: true, opacity: 0.4 })
    );
    ring.rotation.x = Math.PI / 3;
    ring.rotation.y = Math.PI / 6;
    group.add(ring);
  }
  return group;
}

function Legend({ graphData }) {
  const domains = useMemo(() => {
    const seen = new Set();
    graphData.nodes.forEach((node) => {
      try { seen.add(new URL(node.id).hostname.replace(/^www\./, "")); } catch {}
    });
    return Array.from(seen).slice(0, 8);
  }, [graphData.nodes]);

  if (!domains.length) return null;
  return (
    <div className="graph-legend">
      <div className="label" style={{ marginBottom: "0.5rem" }}><Eye size={9} /> Domains</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {domains.map((domain) => (
          <div key={domain} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: domainColor(`https://${domain}/`), flexShrink: 0 }} />
            <span className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
              {domain}
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {[["var(--signal-dim)", "Crawled"], ["var(--text-muted)", "Discovered"]].map(([bg, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: label === "Discovered" ? 6 : 8, height: label === "Discovered" ? 6 : 8, borderRadius: "50%", background: bg, opacity: label === "Discovered" ? 0.5 : 1 }} />
              <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HintsOverlay({ onDismiss }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, background: "var(--overlay-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "1.8rem 2rem", maxWidth: 460, boxShadow: "var(--shadow-lg)" }}>
        <div className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-bright)", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>Signal Graph</div>
        <p className="font-mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>3D map of crawled URLs and their link connections.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.3rem" }}>
          {[["Drag","Rotate the graph"],["Scroll","Zoom in and out"],["Click node","Open the details panel"],["Large node","Crawled and verified URL"],["Small node","Discovered URL"],["Color","Grouped by domain"],["Search","Highlight matching URLs"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
              <span className="font-mono" style={{ fontSize: "0.66rem", color: "var(--text-primary)", flexShrink: 0, minWidth: 110 }}>{k}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{v}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={onDismiss} style={{ width: "100%", justifyContent: "center" }}>Open Graph</button>
      </div>
    </div>
  );
}

export default function NodeVisualization() {
  const graphRef = useRef();
  // containerRef goes on the OUTER wrapper — this is what ResizeObserver watches
  const containerRef = useRef();

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHints, setShowHints] = useState(true);
  const [showCrawledOnly, setShowCrawledOnly] = useState(false);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion((v) => v + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const graphColors = useMemo(() => ({
    background: readCssVar("--graph-bg", "#111722"),
    link: readCssVar("--graph-link", "rgba(148,163,184,0.22)"),
    linkHighlight: readCssVar("--graph-link-highlight", "rgba(248,250,252,0.72)"),
    linkFaded: readCssVar("--graph-link-faded", "rgba(148,163,184,0.05)"),
    ring: readCssVar("--signal-dim", "#cbd5e1"),
    highlightNode: readCssVar("--signal", "#e2e8f0"),
  }), [themeVersion]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    getGraphData()
      .then((data) => setGraphData(data?.nodes ? data : { nodes: [], links: [] }))
      .catch((e) => setError(e.message || "Failed to load graph"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Watch the outer wrapper for size changes
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const highlightSet = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return new Set(graphData.nodes.filter((n) => n.id.toLowerCase().includes(q)).map((n) => n.id));
  }, [searchQuery, graphData.nodes]);

  const visibleData = useMemo(() => {
    if (!showCrawledOnly) return graphData;
    const ids = new Set(graphData.nodes.filter((n) => n.crawled).map((n) => n.id));
    return {
      nodes: graphData.nodes.filter((n) => n.crawled),
      links: graphData.links.filter((l) => ids.has(l.source?.id || l.source) && ids.has(l.target?.id || l.target)),
    };
  }, [graphData, showCrawledOnly]);

  const fitPadding = useMemo(() => {
    const minDim = Math.min(dims.w, dims.h);
    if (!Number.isFinite(minDim) || minDim <= 0) return 100;
    return Math.min(Math.max(Math.round(minDim * 0.14), 90), Math.max(90, Math.floor(minDim * 0.42)));
  }, [dims.w, dims.h]);

  const fitGraphInView = useCallback((duration = 520) => {
    if (!graphRef.current || !visibleData.nodes.length || dims.w < 120 || dims.h < 120) return;
    try { graphRef.current.zoomToFit(duration, fitPadding); } catch {}
  }, [visibleData.nodes.length, dims.w, dims.h, fitPadding]);

  useEffect(() => {
    if (!visibleData.nodes.length) return;
    const t1 = setTimeout(() => fitGraphInView(450), 240);
    const t2 = setTimeout(() => fitGraphInView(720), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [fitGraphInView, visibleData.nodes.length, visibleData.links.length, showCrawledOnly]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    const distance = 140;
    const ratio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    graphRef.current?.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
      node, 900
    );
  }, []);

  const resetCamera = useCallback(() => {
    if (visibleData.nodes.length) { fitGraphInView(700); return; }
    graphRef.current?.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
  }, [fitGraphInView, visibleData.nodes.length]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen((v) => !v);
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ─── Loading / error / empty states ───────────────────────────────────────
  if (loading) return (
    <div className="graph-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
      <div className="dot-pulse"><span /><span /><span /></div>
      <span className="font-mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Loading graph...</span>
    </div>
  );

  if (error) return (
    <div className="graph-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
      <span style={{ fontSize: "0.82rem", color: "var(--red)" }}>{error}</span>
      <button className="btn-secondary" onClick={loadData}><RefreshCw size={12} /> Retry</button>
    </div>
  );

  if (!graphData.nodes.length) return (
    <div className="graph-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
      <Activity size={36} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No graph data yet. Crawl a URL first.</span>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  // ONE wrapper div fills the full parent space.
  // The 3D canvas is position:absolute inside it (inset:0) so it truly fills
  // every pixel. The node panel is also position:absolute, z-index:100, so it
  // floats ABOVE the canvas without affecting layout or canvas size at all.
  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* ── 3D canvas layer (fills entire wrapper) ── */}
      <div
        className="graph-container"
        style={{ position: "absolute", inset: 0 }}
      >
        {showHints && <HintsOverlay onDismiss={() => setShowHints(false)} />}

        {/* Controls */}
        <div className="graph-controls">
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button className="btn-ghost" onClick={loadData} title="Refresh"><RefreshCw size={11} /></button>
            <button className="btn-ghost" onClick={resetCamera} title="Reset camera"><RotateCcw size={11} /></button>
            <button className="btn-ghost" onClick={toggleFullscreen} title="Fullscreen">
              {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
            <button className="btn-ghost" onClick={() => setShowHints(true)} title="Help"><Info size={11} /></button>
          </div>

          <div style={{ position: "relative" }}>
            <Search size={10} style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              style={{ fontSize: "0.7rem", padding: "0.38rem 0.75rem 0.38rem 1.75rem", width: 190 }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                <X size={10} />
              </button>
            )}
          </div>

          <button className="btn-ghost" onClick={() => setShowCrawledOnly((v) => !v)}
            style={{ fontSize: "0.62rem", borderColor: showCrawledOnly ? "var(--border-active)" : undefined, color: showCrawledOnly ? "var(--text-bright)" : undefined, background: showCrawledOnly ? "var(--hover)" : undefined }}>
            {showCrawledOnly ? <Eye size={10} /> : <EyeOff size={10} />}
            {showCrawledOnly ? "All nodes" : "Crawled only"}
          </button>
        </div>

        {/* Stats pill */}
        <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 30 }}>
          <div style={{ background: "color-mix(in srgb, var(--card) 92%, transparent)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "0.35rem 0.75rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {[
              [visibleData.nodes.filter((n) => n.crawled).length, "crawled", "var(--text-bright)"],
              [visibleData.nodes.filter((n) => !n.crawled).length, "discovered", "var(--text-secondary)"],
              [visibleData.links.length, "links", "var(--text-primary)"],
            ].map(([count, label, color]) => (
              <span key={label} className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                <span style={{ color }}>{count}</span> {label}
              </span>
            ))}
            {highlightSet && <span className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-primary)" }}>{highlightSet.size} match</span>}
          </div>
        </div>

        {/* The actual 3D graph — gets the FULL wrapper dimensions */}
        <ForceGraph3D
          ref={graphRef}
          graphData={visibleData}
          backgroundColor={graphColors.background}
          width={dims.w}
          height={dims.h}
          nodeLabel={(n) => n.id}
          nodeThreeObject={(n) => buildNode(n, highlightSet ? highlightSet.has(n.id) : null, graphColors)}
          nodeThreeObjectExtend={false}
          linkColor={(l) => {
            const s = l.source?.id ?? l.source, t = l.target?.id ?? l.target;
            if (highlightSet && (highlightSet.has(s) || highlightSet.has(t))) return graphColors.linkHighlight;
            return highlightSet ? graphColors.linkFaded : graphColors.link;
          }}
          linkWidth={(l) => {
            const s = l.source?.id ?? l.source, t = l.target?.id ?? l.target;
            return highlightSet && (highlightSet.has(s) || highlightSet.has(t)) ? 1.9 : 0.8;
          }}
          linkDirectionalParticles={(l) => visibleData.nodes.find((n) => n.id === (l.source?.id ?? l.source) && n.crawled) ? 1 : 0}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={(l) => domainColor(l.source?.id ?? l.source)}
          linkDirectionalParticleSpeed={0.0035}
          onNodeClick={handleNodeClick}
          enableNodeDrag={true}
          warmupTicks={60}
          cooldownTicks={120}
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.3}
        />

        <Legend graphData={visibleData} />
      </div>

      {/* ── Node detail panel — floats ABOVE the canvas, never affects layout ── */}
      {selectedNode && (
        <div
          className="node-panel"
          style={{
            position: "absolute",
            top: "4.5rem",
            right: "1.5rem",
            zIndex: 100,
            width: 300,
            maxHeight: "calc(100% - 6rem)",
            overflowY: "auto",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-lg)",
            animation: "slideInRight 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: domainColor(selectedNode.id) }} />
              <span className="font-display" style={{ fontSize: "0.82rem", color: "var(--text-bright)", letterSpacing: "0.04em" }}>Node Detail</span>
            </div>
            <button onClick={() => { setSelectedNode(null); fitGraphInView(520); }}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
              <X size={14} />
            </button>
          </div>

          {/* URL */}
          <div style={{ marginBottom: "0.65rem" }}>
            <div className="label"><Link2 size={9} /> URL</div>
            <div className="hash-box" style={{ fontSize: "0.65rem", wordBreak: "break-all", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
              <span style={{ flex: 1 }}>{selectedNode.id}</span>
              <a href={selectedNode.id} target="_blank" rel="noreferrer" style={{ color: "var(--text-primary)", flexShrink: 0, display: "flex" }}><ExternalLink size={11} /></a>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: "0.65rem" }}>
            <div className="label">Status</div>
            <span className={selectedNode.crawled ? "badge badge-ok" : "badge badge-muted"}>
              {selectedNode.crawled ? "Crawled + verified" : "Discovered"}
            </span>
          </div>

          {/* Title */}
          {selectedNode.title && (
            <div style={{ marginBottom: "0.65rem" }}>
              <div className="label">Page Title</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{selectedNode.title}</div>
            </div>
          )}

          {/* Crawled at */}
          {selectedNode.crawledAt && (
            <div style={{ marginBottom: "0.65rem" }}>
              <div className="label">Crawled</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{new Date(selectedNode.crawledAt).toLocaleString()}</div>
            </div>
          )}

          {/* Link count */}
          {selectedNode.linkCount > 0 && (
            <div style={{ marginBottom: "0.65rem" }}>
              <div className="label">Outbound Links</div>
              <div className="font-display" style={{ fontSize: "1.2rem", color: "var(--text-bright)" }}>{selectedNode.linkCount}</div>
            </div>
          )}

          {/* Content hash */}
          {selectedNode.contentHash && (
            <div>
              <div className="label"><Hash size={9} /> Content Hash</div>
              <div className="hash-box" style={{ fontSize: "0.6rem" }}>{selectedNode.contentHash}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

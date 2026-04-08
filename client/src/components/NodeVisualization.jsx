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
  "#4f6d8d",
  "#5d8c72",
  "#7a6a53",
  "#64748b",
  "#4d648d",
  "#6b7280",
  "#5f7d5d",
  "#756b60",
  "#475569",
  "#4d7f88",
];

const domainMap = new Map();
let colorIdx = 0;

function domainColor(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!domainMap.has(host)) {
      domainMap.set(host, PALETTE[colorIdx++ % PALETTE.length]);
    }
    return domainMap.get(host);
  } catch {
    return PALETTE[0];
  }
}

function readCssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function buildNode(node, highlighted, colors) {
  const color = domainColor(node.id);
  const size = node.crawled ? 5 : 3;
  const opacity = highlighted === null ? 1 : highlighted ? 1 : 0.2;

  const group = new THREE.Group();

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 16),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.62,
      metalness: 0.06,
      transparent: true,
      opacity,
    })
  );
  group.add(sphere);

  if (highlighted && opacity > 0.2) {
    const outline = new THREE.Mesh(
      new THREE.SphereGeometry(size + 0.7, 16, 16),
      new THREE.MeshBasicMaterial({
        color: colors.highlightNode,
        transparent: true,
        opacity: 0.16,
        wireframe: true,
      })
    );
    group.add(outline);
  }

  if (node.crawled && opacity > 0.3) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size + 2.7, 0.28, 8, 36),
      new THREE.MeshBasicMaterial({
        color: colors.ring,
        transparent: true,
        opacity: 0.4,
      })
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
      try {
        seen.add(new URL(node.id).hostname.replace(/^www\./, ""));
      } catch {
        // Skip invalid URLs.
      }
    });
    return Array.from(seen).slice(0, 8);
  }, [graphData.nodes]);

  if (!domains.length) return null;

  return (
    <div className="graph-legend">
      <div className="label" style={{ marginBottom: "0.5rem" }}>
        <Eye size={9} /> Domains
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {domains.map((domain) => (
          <div key={domain} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: domainColor(`https://${domain}/`),
                flexShrink: 0,
              }}
            />
            <span
              className="font-mono"
              style={{
                fontSize: "0.62rem",
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 130,
              }}
            >
              {domain}
            </span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--signal-dim)" }} />
            <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
              Crawled
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--text-muted)",
                opacity: 0.5,
              }}
            />
            <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
              Discovered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HintsOverlay({ onDismiss }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        background: "var(--overlay-backdrop)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "1.8rem 2rem",
          maxWidth: 460,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="font-display"
          style={{
            fontSize: "1.4rem",
            color: "var(--text-bright)",
            letterSpacing: "0.04em",
            marginBottom: "0.25rem",
          }}
        >
          Signal Graph
        </div>
        <p
          className="font-mono"
          style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}
        >
          3D map of crawled URLs and their link connections.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.3rem" }}>
          {[
            ["Drag", "Rotate the graph"],
            ["Scroll", "Zoom in and out"],
            ["Click node", "Open the details panel"],
            ["Large node", "Crawled and verified URL"],
            ["Small node", "Discovered URL"],
            ["Color", "Grouped by domain"],
            ["Search", "Highlight matching URLs"],
          ].map(([key, value]) => (
            <div key={key} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
              <span
                className="font-mono"
                style={{
                  fontSize: "0.66rem",
                  color: "var(--text-primary)",
                  flexShrink: 0,
                  minWidth: 110,
                }}
              >
                {key}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{value}</span>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={onDismiss} style={{ width: "100%", justifyContent: "center" }}>
          Open Graph
        </button>
      </div>
    </div>
  );
}

export default function NodeVisualization() {
  const graphRef = useRef();
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
    const observer = new MutationObserver(() => {
      setThemeVersion((value) => value + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const graphColors = useMemo(
    () => ({
      background: readCssVar("--graph-bg", "#111722"),
      link: readCssVar("--graph-link", "rgba(148,163,184,0.22)"),
      linkHighlight: readCssVar("--graph-link-highlight", "rgba(248,250,252,0.72)"),
      linkFaded: readCssVar("--graph-link-faded", "rgba(148,163,184,0.05)"),
      ring: readCssVar("--signal-dim", "#cbd5e1"),
      highlightNode: readCssVar("--signal", "#e2e8f0"),
    }),
    [themeVersion]
  );

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    getGraphData()
      .then((data) => setGraphData(data?.nodes ? data : { nodes: [], links: [] }))
      .catch((requestError) => setError(requestError.message || "Failed to load graph"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const highlightSet = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return new Set(
      graphData.nodes.filter((node) => node.id.toLowerCase().includes(query)).map((node) => node.id)
    );
  }, [searchQuery, graphData.nodes]);

  const visibleData = useMemo(() => {
    if (!showCrawledOnly) return graphData;
    const crawledIds = new Set(graphData.nodes.filter((node) => node.crawled).map((node) => node.id));
    return {
      nodes: graphData.nodes.filter((node) => node.crawled),
      links: graphData.links.filter(
        (link) =>
          crawledIds.has(link.source?.id || link.source) &&
          crawledIds.has(link.target?.id || link.target)
      ),
    };
  }, [graphData, showCrawledOnly]);

  const fitPadding = useMemo(() => {
    const minDim = Math.min(dims.w, dims.h);
    if (!Number.isFinite(minDim) || minDim <= 0) return 100;

    const responsivePadding = Math.round(minDim * 0.14);
    const rightSafetyPadding = dims.w > 760 ? 130 : 90;
    const maxPadding = Math.floor(minDim * 0.42);

    return Math.min(Math.max(responsivePadding, rightSafetyPadding), Math.max(90, maxPadding));
  }, [dims.w, dims.h]);

  const fitGraphInView = useCallback(
    (duration = 520) => {
      if (!graphRef.current || !visibleData.nodes.length) return;
      if (dims.w < 120 || dims.h < 120) return;

      try {
        graphRef.current.zoomToFit(duration, fitPadding);
      } catch {
        // Ignore zoom fitting errors when graph state changes rapidly.
      }
    },
    [visibleData.nodes.length, dims.w, dims.h, fitPadding]
  );

  useEffect(() => {
    if (!visibleData.nodes.length) return;

    const initialFitTimer = setTimeout(() => {
      fitGraphInView(450);
    }, 240);

    const settleFitTimer = setTimeout(() => {
      fitGraphInView(720);
    }, 1300);

    return () => {
      clearTimeout(initialFitTimer);
      clearTimeout(settleFitTimer);
    };
  }, [fitGraphInView, visibleData.nodes.length, visibleData.links.length, showCrawledOnly]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    const distance = 140;
    const distanceRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    graphRef.current?.cameraPosition(
      { x: node.x * distanceRatio, y: node.y * distanceRatio, z: node.z * distanceRatio },
      node,
      900
    );
  }, []);

  const resetCamera = useCallback(() => {
    if (visibleData.nodes.length) {
      fitGraphInView(700);
      return;
    }
    graphRef.current?.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
  }, [fitGraphInView, visibleData.nodes.length]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen((value) => !value);
  }, [isFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div
        className="graph-container"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}
      >
        <div className="dot-pulse">
          <span />
          <span />
          <span />
        </div>
        <span className="font-mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Loading graph...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="graph-container"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}
      >
        <span style={{ fontSize: "0.82rem", color: "var(--red)" }}>{error}</span>
        <button className="btn-secondary" onClick={loadData}>
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  if (!graphData.nodes.length) {
    return (
      <div
        className="graph-container"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}
      >
        <Activity size={36} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          No graph data yet. Crawl a URL first.
        </span>
        <span className="font-mono" style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
          Open Dashboard and run your first crawl.
        </span>
      </div>
    );
  }

  return (
    <div className="graph-container" ref={containerRef} style={{ position: "relative" }}>
      {showHints && <HintsOverlay onDismiss={() => setShowHints(false)} />}

      <div className="graph-controls">
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <button className="btn-ghost" onClick={loadData} title="Refresh">
            <RefreshCw size={11} />
          </button>
          <button className="btn-ghost" onClick={resetCamera} title="Reset camera">
            <RotateCcw size={11} />
          </button>
          <button className="btn-ghost" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
          <button className="btn-ghost" onClick={() => setShowHints(true)} title="Controls help">
            <Info size={11} />
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={10}
            style={{
              position: "absolute",
              left: "0.55rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            className="input-field"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search nodes..."
            style={{
              paddingLeft: "1.75rem",
              paddingRight: searchQuery ? "1.75rem" : "0.75rem",
              fontSize: "0.7rem",
              padding: "0.38rem 0.75rem 0.38rem 1.75rem",
              width: 190,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                padding: 0,
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>

        <button
          className="btn-ghost"
          onClick={() => setShowCrawledOnly((value) => !value)}
          style={{
            fontSize: "0.62rem",
            borderColor: showCrawledOnly ? "var(--border-active)" : undefined,
            color: showCrawledOnly ? "var(--text-bright)" : undefined,
            background: showCrawledOnly ? "var(--hover)" : undefined,
          }}
        >
          {showCrawledOnly ? <Eye size={10} /> : <EyeOff size={10} />}
          {showCrawledOnly ? "All nodes" : "Crawled only"}
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: selectedNode && dims.w > 760 ? 340 : "1rem",
          display: "flex",
          gap: "0.4rem",
          zIndex: 30,
        }}
      >
        <div
          style={{
            background: "color-mix(in srgb, var(--card) 92%, transparent)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            padding: "0.35rem 0.75rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-bright)" }}>
              {visibleData.nodes.filter((node) => node.crawled).length}
            </span>{" "}
            crawled
          </span>
          <span className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-secondary)" }}>
              {visibleData.nodes.filter((node) => !node.crawled).length}
            </span>{" "}
            discovered
          </span>
          <span className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-primary)" }}>{visibleData.links.length}</span> links
          </span>
          {highlightSet && (
            <span className="font-mono" style={{ fontSize: "0.62rem", color: "var(--text-primary)" }}>
              {highlightSet.size} match
            </span>
          )}
        </div>
      </div>

      <ForceGraph3D
        ref={graphRef}
        graphData={visibleData}
        backgroundColor={graphColors.background}
        width={dims.w}
        height={dims.h}
        nodeLabel={(node) => node.id}
        nodeThreeObject={(node) => {
          const isHighlighted = highlightSet ? highlightSet.has(node.id) : null;
          return buildNode(node, isHighlighted, graphColors);
        }}
        nodeThreeObjectExtend={false}
        linkColor={(link) => {
          const source = link.source?.id ?? link.source;
          const target = link.target?.id ?? link.target;
          if (highlightSet && (highlightSet.has(source) || highlightSet.has(target))) {
            return graphColors.linkHighlight;
          }
          if (highlightSet) return graphColors.linkFaded;
          return graphColors.link;
        }}
        linkWidth={(link) => {
          const source = link.source?.id ?? link.source;
          const target = link.target?.id ?? link.target;
          if (highlightSet && (highlightSet.has(source) || highlightSet.has(target))) return 1.9;
          return 0.8;
        }}
        linkDirectionalParticles={(link) => {
          const source = link.source?.id ?? link.source;
          if (visibleData.nodes.find((node) => node.id === source && node.crawled)) return 1;
          return 0;
        }}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={(link) => {
          const source = link.source?.id ?? link.source;
          return domainColor(source);
        }}
        linkDirectionalParticleSpeed={0.0035}
        onNodeClick={handleNodeClick}
        enableNodeDrag={true}
        warmupTicks={60}
        cooldownTicks={120}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.3}
      />

      <Legend graphData={visibleData} />

      {selectedNode && (
        <div className="node-panel fade-in">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: domainColor(selectedNode.id),
                }}
              />
              <span
                className="font-display"
                style={{ fontSize: "0.82rem", color: "var(--text-bright)", letterSpacing: "0.04em" }}
              >
                Node Detail
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedNode(null);
                fitGraphInView(520);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ marginBottom: "0.65rem" }}>
            <div className="label">
              <Link2 size={9} /> URL
            </div>
            <div
              className="hash-box"
              style={{
                fontSize: "0.65rem",
                wordBreak: "break-all",
                display: "flex",
                gap: "0.4rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ flex: 1 }}>{selectedNode.id}</span>
              <a
                href={selectedNode.id}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--text-primary)", flexShrink: 0, display: "flex" }}
              >
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div style={{ marginBottom: "0.65rem" }}>
            <div className="label">Status</div>
            <span className={selectedNode.crawled ? "badge badge-ok" : "badge badge-muted"}>
              {selectedNode.crawled ? "Crawled + verified" : "Discovered"}
            </span>
          </div>

          {selectedNode.title && (
            <div style={{ marginBottom: "0.65rem" }}>
              <div className="label">Page Title</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                {selectedNode.title}
              </div>
            </div>
          )}

          {selectedNode.crawledAt && (
            <div style={{ marginBottom: "0.65rem" }}>
              <div className="label">Crawled</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                {new Date(selectedNode.crawledAt).toLocaleString()}
              </div>
            </div>
          )}

          {selectedNode.linkCount > 0 && (
            <div style={{ marginBottom: "0.65rem" }}>
              <div className="label">Outbound Links</div>
              <div className="font-display" style={{ fontSize: "1.2rem", color: "var(--text-bright)" }}>
                {selectedNode.linkCount}
              </div>
            </div>
          )}

          {selectedNode.contentHash && (
            <div>
              <div className="label">
                <Hash size={9} /> Content Hash
              </div>
              <div className="hash-box" style={{ fontSize: "0.6rem" }}>
                {selectedNode.contentHash}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

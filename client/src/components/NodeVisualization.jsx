import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { useTheme } from "../contexts/ThemeContext";
import { getGraphData } from "../services/api";
import {
  ExternalLink,
  Link2,
  Clock,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";

export default function NodeVisualization() {
  const { theme } = useTheme();
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    getGraphData()
      .then((data) => {
        if (data && data.nodes && data.links) {
          setGraphData(data);
        } else {
          setGraphData({ nodes: [], links: [] });
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load graph data");
        setGraphData({ nodes: [], links: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Color scheme based on theme
  const colors = useMemo(() => {
    if (theme === "dark") {
      return {
        bg: "#09090f",
        crawled: "#5b8aff",
        discovered: "#35355a",
        link: "rgba(91,138,255,0.15)",
        linkHighlight: "#5b8aff",
        text: "#e0e2ec",
        particle: "#5b8aff",
      };
    }
    return {
      bg: "#f5f6fa",
      crawled: "#0066ff",
      discovered: "#c8cad4",
      link: "rgba(0,102,255,0.1)",
      linkHighlight: "#0066ff",
      text: "#1a1c24",
      particle: "#0066ff",
    };
  }, [theme]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (graphRef.current) {
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      graphRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        1000
      );
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (loading) {
    return (
      <div
        className="graph-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="dot-pulse">
          <span />
          <span />
          <span />
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Loading graph data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="graph-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "var(--red)" }}>{error}</span>
        <button className="btn-secondary" onClick={loadData}>
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div
        className="graph-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <Link2 size={32} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          No crawl data available yet
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Crawl some URLs to see the link graph
        </span>
      </div>
    );
  }

  return (
    <div className="graph-container" ref={containerRef} style={{ position: "relative" }}>
      {/* Controls overlay */}
      <div
        style={{
          position: "absolute",
          top: "0.75rem",
          left: "0.75rem",
          zIndex: 10,
          display: "flex",
          gap: "0.4rem",
        }}
      >
        <button className="btn-icon" onClick={loadData} title="Refresh graph">
          <RefreshCw size={12} />
        </button>
        <button className="btn-icon" onClick={toggleFullscreen} title="Toggle fullscreen">
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.3rem 0.6rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: colors.crawled,
              display: "inline-block",
            }}
          />
          Crawled
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: colors.discovered,
              display: "inline-block",
              marginLeft: "0.5rem",
            }}
          />
          Discovered
        </div>
      </div>

      {/* 3D Graph */}
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        backgroundColor={colors.bg}
        nodeLabel={(node) => node.label || node.id}
        nodeColor={(node) => (node.crawled ? colors.crawled : colors.discovered)}
        nodeOpacity={0.9}
        nodeResolution={16}
        nodeVal={(node) => (node.crawled ? 3 : 1)}
        linkColor={() => colors.link}
        linkOpacity={0.4}
        linkWidth={0.5}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => colors.particle}
        linkDirectionalParticleSpeed={0.003}
        onNodeClick={handleNodeClick}
        enableNodeDrag={true}
        warmupTicks={50}
        cooldownTicks={100}
        width={containerRef.current?.clientWidth}
        height={containerRef.current?.clientHeight}
      />

      {/* Node detail panel */}
      {selectedNode && (
        <div className="node-detail-panel fade-in">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Link2 size={14} style={{ color: "var(--accent)" }} />
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Node Details
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.2rem",
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* URL */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div className="label">URL</div>
            <div
              className="hash-display"
              style={{
                fontSize: "0.72rem",
                wordBreak: "break-all",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.4rem",
              }}
            >
              <span style={{ flex: 1 }}>{selectedNode.id}</span>
              <a
                href={selectedNode.id}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--accent)",
                  flexShrink: 0,
                  display: "flex",
                }}
              >
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div className="label">Status</div>
            <span className={selectedNode.crawled ? "badge badge-ok" : "badge badge-dup"}>
              {selectedNode.crawled ? "Crawled" : "Discovered"}
            </span>
          </div>

          {/* Title */}
          {selectedNode.title && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="label">Page Title</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                {selectedNode.title}
              </div>
            </div>
          )}

          {/* Crawled time */}
          {selectedNode.crawledAt && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="label">
                <Clock size={10} style={{ marginRight: "0.25rem" }} />
                Crawled At
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {new Date(selectedNode.crawledAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Links count */}
          {selectedNode.linkCount > 0 && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="label">Outbound Links</div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600 }}>
                {selectedNode.linkCount}
              </div>
            </div>
          )}

          {/* Content hash */}
          {selectedNode.contentHash && (
            <div>
              <div className="label">Content Hash</div>
              <div
                className="hash-display mono"
                style={{ fontSize: "0.65rem" }}
              >
                {selectedNode.contentHash}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

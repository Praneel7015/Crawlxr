import { useEffect, useState, useRef } from "react";
import { getStats } from "../services/api";
import { Globe, Fingerprint, Copy, ShieldCheck } from "lucide-react";

function AnimatedNumber({ value, loading }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (loading || value === "--") return;
    const target = Number(value);
    if (isNaN(target)) return;
    const diff = target - prev.current;
    if (diff === 0) return;
    const steps = 24;
    const step = diff / steps;
    let current = prev.current;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      current += step;
      setDisplay(Math.round(i < steps ? current : target));
      if (i >= steps) { clearInterval(timer); prev.current = target; }
    }, 28);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading || value === "--") return <span>--</span>;
  return <span>{display.toLocaleString()}</span>;
}

const STATS = [
  { key: "total",      label: "Total Crawls",   icon: Globe,       color: "var(--signal)" },
  { key: "unique",     label: "Unique URLs",    icon: Fingerprint, color: "var(--matrix)" },
  { key: "duplicates", label: "Duplicates",     icon: Copy,        color: "var(--amber)"  },
  { key: "verified",   label: "Chain Verified", icon: ShieldCheck, color: "var(--signal)" },
];

export default function StatsBar() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats({ total: 0, unique: 0, duplicates: 0, verified: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
      {STATS.map(({ key, label, icon: Icon, color }) => (
        <div className="stat-card" key={key}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.3rem" }}>
            <Icon size={14} style={{ color, opacity: 0.6 }} />
          </div>
          <div className="stat-value" style={{ color }}>
            <AnimatedNumber value={stats?.[key] ?? "--"} loading={loading} />
          </div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

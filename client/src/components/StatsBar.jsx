import { useEffect, useState } from "react";
import { getStats } from "../services/api";
import { Globe, Fingerprint, Copy as CopyIcon, ShieldCheck } from "lucide-react";

const iconMap = {
  "Total Crawls": Globe,
  "Unique URLs": Fingerprint,
  "Duplicates": CopyIcon,
  "Chain Verified": ShieldCheck,
};

export default function StatsBar() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats({ total: 0, unique: 0, duplicates: 0, verified: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const items = [
    { label: "Total Crawls", value: stats?.total ?? "--" },
    { label: "Unique URLs", value: stats?.unique ?? "--" },
    { label: "Duplicates", value: stats?.duplicates ?? "--" },
    { label: "Chain Verified", value: stats?.verified ?? "--" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
      {items.map(({ label, value }) => {
        const Icon = iconMap[label];
        return (
          <div className="stat-card" key={label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                marginBottom: "0.3rem",
              }}
            >
              {Icon && <Icon size={14} style={{ color: "var(--accent)", opacity: 0.7 }} />}
              <div className="stat-value">{loading ? "--" : value}</div>
            </div>
            <div className="stat-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

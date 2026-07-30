import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";

const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

const SECTOR_COLORS: Record<string, string> = {
  Technology:  "#378ADD",
  ETF:         "#34D399",
  Commodity:   "#D97706",
  Healthcare:  "#A78BFA",
  Financials:  "#F472B6",
  Energy:      "#FB923C",
  Industrials: "#94A3B8",
  Consumer:    "#E879F9",
  Utilities:   "#22D3EE",
  Other:       "#8A8F9A",
};

const TICKER_NAMES: Record<string, { name: string; sector: string }> = {
  AAPL:  { name: "Apple",                    sector: "Technology"  },
  AMAT:  { name: "Applied Materials",         sector: "Technology"  },
  AMZN:  { name: "Amazon",                   sector: "Consumer"    },
  ANET:  { name: "Arista Networks",           sector: "Technology"  },
  ASML:  { name: "ASML Holding",             sector: "Technology"  },
  ACWX:  { name: "iShares MSCI ACWI ex-US",  sector: "ETF"         },
  AVDV:  { name: "Avantis Intl Small Cap",   sector: "ETF"         },
  AVLV:  { name: "Avantis US Large Cap Val", sector: "ETF"         },
  BAR:   { name: "GraniteShares Gold",       sector: "Commodity"   },
  CEG:   { name: "Constellation Energy",     sector: "Utilities"   },
  CRWD:  { name: "CrowdStrike",              sector: "Technology"  },
  CSCO:  { name: "Cisco Systems",            sector: "Technology"  },
  DECK:  { name: "Deckers Outdoor",          sector: "Consumer"    },
  EWY:   { name: "iShares MSCI South Korea", sector: "ETF"         },
  EWT:   { name: "iShares MSCI Taiwan",      sector: "ETF"         },
  GDX:   { name: "VanEck Gold Miners",       sector: "Commodity"   },
  GE:    { name: "GE Aerospace",             sector: "Industrials" },
  GLDM:  { name: "SPDR Gold MiniShares",     sector: "Commodity"   },
  JPM:   { name: "JPMorgan Chase",           sector: "Financials"  },
  LRCX:  { name: "Lam Research",             sector: "Technology"  },
  LLY:   { name: "Eli Lilly",               sector: "Healthcare"  },
  META:  { name: "Meta Platforms",           sector: "Technology"  },
  MSFT:  { name: "Microsoft",               sector: "Technology"  },
  MU:    { name: "Micron Technology",        sector: "Technology"  },
  NRG:   { name: "NRG Energy",              sector: "Utilities"   },
  NVDA:  { name: "NVIDIA",                  sector: "Technology"  },
  PBR:   { name: "Petrobras",               sector: "Energy"      },
  PGR:   { name: "Progressive",             sector: "Financials"  },
  RYDAF: { name: "Ryder System",            sector: "Industrials" },
  SGOL:  { name: "Aberdeen Gold ETF",       sector: "Commodity"   },
  SIVR:  { name: "Aberdeen Silver ETF",     sector: "Commodity"   },
  SLV:   { name: "iShares Silver Trust",    sector: "Commodity"   },
  SPDW:  { name: "SPDR Dev World ex-US",    sector: "ETF"         },
  TQQQ:  { name: "ProShares UltraPro QQQ",  sector: "ETF"         },
  TSM:   { name: "Taiwan Semiconductor",    sector: "Technology"  },
  VCSH:  { name: "Vanguard Short-Term Corp",sector: "ETF"         },
  VGSH:  { name: "Vanguard Short-Term Tsy", sector: "ETF"         },
  VLUE:  { name: "iShares MSCI Value",      sector: "ETF"         },
  VST:   { name: "Vistra",                  sector: "Utilities"   },
  VXUS:  { name: "Vanguard Total Intl",     sector: "ETF"         },
  WDC:   { name: "Western Digital",         sector: "Technology"  },
  XOM:   { name: "ExxonMobil",              sector: "Energy"      },
};

interface PreviewHolding {
  ticker: string;
  weight: number;
  position?: string;
  performance?: number | null;
  entry_date?: string | null;
}

interface PreviewData {
  as_of: string;
  inception_date: string;
  holdings: PreviewHolding[];
  metrics: {
    total_return: number;
    spy_total_return: number;
    ratio_vs_spy: number | null;
    period_6m: number | null;
    max_dd: number;
  };
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtMonthYear(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase();
}

function SectorPieChart({ holdings }: { holdings: PreviewHolding[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const sectorMap: Record<string, string[]> = {};
  holdings.forEach(h => {
    const s = TICKER_NAMES[h.ticker]?.sector ?? "Other";
    if (!sectorMap[s]) sectorMap[s] = [];
    sectorMap[s].push(h.ticker);
  });
  const total = holdings.length;
  const entries = Object.entries(sectorMap).sort((a, b) => b[1].length - a[1].length);

  const cx = 100, cy = 100, r = 82, inner = 48;
  let angle = -Math.PI / 2;
  const slices = entries.map(([sector, tickers]) => {
    const pct = tickers.length / total;
    const sweep = pct * 2 * Math.PI;
    const midAngle = angle + sweep / 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const xi1 = cx + inner * Math.cos(angle - sweep);
    const yi1 = cy + inner * Math.sin(angle - sweep);
    const xi2 = cx + inner * Math.cos(angle);
    const yi2 = cy + inner * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const pop = 6;
    const tx = Math.cos(midAngle) * pop;
    const ty = Math.sin(midAngle) * pop;
    return { sector, tickers, pct, large, x1, y1, x2, y2, xi1, yi1, xi2, yi2, tx, ty, color: SECTOR_COLORS[sector] ?? "#8A8F9A" };
  });

  const hovSlice = slices.find(s => s.sector === hovered);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
        {slices.map(s => {
          const isHov = hovered === s.sector;
          const dim   = hovered && !isHov;
          return (
            <path key={s.sector}
              d={`M ${s.xi1} ${s.yi1} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2} L ${s.xi2} ${s.yi2} A ${inner} ${inner} 0 ${s.large} 0 ${s.xi1} ${s.yi1} Z`}
              fill={s.color} stroke="var(--bg-secondary)" strokeWidth="2"
              transform={isHov ? `translate(${s.tx}, ${s.ty})` : undefined}
              style={{ cursor: "pointer", opacity: dim ? 0.35 : 1, transition: "opacity 0.18s, transform 0.18s" }}
              onMouseEnter={() => setHovered(s.sector)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
        {slices.map(s => {
          const isHov = hovered === s.sector;
          const dim   = hovered && !isHov;
          return (
            <div key={s.sector}
              onMouseEnter={() => setHovered(s.sector)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default", opacity: dim ? 0.35 : 1, transition: "opacity 0.18s" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: isHov ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isHov ? 500 : 300, transition: "color 0.15s" }}>
                  {s.sector}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: "auto", minWidth: 32, textAlign: "right" }}>
                  {Math.round(s.pct * 100)}%
                </span>
              </div>
              {isHov && (
                <div style={{ marginTop: 5, marginLeft: 16, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {s.tickers.map(t => (
                    <span key={t} style={{
                      fontSize: 10, fontWeight: 500, letterSpacing: "0.03em",
                      padding: "2px 7px", borderRadius: "var(--radius-full)",
                      background: `${s.color}22`, border: `1px solid ${s.color}55`, color: s.color,
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {hovSlice && (
          <div style={{ marginTop: 4, paddingTop: 8, borderTop: "0.5px solid var(--border-subtle)", fontSize: 11, color: "var(--text-tertiary)" }}>
            {hovSlice.tickers.length} stock{hovSlice.tickers.length !== 1 ? "s" : ""} · {Math.round(hovSlice.pct * 100)}% of portfolio
          </div>
        )}
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35, display: "block", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
      <text x="8" y="12" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="sans-serif">i</text>
    </svg>
  );
}

function MetricCard({ val, label, tooltip, dimmed }: { val: string; label: string; tooltip: string; dimmed?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div style={{
        fontFamily: outfit, fontWeight: 200, fontSize: 26,
        color: dimmed ? "var(--text-secondary)" : "var(--text-primary)",
        letterSpacing: "-0.02em", marginBottom: 4,
      }}>
        {val}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          style={{ cursor: "default", lineHeight: 0 }}
        >
          <InfoIcon />
          {show && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)", left: 0,
              background: "var(--bg-primary)", border: "0.5px solid var(--border-default)",
              borderRadius: 8, padding: "8px 11px", width: 200,
              fontSize: 11, lineHeight: 1.55, color: "var(--text-secondary)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              pointerEvents: "none", zIndex: 20,
            }}>
              {tooltip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const thL: React.CSSProperties = {
  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em",
  color: "var(--text-tertiary)", fontWeight: 400, fontFamily: outfit,
  padding: "10px 8px 10px 0", borderBottom: "0.5px solid var(--border-subtle)",
  textAlign: "left",
};
const th: React.CSSProperties = { ...thL };
const tdL: React.CSSProperties = {
  padding: "11px 8px 11px 0", borderBottom: "0.5px solid var(--border-subtle)",
  fontSize: 13, color: "var(--text-primary)", fontFamily: outfit, fontWeight: 300,
};
const td: React.CSSProperties = { ...tdL };

export function FreePreview() {
  const navigate = useNavigate();
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/portfolio_preview`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const asOf = data ? fmtDate(data.as_of) : null;
  const m    = data?.metrics;

  const metrics = m ? [
    {
      val:     `+${Math.round(m.total_return)}%`,
      label:   "since inception",
      tooltip: `Total cumulative return of the portfolio from ${data?.inception_date} up to ${data?.as_of}.`,
      dimmed:  false,
    },
    {
      val:     m.ratio_vs_spy != null ? `×${m.ratio_vs_spy.toFixed(1)}` : "—",
      label:   "vs S&P 500",
      tooltip: "How many times more the portfolio returned compared to the S&P 500 over the same period.",
      dimmed:  false,
    },
    {
      val:     m.period_6m != null ? `${m.period_6m >= 0 ? "+" : ""}${m.period_6m.toFixed(1)}%` : "—",
      label:   "this period (6m)",
      tooltip: "Portfolio return over the 6 months leading up to this snapshot date.",
      dimmed:  false,
    },
    {
      val:     `−${Math.abs(m.max_dd).toFixed(1)}%`,
      label:   "max drawdown",
      tooltip: "Largest peak-to-trough decline in portfolio value since inception. Lower is better.",
      dimmed:  true,
    },
  ] : [
    { val: "—", label: "since inception",  tooltip: "", dimmed: false },
    { val: "—", label: "vs S&P 500",       tooltip: "", dimmed: false },
    { val: "—", label: "this period (6m)", tooltip: "", dimmed: false },
    { val: "—", label: "max drawdown",     tooltip: "", dimmed: true  },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
        >
          <QuantinLogo iconSize={22} />
        </button>
        <Button size="sm" onClick={() => navigate("/subscribe")}>
          Get the portfolio — $25/mo
        </Button>
      </nav>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 2rem 6rem" }}>

        {/* Badge */}
        <div style={{ marginBottom: "1.25rem" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--info-bg)", border: "0.5px solid var(--info-border)",
            borderRadius: 100, padding: "3px 10px",
            fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--info-text)",
          }}>
            Free preview · 90 days ago
          </span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{
              fontFamily: playfair, fontWeight: 400, fontSize: 32,
              color: "var(--text-primary)", margin: 0, lineHeight: 1.2,
            }}>
              {asOf ? `Positions by ${asOf}` : "Loading…"}
            </h1>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
              Current picks are for subscribers
            </span>
          </div>
          {asOf && (
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              This is a historical snapshot of the portfolio as it stood 90 days ago ({asOf}). Positions and performance reflect that date — not today's.
            </p>
          )}

          {/* Metrics */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "0.5px solid var(--border-subtle)", paddingTop: "1.5rem", gap: 0,
          }}>
            {metrics.map(({ val, label, tooltip, dimmed }, i) => (
              <div key={label} style={{ paddingRight: i < 3 ? "1.5rem" : 0 }}>
                <MetricCard val={val} label={label} tooltip={tooltip} dimmed={dimmed} />
              </div>
            ))}
          </div>
        </div>

        {/* Holdings table */}
        <div style={{
          background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2rem",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th style={{ ...thL, padding: "10px 8px 10px 1.25rem", width: "40%" }}>Stock</th>
                <th style={th}>In portfolio since</th>
                <th style={th}>Performance since entry</th>
                <th style={{ ...th, paddingRight: "1.25rem" }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {data ? data.holdings.map((h, i) => {
                const info = TICKER_NAMES[h.ticker] ?? { name: "", sector: "" };
                const pos  = h.position ?? "long";
                const perf = h.performance;
                return (
                  <tr key={h.ticker} style={{ background: i % 2 === 0 ? "var(--bg-primary)" : "transparent" }}>
                    <td style={{ ...tdL, padding: "11px 8px 11px 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 500 }}>{h.ticker}</span>
                        {info.sector && (
                          <span style={{
                            fontSize: 10, color: "var(--text-tertiary)",
                            background: "var(--bg-secondary)", borderRadius: 3, padding: "1px 5px",
                          }}>{info.sector}</span>
                        )}
                      </div>
                      {info.name && (
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{info.name}</div>
                      )}
                    </td>
                    <td style={td}>
                      {h.entry_date
                        ? <span style={{ fontSize: 13 }}>{fmtMonthYear(h.entry_date)}</span>
                        : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td style={td}>
                      {perf != null
                        ? <span style={{ fontWeight: 500, color: perf >= 0 ? "#1D9E75" : "#B5621A" }}>
                            {perf >= 0 ? "+" : ""}{perf.toFixed(1)}%
                          </span>
                        : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td style={{ ...td, paddingRight: "1.25rem" }}>
                      <span style={{
                        display: "inline-block", fontSize: 11, fontWeight: 600,
                        padding: "3px 10px", borderRadius: "var(--radius-full)",
                        background: pos === "long" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)",
                        color: pos === "long" ? "#34D399" : "var(--text-tertiary)",
                        border: pos === "long" ? "1px solid rgba(52,211,153,0.35)" : "1px solid var(--border-subtle)",
                        letterSpacing: "0.04em", textTransform: "uppercase" as const,
                      }}>
                        {pos === "long" ? "Long" : "Cash"}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} style={{ ...td, textAlign: "center", color: "var(--text-tertiary)", padding: "2rem" }}>
                    {error ? "Unable to load preview data." : "Loading…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg-secondary)", fontSize: 12, color: "var(--text-tertiary)", display: "flex", justifyContent: "space-between" }}>
            <span>Equal weight · {data?.holdings.length ?? "—"} positions</span>
            <span>{asOf ? `Snapshot as of ${asOf}` : ""}</span>
          </div>
        </div>

        {/* Sector composition */}
        {data && data.holdings.length > 0 && (
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", padding: "1.5rem", marginBottom: "2rem",
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, fontSize: 17,
              color: "var(--text-primary)", margin: "0 0 1.25rem",
            }}>
              Sector composition
            </h2>
            <SectorPieChart holdings={data.holdings} />
          </div>
        )}

        {/* Paywall CTA */}
        <div style={{
          background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", padding: "1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem", flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 17, color: "var(--text-primary)", marginBottom: 4 }}>
              Ready to see the current 15?
            </p>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
              Updated every 2 months · email alert on every change
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Button size="md" onClick={() => navigate("/subscribe")}>
              Get the portfolio — $25/mo
            </Button>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
              Cancel anytime · no commitment
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}

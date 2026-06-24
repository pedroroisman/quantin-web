import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";

const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

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
        color: dimmed ? "var(--text-secondary)" : "#1e1e1c",
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
            background: "#f0f8f4", border: "0.5px solid #c0e0d4",
            borderRadius: 100, padding: "3px 10px",
            fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "#0F6E56",
          }}>
            Free preview · 90 days ago
          </span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{
              fontFamily: playfair, fontWeight: 400, fontSize: 32,
              color: "var(--text-primary)", margin: 0, lineHeight: 1.2,
            }}>
              {asOf ? `Active positions by ${asOf}` : "Loading…"}
            </h1>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
              Current picks are for subscribers
            </span>
          </div>

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
                <th style={{ ...thL, padding: "10px 8px 10px 1.25rem", width: "50%" }}>Stock</th>
                <th style={th}>Performance</th>
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
                      {perf != null
                        ? <>
                            <span style={{ fontWeight: 500, color: perf >= 0 ? "#1D9E75" : "#B5621A" }}>
                              {perf >= 0 ? "+" : ""}{perf.toFixed(1)}%
                            </span>
                            {h.entry_date && (
                              <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1 }}>
                                since {h.entry_date}
                              </div>
                            )}
                          </>
                        : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td style={{ ...td, paddingRight: "1.25rem" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: pos === "long" ? "#1D9E75" : "#8A8F9A" }}>
                        {pos === "long" ? "Long" : "Cash"}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={3} style={{ ...td, textAlign: "center", color: "var(--text-tertiary)", padding: "2rem" }}>
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

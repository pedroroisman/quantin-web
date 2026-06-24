import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";
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

interface Holding { ticker: string; active: boolean; }
interface PrevPeriod {
  start_date: string;
  end_date: string;
  holdings: Holding[];
  total: number;
  period_model: number | null;
  period_spy: number | null;
  period_alpha: number | null;
}

function fmt(d: string) {
  const [y, m] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

const th: React.CSSProperties = {
  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em",
  color: "var(--text-tertiary)", fontWeight: 400, fontFamily: outfit,
  padding: "0 8px 10px 0", borderBottom: "0.5px solid var(--border-subtle)",
  textAlign: "left" as const,
};
const thR: React.CSSProperties = { ...th, textAlign: "right" as const };
const td: React.CSSProperties = {
  padding: "10px 8px 10px 0", borderBottom: "0.5px solid var(--border-subtle)",
  fontSize: 13, color: "var(--text-primary)",
};
const tdR: React.CSSProperties = { ...td, textAlign: "right" as const };

const sectionLabel: React.CSSProperties = {
  fontFamily: outfit, fontWeight: 300, fontSize: 10,
  textTransform: "uppercase", letterSpacing: "0.1em",
  color: "#1D9E75", marginBottom: "0.75rem",
};

export function FreePreview() {
  const navigate = useNavigate();
  const [data, setData] = useState<PrevPeriod | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/portfolio_previous_period`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const activeCount  = data?.holdings.filter(h => h.active).length ?? 0;
  const exitedCount  = data?.holdings.filter(h => !h.active).length ?? 0;

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

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#f0f8f4", border: "0.5px solid #c0e0d4",
            borderRadius: 100, padding: "3px 10px",
            fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "#0F6E56",
          }}>
            Free preview
          </span>
          {data && (
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>
              {fmt(data.start_date)} · previous rebalance period
            </span>
          )}
          <span style={{ marginLeft: "auto", fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
            Current picks are for subscribers
          </span>
        </div>

        <h1 style={{
          fontFamily: playfair, fontWeight: 400, fontSize: 28,
          color: "var(--text-primary)", marginBottom: "0.4rem", lineHeight: 1.2,
        }}>
          {data ? `The portfolio from ${fmt(data.start_date)}` : "Loading…"}
        </h1>
        {data && (
          <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 14, lineHeight: 1.65, maxWidth: 520, color: "var(--text-secondary)", marginBottom: "2rem" }}>
            These were the {data.total} picks selected on {fmt(data.start_date)}.
            {exitedCount > 0
              ? ` ${exitedCount} have since exited — subscribers received an alert when each one was replaced.`
              : " All are still active in the current portfolio."}
          </p>
        )}

        {/* Period metrics */}
        {data && data.period_model !== null && (
          <>
            <p style={sectionLabel}>
              Portfolio performance · {fmt(data.start_date)} – {fmt(data.end_date)}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "2.5rem" }}>
              {[
                { label: "Portfolio return",    val: `${data.period_model >= 0 ? "+" : ""}${data.period_model}%`, green: (data.period_model ?? 0) >= 0 },
                { label: "S&P 500 same period", val: `${(data.period_spy ?? 0) >= 0 ? "+" : ""}${data.period_spy}%`, green: false },
                { label: "Alpha vs S&P 500",    val: `${(data.period_alpha ?? 0) >= 0 ? "+" : ""}${data.period_alpha}pp`, green: (data.period_alpha ?? 0) >= 0 },
              ].map(({ label, val, green }) => (
                <div key={label} style={{
                  background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)", padding: "14px 16px",
                }}>
                  <div style={{
                    fontFamily: playfair, fontWeight: 400, fontSize: 22,
                    color: green ? "#0F6E56" : "var(--text-secondary)",
                    marginBottom: 4,
                  }}>
                    {val}
                  </div>
                  <div style={{
                    fontFamily: outfit, fontWeight: 300, fontSize: 10,
                    color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Picks table */}
        {data && (
          <>
            <p style={sectionLabel}>
              Picks · {fmt(data.start_date)} – {fmt(data.end_date)} · {activeCount} still active, {exitedCount} exited
            </p>
            <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    <th style={{ ...th, padding: "10px 8px 10px 1.25rem", width: "55%" }}>Stock</th>
                    <th style={thR}>Sector</th>
                    <th style={{ ...thR, paddingRight: "1.25rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.holdings.map((h, i) => {
                    const info = TICKER_NAMES[h.ticker] ?? { name: "", sector: "—" };
                    return (
                      <tr key={h.ticker} style={{ background: i % 2 === 0 ? "var(--bg-primary)" : "transparent" }}>
                        <td style={{ ...td, padding: "10px 8px 10px 1.25rem" }}>
                          <span style={{ fontWeight: 500 }}>{h.ticker}</span>
                          {info.name && (
                            <>
                              <br />
                              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{info.name}</span>
                            </>
                          )}
                        </td>
                        <td style={tdR}>
                          <span style={{
                            fontSize: 10, color: "var(--text-tertiary)",
                            background: "var(--bg-secondary)", borderRadius: 3,
                            padding: "1px 5px",
                          }}>
                            {info.sector}
                          </span>
                        </td>
                        <td style={{ ...tdR, paddingRight: "1.25rem" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: h.active ? "#1D9E75" : "#8A8F9A",
                          }}>
                            {h.active ? "Active" : "Exited"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && (
          <p style={{ color: "var(--text-tertiary)", textAlign: "center", padding: "3rem 0" }}>
            Unable to load portfolio data.
          </p>
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

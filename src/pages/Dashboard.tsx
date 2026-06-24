import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";

const TICKER_NAMES: Record<string, { name: string; sector: string }> = {
  AAPL: { name: "Apple",                   sector: "Technology"  },
  AMAT: { name: "Applied Materials",        sector: "Technology"  },
  AMZN: { name: "Amazon",                  sector: "Consumer"    },
  ANET: { name: "Arista Networks",          sector: "Technology"  },
  ASML: { name: "ASML Holding",            sector: "Technology"  },
  AVDV: { name: "Avantis Intl Small Cap",  sector: "ETF"         },
  AVLV: { name: "Avantis US Large Cap Val",sector: "ETF"         },
  CEG:  { name: "Constellation Energy",    sector: "Utilities"   },
  CRWD: { name: "CrowdStrike",             sector: "Technology"  },
  CSCO: { name: "Cisco Systems",           sector: "Technology"  },
  DECK: { name: "Deckers Outdoor",         sector: "Consumer"    },
  EWY:  { name: "iShares MSCI South Korea",sector: "ETF"         },
  GE:   { name: "GE Aerospace",            sector: "Industrials" },
  JPM:  { name: "JPMorgan Chase",          sector: "Financials"  },
  LRCX: { name: "Lam Research",            sector: "Technology"  },
  LLY:  { name: "Eli Lilly",              sector: "Healthcare"  },
  META: { name: "Meta Platforms",          sector: "Technology"  },
  MSFT: { name: "Microsoft",              sector: "Technology"  },
  MU:   { name: "Micron Technology",       sector: "Technology"  },
  NRG:  { name: "NRG Energy",             sector: "Utilities"   },
  NVDA: { name: "NVIDIA",                 sector: "Technology"  },
  PBR:  { name: "Petrobras",              sector: "Energy"      },
  PGR:  { name: "Progressive",            sector: "Financials"  },
  RYDAF:{ name: "Ryder System",           sector: "Industrials" },
  SPDW: { name: "SPDR Dev World ex-US",   sector: "ETF"         },
  TSM:  { name: "Taiwan Semiconductor",   sector: "Technology"  },
  VLUE: { name: "iShares MSCI Value",     sector: "ETF"         },
  VST:  { name: "Vistra",                 sector: "Utilities"   },
  WDC:  { name: "Western Digital",        sector: "Technology"  },
  XOM:  { name: "ExxonMobil",             sector: "Energy"      },
};

interface PortfolioHolding { ticker: string; weight: number; }
interface PortfolioData {
  portfolio: PortfolioHolding[];
  as_of: string;
  validation: { metrics: { cagr: number; sharpe: number; max_dd: number; total_return: number }; dollar_simulation: { final_model: number; final_spy: number } };
  period_metrics: Record<string, { model: { total: number } }>;
}

type AlertKey = "exit" | "entry" | "reminder" | "regime";
const defaultAlerts: Record<AlertKey, boolean> = {
  exit: true, entry: true, reminder: false, regime: true,
};

const alertDefs: { key: AlertKey; label: string; sub: string; warn?: boolean }[] = [
  { key: "exit",     label: "Stock exits the portfolio",      sub: "Immediate email + push when a position is dropped" },
  { key: "entry",    label: "New stock enters the portfolio",  sub: "Alert when a new position is added at rebalance" },
  { key: "reminder", label: "Rebalance reminder",             sub: "7 days before every scheduled rebalance" },
  { key: "regime",   label: "Regime change",                  sub: "Alert if market transitions to Bear or high volatility", warn: true },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: "pointer", flexShrink: 0,
        background: on ? "#185FA5" : "var(--border-default)",
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "white",
        position: "absolute", top: 2,
        left: on ? 18 : 2,
        transition: "left 0.2s",
      }} />
    </div>
  );
}

const th: React.CSSProperties = {
  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em",
  color: "var(--text-tertiary)", fontWeight: 500,
  padding: "10px 8px 10px 0", borderBottom: "0.5px solid var(--border-subtle)",
  textAlign: "right" as const,
};
const thL: React.CSSProperties = { ...th, textAlign: "left" as const };
const td: React.CSSProperties = {
  padding: "11px 8px 11px 0", borderBottom: "0.5px solid var(--border-subtle)",
  fontSize: 13, color: "var(--text-primary)", textAlign: "right" as const,
  verticalAlign: "middle",
};
const tdL: React.CSSProperties = { ...td, textAlign: "left" as const };

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

export function Dashboard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(defaultAlerts);
  const toggle = (k: AlertKey) => setAlerts(a => ({ ...a, [k]: !a[k] }));
  const [authReady, setAuthReady] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [positions, setPositions] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session?.user?.email) { navigate("/signin"); return; }
      setAuthReady(true);
      const { data, error } = await supabase
        .from("subscribers")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();
      if (!mounted) return;
      // On RLS error, default to showing portfolio (benefit of doubt for real subscribers)
      setIsSubscriber(error ? true : !!data);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") navigate("/signin");
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    Promise.all([
      fetch(`${apiUrl}/api/portfolio_optimizer`).then(r => r.json()),
      fetch(`${apiUrl}/api/portfolio_positions`).then(r => r.json()),
    ]).then(([port, pos]) => {
      setPortfolio(port);
      setPositions(pos);
    }).catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const [showWelcome] = useState(() => {
    return new URLSearchParams(window.location.search).has("session_id");
  });
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcome);

  const dismissWelcome = () => {
    setWelcomeVisible(false);
    window.history.replaceState({}, "", "/portfolio");
  };

  if (!authReady || isSubscriber === null) return null;

  if (!isSubscriber) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)", display: "flex", flexDirection: "column" }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <QuantinLogo iconSize={22} />
        <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
      </nav>
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "4rem 2rem 6rem", textAlign: "center",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "1px solid #c0e0d4",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "2rem",
        }}>
          <div style={{ width: 14, height: 14, background: "#1D9E75", borderRadius: "50%" }} />
        </div>
        <p style={{
          fontFamily: outfit, fontWeight: 300, fontSize: 11,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#0F6E56", marginBottom: "0.75rem",
        }}>
          Account ready
        </p>
        <h1 style={{
          fontFamily: playfair, fontWeight: 400, fontSize: 36,
          color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.15,
        }}>
          One step left.
        </h1>
        <p style={{
          fontFamily: outfit, fontWeight: 300, fontSize: 15,
          color: "var(--text-tertiary)", marginBottom: "2.5rem", maxWidth: 380,
        }}>
          Your account is set up. Activate your subscription to access the portfolio and rebalance alerts.
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: "2.5rem",
          background: "#f0f8f4", border: "0.5px solid #c0e0d4",
          borderRadius: 100, padding: "5px 14px",
        }}>
          <div style={{ width: 6, height: 6, background: "#1D9E75", borderRadius: "50%" }} />
          <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#0F6E56" }}>
            Bull market, low volatility — historically the strongest regime
          </span>
        </div>
        <Button size="lg" onClick={() => navigate("/subscribe")}>
          Subscribe — $25/mo
        </Button>
        <p style={{
          fontFamily: outfit, fontWeight: 300, fontSize: 12,
          color: "var(--text-tertiary)", marginTop: "0.9rem",
        }}>
          30-day money-back guarantee
        </p>
      </main>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>

      {/* Welcome overlay */}
      {welcomeVisible && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "#ffffff",
          display: "flex", flexDirection: "column",
        }}>
          {/* Nav */}
          <nav style={{
            height: 56, borderBottom: "0.5px solid #eee",
            display: "flex", alignItems: "center", padding: "0 2rem",
          }}>
            <QuantinLogo iconSize={22} />
          </nav>

          {/* Content */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "4rem 2rem 6rem", textAlign: "center",
          }}>
            {/* Confirmation dot */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "1px solid #c0e0d4",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "2rem",
            }}>
              <div style={{ width: 14, height: 14, background: "#1D9E75", borderRadius: "50%" }} />
            </div>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#0F6E56", marginBottom: "0.9rem",
            }}>
              Payment confirmed
            </p>

            <h1 style={{
              fontFamily: playfair, fontWeight: 400, fontSize: 44,
              color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.1,
            }}>
              you're in.
            </h1>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 16,
              color: "#888780", marginBottom: "2.25rem",
            }}>
              Welcome to Quantin. Your portfolio is ready.
            </p>

            {/* Regime */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#f0f8f4", border: "0.5px solid #c0e0d4",
              borderRadius: 100, padding: "6px 14px", marginBottom: "2.5rem",
            }}>
              <div style={{ width: 7, height: 7, background: "#1D9E75", borderRadius: "50%" }} />
              <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#0F6E56" }}>
                Bull market, low volatility — historically the strongest regime
              </span>
            </div>

            <div style={{ width: 32, height: "0.5px", background: "#e0ddd8", marginBottom: "2.5rem" }} />

            {/* Stats */}
            <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", marginBottom: "3rem" }}>
              {[
                { label: "Current picks", val: "15 stocks" },
                { label: "Next rebalance", val: "Aug 2026" },
                { label: "Annual return", val: "+26.4%" },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 15, color: "#1e1e1c" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={dismissWelcome}
              style={{
                background: "#0C447C", color: "#fff", border: "none",
                borderRadius: 8, padding: "13px 32px",
                fontFamily: outfit, fontWeight: 300, fontSize: 15,
                cursor: "pointer", marginBottom: "1rem",
              }}
            >
              View portfolio →
            </button>

            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#b4b2a9" }}>
              A confirmation was sent to your email
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <QuantinLogo iconSize={22} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/smart-selector")}>
            Smart Selector
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 2rem 6rem" }}>

        {/* Hero */}
        <div style={{ marginBottom: "2.5rem" }}>

          {/* Regime pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#f0f8f4", border: "0.5px solid #c0e0d4",
            borderRadius: 100, padding: "5px 13px", marginBottom: "1.5rem",
          }}>
            <div style={{ width: 7, height: 7, background: "#1D9E75", borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#0F6E56" }}>
              Bull market, low volatility
            </span>
          </div>

          {/* Title + next rebalance */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{
              fontFamily: playfair, fontWeight: 400, fontSize: 32,
              color: "var(--text-primary)", margin: 0, lineHeight: 1.2,
            }}>
              Active positions
            </h1>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
              Next rebalance Aug 2026
            </span>
          </div>

          {/* Metrics */}
          {(() => {
            const v = portfolio?.validation;
            const p6 = portfolio?.period_metrics?.["6m"];
            const liveMetrics = v ? [
              { val: `+${Math.round(v.total_return)}%`,  label: "since inception" },
              { val: `×${(v.dollar_simulation.final_model / v.dollar_simulation.final_spy).toFixed(1)}`, label: "vs S&P 500" },
              { val: p6 ? `+${p6.model.total.toFixed(1)}%` : "—", label: "this period (6m)" },
              { val: `−${Math.abs(v.metrics.max_dd).toFixed(1)}%`, label: "max drawdown" },
            ] : [
              { val: "—", label: "since inception" },
              { val: "—", label: "vs S&P 500" },
              { val: "—", label: "this period" },
              { val: "—", label: "max drawdown" },
            ];
            return (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                borderTop: "0.5px solid var(--border-subtle)", paddingTop: "1.5rem", gap: 0,
              }}>
                {liveMetrics.map(({ val, label }, i) => (
                  <div key={label} style={{ paddingRight: i < 3 ? "1.5rem" : 0 }}>
                    <div style={{
                      fontFamily: outfit, fontWeight: 200, fontSize: 26,
                      color: val.startsWith("−") ? "var(--text-secondary)" : "#1e1e1c",
                      letterSpacing: "-0.02em", marginBottom: 5,
                    }}>
                      {val}
                    </div>
                    <div style={{
                      fontSize: 10, color: "var(--text-tertiary)",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Positions table */}
        <div style={{
          background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2rem",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th style={{ ...thL, padding: "10px 8px 10px 1.25rem", width: "50%" }}>Stock</th>
                <th style={th}>Weight</th>
                <th style={{ ...th, paddingRight: "1.25rem" }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {portfolio ? portfolio.portfolio.map((h, i) => {
                const info = TICKER_NAMES[h.ticker] ?? { name: "", sector: "" };
                const pos  = positions[h.ticker] ?? "long";
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
                    <td style={{ ...td, color: "var(--text-secondary)" }}>
                      {(h.weight * 100).toFixed(1)}%
                    </td>
                    <td style={{ ...td, paddingRight: "1.25rem" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: pos === "long" ? "#1D9E75" : "#8A8F9A",
                      }}>
                        {pos === "long" ? "Long" : "Cash"}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={3} style={{ ...td, textAlign: "center", color: "var(--text-tertiary)", padding: "2rem" }}>
                    Loading portfolio…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg-secondary)", fontSize: 12, color: "var(--text-tertiary)", display: "flex", justifyContent: "space-between" }}>
            <span>{portfolio ? `${portfolio.portfolio.length} positions · equal weight` : "—"}</span>
            <span>{portfolio ? `As of ${portfolio.as_of}` : ""}</span>
          </div>
        </div>

        {/* Alert settings */}
        <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1D9E75", marginBottom: "0.75rem" }}>
          Alert settings
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alertDefs.map(({ key, label, sub, warn }) => (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "1rem 1.25rem", borderRadius: "var(--radius-md)",
              background: warn && alerts[key] ? "var(--warning-bg)" : "var(--bg-primary)",
              border: `0.5px solid ${warn && alerts[key] ? "var(--warning-border)" : "var(--border-subtle)"}`,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: warn && alerts[key] ? "var(--warning-text)" : "var(--text-primary)", margin: 0, marginBottom: 2 }}>
                  {label}
                </p>
                <p style={{ fontSize: 12, color: warn && alerts[key] ? "var(--warning-text)" : "var(--text-secondary)", margin: 0, opacity: 0.85 }}>
                  {sub}
                </p>
              </div>
              <Toggle on={alerts[key]} onToggle={() => toggle(key)} />
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

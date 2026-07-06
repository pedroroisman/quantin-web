import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useRegime } from "../hooks/useRegime";
import { track, identify } from "../lib/analytics";

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

const SECTOR_COLORS: Record<string, string> = {
  Technology:  "#185FA5",
  ETF:         "#1D9E75",
  Energy:      "#B5621A",
  Industrials: "#6B7280",
  Healthcare:  "#8B5CF6",
  Financials:  "#F59E0B",
  Consumer:    "#EC4899",
  Utilities:   "#10B981",
  Commodity:   "#D97706",
};

interface PortfolioHolding { ticker: string; weight: number; position?: string; performance?: number | null; entry_date?: string | null; performance_since_subscribed?: number | null; }
interface PortfolioData {
  portfolio: PortfolioHolding[];
  as_of: string;
  validation: { metrics: { cagr: number; sharpe: number; max_dd: number; total_return: number }; dollar_simulation: { final_model: number; final_spy: number } };
  period_metrics: Record<string, { model: { total: number } }>;
}

type AlertKey = "exit" | "entry" | "position";
const defaultAlerts: Record<AlertKey, boolean> = {
  exit: true, entry: true, position: true,
};

const alertDefs: { key: AlertKey; label: string; sub: string; warn?: boolean }[] = [
  { key: "exit",     label: "Stock exits the portfolio",      sub: "Alert when a position is removed at rebalance" },
  { key: "entry",    label: "New stock enters the portfolio",  sub: "Alert when a new position is added at rebalance" },
  { key: "position", label: "Position change (Long ↔ Cash)",  sub: "Alert when a held stock switches between Long and Cash" },
];

function MetricTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: "relative", lineHeight: 0, cursor: "default", flexShrink: 0 }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, display: "block" }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
        <text x="8" y="12" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="sans-serif">i</text>
      </svg>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "var(--bg-primary)", border: "0.5px solid var(--border-default)",
          borderRadius: 8, padding: "8px 11px", width: 200, zIndex: 20,
          fontSize: 11, lineHeight: 1.55, color: "var(--text-secondary)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", pointerEvents: "none",
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

function SectorPieChart({ holdings }: { holdings: PortfolioHolding[] }) {
  const sectors: Record<string, number> = {};
  holdings.forEach(h => {
    const s = TICKER_NAMES[h.ticker]?.sector ?? "Other";
    sectors[s] = (sectors[s] ?? 0) + 1;
  });
  const total = holdings.length;
  const entries = Object.entries(sectors).sort((a, b) => b[1] - a[1]);

  const cx = 70, cy = 70, r = 55, inner = 32;
  let angle = -Math.PI / 2;
  const slices = entries.map(([sector, count]) => {
    const pct = count / total;
    const sweep = pct * 2 * Math.PI;
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
    return { sector, pct, large, x1, y1, x2, y2, xi1, yi1, xi2, yi2, color: SECTOR_COLORS[sector] ?? "#8A8F9A" };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {slices.map(s => (
          <path key={s.sector}
            d={`M ${s.xi1} ${s.yi1} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2} L ${s.xi2} ${s.yi2} A ${inner} ${inner} 0 ${s.large} 0 ${s.xi1} ${s.yi1} Z`}
            fill={s.color} stroke="var(--bg-primary)" strokeWidth="1.5"
          />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {slices.map(s => (
          <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.sector}</span>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: "auto", minWidth: 32, textAlign: "right" }}>
              {Math.round(s.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const { label: regimeLabel, colors: regimeColors } = useRegime();
  const [alerts, setAlerts] = useState(defaultAlerts);
  const toggle = (k: AlertKey) => setAlerts(a => ({ ...a, [k]: !a[k] }));
  const [authReady, setAuthReady] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null);
  const [subscribedSince, setSubscribedSince] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session?.user?.email) { navigate("/signin"); return; }
      setAuthReady(true);
      identify(session.user.email, { email: session.user.email });
      const { data, error } = await supabase
        .from("subscribers")
        .select("id, created_at")
        .eq("email", session.user.email)
        .maybeSingle();
      if (!mounted) return;
      setIsSubscriber(error ? true : !!data);
      const since = data?.created_at ? data.created_at.split("T")[0] : null;
      if (since) setSubscribedSince(since);

      // Fetch portfolio now that we have the subscription date
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const url = since
        ? `${apiUrl}/api/portfolio_optimizer?since=${since}`
        : `${apiUrl}/api/portfolio_optimizer`;
      fetch(url).then(r => r.json()).then(d => { if (mounted) setPortfolio(d); }).catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") navigate("/signin");
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const [showWelcome] = useState(() => {
    const hasSid = new URLSearchParams(window.location.search).has("session_id");
    if (hasSid) track("paid", { plan: "monthly", amount: 25, currency: "USD" });
    return hasSid;
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
          background: regimeColors.bg, border: `0.5px solid ${regimeColors.border}`,
          borderRadius: 100, padding: "5px 14px",
        }}>
          <div style={{ width: 6, height: 6, background: regimeColors.dot, borderRadius: "50%" }} />
          <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: regimeColors.text }}>
            {regimeLabel ?? "Loading…"}
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
              <div style={{ width: 7, height: 7, background: regimeColors.dot, borderRadius: "50%" }} />
              <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: regimeColors.text }}>
                {regimeLabel ?? "Loading…"}
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
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
          <QuantinLogo iconSize={22} />
        </button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
            <div style={{ width: 7, height: 7, background: regimeColors.dot, borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: regimeColors.text }}>
              {regimeLabel ?? "Loading…"}
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
              { val: `+${Math.round(v.metrics.total_return)}%`,  label: "since inception",  tooltip: `Total cumulative return of the portfolio since the start of the backtest (Feb 2018).` },
              { val: `×${(v.dollar_simulation.final_model / v.dollar_simulation.final_spy).toFixed(1)}`, label: "vs S&P 500", tooltip: "How many times more the portfolio returned compared to the S&P 500 over the same period." },
              { val: p6 ? `+${p6.model.total.toFixed(1)}%` : "—", label: "this period (6m)", tooltip: "Portfolio return over the last 6 months (most recent closed period)." },
              { val: `−${Math.abs(v.metrics.max_dd).toFixed(1)}%`, label: "max drawdown", tooltip: "Largest peak-to-trough decline in portfolio value since inception. Lower is better." },
            ] : [
              { val: "—", label: "since inception",  tooltip: "" },
              { val: "—", label: "vs S&P 500",       tooltip: "" },
              { val: "—", label: "this period (6m)", tooltip: "" },
              { val: "—", label: "max drawdown",     tooltip: "" },
            ];
            return (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                borderTop: "0.5px solid var(--border-subtle)", paddingTop: "1.5rem", gap: 0,
              }}>
                {liveMetrics.map(({ val, label, tooltip }, i) => (
                  <div key={label} style={{ paddingRight: i < 3 ? "1.5rem" : 0 }}>
                    <div style={{
                      fontFamily: outfit, fontWeight: 200, fontSize: 26,
                      color: val.startsWith("−") ? "var(--text-secondary)" : "#1e1e1c",
                      letterSpacing: "-0.02em", marginBottom: 5,
                    }}>
                      {val}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
                      <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {label}
                      </div>
                      {tooltip && <MetricTooltip text={tooltip} />}
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
                <th style={{ ...thL, padding: "10px 8px 10px 1.25rem", width: "40%" }}>Stock</th>
                <th style={th}>Performance since entry</th>
                {subscribedSince && <th style={th}>Since subscribed</th>}
                <th style={{ ...th, paddingRight: "1.25rem" }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {portfolio ? portfolio.portfolio.map((h, i) => {
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
                    <td style={{ ...td }}>
                      {perf != null
                        ? <>
                            <span style={{ fontWeight: 500, color: perf >= 0 ? "#1D9E75" : "#B5621A" }}>{perf >= 0 ? "+" : ""}{perf.toFixed(1)}%</span>
                            {h.entry_date && <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1 }}>since {h.entry_date}</div>}
                          </>
                        : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    {subscribedSince && (
                      <td style={{ ...td }}>
                        {h.performance_since_subscribed != null
                          ? <span style={{ fontWeight: 500, color: h.performance_since_subscribed >= 0 ? "#1D9E75" : "#B5621A" }}>
                              {h.performance_since_subscribed >= 0 ? "+" : ""}{h.performance_since_subscribed.toFixed(1)}%
                            </span>
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                    )}
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
                    Loading portfolio…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg-secondary)", fontSize: 12, color: "var(--text-tertiary)", display: "flex", justifyContent: "space-between" }}>
            <span>Equal weight · {portfolio?.portfolio.length ?? "—"} positions</span>
            <span>{portfolio ? `Since rebalance · as of ${portfolio.as_of}` : ""}</span>
          </div>
        </div>

        {/* Sector composition */}
        {portfolio && portfolio.portfolio.length > 0 && (
          <>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1D9E75", marginBottom: "0.75rem" }}>
              Sector composition
            </p>
            <div style={{
              background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "2rem",
            }}>
              <SectorPieChart holdings={portfolio.portfolio} />
            </div>
          </>
        )}

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

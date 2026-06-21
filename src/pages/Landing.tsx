import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Button, QuantinLogo } from "../components/ui";

const chartData = [
  { period: "Oct '17", quantin: 10000, sp500: 10000  },
  { period: "2018",    quantin: 10424, sp500: 10020  },
  { period: "2019",    quantin: 11523, sp500: 13149  },
  { period: "2020",    quantin: 23901, sp500: 15565  },
  { period: "2021",    quantin: 29819, sp500: 20039  },
  { period: "2022",    quantin: 28692, sp500: 16397  },
  { period: "2023",    quantin: 34478, sp500: 20692  },
  { period: "2024",    quantin: 43928, sp500: 25841  },
  { period: "2025",    quantin: 52732, sp500: 30419  },
  { period: "Jun '26", quantin: 67569, sp500: 33179  },
];

const metrics = [
  { val: "+26.4%", label: "Annual return",  sub: "vs +14.5% S&P 500", valueColor: "var(--success-text)" },
  { val: "2.11",   label: "Sharpe ratio",   sub: "vs 0.80 S&P 500",   valueColor: "var(--text-primary)" },
  { val: "−9.9%",  label: "Max drawdown",   sub: "vs −33.7% S&P 500", valueColor: "var(--text-primary)" },
];

function formatY(v: number) {
  return "$" + Math.round(v / 1000) + "k";
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-primary)", border: "0.5px solid var(--border-default)",
      borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13,
    }}>
      <div style={{ color: "var(--text-tertiary)", marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 3 }}>
          {p.name}: <strong>${p.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .nav-secondary { display: none !important; }
          .hero-headline { font-size: 28px !important; }
          .metric-grid { gap: 10px !important; }
          .metric-val { font-size: 20px !important; }
          .metric-label { font-size: 9px !important; }
          .metric-sub { display: none !important; }
          .cta-row { flex-direction: column !important; align-items: flex-start !important; }
          .footer-strip { gap: 1rem !important; }
          .chart-legend { flex-direction: column !important; gap: 8px !important; }
          .chart-legend-note { margin-left: 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>

        {/* Nav */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2rem", height: 56,
          background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <QuantinLogo iconSize={22} />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="nav-secondary" style={{ display: "inline-flex" }}>
              <Button variant="ghost" size="sm" onClick={() => navigate("/signin")}>Sign in</Button>
            </span>
            <span className="nav-secondary" style={{ display: "inline-flex" }}>
              <Button variant="ghost" size="sm" onClick={() => navigate("/preview")}>See free preview</Button>
            </span>
            <Button variant="primary" size="sm" onClick={() => navigate("/subscribe")}>Get the portfolio</Button>
          </div>
        </nav>

        {/* Hero */}
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

          {/* Logo mark — centered */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <svg width="52" height="43" viewBox="0 0 44 36" fill="none" style={{ display: "block", margin: "0 auto 5px" }}>
              <ellipse cx="22" cy="9"    rx="3"   ry="7"   fill="#0C447C"/>
              <ellipse cx="22" cy="20.5" rx="9.5" ry="3"   fill="#378ADD" fillOpacity="0.7"/>
              <ellipse cx="22" cy="27"   rx="15"  ry="2"   fill="#85B7EB" fillOpacity="0.55"/>
            </svg>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 400,
              fontSize: 15, letterSpacing: "0.05em",
              color: "var(--text-secondary)",
            }}>
              Quantin
            </span>
          </div>

          {/* Regime pill */}
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(29,158,117,0.08)", border: "0.5px solid rgba(29,158,117,0.3)",
              borderRadius: 100, padding: "4px 12px",
            }}>
              <span style={{ width: 6, height: 6, background: "#1D9E75", borderRadius: "50%", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "#0F6E56", letterSpacing: "0.01em" }}>
                Live · Bull market, low volatility
              </span>
            </span>
          </div>

          <p style={{
            fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em",
            color: "var(--text-tertiary)", marginBottom: "0.3rem",
          }}>
            Quantitative portfolio
          </p>

          <h1 className="hero-headline" style={{
            fontSize: 36, marginBottom: "0.75rem",
            color: "var(--text-primary)", lineHeight: 1.2,
          }}>
            Math picks your stocks.<br />You just invest.
          </h1>

          <p style={{
            fontSize: 16, lineHeight: 1.65, maxWidth: 520,
            color: "var(--text-secondary)", marginBottom: "2.5rem",
          }}>
            Every two months, Quantin selects the 15 best-performing assets using
            quantitative models. No opinions. Just data.
          </p>

          {/* Metrics */}
          <div className="metric-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10, marginBottom: "2rem",
          }}>
            {metrics.map(({ val, label, sub, valueColor }) => (
              <div key={label} style={{
                background: "var(--bg-primary)",
                border: "0.5px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
              }}>
                <div className="metric-val" style={{
                  fontSize: 26, fontWeight: 500, color: valueColor,
                  marginBottom: 4, letterSpacing: "-0.01em",
                }}>
                  {val}
                </div>
                <div className="metric-label" style={{
                  fontSize: 11, color: "var(--text-tertiary)",
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2,
                }}>
                  {label}
                </div>
                <div className="metric-sub" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ width: "100%", height: 220, marginBottom: "0.75rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={formatY}
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  axisLine={false} tickLine={false} width={42}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="quantin" name="Quantin"
                  stroke="#185FA5" strokeWidth={2.5} dot={false}
                  activeDot={{ r: 4, fill: "#185FA5" }}
                />
                <Line
                  type="monotone" dataKey="sp500" name="S&P 500"
                  stroke="#888780" strokeWidth={1.5} strokeDasharray="5 4"
                  dot={false} activeDot={{ r: 4, fill: "#888780" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart legend */}
          <div className="chart-legend" style={{
            display: "flex", gap: 18, alignItems: "center",
            marginBottom: "2rem", flexWrap: "wrap",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ width: 18, height: 2.5, background: "#185FA5", display: "inline-block", borderRadius: 1 }} />
              Quantin
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ width: 18, height: 0, borderTop: "1.5px dashed #888780", display: "inline-block" }} />
              S&P 500
            </span>
            <span className="chart-legend-note" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
              $10,000 invested Oct 2017 · walk-forward, no lookahead
            </span>
          </div>

          {/* CTA */}
          <div className="cta-row" style={{
            display: "flex", alignItems: "center", gap: 14,
            flexWrap: "wrap", marginBottom: "0.9rem",
          }}>
            <Button size="lg" onClick={() => navigate("/subscribe")}>
              Get the portfolio — $25/mo
            </Button>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              30-day money-back guarantee
            </span>
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Not sure yet?</span>
            <Button variant="link" size="sm" onClick={() => navigate("/preview")}>
              See last period's picks for free →
            </Button>
          </div>

          {/* Footer strip */}
          <div className="footer-strip" style={{
            paddingTop: "1.25rem", borderTop: "0.5px solid var(--border-subtle)",
            display: "flex", gap: "2rem", flexWrap: "wrap",
          }}>
            {[
              ["15 positions", "active today"],
              ["Next rebalance", "in ~6 weeks"],
              ["Email + push", "on every change"],
            ].map(([strong, rest]) => (
              <span key={strong} style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{strong}</span> {rest}
              </span>
            ))}
          </div>

        </main>
      </div>
    </>
  );
}

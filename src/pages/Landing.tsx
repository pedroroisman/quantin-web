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
  { val: "+26.4%", label: "annual return",  sub: "vs +14.5% S&P" },
  { val: "2.11",   label: "sharpe ratio",   sub: "vs 0.80 S&P" },
  { val: "−9.9%",  label: "max drawdown",   sub: "vs −33.7% S&P" },
];

const outfit = "'Outfit', sans-serif";

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
          .hero-headline { font-size: 30px !important; }
          .hero-sub { font-size: 15px !important; }
          .metric-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
          .metric-val { font-size: 20px !important; }
          .metric-label { font-size: 8px !important; letter-spacing: 0.04em !important; }
          .metric-sub { font-size: 9px !important; }
          .cta-row { flex-direction: column !important; align-items: flex-start !important; }
          .footer-strip { gap: 1rem !important; }
          .chart-legend { flex-direction: column !important; gap: 8px !important; }
          .chart-legend-note { margin-left: 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#ffffff" }}>

        {/* Nav */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 1.5rem", height: 56,
          background: "#ffffff", borderBottom: "0.5px solid #eee",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <QuantinLogo iconSize={22} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button variant="ghost" size="sm" onClick={() => navigate("/signin")}
              className="nav-secondary">
              Sign in
            </Button>
            <span className="nav-secondary" style={{ display: "inline-flex" }}>
              <Button variant="ghost" size="sm" onClick={() => navigate("/preview")}>
                Free preview
              </Button>
            </span>
            <Button variant="primary" size="sm" onClick={() => navigate("/subscribe")}>
              Get the portfolio
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

          {/* Logo mark — large display */}
          <div style={{ marginBottom: "2rem" }}>
            <svg width="48" height="39" viewBox="0 0 44 36" fill="none">
              <ellipse cx="22" cy="9"    rx="3"   ry="7"   fill="#0C447C"/>
              <ellipse cx="22" cy="20.5" rx="9.5" ry="3"   fill="#378ADD" fillOpacity="0.7"/>
              <ellipse cx="22" cy="27"   rx="15"  ry="2"   fill="#85B7EB" fillOpacity="0.55"/>
            </svg>
          </div>

          {/* Regime pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#f0f8f4", border: "0.5px solid #c0e0d4",
            borderRadius: 100, padding: "5px 13px", marginBottom: "1.5rem",
          }}>
            <div style={{ width: 7, height: 7, background: "#1D9E75", borderRadius: "50%", flexShrink: 0 }} />
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#0F6E56" }}>
              Live · Bull market, low volatility
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline" style={{
            fontFamily: outfit, fontWeight: 200, fontSize: 42,
            color: "#1e1e1c", marginBottom: "1rem",
            letterSpacing: "-0.025em", lineHeight: 1.1,
          }}>
            Math picks your stocks.<br />You just invest.
          </h1>

          <p className="hero-sub" style={{
            fontFamily: outfit, fontWeight: 300, fontSize: 17,
            color: "#888780", lineHeight: 1.65,
            maxWidth: 480, marginBottom: "2.5rem",
          }}>
            Every two months, Quantin selects the 15 best-performing assets
            using quantitative models. No opinions. Just data.
          </p>

          {/* Metrics */}
          <div className="metric-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "0.5px solid #eee", paddingTop: "1.5rem",
            marginBottom: "2.5rem", gap: 0,
          }}>
            {metrics.map(({ val, label, sub }, i) => (
              <div key={label} style={{ paddingRight: i < 2 ? "1.5rem" : 0 }}>
                <div className="metric-val" style={{
                  fontFamily: outfit, fontWeight: 200, fontSize: 28,
                  color: "#1e1e1c", letterSpacing: "-0.02em", marginBottom: 4,
                }}>
                  {val}
                </div>
                <div className="metric-label" style={{
                  fontSize: 10, color: "#888780",
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2,
                }}>
                  {label}
                </div>
                <div className="metric-sub" style={{ fontSize: 11, color: "#b4b2a9" }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ width: "100%", height: 200, marginBottom: "0.75rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#f0ede8" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: "#888780", fontFamily: outfit }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={formatY}
                  tick={{ fontSize: 10, fill: "#888780", fontFamily: outfit }}
                  axisLine={false} tickLine={false} width={38}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="quantin" name="Quantin"
                  stroke="#0C447C" strokeWidth={2.5} dot={false}
                  activeDot={{ r: 4, fill: "#0C447C" }}
                />
                <Line
                  type="monotone" dataKey="sp500" name="S&P 500"
                  stroke="#b4b2a9" strokeWidth={1.5} strokeDasharray="5 4"
                  dot={false} activeDot={{ r: 4, fill: "#b4b2a9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart legend */}
          <div className="chart-legend" style={{
            display: "flex", gap: 18, alignItems: "center",
            marginBottom: "2.5rem", flexWrap: "wrap",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888780" }}>
              <span style={{ width: 16, height: 2.5, background: "#0C447C", display: "inline-block", borderRadius: 1 }} />
              Quantin
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888780" }}>
              <span style={{ width: 16, height: 0, borderTop: "1.5px dashed #b4b2a9", display: "inline-block" }} />
              S&P 500
            </span>
            <span className="chart-legend-note" style={{ marginLeft: "auto", fontSize: 11, color: "#b4b2a9" }}>
              $10,000 invested Oct 2017 · walk-forward, no lookahead
            </span>
          </div>

          {/* CTA */}
          <div className="cta-row" style={{
            display: "flex", alignItems: "center", gap: 16,
            flexWrap: "wrap", marginBottom: "0.75rem",
          }}>
            <button
              onClick={() => navigate("/subscribe")}
              style={{
                background: "#0C447C", color: "#fff", border: "none",
                borderRadius: 8, padding: "14px 28px",
                fontFamily: outfit, fontWeight: 300, fontSize: 16,
                cursor: "pointer", letterSpacing: 0,
              }}
            >
              Get the portfolio — $25/mo
            </button>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "#b4b2a9" }}>
              30-day money-back guarantee
            </span>
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: "3rem" }}>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "#b4b2a9" }}>
              Not sure yet?
            </span>
            <button
              onClick={() => navigate("/preview")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: outfit, fontWeight: 300, fontSize: 13,
                color: "#185FA5", padding: 0,
              }}
            >
              See last period's picks for free →
            </button>
          </div>

          {/* Footer strip */}
          <div className="footer-strip" style={{
            paddingTop: "1.25rem", borderTop: "0.5px solid #eee",
            display: "flex", gap: "2rem", flexWrap: "wrap",
          }}>
            {[
              ["15 positions", "active today"],
              ["Next rebalance", "in ~6 weeks"],
              ["Email + push", "on every change"],
            ].map(([strong, rest]) => (
              <span key={strong} style={{
                fontFamily: outfit, fontWeight: 300,
                fontSize: 12, color: "#b4b2a9",
              }}>
                <span style={{ color: "#888780" }}>{strong}</span> {rest}
              </span>
            ))}
          </div>

        </main>
      </div>
    </>
  );
}

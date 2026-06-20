import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Badge, Button, MetricCard } from "../components/ui";

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

function formatY(v: number) {
  return "$" + Math.round(v / 1000) + "k";
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-primary)",
      border: "0.5px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: "10px 14px",
      fontSize: 13,
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
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>

      {/* Nav */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: 56,
        background: "var(--bg-primary)",
        borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Quantin
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/preview")}>
            See free preview
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate("/subscribe")}>
            Get the portfolio
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

        <div style={{ marginBottom: "1.5rem" }}>
          <Badge variant="live" dot>Live · Bull market, low volatility</Badge>
        </div>

        <p style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-tertiary)",
          marginBottom: "0.3rem",
        }}>
          Quantitative portfolio
        </p>

        <h1 style={{ fontSize: 36, marginBottom: "0.75rem" }}>
          Math picks your stocks.<br />You just invest.
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.65, maxWidth: 520, marginBottom: "2.5rem" }}>
          Every two months, Quantin selects the 15 best-performing assets using
          quantitative models. No opinions. Just data.
        </p>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "2rem" }}>
          <MetricCard label="Annual return" value="+26.4%" sub="vs +14.5% S&P 500" valueColor="var(--success-text)" />
          <MetricCard label="Sharpe ratio"  value="2.11"   sub="vs 0.80 S&P 500" />
          <MetricCard label="Max drawdown"  value="−9.9%"  sub="vs −33.7% S&P 500" />
        </div>

        {/* Chart */}
        <div style={{ width: "100%", height: 220, marginBottom: "0.75rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatY}
                tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="quantin"
                name="Quantin"
                stroke="#185FA5"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#185FA5" }}
              />
              <Line
                type="monotone"
                dataKey="sp500"
                name="S&P 500"
                stroke="#888780"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, fill: "#888780" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ width: 18, height: 2.5, background: "#185FA5", display: "inline-block", borderRadius: 1 }} />
            Quantin
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ width: 18, height: 0, borderTop: "1.5px dashed #888780", display: "inline-block" }} />
            S&P 500
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
            $10,000 invested Oct 2017 · walk-forward, no lookahead
          </span>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: "0.9rem" }}>
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
        <div style={{
          paddingTop: "1.25rem",
          borderTop: "0.5px solid var(--border-subtle)",
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
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
  );
}

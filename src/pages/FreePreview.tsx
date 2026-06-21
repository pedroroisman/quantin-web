import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

const PREV_PERIOD = "Feb 2026 – Apr 2026";

const picks = [
  { t: "NVDA", n: "NVIDIA",         s: "Technology",  m: +28.4, bh: +22.1 },
  { t: "META", n: "Meta",           s: "Technology",  m: +19.6, bh: +17.2 },
  { t: "GE",   n: "GE Aerospace",   s: "Industrials", m: +17.8, bh: +12.0 },
  { t: "LLY",  n: "Eli Lilly",      s: "Healthcare",  m: +15.2, bh: +11.8 },
  { t: "AMZN", n: "Amazon",         s: "Consumer",    m: +14.9, bh: +13.5 },
  { t: "VST",  n: "Vistra",         s: "Utilities",   m: +13.4, bh: +10.2 },
  { t: "CEG",  n: "Constellation",  s: "Utilities",   m: +12.8, bh: +8.9  },
  { t: "AAPL", n: "Apple",          s: "Technology",  m: +11.6, bh: +10.1 },
  { t: "CRWD", n: "CrowdStrike",    s: "Technology",  m: +11.2, bh: +9.0  },
  { t: "MSFT", n: "Microsoft",      s: "Technology",  m:  +9.8, bh: +9.3  },
  { t: "JPM",  n: "JPMorgan",       s: "Financials",  m:  +9.1, bh: +7.6  },
  { t: "ANET", n: "Arista",         s: "Technology",  m:  +8.4, bh: +5.9  },
  { t: "PGR",  n: "Progressive",    s: "Financials",  m:  +6.7, bh: +5.1  },
  { t: "TSLA", n: "Tesla",          s: "Consumer",    m:  +5.2, bh: +8.4  },
  { t: "COIN", n: "Coinbase",       s: "Financials",  m:  +3.1, bh: +11.2 },
];

const periods = ["Oct '25", "Dec '25", "Feb '26", "Apr '26", "Jun '26 ★"];

const selected: Record<string, string[]> = {
  "Oct '25":  ["NVDA","META","GE","LLY","AMZN","VST","CEG","AAPL","CRWD","MSFT","PGR","ANET","TSLA","COIN","JPM"],
  "Dec '25":  ["NVDA","META","GE","LLY","AMZN","VST","CEG","AAPL","CRWD","MSFT","JPM","ANET","COIN","TSLA","NRG"],
  "Feb '26":  ["NVDA","META","GE","LLY","AMZN","VST","CEG","AAPL","CRWD","MSFT","JPM","ANET","PGR","TSLA","COIN"],
  "Apr '26":  ["NVDA","META","GE","LLY","AMZN","VST","CEG","AAPL","CRWD","MSFT","JPM","ANET","PGR","TSLA","COIN"],
};

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
          <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>
            Previous period · {PREV_PERIOD}
          </span>
          <span style={{ marginLeft: "auto", fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
            Current picks are for subscribers
          </span>
        </div>

        <h1 style={{
          fontFamily: playfair, fontWeight: 400, fontSize: 28,
          color: "var(--text-primary)", marginBottom: "0.4rem", lineHeight: 1.2,
        }}>
          Last period's 15 picks
        </h1>
        <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 14, lineHeight: 1.65, maxWidth: 520, color: "var(--text-secondary)", marginBottom: "2rem" }}>
          These are the stocks the model selected two periods ago. The current portfolio has
          already been updated — subscribers received an alert when it changed.
        </p>

        {/* Period metrics */}
        <p style={sectionLabel}>Portfolio performance · {PREV_PERIOD}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "2.5rem" }}>
          {[
            { label: "Portfolio return",    val: "+14.2%", green: true },
            { label: "S&P 500 same period", val: "+6.1%",  green: false },
            { label: "Alpha vs S&P 500",    val: "+8.1pp", green: true },
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

        {/* Picks table */}
        <p style={sectionLabel}>Individual picks · model return vs buy & hold</p>
        <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th style={{ ...th, padding: "10px 8px 10px 1.25rem", width: "38%" }}>Stock</th>
                <th style={thR}>Model</th>
                <th style={thR}>Buy & hold</th>
                <th style={{ ...thR, paddingRight: "1.25rem" }}>Alpha</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((p, i) => {
                const alpha = p.m - p.bh;
                const pos = (v: number) => v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`;
                return (
                  <tr key={p.t} style={{ background: i % 2 === 0 ? "var(--bg-primary)" : "transparent" }}>
                    <td style={{ ...td, padding: "10px 8px 10px 1.25rem" }}>
                      <span style={{ fontWeight: 500 }}>{p.t}</span>
                      <span style={{
                        fontSize: 10, color: "var(--text-tertiary)",
                        background: "var(--bg-secondary)", borderRadius: 3,
                        padding: "1px 5px", marginLeft: 6,
                      }}>{p.s}</span>
                      <br />
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.n}</span>
                    </td>
                    <td style={{ ...tdR, color: p.m >= 0 ? "#0F6E56" : "var(--danger-text)" }}>
                      {pos(p.m)}
                    </td>
                    <td style={{ ...tdR, color: "var(--text-secondary)" }}>
                      {pos(p.bh)}
                    </td>
                    <td style={{ ...tdR, paddingRight: "1.25rem" }}>
                      <span style={{
                        fontSize: 11, borderRadius: 4, padding: "2px 6px",
                        background: alpha >= 0 ? "#f0f8f4" : "var(--danger-bg)",
                        color: alpha >= 0 ? "#0F6E56" : "var(--danger-text)",
                      }}>
                        {alpha >= 0 ? "+" : ""}{alpha.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Period evolution grid */}
        <p style={sectionLabel}>How selection evolved · last 5 periods</p>
        <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "1rem" }}>
          Each column is one 2-month period. Blue = model held this position.
        </p>
        <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1.25rem", overflowX: "auto", marginBottom: "2.5rem" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 60 }}>Ticker</th>
                {periods.map(p => (
                  <th key={p} style={{ ...th, textAlign: "center", paddingRight: 0, minWidth: 60,
                    color: p.includes("★") ? "#185FA5" : "var(--text-tertiary)" }}>
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {picks.map(({ t }) => (
                <tr key={t}>
                  <td style={{ ...td, fontWeight: 500, color: "var(--text-secondary)", fontSize: 12 }}>{t}</td>
                  {periods.map(p => {
                    const isCurrent = p.includes("★");
                    const isSelected = !isCurrent && selected[p]?.includes(t);
                    return (
                      <td key={p} style={{ ...td, textAlign: "center", paddingRight: 0 }}>
                        <span style={{
                          display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                          background: isCurrent
                            ? "var(--border-default)"
                            : isSelected ? "#185FA5" : "var(--border-subtle)",
                          opacity: isCurrent ? 0.4 : 1,
                        }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td colSpan={6} style={{ paddingTop: 12, fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", borderBottom: "none" }}>
                  ★ Current period — available to subscribers only
                </td>
              </tr>
            </tbody>
          </table>
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
              Updated 6 weeks ago · next change in ~6 weeks · alerts included
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Button size="md" onClick={() => navigate("/subscribe")}>
              Get the portfolio — $25/mo
            </Button>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
              30-day money-back guarantee
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}

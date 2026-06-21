import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, QuantinLogo } from "../components/ui";

const positions = [
  { t: "NVDA", n: "NVIDIA",        s: "Technology",  ret: +28.4, sig: 92, isNew: false },
  { t: "META", n: "Meta",          s: "Technology",  ret: +19.6, sig: 87, isNew: false },
  { t: "GE",   n: "GE Aerospace",  s: "Industrials", ret: +14.2, sig: 84, isNew: false },
  { t: "LLY",  n: "Eli Lilly",     s: "Healthcare",  ret: +12.8, sig: 81, isNew: true  },
  { t: "AMZN", n: "Amazon",        s: "Consumer",    ret: +11.9, sig: 79, isNew: false },
  { t: "VST",  n: "Vistra",        s: "Utilities",   ret: +10.4, sig: 76, isNew: false },
  { t: "CEG",  n: "Constellation", s: "Utilities",   ret:  +9.8, sig: 74, isNew: false },
  { t: "AAPL", n: "Apple",         s: "Technology",  ret:  +8.6, sig: 71, isNew: false },
  { t: "CRWD", n: "CrowdStrike",   s: "Technology",  ret:  +7.9, sig: 68, isNew: false },
  { t: "MSFT", n: "Microsoft",     s: "Technology",  ret:  +7.1, sig: 64, isNew: false },
  { t: "JPM",  n: "JPMorgan",      s: "Financials",  ret:  +6.4, sig: 61, isNew: true  },
  { t: "ANET", n: "Arista",        s: "Technology",  ret:  +5.8, sig: 58, isNew: false },
  { t: "PGR",  n: "Progressive",   s: "Financials",  ret:  +5.2, sig: 54, isNew: false },
  { t: "NRG",  n: "NRG Energy",    s: "Utilities",   ret:  +3.8, sig: 50, isNew: true  },
  { t: "DECK", n: "Deckers",       s: "Consumer",    ret:  +2.1, sig: 45, isNew: false },
];

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

const metrics = [
  { val: "+575%",  label: "since inception" },
  { val: "×2.0",   label: "vs S&P 500" },
  { val: "+18.4%", label: "this period" },
  { val: "−9.9%",  label: "max drawdown" },
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

export function Dashboard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(defaultAlerts);
  const toggle = (k: AlertKey) => setAlerts(a => ({ ...a, [k]: !a[k] }));

  const [showWelcome] = useState(() => {
    return new URLSearchParams(window.location.search).has("session_id");
  });
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcome);

  const dismissWelcome = () => {
    setWelcomeVisible(false);
    window.history.replaceState({}, "", "/portfolio");
  };

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
              border: "1px solid #d4e8f5",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "2rem",
            }}>
              <div style={{ width: 14, height: 14, background: "#0C447C", borderRadius: "50%" }} />
            </div>

            <p style={{
              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#888780", marginBottom: "0.9rem",
              fontFamily: outfit, fontWeight: 300,
            }}>
              Payment confirmed
            </p>

            <h1 style={{
              fontFamily: outfit, fontWeight: 200, fontSize: 44,
              color: "#1e1e1c", marginBottom: "0.5rem",
              letterSpacing: "-0.025em", lineHeight: 1.1,
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
          <div style={{
            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
            background: "var(--bg-secondary)", border: "0.5px solid var(--border-default)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 500, color: "var(--text-secondary)",
          }}>
            P
          </div>
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
              fontFamily: outfit, fontWeight: 200, fontSize: 36,
              color: "#1e1e1c", margin: 0, letterSpacing: "-0.025em",
            }}>
              Active positions
            </h1>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
              Next rebalance Aug 2026
            </span>
          </div>

          {/* Metrics */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "0.5px solid var(--border-subtle)", paddingTop: "1.5rem", gap: 0,
          }}>
            {metrics.map(({ val, label }, i) => (
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
        </div>

        {/* Positions table */}
        <div style={{
          background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2rem",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th style={{ ...thL, padding: "10px 8px 10px 1.25rem", width: "34%" }}>Stock</th>
                <th style={th}>Weight</th>
                <th style={th}>Signal</th>
                <th style={th}>Since entry</th>
                <th style={{ ...th, paddingRight: "1.25rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={p.t} style={{ background: i % 2 === 0 ? "var(--bg-primary)" : "transparent" }}>
                  <td style={{ ...tdL, padding: "11px 8px 11px 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 500 }}>{p.t}</span>
                      {p.isNew && (
                        <span style={{
                          fontSize: 10, fontWeight: 500, borderRadius: 3, padding: "1px 5px",
                          background: "var(--info-bg)", color: "var(--info-text)",
                        }}>NEW</span>
                      )}
                      <span style={{
                        fontSize: 10, color: "var(--text-tertiary)",
                        background: "var(--bg-secondary)", borderRadius: 3, padding: "1px 5px",
                      }}>{p.s}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{p.n}</div>
                  </td>
                  <td style={{ ...td, color: "var(--text-secondary)" }}>6.7%</td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.sig}</span>
                      <div style={{ width: Math.round(p.sig * 0.4), height: 4, borderRadius: 2, background: "#185FA5" }} />
                    </div>
                  </td>
                  <td style={{ ...td, color: p.ret >= 0 ? "var(--success-text)" : "var(--danger-text)" }}>
                    {p.ret >= 0 ? "+" : ""}{p.ret.toFixed(1)}%
                  </td>
                  <td style={{ ...td, paddingRight: "1.25rem" }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--success-text)" }}>● Hold</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg-secondary)", fontSize: 12, color: "var(--text-tertiary)", display: "flex", justifyContent: "space-between" }}>
            <span>15 positions · equal weight 6.7% each</span>
            <span>Last updated Jun 12, 2026</span>
          </div>
        </div>

        {/* Alert settings */}
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
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

import { useState, useEffect, useRef } from "react";
import { useRegime } from "../hooks/useRegime";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";

const chartData = [
  { period: "Feb '18", quantin: 10000, sp500: 10000  },
  { period: "2019",    quantin: 12976, sp500: 12238  },
  { period: "2020",    quantin: 22484, sp500: 14486  },
  { period: "2021",    quantin: 27192, sp500: 18650  },
  { period: "2022",    quantin: 26743, sp500: 15261  },
  { period: "2023",    quantin: 30520, sp500: 19258  },
  { period: "2024",    quantin: 36951, sp500: 24050  },
  { period: "2025",    quantin: 46003, sp500: 28310  },
  { period: "Jun '26", quantin: 58003, sp500: 30714  },
];

const metrics = [
  {
    val: "+23.6%", label: "Annual return", sub: "vs +14.5% S&P 500",
    valueColor: "#1D9E75",
    tooltip: "Average yearly return compounded over the full backtest period (Feb 2018 – Jun 2026).",
  },
  {
    val: "−8.4%", label: "Max drawdown", sub: "vs −33.7% S&P 500",
    valueColor: "#B5621A",
    tooltip: "Largest peak-to-trough decline in portfolio value. Lower is better — the S&P 500 fell −33.7% in 2020 alone.",
  },
  {
    val: "1.95", label: "Sharpe ratio", sub: "vs 0.80 S&P 500",
    valueColor: "#185FA5",
    tooltip: "Return earned per unit of risk taken. Above 1 is considered strong; above 2 is exceptional.",
  },
];

function MetricCard({ val, label, sub, valueColor, tooltip }: typeof metrics[0]) {
  const [show, setShow] = useState(false);
  return (
    <div style={{
      background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)", padding: "14px 16px", position: "relative",
    }}>
      <div className="metric-val" style={{
        fontSize: 26, fontWeight: 500, color: valueColor,
        marginBottom: 4, letterSpacing: "-0.01em",
      }}>
        {val}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
        <div className="metric-label" style={{
          fontSize: 11, color: "var(--text-tertiary)",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          {label}
        </div>
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          style={{ position: "relative", lineHeight: 0, cursor: "default" }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35, display: "block" }}>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
            <text x="8" y="12" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="sans-serif">i</text>
          </svg>
          {show && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
              transform: "translateX(-50%)",
              background: "var(--bg-primary)", border: "0.5px solid var(--border-default)",
              borderRadius: 8, padding: "8px 11px", width: 190,
              fontSize: 11, lineHeight: 1.55, color: "var(--text-secondary)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              pointerEvents: "none", zIndex: 20,
            }}>
              {tooltip}
              <div style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
                borderTop: "5px solid var(--border-default)",
              }} />
            </div>
          )}
        </div>
      </div>
      <div className="metric-sub" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
        {sub}
      </div>
    </div>
  );
}

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

const TICKER_SCREENS: { header: string; lines: string[]; ml?: boolean; done?: boolean }[] = [
  {
    header: "— 1. parameters —",
    lines: ["Universe.....  798 stocks & ETFs", "Strategies...  150 combinations", "Lookback.....  3 to 12 months", "Portfolio....  15 stocks", "Rebalance....  every 2 months"],
  },
  {
    header: "— 2. backtesting —",
    lines: ["Testing 150 strategies...", "Using 8 years of market data..."],
  },
  {
    header: "— 3. market reading —",
    lines: ["Detecting market conditions..."],
    ml: true,
  },
  {
    header: "— 4. strategy selection —",
    lines: ["Matching strategy to conditions..."],
    ml: true,
  },
  {
    header: "— 5. portfolio —",
    lines: ["Walk-forward validation...", "Scoring all 798 stocks...", "Selecting top 15..."],
  },
  {
    header: "Portfolio ready  ●",
    lines: [],
    done: true,
  },
];

function TickerTape() {
  const tapeRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tape: HTMLDivElement = tapeRef.current!;
    const dot: HTMLSpanElement = dotRef.current!;
    if (!tape || !dot) return;

    let si = 0, li = 0, ci = 0;
    let lineEl: HTMLDivElement | null = null;
    let cursorEl: HTMLSpanElement | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function clearScreen(next: () => void) {
      tape.style.opacity = "0";
      tape.style.transition = "opacity 0.25s";
      timer = setTimeout(() => {
        tape.innerHTML = "";
        tape.style.transition = "";
        tape.style.opacity = "1";
        next();
      }, 280);
    }

    function nextScreen() {
      si = (si + 1) % TICKER_SCREENS.length;
      li = 0; ci = 0; lineEl = null; cursorEl = null;
      if (dot) dot.style.background = si === TICKER_SCREENS.length - 1 ? "#185FA5" : "#2D6A3F";
      clearScreen(tick);
    }

    function makeLineEl(_text: string, isHeader: boolean, isDone: boolean) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        fontFamily: "monospace",
        fontSize: "11px",
        lineHeight: "1.8",
        textTransform: "uppercase",
        letterSpacing: isHeader ? "0.1em" : "0.04em",
        whiteSpace: "pre",
        minHeight: "1.4em",
        color: isDone ? "#1D5C3A" : isHeader ? "#0A0A0A" : "#1A1209",
        fontWeight: isHeader || isDone ? "500" : "400",
      });
      return el;
    }

    function makeCursor() {
      const el = document.createElement("span");
      Object.assign(el.style, {
        display: "inline-block", width: "6px", height: "10px",
        background: "#1A1209", verticalAlign: "-2px", marginLeft: "1px",
        animation: "qtblink 0.7s step-end infinite",
      });
      return el;
    }

    function tick() {
      const screen = TICKER_SCREENS[si];
      const allLines = [screen.header, ...screen.lines];
      const isHeader = li === 0;
      const isDone = !!screen.done;
      const text = allLines[li] ?? "";

      if (ci === 0) {
        if (cursorEl) cursorEl.remove();
        lineEl = makeLineEl(text, isHeader, isDone);
        cursorEl = makeCursor();
        lineEl.appendChild(cursorEl);
        tape.appendChild(lineEl);
        if (isHeader && li === 0) {
          const spacer = document.createElement("div");
          spacer.style.height = "6px";
          tape.insertBefore(spacer, lineEl);
        }
      }

      if (ci < text.length) {
        lineEl!.insertBefore(document.createTextNode(text[ci]), cursorEl!);
        ci++;
        timer = setTimeout(tick, text[ci - 1] === "." ? 60 : 22);
      } else {
        if (screen.ml && isHeader) {
          const b = document.createElement("span");
          Object.assign(b.style, {
            display: "inline-block", background: "#1C2F4A", color: "#85B7EB",
            fontSize: "8px", letterSpacing: "0.1em",
            padding: "1px 5px", borderRadius: "3px",
            verticalAlign: "2px", marginLeft: "4px",
          });
          b.textContent = "ML";
          lineEl!.insertBefore(b, cursorEl!);
        }
        li++; ci = 0;
        if (li < allLines.length) {
          timer = setTimeout(tick, isHeader ? 120 : 180);
        } else {
          if (cursorEl) cursorEl.remove();
          const holdMs = screen.done ? 3000 : 2200;
          timer = setTimeout(nextScreen, holdMs);
        }
      }
    }

    dot.style.background = "#2D6A3F";
    tick();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "var(--text-tertiary)", marginBottom: "0.5rem",
      }}>
        how the model works
      </div>
      <div style={{ background: "#1A1A1A", borderRadius: "10px 10px 6px 6px", padding: "10px 0 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 8px" }}>
          <span style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase" }}>
            Quantin · Model v3
          </span>
          <span ref={dotRef} style={{ width: 5, height: 5, borderRadius: "50%", background: "#2D6A3F", display: "inline-block" }} />
        </div>
        <div style={{ height: 2, background: "#0A0A0A", margin: "0 6px", borderRadius: 1 }} />
        <div
          ref={tapeRef}
          style={{ background: "#FFF8EE", margin: "4px 0 0 0", height: 148, padding: "10px 16px 12px", overflow: "hidden" }}
        />
        <div style={{ background: "#141414", borderRadius: "0 0 6px 6px", height: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#2a2a2a" }} />)}
        </div>
      </div>
    </div>
  );
}

type AuthState = "loading" | "none" | "subscribed" | "unsubscribed";

export function Landing() {
  const navigate = useNavigate();
  const { label: regimeLabel, colors: regimeColors } = useRegime();
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) { setAuthState("none"); return; }
      const { data } = await supabase
        .from("subscribers")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();
      setAuthState(data ? "subscribed" : "unsubscribed");
    });
  }, []);

  return (
    <>
      <style>{`
        @keyframes qtblink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (min-width: 900px) {
          .hero-headline { font-size: 48px !important; }
          .hero-chart   { height: 280px !important; }
        }
        @media (max-width: 640px) {
          .hero-row { flex-direction: column !important; }
          .hero-ticker { width: 100% !important; }
        }
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
            {authState === "subscribed" ? (
              <Button variant="primary" size="sm" onClick={() => navigate("/portfolio")}>View Portfolio</Button>
            ) : authState === "unsubscribed" ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/signin")}>Sign in</Button>
                <Button variant="primary" size="sm" onClick={() => navigate("/subscribe")}>Subscribe</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/signin?mode=signup")}>Sign in</Button>
                <span className="nav-secondary" style={{ display: "inline-flex" }}>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/preview")}>See free preview</Button>
                </span>
                <Button variant="primary" size="sm" onClick={() => navigate("/subscribe")}>Get the portfolio</Button>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <main style={{ maxWidth: 1440, margin: "0 auto", padding: "4rem max(2rem, 6%) 6rem" }}>

          {/* Logo mark — centered */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <svg width="52" height="43" viewBox="0 0 44 36" fill="none" style={{ display: "block", margin: "0 auto" }}>
              <ellipse cx="22" cy="9"    rx="3"   ry="7"   fill="#0C447C"/>
              <ellipse cx="22" cy="20.5" rx="9.5" ry="3"   fill="#378ADD" fillOpacity="0.7"/>
              <ellipse cx="22" cy="27"   rx="15"  ry="2"   fill="#85B7EB" fillOpacity="0.55"/>
            </svg>
          </div>

          {/* Regime pill */}
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(29,158,117,0.08)", border: "0.5px solid rgba(29,158,117,0.3)",
              borderRadius: 100, padding: "4px 12px",
            }}>
              <span style={{ width: 6, height: 6, background: regimeColors.dot, borderRadius: "50%", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: regimeColors.text, letterSpacing: "0.01em" }}>
                Live · {regimeLabel ?? "Loading…"}
              </span>
            </span>
          </div>

          {/* Hero: headline left, ticker right */}
          <div className="hero-row" style={{ display: "flex", gap: "2rem", alignItems: "flex-start", marginBottom: "2.5rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em",
                color: "var(--text-tertiary)", marginBottom: "0.3rem",
              }}>
                Quantitative portfolio
              </p>

              <h1 className="hero-headline" style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 400,
                fontSize: 36, marginBottom: "0.75rem",
                color: "var(--text-primary)", lineHeight: 1.2,
              }}>
                Math picks your stocks.<br />You just invest.
              </h1>

              <p style={{
                fontSize: 16, lineHeight: 1.65,
                color: "var(--text-secondary)", marginBottom: 0,
              }}>
                Every two months, Quantin selects the 15 best-performing assets using
                quantitative models. No opinions. Just data.
              </p>
            </div>

            <div className="hero-ticker" style={{ flexShrink: 0, width: 300 }}>
              <TickerTape />
            </div>
          </div>

          {/* Metrics */}
          <div className="metric-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10, marginBottom: "2rem",
          }}>
            {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
          </div>

          {/* Chart */}
          <div className="hero-chart" style={{ width: "100%", height: 220, marginBottom: "0.75rem" }}>
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
              Receive email alerts on new picks, exits, and cash signals
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

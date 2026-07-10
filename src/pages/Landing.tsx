import { useState, useEffect, useRef, useMemo } from "react";
import { useRegime } from "../hooks/useRegime";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";

// Fallback — shown while API loads
const FALLBACK_CHART_DATA = [
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

const ALL_TIME_METRICS = [
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

interface SeriesPoint { date: string; model: number; spy: number; }
interface MetricData  { val: string; label: string; sub: string; valueColor: string; tooltip: string; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEAR_TOGGLE = ["all", 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, "custom"] as const;
type YearSelection = typeof YEAR_TOGGLE[number];

function fmtMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

function filterPts(series: SeriesPoint[], year: YearSelection, cStart: string, cEnd: string) {
  if (year === "all") {
    const byYear: Record<number, SeriesPoint[]> = {};
    for (const p of series) (byYear[new Date(p.date).getFullYear()] ??= []).push(p);
    const result = [series[0]];
    for (const y of Object.keys(byYear).map(Number).sort()) {
      const last = byYear[y][byYear[y].length - 1];
      if (last.date !== series[0].date) result.push(last);
    }
    return result;
  }
  if (year === "custom") {
    return series.filter(p => p.date.slice(0, 7) >= cStart && p.date.slice(0, 7) <= cEnd);
  }
  return series.filter(p => new Date(p.date).getFullYear() === year);
}

function buildChartData(series: SeriesPoint[], year: YearSelection, cStart: string, cEnd: string) {
  const pts = filterPts(series, year, cStart, cEnd);
  if (!pts.length) return null;
  const bm = pts[0].model, bs = pts[0].spy;
  const multiYear = pts.some(p => new Date(p.date).getFullYear() !== new Date(pts[0].date).getFullYear());
  return pts.map(p => {
    const d = new Date(p.date);
    let period: string;
    if (year === "all") {
      period = d.getFullYear() === 2018 && d.getMonth() === 1 ? "Feb '18" : String(d.getFullYear());
    } else if (multiYear) {
      period = `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
    } else {
      period = MONTHS[d.getMonth()];
    }
    return { period, quantin: Math.round(p.model / bm * 10000), sp500: Math.round(p.spy / bs * 10000) };
  });
}

function buildRangeMetrics(series: SeriesPoint[], year: YearSelection, cStart: string, cEnd: string): MetricData[] {
  const pts = filterPts(series, year, cStart, cEnd);
  if (pts.length < 2) return ALL_TIME_METRICS;
  const first = pts[0], last = pts[pts.length - 1];
  const modelRet = (last.model / first.model - 1) * 100;
  const spyRet   = (last.spy   / first.spy   - 1) * 100;
  const alpha     = modelRet - spyRet;
  let peak = first.model, maxDD = 0;
  for (const p of pts) {
    if (p.model > peak) peak = p.model;
    const dd = (p.model - peak) / peak * 100;
    if (dd < maxDD) maxDD = dd;
  }
  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const isYearPartial = typeof year === "number" && (year === 2018 || year === new Date().getFullYear());
  const retLabel = year === "custom" ? "Period return" : isYearPartial ? "YTD return" : "Year return";
  const ddSub    = year === "custom" ? "within the period" : "within the year";
  const tip = typeof year === "number"
    ? `Quantin returned ${fmt(modelRet)} in ${year}, vs ${fmt(spyRet)} for the S&P 500.`
    : `Quantin returned ${fmt(modelRet)} from ${fmtMonth(cStart)} to ${fmtMonth(cEnd)}, vs ${fmt(spyRet)} for the S&P 500.`;
  return [
    {
      val: fmt(modelRet), label: retLabel,
      sub: `vs ${fmt(spyRet)} S&P 500`,
      valueColor: modelRet >= 0 ? "#1D9E75" : "#B5621A",
      tooltip: tip,
    },
    {
      val: `${alpha >= 0 ? "+" : ""}${alpha.toFixed(1)}pp`,
      label: "vs S&P 500", sub: "outperformance",
      valueColor: alpha >= 0 ? "#185FA5" : "#B5621A",
      tooltip: `Quantin ${alpha >= 0 ? "outperformed" : "underperformed"} the S&P 500 by ${Math.abs(alpha).toFixed(1)} percentage points.`,
    },
    {
      val: maxDD === 0 ? "0.0%" : `${maxDD.toFixed(1)}%`,
      label: "Max drawdown", sub: ddSub,
      valueColor: "#B5621A",
      tooltip: `Largest peak-to-trough decline within the selected period. Walk-forward validated.`,
    },
  ];
}

function MetricCard({ val, label, sub, valueColor, tooltip }: MetricData) {
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
  return v >= 10000
    ? "$" + Math.round(v / 1000) + "k"
    : "$" + (v / 1000).toFixed(1) + "k";
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

const TICKER_LINES: { text: string; sec?: boolean; ml?: boolean; done?: boolean }[] = [
  { text: "— parameters —", sec: true },
  { text: "" },
  { text: "Universe......  798 assets" },
  { text: "Lookback......  3·6·9·12 months" },
  { text: "Portfolio.....  15 positions" },
  { text: "Weighting.....  equal" },
  { text: "Rebalance.....  bi-monthly" },
  { text: "" },
  { text: "— strategy test —", sec: true },
  { text: "" },
  { text: "150 strategies backtested" },
  { text: "8yr market data analyzed" },
  { text: "Bias controls applied" },
  { text: "" },
  { text: "— regime detection —", sec: true, ml: true },
  { text: "" },
  { text: "Market conditions scanned" },
  { text: "Regime classified" },
  { text: "" },
  { text: "— strategy match —", sec: true, ml: true },
  { text: "" },
  { text: "Best-fit strategy selected" },
  { text: "Risk profile confirmed" },
  { text: "" },
  { text: "— portfolio build —", sec: true },
  { text: "" },
  { text: "50 walk-fwd. periods validated" },
  { text: "798 assets momentum-ranked" },
  { text: "Top 15 positions confirmed" },
  { text: "" },
  { text: "Portfolio ready  ●", done: true },
];

function TickerTape() {
  const tapeRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tape: HTMLDivElement = tapeRef.current!;
    const dot: HTMLSpanElement = dotRef.current!;
    if (!tape || !dot) return;

    let li = 0, ci = 0;
    let lineEl: HTMLDivElement | null = null;
    let cursorEl: HTMLSpanElement | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function tick() {
      if (li >= TICKER_LINES.length) {
        if (cursorEl) cursorEl.remove();
        dot.style.background = "#185FA5";
        return;
      }
      const { text = "", sec, ml, done } = TICKER_LINES[li];
      if (ci === 0) {
        if (cursorEl) cursorEl.remove();
        lineEl = document.createElement("div");
        Object.assign(lineEl.style, {
          fontFamily: "monospace", fontSize: "11px", lineHeight: "1.8",
          textTransform: "uppercase", whiteSpace: "pre", minHeight: "1.5em",
          letterSpacing: sec ? "0.1em" : "0.04em",
          color: done ? "#1D5C3A" : sec ? "#0A0A0A" : "#1A1209",
          fontWeight: sec || done ? "500" : "400",
        });
        cursorEl = document.createElement("span");
        Object.assign(cursorEl.style, {
          display: "inline-block", width: "6px", height: "10px",
          background: "#1A1209", verticalAlign: "-2px", marginLeft: "1px",
          animation: "qtblink 0.7s step-end infinite",
        });
        lineEl.appendChild(cursorEl);
        tape.appendChild(lineEl);
      }
      if (ci < text.length) {
        lineEl!.insertBefore(document.createTextNode(text[ci]), cursorEl!);
        ci++;
        timer = setTimeout(tick, text[ci - 1] === "." ? 65 : 20);
      } else {
        if (ml) {
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
        ci = 0; li++;
        timer = setTimeout(tick, text === "" ? 20 : li <= 8 ? 55 : 160);
      }
    }

    dot.style.background = "#2D6A3F";
    tick();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  return (
    <div>
      <div style={{
        fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
        color: "var(--text-tertiary)", marginBottom: "0.5rem",
      }}>
        how the model works
      </div>
      <div style={{ background: "#1A1A1A", borderRadius: "8px 8px 0 0", padding: "9px 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase" }}>
            Quantin · Model v3
          </span>
          <span ref={dotRef} style={{ width: 5, height: 5, borderRadius: "50%", background: "#2D6A3F", display: "inline-block" }} />
        </div>
      </div>
      <div style={{ height: 2, background: "#0A0A0A" }} />
      <div ref={tapeRef} style={{ background: "#FFF8EE", padding: "10px 16px 4px" }} />
      <div style={{ background: "#141414", borderRadius: "0 0 6px 6px", height: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#2a2a2a" }} />)}
      </div>
    </div>
  );
}

type AuthState = "loading" | "none" | "subscribed" | "unsubscribed";

export function Landing() {
  const navigate = useNavigate();
  const { label: regimeLabel, colors: regimeColors } = useRegime();
  const [authState, setAuthState]   = useState<AuthState>("loading");
  const [chartSeries, setChartSeries] = useState<SeriesPoint[]>([]);
  const [selectedYear, setSelectedYear] = useState<YearSelection>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd,   setCustomEnd]   = useState<string>("");

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

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/portfolio_optimizer/chart`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.series)) setChartSeries(d.series); })
      .catch(() => {});
  }, []);

  const availableMonths = useMemo(() => chartSeries.map(p => p.date.slice(0, 7)), [chartSeries]);

  const handleSelectYear = (y: YearSelection) => {
    if (y === "custom" && chartSeries.length) {
      const months = chartSeries.map(p => p.date.slice(0, 7));
      setCustomEnd(months[months.length - 1]);
      setCustomStart(months[Math.max(0, months.length - 25)]);
    }
    setSelectedYear(y);
    track("chart_period_selected", { period: String(y) });
  };

  const effectiveStart = customStart || availableMonths[0] || "";
  const effectiveEnd   = customEnd   || availableMonths[availableMonths.length - 1] || "";

  const activeChartData = useMemo(() => {
    if (!chartSeries.length) return selectedYear === "all" ? FALLBACK_CHART_DATA : null;
    return buildChartData(chartSeries, selectedYear, effectiveStart, effectiveEnd) ?? FALLBACK_CHART_DATA;
  }, [chartSeries, selectedYear, effectiveStart, effectiveEnd]);

  const activeMetrics = useMemo<MetricData[]>(() => {
    if (selectedYear === "all" || !chartSeries.length) return ALL_TIME_METRICS;
    return buildRangeMetrics(chartSeries, selectedYear, effectiveStart, effectiveEnd);
  }, [chartSeries, selectedYear, effectiveStart, effectiveEnd]);

  const legendNote = useMemo(() => {
    if (selectedYear === "all") return "$10,000 invested Feb 2018 · walk-forward, no lookahead";
    if (selectedYear === "custom") {
      return effectiveStart && effectiveEnd
        ? `$10,000 invested ${fmtMonth(effectiveStart)} · custom range · walk-forward`
        : "$10,000 invested · custom range · walk-forward";
    }
    const isPartial = selectedYear === 2018 || selectedYear === new Date().getFullYear();
    const start = selectedYear === 2018 ? "Feb 2018" : `Jan ${selectedYear}`;
    return `$10,000 invested ${start} · ${isPartial ? "partial year" : "calendar year"} · walk-forward`;
  }, [selectedYear, effectiveStart, effectiveEnd]);

  return (
    <>
      <style>{`
        @keyframes qtblink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (min-width: 900px) {
          .hero-headline { font-size: 48px !important; }
          .hero-chart    { height: 280px !important; }
        }
        @media (max-width: 860px) {
          .hero-cols   { flex-direction: column !important; align-items: stretch !important; }
          .hero-ticker { display: none !important; }
        }
        @media (max-width: 600px) {
          .nav-secondary { display: none !important; }
          .hero-nav  { padding: 0 1.25rem !important; }
          .hero-main { padding: 2.5rem 1.25rem 4rem !important; }
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
        <nav className="hero-nav" style={{
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
                <Button variant="primary" size="sm" onClick={() => { track("click_subscribe", { source: "nav" }); navigate("/subscribe"); }}>Subscribe</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/signin?mode=signup")}>Sign in</Button>
                <span className="nav-secondary" style={{ display: "inline-flex" }}>
                  <Button variant="ghost" size="sm" onClick={() => { track("click_free_preview", { source: "nav" }); navigate("/preview"); }}>See free preview</Button>
                </span>
                <Button variant="primary" size="sm" onClick={() => { track("click_subscribe", { source: "nav" }); navigate("/subscribe"); }}>Get the portfolio</Button>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <main className="hero-main" style={{ maxWidth: 1440, margin: "0 auto", padding: "4rem max(2rem, 6%) 6rem" }}>

          {/* Logo mark — centered */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <svg width="52" height="43" viewBox="0 0 44 36" fill="none" style={{ display: "block", margin: "0 auto" }}>
              <ellipse cx="22" cy="9"    rx="3"   ry="7"   fill="#0C447C"/>
              <ellipse cx="22" cy="20.5" rx="9.5" ry="3"   fill="#378ADD" fillOpacity="0.7"/>
              <ellipse cx="22" cy="27"   rx="15"  ry="2"   fill="#85B7EB" fillOpacity="0.55"/>
            </svg>
          </div>

          {/* Two-column: content left, ticker right */}
          <div className="hero-cols" style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}>

            {/* Left: all content */}
            <div style={{ flex: 1, minWidth: 0 }}>

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
                {activeMetrics.map((m) => <MetricCard key={m.label} {...m} />)}
              </div>

              {/* Year toggle */}
              <div style={{ display: "flex", gap: 4, marginBottom: "0.5rem", overflowX: "auto", paddingBottom: 2 }}>
                {YEAR_TOGGLE.map(y => {
                  const active = selectedYear === y;
                  return (
                    <button
                      key={y}
                      onClick={() => handleSelectYear(y)}
                      style={{
                        padding: "3px 10px", fontSize: 11, flexShrink: 0,
                        border: active ? "0.5px solid var(--text-secondary)" : "0.5px solid var(--border-subtle)",
                        borderRadius: 100, cursor: "pointer", fontFamily: "inherit",
                        background: active ? "var(--bg-primary)" : "transparent",
                        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                        fontWeight: active ? 500 : 400, transition: "all 0.15s",
                      }}
                    >
                      {y === "all" ? "All" : y === "custom" ? "Custom" : y}
                    </button>
                  );
                })}
              </div>

              {/* Custom range pickers */}
              {selectedYear === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>From</span>
                  <select
                    value={customStart}
                    onChange={e => { setCustomStart(e.target.value); track("chart_custom_range", { start: e.target.value, end: customEnd }); }}
                    style={{
                      fontSize: 11, padding: "3px 8px",
                      border: "0.5px solid var(--border-default)",
                      borderRadius: 6, background: "var(--bg-primary)",
                      color: "var(--text-primary)", fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    {availableMonths.filter(m => !customEnd || m <= customEnd).map(m => (
                      <option key={m} value={m}>{fmtMonth(m)}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>to</span>
                  <select
                    value={customEnd}
                    onChange={e => { setCustomEnd(e.target.value); track("chart_custom_range", { start: customStart, end: e.target.value }); }}
                    style={{
                      fontSize: 11, padding: "3px 8px",
                      border: "0.5px solid var(--border-default)",
                      borderRadius: 6, background: "var(--bg-primary)",
                      color: "var(--text-primary)", fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    {availableMonths.filter(m => !customStart || m >= customStart).map(m => (
                      <option key={m} value={m}>{fmtMonth(m)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chart */}
              <div className="hero-chart" style={{ width: "100%", height: 220, marginBottom: "0.75rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeChartData ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="quantin" name="Quantin" stroke="#185FA5" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#185FA5" }} />
                    <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="#888780" strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, fill: "#888780" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart legend */}
              <div className="chart-legend" style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ width: 18, height: 2.5, background: "#185FA5", display: "inline-block", borderRadius: 1 }} />
                  Quantin
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ width: 18, height: 0, borderTop: "1.5px dashed #888780", display: "inline-block" }} />
                  S&P 500
                </span>
                <span className="chart-legend-note" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
                  {legendNote}
                </span>
              </div>

              {/* CTA */}
              <div className="cta-row" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: "0.9rem" }}>
                <Button size="lg" onClick={() => { track("click_subscribe", { source: "hero_cta" }); navigate("/subscribe"); }}>
                  Get the portfolio — $25/mo
                </Button>
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                  Receive email alerts on new picks, exits, and cash signals
                </span>
              </div>

              <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: "2rem" }}>
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Not sure yet?</span>
                <Button variant="link" size="sm" onClick={() => { track("click_free_preview", { source: "hero_link" }); navigate("/preview"); }}>
                  See last period's picks for free →
                </Button>
              </div>

              {/* Footer strip */}
              <div className="footer-strip" style={{ paddingTop: "1.25rem", borderTop: "0.5px solid var(--border-subtle)", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
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

            </div>

            {/* Right: ticker tape grows downward */}
            <div className="hero-ticker" style={{ flexShrink: 0, width: 260, paddingTop: "3.5rem" }}>
              <TickerTape />
            </div>

          </div>

        </main>
      </div>
    </>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useRegime } from "../hooks/useRegime";
import { useNavigate } from "react-router-dom";

// ── Maintenance banner — set to true to show, false to hide ──────────────────
const SHOW_MAINTENANCE_BANNER = false;
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";

// All-time view starts from Jan 2020
const ALL_START = "2020-01-01";

// Fallback — shown while API loads (normalized to Jan 2020 = $10,000)
const FALLBACK_CHART_DATA = [
  { period: "Jan '20", quantin: 10000, sp500: 10000  },
  { period: "2021",    quantin: 12280, sp500: 13040  },
  { period: "2022",    quantin: 12700, sp500: 10670  },
  { period: "2023",    quantin: 14730, sp500: 13470  },
  { period: "2024",    quantin: 18100, sp500: 17080  },
  { period: "2025",    quantin: 24130, sp500: 20050  },
  { period: "Aug '26", quantin: 29460, sp500: 21750  },
];

const ALL_TIME_METRICS = [
  {
    val: "+17.6%", label: "Avg. annual return", sub: "vs +12.3% S&P 500",
    valueColor: "#1D9E75",
    tooltip: "Average yearly return compounded since Jan 2020. Walk-forward, no lookahead.",
  },
  {
    val: "−9.5%", label: "Avg. max drawdown", sub: "vs −33.7% S&P 500",
    valueColor: "#B5621A",
    tooltip: "Largest peak-to-trough decline in portfolio value. Lower is better — the S&P 500 fell −33.7% in 2020 alone.",
  },
  {
    val: "2.00", label: "Avg. Sharpe ratio", sub: "vs 0.80 S&P 500",
    valueColor: "#059669",
    tooltip: "Risk-adjusted return: annual excess return divided by volatility. Above 1.0 is considered strong.",
  },
  {
    val: "+5.3pp", label: "vs S&P 500", sub: "annual outperformance",
    valueColor: "#059669",
    tooltip: "Quantin's annualized return has exceeded the S&P 500's by 5.3 percentage points per year since Jan 2020.",
  },
];

const ALL_TIME_INTERPRETATION = "Since Jan 2020, Quantin has compounded at +17.6%/yr — outperforming the S&P 500 by 5.3pp per year — while limiting its worst drawdown to just −9.5%, compared to −33.7% for the index during the 2020 crash.";

interface SeriesPoint { date: string; model: number; spy: number; }
interface MetricData  { val: string; label: string; sub: string; valueColor: string; tooltip: string; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEAR_TOGGLE = ["all", "1m", "3m", "6m", 2026, 2025, 2024, 2023, 2022, 2021, 2020, "custom"] as const;
type YearSelection = typeof YEAR_TOGGLE[number];

function fmtMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

function filterPts(series: SeriesPoint[], year: YearSelection, cStart: string, cEnd: string) {
  if (year === "all") return series.filter(p => p.date >= ALL_START);
  if (year === "custom") {
    return series.filter(p => p.date.slice(0, 7) >= cStart && p.date.slice(0, 7) <= cEnd);
  }
  if (year === "1m" || year === "3m" || year === "6m") {
    if (!series.length) return series;
    const last = new Date(series[series.length - 1].date);
    const days = year === "1m" ? 31 : year === "3m" ? 91 : 182;
    return series.filter(p => (last.getTime() - new Date(p.date).getTime()) / 86400000 <= days);
  }
  return series.filter(p => new Date(p.date).getFullYear() === year);
}

function buildChartData(series: SeriesPoint[], year: YearSelection, cStart: string, cEnd: string) {
  const pts = filterPts(series, year, cStart, cEnd);
  if (!pts.length) return null;
  const bm = pts[0].model, bs = pts[0].spy;
  const isRelative = year === "1m" || year === "3m" || year === "6m";
  const multiYear = pts.some(p => new Date(p.date).getFullYear() !== new Date(pts[0].date).getFullYear());
  let lastLabelYear  = -1;
  let lastLabelMonth = -1;
  return pts.map(p => {
    const d = new Date(p.date);
    let period: string;
    // Relative periods (1m/3m/6m) always use monthly labels even if crossing year boundary
    if (!isRelative && (year === "all" || multiYear)) {
      const yr = d.getFullYear();
      if (yr !== lastLabelYear) {
        period = String(yr);
        lastLabelYear = yr;
      } else { period = p.date; }
    } else {
      const mo = d.getMonth();
      const yr = d.getFullYear();
      if (mo !== lastLabelMonth || yr !== lastLabelYear) {
        period = (isRelative && multiYear) ? `${MONTHS[mo]} '${String(yr).slice(2)}` : MONTHS[mo];
        lastLabelMonth = mo;
        lastLabelYear = yr;
      } else { period = p.date; }
    }
    return { period, quantin: Math.round(p.model / bm * 10000), sp500: Math.round(p.spy / bs * 10000) };
  });
}

function computeSharpe(pts: SeriesPoint[], key: 'model' | 'spy'): number | null {
  if (pts.length < 4) return null;
  const rets: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    rets.push(pts[i][key] / pts[i - 1][key] - 1);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  const std = Math.sqrt(variance);
  if (std < 1e-9) return null;
  return (mean / std) * Math.sqrt(52);
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
  const modelSharpe = computeSharpe(pts, 'model');
  const spySharpe   = computeSharpe(pts, 'spy');
  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const isRelative   = year === "1m" || year === "3m" || year === "6m";
  const isYearPartial = typeof year === "number" && (year === 2018 || year === new Date().getFullYear());
  const relLabel     = year === "1m" ? "Last month" : year === "3m" ? "Last 3M" : "Last 6M";
  const retLabel     = isRelative ? `${relLabel} return` : year === "custom" ? "Period return" : isYearPartial ? "YTD return" : "Year return";
  const ddSub        = isRelative || year === "custom" ? "within the period" : "within the year";
  const relPeriod    = year === "1m" ? "last month" : year === "3m" ? "last 3 months" : "last 6 months";
  const tip = isRelative
    ? `Quantin returned ${fmt(modelRet)} over the ${relPeriod}, vs ${fmt(spyRet)} for the S&P 500.`
    : typeof year === "number"
      ? `Quantin returned ${fmt(modelRet)} in ${year}, vs ${fmt(spyRet)} for the S&P 500.`
      : `Quantin returned ${fmt(modelRet)} from ${fmtMonth(cStart)} to ${fmtMonth(cEnd)}, vs ${fmt(spyRet)} for the S&P 500.`;
  const sharpeVal = modelSharpe !== null ? modelSharpe.toFixed(2) : "—";
  const sharpeSub = spySharpe !== null ? `vs ${spySharpe.toFixed(2)} S&P 500` : "S&P 500 n/a";
  return [
    {
      val: fmt(modelRet), label: retLabel,
      sub: `vs ${fmt(spyRet)} S&P 500`,
      valueColor: modelRet >= 0 ? "#1D9E75" : "#B5621A",
      tooltip: tip,
    },
    {
      val: maxDD === 0 ? "0.0%" : `${maxDD.toFixed(1)}%`,
      label: "Avg. max drawdown", sub: ddSub,
      valueColor: "#B5621A",
      tooltip: `Largest peak-to-trough decline within the selected period. Walk-forward validated.`,
    },
    {
      val: sharpeVal, label: "Avg. Sharpe ratio", sub: sharpeSub,
      valueColor: "#059669",
      tooltip: `Risk-adjusted return for the selected period. Above 1.0 is considered strong.`,
    },
    {
      val: `${alpha >= 0 ? "+" : ""}${alpha.toFixed(1)}pp`,
      label: "vs S&P 500", sub: "outperformance",
      valueColor: alpha >= 0 ? "#059669" : "#B5621A",
      tooltip: `Quantin ${alpha >= 0 ? "outperformed" : "underperformed"} the S&P 500 by ${Math.abs(alpha).toFixed(1)} percentage points.`,
    },
  ];
}

function buildInterpretation(series: SeriesPoint[], year: YearSelection, cStart: string, cEnd: string): string {
  if (year === "all" || !series.length) return ALL_TIME_INTERPRETATION;
  const pts = filterPts(series, year, cStart, cEnd);
  if (pts.length < 2) return ALL_TIME_INTERPRETATION;
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
  const fmt  = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const fmtA = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}pp`;
  const ddClause = maxDD < -0.5 ? `, with a maximum drawdown of ${maxDD.toFixed(1)}%` : "";
  if (year === "1m" || year === "3m" || year === "6m") {
    const relP = year === "1m" ? "last month" : year === "3m" ? "last 3 months" : "last 6 months";
    return `Quantin returned ${fmt(modelRet)} over the ${relP} vs ${fmt(spyRet)} for the S&P 500 — ${alpha >= 0 ? "outperforming" : "underperforming"} by ${fmtA(alpha)}${ddClause}.`;
  }
  const isPartial = typeof year === "number" && (year === 2018 || year === new Date().getFullYear());
  const period = year === "custom"
    ? `from ${fmtMonth(cStart)} to ${fmtMonth(cEnd)}`
    : isPartial ? `in ${year} (YTD)` : `in ${year}`;
  return `Quantin returned ${fmt(modelRet)} ${period} vs ${fmt(spyRet)} for the S&P 500 — ${alpha >= 0 ? "outperforming" : "underperforming"} by ${fmtA(alpha)}${ddClause}.`;
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


type AuthState = "loading" | "none" | "subscribed" | "unsubscribed";

export function Landing() {
  const navigate = useNavigate();
  const { label: regimeLabel, colors: regimeColors } = useRegime();
  const [authState, setAuthState]   = useState<AuthState>("loading");
  const [chartSeries, setChartSeries] = useState<SeriesPoint[]>([]);
  const [wfStats, setWfStats] = useState<{ cagr: number; sharpe: number; max_dd: number; spy_cagr: number; alfa_cagr: number } | null>(null);
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
    fetch(`${apiUrl}/api/portfolio_optimizer`)
      .then(r => r.json())
      .then(d => {
        const m = d.validation?.metrics;
        const v = d.validation?.vs_spy;
        if (m && v) setWfStats({
          cagr:     m.cagr,
          sharpe:   m.sharpe,
          max_dd:   m.max_dd,
          spy_cagr: v.spy_cagr,
          alfa_cagr: v.alfa_cagr,
        });
      })
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

  const yDomain = useMemo<[number, number]>(() => {
    if (!activeChartData?.length) return [0, 70000];
    const vals = activeChartData.flatMap(d => [d.quantin, d.sp500]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = Math.max((hi - lo) * 0.04, 200);
    return [Math.floor((lo - pad) / 100) * 100, Math.ceil((hi + pad) / 100) * 100];
  }, [activeChartData]);

  const activeMetrics = useMemo<MetricData[]>(() => {
    if (selectedYear !== "all") {
      if (!chartSeries.length) return ALL_TIME_METRICS;
      return buildRangeMetrics(chartSeries, selectedYear, effectiveStart, effectiveEnd);
    }
    const pts = chartSeries.filter(p => p.date >= ALL_START);
    if (pts.length < 2) return ALL_TIME_METRICS;
    const first = pts[0], last = pts[pts.length - 1];
    const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 86400000);
    const cagr     = ((last.model / first.model) ** (1 / years) - 1) * 100;
    const spyCagr  = ((last.spy   / first.spy)   ** (1 / years) - 1) * 100;
    const alpha    = cagr - spyCagr;
    let peak = first.model, maxDD = 0;
    for (const p of pts) {
      if (p.model > peak) peak = p.model;
      const dd = (p.model - peak) / peak * 100;
      if (dd < maxDD) maxDD = dd;
    }
    const modelSharpe = computeSharpe(pts, 'model');
    const spySharpe   = computeSharpe(pts, 'spy');
    const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
    return [
      {
        val: fmtPct(cagr), label: "Avg. annual return", sub: `vs ${fmtPct(spyCagr)} S&P 500`,
        valueColor: cagr >= 0 ? "#1D9E75" : "#B5621A",
        tooltip: "Average yearly return compounded since Jan 2020. Walk-forward, no lookahead.",
      },
      {
        val: maxDD === 0 ? "0.0%" : `${maxDD.toFixed(1)}%`, label: "Avg. max drawdown", sub: "vs −33.7% S&P 500",
        valueColor: "#B5621A",
        tooltip: "Largest peak-to-trough decline since Jan 2020. Walk-forward validated.",
      },
      {
        val: modelSharpe !== null ? modelSharpe.toFixed(2) : "—", label: "Avg. Sharpe ratio",
        sub: spySharpe !== null ? `vs ${spySharpe.toFixed(2)} S&P 500` : "S&P 500 n/a",
        valueColor: "#059669",
        tooltip: "Risk-adjusted return since Jan 2020. Above 1.0 is considered strong.",
      },
      {
        val: `${alpha >= 0 ? "+" : ""}${alpha.toFixed(1)}pp`, label: "vs S&P 500", sub: "annual outperformance",
        valueColor: alpha >= 0 ? "#059669" : "#B5621A",
        tooltip: `Quantin's annualized return has exceeded the S&P 500's by ${Math.abs(alpha).toFixed(1)} percentage points per year since Jan 2020.`,
      },
    ];
  }, [chartSeries, selectedYear, effectiveStart, effectiveEnd]);

  const activeInterpretation = useMemo(() => {
    if (selectedYear === "all") {
      const pts = chartSeries.filter(p => p.date >= ALL_START);
      if (!pts.length) return ALL_TIME_INTERPRETATION;
      const first = pts[0], last = pts[pts.length - 1];
      const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 86400000);
      const cagr  = ((last.model / first.model) ** (1 / years) - 1) * 100;
      const spyCagr = ((last.spy / first.spy)   ** (1 / years) - 1) * 100;
      const alpha = cagr - spyCagr;
      let peak = first.model, maxDD = 0;
      for (const p of pts) {
        if (p.model > peak) peak = p.model;
        const dd = (p.model - peak) / peak * 100;
        if (dd < maxDD) maxDD = dd;
      }
      return `Since Jan 2020, Quantin has compounded at +${cagr.toFixed(1)}%/yr — outperforming the S&P 500 by ${alpha.toFixed(1)}pp per year — while limiting its worst drawdown to just ${maxDD.toFixed(1)}%, compared to −33.7% for the index during the 2020 crash.`;
    }
    return buildInterpretation(chartSeries, selectedYear, effectiveStart, effectiveEnd);
  }, [chartSeries, selectedYear, effectiveStart, effectiveEnd]);

  const legendNote = useMemo(() => {
    if (selectedYear === "all") return "$10,000 invested Jan 2020 · walk-forward, no lookahead";
    if (selectedYear === "custom") {
      return effectiveStart && effectiveEnd
        ? `$10,000 invested ${fmtMonth(effectiveStart)} · custom range · walk-forward`
        : "$10,000 invested · custom range · walk-forward";
    }
    if (selectedYear === "1m") return "Last 30 days · walk-forward";
    if (selectedYear === "3m") return "Last 3 months · walk-forward";
    if (selectedYear === "6m") return "Last 6 months · walk-forward";
    const isPartial = selectedYear === 2018 || selectedYear === new Date().getFullYear();
    const start = selectedYear === 2018 ? "Feb 2018" : `Jan ${selectedYear}`;
    return `$10,000 invested ${start} · ${isPartial ? "partial year" : "calendar year"} · walk-forward`;
  }, [selectedYear, effectiveStart, effectiveEnd]);

  return (
    <>
      <style>{`
        @media (min-width: 900px) {
          .hero-headline { font-size: 48px !important; }
          .hero-chart    { height: 280px !important; }
        }
        @media (max-width: 860px) {
          .hero-cols   { flex-direction: column !important; align-items: stretch !important; }
        }
        @media (max-width: 600px) {
          .nav-secondary { display: none !important; }
          .hero-nav  { padding: 0 1.25rem !important; }
          .hero-main { padding: 2.5rem 1.25rem 4rem !important; }
          .hero-headline { font-size: 28px !important; }
          .metric-grid { gap: 8px !important; grid-template-columns: repeat(2, 1fr) !important; }
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
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0 2rem", height: 56,
          background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {authState === "none" && (
              <Button variant="ghost" size="sm" onClick={() => { track("click_signin", { source: "nav" }); navigate("/signin"); }}>Sign in</Button>
            )}
            {authState === "none" && (
              <Button variant="ghost" size="sm" onClick={() => { track("click_subscribe", { source: "nav" }); navigate("/subscribe"); }}>Get alerts</Button>
            )}
            {(authState === "subscribed" || authState === "unsubscribed") && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/user")}>Account</Button>
            )}
            <Button variant="primary" size="sm" onClick={() => navigate("/portfolio")}>View Portfolio</Button>
          </div>
        </nav>

        {/* Hero */}
        <main className="hero-main" style={{ maxWidth: 1440, margin: "0 auto", padding: "4rem max(2rem, 6%) 6rem" }}>

          {SHOW_MAINTENANCE_BANNER && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#FEF9EC", border: "0.5px solid #E8C84A", borderRadius: 8, padding: "12px 16px", marginBottom: "2rem" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="8" cy="8" r="7" stroke="#C9A226" strokeWidth="1.2"/>
                <rect x="7.3" y="4.5" width="1.4" height="4.5" rx="0.7" fill="#C9A226"/>
                <rect x="7.3" y="10.5" width="1.4" height="1.4" rx="0.7" fill="#C9A226"/>
              </svg>
              <div>
                <p style={{ fontWeight: 500, fontSize: 13, color: "#7A5C00", margin: "0 0 3px" }}>Model update in progress</p>
                <p style={{ fontWeight: 300, fontSize: 12, color: "#9A7C20", margin: 0, lineHeight: 1.5 }}>We're running a full portfolio recalculation. Performance metrics shown reflect the last validated state and will be updated shortly.</p>
              </div>
            </div>
          )}

          {/* Logo + wordmark — centered */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <QuantinLogo iconSize={52} fontWeight={400} />
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
                Systematic alpha.<br />No quant team required.
              </h1>

              <p style={{
                fontSize: 16, lineHeight: 1.65, maxWidth: 520,
                color: "var(--text-secondary)", marginBottom: "2.5rem",
              }}>
                Quantin is a quantitative portfolio engine that gives wealth managers and advisors the edge of a quant team without the cost or complexity.
              </p>

              {/* Metrics */}
              <div className="metric-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
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
                      {y === "all" ? "All" : y === "1m" ? "1M" : y === "3m" ? "3M" : y === "6m" ? "6M" : y === "custom" ? "Custom" : y}
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
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} interval={0} tickFormatter={(v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) ? "" : v} />
                    <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} width={42} domain={yDomain} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="quantin" name="Quantin" stroke="#059669" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#059669" }} />
                    <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="#888780" strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, fill: "#888780" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart legend */}
              <div className="chart-legend" style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ width: 18, height: 2.5, background: "#059669", display: "inline-block", borderRadius: 1 }} />
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

              {/* Interpretation */}
              <p style={{
                fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)",
                marginBottom: "1.5rem", fontStyle: "italic",
              }}>
                {activeInterpretation}
              </p>

              {/* CTA */}
              <div className="cta-row" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: "0.9rem" }}>
                <Button size="lg" onClick={() => {
                  track("click_view_portfolio", { source: "hero_cta" });
                  navigate("/portfolio");
                }}>
                  View the portfolio →
                </Button>
                <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                  Free · Alerts from $25/mo
                </span>
              </div>

              {/* Footer strip */}
              <div className="footer-strip" style={{ paddingTop: "1.25rem", borderTop: "0.5px solid var(--border-subtle)", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                {[
                  ["15 positions", "active today"],
                  ["Email + push", "on every change"],
                ].map(([strong, rest]) => (
                  <span key={strong} style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{strong}</span> {rest}
                  </span>
                ))}
              </div>

            </div>

          </div>

        </main>

        {/* Mission line */}
        <div style={{ borderTop: "0.5px solid var(--border-subtle)", padding: "1.25rem max(2rem, 6%)", textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", letterSpacing: "0.04em", margin: 0 }}>
            Bringing systematic investing to every advisory practice.
          </p>
        </div>

      </div>
    </>
  );
}

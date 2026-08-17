import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useRegime } from "../hooks/useRegime";
import { track, identify } from "../lib/analytics";

// ── Maintenance banner — set to true to show, false to hide ──────────────────
const SHOW_MAINTENANCE_BANNER = false;

// ── Static metadata ───────────────────────────────────────────────────────────
const TICKER_NAMES: Record<string, { name: string; sector: string }> = {
  AAPL: { name: "Apple",                    sector: "Technology"  },
  AMAT: { name: "Applied Materials",         sector: "Technology"  },
  AMZN: { name: "Amazon",                   sector: "Consumer"    },
  ANET: { name: "Arista Networks",           sector: "Technology"  },
  ASML: { name: "ASML Holding",             sector: "Technology"  },
  AVDV: { name: "Avantis Intl Small Cap",   sector: "ETF"         },
  AVLV: { name: "Avantis US Large Cap Val", sector: "ETF"         },
  AVUS: { name: "Avantis US Equity ETF",    sector: "ETF"         },
  CAT:  { name: "Caterpillar",               sector: "Industrials" },
  CEG:  { name: "Constellation Energy",      sector: "Utilities"   },
  COP:  { name: "ConocoPhillips",            sector: "Energy"      },
  CRWD: { name: "CrowdStrike",               sector: "Technology"  },
  CSCO: { name: "Cisco Systems",             sector: "Technology"  },
  DECK: { name: "Deckers Outdoor",           sector: "Consumer"    },
  DGRO: { name: "iShares Div. Growth ETF",  sector: "ETF"         },
  EWT:  { name: "iShares MSCI Taiwan",       sector: "ETF"         },
  EWY:  { name: "iShares MSCI South Korea",  sector: "ETF"         },
  FANG: { name: "Diamondback Energy",        sector: "Energy"      },
  FENY: { name: "Fidelity MSCI Energy ETF",  sector: "ETF"         },
  FNDB: { name: "Schwab Fundamental US ETF", sector: "ETF"         },
  GE:   { name: "GE Aerospace",              sector: "Industrials" },
  GLD:  { name: "SPDR Gold Shares",          sector: "Commodity"   },
  GRID: { name: "Global Clean Energy ETF",   sector: "ETF"         },
  IAU:  { name: "iShares Gold Trust",        sector: "Commodity"   },
  ITUB: { name: "Itaú Unibanco",             sector: "Financials"  },
  JPM:  { name: "JPMorgan Chase",            sector: "Financials"  },
  KLAC: { name: "KLA Corporation",           sector: "Technology"  },
  LRCX: { name: "Lam Research",              sector: "Technology"  },
  LLY:  { name: "Eli Lilly",                 sector: "Healthcare"  },
  META: { name: "Meta Platforms",            sector: "Technology"  },
  MGV:  { name: "Vanguard Mega Cap Value",   sector: "ETF"         },
  MSFT: { name: "Microsoft",                 sector: "Technology"  },
  MU:   { name: "Micron Technology",         sector: "Technology"  },
  NOK:  { name: "Nokia",                     sector: "Technology"  },
  NRG:  { name: "NRG Energy",                sector: "Utilities"   },
  NVDA: { name: "NVIDIA",                    sector: "Technology"  },
  PBR:  { name: "Petrobras",                 sector: "Energy"      },
  PGR:  { name: "Progressive",               sector: "Financials"  },
  QQQ:  { name: "Invesco QQQ Trust",         sector: "ETF"         },
  RYDAF:{ name: "Shell (Royal Dutch)",       sector: "Energy"      },
  SCHD: { name: "Schwab US Dividend ETF",    sector: "ETF"         },
  SIVR: { name: "Aberdeen Silver ETF",       sector: "Commodity"   },
  SPHQ: { name: "Invesco S&P 500 Quality",  sector: "ETF"         },
  SMH:  { name: "VanEck Semiconductor ETF",  sector: "ETF"         },
  SOXX: { name: "iShares Semiconductor ETF", sector: "ETF"         },
  SPDW: { name: "SPDR Dev World ex-US",      sector: "ETF"         },
  SPXL: { name: "Direxion S&P 500 Bull 3x",  sector: "ETF"        },
  TRGP: { name: "Targa Resources",           sector: "Energy"      },
  TSM:  { name: "Taiwan Semiconductor",      sector: "Technology"  },
  VDE:  { name: "Vanguard Energy ETF",       sector: "ETF"         },
  VLUE: { name: "iShares MSCI Value",        sector: "ETF"         },
  VST:  { name: "Vistra",                    sector: "Utilities"   },
  VWO:  { name: "Vanguard EM ETF",           sector: "ETF"         },
  WDC:  { name: "Western Digital",           sector: "Technology"  },
  XLK:  { name: "SPDR Technology ETF",       sector: "ETF"         },
  XOM:  { name: "ExxonMobil",                sector: "Energy"      },
  ACWI: { name: "iShares MSCI ACWI ETF",     sector: "ETF"         },
  DFLV: { name: "Dimensional US Large Value", sector: "ETF"         },
  HSIC: { name: "Henry Schein",              sector: "Healthcare"  },
  RARE: { name: "Ultragenyx Pharmaceutical", sector: "Healthcare"  },
  VTV:  { name: "Vanguard Value ETF",        sector: "ETF"         },
};

const TICKER_GEO: Record<string, string> = {
  AAPL:"United States", AMAT:"United States", AMZN:"United States",
  ANET:"United States", AVLV:"United States", CEG:"United States",
  COP:"United States",  CRWD:"United States", CSCO:"United States",
  DECK:"United States", DGRO:"United States", FANG:"United States",
  FENY:"United States", FNDB:"United States", GE:"United States",
  GLD:"United States",  IAU:"United States",  JPM:"United States",
  KLAC:"United States", LRCX:"United States", LLY:"United States",
  META:"United States", MGV:"United States",  MSFT:"United States",
  MU:"United States",   NRG:"United States",  NVDA:"United States",
  PGR:"United States",  QQQ:"United States",  SCHD:"United States",
  SIVR:"United States", SMH:"United States",  SOXX:"United States",
  SPXL:"United States", TRGP:"United States", VDE:"United States",
  VLUE:"United States", VST:"United States",  WDC:"United States",
  XLK:"United States",  XOM:"United States",
  ASML:"Netherlands", AVDV:"Intl Dev. ex-US", EWT:"Taiwan",
  EWY:"South Korea",  GRID:"Global",          ITUB:"Brazil",
  NOK:"Finland",      PBR:"Brazil",           RYDAF:"Netherlands",
  SPDW:"Intl Dev. ex-US", TSM:"Taiwan",       VWO:"Emerging Markets",
  ACWI:"Global",      DFLV:"United States",   HSIC:"United States",
  RARE:"United States", VTV:"United States",
  AVUS:"United States", CAT:"United States",  SPHQ:"United States",
};

const TICKER_IND: Record<string, string> = {
  AMAT:"Semiconductor Equipment", ASML:"Semiconductor Equipment",
  KLAC:"Semiconductor Equipment", LRCX:"Semiconductor Equipment",
  SMH:"Semiconductor ETF",        SOXX:"Semiconductor ETF",
  TSM:"Semiconductor Mfg",        MU:"Memory Chips",
  NVDA:"AI Chips",                EWT:"Taiwanese Equities ETF",
  WDC:"Data Storage",
  AAPL:"Technology Hardware",
  ANET:"Networking",              CSCO:"Networking",
  CRWD:"Cybersecurity",
  META:"Social Media",            MSFT:"Enterprise Software",
  AMZN:"E-commerce / Cloud",     QQQ:"US Tech ETF", XLK:"US Tech ETF",
  NOK:"Telecom Equipment",
  DECK:"Consumer Goods",
  LLY:"Pharmaceuticals",
  JPM:"Financials",               PGR:"Insurance",  ITUB:"Financials",
  CEG:"Utilities",                NRG:"Utilities",  VST:"Utilities",
  GE:"Aerospace & Defense",
  COP:"Energy (E&P)",             FANG:"Energy (E&P)", PBR:"Energy (E&P)",
  XOM:"Integrated Energy",        RYDAF:"Integrated Energy",
  TRGP:"Energy Midstream",
  FENY:"Energy ETF",              VDE:"Energy ETF",
  GLD:"Gold ETF",                 IAU:"Gold ETF",
  SIVR:"Precious Metals ETF",
  GRID:"Clean Energy ETF",
  EWY:"Korean Equities ETF",
  AVDV:"Intl Value ETF",          SPDW:"Intl Developed ETF",
  VWO:"Emerging Markets ETF",
  AVLV:"US Value Factor ETF",     VLUE:"US Value Factor ETF",
  FNDB:"US Dividend ETF",         SCHD:"US Dividend ETF",
  DGRO:"US Dividend Growth ETF",  MGV:"US Mega Cap ETF",
  SPXL:"Leveraged US Equity",
  DFLV:"US Value Factor ETF",     VTV:"US Value Factor ETF",
  ACWI:"Global Equity ETF",
  HSIC:"Healthcare Distribution", RARE:"Rare Disease Biotech",
  AVUS:"US Equity ETF",           CAT:"Heavy Machinery",       SPHQ:"US Quality ETF",
};

const GEO_COLORS: Record<string, string> = {
  "United States":    "#185FA5",
  "Intl Dev. ex-US": "#1D9E75",
  "Taiwan":           "#D4963A",
  "South Korea":      "#8B5CC7",
  "Global":           "#5EAB72",
  "Netherlands":      "#D97706",
  "Brazil":           "#B5621A",
  "Finland":          "#7090AA",
  "Emerging Markets": "#C05080",
};

const IND_COLORS: Record<string, string> = {
  "Semiconductor Equipment": "#185FA5",
  "Semiconductor Mfg":       "#1D9E75",
  "AI Chips":                "#2A7FDB",
  "Memory Chips":            "#3A6FAA",
  "Semiconductor ETF":       "#4A7FBA",
  "Taiwanese Equities ETF":  "#D4963A",
  "Data Storage":            "#8B5CC7",
  "Technology Hardware":     "#1A5090",
  "Networking":              "#3070B0",
  "Cybersecurity":           "#1060A0",
  "Social Media":            "#D07030",
  "Enterprise Software":     "#2060B0",
  "E-commerce / Cloud":      "#40A0C0",
  "US Tech ETF":             "#3080B0",
  "Telecom Equipment":       "#7090A0",
  "Consumer Goods":          "#EC4899",
  "Pharmaceuticals":         "#8B5CF6",
  "Financials":              "#F59E0B",
  "Insurance":               "#D4A030",
  "Utilities":               "#10B981",
  "Aerospace & Defense":     "#6B7280",
  "Energy (E&P)":            "#B5621A",
  "Integrated Energy":       "#C0722A",
  "Energy Midstream":        "#D08030",
  "Energy ETF":              "#A05020",
  "Gold ETF":                "#C8A060",
  "Precious Metals ETF":     "#D4963A",
  "Clean Energy ETF":        "#1D9E75",
  "Korean Equities ETF":     "#8B5CC7",
  "Intl Value ETF":          "#4B8EC7",
  "Intl Developed ETF":      "#5A9ED7",
  "Emerging Markets ETF":    "#C05080",
  "US Value Factor ETF":     "#3A7EC7",
  "US Dividend ETF":         "#2A6EB7",
  "US Dividend Growth ETF":  "#1A5EA7",
  "US Mega Cap ETF":         "#0A4E97",
  "Leveraged US Equity":     "#9AAABB",
  "Global Equity ETF":       "#2A8080",
  "Healthcare Distribution": "#7B52AB",
  "Rare Disease Biotech":    "#9B72CB",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface PortfolioHolding {
  ticker: string; weight: number; position?: string;
  performance?: number | null; entry_date?: string | null;
  performance_since_subscribed?: number | null;
  strategy?: string | null; confidence?: number | null;
}
interface PeriodMetrics { cagr: number; sharpe: number; max_dd: number; total: number; final_10k: number; }
interface PortfolioData {
  portfolio: PortfolioHolding[]; as_of: string;
  validation: { metrics: { cagr: number; sharpe: number; max_dd: number; total_return: number }; dollar_simulation: { final_model: number; final_spy: number } };
  period_metrics: Record<string, { model: PeriodMetrics; spy: PeriodMetrics; start_date: string; end_date: string; n_months: number }>;
  ticker_cumrets?: Record<string, Record<string, number>>;
}
interface ChartSeries  { date: string; model: number; spy: number; }
interface RebEvent     { date: string; added: string[]; dropped: string[]; held: string[]; total: number; }
interface ChartData    { series: ChartSeries[]; rebalances: RebEvent[]; }
interface GeoSeg       { label: string; pct: number; color: string; tickers: string[]; }
interface IndSeg       { label: string; pct: number; color: string; tickers: string[]; }
interface SecSeg       { label: string; pct: number; color: string; tickers: string[]; }

const SEC_COLORS: Record<string, string> = {
  "Technology":  "#185FA5",
  "ETF":         "#1D9E75",
  "Energy":      "#D4963A",
  "Financials":  "#F59E0B",
  "Utilities":   "#10B981",
  "Consumer":    "#EC4899",
  "Healthcare":  "#8B5CF6",
  "Industrials": "#6B7280",
  "Commodity":   "#C8A060",
};

type AlertKey = "exit" | "entry" | "position";
const defaultAlerts: Record<AlertKey, boolean> = { exit: true, entry: true, position: true };
const alertDefs: { key: AlertKey; label: string; sub: string }[] = [
  { key: "exit",     label: "Stock exits the portfolio",      sub: "Alert when a position is removed at rebalance" },
  { key: "entry",    label: "New stock enters the portfolio",  sub: "Alert when a new position is added at rebalance" },
  { key: "position", label: "Position change (Long ↔ Cash)",  sub: "Alert when a held stock switches between Long and Cash" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";
const fmtMonthYear = (d: string) => new Date(d + "T00:00:00").toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase();
const fmtDate  = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });


function computeGeo(holdings: PortfolioHolding[]): GeoSeg[] {
  const counts: Record<string, string[]> = {};
  holdings.forEach(h => { const g = TICKER_GEO[h.ticker] ?? "Other"; (counts[g] ??= []).push(h.ticker); });
  return Object.entries(counts).sort((a, b) => b[1].length - a[1].length)
    .map(([label, tickers]) => ({ label, pct: (tickers.length / holdings.length) * 100, tickers, color: GEO_COLORS[label] ?? "#8A8F9A" }));
}

function computeInd(holdings: PortfolioHolding[]): IndSeg[] {
  const counts: Record<string, string[]> = {};
  holdings.forEach(h => { const g = TICKER_IND[h.ticker] ?? "Other"; (counts[g] ??= []).push(h.ticker); });
  return Object.entries(counts).sort((a, b) => b[1].length - a[1].length)
    .map(([label, tickers]) => ({ label, pct: (tickers.length / holdings.length) * 100, tickers, color: IND_COLORS[label] ?? "#8A8F9A" }));
}

function computeSec(holdings: PortfolioHolding[]): SecSeg[] {
  const counts: Record<string, string[]> = {};
  holdings.forEach(h => { const g = TICKER_NAMES[h.ticker]?.sector ?? "Other"; (counts[g] ??= []).push(h.ticker); });
  return Object.entries(counts).sort((a, b) => b[1].length - a[1].length)
    .map(([label, tickers]) => ({ label, pct: (tickers.length / holdings.length) * 100, tickers, color: SEC_COLORS[label] ?? "#8A8F9A" }));
}

// ── Chart drawing helpers ─────────────────────────────────────────────────────
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
function drawPerfChart(
  canvas: HTMLCanvasElement, data: ChartSeries[], rebalances: RebEvent[], hovIdx: number | null
) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H || data.length < 2) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const ACC = "#1D9E75", SPY = "#7090AA";
  const BG   = cv("--bg-primary")   || "#232540";
  const GRID = cv("--border-subtle") || "rgba(255,255,255,0.07)";
  const LBL  = cv("--text-tertiary") || "#5D7A94";
  const REB  = cv("--border-subtle") || "rgba(255,255,255,0.07)";
  const PAD  = { t: 16, r: 16, b: 36, l: 52 };
  const CW   = W - PAD.l - PAD.r, CH = H - PAD.t - PAD.b;
  const allV = data.flatMap(d => [d.model, d.spy]);
  const minV = Math.min(...allV) * 0.97, maxV = Math.max(...allV) * 1.03;
  const xOf  = (i: number) => PAD.l + (i / (data.length - 1)) * CW;
  const yOf  = (v: number) => PAD.t + CH - ((v - minV) / (maxV - minV)) * CH;

  ctx.clearRect(0, 0, W, H);
  ctx.font = "10px ui-monospace, monospace"; ctx.textAlign = "right"; ctx.setLineDash([]);
  for (let i = 0; i <= 4; i++) {
    const v = minV + (i / 4) * (maxV - minV), y = yOf(v);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + CW, y); ctx.stroke();
    ctx.fillStyle = LBL;
    ctx.fillText(`${(v / 100 - 1) * 100 >= 0 ? "+" : ""}${((v / 100 - 1) * 100).toFixed(0)}%`, PAD.l - 6, y + 3.5);
  }
  const nL = data.length > 200 ? 7 : 5;
  ctx.textAlign = "center"; ctx.font = "10px system-ui, sans-serif";
  for (let i = 0; i <= nL; i++) {
    const idx = Math.round((i / nL) * (data.length - 1));
    ctx.fillStyle = LBL;
    ctx.fillText(new Date(data[idx].date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }), xOf(idx), PAD.t + CH + 22);
  }
  rebalances.map(r => new Date(r.date).getTime()).forEach(ms => {
    const idx = data.reduce((b, d, i) => Math.abs(new Date(d.date).getTime() - ms) < Math.abs(new Date(data[b].date).getTime() - ms) ? i : b, 0);
    if (Math.abs(new Date(data[idx].date).getTime() - ms) > 40 * 86400000) return;
    const x = xOf(idx);
    ctx.strokeStyle = REB; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + CH); ctx.stroke(); ctx.setLineDash([]);
  });
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(data[0].spy));
  data.forEach((d, i) => ctx.lineTo(xOf(i), yOf(d.spy)));
  ctx.lineTo(xOf(data.length - 1), PAD.t + CH); ctx.lineTo(xOf(0), PAD.t + CH); ctx.closePath();
  ctx.fillStyle = "rgba(112,144,170,0.08)"; ctx.fill();
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(data[0].spy));
  data.forEach((d, i) => ctx.lineTo(xOf(i), yOf(d.spy)));
  ctx.strokeStyle = SPY; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
  const g = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + CH);
  g.addColorStop(0, "rgba(29,158,117,0.22)"); g.addColorStop(1, "rgba(29,158,117,0)");
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(data[0].model));
  data.forEach((d, i) => ctx.lineTo(xOf(i), yOf(d.model)));
  ctx.lineTo(xOf(data.length - 1), PAD.t + CH); ctx.lineTo(xOf(0), PAD.t + CH); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(data[0].model));
  data.forEach((d, i) => ctx.lineTo(xOf(i), yOf(d.model)));
  ctx.strokeStyle = ACC; ctx.lineWidth = 2; ctx.stroke();
  const lx = xOf(data.length - 1), ly = yOf(data[data.length - 1].model);
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fillStyle = ACC; ctx.fill();
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.strokeStyle = BG; ctx.lineWidth = 2; ctx.stroke();
  if (hovIdx !== null) {
    const hx = xOf(hovIdx);
    ctx.strokeStyle = cv("--border-default") || "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(hx, PAD.t); ctx.lineTo(hx, PAD.t + CH); ctx.stroke();
    const hyP = yOf(data[hovIdx].model), hyS = yOf(data[hovIdx].spy);
    ctx.beginPath(); ctx.arc(hx, hyP, 4, 0, Math.PI * 2); ctx.fillStyle = ACC; ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hyP, 4, 0, Math.PI * 2); ctx.strokeStyle = BG; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hyS, 3, 0, Math.PI * 2); ctx.fillStyle = SPY; ctx.fill();
  }
}

type DonutSeg = { label: string; pct: number; color: string; tickers: string[] };

function drawDonut(canvas: HTMLCanvasElement, segs: DonutSeg[], hovIdx: number | null) {
  const SZ = 130, R = 52, RHOV = 57, inner = 30;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = SZ * dpr; canvas.height = SZ * dpr;
  canvas.style.width = `${SZ}px`; canvas.style.height = `${SZ}px`;
  const ctx = canvas.getContext("2d")!; ctx.scale(dpr, dpr);
  const cx = SZ / 2, cy = SZ / 2;
  const bgColor = cv("--bg-primary") || "#232540";
  let angle = -Math.PI / 2;
  segs.forEach((s, i) => {
    const sw = (s.pct / 100) * Math.PI * 2;
    const r = i === hovIdx ? RHOV : R;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + sw); ctx.closePath();
    ctx.fillStyle = s.color + (hovIdx !== null && i !== hovIdx ? "99" : "");
    ctx.fill();
    if (i === hovIdx) { ctx.strokeStyle = bgColor; ctx.lineWidth = 1.5; ctx.stroke(); }
    angle += sw;
  });
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = bgColor; ctx.fill();
  const total = segs.reduce((n, s) => n + s.tickers.length, 0);
  ctx.fillStyle = cv("--text-primary") || "#E8EFF6";
  ctx.font = "bold 12px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(`${total}`, cx, cy - 4);
  ctx.font = "8px system-ui, sans-serif";
  ctx.fillStyle = cv("--text-tertiary") || "#5D7A94";
  ctx.fillText("positions", cx, cy + 7);
}

function hitTestDonut(e: React.MouseEvent<HTMLCanvasElement>, segs: DonutSeg[]): number | null {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const SZ = 130, R = 57, inner = 30;
  const cx = SZ / 2, cy = SZ / 2;
  const dx = e.clientX - rect.left - cx, dy = e.clientY - rect.top - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < inner || dist > R) return null;
  let theta = Math.atan2(dy, dx) + Math.PI / 2;
  if (theta < 0) theta += Math.PI * 2;
  let a = 0;
  for (let i = 0; i < segs.length; i++) {
    const sw = (segs[i].pct / 100) * Math.PI * 2;
    if (theta >= a && theta < a + sw) return i;
    a += sw;
  }
  return null;
}

// ── DonutChart (shared interactive component) ─────────────────────────────────
function DonutChart({ title, segs }: { title: string; segs: DonutSeg[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current && segs.length) drawDonut(canvasRef.current, segs, hovIdx);
  }, [segs, hovIdx]);

  return (
    <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", padding: "1.25rem", borderRadius: "var(--radius-lg)", position: "relative" }}>
      <p style={{ fontFamily: outfit, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 14, marginTop: 0 }}>{title}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", cursor: "default" }}
            onMouseMove={e => {
              const idx = hitTestDonut(e, segs);
              setHovIdx(idx);
              setTooltip(idx !== null ? { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
            }}
            onMouseLeave={() => { setHovIdx(null); setTooltip(null); }}
          />
          {hovIdx !== null && tooltip && segs[hovIdx] && (
            <div style={{
              position: "absolute",
              left: tooltip.x + 10, top: tooltip.y - 10,
              background: "var(--bg-secondary)",
              border: "0.5px solid var(--border-subtle)",
              borderRadius: 6, padding: "6px 9px",
              pointerEvents: "none", zIndex: 10, whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: segs[hovIdx].color, marginBottom: 3, letterSpacing: "0.02em" }}>{segs[hovIdx].label}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 180 }}>
                {segs[hovIdx].tickers.map(t => (
                  <span key={t} style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: 3, padding: "1px 4px" }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {segs.map((s, i) => (
            <div
              key={s.label}
              style={{ display: "flex", alignItems: "center", gap: 8, opacity: hovIdx !== null && i !== hovIdx ? 0.4 : 1, transition: "opacity 0.12s" }}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>{s.label}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function drawExpandChart(
  canvas: HTMLCanvasElement,
  tickerCumrets: Record<string, number>,
  entryDateStr: string
) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!; ctx.scale(dpr, dpr);

  const ACC  = "#1D9E75";
  const BG   = cv("--bg-primary")    || "#232540";
  const GRID = cv("--border-subtle") || "rgba(255,255,255,0.07)";
  const LBL  = cv("--text-tertiary") || "#5D7A94";
  const PAD  = { t: 10, r: 12, b: 28, l: 40 };
  const CW   = W - PAD.l - PAD.r, CH = H - PAD.t - PAD.b;

  ctx.clearRect(0, 0, W, H);

  const entry = new Date(entryDateStr).getTime();
  const tPts = Object.entries(tickerCumrets)
    .map(([d, v]) => ({ ms: new Date(d).getTime(), v }))
    .filter(p => p.ms >= entry)
    .sort((a, b) => a.ms - b.ms);

  if (tPts.length === 0) {
    ctx.fillStyle = LBL; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("No data yet", W / 2, H / 2);
    return;
  }

  const vBase = tPts[0].v;
  const tNorm = tPts.map(p => ({ ms: p.ms, v: (p.v / vBase) * 100 }));

  const allMs = tNorm.map(p => p.ms);
  const allV  = tNorm.map(p => p.v);
  if (!allMs.length) return;

  const msMin = Math.min(...allMs), msMax = Math.max(...allMs);
  const vMin  = Math.min(95, ...allV) * 0.99, vMax = Math.max(105, ...allV) * 1.01;

  const xOf = (ms: number) => PAD.l + ((ms - msMin) / Math.max(msMax - msMin, 1)) * CW;
  const yOf = (v: number)  => PAD.t + CH - ((v - vMin) / (vMax - vMin)) * CH;

  // Baseline 100% (entry) gridline
  ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(PAD.l, yOf(100)); ctx.lineTo(PAD.l + CW, yOf(100)); ctx.stroke();
  ctx.setLineDash([]);

  // Y-axis labels
  ctx.font = "9px ui-monospace, monospace"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let i = 0; i <= 2; i++) {
    const v = vMin + (i / 2) * (vMax - vMin), pct = v - 100;
    ctx.fillStyle = LBL;
    ctx.fillText(`${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, PAD.l - 4, yOf(v));
  }

  // X-axis labels
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = "9px system-ui, sans-serif";
  [0, 0.5, 1].forEach(frac => {
    const ms = msMin + frac * (msMax - msMin), d = new Date(ms);
    ctx.fillStyle = LBL;
    ctx.fillText(d.toLocaleDateString("en-US", { month: "short", year: frac === 0 || frac === 1 ? "2-digit" : undefined }), xOf(ms), PAD.t + CH + 18);
  });

  // Ticker line + fill
  if (tNorm.length >= 2) {
    const g = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + CH);
    g.addColorStop(0, "rgba(29,158,117,0.20)");
    g.addColorStop(1, "rgba(29,158,117,0)");
    ctx.beginPath(); ctx.moveTo(xOf(tNorm[0].ms), yOf(tNorm[0].v));
    tNorm.forEach(p => ctx.lineTo(xOf(p.ms), yOf(p.v)));
    ctx.lineTo(xOf(tNorm[tNorm.length - 1].ms), PAD.t + CH);
    ctx.lineTo(xOf(tNorm[0].ms), PAD.t + CH); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xOf(tNorm[0].ms), yOf(tNorm[0].v));
    tNorm.forEach(p => ctx.lineTo(xOf(p.ms), yOf(p.v)));
    ctx.strokeStyle = ACC; ctx.lineWidth = 2; ctx.stroke();
  }

  // Endpoint dot
  const last = tNorm[tNorm.length - 1];
  if (last) {
    ctx.beginPath(); ctx.arc(xOf(last.ms), yOf(last.v), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = ACC; ctx.fill();
    ctx.beginPath(); ctx.arc(xOf(last.ms), yOf(last.v), 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = BG; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

// ── MetricTooltip ─────────────────────────────────────────────────────────────
function MetricTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      style={{ position: "relative", lineHeight: 0, cursor: "default", flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, display: "block" }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
        <text x="8" y="12" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="sans-serif">i</text>
      </svg>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "var(--bg-primary)", border: "0.5px solid var(--border-default)", borderRadius: 8, padding: "8px 11px", width: 200, zIndex: 20, fontSize: 11, lineHeight: 1.55, color: "var(--text-secondary)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", pointerEvents: "none" }}>
          {text}
        </div>
      )}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, cursor: "pointer", flexShrink: 0, background: on ? "#185FA5" : "var(--border-default)", position: "relative", transition: "background 0.2s" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: on ? 18 : 2, transition: "left 0.2s" }} />
    </div>
  );
}

// ── PerfChart ─────────────────────────────────────────────────────────────────
function PerfChart({ series, rebalances }: { series: ChartSeries[]; rebalances: RebEvent[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [range, setRange] = useState<"3m"|"6m"|"1y"|"all">("3m");
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; port: number; spy: number; date: string } | null>(null);

  const filtered = useMemo(() => {
    let data = series;
    if (range !== "all" && series.length) {
      const last = new Date(series[series.length - 1].date);
      const days = range === "3m" ? 90 : range === "6m" ? 180 : 365;
      data = series.filter(d => (last.getTime() - new Date(d.date).getTime()) / 86400000 <= days);
    }
    if (range !== "all" && data.length > 0) {
      const bm = data[0].model, bs = data[0].spy;
      return data.map(d => ({ ...d, model: (d.model / bm) * 100, spy: (d.spy / bs) * 100 }));
    }
    return data;
  }, [series, range]);

  const redraw = useCallback((hi: number | null) => {
    const canvas = canvasRef.current;
    if (canvas && filtered.length >= 2) drawPerfChart(canvas, filtered, rebalances, hi);
  }, [filtered, rebalances]);

  useEffect(() => { redraw(hovIdx); }, [filtered, rebalances]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => redraw(hovIdx));
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [redraw, hovIdx]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || filtered.length < 2) return;
    const rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left;
    const PAD_L = 52, CW = canvas.clientWidth - PAD_L - 16;
    if (mx < PAD_L || mx > PAD_L + CW) { setHovIdx(null); setTip(null); return; }
    const idx = Math.max(0, Math.min(Math.round((mx - PAD_L) / CW * (filtered.length - 1)), filtered.length - 1));
    setHovIdx(idx); redraw(idx);
    const pt = filtered[idx];
    setTip({ x: Math.min(mx + 12, canvas.clientWidth - 160), port: (pt.model / 100 - 1) * 100, spy: (pt.spy / 100 - 1) * 100, date: pt.date });
  }, [filtered, redraw]);

  const handleLeave = useCallback(() => { setHovIdx(null); setTip(null); redraw(null); }, [redraw]);
  const pctStr = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: outfit, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", margin: 0 }}>Performance</p>
        <div style={{ display: "flex", background: "var(--bg-secondary)", padding: 2 }}>
          {(["3m","6m","1y","all"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding: "3px 11px", fontSize: 11, fontWeight: 500, fontFamily: outfit, color: range === r ? "var(--text-primary)" : "var(--text-tertiary)", background: range === r ? "var(--bg-primary)" : "none", border: "none", cursor: "pointer", letterSpacing: "0.04em", transition: "color .12s, background .12s" }}>{r.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", position: "relative" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: 260, cursor: "crosshair" }} onMouseMove={handleMouseMove} onMouseLeave={handleLeave} />
        {tip && (
          <div style={{ position: "absolute", top: 14, left: tip.x, pointerEvents: "none", background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", padding: "8px 12px", fontSize: 11, minWidth: 148, zIndex: 10 }}>
            <div style={{ color: "var(--text-tertiary)", marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{fmtDate(tip.date)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 3 }}>
              <span style={{ color: "var(--text-secondary)" }}>Portfolio</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600, color: "#1D9E75" }}>{pctStr(tip.port)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
              <span style={{ color: "var(--text-secondary)" }}>S&P 500</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{pctStr(tip.spy)}</span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 20, padding: "8px 16px", borderTop: "0.5px solid var(--border-subtle)" }}>
          {[
            { label: "Quantin Portfolio", stroke: "#1D9E75", dash: "" },
            { label: "S&P 500",           stroke: "#7090AA", dash: "4 3" },
            { label: "Rebalance",          stroke: "var(--border-subtle)", dash: "3 2", vert: true },
          ].map(({ label, stroke, dash, vert }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-secondary)" }}>
              {vert
                ? <svg width="12" height="10"><line x1="6" y1="0" x2="6" y2="10" stroke={stroke} strokeWidth="1" strokeDasharray={dash}/></svg>
                : <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={stroke} strokeWidth={dash ? 1.5 : 2} strokeDasharray={dash}/></svg>}
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ExpandPanel ───────────────────────────────────────────────────────────────
function ExpandPanel({ h, cumrets, onClose }: {
  h: PortfolioHolding;
  cumrets: Record<string, Record<string, number>>;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !h.entry_date) return;
    const draw = () => drawExpandChart(canvas, cumrets[h.ticker] ?? {}, h.entry_date!);
    draw();
    const obs = new ResizeObserver(draw);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [h, cumrets]);

  const perf = h.performance ?? h.performance_since_subscribed;
  const pos  = h.position ?? "long";
  const pct  = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  const confLabel = h.confidence != null ? `${Math.round(h.confidence * 100)}%` : "—";

  const stats = [
    { label: "Since entry", val: perf != null ? pct(perf) : "—", c: perf != null && perf > 0 ? "#1D9E75" : perf != null && perf < 0 ? "#B5621A" : undefined },
    { label: "Strategy",    val: h.strategy ?? "—",               c: undefined, small: true },
    { label: "Confidence",  val: confLabel,                        c: h.confidence != null && h.confidence >= 0.7 ? "#1D9E75" : h.confidence != null && h.confidence >= 0.5 ? "#B5621A" : "var(--text-tertiary)" },
    { label: "Position",    val: pos.charAt(0).toUpperCase() + pos.slice(1), c: pos === "long" ? "#1D9E75" : "var(--text-tertiary)" },
    { label: "Entry",       val: h.entry_date ? fmtMonthYear(h.entry_date) : "—", c: undefined },
  ];

  return (
    <div className="expand-panel" style={{ gridColumn: "1 / -1", background: "var(--bg-secondary)", borderTop: "2px solid #1D9E75", display: "grid", gridTemplateColumns: "1fr 184px", boxShadow: "inset 0 4px 16px rgba(0,0,0,0.18)" }}>
      {/* Chart side */}
      <div className="expand-chart" style={{ padding: "14px 16px 12px 14px", borderRight: "0.5px solid var(--border-subtle)", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>{h.ticker}</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{TICKER_NAMES[h.ticker]?.name ?? ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 10, color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="#1D9E75" strokeWidth="2"/></svg>
              Strategy return since entry
            </span>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: 150 }} />
        <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 14, padding: "4px 8px", fontFamily: outfit }}>✕</button>
      </div>
      {/* Stats side */}
      <div style={{ padding: "14px" }}>
        {stats.map(({ label, val, c, small }, i) => (
          <div key={label} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: i < stats.length - 1 ? "0.5px solid var(--border-subtle)" : "none" }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-tertiary)", marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: small ? "inherit" : "ui-monospace, monospace", fontSize: small ? 10 : 14, fontWeight: 700, letterSpacing: small ? 0 : "-0.02em", color: c ?? "var(--text-primary)", lineHeight: 1.3 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HoldingsGrid ──────────────────────────────────────────────────────────────
function HoldingsGrid({ holdings, cumrets }: {
  holdings: PortfolioHolding[];
  cumrets: Record<string, Record<string, number>>;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const COLS = isMobile ? 3 : 5;
  const maxPerf = useMemo(() =>
    Math.max(1, ...holdings.map(h => Math.abs(h.performance ?? h.performance_since_subscribed ?? 0))),
  [holdings]);

  const handleClick = (i: number) => setActiveIdx(prev => prev === i ? null : i);

  const nodes: React.ReactNode[] = [];
  holdings.forEach((h, i) => {
    const active = i === activeIdx;
    const perf   = h.performance ?? h.performance_since_subscribed;
    const pos    = h.position ?? "long";
    nodes.push(
      <div key={h.ticker} onClick={() => handleClick(i)} style={{ background: active ? "rgba(29,158,117,0.04)" : "var(--bg-primary)", outline: active ? "1px solid rgba(29,158,117,0.35)" : "none", outlineOffset: active ? "-1px" : 0, padding: "14px", cursor: "pointer", userSelect: "none", transition: "background 0.1s" }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 2 }}>{h.ticker}</div>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{TICKER_NAMES[h.ticker]?.name ?? ""}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: pos === "long" ? "#1D9E75" : "var(--text-tertiary)" }} />
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: pos === "long" ? "#1D9E75" : "var(--text-tertiary)" }}>{pos}</span>
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 7, color: perf != null && perf > 0 ? "#1D9E75" : perf != null && perf < 0 ? "#B5621A" : "var(--text-tertiary)" }}>
          {perf != null ? `${perf >= 0 ? "+" : ""}${perf.toFixed(1)}%` : "—"}
        </div>
        {perf != null && (
          <div style={{ height: 3, background: "var(--border-subtle)", marginBottom: 8, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min((Math.abs(perf) / maxPerf) * 100, 100)}%`, background: perf >= 0 ? "#1D9E75" : "#B5621A" }} />
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Since <span style={{ color: "var(--text-secondary)" }}>{h.entry_date ? fmtMonthYear(h.entry_date) : "—"}</span></div>
      </div>
    );

    if (activeIdx !== null) {
      const row = Math.floor(i / COLS), activeRow = Math.floor(activeIdx / COLS);
      const isLastInRow = i === holdings.length - 1 || Math.floor((i + 1) / COLS) !== row;
      if (row === activeRow && isLastInRow) {
        nodes.push(
          <ExpandPanel
            key="__expand"
            h={holdings[activeIdx]}
            cumrets={cumrets}
            onClose={() => setActiveIdx(null)}
          />
        );
      }
    }
  });

  return (
    <div className="holdings-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, background: "var(--border-subtle)", gap: 1, border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2rem" }}>
      {nodes}
    </div>
  );
}

// ── GeoComposition ────────────────────────────────────────────────────────────
function GeoComposition({ holdings }: { holdings: PortfolioHolding[] }) {
  const segs = useMemo(() => computeGeo(holdings), [holdings]);
  return <DonutChart title="Geographic Exposure" segs={segs} />;
}

// ── IndustryBars ──────────────────────────────────────────────────────────────
function IndustryBars({ holdings }: { holdings: PortfolioHolding[] }) {
  const segs = useMemo(() => computeInd(holdings), [holdings]);
  const maxP = Math.max(...segs.map(s => s.pct));
  return (
    <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", padding: "1.25rem", borderRadius: "var(--radius-lg)" }}>
      <p style={{ fontFamily: outfit, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 14, marginTop: 0 }}>Industry</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segs.map(s => (
          <div key={s.label}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 38px", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</div>
              <div style={{ height: 4, background: "var(--border-subtle)", position: "relative", borderRadius: 1 }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(s.pct / maxP) * 100}%`, background: s.color, borderRadius: 1 }} />
              </div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, fontWeight: 600, textAlign: "right", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.pct.toFixed(1)}%</div>
            </div>
            <div style={{ marginLeft: 118, display: "flex", gap: 5, paddingTop: 3, flexWrap: "wrap" }}>
              {s.tickers.map((t, ti) => (
                <span key={t} style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.03em" }}>
                  {t}{ti < s.tickers.length - 1 ? " ·" : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SectorComposition ─────────────────────────────────────────────────────────
function SectorComposition({ holdings }: { holdings: PortfolioHolding[] }) {
  const segs = useMemo(() => computeSec(holdings), [holdings]);
  return <DonutChart title="Sector" segs={segs} />;
}

// ── LastMovementsPanel ────────────────────────────────────────────────────────
interface Movement {
  id: number; date: string; ticker: string;
  from_state: "cash" | "buy"; to_state: "cash" | "buy";
  movement_type: "rebalance" | "strategy";
  return_pct: number | null;
}

function LastMovementsPanel() {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/portfolio_movements?limit=50&offset=0`)
      .then(r => r.json())
      .then(d => { if (mounted) { setMovements(d.movements || []); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
      Loading movements…
    </div>
  );
  if (movements.length === 0) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
      No movements yet.
    </div>
  );

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg)", border: "0.5px solid var(--border-subtle)", overflow: "hidden", marginBottom: "0.75rem" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                {["Date", "Ticker", "Movement", "Type", "Return"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: h === "Return" ? "right" : "left", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 20).map((m, i) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: i < Math.min(movements.length, 20) - 1 ? "0.5px solid var(--border-subtle)" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 16px", color: "var(--text-tertiary)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{m.date}</td>
                  <td style={{ padding: "10px 16px", fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-primary)" }}>{m.ticker}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{m.from_state === "cash" ? "CASH" : "BUY"}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>→</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: m.to_state === "buy" ? "var(--accent)" : "var(--danger-text)" }}>{m.to_state === "cash" ? "CASH" : "BUY"}</span>
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, padding: "3px 8px", borderRadius: "var(--radius-full)", background: m.movement_type === "rebalance" ? "rgba(52,211,153,0.1)" : "rgba(55,138,221,0.12)", color: m.movement_type === "rebalance" ? "var(--accent)" : "var(--blue-400)", border: `0.5px solid ${m.movement_type === "rebalance" ? "rgba(52,211,153,0.25)" : "rgba(55,138,221,0.25)"}` }}>
                      {m.movement_type === "rebalance" ? "Rebalance" : "Strategy"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    {m.return_pct === null
                      ? <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>—</span>
                      : <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13, color: m.return_pct >= 0 ? "var(--success-text)" : "var(--danger-text)" }}>{m.return_pct >= 0 ? "+" : ""}{m.return_pct.toFixed(2)}%</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <button
          onClick={() => navigate("/movements")}
          style={{ fontFamily: outfit, fontWeight: 400, fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.01em" }}
        >
          View full history →
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate();
  const { label: regimeLabel, colors: regimeColors } = useRegime();
  const [alerts, setAlerts] = useState(defaultAlerts);
  const toggle = (k: AlertKey) => setAlerts(a => ({ ...a, [k]: !a[k] }));
  const [authReady, setAuthReady] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [cancelState, setCancelState] = useState<"idle"|"confirming"|"loading"|"done">("idle");
  const [cancelEndsOn, setCancelEndsOn] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"composition" | "performance" | "movements">("composition");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const apiUrl = import.meta.env.VITE_API_URL || "";

    // Load public data immediately — no auth required
    fetch(`${apiUrl}/api/portfolio_optimizer`).then(r => r.json()).then(d => { if (mounted) setPortfolio(d); }).catch(() => {});
    fetch(`${apiUrl}/api/portfolio_optimizer/chart`).then(r => r.json()).then(d => { if (mounted) setChartData(d); }).catch(() => {});

    // Check auth in background for alerts personalization
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setAuthReady(true);
      if (!session?.user?.email) { setIsSubscriber(false); return; }
      setUserEmail(session.user.email);
      identify(session.user.email, { email: session.user.email });
      const { data, error } = await supabase.from("subscribers").select("id, created_at").eq("email", session.user.email).maybeSingle();
      if (!mounted) return;
      setIsSubscriber(error ? false : !!data);
      // Re-fetch personalized portfolio with subscriber's since date
      const since = data?.created_at ? data.created_at.split("T")[0] : null;
      if (since) {
        fetch(`${apiUrl}/api/portfolio_optimizer?since=${since}`).then(r => r.json()).then(d => { if (mounted) setPortfolio(d); }).catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") { setUserEmail(null); setIsSubscriber(false); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); setUserEmail(null); setIsSubscriber(false); };

  const handleCancelSubscription = async () => {
    setCancelState("loading");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setCancelState("idle"); return; }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    try {
      const res = await fetch(`${apiUrl}/api/cancel-subscription`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) throw new Error(await res.text());
      const { ends_on } = await res.json();
      setCancelEndsOn(ends_on ?? null);
      setCancelState("done");
      track("subscription_cancelled");
    } catch { setCancelState("confirming"); }
  };

  const [showWelcome] = useState(() => {
    const hasSid = new URLSearchParams(window.location.search).has("session_id");
    if (hasSid) track("paid", { plan: "monthly", amount: 25, currency: "USD" });
    return hasSid;
  });
  const [welcomeVisible, setWelcomeVisible] = useState(showWelcome);
  const dismissWelcome = () => { setWelcomeVisible(false); window.history.replaceState({}, "", "/portfolio"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>

      {welcomeVisible && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#ffffff", display: "flex", flexDirection: "column" }}>
          <nav style={{ height: 56, borderBottom: "0.5px solid #eee", display: "flex", alignItems: "center", padding: "0 2rem" }}><QuantinLogo iconSize={22} /></nav>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem 6rem", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #c0e0d4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
              <div style={{ width: 14, height: 14, background: "#1D9E75", borderRadius: "50%" }} />
            </div>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0F6E56", marginBottom: "0.9rem" }}>Payment confirmed</p>
            <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 44, color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.1 }}>you're in.</h1>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 16, color: "#888780", marginBottom: "2.25rem" }}>Welcome to Quantin. Your portfolio is ready.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0f8f4", border: "0.5px solid #c0e0d4", borderRadius: 100, padding: "6px 14px", marginBottom: "2.5rem" }}>
              <div style={{ width: 7, height: 7, background: regimeColors.dot, borderRadius: "50%" }} />
              <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: regimeColors.text }}>{regimeLabel ?? "Loading…"}</span>
            </div>
            <div style={{ width: 32, height: "0.5px", background: "#e0ddd8", marginBottom: "2.5rem" }} />
            <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", marginBottom: "3rem" }}>
              {(() => {
                const n = portfolio?.portfolio?.length;
                const lastRebDate = chartData?.rebalances?.[chartData.rebalances.length - 1]?.date;
                const nextReb = lastRebDate
                  ? new Date(new Date(lastRebDate).getTime() + 62 * 86400000)
                      .toLocaleString("en-US", { month: "short", year: "numeric" })
                  : "—";
                const annRet = portfolio?.validation?.metrics?.cagr;
                return [
                  { label: "Current picks",  val: n != null ? `${n} stocks` : "—" },
                  { label: "Next rebalance", val: nextReb },
                  { label: "Annual return",  val: annRet != null ? `+${annRet.toFixed(1)}%` : "—" },
                ];
              })().map(({ label, val }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 15, color: "#1e1e1c" }}>{val}</span>
                </div>
              ))}
            </div>
            <button onClick={dismissWelcome} style={{ background: "#0C447C", color: "#fff", border: "none", borderRadius: 8, padding: "13px 32px", fontFamily: outfit, fontWeight: 300, fontSize: 15, cursor: "pointer", marginBottom: "1rem" }}>View portfolio →</button>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#b4b2a9" }}>A confirmation was sent to your email</p>
          </div>
        </div>
      )}

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: 56, background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}><QuantinLogo iconSize={22} /></button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/movements")}>Movements</Button>
          {userEmail
            ? <Button variant="ghost" size="sm" onClick={() => navigate("/user")}>Account</Button>
            : <Button size="sm" onClick={() => navigate("/subscribe")}>Get alerts</Button>
          }
        </div>
      </nav>

      <style>{`
        @media (max-width: 600px) {
          .pie-grid        { grid-template-columns: 1fr !important; }
          .metrics-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .holdings-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .expand-panel    { grid-template-columns: 1fr !important; }
          .expand-chart    { border-right: none !important; border-bottom: 0.5px solid var(--border-subtle) !important; }
        }
      `}</style>
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem 6rem" }}>

        {SHOW_MAINTENANCE_BANNER && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#FEF9EC", border: "0.5px solid #E8C84A", borderRadius: 8, padding: "12px 16px", marginBottom: "1.75rem" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke="#C9A226" strokeWidth="1.2"/>
              <rect x="7.3" y="4.5" width="1.4" height="4.5" rx="0.7" fill="#C9A226"/>
              <rect x="7.3" y="10.5" width="1.4" height="1.4" rx="0.7" fill="#C9A226"/>
            </svg>
            <div>
              <p style={{ fontFamily: outfit, fontWeight: 500, fontSize: 13, color: "#7A5C00", margin: "0 0 3px" }}>Model update in progress</p>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#9A7C20", margin: 0, lineHeight: 1.5 }}>We're running a full portfolio recalculation. The data shown reflects the last validated state. Performance metrics and current holdings will be updated shortly.</p>
            </div>
          </div>
        )}

        {/* Regime pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--info-bg)", border: "0.5px solid var(--info-border)", borderRadius: 100, padding: "5px 13px", marginBottom: "1.5rem" }}>
          <div style={{ width: 7, height: 7, background: regimeColors.dot, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: regimeColors.text }}>{regimeLabel ?? "Loading…"}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 32, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>Active positions</h1>
          <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
            {chartData?.rebalances?.length
              ? `Last rebalance ${fmtDate(chartData.rebalances[chartData.rebalances.length - 1].date)}`
              : "Last rebalance —"}
          </span>
        </div>

        {/* Portfolio showcase — always visible */}
        <p style={{ fontFamily: outfit, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.75rem" }}>
          Holdings · {portfolio?.portfolio.length ?? "—"} positions · Equal weight
        </p>
        {portfolio && portfolio.portfolio.length > 0 && (
          <HoldingsGrid
            holdings={[...portfolio.portfolio].sort((a, b) => {
              if (!a.entry_date) return 1;
              if (!b.entry_date) return -1;
              return a.entry_date < b.entry_date ? -1 : a.entry_date > b.entry_date ? 1 : 0;
            })}
            cumrets={portfolio.ticker_cumrets ?? {}}
          />
        )}
        {!portfolio && (
          <div style={{ height: 240, background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13, marginBottom: "2rem" }}>
            Loading portfolio…
          </div>
        )}

        {/* Tab selector */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 4 }}>
          {(["composition", "performance", "movements"] as const).map(key => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, padding: "8px 0",
                borderRadius: "calc(var(--radius-lg) - 4px)",
                border: "none", cursor: "pointer",
                fontSize: 13, fontFamily: outfit,
                fontWeight: activeTab === key ? 600 : 300,
                background: activeTab === key ? "var(--bg-secondary)" : "transparent",
                color: activeTab === key ? "var(--text-primary)" : "var(--text-tertiary)",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {key === "movements" ? "Last Movements" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Composition tab */}
        {activeTab === "composition" && portfolio && portfolio.portfolio.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <div className="pie-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <SectorComposition holdings={portfolio.portfolio} />
              <GeoComposition    holdings={portfolio.portfolio} />
            </div>
            <IndustryBars holdings={portfolio.portfolio} />
          </div>
        )}

        {/* Performance tab */}
        {activeTab === "performance" && (() => {
          const p6  = portfolio?.period_metrics?.["6m"];
          const p12 = portfolio?.period_metrics?.["12m"];
          const lastReb = chartData?.rebalances?.[chartData.rebalances.length - 1];
          const movIn  = lastReb ? lastReb.added.length : null;
          const movOut = lastReb ? lastReb.dropped.length : null;
          const movLabel = movIn !== null ? `${movIn} in · ${movOut} out` : "—";

          const row6: { val: string; label: string; tooltip: string }[] = p6 ? [
            { val: `${p6.model.total  >= 0 ? "+" : ""}${p6.model.total.toFixed(1)}%`, label: "return · 6m",  tooltip: "Total return over the last 6 months." },
            { val: `${p6.model.max_dd.toFixed(1)}%`,                                    label: "max DD · 6m",  tooltip: "Largest peak-to-trough decline over the last 6 months." },
            { val: p6.model.sharpe.toFixed(2),                                           label: "Sharpe · 6m",  tooltip: "Risk-adjusted return over the last 6 months." },
            { val: movLabel,                                                              label: "last moves",   tooltip: "Tickers added and removed at the most recent rebalance." },
          ] : [
            { val: "—", label: "return · 6m", tooltip: "" }, { val: "—", label: "max DD · 6m", tooltip: "" },
            { val: "—", label: "Sharpe · 6m", tooltip: "" }, { val: "—", label: "last moves",  tooltip: "" },
          ];

          const row12: { val: string; label: string; tooltip: string }[] = p12 ? [
            { val: `${p12.model.total >= 0 ? "+" : ""}${p12.model.total.toFixed(1)}%`, label: "return · 1y",  tooltip: "Total return over the last 12 months." },
            { val: `${p12.model.max_dd.toFixed(1)}%`,                                   label: "max DD · 1y",  tooltip: "Largest peak-to-trough decline over the last 12 months." },
            { val: p12.model.sharpe.toFixed(2),                                          label: "Sharpe · 1y",  tooltip: "Risk-adjusted return over the last 12 months." },
          ] : [
            { val: "—", label: "return · 1y", tooltip: "" }, { val: "—", label: "max DD · 1y", tooltip: "" },
            { val: "—", label: "Sharpe · 1y", tooltip: "" },
          ];

          const MetricCell = ({ val, label, tooltip }: { val: string; label: string; tooltip: string }) => (
            <div>
              <div style={{ fontFamily: outfit, fontWeight: 200, fontSize: 26, color: val.startsWith("-") ? "var(--text-secondary)" : "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 5 }}>{val}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                {tooltip && <MetricTooltip text={tooltip} />}
              </div>
            </div>
          );

          return (
            <div>
              <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: "1.5rem", marginBottom: "2rem" }}>
                <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  {row6.map(m => <MetricCell key={m.label} {...m} />)}
                </div>
                <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
                  {row12.map(m => <MetricCell key={m.label} {...m} />)}
                  <div />
                </div>
              </div>
              {chartData && chartData.series.length > 1 && (
                <PerfChart series={chartData.series} rebalances={chartData.rebalances} />
              )}
            </div>
          );
        })()}

        {/* Last Movements tab */}
        {activeTab === "movements" && <LastMovementsPanel />}

        <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.75rem" }}>Alert settings</p>
        {isSubscriber ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "3rem" }}>
            {alertDefs.map(({ key, label, sub }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, opacity: 0.85 }}>{sub}</p>
                </div>
                <Toggle on={alerts[key]} onToggle={() => toggle(key)} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, padding: "1.25rem 1.5rem", borderRadius: "var(--radius-lg)", background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", marginBottom: "3rem" }}>
            <div>
              <p style={{ fontFamily: outfit, fontWeight: 500, fontSize: 14, color: "var(--text-primary)", margin: "0 0 4px" }}>Get real-time alerts</p>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
                Receive an email the moment the model makes a move — entries, exits, and rebalances.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate("/subscribe")}>Subscribe — $25/mo</Button>
          </div>
        )}

        {isSubscriber && (
          <>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>Subscription</p>
            <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
              {cancelState === "done" ? (
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                  Your subscription has been cancelled.{cancelEndsOn ? ` You'll have full access until ${cancelEndsOn}.` : ""}
                </p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, marginBottom: 2 }}>Cancel subscription</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                      {cancelState === "confirming" ? "Are you sure? Your access will continue until the end of the current period." : "You'll keep access until the end of the current billing period."}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {cancelState === "confirming" && (
                      <button onClick={() => setCancelState("idle")} style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, padding: "6px 14px", borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Keep subscription</button>
                    )}
                    <button onClick={cancelState === "idle" ? () => setCancelState("confirming") : handleCancelSubscription} disabled={cancelState === "loading"} style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, padding: "6px 14px", borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-default)", background: cancelState === "confirming" ? "#B5621A" : "transparent", color: cancelState === "confirming" ? "#fff" : "var(--text-tertiary)", cursor: cancelState === "loading" ? "not-allowed" : "pointer", opacity: cancelState === "loading" ? 0.6 : 1, transition: "all 0.15s" }}>
                      {cancelState === "loading" ? "Cancelling…" : cancelState === "confirming" ? "Yes, cancel" : "Cancel subscription"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}

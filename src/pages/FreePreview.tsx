import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";

// ── Maintenance banner ────────────────────────────────────────────────────────
const SHOW_MAINTENANCE_BANNER = false;

const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

// ── Sector / ticker metadata ──────────────────────────────────────────────────
const TICKER_NAMES: Record<string, { name: string; sector: string }> = {
  AAPL:  { name: "Apple",                    sector: "Technology"  },
  AMAT:  { name: "Applied Materials",         sector: "Technology"  },
  AMZN:  { name: "Amazon",                   sector: "Consumer"    },
  ANET:  { name: "Arista Networks",           sector: "Technology"  },
  ASML:  { name: "ASML Holding",             sector: "Technology"  },
  ACWI:  { name: "iShares MSCI ACWI",        sector: "ETF"         },
  ACWX:  { name: "iShares MSCI ACWI ex-US",  sector: "ETF"         },
  AVDV:  { name: "Avantis Intl Small Cap",   sector: "ETF"         },
  AVLV:  { name: "Avantis US Large Cap Val", sector: "ETF"         },
  BAR:   { name: "GraniteShares Gold",       sector: "Commodity"   },
  CEG:   { name: "Constellation Energy",     sector: "Utilities"   },
  COP:   { name: "ConocoPhillips",           sector: "Energy"      },
  CRWD:  { name: "CrowdStrike",              sector: "Technology"  },
  CSCO:  { name: "Cisco Systems",            sector: "Technology"  },
  DECK:  { name: "Deckers Outdoor",          sector: "Consumer"    },
  DFLV:  { name: "Dimensional US Val ETF",   sector: "ETF"         },
  DGRO:  { name: "iShares Div. Growth ETF",  sector: "ETF"         },
  EWY:   { name: "iShares MSCI South Korea", sector: "ETF"         },
  EWT:   { name: "iShares MSCI Taiwan",      sector: "ETF"         },
  FANG:  { name: "Diamondback Energy",       sector: "Energy"      },
  FNDB:  { name: "Schwab Fundamental US ETF",sector: "ETF"         },
  GDX:   { name: "VanEck Gold Miners",       sector: "Commodity"   },
  GE:    { name: "GE Aerospace",             sector: "Industrials" },
  GLD:   { name: "SPDR Gold Shares",         sector: "Commodity"   },
  GLDM:  { name: "SPDR Gold MiniShares",     sector: "Commodity"   },
  GRID:  { name: "Global Clean Energy ETF",  sector: "ETF"         },
  HSIC:  { name: "Henry Schein",             sector: "Healthcare"  },
  IAU:   { name: "iShares Gold Trust",       sector: "Commodity"   },
  ITUB:  { name: "Itaú Unibanco",            sector: "Financials"  },
  JPM:   { name: "JPMorgan Chase",           sector: "Financials"  },
  KLAC:  { name: "KLA Corporation",          sector: "Technology"  },
  LRCX:  { name: "Lam Research",             sector: "Technology"  },
  LLY:   { name: "Eli Lilly",               sector: "Healthcare"  },
  META:  { name: "Meta Platforms",           sector: "Technology"  },
  MGV:   { name: "Vanguard Mega Cap Value",  sector: "ETF"         },
  MSFT:  { name: "Microsoft",               sector: "Technology"  },
  MU:    { name: "Micron Technology",        sector: "Technology"  },
  NRG:   { name: "NRG Energy",              sector: "Utilities"   },
  NVDA:  { name: "NVIDIA",                  sector: "Technology"  },
  PBR:   { name: "Petrobras",               sector: "Energy"      },
  PGR:   { name: "Progressive",             sector: "Financials"  },
  RARE:  { name: "Ultragenyx Pharmaceutical",sector: "Healthcare"  },
  RYDAF: { name: "Shell (Royal Dutch)",      sector: "Energy"      },
  SCHD:  { name: "Schwab US Dividend ETF",   sector: "ETF"         },
  SGOL:  { name: "Aberdeen Gold ETF",        sector: "Commodity"   },
  SIVR:  { name: "Aberdeen Silver ETF",      sector: "Commodity"   },
  SLV:   { name: "iShares Silver Trust",     sector: "Commodity"   },
  SMH:   { name: "VanEck Semiconductor ETF", sector: "ETF"         },
  SPDW:  { name: "SPDR Dev World ex-US",     sector: "ETF"         },
  SPXL:  { name: "Direxion S&P 500 Bull 3x", sector: "ETF"        },
  TQQQ:  { name: "ProShares UltraPro QQQ",   sector: "ETF"        },
  TRGP:  { name: "Targa Resources",          sector: "Energy"      },
  TSM:   { name: "Taiwan Semiconductor",     sector: "Technology"  },
  VCSH:  { name: "Vanguard Short-Term Corp", sector: "ETF"         },
  VGSH:  { name: "Vanguard Short-Term Tsy",  sector: "ETF"         },
  VLUE:  { name: "iShares MSCI Value",       sector: "ETF"         },
  VST:   { name: "Vistra",                   sector: "Utilities"   },
  VTV:   { name: "Vanguard Value ETF",        sector: "ETF"        },
  VXUS:  { name: "Vanguard Total Intl",      sector: "ETF"         },
  WDC:   { name: "Western Digital",          sector: "Technology"  },
  XOM:   { name: "ExxonMobil",              sector: "Energy"      },
};

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

// ── Types ─────────────────────────────────────────────────────────────────────
interface PreviewHolding {
  ticker: string;
  weight: number;
  position?: string;
  performance?: number | null;
  entry_date?: string | null;
}
interface PreviewData {
  as_of: string;
  inception_date: string;
  holdings: PreviewHolding[];
  metrics: {
    total_return: number;
    spy_total_return: number;
    ratio_vs_spy: number | null;
    period_6m: number | null;
    max_dd: number;
  };
}
interface ChartPoint { date: string; model: number; spy: number; }
interface RebEvent   { date: string; added: string[]; dropped: string[]; held: string[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate      = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtMonthYear = (d: string) => new Date(d + "T00:00:00").toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase();
const cv = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// ── Canvas: performance chart ─────────────────────────────────────────────────
function drawPerfChart(
  canvas: HTMLCanvasElement, data: ChartPoint[], rebalances: RebEvent[], hovIdx: number | null
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

// ── Canvas: donut chart ───────────────────────────────────────────────────────
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
  ctx.fillText("pos", cx, cy + 8);
}

// ── PerfChart component ───────────────────────────────────────────────────────
function PerfChart({ series, rebalances }: { series: ChartPoint[]; rebalances: RebEvent[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; port: number; spy: number; date: string } | null>(null);

  const redraw = useCallback((hi: number | null) => {
    const canvas = canvasRef.current;
    if (canvas && series.length >= 2) drawPerfChart(canvas, series, rebalances, hi);
  }, [series, rebalances]);

  useEffect(() => { redraw(hovIdx); }, [series, rebalances]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => redraw(hovIdx));
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [redraw, hovIdx]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || series.length < 2) return;
    const rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left;
    const PAD_L = 52, CW = canvas.clientWidth - PAD_L - 16;
    if (mx < PAD_L || mx > PAD_L + CW) { setHovIdx(null); setTip(null); return; }
    const idx = Math.max(0, Math.min(Math.round((mx - PAD_L) / CW * (series.length - 1)), series.length - 1));
    setHovIdx(idx); redraw(idx);
    const pt = series[idx];
    setTip({ x: Math.min(mx + 12, canvas.clientWidth - 160), port: (pt.model / 100 - 1) * 100, spy: (pt.spy / 100 - 1) * 100, date: pt.date });
  }, [series, redraw]);

  const handleLeave = useCallback(() => { setHovIdx(null); setTip(null); redraw(null); }, [redraw]);
  const pctStr = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: outfit, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", margin: 0 }}>Performance</p>
      </div>
      <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", position: "relative" }}>
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: 260, cursor: "crosshair" }} onMouseMove={handleMouseMove} onMouseLeave={handleLeave} />
        {tip && (
          <div style={{ position: "absolute", top: 14, left: tip.x, pointerEvents: "none", background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", padding: "8px 12px", fontSize: 11, minWidth: 148, zIndex: 10 }}>
            <div style={{ color: "var(--text-tertiary)", marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{new Date(tip.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
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
            { label: "Rebalance",         stroke: "var(--border-subtle)", dash: "3 2", vert: true },
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

// ── DonutChart component ──────────────────────────────────────────────────────
function DonutChart({ title, segs }: { title: string; segs: DonutSeg[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current && segs.length) drawDonut(canvasRef.current, segs, hovIdx);
  }, [segs, hovIdx]);

  const hitTest = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 65, y = e.clientY - rect.top - 65;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < 30 || dist > 60) return null;
    let ang = Math.atan2(y, x) + Math.PI / 2;
    if (ang < 0) ang += Math.PI * 2;
    let cum = 0;
    for (let i = 0; i < segs.length; i++) {
      cum += (segs[i].pct / 100) * Math.PI * 2;
      if (ang < cum) return i;
    }
    return null;
  };

  return (
    <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", padding: "1.25rem", borderRadius: "var(--radius-lg)", position: "relative" }}>
      <p style={{ fontFamily: outfit, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 14, marginTop: 0 }}>{title}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", cursor: "default" }}
            onMouseMove={e => { const idx = hitTest(e); setHovIdx(idx); setTooltip(idx !== null ? { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null); }}
            onMouseLeave={() => { setHovIdx(null); setTooltip(null); }}
          />
          {hovIdx !== null && tooltip && segs[hovIdx] && (
            <div style={{ position: "absolute", left: tooltip.x + 10, top: tooltip.y - 10, background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)", borderRadius: 6, padding: "6px 9px", pointerEvents: "none", zIndex: 10, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: segs[hovIdx].color, marginBottom: 3 }}>{segs[hovIdx].label}</div>
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
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, opacity: hovIdx !== null && i !== hovIdx ? 0.4 : 1, transition: "opacity 0.12s" }}
              onMouseEnter={() => setHovIdx(i)} onMouseLeave={() => setHovIdx(null)}>
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

// ── MetricTooltip ─────────────────────────────────────────────────────────────
function MetricTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ position: "relative", lineHeight: 0, cursor: "default", flexShrink: 0 }}>
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

// ── HoldingsGrid ──────────────────────────────────────────────────────────────
function HoldingsGrid({ holdings }: { holdings: PreviewHolding[] }) {
  const COLS = 5;
  const maxPerf = useMemo(() =>
    Math.max(1, ...holdings.map(h => Math.abs(h.performance ?? 0))),
  [holdings]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, background: "var(--border-subtle)", gap: 1, border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2rem" }}>
      {holdings.map(h => {
        const perf = h.performance;
        const pos  = h.position ?? "long";
        return (
          <div key={h.ticker} style={{ background: "var(--bg-primary)", padding: "14px" }}>
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
      })}
    </div>
  );
}

// ── FreePreview ───────────────────────────────────────────────────────────────
export function FreePreview() {
  const navigate = useNavigate();
  const [data, setData]       = useState<PreviewData | null>(null);
  const [chartSeries, setChartSeries] = useState<ChartPoint[]>([]);
  const [rebalances, setRebalances]   = useState<RebEvent[]>([]);
  const [error, setError]     = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/portfolio_preview`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true));

    fetch(`${apiUrl}/api/portfolio_optimizer/chart`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setRebalances(d.rebalances ?? []);
        // will be filtered to preview date once data loads
        setChartSeries(d.series ?? []);
      })
      .catch(() => {});
  }, []);

  // Truncate chart to the preview date
  const filteredSeries = useMemo(() => {
    if (!chartSeries.length || !data?.as_of) return chartSeries;
    return chartSeries.filter(p => p.date <= data.as_of);
  }, [chartSeries, data?.as_of]);

  const filteredRebalances = useMemo(() => {
    if (!rebalances.length || !data?.as_of) return rebalances;
    return rebalances.filter(r => r.date <= data!.as_of);
  }, [rebalances, data?.as_of]);

  // Sector segments
  const sectorSegs = useMemo<DonutSeg[]>(() => {
    if (!data?.holdings.length) return [];
    const counts: Record<string, string[]> = {};
    data.holdings.forEach(h => { const s = TICKER_NAMES[h.ticker]?.sector ?? "Other"; (counts[s] ??= []).push(h.ticker); });
    return Object.entries(counts).sort((a, b) => b[1].length - a[1].length)
      .map(([label, tickers]) => ({ label, pct: (tickers.length / data.holdings.length) * 100, tickers, color: SEC_COLORS[label] ?? "#8A8F9A" }));
  }, [data]);

  const asOf = data ? fmtDate(data.as_of) : null;
  const m    = data?.metrics;

  const metrics = m ? [
    { val: `+${Math.round(m.total_return)}%`, label: "since inception", tooltip: `Total cumulative return of the portfolio from ${data?.inception_date} up to this snapshot.` },
    { val: m.ratio_vs_spy != null ? `×${m.ratio_vs_spy.toFixed(1)}` : "—", label: "vs S&P 500", tooltip: "How many times more the portfolio returned compared to the S&P 500 over the same period." },
    { val: m.period_6m != null ? `${m.period_6m >= 0 ? "+" : ""}${m.period_6m.toFixed(1)}%` : "—", label: "this period (6m)", tooltip: "Portfolio return over the 6 months leading up to this snapshot date." },
    { val: `−${Math.abs(m.max_dd).toFixed(1)}%`, label: "max drawdown", tooltip: "Largest peak-to-trough decline in portfolio value since inception.", dimmed: true },
  ] : [
    { val: "—", label: "since inception",  tooltip: "" },
    { val: "—", label: "vs S&P 500",       tooltip: "" },
    { val: "—", label: "this period (6m)", tooltip: "" },
    { val: "—", label: "max drawdown",     tooltip: "", dimmed: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: 56, background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
          <QuantinLogo iconSize={22} />
        </button>
        <Button size="sm" onClick={() => navigate("/signin?mode=signup")}>Get the portfolio — $25/mo</Button>
      </nav>

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
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#9A7C20", margin: 0, lineHeight: 1.5 }}>We're running a full portfolio recalculation. The data shown reflects the last validated state and will be updated shortly.</p>
            </div>
          </div>
        )}

        {/* Badge */}
        <div style={{ marginBottom: "1.25rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--info-bg)", border: "0.5px solid var(--info-border)", borderRadius: 100, padding: "3px 10px", fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--info-text)" }}>
            Free preview · 90 days ago
          </span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 32, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
            {asOf ? `Positions by ${asOf}` : "Loading…"}
          </h1>
          <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", letterSpacing: "0.02em" }}>
            Current picks are for subscribers
          </span>
        </div>

        {asOf && (
          <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            This is a historical snapshot of the portfolio as it stood 90 days ago ({asOf}). Positions and performance reflect that date — not today's.
          </p>
        )}

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "0.5px solid var(--border-subtle)", paddingTop: "1.5rem", marginBottom: "2rem" }}>
          {metrics.map(({ val, label, tooltip, dimmed }, i) => (
            <div key={label} style={{ paddingRight: i < 3 ? "1.5rem" : 0 }}>
              <div style={{ fontFamily: outfit, fontWeight: 200, fontSize: 26, color: dimmed ? "var(--text-secondary)" : "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 5 }}>{val}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                {tooltip && <MetricTooltip text={tooltip} />}
              </div>
            </div>
          ))}
        </div>

        {/* Performance chart */}
        {filteredSeries.length >= 2 && (
          <PerfChart series={filteredSeries} rebalances={filteredRebalances} />
        )}

        {/* Holdings grid */}
        {data && data.holdings.length > 0 ? (
          <HoldingsGrid holdings={data.holdings} />
        ) : !data && !error ? (
          <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "3rem", textAlign: "center", color: "var(--text-tertiary)", fontFamily: outfit, fontSize: 13, marginBottom: "2rem" }}>
            Loading…
          </div>
        ) : error ? (
          <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "3rem", textAlign: "center", color: "var(--text-tertiary)", fontFamily: outfit, fontSize: 13, marginBottom: "2rem" }}>
            Unable to load preview data.
          </div>
        ) : null}

        {/* Sector donut */}
        {sectorSegs.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <DonutChart title="Sector" segs={sectorSegs} />
          </div>
        )}

        {/* Paywall CTA */}
        <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 17, color: "var(--text-primary)", marginBottom: 4 }}>Ready to see the current 15?</p>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>Updated every 2 months · email alert on every change</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Button size="md" onClick={() => navigate("/signin?mode=signup")}>Get the portfolio — $25/mo</Button>
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>Cancel anytime · no commitment</span>
          </div>
        </div>

      </main>
    </div>
  );
}

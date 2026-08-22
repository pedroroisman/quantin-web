import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { track } from "../lib/analytics";

interface Movement {
  id: number;
  date: string;
  ticker: string;
  from_state: string;
  to_state: string;
  movement_type: "rebalance" | "strategy" | "regime_change";
  entry_date: string | null;
  entry_price: number | null;
  exit_price: number | null;
  return_pct: number | null;
  portfolio_impact_pct: number | null;
}

const REGIME_LABELS: Record<string, string> = {
  BULL_LOW_VOL: "Bull Low Vol", BULL_HIGH_VOL: "Bull High Vol",
  SIDEWAYS: "Sideways", BEAR: "Bear",
};

type TypeFilter = "all" | "rebalance" | "strategy" | "regime_change";
type DirectionFilter = "all" | "entry" | "exit";

function ReturnBadge({ value, impact }: { value: number | null; impact?: number | null }) {
  if (value === null) return <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>—</span>;
  const pos = value >= 0;
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13, color: pos ? "var(--success-text)" : "var(--danger-text)" }}>
        {pos ? "+" : ""}{value.toFixed(2)}%
      </span>
      {impact != null && (
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 11, color: impact >= 0 ? "var(--success-text)" : "var(--danger-text)", opacity: 0.7 }}>
          {impact >= 0 ? "+" : ""}{impact.toFixed(2)}% ptf
        </span>
      )}
    </span>
  );
}

function TypeBadge({ type }: { type: "rebalance" | "strategy" | "regime_change" }) {
  const cfg =
    type === "rebalance"    ? { bg: "rgba(52,211,153,0.1)",  color: "var(--accent)",   border: "rgba(52,211,153,0.25)",  label: "Rebalance" } :
    type === "regime_change"? { bg: "rgba(180,130,255,0.1)", color: "#b482ff",          border: "rgba(180,130,255,0.25)", label: "Regime" } :
                              { bg: "rgba(55,138,221,0.12)", color: "var(--blue-400)",  border: "rgba(55,138,221,0.25)",  label: "Strategy" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: "var(--radius-full)",
      background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function DirectionChip({ from, to }: { from: "cash" | "buy"; to: "cash" | "buy" }) {
  const isEntry = to === "buy";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 13,
      fontWeight: 500,
    }}>
      <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
        {from === "cash" ? "CASH" : "BUY"}
      </span>
      <span style={{ color: "var(--text-tertiary)" }}>→</span>
      <span style={{
        fontWeight: 700,
        color: isEntry ? "var(--accent)" : "var(--danger-text)",
      }}>
        {to === "cash" ? "CASH" : "BUY"}
      </span>
    </span>
  );
}

function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: "var(--radius-full)",
        border: active ? "none" : "0.5px solid var(--border-default)",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#0B1D33" : "var(--text-secondary)",
        fontWeight: active ? 700 : 400,
        fontSize: 13,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

const PAGE_SIZE = 50;

export function Movements() {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [offset, setOffset]       = useState(0);

  const [typeFilter, setTypeFilter]           = useState<TypeFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");

  useEffect(() => {
    let mounted = true;
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/portfolio_movements?limit=500&offset=0`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (mounted) {
          setMovements(data.movements || []);
          setTotal(data.total || 0);
          setLoading(false);
        }
      })
      .catch((e: any) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const filtered = movements.filter(m => {
    if (typeFilter !== "all" && m.movement_type !== typeFilter) return false;
    if (directionFilter === "entry" && m.to_state !== "buy") return false;
    if (directionFilter === "exit"  && m.to_state !== "cash") return false;
    return true;
  });

  const paginated = filtered.slice(offset, offset + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  useEffect(() => { track("movements_viewed"); }, []);

  const handleTypeFilter = (f: TypeFilter) => { setTypeFilter(f); setOffset(0); track("movements_filter_changed", { type: f, direction: directionFilter }); };
  const handleDirFilter  = (f: DirectionFilter) => { setDirectionFilter(f); setOffset(0); track("movements_filter_changed", { type: typeFilter, direction: f }); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        background: "var(--bg-primary)",
        borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
          <QuantinLogo iconSize={22} />
        </button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/portfolio")}>Portfolio</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/user")}>Account</Button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h2 style={{ marginBottom: 4 }}>Model Movements</h2>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
            Every trade the model has made — rebalances and strategy signals.
            {!loading && ` ${total.toLocaleString()} total movements.`}
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          marginBottom: "1.25rem",
          padding: "12px 16px",
          background: "var(--bg-primary)",
          borderRadius: "var(--radius-lg)",
          border: "0.5px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginRight: 4 }}>Type</span>
            <FilterPill label="All"       active={typeFilter === "all"}           onClick={() => handleTypeFilter("all")} />
            <FilterPill label="Rebalance" active={typeFilter === "rebalance"}     onClick={() => handleTypeFilter("rebalance")} />
            <FilterPill label="Strategy"  active={typeFilter === "strategy"}      onClick={() => handleTypeFilter("strategy")} />
            <FilterPill label="Regime"    active={typeFilter === "regime_change"} onClick={() => handleTypeFilter("regime_change")} />
          </div>
          <div style={{ width: "0.5px", background: "var(--border-subtle)", margin: "0 4px" }} />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginRight: 4 }}>Direction</span>
            <FilterPill label="All"     active={directionFilter === "all"}   onClick={() => handleDirFilter("all")} />
            <FilterPill label="Entries" active={directionFilter === "entry"} onClick={() => handleDirFilter("entry")} />
            <FilterPill label="Exits"   active={directionFilter === "exit"}  onClick={() => handleDirFilter("exit")} />
          </div>
          {filtered.length !== movements.length && (
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-tertiary)", alignSelf: "center" }}>
              {filtered.length} shown
            </span>
          )}
        </div>

        {/* Table */}
        <div style={{
          background: "var(--bg-primary)",
          borderRadius: "var(--radius-lg)",
          border: "0.5px solid var(--border-subtle)",
          overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
              Loading movements…
            </div>
          ) : error ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--danger-text)", fontSize: 14 }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
              No movements match the selected filters.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                    {["Date", "Ticker", "Movement", "Type", "Return"].map(h => (
                      <th key={h} style={{
                        padding: "10px 16px",
                        textAlign: h === "Return" ? "right" : "left",
                        fontSize: 11, fontWeight: 600,
                        color: "var(--text-tertiary)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((m, i) => (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: i < paginated.length - 1 ? "0.5px solid var(--border-subtle)" : "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 16px", color: "var(--text-tertiary)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {m.date}
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, letterSpacing: "0.04em", color: m.movement_type === "regime_change" ? "var(--text-tertiary)" : "var(--text-primary)" }}>
                        {m.ticker}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        {m.movement_type === "regime_change" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{REGIME_LABELS[m.from_state] ?? m.from_state}</span>
                            <span style={{ color: "var(--text-tertiary)" }}>→</span>
                            <span style={{ fontWeight: 700, color: "#b482ff" }}>{REGIME_LABELS[m.to_state] ?? m.to_state}</span>
                          </span>
                        ) : (
                          <DirectionChip from={m.from_state as "cash" | "buy"} to={m.to_state as "cash" | "buy"} />
                        )}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <TypeBadge type={m.movement_type} />
                      </td>
                      <td style={{ padding: "11px 16px", textAlign: "right" }}>
                        <ReturnBadge value={m.return_pct} impact={m.to_state === "cash" ? m.portfolio_impact_pct : null} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: "1.25rem" }}>
            <Button
              variant="ghost" size="sm"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
            >
              ← Prev
            </Button>
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost" size="sm"
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= filtered.length}
            >
              Next →
            </Button>
          </div>
        )}

      </div>

      <style>{`
        @media (max-width: 600px) {
          table th:nth-child(4), table td:nth-child(4) { display: none; }
        }
      `}</style>
    </div>
  );
}

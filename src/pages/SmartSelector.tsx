import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, QuantinLogo } from "../components/ui";

type ResultStatus = "adds-value" | "no-value" | "pending";

interface TickerResult {
  ticker: string;
  status: ResultStatus;
  modelCagr?: number;
  bhCagr?: number;
  alpha?: number;
  confidence?: number;
  reason?: string;
}

// Simulated analysis results
const MOCK_RESULTS: Record<string, TickerResult> = {
  NVDA: { ticker: "NVDA", status: "adds-value", modelCagr: 38.4, bhCagr: 32.1, alpha: 6.3, confidence: 82 },
  AMZN: { ticker: "AMZN", status: "adds-value", modelCagr: 29.7, bhCagr: 24.3, alpha: 5.4, confidence: 71 },
  MSFT: { ticker: "MSFT", status: "adds-value", modelCagr: 24.1, bhCagr: 21.4, alpha: 2.7, confidence: 58 },
  NKE:  { ticker: "NKE",  status: "no-value", reason: "Nike's returns are driven by macro and brand factors the model doesn't capture better than passive exposure." },
  COIN: { ticker: "COIN", status: "no-value", reason: "High volatility crypto-correlated ticker. The model's regime detection doesn't improve on buy & hold for this asset class." },
  TSLA: { ticker: "TSLA", status: "no-value", reason: "Tesla's price action is driven by sentiment and news cycles the quantitative model cannot anticipate." },
};

function TickerInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
      placeholder={placeholder}
      style={{
        width: 80, textAlign: "center", letterSpacing: "0.06em",
        fontWeight: 500, fontSize: 14, padding: "10px 8px",
        border: "0.5px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-primary)", color: "var(--text-primary)", outline: "none",
      }}
      onFocus={e => e.target.style.borderColor = "#185FA5"}
      onBlur={e => e.target.style.borderColor = "var(--border-default)"}
    />
  );
}

function SignalBar({ value }: { value: number }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 4, borderRadius: 2, background: "var(--border-subtle)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 2, background: "#185FA5" }} />
      </div>
      <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 3 }}>
        Signal confidence: {value} / 100
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: TickerResult }) {
  const adds = result.status === "adds-value";

  return (
    <div style={{
      border: `0.5px solid ${adds ? "var(--success-border)" : "var(--border-subtle)"}`,
      borderRadius: "var(--radius-md)",
      padding: "1rem 1.25rem",
      background: adds ? "var(--success-bg)" : "var(--bg-secondary)",
      display: "flex", gap: 14, alignItems: "flex-start",
    }}>
      <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
        {adds ? "✓" : "✗"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{result.ticker}</span>
          <span style={{
            fontSize: 11, fontWeight: 500, borderRadius: 4, padding: "2px 7px",
            background: adds ? "var(--success-bg)" : "var(--bg-primary)",
            color: adds ? "var(--success-text)" : "var(--text-tertiary)",
            border: `0.5px solid ${adds ? "var(--success-border)" : "var(--border-default)"}`,
          }}>
            {adds ? "Model adds value" : "Not recommended"}
          </span>
        </div>

        {adds ? (
          <>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
              Consistent alpha over buy & hold. The model captures regime transitions
              well on this ticker.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { l: "Model CAGR", v: `+${result.modelCagr}%`, c: "var(--success-text)" },
                { l: "Buy & hold", v: `+${result.bhCagr}%`,    c: "var(--text-secondary)" },
                { l: "Alpha",      v: `+${result.alpha}pp`,     c: "var(--success-text)" },
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <SignalBar value={result.confidence!} />
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
              {result.reason}
            </p>
            <div style={{
              fontSize: 12, color: "var(--text-tertiary)",
              padding: "8px 12px", background: "var(--bg-primary)",
              borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-subtle)",
            }}>
              We won't charge for this ticker. No alpha, no fee.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function SmartSelector() {
  const navigate = useNavigate();
  const [tickers, setTickers] = useState(["", "", "", "", ""]);
  const [results, setResults] = useState<TickerResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filled = tickers.filter(t => t.trim().length > 0);
  const charged = results?.filter(r => r.status === "adds-value").length ?? 0;

  const analyze = () => {
    if (filled.length === 0) return;
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      const res = filled.map(t => MOCK_RESULTS[t] ?? {
        ticker: t, status: "no-value" as ResultStatus,
        reason: "Insufficient history or low liquidity for this ticker.",
      });
      setResults(res);
      setLoading(false);
    }, 1400);
  };

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
          onClick={() => navigate("/portfolio")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
        >
          <QuantinLogo iconSize={22} />
        </button>
        <Badge variant="default">Add-on · subscribers only</Badge>
      </nav>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "3rem 2rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
              Smart Selector
            </p>
            <h1 style={{ fontSize: 22, marginBottom: 0 }}>Run the model on your stocks</h1>
          </div>
          <div style={{
            background: "var(--bg-secondary)", border: "0.5px solid var(--border-default)",
            borderRadius: "var(--radius-full)", padding: "4px 12px",
            fontSize: 12, fontWeight: 500, color: "var(--text-secondary)",
          }}>
            $5 per analysis · up to 5 tickers
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.65, maxWidth: 520, marginBottom: "2rem" }}>
          Already have a stock in mind? Enter up to 5 tickers and Quantin runs its full
          model on each one. We only charge for stocks where the model adds value.{" "}
          <strong style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            No alpha, no fee.
          </strong>
        </p>

        {/* Input */}
        <div style={{
          background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", padding: "1.5rem", marginBottom: "1.5rem",
        }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Enter up to 5 tickers
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {tickers.map((t, i) => (
              <TickerInput
                key={i}
                value={t}
                placeholder={["AAPL", "TSLA", "COIN", "AMZN", "NKE"][i]}
                onChange={v => setTickers(prev => prev.map((x, j) => j === i ? v : x))}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Button
              size="md"
              onClick={analyze}
              disabled={filled.length === 0 || loading}
            >
              {loading ? "Analyzing..." : `Analyze ${filled.length > 0 ? filled.length : ""} stock${filled.length !== 1 ? "s" : ""} →`}
            </Button>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              You'll only be charged for tickers where the model adds value
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)", fontSize: 13 }}>
            Running walk-forward model on {filled.join(", ")}...
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", margin: 0 }}>
                Results
              </p>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {charged} of {results.length} tickers add value ·{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  charged: ${charged}
                </span>
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "2rem" }}>
              {results.map(r => <ResultCard key={r.ticker} result={r} />)}
            </div>

            {charged > 0 && (
              <div style={{
                padding: "1.25rem", background: "var(--bg-primary)",
                border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-md)",
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                  Pricing — only pay for value
                </p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.65 }}>
                  {charged} ticker{charged !== 1 ? "s" : ""} added value,{" "}
                  {results.length - charged} didn't. You'll be charged for {charged} only — ${charged}.
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty state hint */}
        {!results && !loading && (
          <div style={{
            padding: "2rem", textAlign: "center",
            border: "0.5px dashed var(--border-default)", borderRadius: "var(--radius-lg)",
          }}>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
              Enter tickers above and click Analyze to see the model's assessment
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>
              Try: NVDA · AMZN · NKE · COIN · TSLA
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { QuantinLogo } from "../components/QuantinLogo";
import { track } from "../lib/analytics";

const crimson  = "'Crimson Pro', 'Georgia', 'Times New Roman', serif";

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--text-tertiary)",
  marginBottom: "1rem",
  display: "block",
};

export function Whitepaper() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <QuantinLogo iconSize={20} fontWeight={400} />
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => { track("whitepaper_nav_about"); navigate("/about"); }}>About</Button>
          <Button variant="primary" size="sm" onClick={() => { track("whitepaper_nav_portfolio"); navigate("/portfolio"); }}>View Portfolio</Button>
        </div>
      </nav>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "5rem 1.5rem 8rem" }}>

        {/* Title block */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span style={{ ...sectionLabel, display: "block", textAlign: "center", marginBottom: "1.5rem" }}>Research</span>
          <h1 style={{
            fontFamily: crimson, fontWeight: 600,
            fontSize: "clamp(20px, 4vw, 26px)", lineHeight: 1.3,
            color: "var(--text-primary)", margin: "0 0 1.25rem",
          }}>
            Systematic Equity Selection:<br />Walk-Forward Performance, 2018–2026
          </h1>
          <p style={{ fontFamily: crimson, fontSize: 14, color: "var(--text-tertiary)", margin: "0 0 4px" }}>Quantin.finance</p>
          <p style={{ fontFamily: crimson, fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>November 2026</p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid var(--border-subtle)", marginBottom: "3rem" }} />

        {/* Abstract */}
        <div style={{
          margin: "0 0 3rem",
          padding: "1.5rem 1.75rem",
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border-subtle)",
          borderRadius: 12,
        }}>
          <span style={{ display: "block", textAlign: "center", fontFamily: crimson, fontWeight: 600, fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "1rem" }}>Abstract</span>
          <p style={{ fontFamily: crimson, fontSize: 15.5, lineHeight: 1.75, color: "var(--text-secondary)", margin: 0, textAlign: "justify", hyphens: "auto" } as React.CSSProperties}>
            We present the out-of-sample performance record of a systematic, walk-forward equity selection strategy operated across U.S.-listed securities from February 2018 to November 2026. The strategy rebalances every 42 trading days, selecting 15 holdings from a universe of several hundred liquid equities and ETFs using a regime-aware signal. All 53 rebalance periods are strictly out-of-sample: holdings for each period are determined using only information available on the rebalance date, with no future data entering any period's selection. Over the full record the strategy compounds at 22.95% per annum against 14.15% for the S&amp;P 500, with a maximum peak-to-trough drawdown of 10.3% against 33.7% for the benchmark, and an annualized Sharpe ratio of 1.69 against 0.79. No calendar year produced a negative return. All figures are gross of fees and transaction costs; limitations are discussed in Section 6.
          </p>
        </div>

        <Section n="1" title="Introduction">
          <P>Walk-forward validation is the natural analogue of held-out testing applied to investment strategies. At each rebalance, the model is re-estimated using only data available up to that date; the resulting portfolio is held for the following period; and the return on that period is recorded as an out-of-sample observation. The claim that a strategy performs well in walk-forward testing is weaker than the claim that it performed well in live deployment—the strategy was designed with knowledge that the market existed over this period—but it is substantially stronger than in-sample backtesting, in which the entire history is used both to construct and to evaluate the same set of rules.</P>
          <P>This paper presents that record across 53 consecutive, non-overlapping rebalance periods spanning approximately 8.75 years. The purpose is not to claim that the future will resemble this period, but to give investors a complete, honestly annotated account of the strategy's behaviour under conditions it has actually encountered: strong bull markets (2019, 2021), a sharp crash and recovery (2020), a sustained bear market (2022), and a volatile expansion (2026 YTD).</P>
        </Section>

        <Section n="2" title="Strategy">
          <P>At each rebalance the strategy selects 15 securities from a universe of several hundred liquid U.S.-listed equities, sector and factor ETFs, and fixed-income instruments. Holdings are equal-weighted at the rebalance date and held until the next. The rebalance interval is 42 trading days, approximately two calendar months.</P>
          <P>Selection is driven by a two-stage process. The first stage classifies the prevailing market regime using a three-component ensemble: a set of rule-based trend and volatility filters (40% weight), a k-means clustering model (45% weight), and a Gaussian hidden Markov model (15% weight). These three detectors vote on each trading day, and the weighted sum determines whether the regime is classified as <em>Bear</em>; if not, the k-means component distinguishes between <em>Bull High-Volatility</em> and <em>Bull Low-Volatility</em>. The second stage selects the 15 holdings using a purely statistical signal: each security is scored by a weighted average of its Sharpe ratio across multiple lookback windows, computed on data available strictly before the rebalance date. The regime classification affects which securities are eligible and how the signal is weighted, but the final selection is deterministic given the inputs. No gradient-based or supervised learning methods are used in the selection step. The specific parameters and threshold values are proprietary; this paper evaluates the outputs alone.</P>
        </Section>

        <Section n="3" title="Out-of-Sample Validity">
          <P>Each of the 53 rebalance periods satisfies the following conditions. First, the signal for period <em>t</em> is computed using data with timestamps strictly before the rebalance date of period <em>t</em>. Second, the regime model's parameters are re-estimated at each rebalance; no parameters estimated on data from period <em>t</em> onward enter the construction of period <em>t</em>'s holdings. Third, the security universe is defined by liquidity and listing criteria evaluated as of the rebalance date.</P>
          <P>These conditions together imply that any investor with access to the same data feed could have implemented the identical holdings on each rebalance date. They do not imply that the strategy was run live; the equity curve in Figure 1 is a hypothetical record. The strategy was designed with knowledge that U.S. equities existed over this period and that certain statistical regularities have been documented in the literature. This introduces a form of look-ahead at the design stage that is not captured by the walk-forward protocol—a standard limitation of all systematic strategy research, addressed further in Section 6.</P>
        </Section>

        <Section n="4" title="Performance">
          <Subsection title="4.1 Cumulative return">
            <P>Figure 1 plots the indexed cumulative return of the strategy and the S&amp;P 500 from February 2018 to 12 November 2026, with both series initialized at 100. Over the full period the strategy grew to 605, against 317 for the benchmark. The divergence is concentrated in three intervals: 2020 (the COVID-19 drawdown and recovery), 2022 (the sustained equity decline), and the first half of 2026, in each of which the strategy substantially outperformed the benchmark. In 2019 and 2021—both strong calendar years for the S&amp;P 500—the strategy underperformed, though it remained positive in both years.</P>

            {/* Figure 1 — SVG equity curve */}
            <div style={{ margin: "1.5rem 0 0.5rem" }}>
              <svg viewBox="0 0 590 265" xmlns="http://www.w3.org/2000/svg" aria-label="Figure 1: cumulative indexed return" style={{ width: "100%", display: "block" }}>
                {/* Axes */}
                <line x1="60" y1="22" x2="60" y2="226" stroke="var(--border-default)" strokeWidth="1.2"/>
                <line x1="60" y1="226" x2="565" y2="226" stroke="var(--border-default)" strokeWidth="1.2"/>
                {/* Y ticks & labels */}
                {[
                  { y: 205, label: "100" }, { y: 172, label: "200" }, { y: 139, label: "300" },
                  { y: 105, label: "400" }, { y: 72, label: "500"  }, { y: 39, label: "600"  },
                ].map(({ y, label }) => (
                  <g key={label}>
                    <line x1="55" y1={y} x2="60" y2={y} stroke="var(--border-default)" strokeWidth="1"/>
                    <line x1="60" y1={y} x2="565" y2={y} stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="2,4"/>
                    <text x="52" y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-tertiary)" fontFamily="system-ui">{label}</text>
                  </g>
                ))}
                {/* X ticks & labels */}
                {[
                  { x: 115.6, label: "2018" }, { x: 226.7, label: "2020" }, { x: 337.8, label: "2022" },
                  { x: 448.9, label: "2024" }, { x: 560, label: "Nov 26" },
                ].map(({ x, label }) => (
                  <g key={label}>
                    <line x1={x} y1="226" x2={x} y2="231" stroke="var(--border-default)" strokeWidth="1"/>
                    <text x={x} y="244" textAnchor="middle" fontSize="10" fill="var(--text-tertiary)" fontFamily="system-ui">{label}</text>
                  </g>
                ))}
                {/* Y axis label */}
                <text transform="rotate(-90,14,124)" x="14" y="124" textAnchor="middle" fontSize="10" fill="var(--text-tertiary)" fontFamily="system-ui">Indexed return (Feb 2018 = 100)</text>
                {/* SPY dashed */}
                <polyline
                  points="60,205 115.6,207 171.1,197 226.7,190 282.2,176 337.8,186 393.3,174 448.9,157 504.4,143 560,133"
                  fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="6,4" strokeLinejoin="round"/>
                {/* Strategy solid */}
                <polyline
                  points="60,205 115.6,204 171.1,202 226.7,178 282.2,169 337.8,162 393.3,149 448.9,128 504.4,107 560,38"
                  fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round"/>
                {/* Legend */}
                <line x1="72" y1="42" x2="102" y2="42" stroke="var(--accent)" strokeWidth="2.2"/>
                <text x="107" y="46" fontSize="11" fill="var(--text-secondary)" fontFamily="system-ui">Strategy</text>
                <line x1="72" y1="58" x2="102" y2="58" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="6,4"/>
                <text x="107" y="62" fontSize="11" fill="var(--text-secondary)" fontFamily="system-ui">S&amp;P 500</text>
              </svg>
              <p style={{ fontFamily: crimson, fontSize: 13, color: "var(--text-tertiary)", marginTop: 8, lineHeight: 1.5 }}>
                <strong style={{ color: "var(--text-secondary)" }}>Figure 1.</strong> Indexed cumulative return of the strategy (solid) and S&amp;P 500 (dashed), February 2018 to 12 November 2026. Both series initialized at 100 on the first rebalance date. Returns are gross of fees and transaction costs.
              </p>
            </div>
          </Subsection>

          <Subsection title="4.2 Annual returns">
            <P>Table 1 reports calendar-year returns for each full year and for 2026 year-to-date. The strategy produced a positive return in all nine periods. The largest negative relative performance against the benchmark occurred in 2019 (−24.1 percentage points), when the S&amp;P 500 advanced 31.2% and the strategy returned 7.2%. The largest positive relative performance occurred in 2020 (+44.5pp), when the strategy's regime signal reduced exposure through the February–March drawdown and re-entered aggressively through the recovery, producing a full-year return of +62.9%.</P>

            <AnnualTable />

            <p style={{ fontFamily: crimson, fontSize: 13, color: "var(--text-tertiary)", margin: "4px 0 1.5rem", lineHeight: 1.5 }}>
              † January to 12 November 2026. Max DD is the maximum peak-to-trough drawdown within each calendar year, measured on daily portfolio valuations.
            </p>
            <p style={{ fontFamily: crimson, fontSize: 13, color: "var(--text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
              <strong>Table 1.</strong> Calendar-year returns, return difference in percentage points, and maximum intra-year drawdown. All returns are gross of fees and transaction costs.
            </p>
          </Subsection>
        </Section>

        <Section n="5" title="Risk">
          <P>Table 2 compares full-period risk statistics for the strategy and the S&amp;P 500. The strategy's maximum drawdown over the full period is 10.3%, compared with 33.7% for the benchmark—a reduction of 23.4 percentage points. The annualized Sharpe ratio of 1.69 against 0.79 reflects both the higher return and the substantially lower volatility of the strategy. The Calmar ratio, defined as the CAGR divided by the absolute maximum drawdown, stands at 2.24.</P>

          <RiskTable />

          <p style={{ fontFamily: crimson, fontSize: 13, color: "var(--text-tertiary)", margin: "4px 0 1rem", lineHeight: 1.5 }}>
            Sharpe ratio computed on daily returns against a zero risk-free rate and annualized. Maximum drawdown is the maximum peak-to-trough decline measured on daily portfolio valuations over the full period.
          </p>
          <p style={{ fontFamily: crimson, fontSize: 13, color: "var(--text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
            <strong>Table 2.</strong> Full-period risk and return statistics for the strategy and the S&amp;P 500.
          </p>

          <P>The strategy's drawdown profile is notably contained. In no calendar year did the maximum intra-year drawdown exceed 10.2% (see Table 1, column "Max DD"). The worst year by this measure was 2021, in which a 15.0% return was accompanied by a maximum drawdown of 10.2%. The 2022 intra-year drawdown of 5.9%—against a full-year S&amp;P 500 drawdown of approximately 25%—illustrates the regime mechanism's primary function: the hidden Markov model classified the period as bearish and shifted the portfolio toward lower-beta exposures well before the benchmark's trough.</P>
        </Section>

        <Section n="6" title="Limitations">
          <P><em>Transaction costs and market impact.</em> All figures are gross of brokerage commissions, bid-ask spreads, and market impact. At a rebalance frequency of 42 trading days with 15 equal-weighted holdings, the implied turnover is moderate but not negligible. Net returns will be lower than reported. No estimate of these costs is provided here because the precise reduction depends on the execution method, custody arrangement, and position size.</P>
          <P><em>Design-stage hindsight.</em> The walk-forward protocol ensures that no future data enters the construction of any period's holdings. It does not ensure that the strategy's design is free of look-ahead: the selection of the hidden Markov model, the signal family, and the universe construction rules was informed by knowledge of the asset-pricing literature and the general behaviour of U.S. equity markets over prior decades. This introduces a form of overfitting at the design stage that is not captured by the out-of-sample periods alone, and is a limitation shared by all published systematic strategy research.</P>
          <P><em>Concentration and universe constraints.</em> Holdings are concentrated in 15 securities, implying material idiosyncratic risk in each period. The eligible universe, while broad, is tilted toward U.S.-listed instruments, with limited systematic exposure to international equities or non-equity asset classes.</P>
          <P><em>Period length and regime coverage.</em> The 53 rebalance periods span 8.75 years and represent at most two to three distinct macroeconomic regimes. The strategy's strong performance in 2020 and 2022 reflects its design objective, but a prolonged low-volatility bull market of the 2013–2017 variety is underrepresented in the record. The 2019 and 2021 results (−24.1pp and −13.8pp relative to the benchmark, respectively) illustrate the cost of regime-awareness in momentum-driven environments.</P>
          <P><em>Partial year 2026.</em> The 2026 YTD return of 50.9% over approximately 10.5 months is unusually large and reflects significant exposure to the semiconductor and technology sector during a period of strong sector performance. The regime model's current classification as of November 2026 is bearish, implying a materially different portfolio posture entering any continuation of the record.</P>
        </Section>

        <Section n="7" title="Conclusion">
          <P>Over 53 consecutive out-of-sample rebalance periods from February 2018 to November 2026, the strategy compounded at 22.95% per annum with a maximum drawdown of 10.3% and a Sharpe ratio of 1.69. The principal source of outperformance relative to the S&amp;P 500 is the strategy's behaviour in adverse periods: it produced positive absolute returns in 2018 (when the benchmark fell 6.7%), 2022 (when the benchmark fell 18.2%), and 2020 (when the benchmark's intra-year drawdown reached 34%), in each case due to defensive repositioning initiated by the regime signal.</P>
          <P>These results are consistent with the design objective of the regime-aware signal: to participate in rising markets while reducing drawdown in adverse conditions, at the cost of some upside capture in momentum-driven environments. Whether this trade-off is well-suited to an investor's specific requirements depends on their return target, drawdown tolerance, time horizon, and existing portfolio exposures. This paper makes no recommendation; it presents the record and its limitations, and leaves the allocation decision to the investor.</P>
        </Section>

        {/* Disclosure */}
        <div style={{
          marginTop: "4rem", paddingTop: "1.25rem",
          borderTop: "0.5px solid var(--border-subtle)",
        }}>
          <p style={{ fontFamily: crimson, fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6, textAlign: "justify" } as React.CSSProperties}>
            <strong>Disclosure.</strong> This document is provided for informational purposes only. It does not constitute investment advice, an offer to sell, or a solicitation of an offer to buy any security. Past performance is not indicative of future results. All returns are gross of fees, transaction costs, and taxes. The performance record presented is based on a walk-forward simulation; it is not a live audited track record. This document is intended for sophisticated investors who understand the risks of systematic strategies and have the financial capacity to absorb potential losses. © 2026 Quantin.finance.
          </p>
        </div>

      </main>
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────── */

const crimson2 = "'Crimson Pro', 'Georgia', 'Times New Roman', serif";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2 style={{
        fontFamily: crimson2, fontWeight: 600,
        fontSize: 17.5, color: "var(--text-primary)",
        margin: "0 0 0.75rem",
      }}>
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{
        fontFamily: crimson2, fontWeight: 400, fontStyle: "italic",
        fontSize: 16, color: "var(--text-primary)",
        margin: "1.5rem 0 0.75rem",
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: crimson2, fontSize: 15.5, lineHeight: 1.75,
      color: "var(--text-secondary)", margin: "0 0 1em",
      textAlign: "justify", hyphens: "auto",
    } as React.CSSProperties}>
      {children}
    </p>
  );
}

function AnnualTable() {
  const rows = [
    { year: "2018",         strat: "+3.7%",  spy: "−6.7%",  diff: "+10.4", dd: "−4.0%" },
    { year: "2019",         strat: "+7.2%",  spy: "+31.2%", diff: "−24.1", dd: "−3.8%" },
    { year: "2020",         strat: "+62.9%", spy: "+18.4%", diff: "+44.5", dd: "−8.1%" },
    { year: "2021",         strat: "+15.0%", spy: "+28.7%", diff: "−13.8", dd: "−10.2%" },
    { year: "2022",         strat: "+9.8%",  spy: "−18.2%", diff: "+28.0", dd: "−5.9%" },
    { year: "2023",         strat: "+18.4%", spy: "+26.2%", diff: "−7.8",  dd: "−4.0%" },
    { year: "2024",         strat: "+25.1%", spy: "+24.9%", diff: "+0.2",  dd: "−5.3%" },
    { year: "2025",         strat: "+18.5%", spy: "+17.7%", diff: "+0.8",  dd: "−9.1%" },
    { year: "2026 (YTD)†",  strat: "+50.9%", spy: "+11.9%", diff: "+39.0", dd: "−9.5%" },
  ];

  const th: React.CSSProperties = {
    fontFamily: crimson2, fontWeight: 600, fontSize: 14,
    padding: "6px 10px", textAlign: "right",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    fontFamily: crimson2, fontSize: 14.5,
    padding: "5px 10px", textAlign: "right",
    color: "var(--text-secondary)",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div style={{ overflowX: "auto", margin: "1rem 0 0.5rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
        <thead>
          <tr style={{ borderTop: "1.5px solid var(--border-strong)", borderBottom: "0.5px solid var(--border-default)" }}>
            <th style={{ ...th, textAlign: "left" }}>Year</th>
            <th style={th}>Strategy</th>
            <th style={th}>S&amp;P 500</th>
            <th style={th}>Diff (pp)</th>
            <th style={th}>Max DD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.year} style={i === rows.length - 1 ? { borderBottom: "1.5px solid var(--border-strong)" } : {}}>
              <td style={{ ...td, textAlign: "left" }}>{r.year}</td>
              <td style={td}>{r.strat}</td>
              <td style={td}>{r.spy}</td>
              <td style={td}>{r.diff}</td>
              <td style={td}>{r.dd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskTable() {
  const rows = [
    { metric: "CAGR",                                      strat: "22.95%",  spy: "14.15%" },
    { metric: "Total return (Feb 2018 – Nov 2026)",         strat: "+505%",   spy: "+217%" },
    { metric: "Annualized Sharpe ratio",                    strat: "1.69",    spy: "0.79"  },
    { metric: "Maximum drawdown (full period)",             strat: "−10.3%",  spy: "−33.7%" },
    { metric: "Calmar ratio (CAGR / |Max DD|)",             strat: "2.24",    spy: "0.42"  },
    { metric: "Negative calendar years",                    strat: "0 of 9",  spy: "2 of 9" },
  ];

  const th: React.CSSProperties = {
    fontFamily: crimson2, fontWeight: 600, fontSize: 14,
    padding: "6px 10px", textAlign: "right",
    color: "var(--text-secondary)", whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    fontFamily: crimson2, fontSize: 14.5,
    padding: "5px 10px", textAlign: "right",
    color: "var(--text-secondary)",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div style={{ overflowX: "auto", margin: "1rem 0 0.5rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
        <thead>
          <tr style={{ borderTop: "1.5px solid var(--border-strong)", borderBottom: "0.5px solid var(--border-default)" }}>
            <th style={{ ...th, textAlign: "left" }}>Metric</th>
            <th style={th}>Strategy</th>
            <th style={th}>S&amp;P 500</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.metric} style={i === rows.length - 1 ? { borderBottom: "1.5px solid var(--border-strong)" } : {}}>
              <td style={{ ...td, textAlign: "left" }}>{r.metric}</td>
              <td style={td}>{r.strat}</td>
              <td style={td}>{r.spy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

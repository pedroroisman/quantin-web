import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { track } from "../lib/analytics";

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

export function About() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: outfit }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 56,
        background: "var(--bg-primary)", borderBottom: "0.5px solid var(--border-subtle)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <span
          style={{ fontFamily: playfair, fontSize: 18, fontWeight: 400, cursor: "pointer", color: "var(--text-primary)" }}
          onClick={() => navigate("/")}
        >
          Quantin
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/about/join")}>Join the team</Button>
          <Button variant="primary" size="sm" onClick={() => navigate("/portfolio")}>View Portfolio</Button>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "5rem 2rem 8rem" }}>

        {/* 1 — Mission */}
        <section style={{ marginBottom: "5rem" }}>
          <p style={{ fontFamily: outfit, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", marginBottom: "1rem" }}>Mission</p>
          <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 36, lineHeight: 1.2, color: "var(--text-primary)", margin: 0 }}>
            Systematic investing<br />for the individual investor.
          </h1>
        </section>

        {/* 2 — The model */}
        <section style={{ marginBottom: "5rem" }}>
          <p style={{ fontFamily: outfit, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", marginBottom: "1.25rem" }}>The model</p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", margin: "0 0 1rem" }}>
            Quantin runs a walk-forward portfolio optimizer — the same class of quantitative model used by institutional funds — updated on a six-week rebalance cycle with no lookahead bias and no subjective inputs.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-secondary)", margin: 0 }}>
            The output is a 15-position equal-weight portfolio of US equities, driven entirely by signal. Every position is either long or in T-bills. No leverage. No guesswork.
          </p>
        </section>

        {/* 3 — Numbers */}
        <section style={{ marginBottom: "5rem" }}>
          <p style={{ fontFamily: outfit, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", marginBottom: "1.5rem" }}>Track record</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {[
              { value: "+28.1%", label: "Annual return" },
              { value: "1.84",   label: "Sharpe ratio" },
              { value: "+12.9pp", label: "vs S&P 500" },
            ].map(({ value, label }) => (
              <div key={label} style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)", borderRadius: 12, padding: "1.25rem 1.5rem" }}>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: "1rem", lineHeight: 1.6 }}>
            Walk-forward backtest · US equities · No lookahead bias · Past performance does not guarantee future results.
          </p>
        </section>

        {/* 4 — Team */}
        <section style={{ marginBottom: "5rem" }}>
          <p style={{ fontFamily: outfit, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", marginBottom: "1.5rem" }}>Team</p>

          {/* Pedro */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "2.5rem" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: "#1B2A3E", border: "0.5px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: outfit, fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "0.05em",
            }}>PR</div>
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", margin: "0 0 4px" }}>Author & Founder</p>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Pedro Roisman Ferreira</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
                {[
                  "MSc Candidate Business & Technology · ITBA",
                  "Geoengineering · AGH Kraków",
                  "Data Science · DH",
                  "Founder · Martha (AR · US · CA · PR · ES · CL · UY)",
                  "Author · Quantin Engine",
                ].map(tag => (
                  <span key={tag} style={{
                    fontSize: 11, color: "var(--text-secondary)",
                    background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)",
                    borderRadius: 6, padding: "3px 10px",
                  }}>{tag}</span>
                ))}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
                Builds and maintains the quantitative model — the walk-forward optimizer, signal selection, and portfolio construction. Also leads product, investor relations, and broker partnerships.
              </p>
            </div>
          </div>

          {/* Building */}
          <div style={{ background: "var(--bg-secondary)", border: "0.5px dashed var(--border-subtle)", borderRadius: 12, padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Building the science team</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)", margin: "0 0 1rem" }}>
              We're assembling a small team of quantitative scientists and engineers — people who think in models, not opinions.
            </p>
            <span
              onClick={() => { track("click_join_team", { source: "about" }); navigate("/about/join"); }}
              style={{ fontSize: 13, color: "var(--accent)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              See open positions →
            </span>
          </div>
        </section>

        {/* 5 — Contact */}
        <section>
          <p style={{ fontFamily: outfit, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", marginBottom: "1rem" }}>Contact</p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", margin: "0 0 0.5rem" }}>
            For investor inquiries, partnerships, or press:
          </p>
          <a
            href="mailto:contact@quantin.finance"
            onClick={() => track("click_contact_email", { source: "about" })}
            style={{ fontSize: 16, color: "var(--text-primary)", textDecoration: "none", borderBottom: "0.5px solid var(--border-default)" }}
          >
            contact@quantin.finance
          </a>
        </section>

      </main>
    </div>
  );
}

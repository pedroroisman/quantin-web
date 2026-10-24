import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { track } from "../lib/analytics";

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

const ROLES = [
  {
    id: "scientist",
    title: "Quantitative Scientist",
    type: "Part-time · Remote",
    description: "Design and validate investment strategies, build and document backtests, and develop the signal layer that powers the optimizer. You'll work directly with the founder on the model that's already in production.",
    requirements: [
      "Strong background in mathematics, physics, statistics, or engineering",
      "Experience with time-series analysis and financial data",
      "Proficiency in Python (pandas, numpy, scipy)",
      "Ability to communicate model assumptions and results clearly",
    ],
    nice: "Experience with portfolio optimization, factor models, or quantitative finance research.",
  },
  {
    id: "backend",
    title: "Back-end Developer",
    type: "Part-time · Remote",
    description: "Build and maintain the infrastructure connecting Quantin to brokers — APIs, token management, position sync, and data pipelines. Security and reliability are the priority.",
    requirements: [
      "Experience integrating third-party financial APIs",
      "Proficiency in Python or Node.js",
      "Solid understanding of OAuth flows and token management",
      "Comfortable with Supabase or similar serverless backends",
    ],
    nice: "Experience with SnapTrade, Plaid, or broker APIs (IBKR, Alpaca).",
  },
];

export function JoinTeam() {
  const navigate = useNavigate();
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleOpen = (id: string) => {
    setOpenRole(id);
    setForm(f => ({ ...f, role: id }));
    track("job_opened", { role: id });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role) return;
    track("job_applied", { role: form.role, email: form.email });
    await fetch("/api/job-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => {});
    setSent(true);
  };

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
        <Button variant="ghost" size="sm" onClick={() => navigate("/about")}>← About</Button>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "5rem 2rem 8rem" }}>

        <p style={{ fontFamily: outfit, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", marginBottom: "1rem" }}>Open positions</p>
        <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 32, lineHeight: 1.2, color: "var(--text-primary)", margin: "0 0 1rem" }}>
          Building the science team.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)", margin: "0 0 3.5rem" }}>
          We're a small team building quantitative infrastructure for individual investors. We move fast, work in the open, and think in models. If you want to work on something that's already in production and growing, read on.
        </p>

        {/* Role cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
          {ROLES.map(role => (
            <div
              key={role.id}
              style={{
                background: "var(--bg-secondary)", border: `0.5px solid ${openRole === role.id ? "var(--accent)" : "var(--border-subtle)"}`,
                borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s",
              }}
            >
              <div
                style={{ padding: "1.25rem 1.5rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => handleOpen(openRole === role.id ? "" : role.id)}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{role.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{role.type}</div>
                </div>
                <span style={{ fontSize: 18, color: "var(--text-tertiary)", transition: "transform 0.15s", display: "inline-block", transform: openRole === role.id ? "rotate(45deg)" : "none" }}>+</span>
              </div>

              {openRole === role.id && (
                <div style={{ padding: "0 1.5rem 1.5rem", borderTop: "0.5px solid var(--border-subtle)" }}>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", margin: "1.25rem 0 1.25rem" }}>{role.description}</p>
                  <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", margin: "0 0 0.75rem" }}>We're looking for</p>
                  <ul style={{ margin: "0 0 1.25rem", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
                    {role.requirements.map(r => (
                      <li key={r} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>{r}</li>
                    ))}
                  </ul>
                  {role.nice && (
                    <p style={{ fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>Nice to have: {role.nice}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Application form */}
        <div style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)", borderRadius: 12, padding: "1.75rem 1.5rem" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: 20, marginBottom: "0.75rem" }}>✓</div>
              <p style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 600, margin: "0 0 0.5rem" }}>Application received.</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>We'll be in touch at {form.email}.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 1.25rem" }}>Apply</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                />
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  style={{ ...inputStyle, color: form.role ? "var(--text-primary)" : "var(--text-tertiary)" }}
                >
                  <option value="" disabled>Role you're applying for</option>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                <textarea
                  placeholder="Tell us about yourself — background, what you're building, what excites you about systematic investing."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                >
                  Send application
                </Button>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
  borderRadius: 8, outline: "none",
  fontFamily: "'Outfit', sans-serif", fontSize: 14,
  color: "var(--text-primary)", boxSizing: "border-box",
};

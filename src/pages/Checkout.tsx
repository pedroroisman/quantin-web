import { useState, useEffect } from "react";
import { useRegime } from "../hooks/useRegime";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

const checkItems = [
  { label: "Current 15 picks",  sub: "The portfolio updated this period, ready to invest." },
  { label: "Rebalance alerts",  sub: "Email + push every time a stock enters or exits." },
  { label: "Full history",      sub: "Every past selection and its performance." },
  { label: "Regime indicator",  sub: "Live market regime to contextualize positions." },
];

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  padding: "11px 14px", fontSize: 14,
  background: "var(--bg-primary)", color: "var(--text-primary)", outline: "none",
  fontFamily: outfit, fontWeight: 300,
};

export function Checkout() {
  const navigate = useNavigate();
  const { label: regimeLabel, colors: regimeColors } = useRegime();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) { navigate("/signin?mode=signup"); return; }
      const { data } = await supabase
        .from("subscribers")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();
      if (data) { navigate("/portfolio"); return; }
      setEmail(session.user.email);
      setSessionChecked(true);
    });
  }, [navigate]);

  if (!sessionChecked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
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
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
        >
          <QuantinLogo iconSize={22} />
        </button>
        <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>
          Secure checkout
        </span>
      </nav>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 2rem 6rem" }}>

        <p style={{
          fontFamily: outfit, fontWeight: 300, fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.12em",
          color: "#0F6E56", marginBottom: "0.4rem",
        }}>
          Quantin
        </p>
        <h1 style={{
          fontFamily: playfair, fontWeight: 400, fontSize: 30,
          color: "var(--text-primary)", marginBottom: "0.4rem", lineHeight: 1.2,
        }}>
          Get the portfolio
        </h1>
        <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 14, color: "var(--text-tertiary)", marginBottom: "2.5rem" }}>
          Cancel anytime. No commitment.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2.5rem", alignItems: "start" }}>

          {/* Left — form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{
                display: "block", fontFamily: outfit, fontWeight: 300,
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#1D9E75", marginBottom: 6,
              }}>
                Email
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "1.5rem" }}>
              You'll enter your card details on Stripe's secure page.
            </p>

            <Button
              type="submit"
              size="lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Processing..." : "Subscribe — $25/month"}
            </Button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "0.9rem" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
                Secured by Stripe · cancel anytime
              </span>
            </div>
          </form>

          {/* Right — summary */}
          <div>
            <div style={{
              background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)", padding: "1.25rem",
            }}>
              <p style={{
                fontFamily: outfit, fontWeight: 300, fontSize: 10,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#1D9E75", marginBottom: "1rem",
              }}>
                What you get
              </p>

              {checkItems.map(({ label, sub }) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, background: "#1D9E75", borderRadius: "50%", flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-primary)", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}

              <hr style={{ border: "none", borderTop: "0.5px solid var(--border-subtle)", margin: "1.25rem 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)" }}>Monthly</span>
                <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 22, color: "var(--text-primary)" }}>$25</span>
              </div>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                Billed monthly · cancel anytime
              </p>

              <hr style={{ border: "none", borderTop: "0.5px solid var(--border-subtle)", margin: "1.25rem 0" }} />

              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.65, margin: 0 }}>
                Cancel anytime from your account settings. No commitment, no lock-in.
              </p>
            </div>

            {/* Regime pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: "1rem",
              padding: "6px 14px",
              background: "#f0f8f4", border: "0.5px solid #c0e0d4",
              borderRadius: 100,
            }}>
              <div style={{ width: 7, height: 7, background: regimeColors.dot, borderRadius: "50%", flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: regimeColors.text, margin: 0 }}>
                  Current regime: {regimeLabel ?? "Loading…"}
                </p>
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "#1D9E75", margin: 0 }}>
                  Historically the strongest period for the model
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

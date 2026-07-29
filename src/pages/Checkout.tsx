import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";

type Billing = "monthly" | "annual";

const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

const individualFeatures = [
  { label: "Current 15 picks",  sub: "The portfolio updated every rebalance period." },
  { label: "Rebalance alerts",  sub: "Email every time a stock enters or exits." },
  { label: "Full history",      sub: "Every past selection and its performance." },
  { label: "Regime indicator",  sub: "Live market regime to contextualize positions." },
  { label: "14 days free",      sub: "Full access from day one. No charge until day 15." },
];

const enterpriseFeatures = [
  { label: "Everything in B2B",      sub: "Full portfolio access for your team." },
  { label: "Custom seat count",      sub: "Scale to your entire organization." },
  { label: "Dedicated onboarding",   sub: "White-glove setup and training." },
  { label: "Flexible invoicing",     sub: "Billing tailored to your needs." },
];

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "0.5px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  padding: "10px 12px", fontSize: 13,
  background: "var(--bg-primary)", color: "var(--text-primary)",
  outline: "none", fontFamily: outfit, fontWeight: 300,
};

const lbl: React.CSSProperties = {
  display: "block", fontFamily: outfit, fontWeight: 300,
  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
  color: "#1D9E75", marginBottom: 5,
};

function Dot({ muted }: { muted?: boolean }) {
  return <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, marginTop: 5, background: muted ? "var(--text-tertiary)" : "#1D9E75" }} />;
}

export function Checkout() {
  const navigate = useNavigate();
  const [billing, setBilling]         = useState<Billing>("monthly");
  const [email, setEmail]             = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  // Individual
  const [indLoading, setIndLoading]   = useState(false);

  // B2B
  const [seats, setSeats]             = useState(5);
  const [b2bCompany, setB2bCompany]   = useState("");
  const [b2bLoading, setB2bLoading]   = useState(false);
  const [b2bSuccess, setB2bSuccess]   = useState(false);

  // Enterprise
  const [showEnt, setShowEnt]         = useState(false);
  const [entName, setEntName]         = useState("");
  const [entCompany, setEntCompany]   = useState("");
  const [entEmail, setEntEmail]       = useState("");
  const [entUsers, setEntUsers]       = useState("");
  const [entMessage, setEntMessage]   = useState("");
  const [entLoading, setEntLoading]   = useState(false);
  const [entSent, setEntSent]         = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) { navigate("/signin?mode=signup"); return; }
      const { data } = await supabase
        .from("subscribers").select("id")
        .eq("email", session.user.email).maybeSingle();
      if (data) { navigate("/portfolio"); return; }
      setEmail(session.user.email);
      setSessionChecked(true);
      track("view_checkout", { email: session.user.email });
    });
  }, [navigate]);

  if (!sessionChecked) return null;

  const apiUrl = import.meta.env.VITE_API_URL || "";

  const handleIndividual = async () => {
    setIndLoading(true);
    try {
      track("checkout_started", { plan: "individual", billing, email });
      const res = await fetch(`${apiUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan: "individual", billing }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setIndLoading(false);
    }
  };

  const handleB2B = async (e: React.FormEvent) => {
    e.preventDefault();
    setB2bLoading(true);
    try {
      track("checkout_started", { plan: "b2b", billing, seats, email });
      const res = await fetch(`${apiUrl}/api/create-b2b-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: b2bCompany, seats, billing }),
      });
      if (!res.ok) throw new Error(await res.text());
      setB2bSuccess(true);
    } catch (err) {
      console.error("B2B checkout error:", err);
    } finally {
      setB2bLoading(false);
    }
  };

  const handleEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/contact-enterprise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entName, company: entCompany, email: entEmail, estimated_users: entUsers, message: entMessage }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEntSent(true);
    } catch (err) {
      console.error("Enterprise error:", err);
    } finally {
      setEntLoading(false);
    }
  };

  const moPrice    = billing === "monthly" ? 25 : 20;
  const b2bPrice   = billing === "monthly" ? 20 : 15;
  const b2bTotal   = b2bPrice * seats;

  const card: React.CSSProperties = {
    background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)", padding: "1.75rem",
    display: "flex", flexDirection: "column",
  };

  const cardFeatured: React.CSSProperties = {
    ...card, border: "1px solid #1D9E75",
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
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
          <QuantinLogo iconSize={22} />
        </button>
        <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>Pricing</span>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 2rem 6rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0F6E56", marginBottom: "0.4rem" }}>
            Quantin
          </p>
          <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 32, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
            Choose your plan
          </h1>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)", borderRadius: 100, padding: 3 }}>
            {(["monthly", "annual"] as Billing[]).map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: "6px 20px", borderRadius: 100, border: "none", cursor: "pointer",
                fontFamily: outfit, fontWeight: 300, fontSize: 13,
                background: billing === b ? "var(--bg-primary)" : "transparent",
                color: billing === b ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: billing === b ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}>
                {b === "monthly" ? "Monthly" : (
                  <span>Annual <span style={{ color: "#1D9E75" }}>–20%</span></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", alignItems: "start" }}>

          {/* ── Individual ── */}
          <div style={card}>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
              Individual
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 42, color: "var(--text-primary)" }}>${moPrice}</span>
              <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", marginLeft: 4 }}>/mo</span>
              {billing === "annual" && (
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Billed $240/yr</p>
              )}
            </div>

            <div style={{ flex: 1, marginBottom: "1.5rem" }}>
              {individualFeatures.map(({ label, sub }) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <Dot />
                  <div>
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-primary)", marginBottom: 1 }}>{label}</p>
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" style={{ width: "100%", justifyContent: "center" }} disabled={indLoading} onClick={handleIndividual}>
              {indLoading ? "Processing…" : "Start free trial →"}
            </Button>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 8 }}>
              14 days free · no charge until day 15
            </p>
          </div>

          {/* ── B2B ── */}
          <div style={cardFeatured}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1D9E75" }}>B2B</p>
              <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, background: "#e8f7f2", color: "#1D9E75", borderRadius: 100, padding: "2px 10px" }}>
                Most popular
              </span>
            </div>

            {b2bSuccess ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2rem 0" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e8f7f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 20, color: "var(--text-primary)", marginBottom: 8 }}>Invoice sent</p>
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>
                  Check <strong>{email}</strong> for your invoice.<br />Payment due in 30 days.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "1.25rem" }}>
                  <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 42, color: "var(--text-primary)" }}>${b2bPrice}</span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", marginLeft: 4 }}>/seat/mo</span>
                  {billing === "annual" && (
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Billed ${b2bPrice * 12}/seat/yr</p>
                  )}
                </div>

                <form onSubmit={handleB2B} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={lbl}>Company</label>
                    <input style={inp} placeholder="Acme Capital" required value={b2bCompany} onChange={e => setB2bCompany(e.target.value)} />
                  </div>

                  <div>
                    <label style={lbl}>
                      Seats <span style={{ color: "var(--text-tertiary)", textTransform: "none", letterSpacing: 0 }}>(min 5)</span>
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button type="button" onClick={() => setSeats(s => Math.max(5, s - 1))} style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", cursor: "pointer", fontSize: 18, color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>−</button>
                      <span style={{ fontFamily: outfit, fontWeight: 400, fontSize: 18, minWidth: 28, textAlign: "center" }}>{seats}</span>
                      <button type="button" onClick={() => setSeats(s => s + 1)} style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", cursor: "pointer", fontSize: 18, color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
                    </div>
                  </div>

                  {/* Price summary */}
                  <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: billing === "annual" ? 4 : 0 }}>
                      <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)" }}>
                        {seats} seats × ${b2bPrice}/mo
                      </span>
                      <span style={{ fontFamily: outfit, fontWeight: 400, fontSize: 14, color: "var(--text-primary)" }}>${b2bTotal}/mo</span>
                    </div>
                    {billing === "annual" && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>Billed annually</span>
                        <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#1D9E75" }}>${b2bTotal * 12}/yr</span>
                      </div>
                    )}
                  </div>

                  <Button type="submit" size="lg" style={{ width: "100%", justifyContent: "center" }} disabled={b2bLoading}>
                    {b2bLoading ? "Processing…" : "Get invoice →"}
                  </Button>
                  <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 0 }}>
                    Invoice sent to {email} · net 30
                  </p>
                </form>
              </>
            )}
          </div>

          {/* ── Enterprise ── */}
          <div style={card}>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
              Enterprise
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 42, color: "var(--text-primary)" }}>Custom</span>
            </div>

            <div style={{ flex: 1, marginBottom: "1.5rem" }}>
              {enterpriseFeatures.map(({ label, sub }) => (
                <div key={label} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <Dot muted />
                  <div>
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-primary)", marginBottom: 1 }}>{label}</p>
                    <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowEnt(v => !v)}>
              Contact us →
            </Button>
          </div>
        </div>

        {/* Enterprise contact form */}
        {showEnt && (
          <div style={{
            marginTop: "2rem", background: "var(--bg-primary)",
            border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)",
            padding: "2rem", maxWidth: 560, marginLeft: "auto",
          }}>
            {entSent ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 22, color: "var(--text-primary)", marginBottom: 8 }}>Thanks — we'll be in touch.</p>
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>We usually respond within one business day.</p>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 20, color: "var(--text-primary)", marginBottom: "1.5rem" }}>Get in touch</p>
                <form onSubmit={handleEnterprise} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={lbl}>Name</label>
                      <input style={inp} placeholder="Jane Smith" required value={entName} onChange={e => setEntName(e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Company</label>
                      <input style={inp} placeholder="Acme Capital" required value={entCompany} onChange={e => setEntCompany(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={lbl}>Email</label>
                      <input style={inp} type="email" placeholder="jane@acmecapital.com" required value={entEmail} onChange={e => setEntEmail(e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Estimated users</label>
                      <input style={inp} type="number" placeholder="25" min="1" required value={entUsers} onChange={e => setEntUsers(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Message</label>
                    <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }} placeholder="Tell us about your team and use case." required value={entMessage} onChange={e => setEntMessage(e.target.value)} />
                  </div>
                  <Button type="submit" size="lg" style={{ justifyContent: "center" }} disabled={entLoading}>
                    {entLoading ? "Sending…" : "Send →"}
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

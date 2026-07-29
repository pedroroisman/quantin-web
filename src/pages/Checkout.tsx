import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, QuantinLogo } from "../components/ui";
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";

type Billing = "monthly" | "annual";

const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

const INDIVIDUAL_FEATURES = [
  "Current 15-stock portfolio, updated every rebalance",
  "Email alerts when stocks enter or exit",
  "Full backtested history since 2018",
  "Live market regime indicator",
  "14-day free trial — no charge until day 15",
];

const B2B_FEATURES = [
  "Everything in Individual, for your whole team",
  "One invoice per billing period",
  "Centralized team access management",
  "Priority support",
];

const ENTERPRISE_FEATURES = [
  "Everything in B2B",
  "Unlimited seats",
  "Dedicated onboarding & training",
  "Custom billing & invoicing",
  "SLA & compliance documentation",
];

export function Checkout() {
  const navigate = useNavigate();
  const [billing, setBilling]       = useState<Billing>("monthly");
  const [seats, setSeats]           = useState(5);
  const [session, setSession]       = useState<{ email: string } | null>(null);

  // B2B
  const [b2bLoading, setB2bLoading]         = useState(false);
  const [b2bPayMethod, setB2bPayMethod]     = useState<"now" | "invoice" | null>(null);
  const [b2bInvoiceSent, setB2bInvoiceSent] = useState(false);

  // Enterprise form
  const [showEnt, setShowEnt]       = useState(false);
  const [entName, setEntName]       = useState("");
  const [entCompany, setEntCompany] = useState("");
  const [entEmail, setEntEmail]     = useState("");
  const [entUsers, setEntUsers]     = useState("");
  const [entMessage, setEntMessage] = useState("");
  const [entLoading, setEntLoading] = useState(false);
  const [entSent, setEntSent]       = useState(false);

  const [indLoading, setIndLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s?.user?.email) return;
      const { data } = await supabase
        .from("subscribers").select("id")
        .eq("email", s.user.email.trim().toLowerCase()).maybeSingle();
      if (data) { navigate("/portfolio"); return; }
      setSession({ email: s.user.email });
    });
  }, [navigate]);

  const requireAuth = () => {
    navigate("/signin?mode=signup");
  };

  const apiUrl = import.meta.env.VITE_API_URL || "";

  const handleIndividual = async () => {
    if (!session) { requireAuth(); return; }
    setIndLoading(true);
    try {
      track("checkout_started", { plan: "individual", billing, email: session.email });
      const res = await fetch(`${apiUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email, plan: "individual", billing }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setIndLoading(false);
    }
  };

  const handleB2B = async () => {
    if (!session) { requireAuth(); return; }
    setB2bLoading(true);
    try {
      track("checkout_started", { plan: "b2b", billing, seats, email: session.email });
      const res = await fetch(`${apiUrl}/api/create-b2b-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email, company: "", seats, billing }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setB2bLoading(false);
    }
  };

  const handleB2BInvoice = async () => {
    if (!session) { requireAuth(); return; }
    setB2bLoading(true);
    try {
      track("checkout_started", { plan: "b2b_invoice", billing, seats, email: session.email });
      const res = await fetch(`${apiUrl}/api/request-b2b-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.email, company: "", seats, billing }),
      });
      if (!res.ok) throw new Error(await res.text());
      setB2bInvoiceSent(true);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setEntLoading(false);
    }
  };

  const moPrice  = billing === "monthly" ? 25 : 20;
  const b2bPrice = billing === "monthly" ? 20 : 15;

  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    padding: "10px 12px", fontSize: 13,
    background: "var(--bg-primary)", color: "var(--text-primary)",
    outline: "none", fontFamily: outfit, fontWeight: 300,
  };

  const fieldLabel: React.CSSProperties = {
    display: "block", fontFamily: outfit, fontWeight: 400,
    fontSize: 12, color: "var(--text-secondary)", marginBottom: 5,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)" }}>
      <style>{`
        @media (max-width: 680px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

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
        {session
          ? <button onClick={() => navigate("/user")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", padding: "4px 8px", borderRadius: 6 }}>{session.email}</button>
          : <Button variant="secondary" size="sm" onClick={() => navigate("/signin")}>Sign in</Button>
        }
      </nav>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: playfair, fontWeight: 400, fontSize: 36, color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.2 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 15, color: "var(--text-tertiary)", marginBottom: "2rem" }}>
            Start free. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", background: "var(--bg-secondary)", border: "0.5px solid var(--border-subtle)", borderRadius: 100, padding: 3 }}>
            {(["monthly", "annual"] as Billing[]).map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: "7px 22px", borderRadius: 100, border: "none", cursor: "pointer",
                fontFamily: outfit, fontWeight: 300, fontSize: 13,
                background: billing === b ? "var(--bg-primary)" : "transparent",
                color: billing === b ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: billing === b ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}>
                {b === "monthly" ? "Monthly" : <span>Annual <span style={{ color: "#1D9E75", fontWeight: 400 }}>–20%</span></span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", alignItems: "start" }}>

          {/* ── Individual ── */}
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", overflow: "hidden",
          }}>
            <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
              <p style={{ fontFamily: outfit, fontWeight: 400, fontSize: 13, color: "var(--text-secondary)", marginBottom: "1.25rem" }}>Individual</p>
              <div style={{ marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 44, color: "var(--text-primary)", lineHeight: 1 }}>${moPrice}</span>
                <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 14, color: "var(--text-tertiary)", marginLeft: 5 }}>/mo</span>
              </div>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "1.5rem", minHeight: 18 }}>
                {billing === "annual" ? "Billed $240/yr — save $60" : "Billed monthly"}
              </p>
              <Button
                size="lg"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={indLoading}
                onClick={handleIndividual}
              >
                {indLoading ? "Processing…" : session ? "Start free trial →" : "Get started →"}
              </Button>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 8 }}>
                14-day free trial · no credit card until day 15
              </p>
            </div>
            <div style={{ borderTop: "0.5px solid var(--border-subtle)", padding: "1.5rem 1.75rem" }}>
              {INDIVIDUAL_FEATURES.map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 11, alignItems: "flex-start" }}>
                  <span style={{ color: "#1D9E75", fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── B2B ── */}
          <div style={{
            background: "var(--bg-primary)", border: "1.5px solid #1D9E75",
            borderRadius: "var(--radius-lg)", overflow: "hidden",
            boxShadow: "0 0 0 4px rgba(29,158,117,0.06)",
          }}>
            <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <p style={{ fontFamily: outfit, fontWeight: 400, fontSize: 13, color: "var(--text-secondary)" }}>B2B</p>
                <span style={{ fontFamily: outfit, fontWeight: 400, fontSize: 11, background: "#1D9E75", color: "#fff", borderRadius: 100, padding: "2px 10px" }}>
                  Most popular
                </span>
              </div>
              <div style={{ marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 44, color: "var(--text-primary)", lineHeight: 1 }}>${b2bPrice}</span>
                <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 14, color: "var(--text-tertiary)", marginLeft: 5 }}>/seat/mo</span>
              </div>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "1.5rem", minHeight: 18 }}>
                {billing === "annual" ? `Billed $${b2bPrice * 12}/seat/yr` : "Min 5 seats · invoice billing"}
              </p>

              {/* Seat selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                <label style={{ ...fieldLabel, margin: 0, whiteSpace: "nowrap" }}>Seats (min 5)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                  <button type="button" onClick={() => setSeats(s => Math.max(5, s - 1))} style={{ width: 30, height: 30, border: "0.5px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", cursor: "pointer", fontSize: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontFamily: outfit, fontWeight: 400, fontSize: 16, minWidth: 24, textAlign: "center" }}>{seats}</span>
                  <button type="button" onClick={() => setSeats(s => s + 1)} style={{ width: 30, height: 30, border: "0.5px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", cursor: "pointer", fontSize: 16, color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  <span style={{ fontFamily: outfit, fontWeight: 500, fontSize: 13, color: "var(--text-primary)" }}>${b2bPrice * seats}/mo</span>
                </div>
              </div>

              {/* Payment method selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
                {(["now", "invoice"] as const).map(method => {
                  const label = method === "now" ? "Pay now" : "Invoice me";
                  const active = b2bPayMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setB2bPayMethod(method)}
                      style={{
                        flex: 1, padding: "8px 0", cursor: "pointer",
                        fontFamily: outfit, fontWeight: active ? 500 : 300, fontSize: 12,
                        borderRadius: "var(--radius-md)",
                        border: active ? "1.5px solid #1D9E75" : "0.5px solid var(--border-default)",
                        background: active ? "rgba(29,158,117,0.1)" : "var(--bg-secondary)",
                        color: active ? "#1D9E75" : "var(--text-secondary)",
                        transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {b2bInvoiceSent ? (
                <div style={{ textAlign: "center", padding: "0.75rem 0 0.25rem" }}>
                  <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 18, color: "var(--text-primary)", marginBottom: 6 }}>Invoice on its way.</p>
                  <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>Check your inbox — payment due in 30 days.</p>
                </div>
              ) : (
                <>
                  <Button
                    size="lg"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={b2bLoading || b2bPayMethod === null}
                    onClick={b2bPayMethod === "invoice" ? handleB2BInvoice : handleB2B}
                  >
                    {b2bLoading
                      ? "Processing…"
                      : b2bPayMethod === "invoice"
                        ? "Request invoice →"
                        : "Get started →"}
                  </Button>
                  <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 8 }}>
                    {b2bPayMethod === "invoice"
                      ? "We'll email you a Stripe invoice · net 30"
                      : b2bPayMethod === "now"
                        ? "Secure checkout via Stripe"
                        : "Choose a payment method above"}
                  </p>
                </>
              )}
            </div>
            <div style={{ borderTop: "0.5px solid var(--border-subtle)", padding: "1.5rem 1.75rem" }}>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
                Everything in Individual, plus:
              </p>
              {B2B_FEATURES.map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 11, alignItems: "flex-start" }}>
                  <span style={{ color: "#1D9E75", fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Enterprise ── */}
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", overflow: "hidden",
          }}>
            <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
              <p style={{ fontFamily: outfit, fontWeight: 400, fontSize: 13, color: "var(--text-secondary)", marginBottom: "1.25rem" }}>Enterprise</p>
              <div style={{ marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: playfair, fontWeight: 400, fontSize: 44, color: "var(--text-primary)", lineHeight: 1 }}>Custom</span>
              </div>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "1.5rem", minHeight: 18 }}>
                Tailored to your organization
              </p>
              <Button
                variant="secondary"
                size="lg"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setShowEnt(v => !v)}
              >
                {showEnt ? "Close" : "Contact us →"}
              </Button>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 8 }}>
                We respond within one business day
              </p>
            </div>
            <div style={{ borderTop: "0.5px solid var(--border-subtle)", padding: "1.5rem 1.75rem" }}>
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
                Everything in B2B, plus:
              </p>
              {ENTERPRISE_FEATURES.map(f => (
                <div key={f} style={{ display: "flex", gap: 10, marginBottom: 11, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--text-tertiary)", fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise contact form */}
        {showEnt && (
          <div style={{
            marginTop: "1.5rem", background: "var(--bg-primary)",
            border: "0.5px solid var(--border-subtle)", borderRadius: "var(--radius-lg)",
            padding: "2rem", maxWidth: 520, marginLeft: "auto",
          }}>
            {entSent ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 22, color: "var(--text-primary)", marginBottom: 8 }}>Thanks — we'll be in touch.</p>
                <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>Usually within one business day.</p>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 20, color: "var(--text-primary)", marginBottom: "1.5rem" }}>Get in touch</p>
                <form onSubmit={handleEnterprise} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={fieldLabel}>Name</label>
                      <input style={inp} placeholder="Jane Smith" required value={entName} onChange={e => setEntName(e.target.value)} />
                    </div>
                    <div>
                      <label style={fieldLabel}>Company</label>
                      <input style={inp} placeholder="Acme Capital" required value={entCompany} onChange={e => setEntCompany(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={fieldLabel}>Email</label>
                      <input style={inp} type="email" placeholder="jane@acmecapital.com" required value={entEmail} onChange={e => setEntEmail(e.target.value)} />
                    </div>
                    <div>
                      <label style={fieldLabel}>Estimated users</label>
                      <input style={inp} type="number" placeholder="25" min="1" required value={entUsers} onChange={e => setEntUsers(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={fieldLabel}>Message</label>
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

        {/* Trust footer */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "3rem", flexWrap: "wrap" }}>
          {["Secured by Stripe", "Cancel anytime", "No hidden fees"].map(t => (
            <span key={t} style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              {t}
            </span>
          ))}
        </div>
        <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: "1rem", letterSpacing: "0.04em" }}>
          Quantin LLC · Incorporated in Delaware, USA
        </p>
      </main>
    </div>
  );
}

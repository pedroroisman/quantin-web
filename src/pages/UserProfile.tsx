import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { QuantinLogo } from "../components/ui";

const outfit   = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

interface SubData {
  active: boolean;
  created_at: string;
  stripe_subscription_id: string | null;
}

interface SeriesPoint { date: string; model: number; spy: number; }

interface PortfolioSummary {
  count: number;
  as_of: string;
  modelReturn: number;   // % since subscribed
  spyReturn: number;     // % since subscribed
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function sign(n: number) {
  return n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;
}

export function UserProfile() {
  const navigate = useNavigate();

  const [email, setEmail]           = useState("");
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);
  const [sub, setSub]               = useState<SubData | null>(null);
  const [subLoaded, setSubLoaded]   = useState(false);
  const [portfolio, setPortfolio]   = useState<PortfolioSummary | null>(null);
  const [canceling, setCanceling]   = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { navigate("/signin"); return; }

      const u = session.user;
      setEmail(u.email ?? "");
      setRegisteredAt(u.created_at ?? null);

      const { data } = await supabase
        .from("subscribers")
        .select("active, created_at, stripe_subscription_id")
        .eq("email", (u.email ?? "").trim().toLowerCase())
        .maybeSingle();

      setSub(data ?? null);
      setSubLoaded(true);

      if (data?.active) {
        const since = data.created_at.split("T")[0];
        const apiUrl = import.meta.env.VITE_API_URL || "";
        Promise.all([
          fetch(`${apiUrl}/api/portfolio_optimizer?since=${since}`).then(r => r.json()),
          fetch(`${apiUrl}/api/portfolio_optimizer/chart`).then(r => r.json()),
        ]).then(([portfolio, chart]) => {
          const series: SeriesPoint[] = chart?.series ?? [];
          if (!series.length) return;
          // Find the series point at or just after subscription date
          const subDate = since;
          const subIdx = series.findIndex(p => p.date >= subDate);
          const base = subIdx >= 0 ? series[subIdx] : series[0];
          const last = series[series.length - 1];
          const modelReturn = (last.model / base.model - 1) * 100;
          const spyReturn   = (last.spy   / base.spy   - 1) * 100;
          setPortfolio({
            count: portfolio?.portfolio?.length ?? 0,
            as_of: portfolio?.as_of ?? last.date,
            modelReturn,
            spyReturn,
          });
        }).catch(() => {});
      }
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const handleCancel = async () => {
    if (!sub?.stripe_subscription_id) return;
    setCanceling(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      await fetch(`${apiUrl}/api/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: sub.stripe_subscription_id }),
      });
      setCancelDone(true);
    } catch {
      // silent
    } finally {
      setCanceling(false);
    }
  };

  const initial = email.charAt(0).toUpperCase();

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
        {sub?.active && (
          <button onClick={() => navigate("/portfolio")} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            ← Portfolio
          </button>
        )}
      </nav>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "3.5rem 1.5rem 6rem" }}>

        {/* Avatar + identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--info-bg)", border: "1px solid var(--info-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: playfair, fontSize: 24, color: "var(--accent)", flexShrink: 0,
          }}>
            {initial || "?"}
          </div>
          <div>
            <p style={{ fontFamily: outfit, fontWeight: 400, fontSize: 15, color: "var(--text-primary)", marginBottom: 3 }}>{email}</p>
            {registeredAt && (
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
                Member since {fmt(registeredAt)}
              </p>
            )}
          </div>
        </div>

        {/* Subscription status */}
        {subLoaded && (
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", padding: "1.5rem", marginBottom: "1.25rem",
          }}>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem" }}>
              Subscription
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ fontFamily: outfit, fontWeight: 400, fontSize: 15, color: "var(--text-primary)", marginBottom: 3 }}>
                  {sub?.active ? "Active" : "No active subscription"}
                </p>
                {sub?.active && sub.created_at && (
                  <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
                    Subscribed since {fmt(sub.created_at)}
                  </p>
                )}
              </div>
              <span style={{
                fontFamily: outfit, fontWeight: 300, fontSize: 11,
                padding: "3px 10px", borderRadius: 100,
                background: sub?.active ? "var(--info-bg)" : "var(--bg-secondary)",
                border: `0.5px solid ${sub?.active ? "var(--info-border)" : "var(--border-default)"}`,
                color: sub?.active ? "var(--info-text)" : "var(--text-tertiary)",
              }}>
                {sub?.active ? "Active" : "Free"}
              </span>
            </div>

            {!sub?.active && (
              <button
                onClick={() => navigate("/subscribe")}
                style={{
                  marginTop: "1.25rem", width: "100%",
                  background: "var(--accent)", color: "#07160E",
                  border: "none", borderRadius: "var(--radius-md)", padding: "11px 0",
                  fontFamily: outfit, fontWeight: 400, fontSize: 14, cursor: "pointer",
                }}
              >
                View plans →
              </button>
            )}
          </div>
        )}

        {/* Portfolio performance (subscribers only) */}
        {sub?.active && (
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", padding: "1.5rem", marginBottom: "1.25rem",
          }}>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem" }}>
              Portfolio performance
            </p>

            {portfolio ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1rem" }}>
                  {[
                    { val: sign(portfolio.modelReturn), label: "Portfolio return", highlight: true },
                    { val: sign(portfolio.spyReturn),   label: "S&P 500 (same period)", highlight: false },
                  ].map(({ val, label, highlight }) => (
                    <div key={label}>
                      <p style={{ fontFamily: playfair, fontWeight: 400, fontSize: 28, color: highlight ? "var(--accent)" : "var(--text-secondary)", lineHeight: 1.1, marginBottom: 4 }}>{val}</p>
                      <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    </div>
                  ))}
                </div>
                {portfolio.modelReturn > portfolio.spyReturn && (
                  <div style={{ marginBottom: "1rem", padding: "8px 12px", background: "var(--info-bg)", border: "0.5px solid var(--info-border)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--info-text)" }}>
                      +{(portfolio.modelReturn - portfolio.spyReturn).toFixed(1)}pp outperformance vs S&P 500 since you subscribed
                    </span>
                  </div>
                )}
                <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
                    {portfolio.count} active positions
                  </span>
                  <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
                    As of {portfolio.as_of}
                  </span>
                </div>
              </>
            ) : (
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)" }}>Loading…</p>
            )}
          </div>
        )}

        {/* Account actions */}
        <div style={{
          background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", padding: "1.5rem", marginBottom: "1.25rem",
        }}>
          <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem" }}>
            Account
          </p>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", background: "transparent",
              border: "0.5px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "11px 0",
              fontFamily: outfit, fontWeight: 300, fontSize: 14, color: "var(--text-secondary)",
              cursor: "pointer", textAlign: "center",
            }}
          >
            Sign out
          </button>
        </div>

        {/* Cancel subscription (danger zone, subscribers only) */}
        {sub?.active && !cancelDone && (
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", padding: "1.5rem",
          }}>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--danger-text)", marginBottom: "1rem" }}>
              Danger zone
            </p>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-tertiary)", marginBottom: "1rem" }}>
              Canceling ends access at the current billing period end.
            </p>
            <button
              onClick={handleCancel}
              disabled={canceling}
              style={{
                background: "transparent", border: "0.5px solid var(--danger-border)",
                borderRadius: "var(--radius-md)", padding: "9px 16px",
                fontFamily: outfit, fontWeight: 300, fontSize: 13,
                color: "var(--danger-text)", cursor: canceling ? "not-allowed" : "pointer",
                opacity: canceling ? 0.6 : 1,
              }}
            >
              {canceling ? "Canceling…" : "Cancel subscription"}
            </button>
          </div>
        )}

        {cancelDone && (
          <div style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", padding: "1.5rem",
          }}>
            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "var(--text-secondary)" }}>
              Subscription canceled. You'll retain access until the end of your current billing period.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

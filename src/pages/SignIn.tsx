import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

export function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-tertiary)", display: "flex", flexDirection: "column" }}>
      <nav style={{
        height: 56, borderBottom: "0.5px solid var(--border-subtle)",
        display: "flex", alignItems: "center", padding: "0 2rem",
        background: "var(--bg-primary)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
        >
          <QuantinLogo iconSize={22} />
        </button>
      </nav>

      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "4rem 2rem 6rem", textAlign: "center",
      }}>
        {!sent ? (
          <>
            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#0F6E56", marginBottom: "0.75rem",
            }}>
              Subscriber access
            </p>

            <h1 style={{
              fontFamily: playfair, fontWeight: 400, fontSize: 38,
              color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.15,
            }}>
              Sign in
            </h1>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 15,
              color: "var(--text-tertiary)", marginBottom: "2.5rem",
            }}>
              We'll send a link to your inbox — no password needed.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", maxWidth: 360, textAlign: "left" }}
            >
              <label style={{
                display: "block", fontFamily: outfit, fontWeight: 300,
                fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#1D9E75", marginBottom: 8,
              }}>
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "0.5px solid var(--border-default)", borderRadius: 8,
                  padding: "12px 14px", fontSize: 15,
                  fontFamily: outfit, fontWeight: 300, color: "var(--text-primary)",
                  background: "var(--bg-primary)", outline: "none", marginBottom: 12,
                }}
              />
              {error && (
                <p style={{
                  fontFamily: outfit, fontWeight: 300, fontSize: 13,
                  color: "#a32d2d", marginBottom: 12,
                }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", background: "#0C447C", color: "#fff",
                  border: "none", borderRadius: 8, padding: "13px 0",
                  fontFamily: outfit, fontWeight: 300, fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Sending…" : "Send me a link →"}
              </button>
            </form>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 12,
              color: "var(--text-tertiary)", marginTop: "1.5rem",
            }}>
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/subscribe")}
                style={{ color: "#1D9E75", cursor: "pointer" }}
              >
                Subscribe — $25/mo
              </span>
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "1px solid #c0e0d4",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "2rem",
            }}>
              <div style={{ width: 14, height: 14, background: "#1D9E75", borderRadius: "50%" }} />
            </div>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#0F6E56", marginBottom: "0.75rem",
            }}>
              Link sent
            </p>

            <h1 style={{
              fontFamily: playfair, fontWeight: 400, fontSize: 38,
              color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.15,
            }}>
              Check your inbox.
            </h1>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 15,
              color: "var(--text-tertiary)", marginBottom: "2rem",
            }}>
              We sent a sign-in link to <strong style={{ fontWeight: 400, color: "var(--text-primary)" }}>{email}</strong>.
            </p>

            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>

            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: "1.5rem", background: "none", border: "none",
                fontFamily: outfit, fontWeight: 300, fontSize: 13,
                color: "var(--text-tertiary)", cursor: "pointer", textDecoration: "underline",
              }}
            >
              Use a different email
            </button>
          </>
        )}
      </main>
    </div>
  );
}

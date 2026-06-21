import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";

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
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <nav style={{
        height: 56, borderBottom: "0.5px solid #eee",
        display: "flex", alignItems: "center", padding: "0 2rem",
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
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#888780", marginBottom: "0.9rem",
            }}>
              Subscriber access
            </p>

            <h1 style={{
              fontFamily: outfit, fontWeight: 200, fontSize: 38,
              color: "#1e1e1c", marginBottom: "0.5rem",
              letterSpacing: "-0.025em", lineHeight: 1.1,
            }}>
              Sign in
            </h1>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 15,
              color: "#888780", marginBottom: "2.5rem",
            }}>
              We'll send a link to your inbox — no password needed.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ width: "100%", maxWidth: 360, textAlign: "left" }}
            >
              <label style={{
                display: "block", fontFamily: outfit, fontWeight: 300,
                fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                color: "#888780", marginBottom: 8,
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
                  border: "0.5px solid #d3d1c7", borderRadius: 8,
                  padding: "12px 14px", fontSize: 15,
                  fontFamily: outfit, fontWeight: 300, color: "#1e1e1c",
                  background: "#fff", outline: "none", marginBottom: 12,
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
              color: "#b4b2a9", marginTop: "1.5rem",
            }}>
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/subscribe")}
                style={{ color: "#185FA5", cursor: "pointer" }}
              >
                Subscribe — $25/mo
              </span>
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "1px solid #d4e8f5",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "2rem",
            }}>
              <div style={{ width: 14, height: 14, background: "#0C447C", borderRadius: "50%" }} />
            </div>

            <h1 style={{
              fontFamily: outfit, fontWeight: 200, fontSize: 38,
              color: "#1e1e1c", marginBottom: "0.5rem",
              letterSpacing: "-0.025em",
            }}>
              Check your inbox.
            </h1>

            <p style={{
              fontFamily: outfit, fontWeight: 300, fontSize: 15,
              color: "#888780", marginBottom: "2rem",
            }}>
              We sent a sign-in link to <strong style={{ fontWeight: 400, color: "#1e1e1c" }}>{email}</strong>.
            </p>

            <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "#b4b2a9" }}>
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>

            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: "1.5rem", background: "none", border: "none",
                fontFamily: outfit, fontWeight: 300, fontSize: 13,
                color: "#888780", cursor: "pointer", textDecoration: "underline",
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

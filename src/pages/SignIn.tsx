import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";
const playfair = "'Playfair Display', serif";

async function routeBySubscription(email: string, navigate: (path: string) => void) {
  const { data } = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  navigate(data ? "/portfolio" : "/subscribe");
}

export function SignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        await routeBySubscription(session.user.email, navigate);
      }
    });
  }, [navigate]);

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message === "User already registered"
          ? "This email already has an account. Sign in instead."
          : error.message);
        setLoading(false);
        return;
      }
      navigate("/subscribe");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Email or password incorrect.");
        setLoading(false);
        return;
      }
      await routeBySubscription(data.user.email!, navigate);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "0.5px solid var(--border-default)", borderRadius: 8,
    padding: "12px 14px", fontSize: 15,
    fontFamily: outfit, fontWeight: 300, color: "var(--text-primary)",
    background: "var(--bg-primary)", outline: "none", display: "block",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: outfit, fontWeight: 300,
    fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "#1D9E75", marginBottom: 6,
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
        <p style={{
          fontFamily: outfit, fontWeight: 300, fontSize: 11,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#0F6E56", marginBottom: "0.75rem",
        }}>
          {mode === "signup" ? "Create account" : "Subscriber access"}
        </p>

        <h1 style={{
          fontFamily: playfair, fontWeight: 400, fontSize: 36,
          color: "var(--text-primary)", marginBottom: "2rem", lineHeight: 1.15,
        }}>
          {mode === "signup" ? "Get started." : "Welcome back."}
        </h1>

        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Google */}
          <button
            onClick={handleGoogle}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "var(--bg-primary)", border: "0.5px solid var(--border-default)",
              borderRadius: 8, padding: "12px 0",
              fontFamily: outfit, fontWeight: 300, fontSize: 15, color: "var(--text-primary)",
              cursor: "pointer", marginBottom: 14,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.2-5.2l-6.1-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.6l6.1 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: "0.5px", background: "var(--border-subtle)" }} />
            <span style={{ fontFamily: outfit, fontWeight: 300, fontSize: 12, color: "var(--text-tertiary)" }}>or</span>
            <div style={{ flex: 1, height: "0.5px", background: "var(--border-subtle)" }} />
          </div>

          {/* Email + password */}
          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Choose a password" : "Your password"}
                minLength={mode === "signup" ? 8 : undefined}
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ fontFamily: outfit, fontWeight: 300, fontSize: 13, color: "#a32d2d", marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", background: "#0C447C", color: "#fff",
                border: "none", borderRadius: 8, padding: "13px 0",
                fontFamily: outfit, fontWeight: 300, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? (mode === "signup" ? "Creating account…" : "Signing in…")
                : (mode === "signup" ? "Create account →" : "Sign in →")}
            </button>
          </form>

          <p style={{
            fontFamily: outfit, fontWeight: 300, fontSize: 13,
            color: "var(--text-tertiary)", marginTop: "1.25rem", textAlign: "center",
          }}>
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <span onClick={() => { setMode("signin"); setError(""); }} style={{ color: "#1D9E75", cursor: "pointer" }}>
                  Sign in
                </span>
              </>
            ) : (
              <>Don't have an account?{" "}
                <span onClick={() => { setMode("signup"); setError(""); }} style={{ color: "#1D9E75", cursor: "pointer" }}>
                  Subscribe — $25/mo
                </span>
              </>
            )}
          </p>

        </div>
      </main>
    </div>
  );
}
